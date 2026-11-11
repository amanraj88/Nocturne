-- NOCTURNE forward security patch. Review the privilege inventory in
-- docs/database-permissions-proposal.sql before applying to the existing project.
-- This patch does not alter application data or the original migration.
BEGIN;

-- Reset only the eight application tables. Confirm no external consumers rely on
-- old grants before running this migration; the final grants below match this repo.
REVOKE ALL PRIVILEGES ON TABLE
  public.rooms,
  public.host_recovery_attempts,
  public.room_memberships,
  public.room_playback,
  public.tracks,
  public.track_votes,
  public.chat_messages,
  public.audio_upload_intents
FROM PUBLIC, anon, authenticated, service_role;

-- Room state is read with the visitor's anon/authenticated role and existing RLS.
GRANT SELECT (
  id, slug, title, vibe_tag, description, artwork_id, ambient_color, accent_color,
  mode, is_private, host_id, host_name, created_at
) ON TABLE public.rooms TO anon, authenticated;
GRANT SELECT ON TABLE public.tracks, public.room_playback, public.chat_messages
  TO anon, authenticated;

-- Browser writes only; existing RLS policies continue to authorize each row.
GRANT INSERT (
  id, room_id, source_type, youtube_id, title, artist, album_art, artwork_id,
  duration_seconds, storage_path, file_name, added_by_id, added_by_name, position
) ON TABLE public.tracks TO authenticated;
GRANT DELETE ON TABLE public.tracks TO authenticated;
GRANT INSERT (track_id, room_id, user_id, vote_type)
  ON TABLE public.track_votes TO authenticated;
GRANT DELETE ON TABLE public.track_votes TO authenticated;
GRANT INSERT (id, room_id, user_id, user_name, text)
  ON TABLE public.chat_messages TO authenticated;

-- Server-only media routes use service_role and perform their own authorization.
-- Column grants match the current PostgREST projections and filters.
GRANT SELECT (
  id, slug, title, vibe_tag, description, artwork_id, ambient_color, accent_color,
  is_private, host_id, host_name, created_at
) ON TABLE public.rooms TO service_role;
GRANT SELECT (id, room_id, user_id, is_active)
  ON TABLE public.room_memberships TO service_role;
GRANT SELECT (id, room_id, source_type, added_by_id, storage_path)
  ON TABLE public.tracks TO service_role;
GRANT INSERT (
  id, room_id, source_type, title, artist, album_art, artwork_id,
  duration_seconds, storage_path, file_name, added_by_id, added_by_name, position
) ON TABLE public.tracks TO service_role;
GRANT DELETE ON TABLE public.tracks TO service_role;
GRANT SELECT (
  id, room_id, user_id, storage_path, file_name, file_size, title, artist,
  duration_seconds, status, confirming_at, claim_token, cleanup_failed, expires_at
) ON TABLE public.audio_upload_intents TO service_role;
GRANT INSERT (
  room_id, user_id, storage_path, file_name, file_size, title, artist,
  duration_seconds, status
) ON TABLE public.audio_upload_intents TO service_role;
GRANT UPDATE (status, confirming_at, claim_token, cleanup_failed)
  ON TABLE public.audio_upload_intents TO service_role;

-- Keep private-room access helper callable by roles that evaluate RLS policies.
ALTER FUNCTION public.has_room_access(TEXT, UUID) SECURITY DEFINER;
ALTER FUNCTION public.has_room_access(TEXT, UUID)
  SET search_path = pg_catalog, public, auth, pg_temp;
ALTER FUNCTION public.has_room_access(TEXT, UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.has_room_access(TEXT, UUID)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_room_access(TEXT, UUID)
  TO anon, authenticated;

-- Realtime RLS policies need this parser; it only extracts a room ID from text.
ALTER FUNCTION public.extract_room_id_from_topic(TEXT) SECURITY INVOKER;
ALTER FUNCTION public.extract_room_id_from_topic(TEXT)
  SET search_path = pg_catalog, public, pg_temp;
REVOKE ALL ON FUNCTION public.extract_room_id_from_topic(TEXT)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.extract_room_id_from_topic(TEXT)
  TO anon, authenticated;

-- RPCs remain the only client path for room creation, playback, and host recovery.
ALTER FUNCTION public.create_room_with_host(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT
) SECURITY DEFINER;
ALTER FUNCTION public.create_room_with_host(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT
) SET search_path = pg_catalog, public, extensions, auth, pg_temp;
ALTER FUNCTION public.create_room_with_host(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT
) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.create_room_with_host(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT
) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_room_with_host(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT
) TO authenticated;

ALTER FUNCTION public.sync_room_playback(TEXT, TEXT, BOOLEAN, DOUBLE PRECISION, TEXT, BIGINT)
  SECURITY DEFINER;
ALTER FUNCTION public.sync_room_playback(TEXT, TEXT, BOOLEAN, DOUBLE PRECISION, TEXT, BIGINT)
  SET search_path = pg_catalog, public, extensions, auth, pg_temp;
ALTER FUNCTION public.sync_room_playback(TEXT, TEXT, BOOLEAN, DOUBLE PRECISION, TEXT, BIGINT)
  OWNER TO postgres;
REVOKE ALL ON FUNCTION public.sync_room_playback(TEXT, TEXT, BOOLEAN, DOUBLE PRECISION, TEXT, BIGINT)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_room_playback(TEXT, TEXT, BOOLEAN, DOUBLE PRECISION, TEXT, BIGINT)
  TO authenticated;

-- Reject playback references outside this room before updating authoritative state.
CREATE OR REPLACE FUNCTION public.sync_room_playback(
  p_room_id TEXT,
  p_track_id TEXT,
  p_is_playing BOOLEAN,
  p_progress_seconds DOUBLE PRECISION,
  p_source_type TEXT,
  p_expected_revision BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_room public.rooms%ROWTYPE;
  v_playback public.room_playback%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF NOT public.has_room_access(p_room_id, v_user_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF v_room.mode = 'host-curated' AND v_room.host_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Only the room host can control playback in curated mode';
  END IF;
  IF p_track_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.tracks WHERE id = p_track_id AND room_id = p_room_id
  ) THEN
    RAISE EXCEPTION 'Track does not belong to this room';
  END IF;
  IF p_progress_seconds IS NOT NULL AND
     (p_progress_seconds < 0 OR p_progress_seconds > 86400) THEN
    RAISE EXCEPTION 'Invalid playback position';
  END IF;
  IF p_source_type IS NOT NULL AND
     p_source_type NOT IN ('youtube', 'shared-audio', 'local', 'fixture', 'specimen') THEN
    RAISE EXCEPTION 'Invalid playback source';
  END IF;

  SELECT * INTO v_playback
  FROM public.room_playback
  WHERE room_id = p_room_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room playback state not found';
  END IF;

  IF p_expected_revision IS NOT NULL AND v_playback.revision <> p_expected_revision THEN
    RETURN jsonb_build_object(
      'conflict', true,
      'currentRevision', v_playback.revision,
      'playback', to_jsonb(v_playback)
    );
  END IF;

  UPDATE public.room_playback
  SET current_track_id = COALESCE(p_track_id, current_track_id),
      is_playing = p_is_playing,
      progress_seconds = GREATEST(0, COALESCE(p_progress_seconds, 0)),
      source_type = COALESCE(p_source_type, source_type),
      revision = v_playback.revision + 1,
      updated_by = v_user_id,
      updated_at = now()
  WHERE room_id = p_room_id
  RETURNING * INTO v_playback;

  RETURN jsonb_build_object(
    'conflict', false,
    'currentRevision', v_playback.revision,
    'playback', to_jsonb(v_playback)
  );
END;
$$;
ALTER FUNCTION public.sync_room_playback(TEXT, TEXT, BOOLEAN, DOUBLE PRECISION, TEXT, BIGINT)
  SECURITY DEFINER;
ALTER FUNCTION public.sync_room_playback(TEXT, TEXT, BOOLEAN, DOUBLE PRECISION, TEXT, BIGINT)
  SET search_path = pg_catalog, public, extensions, auth, pg_temp;
ALTER FUNCTION public.sync_room_playback(TEXT, TEXT, BOOLEAN, DOUBLE PRECISION, TEXT, BIGINT)
  OWNER TO postgres;
REVOKE ALL ON FUNCTION public.sync_room_playback(TEXT, TEXT, BOOLEAN, DOUBLE PRECISION, TEXT, BIGINT)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_room_playback(TEXT, TEXT, BOOLEAN, DOUBLE PRECISION, TEXT, BIGINT)
  TO authenticated;

-- Serialize recovery attempts for one room before checking the five-attempt limit.
CREATE OR REPLACE FUNCTION public.reclaim_room_host(
  p_room_id TEXT,
  p_recovery_key TEXT,
  p_new_recovery_key_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_room public.rooms%ROWTYPE;
  v_hash TEXT;
  v_failed_attempts INT;
BEGIN
  IF v_user_id IS NULL OR p_recovery_key IS NULL OR p_new_recovery_key_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid recovery parameters');
  END IF;
  IF char_length(p_new_recovery_key_hash) <> 64 OR p_new_recovery_key_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid replacement recovery hash');
  END IF;

  -- Serialize per-user recovery checks across different rooms as well as the
  -- room-row lock below; otherwise parallel attempts could exceed the limit.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::TEXT, 1));

  SELECT * INTO v_room
  FROM public.rooms
  WHERE id = p_room_id
  FOR UPDATE;
  IF NOT FOUND OR v_room.host_key_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room not found or no recovery key registered');
  END IF;

  SELECT COUNT(*) INTO v_failed_attempts
  FROM public.host_recovery_attempts
  WHERE (room_id = p_room_id OR attempt_user_id = v_user_id)
    AND is_successful = false
    AND attempt_at > (now() - interval '15 minutes');
  IF v_failed_attempts >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Too many failed recovery attempts. Locked for 15 minutes.');
  END IF;

  v_hash := encode(extensions.digest(p_recovery_key, 'sha256'), 'hex');
  IF v_hash <> v_room.host_key_hash THEN
    INSERT INTO public.host_recovery_attempts (room_id, attempt_user_id, is_successful)
    VALUES (p_room_id, v_user_id, false);
    RETURN jsonb_build_object('success', false, 'error', 'Incorrect recovery key');
  END IF;

  INSERT INTO public.host_recovery_attempts (room_id, attempt_user_id, is_successful)
  VALUES (p_room_id, v_user_id, true);

  UPDATE public.rooms
  SET host_id = v_user_id,
      host_key_hash = p_new_recovery_key_hash,
      updated_at = now()
  WHERE id = p_room_id;

  INSERT INTO public.room_memberships (room_id, user_id, display_name, role, is_active)
  VALUES (p_room_id, v_user_id, 'Host Curator', 'host', true)
  ON CONFLICT (room_id, user_id)
  DO UPDATE SET role = 'host', is_active = true;

  RETURN jsonb_build_object('success', true);
END;
$$;
ALTER FUNCTION public.reclaim_room_host(TEXT, TEXT, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.reclaim_room_host(TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reclaim_room_host(TEXT, TEXT, TEXT)
  TO authenticated;

-- Trigger-only functions receive elevated access only for their bounded task.
ALTER FUNCTION public.enforce_queue_limits() SECURITY DEFINER;
ALTER FUNCTION public.enforce_queue_limits()
  SET search_path = pg_catalog, public, auth, pg_temp;
ALTER FUNCTION public.enforce_queue_limits() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.enforce_queue_limits()
  FROM PUBLIC, anon, authenticated, service_role;

ALTER FUNCTION public.update_track_vote_tallies() SECURITY DEFINER;
ALTER FUNCTION public.update_track_vote_tallies()
  SET search_path = pg_catalog, public, auth, pg_temp;
ALTER FUNCTION public.update_track_vote_tallies() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.update_track_vote_tallies()
  FROM PUBLIC, anon, authenticated, service_role;

ALTER FUNCTION public.guard_chat_metadata() SECURITY DEFINER;
ALTER FUNCTION public.guard_chat_metadata()
  SET search_path = pg_catalog, public, auth, pg_temp;
ALTER FUNCTION public.guard_chat_metadata() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.guard_chat_metadata()
  FROM PUBLIC, anon, authenticated, service_role;

-- Keep membership guard invoker-secure and prevent self-reactivation.
CREATE OR REPLACE FUNCTION public.guard_membership_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Membership role is server-controlled and cannot be edited directly';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.room_id IS DISTINCT FROM OLD.room_id THEN
    RAISE EXCEPTION 'Membership user or room cannot be modified';
  END IF;
  -- Block a user from directly reactivating their own revoked membership.
  -- SECURITY DEFINER recovery RPCs run with current_user=postgres and may
  -- legitimately restore the recovering host's membership.
  IF OLD.is_active = false AND NEW.is_active = true
     AND auth.uid() = OLD.user_id
     AND current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'A revoked membership cannot be reactivated by its owner';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_membership_fields()
  FROM PUBLIC, anon, authenticated, service_role;

-- A former private-room member cannot delete their own queue track or vote.
DROP POLICY IF EXISTS "Track adder or host can delete tracks" ON public.tracks;
CREATE POLICY "Track adder or host can delete tracks"
ON public.tracks FOR DELETE
USING (
  public.has_room_access(room_id, auth.uid())
  AND (
    added_by_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.rooms
      WHERE id = room_id AND host_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can retract their own vote" ON public.track_votes;
CREATE POLICY "Users can retract their own vote"
ON public.track_votes FOR DELETE
USING (
  user_id = auth.uid()
  AND public.has_room_access(room_id, auth.uid())
);

-- Storage's direct DELETE policy must enforce current room access too; otherwise
-- a revoked uploader could bypass the API route and delete the object directly.
DROP POLICY IF EXISTS "Track uploader or room host can delete audio objects" ON storage.objects;
CREATE POLICY "Track uploader or room host can delete audio objects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'nocturne-audio'
  AND auth.uid() IS NOT NULL
  AND name NOT LIKE '%..%'
  AND name ~ '^[a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+$'
  AND public.has_room_access(split_part(name, '/', 1), auth.uid())
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = split_part(name, '/', 1) AND r.host_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.storage_path = name AND t.added_by_id = auth.uid()
    )
  )
);

-- A broadcast playback event is accepted only if it matches the latest row
-- committed by the sender through sync_room_playback().
DROP POLICY IF EXISTS "Only authorized room members can broadcast to room channel" ON realtime.messages;
CREATE POLICY "Only authorized room members can broadcast to room channel"
ON realtime.messages FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.has_room_access(
    public.extract_room_id_from_topic(realtime.topic()), auth.uid()
  )
  AND (payload->>'senderId') IS NOT NULL
  AND (payload->>'senderId') <> ''
  AND (payload->>'senderId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND (payload->>'senderId') = auth.uid()::text
  AND (
    NOT ((payload->>'type') IN ('PLAY', 'PAUSE', 'SEEK', 'SELECT_TRACK'))
    OR CASE
      WHEN (payload->>'revision') ~ '^[0-9]+$'
       AND (payload->>'progressSeconds') ~ '^[0-9]+([.][0-9]+)?$'
       AND (payload->>'isPlaying') IN ('true', 'false')
      THEN EXISTS (
        SELECT 1
        FROM public.room_playback p
        WHERE p.room_id = public.extract_room_id_from_topic(realtime.topic())
          AND p.updated_by = auth.uid()
          AND p.revision::text = payload->>'revision'
          AND p.current_track_id IS NOT DISTINCT FROM payload->>'trackId'
          AND p.progress_seconds = (payload->>'progressSeconds')::DOUBLE PRECISION
          AND p.is_playing = (payload->>'isPlaying')::BOOLEAN
      )
      ELSE false
    END
  )
  AND NOT (
    (payload->>'type') IN ('PLAY', 'PAUSE', 'SEEK', 'SELECT_TRACK')
    AND EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = public.extract_room_id_from_topic(realtime.topic())
        AND r.mode = 'host-curated'
        AND r.host_id IS DISTINCT FROM auth.uid()
    )
  )
);

COMMIT;

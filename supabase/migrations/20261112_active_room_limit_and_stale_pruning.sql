-- Active room limit enforcement and user-scoped stale room pruning
-- Prunes abandoned rooms (no active participants in 2 hours AND playback not active/updated in 2 hours)
-- Enforces 5 active rooms maximum per anonymous host

CREATE OR REPLACE FUNCTION public.create_room_with_host(
  p_slug text,
  p_title text,
  p_vibe_tag text,
  p_description text,
  p_artwork_id text,
  p_mode text DEFAULT 'collaborative',
  p_is_private boolean DEFAULT false,
  p_host_name text DEFAULT 'Guest Curator',
  p_recovery_key_hash text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_room_id TEXT := 'room-' || p_slug;
  v_room public.rooms%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create a lounge';
  END IF;

  -- Prune abandoned/stale rooms owned by this user
  -- (no active participants seen in the last 2 hours AND playback not active/updated in 2 hours)
  DELETE FROM public.rooms
  WHERE host_id = v_user_id
    AND is_featured = false
    AND id NOT IN (
      SELECT m.room_id FROM public.room_memberships m
      WHERE m.is_active = true AND m.last_seen > NOW() - INTERVAL '2 hours'
    )
    AND id NOT IN (
      SELECT p.room_id FROM public.room_playback p
      WHERE p.is_playing = true AND p.updated_at > NOW() - INTERVAL '2 hours'
    );

  -- Trusted Server Abuse Prevention: Enforce 5-room maximum of actively hosted lounges per anonymous session
  IF (SELECT COUNT(*) FROM public.rooms WHERE host_id = v_user_id AND is_featured = false) >= 5 THEN
    RAISE EXCEPTION 'Room creation limit reached: you already have 5 active lounges. Please end one before creating a new one.';
  END IF;

  INSERT INTO public.rooms (
    id, slug, title, vibe_tag, description, artwork_id,
    mode, is_private, host_id, host_name, host_key_hash
  )
  VALUES (
    v_room_id, p_slug, p_title, p_vibe_tag, p_description, p_artwork_id,
    COALESCE(p_mode, 'collaborative'), COALESCE(p_is_private, false), v_user_id, p_host_name, p_recovery_key_hash
  )
  RETURNING * INTO v_room;

  INSERT INTO public.room_memberships (
    room_id, user_id, display_name, role, is_active, last_seen
  )
  VALUES (
    v_room_id, v_user_id, p_host_name, 'host', true, NOW()
  );

  INSERT INTO public.room_playback (
    room_id, current_track_id, is_playing, progress_seconds, source_type, revision
  )
  VALUES (
    v_room_id, NULL, false, 0, 'specimen', 1
  );

  INSERT INTO public.chat_messages (
    id, room_id, user_id, user_name, user_role, text, is_system
  )
  VALUES (
    'msg-' || gen_random_uuid(), v_room_id, v_user_id, 'NOCTURNE', 'host',
    'Lounge "' || p_title || '" opened. Share the URL to invite listeners.', true
  );

  RETURN to_jsonb(v_room);
END;
$$;

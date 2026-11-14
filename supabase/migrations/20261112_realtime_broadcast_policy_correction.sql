-- Use auth.uid() as the authoritative sender identity. A payload senderId is
-- client-controlled metadata and is not a dependable Realtime authorization claim.
-- Keep database-backed playback and host-only room-end checks.
BEGIN;

DROP POLICY IF EXISTS "Only authorized room members can broadcast to room channel"
  ON realtime.messages;
CREATE POLICY "Only authorized room members can broadcast to room channel"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.has_room_access(
    public.extract_room_id_from_topic(realtime.topic()), auth.uid()
  )
  AND (
    extension = 'presence'
    OR (
      extension = 'broadcast'
      AND (
        COALESCE(event, '') <> 'playback'
        OR COALESCE(payload->>'type', '') NOT IN ('PLAY', 'PAUSE', 'SEEK', 'SELECT_TRACK')
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
              AND p.current_track_id::text IS NOT DISTINCT FROM payload->>'trackId'
              AND p.progress_seconds = (payload->>'progressSeconds')::DOUBLE PRECISION
              AND p.is_playing = (payload->>'isPlaying')::BOOLEAN
          )
          ELSE false
        END
      )
      AND NOT (
        COALESCE(event, '') = 'playback'
        AND COALESCE(payload->>'type', '') IN ('PLAY', 'PAUSE', 'SEEK', 'SELECT_TRACK')
        AND EXISTS (
          SELECT 1 FROM public.rooms r
          WHERE r.id = public.extract_room_id_from_topic(realtime.topic())
            AND r.mode = 'host-curated'
            AND r.host_id IS DISTINCT FROM auth.uid()
        )
      )
      AND NOT (
        COALESCE(event, '') = 'room_ended'
        AND EXISTS (
          SELECT 1 FROM public.rooms r
          WHERE r.id = public.extract_room_id_from_topic(realtime.topic())
            AND r.host_id IS DISTINCT FROM auth.uid()
        )
      )
    )
  )
);

COMMIT;

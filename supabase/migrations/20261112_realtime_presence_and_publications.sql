-- Realtime Presence and Broadcast authorization for room channels.
-- Presence packets use extension='presence' and do not contain an application senderId.
-- Keep sender identity validation for broadcast packets only.
BEGIN;

-- Ensure room_playback has host_id column synchronized with rooms.host_id
ALTER TABLE public.room_playback ADD COLUMN IF NOT EXISTS host_id UUID;
UPDATE public.room_playback rp SET host_id = r.host_id FROM public.rooms r WHERE r.id = rp.room_id;

CREATE OR REPLACE FUNCTION public.sync_room_playback_host_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.host_id IS NULL THEN
    SELECT host_id INTO NEW.host_id FROM public.rooms WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_room_playback_host_id ON public.room_playback;
CREATE TRIGGER trg_sync_room_playback_host_id
BEFORE INSERT OR UPDATE OF room_id ON public.room_playback
FOR EACH ROW EXECUTE FUNCTION public.sync_room_playback_host_id();

CREATE OR REPLACE FUNCTION public.sync_rooms_host_to_playback()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.room_playback SET host_id = NEW.host_id WHERE room_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_rooms_host_to_playback ON public.rooms;
CREATE TRIGGER trg_sync_rooms_host_to_playback
AFTER UPDATE OF host_id ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.sync_rooms_host_to_playback();

DROP POLICY IF EXISTS "Only authorized room members can subscribe to room channel" ON realtime.messages;
CREATE POLICY "Only authorized room members can subscribe to room channel"
ON realtime.messages FOR SELECT TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND extension IN ('presence', 'broadcast')
  AND public.has_room_access(
    public.extract_room_id_from_topic(realtime.topic()), auth.uid()
  )
);

DROP POLICY IF EXISTS "Only authorized room members can broadcast to room channel" ON realtime.messages;
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
      AND (payload->>'senderId') IS NOT NULL
      AND (payload->>'senderId') = auth.uid()::text
      AND (
        (payload->>'type') IS NULL
        OR (payload->>'type') NOT IN ('SYNC_PLAYBACK', 'PLAYBACK_CONTROL')
        OR EXISTS (
          SELECT 1
          FROM public.room_playback rp
          WHERE rp.room_id = public.extract_room_id_from_topic(realtime.topic())
            AND rp.host_id = auth.uid()
        )
      )
    )
  )
);

-- Ensure public.chat_messages and public.tracks are in supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tracks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tracks;
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- NOCTURNE — Supabase Database Migration
-- Version: 20261111_init.sql
-- Description: Core schema, RPC functions, triggers, RLS policies, and catalog seed.
-- NOTE: For review only; do not execute against a live database without approval.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. SCHEMA HARDENING & EXTENSIONS
-- -----------------------------------------------------------------------------

-- Explicitly revoke CREATE on public and extensions from all roles
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM anon, authenticated, PUBLIC;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Enable required cryptographic and UUID extensions in schema 'extensions'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
REVOKE ALL ON SCHEMA extensions FROM PUBLIC;
REVOKE CREATE ON SCHEMA extensions FROM anon, authenticated, PUBLIC;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 1. TABLES
-- -----------------------------------------------------------------------------

-- 1.1 ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 60),
  vibe_tag TEXT NOT NULL DEFAULT 'Ambient & Modular' CHECK (char_length(vibe_tag) <= 80),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  artwork_id TEXT NOT NULL DEFAULT 'noc-01' CHECK (artwork_id IN ('noc-01', 'noc-02', 'noc-03')),
  ambient_color TEXT NOT NULL DEFAULT '#A0B7A8',
  accent_color TEXT NOT NULL DEFAULT '#A0B7A8',
  mode TEXT NOT NULL DEFAULT 'collaborative' CHECK (mode IN ('collaborative', 'host-curated')),
  is_private BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL CHECK (char_length(trim(host_name)) BETWEEN 1 AND 60),
  host_key_hash TEXT, -- SHA-256 hash of recovery key (never stored in plaintext)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_room_host CHECK (is_featured = true OR host_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_rooms_slug ON public.rooms(slug);
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON public.rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON public.rooms(created_at DESC);

-- 1.2 HOST RECOVERY ATTEMPTS TABLE (Rate-limiting host recovery)
CREATE TABLE IF NOT EXISTS public.host_recovery_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  attempt_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_successful BOOLEAN NOT NULL DEFAULT false,
  attempt_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recovery_room_time ON public.host_recovery_attempts(room_id, attempt_at DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_user_time ON public.host_recovery_attempts(attempt_user_id, attempt_at DESC);

-- 1.3 ROOM MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.room_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(trim(display_name)) BETWEEN 1 AND 60),
  role TEXT NOT NULL DEFAULT 'listener' CHECK (role IN ('host', 'listener')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_room_user_membership UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_room ON public.room_memberships(room_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.room_memberships(user_id);

-- 1.4 ROOM PLAYBACK STATE TABLE (Single row per room)
CREATE TABLE IF NOT EXISTS public.room_playback (
  room_id TEXT PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
  current_track_id TEXT,
  is_playing BOOLEAN NOT NULL DEFAULT false,
  progress_seconds DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (progress_seconds >= 0),
  source_type TEXT NOT NULL DEFAULT 'specimen' CHECK (source_type IN ('youtube', 'shared-audio', 'local', 'fixture', 'specimen')),
  revision BIGINT NOT NULL DEFAULT 1,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.5 TRACKS TABLE (Queue)
CREATE TABLE IF NOT EXISTS public.tracks (
  id TEXT NOT NULL,
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'youtube' CHECK (source_type IN ('youtube', 'shared-audio', 'specimen')),
  youtube_id TEXT,
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 120),
  artist TEXT NOT NULL CHECK (char_length(trim(artist)) BETWEEN 1 AND 120),
  album_art TEXT NOT NULL DEFAULT '/artwork/noc-01.svg',
  artwork_id TEXT NOT NULL DEFAULT 'noc-01' CHECK (artwork_id IN ('noc-01', 'noc-02', 'noc-03')),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0 AND duration_seconds <= 86400),
  audio_url TEXT,
  storage_path TEXT,
  file_name TEXT,
  -- NOTE: Intentionally NO CASCADE on auth.users(id). Preserves room queue integrity and prevents storage file orphaning on user deletion.
  added_by_id UUID NOT NULL REFERENCES auth.users(id),
  added_by_name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  upvotes INTEGER NOT NULL DEFAULT 0 CHECK (upvotes >= 0),
  skip_votes INTEGER NOT NULL DEFAULT 0 CHECK (skip_votes >= 0),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT uq_tracks_id_room UNIQUE (id, room_id),
  CONSTRAINT check_track_storage_path_room CHECK (storage_path IS NULL OR storage_path LIKE (room_id || '/%'))
);

CREATE INDEX IF NOT EXISTS idx_tracks_room_position ON public.tracks(room_id, position ASC);

-- 1.6 TRACK VOTES TABLE (Cross-room vote prevention via composite foreign key)
CREATE TABLE IF NOT EXISTS public.track_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'skip')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (track_id, room_id) REFERENCES public.tracks(id, room_id) ON DELETE CASCADE,
  CONSTRAINT unique_user_track_vote UNIQUE (track_id, user_id, vote_type)
);

CREATE INDEX IF NOT EXISTS idx_votes_track ON public.track_votes(track_id);
CREATE INDEX IF NOT EXISTS idx_votes_room_user ON public.track_votes(room_id, user_id);

-- 1.7 CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY DEFAULT ('msg-' || gen_random_uuid()),
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL CHECK (char_length(trim(user_name)) BETWEEN 1 AND 60),
  user_role TEXT NOT NULL DEFAULT 'listener' CHECK (user_role IN ('host', 'listener')),
  text TEXT NOT NULL CHECK (char_length(trim(text)) BETWEEN 1 AND 500),
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_room_time ON public.chat_messages(room_id, created_at DESC);

-- 1.8 AUDIO UPLOAD INTENTS TABLE (Direct-to-Supabase Storage Presigned Uploads)
CREATE TABLE IF NOT EXISTS public.audio_upload_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 26214400),
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 120),
  artist TEXT NOT NULL CHECK (char_length(trim(artist)) BETWEEN 1 AND 120),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0 AND duration_seconds <= 86400),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'confirmed', 'cancelled')),
  confirming_at TIMESTAMPTZ,
  claim_token UUID,
  cleanup_failed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  CONSTRAINT check_intent_storage_path_room CHECK (storage_path LIKE (room_id || '/%'))
);

CREATE INDEX IF NOT EXISTS idx_upload_intents_room ON public.audio_upload_intents(room_id);
CREATE INDEX IF NOT EXISTS idx_upload_intents_user ON public.audio_upload_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_intents_status ON public.audio_upload_intents(status) WHERE status IN ('pending', 'confirming');
CREATE INDEX IF NOT EXISTS idx_upload_intents_cleanup ON public.audio_upload_intents(expires_at, status) WHERE status IN ('pending', 'confirming', 'cancelled') OR cleanup_failed = true;

-- -----------------------------------------------------------------------------
-- 2. ACCESS HELPER & INTEGRITY FUNCTIONS
-- -----------------------------------------------------------------------------

-- Uniform Room Access Verification (Public vs Authorized Private)
CREATE OR REPLACE FUNCTION public.has_room_access(p_room_id TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = p_room_id
      AND (
        r.is_private = false
        OR (p_user_id IS NOT NULL AND (
          r.host_id = p_user_id
          OR EXISTS (
            SELECT 1 FROM public.room_memberships m
            WHERE m.room_id = p_room_id AND m.user_id = p_user_id AND m.is_active = true
          )
        ))
      )
  );
END;
$$;

-- Realtime Topic Room ID Extractor
CREATE OR REPLACE FUNCTION public.extract_room_id_from_topic(p_topic TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_match TEXT[];
BEGIN
  v_match := regexp_matches(p_topic, '^nocturne:room:([a-zA-Z0-9_-]+)$');
  IF array_length(v_match, 1) >= 1 THEN
    RETURN v_match[1];
  END IF;
  RETURN NULL;
END;
$$;

-- Guard Membership Fields
CREATE OR REPLACE FUNCTION public.guard_membership_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Membership role is server-controlled and cannot be edited directly';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.room_id IS DISTINCT FROM OLD.room_id THEN
    RAISE EXCEPTION 'Membership user or room cannot be modified';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_memberships ON public.room_memberships;
CREATE TRIGGER trg_guard_memberships
BEFORE UPDATE ON public.room_memberships
FOR EACH ROW EXECUTE FUNCTION public.guard_membership_fields();

-- Chat Metadata Guard
CREATE OR REPLACE FUNCTION public.guard_chat_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.room_memberships
  WHERE room_id = NEW.room_id AND user_id = auth.uid() AND is_active = true;
  NEW.user_role := COALESCE(v_role, 'listener');
  NEW.is_system := false; -- Disallow forged system messages
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_chat ON public.chat_messages;
CREATE TRIGGER trg_guard_chat
BEFORE INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.guard_chat_metadata();

-- Concurrency-Safe Queue Limit Enforcement
CREATE OR REPLACE FUNCTION public.enforce_queue_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total INT;
  v_shared INT;
BEGIN
  PERFORM 1 FROM public.rooms WHERE id = NEW.room_id FOR UPDATE;
  SELECT COUNT(*) INTO v_total FROM public.tracks WHERE room_id = NEW.room_id;
  IF v_total >= 50 THEN
    RAISE EXCEPTION 'Room queue capacity reached (maximum 50 tracks)';
  END IF;
  IF NEW.source_type = 'shared-audio' THEN
    SELECT COUNT(*) INTO v_shared FROM public.tracks WHERE room_id = NEW.room_id AND source_type = 'shared-audio';
    IF v_shared >= 20 THEN
      RAISE EXCEPTION 'Room shared audio capacity reached (maximum 20 files)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_queue_limits ON public.tracks;
CREATE TRIGGER trg_enforce_queue_limits
BEFORE INSERT ON public.tracks
FOR EACH ROW EXECUTE FUNCTION public.enforce_queue_limits();

-- Track Vote Count Synchronization
CREATE OR REPLACE FUNCTION public.update_track_vote_tallies()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  target_track_id TEXT := COALESCE(NEW.track_id, OLD.track_id);
BEGIN
  UPDATE public.tracks
  SET
    upvotes = (SELECT COUNT(*) FROM public.track_votes WHERE track_id = target_track_id AND vote_type = 'upvote'),
    skip_votes = (SELECT COUNT(*) FROM public.track_votes WHERE track_id = target_track_id AND vote_type = 'skip')
  WHERE id = target_track_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_votes_sync ON public.track_votes;
CREATE TRIGGER trg_track_votes_sync
AFTER INSERT OR DELETE ON public.track_votes
FOR EACH ROW EXECUTE FUNCTION public.update_track_vote_tallies();

-- -----------------------------------------------------------------------------
-- 3. TRANSACTIONAL RPC FUNCTIONS
-- -----------------------------------------------------------------------------

-- 3.1 Atomic Room Creation (Authenticated users only)
CREATE OR REPLACE FUNCTION public.create_room_with_host(
  p_slug TEXT,
  p_title TEXT,
  p_vibe_tag TEXT,
  p_description TEXT,
  p_artwork_id TEXT,
  p_mode TEXT,
  p_is_private BOOLEAN,
  p_host_name TEXT,
  p_recovery_key_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_room_id TEXT := 'room-' || p_slug;
  v_room public.rooms%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create a lounge';
  END IF;

  -- Trusted Server Abuse Prevention: Enforce 5-room maximum per anonymous session
  IF (SELECT COUNT(*) FROM public.rooms WHERE host_id = v_user_id AND is_featured = false) >= 5 THEN
    RAISE EXCEPTION 'Room creation limit reached (maximum 5 lounges per anonymous session)';
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
    room_id, user_id, display_name, role, is_active
  )
  VALUES (
    v_room_id, v_user_id, p_host_name, 'host', true
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

-- 3.2 Atomic Playback Synchronization (Authenticated users only)
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
SET search_path = public, extensions, pg_temp
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

  IF v_room.mode = 'host-curated' AND (v_room.host_id IS DISTINCT FROM v_user_id) THEN
    RAISE EXCEPTION 'Only the room host can control playback in curated mode';
  END IF;

  SELECT * INTO v_playback FROM public.room_playback WHERE room_id = p_room_id FOR UPDATE;

  -- Optimistic Revision Validation
  IF p_expected_revision IS NOT NULL AND v_playback.revision != p_expected_revision THEN
    RETURN jsonb_build_object(
      'conflict', true,
      'currentRevision', v_playback.revision,
      'playback', to_jsonb(v_playback)
    );
  END IF;

  UPDATE public.room_playback
  SET
    current_track_id = COALESCE(p_track_id, current_track_id),
    is_playing = p_is_playing,
    progress_seconds = GREATEST(0, p_progress_seconds),
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

-- 3.3 Secure Host Recovery with Key Rotation & Rate-Limiting (Authenticated users only)
CREATE OR REPLACE FUNCTION public.reclaim_room_host(
  p_room_id TEXT,
  p_recovery_key TEXT,
  p_new_recovery_key_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
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

  IF char_length(p_new_recovery_key_hash) != 64 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Replacement recovery hash must be a 64-character SHA-256 string');
  END IF;

  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  IF NOT FOUND OR v_room.host_key_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room not found or no recovery key registered');
  END IF;

  -- Rate-limiting: Check failed attempts by room or user session in the last 15 minutes
  SELECT COUNT(*) INTO v_failed_attempts
  FROM public.host_recovery_attempts
  WHERE (room_id = p_room_id OR attempt_user_id = v_user_id)
    AND is_successful = false
    AND attempt_at > (now() - interval '15 minutes');

  IF v_failed_attempts >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Too many failed recovery attempts. Locked for 15 minutes.');
  END IF;

  v_hash := encode(digest(p_recovery_key, 'sha256'), 'hex');
  IF v_hash != v_room.host_key_hash THEN
    -- Record failed attempt
    INSERT INTO public.host_recovery_attempts (room_id, attempt_user_id, is_successful)
    VALUES (p_room_id, v_user_id, false);
    RETURN jsonb_build_object('success', false, 'error', 'Incorrect recovery key');
  END IF;

  -- Record successful attempt
  INSERT INTO public.host_recovery_attempts (room_id, attempt_user_id, is_successful)
  VALUES (p_room_id, v_user_id, true);

  -- Atomic Reassignment & Immediate Key Rotation
  UPDATE public.rooms
  SET
    host_id = v_user_id,
    host_key_hash = p_new_recovery_key_hash, -- Rotate old key immediately
    updated_at = now()
  WHERE id = p_room_id;

  INSERT INTO public.room_memberships (room_id, user_id, display_name, role, is_active)
  VALUES (p_room_id, v_user_id, 'Host Curator', 'host', true)
  ON CONFLICT (room_id, user_id)
  DO UPDATE SET role = 'host', is_active = true;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Restrict RPC Execution Permissions
-- has_room_access is needed for RLS evaluations for both anon and authenticated users
REVOKE ALL ON FUNCTION public.has_room_access(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_room_access(TEXT, UUID) TO authenticated, anon;

-- State-changing RPCs strictly require the authenticated role (Supabase anonymous auth provides this)
REVOKE ALL ON FUNCTION public.create_room_with_host(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_room_with_host(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_room_with_host(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.sync_room_playback(TEXT, TEXT, BOOLEAN, DOUBLE PRECISION, TEXT, BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_room_playback(TEXT, TEXT, BOOLEAN, DOUBLE PRECISION, TEXT, BIGINT) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_room_playback(TEXT, TEXT, BOOLEAN, DOUBLE PRECISION, TEXT, BIGINT) TO authenticated;

REVOKE ALL ON FUNCTION public.reclaim_room_host(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reclaim_room_host(TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.reclaim_room_host(TEXT, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_recovery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_playback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 4.1 ROOMS POLICIES
DROP POLICY IF EXISTS "Public rooms are viewable, private rooms require access" ON public.rooms;
CREATE POLICY "Public rooms are viewable, private rooms require access"
ON public.rooms FOR SELECT
USING (is_private = false OR public.has_room_access(id, auth.uid()));

DROP POLICY IF EXISTS "Room updates restricted to room host" ON public.rooms;
CREATE POLICY "Room updates restricted to room host"
ON public.rooms FOR UPDATE
USING (host_id = auth.uid())
WITH CHECK (host_id = auth.uid());

DROP POLICY IF EXISTS "Room deletion restricted to host on non-featured rooms" ON public.rooms;
CREATE POLICY "Room deletion restricted to host on non-featured rooms"
ON public.rooms FOR DELETE
USING (host_id = auth.uid() AND is_featured = false);

-- 4.2 HOST RECOVERY ATTEMPTS POLICIES
DROP POLICY IF EXISTS "Recovery attempts viewable only by room host" ON public.host_recovery_attempts;
CREATE POLICY "Recovery attempts viewable only by room host"
ON public.host_recovery_attempts FOR SELECT
USING (EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND host_id = auth.uid()));

-- 4.3 MEMBERSHIPS POLICIES
DROP POLICY IF EXISTS "Memberships viewable by authorized room listeners" ON public.room_memberships;
CREATE POLICY "Memberships viewable by authorized room listeners"
ON public.room_memberships FOR SELECT
USING (public.has_room_access(room_id, auth.uid()));

DROP POLICY IF EXISTS "Users can join rooms as listeners" ON public.room_memberships;
CREATE POLICY "Users can join rooms as listeners"
ON public.room_memberships FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND role = 'listener'
  AND (
    (SELECT is_private FROM public.rooms WHERE id = room_id) = false
    OR public.has_room_access(room_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update their display name or activity" ON public.room_memberships;
CREATE POLICY "Users can update their display name or activity"
ON public.room_memberships FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can leave rooms" ON public.room_memberships;
CREATE POLICY "Users can leave rooms"
ON public.room_memberships FOR DELETE
USING (user_id = auth.uid());

-- 4.4 ROOM PLAYBACK POLICIES
DROP POLICY IF EXISTS "Playback viewable only with room access" ON public.room_playback;
CREATE POLICY "Playback viewable only with room access"
ON public.room_playback FOR SELECT
USING (public.has_room_access(room_id, auth.uid()));

-- 4.5 TRACKS POLICIES (Queue)
DROP POLICY IF EXISTS "Tracks viewable only with room access" ON public.tracks;
CREATE POLICY "Tracks viewable only with room access"
ON public.tracks FOR SELECT
USING (public.has_room_access(room_id, auth.uid()));

DROP POLICY IF EXISTS "Active members can queue tracks" ON public.tracks;
CREATE POLICY "Active members can queue tracks"
ON public.tracks FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND added_by_id = auth.uid()
  AND public.has_room_access(room_id, auth.uid())
  AND (storage_path IS NULL OR storage_path LIKE (room_id || '/%'))
);

DROP POLICY IF EXISTS "Track adder or host can delete tracks" ON public.tracks;
CREATE POLICY "Track adder or host can delete tracks"
ON public.tracks FOR DELETE
USING (
  added_by_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND host_id = auth.uid())
);

-- 4.6 TRACK VOTES POLICIES
DROP POLICY IF EXISTS "Votes viewable with room access" ON public.track_votes;
CREATE POLICY "Votes viewable with room access"
ON public.track_votes FOR SELECT
USING (public.has_room_access(room_id, auth.uid()));

DROP POLICY IF EXISTS "Active members can cast votes" ON public.track_votes;
CREATE POLICY "Active members can cast votes"
ON public.track_votes FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND public.has_room_access(room_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can retract their own vote" ON public.track_votes;
CREATE POLICY "Users can retract their own vote"
ON public.track_votes FOR DELETE
USING (user_id = auth.uid());

-- 4.7 CHAT MESSAGES POLICIES
DROP POLICY IF EXISTS "Chat viewable with room access" ON public.chat_messages;
CREATE POLICY "Chat viewable with room access"
ON public.chat_messages FOR SELECT
USING (public.has_room_access(room_id, auth.uid()));

DROP POLICY IF EXISTS "Active members can post chat messages" ON public.chat_messages;
CREATE POLICY "Active members can post chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND public.has_room_access(room_id, auth.uid())
);

-- 4.8 AUDIO UPLOAD INTENTS POLICIES
ALTER TABLE public.audio_upload_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own upload intents" ON public.audio_upload_intents;
CREATE POLICY "Users can view their own upload intents"
ON public.audio_upload_intents FOR SELECT
USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 5. REALTIME AUTHORIZATION POLICIES (realtime.messages)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Only authorized room members can subscribe to room channel" ON realtime.messages;
CREATE POLICY "Only authorized room members can subscribe to room channel"
ON realtime.messages FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.has_room_access(
    public.extract_room_id_from_topic(realtime.topic()),
    auth.uid()
  )
);

DROP POLICY IF EXISTS "Only authorized room members can broadcast to room channel" ON realtime.messages;
CREATE POLICY "Only authorized room members can broadcast to room channel"
ON realtime.messages FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.has_room_access(
    public.extract_room_id_from_topic(realtime.topic()),
    auth.uid()
  )
  -- Strict Sender Identity Validation: senderId must be present, non-empty, valid UUID, and match auth.uid()
  AND (payload->>'senderId') IS NOT NULL
  AND (payload->>'senderId') != ''
  AND (payload->>'senderId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND (payload->>'senderId') = auth.uid()::text
  AND (
    NOT (
      (payload->>'type') IN ('PLAY', 'PAUSE', 'SEEK', 'SELECT_TRACK')
      AND EXISTS (
        SELECT 1 FROM public.rooms r
        WHERE r.id = public.extract_room_id_from_topic(realtime.topic())
          AND r.mode = 'host-curated'
          AND r.host_id IS DISTINCT FROM auth.uid()
      )
    )
  )
);

-- -----------------------------------------------------------------------------
-- 6. EDITORIAL CATALOG INITIAL SEED
-- -----------------------------------------------------------------------------

INSERT INTO public.rooms (
  id, slug, title, vibe_tag, description, artwork_id, ambient_color, accent_color,
  mode, is_private, is_featured, host_id, host_name
)
VALUES
  ('room-tokyo-afterhours', 'tokyo-afterhours', 'Shibuya Midnight Reverie', 'Deep IDM & Minimal Synth', 'Analog synthesizers, tape saturation, and ambient dusk textures from Tokyo.', 'noc-01', '#A0B7A8', '#A0B7A8', 'collaborative', false, true, NULL, 'NOCTURNE'),
  ('room-nordic-solitude', 'nordic-solitude', 'Reykjavik Obsidian Echoes', 'Neoclassical & Glitch', 'Sub-bass drones, felted piano pedals, and glacial strings for deep focus.', 'noc-02', '#E8E4D9', '#E8E4D9', 'collaborative', false, true, NULL, 'NOCTURNE'),
  ('room-berlin-basement', 'berlin-basement', 'Kreuzberg Concrete Velvet', 'Dub Techno & Modular', '4AM warehouse warmth, Roland 909 kicks, and hypnotic chord stabs.', 'noc-03', '#A65D45', '#A65D45', 'collaborative', false, true, NULL, 'NOCTURNE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.room_playback (
  room_id, current_track_id, is_playing, progress_seconds, source_type, revision
)
VALUES
  ('room-tokyo-afterhours', NULL, false, 0, 'specimen', 1),
  ('room-nordic-solitude', NULL, false, 0, 'specimen', 1),
  ('room-berlin-basement', NULL, false, 0, 'specimen', 1)
ON CONFLICT (room_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. SUPABASE AUDIO STORAGE CONFIGURATION & POLICIES (nocturne-audio)
-- -----------------------------------------------------------------------------

-- Create or update private bucket 'nocturne-audio' (25 MB max, audio MIME types)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nocturne-audio',
  'nocturne-audio',
  false,
  26214400, -- 25 MB max file size
  ARRAY['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/mp4', 'audio/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/mp4', 'audio/webm'];

-- SELECT: Only authorized room members can access audio objects
DROP POLICY IF EXISTS "Authorized room members can access audio objects" ON storage.objects;
CREATE POLICY "Authorized room members can access audio objects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'nocturne-audio'
  AND auth.uid() IS NOT NULL
  AND name NOT LIKE '%..%'
  AND name ~ '^[a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+$'
  AND public.has_room_access(split_part(name, '/', 1), auth.uid())
);

-- INSERT: Only authorized room members can upload audio objects
DROP POLICY IF EXISTS "Authorized room members can upload audio objects" ON storage.objects;
CREATE POLICY "Authorized room members can upload audio objects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'nocturne-audio'
  AND auth.uid() IS NOT NULL
  AND name NOT LIKE '%..%'
  AND name ~ '^[a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+$'
  AND public.has_room_access(split_part(name, '/', 1), auth.uid())
);

-- DELETE: Track uploader or room host can delete audio objects
DROP POLICY IF EXISTS "Track uploader or room host can delete audio objects" ON storage.objects;
CREATE POLICY "Track uploader or room host can delete audio objects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'nocturne-audio'
  AND auth.uid() IS NOT NULL
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = split_part(name, '/', 1)
        AND r.host_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.storage_path = name
        AND t.added_by_id = auth.uid()
    )
  )
);

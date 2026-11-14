-- NOCTURNE Active Room Lifecycle & Presence Functions
-- Enforces 5-minute grace period policy, honest active listener counts, and excludes expired/curated demo rooms

CREATE OR REPLACE FUNCTION public.is_room_active(p_room_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_created_at timestamptz;
  v_is_featured boolean;
  v_host_id uuid;
  v_active_count integer;
  v_max_last_seen timestamptz;
  v_is_playing boolean;
  v_playback_updated timestamptz;
BEGIN
  SELECT created_at, is_featured, host_id
  INTO v_created_at, v_is_featured, v_host_id
  FROM public.rooms
  WHERE id = p_room_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Curated seed rooms without a host are never active user rooms
  IF v_is_featured = true AND v_host_id IS NULL THEN
    RETURN false;
  END IF;

  -- Initial creation grace period (5 minutes)
  IF v_created_at >= (NOW() - INTERVAL '5 minutes') THEN
    RETURN true;
  END IF;

  -- Check active members within honest 75s threshold and max last_seen
  SELECT 
    COUNT(DISTINCT user_id) FILTER (WHERE is_active = true AND last_seen >= (NOW() - INTERVAL '75 seconds')),
    MAX(last_seen)
  INTO v_active_count, v_max_last_seen
  FROM public.room_memberships
  WHERE room_id = p_room_id;

  IF COALESCE(v_active_count, 0) > 0 THEN
    RETURN true;
  END IF;

  -- 5-minute reconnection grace period after last participant disconnected
  IF v_max_last_seen IS NOT NULL AND v_max_last_seen >= (NOW() - INTERVAL '5 minutes') THEN
    RETURN true;
  END IF;

  -- Check if playback is actively playing and updated within 5 minutes
  SELECT is_playing, updated_at
  INTO v_is_playing, v_playback_updated
  FROM public.room_playback
  WHERE room_id = p_room_id;

  IF v_is_playing = true AND v_playback_updated >= (NOW() - INTERVAL '5 minutes') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_room_active(text) TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION public.get_active_rooms()
RETURNS TABLE (
  id text,
  slug text,
  title text,
  vibe_tag text,
  description text,
  artwork_id text,
  ambient_color text,
  accent_color text,
  mode text,
  is_private boolean,
  is_featured boolean,
  host_id uuid,
  host_name text,
  created_at timestamptz,
  listener_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    r.id,
    r.slug,
    r.title,
    r.vibe_tag,
    r.description,
    r.artwork_id,
    r.ambient_color,
    r.accent_color,
    r.mode,
    r.is_private,
    r.is_featured,
    r.host_id,
    r.host_name,
    r.created_at,
    COALESCE(m.active_count, 0) AS listener_count
  FROM public.rooms r
  LEFT JOIN (
    SELECT 
      room_id, 
      COUNT(DISTINCT user_id) FILTER (WHERE is_active = true AND last_seen >= (NOW() - INTERVAL '75 seconds')) AS active_count,
      MAX(last_seen) AS max_last_seen
    FROM public.room_memberships
    GROUP BY room_id
  ) m ON m.room_id = r.id
  LEFT JOIN public.room_playback p ON p.room_id = r.id
  WHERE r.is_private = false
    AND (r.is_featured = false OR r.host_id IS NOT NULL)
    AND (
      r.created_at >= (NOW() - INTERVAL '5 minutes')
      OR COALESCE(m.active_count, 0) > 0
      OR (m.max_last_seen IS NOT NULL AND m.max_last_seen >= (NOW() - INTERVAL '5 minutes'))
      OR (p.is_playing = true AND p.updated_at >= (NOW() - INTERVAL '5 minutes'))
    )
  ORDER BY r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_rooms() TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION public.touch_room_membership(
  p_room_id text,
  p_user_id uuid,
  p_display_name text,
  p_role text DEFAULT 'listener',
  p_is_active boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.room_memberships (room_id, user_id, display_name, role, is_active, last_seen)
  VALUES (p_room_id, p_user_id, p_display_name, p_role, p_is_active, NOW())
  ON CONFLICT (room_id, user_id)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role = CASE WHEN public.room_memberships.role = 'host' THEN 'host' ELSE EXCLUDED.role END,
    is_active = EXCLUDED.is_active,
    last_seen = NOW();

  -- Prune stale inactive participants in the room whose heartbeat has lapsed past 60s
  UPDATE public.room_memberships
  SET is_active = false
  WHERE room_id = p_room_id
    AND is_active = true
    AND user_id != p_user_id
    AND last_seen < (NOW() - INTERVAL '60 seconds');
END;
$$;

GRANT EXECUTE ON FUNCTION public.touch_room_membership(text, uuid, text, text, boolean) TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION public.leave_room_membership(
  p_room_id text,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.room_memberships
  SET is_active = false, last_seen = NOW()
  WHERE room_id = p_room_id AND user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_room_membership(text, uuid) TO authenticated, anon, service_role;
GRANT SELECT ON public.room_memberships TO authenticated, anon, service_role;

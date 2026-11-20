-- NOCTURNE: Host Promotion & Listener Handoff
-- Additive security patch: preserves all existing RLS policies and table schema.
BEGIN;

-- Allow service_role to update rooms (for host reassignment) and room_memberships
GRANT UPDATE (host_id, host_name, updated_at) ON TABLE public.rooms TO service_role;
GRANT UPDATE (role, last_seen) ON TABLE public.room_memberships TO service_role;

-- Update guard_membership_fields so server-controlled functions / service_role can reassign roles
CREATE OR REPLACE FUNCTION public.guard_membership_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'Membership role is server-controlled and cannot be edited directly';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.room_id IS DISTINCT FROM OLD.room_id THEN
    RAISE EXCEPTION 'Membership user or room cannot be modified';
  END IF;
  IF OLD.is_active = false AND NEW.is_active = true
     AND auth.uid() = OLD.user_id
     AND current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'A revoked membership cannot be reactivated by its owner';
  END IF;
  RETURN NEW;
END;
$$;

-- Atomic RPC function to promote a listener to host
CREATE OR REPLACE FUNCTION public.promote_room_host(
  p_room_id text,
  p_target_user_id uuid,
  p_target_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_room public.rooms%ROWTYPE;
  v_target_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to promote host';
  END IF;

  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_room.is_featured THEN
    RAISE EXCEPTION 'Editorial featured lounges cannot transfer host ownership';
  END IF;

  IF v_room.host_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Only the current room host can promote a listener to host';
  END IF;

  IF p_target_user_id = v_user_id THEN
    RAISE EXCEPTION 'User is already the host of this room';
  END IF;

  -- Verify target user is active in this room
  SELECT display_name INTO v_target_name
  FROM public.room_memberships
  WHERE room_id = p_room_id AND user_id = p_target_user_id AND is_active = true;

  IF NOT FOUND THEN
    IF p_target_name IS NOT NULL AND p_target_name <> '' THEN
      v_target_name := p_target_name;
    ELSE
      RAISE EXCEPTION 'Target user is not an active participant in this room';
    END IF;
  END IF;

  v_target_name := COALESCE(p_target_name, v_target_name, 'Listener');

  -- Demote previous host to listener
  UPDATE public.room_memberships
  SET role = 'listener', last_seen = now()
  WHERE room_id = p_room_id AND user_id = v_user_id;

  -- Promote new host
  INSERT INTO public.room_memberships (room_id, user_id, display_name, role, is_active, last_seen)
  VALUES (p_room_id, p_target_user_id, v_target_name, 'host', true, now())
  ON CONFLICT (room_id, user_id)
  DO UPDATE SET role = 'host', display_name = EXCLUDED.display_name, is_active = true, last_seen = now();

  -- Update room host
  UPDATE public.rooms
  SET host_id = p_target_user_id,
      host_name = v_target_name,
      updated_at = now()
  WHERE id = p_room_id;

  -- Post system message in chat
  INSERT INTO public.chat_messages (
    id, room_id, user_id, user_name, user_role, text, is_system
  )
  VALUES (
    'msg-' || gen_random_uuid(),
    p_room_id,
    p_target_user_id,
    'NOCTURNE',
    'host',
    v_target_name || ' is now the host',
    true
  );

  RETURN jsonb_build_object(
    'success', true,
    'newHostId', p_target_user_id,
    'newHostName', v_target_name,
    'previousHostId', v_user_id
  );
END;
$$;

ALTER FUNCTION public.promote_room_host(text, uuid, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.promote_room_host(text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_room_host(text, uuid, text) TO authenticated, service_role;

COMMIT;

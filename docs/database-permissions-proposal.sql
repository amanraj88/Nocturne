-- NOCTURNE Supabase SQL Editor checklist
-- Run each SQL block separately in the EXISTING Sydney Supabase project.
-- Phase 1 and Phase 3 are read-only. Phase 2 applies the forward patch.
-- Do not edit or rerun the original 20261111_init.sql migration.

-- PHASE 1 — READ-ONLY CHECKS
-- First review current grants for all eight tables, including the often-missed
-- host_recovery_attempts. Stop if another application depends on these grants.
SELECT table_name, grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN (
    'rooms', 'host_recovery_attempts', 'room_memberships', 'room_playback',
    'tracks', 'track_votes', 'chat_messages', 'audio_upload_intents'
  )
ORDER BY table_name, grantee, privilege_type;

-- Include column-level grants, which are used for service_role room/media access.
SELECT table_name, column_name, grantee, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name IN ('rooms', 'room_memberships', 'tracks', 'audio_upload_intents')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, column_name, privilege_type;

-- Check RLS and policies (read-only).
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'rooms', 'host_recovery_attempts', 'room_memberships', 'room_playback',
    'tracks', 'track_votes', 'chat_messages', 'audio_upload_intents'
  )
ORDER BY c.relname;

-- Check application policies, trigger registrations, and Storage bucket (read-only).
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE (schemaname = 'public' AND tablename IN (
    'rooms', 'host_recovery_attempts', 'room_memberships', 'room_playback',
    'tracks', 'track_votes', 'chat_messages', 'audio_upload_intents'
  ))
   OR (schemaname = 'storage' AND tablename = 'objects')
   OR (schemaname = 'realtime' AND tablename = 'messages')
ORDER BY schemaname, tablename, policyname;

SELECT t.tgname, tbl.relname AS table_name, p.proname AS function_name,
       t.tgenabled, pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_trigger t
JOIN pg_class tbl ON tbl.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
  AND p.proname IN (
    'enforce_queue_limits', 'update_track_vote_tallies',
    'guard_chat_metadata', 'guard_membership_fields'
  )
ORDER BY tbl.relname, t.tgname;

SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets WHERE id = 'nocturne-audio';

-- PHASE 2 — APPLY THE SQL PATCH
-- This modifies the database. In Supabase Dashboard > SQL Editor, paste and run
-- the complete file `supabase/migrations/20261112_security_hardening.sql` once.
-- It is transactional and safe to rerun if it completed successfully.
-- It leaves the original migration and user data unchanged. It resets grants on
-- the eight tables to the privileges required by this app. Only proceed if the
-- Phase 1 grant inventory has no other consumers to preserve.
-- Expected: SQL Editor reports success and no result rows. On any error, stop
-- and share the error; do not run a partial version.

-- PHASE 3 — BASIC READ-ONLY VERIFICATION
-- Grants: anon reads public state; authenticated may queue/vote/chat; service_role
-- has only the server media access; host recovery internals stay server/RPC-only.
SELECT table_name, grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN (
    'rooms', 'host_recovery_attempts', 'room_memberships', 'room_playback',
    'tracks', 'track_votes', 'chat_messages', 'audio_upload_intents'
  )
  AND grantee IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- RLS remains enabled; required trigger functions are still attached.
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'rooms', 'host_recovery_attempts', 'room_memberships', 'room_playback',
    'tracks', 'track_votes', 'chat_messages', 'audio_upload_intents'
  )
ORDER BY c.relname;

SELECT t.tgname, tbl.relname AS table_name, t.tgenabled
FROM pg_trigger t
JOIN pg_class tbl ON tbl.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
  AND p.proname IN (
    'enforce_queue_limits', 'update_track_vote_tallies',
    'guard_chat_metadata', 'guard_membership_fields'
  )
ORDER BY tbl.relname, t.tgname;

-- Function owners/security settings and whether each API role can call an RPC.
SELECT p.proname, r.rolname AS owner, p.prosecdef AS security_definer,
       p.proconfig AS function_settings
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_roles r ON r.oid = p.proowner
WHERE n.nspname = 'public'
  AND p.proname IN (
    'has_room_access', 'extract_room_id_from_topic', 'create_room_with_host',
    'sync_room_playback', 'reclaim_room_host'
  )
ORDER BY p.proname;

SELECT has_function_privilege('anon', 'public.has_room_access(text,uuid)', 'EXECUTE') AS anon_access_helper,
       has_function_privilege('authenticated', 'public.has_room_access(text,uuid)', 'EXECUTE') AS authenticated_access_helper,
       has_function_privilege('authenticated', 'public.create_room_with_host(text,text,text,text,text,text,boolean,text,text)', 'EXECUTE') AS authenticated_create_room,
       has_function_privilege('authenticated', 'public.sync_room_playback(text,text,boolean,double precision,text,bigint)', 'EXECUTE') AS authenticated_sync_playback,
       has_function_privilege('authenticated', 'public.reclaim_room_host(text,text,text)', 'EXECUTE') AS authenticated_host_recovery;

-- PHASE 4 — QUICK APP CHECKS (BROWSER, NOT SQL EDITOR)
-- 1. Public room listing shows public rooms only; a private link as a non-member
--    returns not found. Active private member can load the room.
-- 2. Active member adds/removes own queue track and vote; host can remove a
--    track; another member cannot remove someone else's track or vote.
-- 3. Create an upload URL, revoke that test member, then confirm: confirmation
--    should be denied. Test only in a disposable room.
-- 4. Send a chat message, use room playback, and test the site on desktop/mobile.
-- These local checks do not prove live database behavior until run on the
-- deployed app using the configured Supabase project.

-- Privilege intent:
-- anon: SELECT room fields plus tracks/room_playback/chat_messages; no writes.
-- authenticated: same reads; INSERT/DELETE tracks; INSERT/DELETE track_votes;
--   INSERT chat_messages; execute the three intended state-changing RPCs.
-- service_role: server media routes only; no host_recovery_attempts or playback.
-- PUBLIC: no direct table permissions or state-changing RPC permissions.
-- No sequence/default privileges are needed by current app writes.

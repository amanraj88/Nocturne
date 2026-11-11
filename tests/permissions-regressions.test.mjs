import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const state = read('../src/pages/api/rooms/[id]/state.ts');
const migration = read('../supabase/migrations/20261111_init.sql');
const forwardPatch = read('../supabase/migrations/20261112_security_hardening.sql');

test('unauthorized private-room state is filtered by visitor RLS and returned as not found', () => {
  assert.match(state, /global:\s*\{\s*headers:\s*bearerToken\s*\?/);
  assert.match(state, /const \{ data: dbRoom, error: roomError \} = await client/);
  assert.match(state, /if \(!dbRoom\)[\s\S]*?status\(404\)/);
  assert.doesNotMatch(state, /admin\.auth\.getUser|admin\s*\.from\('room_memberships'\)/);
});

test('authorized private-room state uses the visitor bearer token for every table read', () => {
  assert.match(state, /Authorization: `Bearer \$\{bearerToken\}`/);
  assert.match(state, /client\s*\.from\('rooms'\)/);
  assert.match(state, /client\.from\('tracks'\)/);
  assert.match(state, /client\.from\('room_playback'\)/);
  assert.match(state, /client\.from\('chat_messages'\)/);
});

test('track insertion retains queue enforcement at 50 total and 20 shared files', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.enforce_queue_limits\(\)[\s\S]*?FOR UPDATE[\s\S]*?v_total >= 50[\s\S]*?v_shared >= 20/);
  assert.match(read('../src/context/LoungeContext.tsx'), /\.from\('tracks'\)\.insert\(/);
});

test('vote writes and tally trigger remain connected', () => {
  assert.match(read('../src/context/LoungeContext.tsx'), /\.from\('track_votes'\)\s*\.insert\(/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.update_track_vote_tallies\(\)[\s\S]*?UPDATE public\.tracks[\s\S]*?CREATE TRIGGER trg_track_votes_sync/);
});

test('media authorization uses the migrated membership table and active memberships', () => {
  for (const path of [
    '../src/pages/api/rooms/[id]/media.ts',
    '../src/pages/api/rooms/[id]/media/upload-url.ts',
    '../src/pages/api/rooms/[id]/media/[trackId].ts',
    '../src/pages/api/rooms/[id]/media/confirm.ts',
  ]) {
    const source = read(path);
    assert.match(source, /\.from\('room_memberships'\)/, path);
    assert.match(source, /\.eq\('is_active', true\)/, path);
    assert.doesNotMatch(source, /\.from\('room_members'\)/, path);
  }
});

test('room-state API disables caching for private responses', () => {
  assert.match(state, /Cache-Control', 'private, no-store'/);
});

test('public room listing filters private rooms and never selects the recovery hash', () => {
  const roomsApi = read('../src/pages/api/rooms/index.ts');
  assert.match(roomsApi, /\.eq\('is_private', false\)/);
  assert.match(roomsApi, /\.select\('id,slug,title,vibe_tag,description,artwork_id/);
  assert.doesNotMatch(roomsApi, /host_key_hash/);
});

test('private track deletion requires current room access in both RLS and API route', () => {
  const mediaRoute = read('../src/pages/api/rooms/[id]/media/[trackId].ts');
  assert.match(forwardPatch, /CREATE POLICY "Track adder or host can delete tracks"[\s\S]*?has_room_access\(room_id, auth\.uid\(\)\)[\s\S]*?added_by_id = auth\.uid\(\)/);
  assert.match(forwardPatch, /OR EXISTS \([\s\S]*?host_id = auth\.uid\(\)/);
  assert.match(mediaRoute, /dbRoom\.is_private && dbRoom\.host_id !== user\.id/);
  assert.match(mediaRoute, /\.eq\('is_active', true\)/);
  assert.match(mediaRoute, /const isUploader = dbTrack\.added_by_id === user\.id/);
  assert.match(mediaRoute, /if \(!membership\)[\s\S]*?status\(404\)/);
});

test('vote deletion requires current room access; tally trigger is privileged and bounded', () => {
  assert.match(forwardPatch, /CREATE POLICY "Users can retract their own vote"[\s\S]*?user_id = auth\.uid\(\)[\s\S]*?has_room_access\(room_id, auth\.uid\(\)\)/);
  assert.match(forwardPatch, /ALTER FUNCTION public\.update_track_vote_tallies\(\) SECURITY DEFINER/);
  assert.match(forwardPatch, /REVOKE ALL ON FUNCTION public\.update_track_vote_tallies\(\)[\s\S]*?FROM PUBLIC, anon, authenticated, service_role/);
});

test('private storage deletion requires current room access', () => {
  assert.match(forwardPatch, /CREATE POLICY "Track uploader or room host can delete audio objects"[\s\S]*?has_room_access\(split_part\(name, '\/', 1\), auth\.uid\(\)\)/);
});

test('upload confirmation checks active private membership after URL issuance', () => {
  const confirm = read('../src/pages/api/rooms/[id]/media/confirm.ts');
  assert.match(confirm, /Membership may have been revoked after the upload URL was issued/);
  assert.match(confirm, /\.eq\('is_active', true\)/);
  assert.match(confirm, /if \(!membership\)[\s\S]*?not authorized to confirm audio/);
  assert.match(confirm, /Recheck private membership immediately[\s\S]*?before persisting/);
  assert.match(confirm, /if \(!currentMembership\)[\s\S]*?safeCancelAndPurge/);
});

test('recovery can restore a revoked host but clients cannot reactivate themselves', () => {
  assert.match(forwardPatch, /current_user IN \('anon', 'authenticated'\)/);
  assert.match(forwardPatch, /PERFORM pg_advisory_xact_lock\(hashtextextended\(v_user_id::TEXT, 1\)\)/);
  assert.match(forwardPatch, /ON CONFLICT \(room_id, user_id\)[\s\S]*?DO UPDATE SET role = 'host', is_active = true/);
});

test('forward patch inventories and resets all eight tables without changing the original migration', () => {
  for (const table of [
    'rooms', 'host_recovery_attempts', 'room_memberships', 'room_playback',
    'tracks', 'track_votes', 'chat_messages', 'audio_upload_intents',
  ]) assert.match(forwardPatch, new RegExp(`public\\.${table}`));
  assert.match(forwardPatch, /BEGIN;[\s\S]*COMMIT;/);
  assert.match(forwardPatch, /GRANT EXECUTE ON FUNCTION public\.sync_room_playback[\s\S]*TO authenticated/);
  assert.doesNotMatch(forwardPatch, /ALTER TABLE public\.(rooms|tracks|chat_messages)[\s\S]{0,80}DISABLE ROW LEVEL SECURITY/);
});

test('configured production does not expose process-local action or SSE state', () => {
  assert.match(read('../src/pages/api/rooms/[id]/action.ts'), /isSupabaseConfigured\(\)[\s\S]*status\(404\)/);
  assert.match(read('../src/pages/api/rooms/[id]/events.ts'), /isSupabaseConfigured\(\)[\s\S]*status\(404\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dtfevaihqltuxidrhryk.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_GmqbhxuW96-46u8r8b3m_g_tGsgQRnW';

test('Cross-Browser Joining Test Suite (Simulating Browser A & Browser B / Incognito)', async (t) => {
  // Check network connectivity to Supabase
  try {
    const probe = await fetch(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: ANON_KEY } });
    if (!probe.ok && probe.status !== 404 && probe.status !== 200) {
      t.skip('Remote Supabase instance is unreachable in this environment.');
      return;
    }
  } catch (netErr) {
    t.skip(`Remote Supabase is unreachable (offline or sandbox): ${netErr?.message}`);
    return;
  }

  // ---------------------------------------------------------------------------
  // Context A: Normal Chrome (Host)
  // ---------------------------------------------------------------------------
  const clientA = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const authA = await clientA.auth.signInAnonymously();
  assert.ok(authA.data?.session?.access_token, 'Browser A must obtain an anonymous auth token');
  const userA = authA.data.user.id;
  const tokenA = authA.data.session.access_token;

  // ---------------------------------------------------------------------------
  // Context B: Chrome Incognito (Listener) - completely separate storage & user
  // ---------------------------------------------------------------------------
  const clientB = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const authB = await clientB.auth.signInAnonymously();
  assert.ok(authB.data?.session?.access_token, 'Browser B (Incognito) must obtain its own anonymous auth token');
  const userB = authB.data.user.id;
  const tokenB = authB.data.session.access_token;

  assert.notEqual(userA, userB, 'Browser A and Browser B must have distinct, isolated user identities');

  const testSlug = `cross-test-${Date.now().toString(36)}`;
  const testTitle = 'Cross Browser Lounge';
  let createdRoomId = '';

  await t.test('1. Browser A creates a new room in Supabase via RPC', async () => {
    const { data: dbRoom, error } = await clientA.rpc('create_room_with_host', {
      p_slug: testSlug,
      p_title: testTitle,
      p_vibe_tag: 'Ambient & Modular',
      p_description: 'Cross-browser automated test room',
      p_artwork_id: 'noc-01',
      p_mode: 'collaborative',
      p_is_private: false,
      p_host_name: 'Host User A',
      p_recovery_key_hash: null,
    });

    assert.equal(error, null, `Room creation must succeed without error: ${error?.message}`);
    assert.ok(dbRoom, 'dbRoom must be returned');
    assert.equal(dbRoom.slug, testSlug);
    assert.equal(dbRoom.title, testTitle);
    createdRoomId = dbRoom.id;
  });

  await t.test('2. Browser B (Incognito) pastes invite URL and fetches room state', async () => {
    // Simulate what /api/rooms/[id]/state does when Browser B calls it:
    // It queries rooms selecting only granted columns, with Browser B bearer token
    const { data: dbRoom, error: roomError } = await clientB
      .from('rooms')
      .select('id,slug,title,vibe_tag,description,artwork_id,ambient_color,accent_color,mode,is_private,host_id,host_name,created_at')
      .or(`slug.eq.${testSlug},id.eq.${testSlug},id.eq.room-${testSlug}`)
      .maybeSingle();

    assert.equal(roomError, null, `Browser B must NOT receive permission denied (42501): ${roomError?.message}`);
    assert.ok(dbRoom, 'Browser B must find the room created by Browser A');
    assert.equal(dbRoom.id, createdRoomId);
    assert.equal(dbRoom.slug, testSlug);
    assert.equal(dbRoom.host_id, userA, 'Host of the room must remain Browser A user ID');

    // Fetch related records (tracks, playback, chat) under Browser B session
    const [tracksRes, playbackRes, chatRes] = await Promise.all([
      clientB.from('tracks').select('*').eq('room_id', dbRoom.id).order('position', { ascending: true }),
      clientB.from('room_playback').select('*').eq('room_id', dbRoom.id).maybeSingle(),
      clientB.from('chat_messages').select('*').eq('room_id', dbRoom.id).order('created_at', { ascending: true }).limit(50),
    ]);

    assert.equal(tracksRes.error, null, 'Tracks query must succeed for listener');
    assert.equal(playbackRes.error, null, 'Playback query must succeed for listener');
    assert.equal(chatRes.error, null, 'Chat query must succeed for listener');
    assert.ok(playbackRes.data, 'Playback row must exist for newly created room');
    assert.equal(chatRes.data?.length, 1, 'Initial system welcome message must be visible to listener');
  });

  await t.test('3. Browser B refreshes and reconnects to the room', async () => {
    // Re-query under Browser B to ensure persistence
    const { data: refreshedRoom, error } = await clientB
      .from('rooms')
      .select('id,slug,title,vibe_tag,description,artwork_id,ambient_color,accent_color,mode,is_private,host_id,host_name,created_at')
      .eq('id', createdRoomId)
      .maybeSingle();

    assert.equal(error, null);
    assert.ok(refreshedRoom, 'Room must persist across refreshes and multiple client calls');
    assert.equal(refreshedRoom.id, createdRoomId);
  });

  await t.test('4. Security: Non-existent room returns not found', async () => {
    const { data: ghostRoom, error } = await clientB
      .from('rooms')
      .select('id,slug,title,vibe_tag,description,artwork_id,ambient_color,accent_color,mode,is_private,host_id,host_name,created_at')
      .eq('slug', 'completely-non-existent-ghost-room-999')
      .maybeSingle();

    assert.equal(error, null);
    assert.equal(ghostRoom, null, 'Non-existent room must return null for 404 handling');
  });

  await t.test('5. Public room listing returns the created room with Service Role', async () => {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_aOAEBKEvK7irSpYvPdZihQ_PnRwZLcg';
    const adminClient = createClient(SUPABASE_URL, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: dbRooms, error } = await adminClient
      .from('rooms')
      .select('id,slug,title,vibe_tag,description,artwork_id,ambient_color,accent_color,is_private,host_id,host_name,created_at')
      .eq('is_private', false)
      .order('created_at', { ascending: false });

    assert.equal(error, null, `Public rooms listing must succeed: ${error?.message}`);
    assert.ok(Array.isArray(dbRooms), 'Must return array of rooms');
    const found = dbRooms.find((r) => r.id === createdRoomId);
    assert.ok(found, 'Newly created room must appear in public rooms directory');
  });

  const testTrackId = `tr-yt-${Date.now()}`;

  await t.test('6. Shared Queue: Browser A queues a YouTube track; Browser B sees it', async () => {
    const { error: insertError } = await clientA.from('tracks').insert({
      id: testTrackId,
      room_id: createdRoomId,
      source_type: 'youtube',
      youtube_id: 'dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      artist: 'Rick Astley',
      duration_seconds: 212,
      added_by_id: userA,
      added_by_name: 'Host User A',
      position: 0,
    });

    assert.equal(insertError, null, `Host must successfully queue track: ${insertError?.message}`);

    // Browser B queries queue
    const { data: bQueue, error: bQueueErr } = await clientB
      .from('tracks')
      .select('*')
      .eq('room_id', createdRoomId)
      .order('position', { ascending: true });

    assert.equal(bQueueErr, null);
    assert.ok(bQueue?.some((t) => t.id === testTrackId && t.youtube_id === 'dQw4w9WgXcQ'));
  });

  await t.test('7. Playback Synchronization: Host syncs playback; Listener receives authoritative state', async () => {
    const { data: syncRes, error: syncErr } = await clientA.rpc('sync_room_playback', {
      p_room_id: createdRoomId,
      p_track_id: testTrackId,
      p_is_playing: true,
      p_progress_seconds: 45,
      p_source_type: 'youtube',
      p_expected_revision: null,
    });

    assert.equal(syncErr, null, `Playback sync must succeed: ${syncErr?.message}`);
    assert.equal(syncRes?.conflict, false);
    assert.equal(syncRes?.playback?.is_playing, true);
    assert.equal(syncRes?.playback?.progress_seconds, 45);

    // Listener reads authoritative playback row
    const { data: bPlayback, error: bPlaybackErr } = await clientB
      .from('room_playback')
      .select('*')
      .eq('room_id', createdRoomId)
      .maybeSingle();

    assert.equal(bPlaybackErr, null);
    assert.equal(bPlayback?.is_playing, true);
    assert.equal(bPlayback?.current_track_id, testTrackId);
    assert.equal(bPlayback?.progress_seconds, 45);
  });

  await t.test('8. Realtime Chat: Browser B (Listener) sends message; Browser A receives it', async () => {
    const msgId = `msg-listener-${Date.now()}`;
    const { error: chatErr } = await clientB.from('chat_messages').insert({
      id: msgId,
      room_id: createdRoomId,
      user_id: userB,
      user_name: 'Listener B',
      text: 'Vibing with this track!',
    });

    assert.equal(chatErr, null, `Listener must be allowed to post chat: ${chatErr?.message}`);

    const { data: aChat, error: aChatErr } = await clientA
      .from('chat_messages')
      .select('*')
      .eq('room_id', createdRoomId)
      .eq('id', msgId)
      .maybeSingle();

    assert.equal(aChatErr, null);
    assert.ok(aChat);
    assert.equal(aChat.user_name, 'Listener B');
    assert.equal(aChat.text, 'Vibing with this track!');
  });

  await t.test('9. Security: Listener cannot delete or end the room', async () => {
    // Attempting delete as listener should not delete host room (enforced by RLS host_id = auth.uid())
    const { error: delErr } = await clientB
      .from('rooms')
      .delete()
      .eq('id', createdRoomId);

    assert.equal(delErr, null);

    // Confirm room still exists in database
    const { data: verifyRoom } = await clientA
      .from('rooms')
      .select('id')
      .eq('id', createdRoomId)
      .maybeSingle();
    assert.ok(verifyRoom, 'Room must still exist after listener delete attempt');
  });

  await t.test('10. Room Lifecycle: Host ends room; subsequent requests return 404', async () => {
    // Host ends room
    const { error: hostDelErr } = await clientA
      .from('rooms')
      .delete()
      .eq('id', createdRoomId);

    assert.equal(hostDelErr, null, `Host must be able to delete room: ${hostDelErr?.message}`);

    // Listener requests room state after deletion -> must be null (404)
    const { data: postEndRoom, error: postEndErr } = await clientB
      .from('rooms')
      .select('id')
      .eq('id', createdRoomId)
      .maybeSingle();

    assert.equal(postEndErr, null);
    assert.equal(postEndRoom, null, 'Ended room must no longer be found');
  });
});

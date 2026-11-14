import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const waitFor = async (predicate, label, timeoutMs = 8000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.fail(`Timed out waiting for ${label}`);
};

const subscribe = (channel) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Timed out subscribing to room channel')), 8000);
  channel.subscribe((status, error) => {
    if (status === 'SUBSCRIBED') {
      clearTimeout(timer);
      resolve();
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      clearTimeout(timer);
      reject(new Error(`Room channel subscription failed: ${status}${error?.message ? ` (${error.message})` : ''}`));
    }
  });
});

const hasUser = (channel, userId) =>
  Object.values(channel.presenceState()).flat().some((presence) => presence.userId === userId);

test('private room Realtime shares presence and persisted chat/queue inserts across anonymous clients', async (t) => {
  if (!SUPABASE_URL || !ANON_KEY) {
    t.skip('Supabase URL and anon key are required for the live Realtime integration test.');
    return;
  }

  try {
    const health = await Promise.race([
      fetch(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: ANON_KEY } }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase health check timed out')), 5000)),
    ]);
    if (!health.ok && health.status !== 404) {
      t.skip(`Supabase is unavailable for live Realtime checks (HTTP ${health.status}).`);
      return;
    }
  } catch (error) {
    t.skip(`Supabase is unavailable for live Realtime checks: ${error.message}`);
    return;
  }

  const makeClient = () => createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  const host = makeClient();
  const listener = makeClient();
  let roomId = '';
  let hostChannel;
  let listenerChannel;
  let receivedChat;
  let receivedQueue;

  try {
    const [hostAuth, listenerAuth] = await Promise.all([
      host.auth.signInAnonymously(),
      listener.auth.signInAnonymously(),
    ]);
    assert.equal(hostAuth.error, null, `Host anonymous auth failed: ${hostAuth.error?.message}`);
    assert.equal(listenerAuth.error, null, `Listener anonymous auth failed: ${listenerAuth.error?.message}`);
    const hostId = hostAuth.data.user.id;
    const listenerId = listenerAuth.data.user.id;
    assert.notEqual(hostId, listenerId);

    const slug = `realtime-check-${Date.now().toString(36)}`;
    const { data: room, error: createError } = await host.rpc('create_room_with_host', {
      p_slug: slug,
      p_title: 'Realtime Verification Room',
      p_vibe_tag: 'Realtime verification',
      p_description: 'Temporary room for Realtime integration verification.',
      p_artwork_id: 'noc-01',
      p_mode: 'collaborative',
      p_is_private: false,
      p_host_name: 'Realtime Test Host',
      p_recovery_key_hash: null,
    });
    assert.equal(createError, null, `Room creation failed: ${createError?.message}`);
    roomId = room.id;

    let chatResolve;
    let queueResolve;
    const chatReceived = new Promise((resolve) => { chatResolve = resolve; });
    const queueReceived = new Promise((resolve) => { queueResolve = resolve; });
    const topic = `nocturne:room:${roomId}`;

    hostChannel = host.channel(topic, {
      config: { private: true, presence: { key: hostId }, broadcast: { ack: true, self: false } },
    });
    hostChannel
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}`,
      }, ({ new: row }) => { receivedChat = row; chatResolve(row); })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'tracks', filter: `room_id=eq.${roomId}`,
      }, ({ new: row }) => { receivedQueue = row; queueResolve(row); });
    await subscribe(hostChannel);
    const hostTrack = await hostChannel.track({ userId: hostId, name: 'Realtime Test Host' });
    assert.equal(hostTrack, 'ok', 'Host presence track must be accepted');

    listenerChannel = listener.channel(topic, {
      config: { private: true, presence: { key: listenerId }, broadcast: { ack: true, self: false } },
    });
    await subscribe(listenerChannel);
    const listenerTrack = await listenerChannel.track({ userId: listenerId, name: 'Realtime Test Listener' });
    assert.equal(listenerTrack, 'ok', 'Listener presence track must be accepted');
    await waitFor(
      () => hasUser(hostChannel, hostId) && hasUser(hostChannel, listenerId),
      'both anonymous identities in synchronized presence'
    );
    assert.equal(Object.values(hostChannel.presenceState()).flat().filter((presence) => presence.userId).length, 2);

    const message = { id: `rt-chat-${Date.now()}`, text: 'Realtime chat check' };
    const { error: chatError } = await listener.from('chat_messages').insert({
      id: message.id, room_id: roomId, user_id: listenerId, user_name: 'Realtime Test Listener', text: message.text,
    });
    assert.equal(chatError, null, `Chat row must persist: ${chatError?.message}`);
    const persistedChat = await chatReceived;
    assert.equal(persistedChat.id, message.id);
    assert.equal(persistedChat.text, message.text);

    const track = { id: `rt-track-${Date.now()}`, youtubeId: 'dQw4w9WgXcQ' };
    const { error: trackError } = await listener.from('tracks').insert({
      id: track.id,
      room_id: roomId,
      source_type: 'youtube',
      youtube_id: track.youtubeId,
      title: 'Realtime Queue Check',
      artist: 'NOCTURNE Test',
      added_by_id: listenerId,
      added_by_name: 'Realtime Test Listener',
      position: 0,
    });
    assert.equal(trackError, null, `Queue row must persist: ${trackError?.message}`);
    const persistedTrack = await queueReceived;
    assert.equal(persistedTrack.id, track.id);
    assert.equal(persistedTrack.youtube_id, track.youtubeId);

    await listener.removeChannel(listenerChannel);
    listenerChannel = null;
    await waitFor(() => !hasUser(hostChannel, listenerId), 'listener presence removal after disconnect');

    listenerChannel = listener.channel(topic, {
      config: { private: true, presence: { key: listenerId }, broadcast: { ack: true, self: false } },
    });
    await subscribe(listenerChannel);
    const rejoinTrack = await listenerChannel.track({ userId: listenerId, name: 'Realtime Test Listener' });
    assert.equal(rejoinTrack, 'ok', 'Listener presence track must recover after reconnect');
    await waitFor(() => hasUser(hostChannel, listenerId), 'listener presence after reconnect');
    assert.ok(receivedChat && receivedQueue);
  } finally {
    const bounded = (promise) => Promise.race([promise, new Promise((resolve) => setTimeout(resolve, 2500))]);
    if (listenerChannel) await bounded(listener.removeChannel(listenerChannel)).catch(() => {});
    if (hostChannel) await bounded(host.removeChannel(hostChannel)).catch(() => {});
    if (roomId) await host.from('rooms').delete().eq('id', roomId).then(() => {}).catch(() => {});
    host.realtime.disconnect();
    listener.realtime.disconnect();
  }
});

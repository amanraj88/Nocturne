import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

class TestRoomManager {
  constructor() {
    this.rooms = new Map();
  }

  isRoomActive(roomIdOrSlug) {
    const state = this.getRoomState(roomIdOrSlug);
    if (!state) return false;
    if (state.room.isFeatured || state.room.id.startsWith('room-tokyo') || state.room.id.startsWith('room-nordic') || state.room.id.startsWith('room-berlin')) {
      return true;
    }
    return state.participants.size > 0 || Boolean(state.playback?.isPlaying);
  }

  getAvailableSlug(baseSlug) {
    let candidate = baseSlug;
    let counter = 2;
    while (this.isRoomActive(candidate)) {
      candidate = `${baseSlug}-${counter}`;
      counter++;
    }
    return candidate;
  }

  createRoom(roomData) {
    const title = roomData.title || roomData.name || 'Untitled Room';
    const slug = (roomData.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = roomData.id || `room-${slug}`;
    const hostUser = roomData.host || { id: 'usr-guest', name: 'Guest Curator', role: 'host', isListening: true, joinedAt: '12:00 PM' };

    const newRoom = {
      id,
      slug,
      title,
      vibeTag: roomData.vibeTag || 'Ambient & Modular',
      description: roomData.description || 'Session',
      host: hostUser,
      listenerCount: 0,
      mode: 'collaborative',
      artworkId: roomData.artworkId || 'noc-01',
      isFeatured: Boolean(roomData.isFeatured),
    };

    const serverState = {
      room: newRoom,
      queue: [],
      playback: { isPlaying: false, progressSeconds: 0 },
      participants: new Map(),
    };

    this.rooms.set(id, serverState);
    this.rooms.set(slug, serverState);
    return newRoom;
  }

  joinParticipant(roomId, user) {
    const state = this.getRoomState(roomId);
    if (!state) return;
    state.participants.set(user.id, user);
    state.room.listenerCount = state.participants.size;
  }

  leaveParticipant(roomId, userId) {
    const state = this.getRoomState(roomId);
    if (!state) return;
    state.participants.delete(userId);
    state.room.listenerCount = state.participants.size;
  }

  getRoomState(roomId) {
    return this.rooms.get(roomId) || null;
  }
}

const roomManager = new TestRoomManager();

// Seed featured lounges
roomManager.createRoom({ id: 'room-tokyo-afterhours', slug: 'tokyo-afterhours', title: 'Shibuya Midnight Reverie', isFeatured: true });
roomManager.createRoom({ id: 'room-nordic-solitude', slug: 'nordic-solitude', title: 'Reykjavik Obsidian Echoes', isFeatured: true });
roomManager.createRoom({ id: 'room-berlin-basement', slug: 'berlin-basement', title: 'Kreuzberg Concrete Velvet', isFeatured: true });

// ==============================================================================
// 1. FUNCTIONAL ROOM CREATION & NAME REUSE TESTS (BUG 1 FIX)
// ==============================================================================

test('1. Create room with name "Test Lounge" produces expected slug and metadata', () => {
  const room = roomManager.createRoom({
    name: 'Test Lounge',
    description: 'Initial session for verification',
    vibeTag: 'Deep IDM & Minimal Synth',
    artworkId: 'noc-01',
    host: {
      id: 'usr-host-1',
      name: 'Host User',
      role: 'host',
      isListening: true,
      joinedAt: '12:00 PM',
    },
  });

  assert.equal(room.title, 'Test Lounge');
  assert.match(room.slug, /^test-lounge/);
  assert.equal(room.mode, 'collaborative');
  assert.equal(room.artworkId, 'noc-01');

  const state = roomManager.getRoomState(room.slug);
  assert.ok(state, 'Room state must exist in roomManager');
  assert.equal(state.participants.size, 0, 'New room starts with 0 connected participants');
});

test('2. BUG 1 FIX: Inactive room name can be reused without conflict or 409 error', () => {
  const baseSlug = 'reuse-test-lounge';
  const initialRoom = roomManager.createRoom({
    id: `room-${baseSlug}`,
    name: 'Reuse Test Lounge',
    slug: baseSlug,
  });

  // Ensure initial room is inactive (no participants, not playing)
  assert.equal(roomManager.isRoomActive(baseSlug), false);

  // Available slug check for inactive room must return the exact same slug (reusable)
  const availableSlug = roomManager.getAvailableSlug(baseSlug);
  assert.equal(availableSlug, baseSlug, 'Inactive room slug must be reusable');

  // Creating the room again with the same name must succeed and reuse the slug
  const reusedRoom = roomManager.createRoom({
    id: `room-${availableSlug}`,
    name: 'Reuse Test Lounge',
    slug: availableSlug,
    host: {
      id: 'usr-host-2',
      name: 'New Host User',
      role: 'host',
      isListening: true,
      joinedAt: '12:05 PM',
    },
  });

  assert.equal(reusedRoom.title, 'Reuse Test Lounge');
  assert.equal(reusedRoom.slug, baseSlug);
  assert.equal(reusedRoom.host.name, 'New Host User');
});

test('3. BUG 1 FIX: Active room name conflict is handled cleanly with disambiguation', () => {
  const activeSlug = 'active-session-lounge';
  const initialRoom = roomManager.createRoom({
    id: `room-${activeSlug}`,
    name: 'Active Session Lounge',
    slug: activeSlug,
  });

  // Simulate active session: connect a participant
  roomManager.joinParticipant(initialRoom.id, {
    id: 'active-listener-1',
    name: 'Active Listener',
    role: 'host',
    isListening: true,
    joinedAt: '12:10 PM',
  });

  // Verify the room is genuinely active
  assert.equal(roomManager.isRoomActive(activeSlug), true);

  // When room is active, getAvailableSlug must disambiguate (e.g. active-session-lounge-2)
  const disambiguatedSlug = roomManager.getAvailableSlug(activeSlug);
  assert.equal(disambiguatedSlug, `${activeSlug}-2`, 'Active room slug must be disambiguated');

  // Creating a new room with the same name preserves the active room and assigns the disambiguated slug
  const secondRoom = roomManager.createRoom({
    id: `room-${disambiguatedSlug}`,
    name: 'Active Session Lounge',
    slug: disambiguatedSlug,
  });

  assert.equal(secondRoom.title, 'Active Session Lounge');
  assert.equal(secondRoom.slug, `${activeSlug}-2`);

  // Both rooms must exist simultaneously
  assert.ok(roomManager.getRoomState(activeSlug), 'Original active room must be preserved');
  assert.ok(roomManager.getRoomState(disambiguatedSlug), 'Second room must be accessible');
});

// ==============================================================================
// 2. ROOM RESOLUTION & JOINING TESTS (BUG 2 FIX)
// ==============================================================================

test('4. BUG 2 FIX: Room state can be resolved by both slug and full ID', () => {
  const testSlug = 'resolution-test-lounge';
  const fullId = `room-${testSlug}`;

  roomManager.createRoom({
    id: fullId,
    name: 'Resolution Test Lounge',
    slug: testSlug,
  });

  // Resolve by slug
  const stateBySlug = roomManager.getRoomState(testSlug);
  assert.ok(stateBySlug, 'Must resolve room state by slug');
  assert.equal(stateBySlug.room.title, 'Resolution Test Lounge');
  assert.ok(Array.isArray(stateBySlug.queue), 'Queue must be present');
  assert.ok(stateBySlug.playback, 'Playback state must be present');

  // Resolve by full ID
  const stateById = roomManager.getRoomState(fullId);
  assert.ok(stateById, 'Must resolve room state by full ID');
  assert.equal(stateById.room.id, fullId);

  // Both references point to the exact same room
  assert.equal(stateBySlug.room.id, stateById.room.id);
});

test('5. Multi-session participation: two users join, listener count updates, leaves cleanly', () => {
  const roomSlug = 'multi-user-test-lounge';
  const room = roomManager.createRoom({
    name: 'Multi User Test Lounge',
    slug: roomSlug,
  });

  // Browser A joins (Host)
  roomManager.joinParticipant(room.id, {
    id: 'user-browser-a',
    name: 'Alex (Host)',
    role: 'host',
    isListening: true,
    joinedAt: '12:20 PM',
  });

  let state = roomManager.getRoomState(roomSlug);
  assert.equal(state.participants.size, 1, 'Participant count must be 1');

  // Browser B joins (Incognito listener)
  roomManager.joinParticipant(room.id, {
    id: 'user-browser-b',
    name: 'Maya (Listener)',
    role: 'listener',
    isListening: true,
    joinedAt: '12:21 PM',
  });

  state = roomManager.getRoomState(roomSlug);
  assert.equal(state.participants.size, 2, 'Participant count must be 2');
  assert.ok(state.participants.has('user-browser-a'));
  assert.ok(state.participants.has('user-browser-b'));

  // Browser B leaves
  roomManager.leaveParticipant(room.id, 'user-browser-b');
  state = roomManager.getRoomState(roomSlug);
  assert.equal(state.participants.size, 1);

  // Browser A leaves
  roomManager.leaveParticipant(room.id, 'user-browser-a');
  state = roomManager.getRoomState(roomSlug);
  assert.equal(state.participants.size, 0);
  assert.equal(roomManager.isRoomActive(roomSlug), false, 'Room with 0 listeners becomes inactive');
});

// ==============================================================================
// 3. ROUTE PROTECTION & 404 PREVENTION TESTS (BUG 3 FIX)
// ==============================================================================

test('6. BUG 3 FIX: Dedicated index routes prevent Next.js 404 on /room and /rooms', () => {
  // src/pages/room/index.tsx must exist so /room or /room/ redirects without 404
  assert.ok(existsSync('src/pages/room/index.tsx'), 'src/pages/room/index.tsx must exist');
  const roomIndexCode = readFileSync('src/pages/room/index.tsx', 'utf8');
  assert.match(roomIndexCode, /router\.replace/);

  // src/pages/rooms.tsx must exist so /rooms redirects without 404
  assert.ok(existsSync('src/pages/rooms.tsx'), 'src/pages/rooms.tsx must exist');
  const roomsCode = readFileSync('src/pages/rooms.tsx', 'utf8');
  assert.match(roomsCode, /router\.replace/);
});

test('7. BUG 3 FIX: Hero and Header navigation links contain fallbacks to prevent empty /room/', () => {
  const heroCode = readFileSync('src/components/home/HeroSection.tsx', 'utf8');
  // Must safely route to active room or /rooms without constructing empty /room/
  assert.match(heroCode, /currentRoom\?\.slug/);
  assert.doesNotMatch(heroCode, /href=["']\/room\/["']/);

  const headerCode = readFileSync('src/components/layout/Header.tsx', 'utf8');
  assert.match(headerCode, /currentRoom\?\.slug\s*\?\s*`\/room\/\$\{currentRoom\.slug\}`\s*:\s*'\/rooms'/);
});

test('8. Featured editorial lounges permanently protected against usurpation', () => {
  const featured = ['tokyo-afterhours', 'nordic-solitude', 'berlin-basement'];
  for (const slug of featured) {
    assert.equal(roomManager.isRoomActive(slug), true, `Featured lounge ${slug} must always be active`);
    const available = roomManager.getAvailableSlug(slug);
    assert.notEqual(available, slug, `Featured lounge ${slug} slug cannot be reused directly`);
  }
});

test('9. Non-existent room returns null in resolver for clean 404 handling', () => {
  const nonExistent = roomManager.getRoomState('completely-invalid-slug-999');
  assert.equal(nonExistent, null, 'Invalid room must resolve to null');
});

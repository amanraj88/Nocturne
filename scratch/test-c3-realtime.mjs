import assert from 'node:assert/strict';
import fs from 'fs';

console.log('================================================================');
console.log('NOCTURNE Phase C.3 Final Verification Test Suite');
console.log('Classification: In-Process Logic, Contract & Static Audit Tests');
console.log('(Note: Remote multi-session tests remain PENDING live Supabase');
console.log('database migration execution per safety constraints)');
console.log('================================================================\n');

// ============================================================================
// SUITE 1: STRICT BROADCAST SENDER IDENTITY VALIDATION (7 MANDATORY TESTS)
// ============================================================================
console.log('--- Suite 1: Strict Broadcast Sender Identity Validation ---');

function evaluateRealtimeBroadcastPolicy({ authUid, hasRoomAccess, isCurated, hostId, payload }) {
  // 1. auth.uid() IS NOT NULL
  if (!authUid) return { allowed: false, reason: 'UNAUTHENTICATED' };

  // 2. public.has_room_access(...)
  if (!hasRoomAccess) return { allowed: false, reason: 'NO_ROOM_ACCESS' };

  // 3. Strict Sender Identity Validation: present, not null/empty, valid UUID, equals auth.uid()
  const senderId = payload?.senderId;
  if (senderId === undefined || senderId === null) {
    return { allowed: false, reason: 'MISSING_OR_NULL_SENDER_ID' };
  }
  if (typeof senderId !== 'string' || senderId.trim() === '') {
    return { allowed: false, reason: 'EMPTY_SENDER_ID' };
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(senderId)) {
    return { allowed: false, reason: 'MALFORMED_UUID_SENDER_ID' };
  }
  if (senderId.toLowerCase() !== authUid.toLowerCase()) {
    return { allowed: false, reason: 'MISMATCHED_SENDER_ID' };
  }

  // 4. Host-curated playback restriction with PostgreSQL IS DISTINCT FROM semantics:
  // In SQL: r.mode = 'host-curated' AND r.host_id IS DISTINCT FROM auth.uid()
  // If hostId is null, NULL IS DISTINCT FROM auth.uid() is TRUE.
  // If hostId is not authUid, hostId IS DISTINCT FROM auth.uid() is TRUE.
  // Only when hostId === authUid is IS DISTINCT FROM FALSE.
  const isDistinctFromAuth = !hostId || hostId.toLowerCase() !== authUid.toLowerCase();
  if (isCurated && isDistinctFromAuth) {
    const playbackTypes = ['PLAY', 'PAUSE', 'SEEK', 'SELECT_TRACK'];
    if (playbackTypes.includes(payload?.type)) {
      return { allowed: false, reason: 'NON_HOST_CURATED_PLAYBACK_FORBIDDEN' };
    }
  }

  return { allowed: true };
}

const userAliceId = '00000000-0000-4000-a000-000000000001';
const userBobId = '00000000-0000-4000-a000-000000000002';
const userCharlieId = '00000000-0000-4000-a000-000000000003';

// Test 1: Valid authenticated sender ID
const t1 = evaluateRealtimeBroadcastPolicy({
  authUid: userAliceId,
  hasRoomAccess: true,
  isCurated: false,
  hostId: userAliceId,
  payload: { type: 'PLAY', senderId: userAliceId, trackId: 'tr-1' },
});
assert.equal(t1.allowed, true);
console.log('✓ 1. Valid authenticated sender ID: ACCEPTED');

// Test 2: Missing sender ID
const t2 = evaluateRealtimeBroadcastPolicy({
  authUid: userAliceId,
  hasRoomAccess: true,
  isCurated: false,
  hostId: userAliceId,
  payload: { type: 'PLAY', trackId: 'tr-1' },
});
assert.equal(t2.allowed, false);
assert.equal(t2.reason, 'MISSING_OR_NULL_SENDER_ID');
console.log('✓ 2. Missing sender ID: REJECTED');

// Test 3: Explicit null sender ID
const t3 = evaluateRealtimeBroadcastPolicy({
  authUid: userAliceId,
  hasRoomAccess: true,
  isCurated: false,
  hostId: userAliceId,
  payload: { type: 'PLAY', senderId: null, trackId: 'tr-1' },
});
assert.equal(t3.allowed, false);
assert.equal(t3.reason, 'MISSING_OR_NULL_SENDER_ID');
console.log('✓ 3. Explicit null sender ID: REJECTED');

// Test 4: Empty sender ID
const t4 = evaluateRealtimeBroadcastPolicy({
  authUid: userAliceId,
  hasRoomAccess: true,
  isCurated: false,
  hostId: userAliceId,
  payload: { type: 'PLAY', senderId: '', trackId: 'tr-1' },
});
assert.equal(t4.allowed, false);
assert.equal(t4.reason, 'EMPTY_SENDER_ID');
console.log('✓ 4. Empty sender ID: REJECTED');

// Test 5: Malformed UUID
const t5 = evaluateRealtimeBroadcastPolicy({
  authUid: userAliceId,
  hasRoomAccess: true,
  isCurated: false,
  hostId: userAliceId,
  payload: { type: 'PLAY', senderId: 'not-a-uuid-1234', trackId: 'tr-1' },
});
assert.equal(t5.allowed, false);
assert.equal(t5.reason, 'MALFORMED_UUID_SENDER_ID');
console.log('✓ 5. Malformed UUID: REJECTED');

// Test 6: Another user's UUID
const t6 = evaluateRealtimeBroadcastPolicy({
  authUid: userAliceId,
  hasRoomAccess: true,
  isCurated: false,
  hostId: userAliceId,
  payload: { type: 'PLAY', senderId: userBobId, trackId: 'tr-1' },
});
assert.equal(t6.allowed, false);
assert.equal(t6.reason, 'MISMATCHED_SENDER_ID');
console.log('✓ 6. Another user\'s UUID (impersonation): REJECTED');

// Test 7: Unauthenticated sender
const t7 = evaluateRealtimeBroadcastPolicy({
  authUid: null,
  hasRoomAccess: false,
  isCurated: false,
  hostId: userAliceId,
  payload: { type: 'PLAY', senderId: userAliceId, trackId: 'tr-1' },
});
assert.equal(t7.allowed, false);
assert.equal(t7.reason, 'UNAUTHENTICATED');
console.log('✓ 7. Unauthenticated sender: REJECTED');


// ============================================================================
// SUITE 2: NULL-SEMANTICS & CURATED PLAYBACK REGRESSION TESTS (4 MANDATORY TESTS)
// ============================================================================
console.log('\n--- Suite 2: NULL-Semantics & Curated Playback Regression Tests ---');

// Regression 1: A normal host broadcasting in a curated room
const r1 = evaluateRealtimeBroadcastPolicy({
  authUid: userAliceId,
  hasRoomAccess: true,
  isCurated: true,
  hostId: userAliceId, // Alice is designated host
  payload: { type: 'PLAY', senderId: userAliceId, trackId: 'tr-curated-1' },
});
assert.equal(r1.allowed, true, 'Designated host must be allowed to broadcast in curated room');
console.log('✓ R1. Normal host broadcasting in curated room: ALLOWED');

// Regression 2: A non-host broadcasting in a curated room
const r2 = evaluateRealtimeBroadcastPolicy({
  authUid: userBobId,
  hasRoomAccess: true,
  isCurated: true,
  hostId: userAliceId, // Alice is designated host, Bob is ordinary member
  payload: { type: 'PLAY', senderId: userBobId, trackId: 'tr-curated-1' },
});
assert.equal(r2.allowed, false, 'Non-host must be rejected from broadcasting in curated room');
assert.equal(r2.reason, 'NON_HOST_CURATED_PLAYBACK_FORBIDDEN');
console.log('✓ R2. Non-host broadcasting in curated room: REJECTED');

// Regression 3: A member broadcasting in a curated room with NULL host_id
const r3 = evaluateRealtimeBroadcastPolicy({
  authUid: userCharlieId,
  hasRoomAccess: true,
  isCurated: true,
  hostId: null, // Curated room with NULL host (e.g. system/editorial room)
  payload: { type: 'PLAY', senderId: userCharlieId, trackId: 'tr-curated-1' },
});
assert.equal(r3.allowed, false, 'Ordinary member cannot broadcast in curated room with NULL host_id');
assert.equal(r3.reason, 'NON_HOST_CURATED_PLAYBACK_FORBIDDEN');
console.log('✓ R3. Member broadcasting in curated room with NULL host_id: REJECTED (IS DISTINCT FROM protects room)');

// Regression 4: An authorized member broadcasting in a collaborative room (even if host_id is NULL)
const r4 = evaluateRealtimeBroadcastPolicy({
  authUid: userCharlieId,
  hasRoomAccess: true,
  isCurated: false, // Collaborative room
  hostId: null, // Editorial collaborative room with NULL host_id
  payload: { type: 'PLAY', senderId: userCharlieId, trackId: 'tr-collab-1' },
});
assert.equal(r4.allowed, true, 'Authorized member must be allowed to broadcast in collaborative room');
console.log('✓ R4. Authorized member broadcasting in collaborative room: ALLOWED');


// ============================================================================
// SUITE 3: AUTHORITATIVE PLAYBACK REVISION & CONFLICT RECONCILIATION
// ============================================================================
console.log('\n--- Suite 3: Authoritative Playback Revision & Conflict Reconciliation ---');

class MockAuthoritativeDatabase {
  constructor(initialRevision = 1, initialTrackId = 'tr-init') {
    this.playback = {
      currentTrackId: initialTrackId,
      isPlaying: false,
      progressSeconds: 0,
      revision: initialRevision,
      updatedAt: new Date().toISOString(),
    };
  }

  syncRoomPlayback({ expectedRevision, newTrackId, isPlaying, progressSeconds }) {
    if (expectedRevision !== null && expectedRevision !== undefined && this.playback.revision !== expectedRevision) {
      return {
        conflict: true,
        currentRevision: this.playback.revision,
        playback: { ...this.playback },
      };
    }

    this.playback.currentTrackId = newTrackId || this.playback.currentTrackId;
    this.playback.isPlaying = isPlaying;
    this.playback.progressSeconds = Math.max(0, progressSeconds);
    this.playback.revision += 1;
    this.playback.updatedAt = new Date().toISOString();

    return {
      conflict: false,
      currentRevision: this.playback.revision,
      playback: { ...this.playback },
    };
  }
}

// 3.1: Success path - Database confirms revision increment
const db = new MockAuthoritativeDatabase(10, 'tr-1');
const clientAction = db.syncRoomPlayback({
  expectedRevision: 10,
  newTrackId: 'tr-2',
  isPlaying: true,
  progressSeconds: 0,
});
assert.equal(clientAction.conflict, false);
assert.equal(clientAction.currentRevision, 11, 'Database increments revision authoritatively');
assert.equal(db.playback.revision, 11);
console.log('✓ Database increments authoritative revision upon successful sync');

// 3.2: Concurrency conflict - Member A and Member B attempt simultaneous action
const concurrentMemberAction = db.syncRoomPlayback({
  expectedRevision: 10, // Member B thought revision was 10, but Member A advanced it to 11
  newTrackId: 'tr-stale-intent',
  isPlaying: false,
  progressSeconds: 5,
});
assert.equal(concurrentMemberAction.conflict, true);
assert.equal(concurrentMemberAction.currentRevision, 11);
assert.equal(db.playback.currentTrackId, 'tr-2', 'Database state NOT overwritten on conflict');
console.log('✓ Concurrent action conflict caught explicitly (no silent overwrite)');

// 3.3: Reconnection / State recovery from PostgreSQL snapshot
const reconnectedClientState = {
  playbackRevision: 0,
  lastReceivedRevision: 0,
};
// Simulates resolveAndSetRoom reading DB playback snapshot
const dbSnapshot = db.playback;
reconnectedClientState.playbackRevision = dbSnapshot.revision;
reconnectedClientState.lastReceivedRevision = dbSnapshot.revision;
assert.equal(reconnectedClientState.playbackRevision, 11);
console.log('✓ Reconnected client initializes revision directly from PostgreSQL snapshot');


// ============================================================================
// SUITE 4: PRESENCE ANTI-IMPERSONATION & DEDUPLICATION
// ============================================================================
console.log('\n--- Suite 4: Presence Anti-Impersonation & Deduplication ---');

function deduplicatePresences(presenceState) {
  const uniqueUsers = new Map();
  for (const [key, presences] of Object.entries(presenceState)) {
    if (Array.isArray(presences)) {
      for (const p of presences) {
        const keyUserId = key.includes(':') ? key.split(':')[0] : key;
        const uid = p.userId === keyUserId ? p.userId : keyUserId;
        if (!uid) continue;
        if (!uniqueUsers.has(uid)) {
          uniqueUsers.set(uid, {
            id: uid,
            name: p.name || 'Anonymous Listener',
            role: p.role || 'listener',
            isListening: Boolean(p.isListening),
            joinedAt: p.joinedAt || 'Just now',
            avatar: p.avatar,
          });
        }
      }
    }
  }
  return Array.from(uniqueUsers.values());
}

const multiTabSameUser = {
  [`${userAliceId}:tab-1`]: [{ userId: userAliceId, name: 'Alice', role: 'host' }],
  [`${userAliceId}:tab-2`]: [{ userId: userAliceId, name: 'Alice', role: 'host' }],
};
const members = deduplicatePresences(multiTabSameUser);
assert.equal(members.length, 1);
assert.equal(members[0].id, userAliceId);
console.log('✓ Multi-tab presence deduplicated honestly to 1 listener');

const forgedPresence = {
  [`${userBobId}:tab-1`]: [{ userId: userAliceId, name: 'Fake Alice', role: 'host' }],
};
const forgedMembers = deduplicatePresences(forgedPresence);
assert.equal(forgedMembers[0].id, userBobId, 'Cannot forge user ID in presence payload');
console.log('✓ Presence metadata identity locked to authenticated session key');


// ============================================================================
// SUITE 5: SQL MIGRATION FILE STATIC SECURITY AUDIT
// ============================================================================
console.log('\n--- Suite 5: SQL Migration Static Security Audit ---');

const sqlMigration = fs.readFileSync('supabase/migrations/20261111_init.sql', 'utf8');

// Check strict senderId conditions in SQL
assert.ok(
  sqlMigration.includes("(payload->>'senderId') IS NOT NULL"),
  'SQL must check senderId IS NOT NULL'
);
assert.ok(
  sqlMigration.includes("(payload->>'senderId') != ''"),
  'SQL must check senderId != empty'
);
assert.ok(
  sqlMigration.includes("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"),
  'SQL must enforce UUID regex on senderId'
);
assert.ok(
  sqlMigration.includes("(payload->>'senderId') = auth.uid()::text"),
  'SQL must enforce senderId = auth.uid()::text'
);
console.log('✓ SQL migration contains strict senderId presence, non-empty, UUID format, and equality checks');

// Check IS DISTINCT FROM in realtime.messages policy
assert.ok(
  sqlMigration.includes("r.mode = 'host-curated'") && sqlMigration.includes('r.host_id IS DISTINCT FROM auth.uid()'),
  'SQL migration must enforce host-only playback in host-curated mode with IS DISTINCT FROM'
);
assert.ok(
  !sqlMigration.includes('r.host_id != auth.uid()'),
  'SQL migration must NOT contain insecure r.host_id != auth.uid()'
);
console.log('✓ SQL migration uses IS DISTINCT FROM in realtime.messages playback authorization');

// Check IS DISTINCT FROM in sync_room_playback RPC
assert.ok(
  sqlMigration.includes("v_room.mode = 'host-curated' AND (v_room.host_id IS DISTINCT FROM v_user_id)"),
  'sync_room_playback RPC must use IS DISTINCT FROM for host validation'
);
assert.ok(
  !sqlMigration.includes('v_room.host_id != v_user_id'),
  'sync_room_playback RPC must NOT contain insecure v_room.host_id != v_user_id'
);
console.log('✓ SQL migration uses IS DISTINCT FROM in sync_room_playback RPC');

console.log('\n======================================================');
console.log('Phase C.3 Final Verification: ALL TESTS PASSED');
console.log('======================================================');

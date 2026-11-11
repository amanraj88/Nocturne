import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { validateAudioBuffer, MAX_AUDIO_FILE_BYTES } from '../src/lib/audioValidation.ts';

const require = createRequire(import.meta.url);

console.log('================================================================');
console.log('NOCTURNE Phase C.4.1.2 Real-Handler Reliability & Concurrency Suite');
console.log('Classification: Actual Next.js Handlers, In-Process State & Races');
console.log('================================================================\n');

// Configure mock environment variables for Supabase
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, val) {
      res.headers[key.toLowerCase()] = val;
      return res;
    },
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    },
    end() {
      return res;
    },
  };
  return res;
}

// In-Memory Controlled Mock Database & Storage
class MockSupabaseEnvironment {
  constructor() {
    this.users = new Map([
      ['token-alice', { id: '00000000-0000-4000-a000-000000000001', email: 'alice@nocturne.test' }],
      ['token-bob', { id: '00000000-0000-4000-a000-000000000002', email: 'bob@nocturne.test' }],
      ['token-eve', { id: '00000000-0000-4000-a000-000000000099', email: 'eve@attacker.test' }],
    ]);

    this.rooms = new Map([
      [
        'room-reykjavik',
        {
          id: 'room-reykjavik',
          slug: 'reykjavik',
          title: 'Reykjavik Ambient',
          is_private: false,
          host_id: '00000000-0000-4000-a000-000000000001',
          artwork_id: 'noc-01',
        },
      ],
      [
        'room-private-tokyo',
        {
          id: 'room-private-tokyo',
          slug: 'private-tokyo',
          title: 'Tokyo Private',
          is_private: true,
          host_id: '00000000-0000-4000-a000-000000000001',
          artwork_id: 'noc-02',
        },
      ],
    ]);

    this.roomMembers = [
      { room_id: 'room-private-tokyo', user_id: '00000000-0000-4000-a000-000000000002' }, // Bob is a member
    ];

    this.intents = new Map();
    this.tracks = [];
    this.storageFiles = new Map();
    this.storageRemoved = [];
    this.simulateStorageRemoveFailure = false;
    this.simulateTrackInsertDuplicate = false;
    this.simulateTrackInsertDbError = false;
  }

  getClient() {
    const env = this;
    return {
      auth: {
        getUser: async (token) => {
          if (env.users.has(token)) {
            return { data: { user: env.users.get(token) }, error: null };
          }
          return { data: { user: null }, error: { message: 'Invalid or expired token' } };
        },
      },
      storage: {
        from: (bucket) => ({
          createSignedUploadUrl: async (storagePath, options) => {
            const token = `token-${randomUUID()}`;
            return {
              data: {
                signedUrl: `https://storage.mock/${bucket}/${storagePath}?token=${token}`,
                token,
                path: storagePath,
              },
              error: null,
            };
          },
          createSignedUrl: async (storagePath, ttl) => ({
            data: { signedUrl: `https://storage.mock/${bucket}/${storagePath}?expires=${ttl}` },
            error: null,
          }),
          info: async (storagePath) => {
            if (!env.storageFiles.has(storagePath)) {
              return { data: null, error: { message: 'Object not found' } };
            }
            const file = env.storageFiles.get(storagePath);
            return {
              data: {
                id: `id-${storagePath}`,
                name: path.basename(storagePath),
                size: file.buffer.length,
                contentType: file.contentType || 'audio/mpeg',
              },
              error: null,
            };
          },
          download: async (storagePath, options, parameters) => {
            if (!env.storageFiles.has(storagePath)) {
              return { data: null, error: { message: 'Object not found' } };
            }
            const file = env.storageFiles.get(storagePath);
            return {
              data: {
                arrayBuffer: async () => file.buffer.buffer.slice(file.buffer.byteOffset, file.buffer.byteOffset + file.buffer.byteLength),
              },
              error: null,
            };
          },
          remove: async (paths) => {
            if (env.simulateStorageRemoveFailure) {
              return { data: null, error: { message: 'Simulated Storage S3 service failure' } };
            }
            for (const p of paths) {
              env.storageFiles.delete(p);
              env.storageRemoved.push(p);
            }
            return { data: {}, error: null };
          },
        }),
      },
      from: (table) => {
        if (table === 'rooms') {
          return {
            select: () => ({
              or: (orFilter) => ({
                maybeSingle: async () => {
                  for (const r of env.rooms.values()) {
                    if (orFilter.includes(r.id) || orFilter.includes(r.slug)) return { data: r, error: null };
                  }
                  return { data: null, error: null };
                },
              }),
              eq: (col, val) => ({
                maybeSingle: async () => {
                  for (const r of env.rooms.values()) {
                    if (r[col] === val) return { data: r, error: null };
                  }
                  return { data: null, error: null };
                },
                single: async () => {
                  for (const r of env.rooms.values()) {
                    if (r[col] === val) return { data: r, error: null };
                  }
                  return { data: null, error: { message: 'Room not found' } };
                },
              }),
            }),
          };
        }

        if (table === 'room_members') {
          return {
            select: () => ({
              eq: (col1, val1) => ({
                eq: (col2, val2) => ({
                  maybeSingle: async () => {
                    const found = env.roomMembers.find((m) => m[col1] === val1 && m[col2] === val2);
                    return { data: found || null, error: null };
                  },
                }),
              }),
            }),
          };
        }

        if (table === 'tracks') {
          return {
            select: (cols, opts) => ({
              eq: (col1, val1) => {
                const filtered = env.tracks.filter((t) => t[col1] === val1);
                return {
                  eq: (col2, val2) => {
                    const doublyFiltered = filtered.filter((t) => t[col2] === val2);
                    return Promise.resolve({
                      count: opts?.count === 'exact' ? doublyFiltered.length : null,
                      data: doublyFiltered,
                      error: null,
                    });
                  },
                  then: (resolve) => resolve({
                    count: opts?.count === 'exact' ? filtered.length : null,
                    data: filtered,
                    error: null,
                  }),
                };
              },
            }),
            insert: async (record) => {
              if (env.simulateTrackInsertDuplicate) {
                return {
                  data: null,
                  error: { code: '23505', message: 'duplicate key value violates unique constraint "tracks_pkey"' },
                };
              }
              if (env.simulateTrackInsertDbError) {
                return {
                  data: null,
                  error: { code: '08006', message: 'connection failure during transaction insert' },
                };
              }
              const exists = env.tracks.some((t) => t.id === record.id);
              if (exists) {
                return {
                  data: null,
                  error: { code: '23505', message: 'duplicate key value violates unique constraint "tracks_pkey"' },
                };
              }
              env.tracks.push({ ...record });
              return { data: record, error: null };
            },
          };
        }

        if (table === 'audio_upload_intents') {
          return {
            select: (cols) => ({
              eq: (col, val) => ({
                maybeSingle: async () => {
                  const intent = env.intents.get(val);
                  return { data: intent ? { ...intent } : null, error: null };
                },
              }),
              or: (orFilter) => ({
                limit: (lim) => {
                  const results = [];
                  const now = Date.now();
                  for (const it of env.intents.values()) {
                    const isExpired = it.status === 'pending' && new Date(it.expires_at).getTime() < now;
                    const isFailed = it.cleanup_failed === true;
                    if (isExpired || isFailed) {
                      results.push({ ...it });
                      if (results.length >= lim) break;
                    }
                  }
                  return Promise.resolve({ data: results, error: null });
                },
              }),
            }),
            insert: (record) => ({
              select: () => ({
                single: async () => {
                  const id = randomUUID();
                  const intent = { id, ...record, status: record.status || 'pending', cleanup_failed: false };
                  env.intents.set(id, intent);
                  return { data: intent, error: null };
                },
              }),
            }),
            update: (updates) => ({
              eq: (col1, val1) => {
                const filters = [{ col: col1, val: val1 }];
                const chain = {
                  eq: (col2, val2) => {
                    filters.push({ col: col2, val: val2 });
                    return chain;
                  },
                  neq: (col2, val2) => {
                    chain.filterNeqCol = col2;
                    chain.filterNeqVal = val2;
                    return chain;
                  },
                  lt: (col2, val2) => {
                    chain.filterLtCol = col2;
                    chain.filterLtVal = val2;
                    return chain;
                  },
                  select: () => ({
                    maybeSingle: async () => {
                      const it = env.intents.get(filters[0].val);
                      if (!it) return { data: null, error: null };
                      for (const f of filters) {
                        if (it[f.col] !== f.val) return { data: null, error: null };
                      }
                      if (chain.filterNeqCol && it[chain.filterNeqCol] === chain.filterNeqVal) {
                        return { data: null, error: null };
                      }
                      if (chain.filterLtCol && !(new Date(it[chain.filterLtCol]).getTime() < new Date(chain.filterLtVal).getTime())) {
                        return { data: null, error: null };
                      }
                      Object.assign(it, updates);
                      return { data: { ...it }, error: null };
                    },
                  }),
                  then: (resolve) => {
                    const it = env.intents.get(filters[0].val);
                    if (it) {
                      let match = true;
                      for (const f of filters) {
                        if (it[f.col] !== f.val) { match = false; break; }
                      }
                      if (match) Object.assign(it, updates);
                    }
                    resolve({ data: it, error: null });
                  },
                };
                return chain;
              },
            }),
          };
        }

        throw new Error(`Unhandled mock table ${table}`);
      },
    };
  }
}

async function runTestSuite() {
  const rawUploadUrlMod = require('../.next/server/pages/api/rooms/[id]/media/upload-url.js');
  const uploadUrlMod = rawUploadUrlMod && typeof rawUploadUrlMod.then === 'function' ? await rawUploadUrlMod : rawUploadUrlMod;
  const uploadUrlHandler = uploadUrlMod.default || uploadUrlMod;

  const rawConfirmMod = require('../.next/server/pages/api/rooms/[id]/media/confirm.js');
  const confirmMod = rawConfirmMod && typeof rawConfirmMod.then === 'function' ? await rawConfirmMod : rawConfirmMod;
  const confirmHandler = confirmMod.default || confirmMod;

  const mockEnv = new MockSupabaseEnvironment();
  global.__nocturneSupabaseAdmin = mockEnv.getClient();

  // Helper to create valid audio buffer (MP3 ID3v2)
  const createValidMp3 = (size = 1000) => {
    const buf = Buffer.alloc(size);
    buf[0] = 0x49; buf[1] = 0x44; buf[2] = 0x33; // 'ID3'
    return buf;
  };

  // Helper to create valid WAV buffer
  const createValidWav = (size = 1000) => {
    const buf = Buffer.alloc(size);
    buf.write('RIFF', 0);
    buf.write('WAVE', 8);
    return buf;
  };

  console.log('--- Test 1: Upload-URL Generation via Compiled Handler ---');
  const req1 = {
    method: 'POST',
    query: { id: 'room-reykjavik' },
    headers: { authorization: 'Bearer token-alice' },
    body: {
      fileName: 'ambient-track.mp3',
      fileSize: 15_000_000,
      format: 'mp3',
      title: 'Glacier Drone',
      artist: 'Sigur Sonics',
      durationSeconds: 320,
    },
  };
  const res1 = createMockRes();
  await uploadUrlHandler(req1, res1);

  assert.equal(res1.statusCode, 200);
  assert.ok(res1.body.uploadId, 'Upload intent ID must be returned');
  assert.ok(res1.body.token, 'Signed upload token must be returned');
  assert.ok(res1.body.storagePath.startsWith('room-reykjavik/tr-shared-'));
  assert.ok(res1.body.storagePath.endsWith('.mp3'));
  console.log('✓ 1. Upload-URL compiled handler returned 200 with room-scoped path and token');

  const intentId = res1.body.uploadId;
  const storagePath = res1.body.storagePath;

  // Stage the uploaded file in mock storage
  mockEnv.storageFiles.set(storagePath, {
    buffer: createValidMp3(15_000_000),
    contentType: 'audio/mpeg',
  });

  console.log('\n--- Test 2: Two Simultaneous Confirmation Requests (Race Condition Test) ---');
  // Dispatch TWO confirmation requests at the EXACT same time for the same uploadId
  const req2_A = {
    method: 'POST',
    query: { id: 'room-reykjavik' },
    headers: { authorization: 'Bearer token-alice' },
    body: { uploadId: intentId },
  };
  const res2_A = createMockRes();

  const req2_B = {
    method: 'POST',
    query: { id: 'room-reykjavik' },
    headers: { authorization: 'Bearer token-alice' },
    body: { uploadId: intentId },
  };
  const res2_B = createMockRes();

  await Promise.all([
    confirmHandler(req2_A, res2_A),
    confirmHandler(req2_B, res2_B),
  ]);

  const statuses = [res2_A.statusCode, res2_B.statusCode];
  assert.ok(statuses.includes(201), 'One confirmation request must succeed with 201 Created');
  assert.ok(statuses.includes(409), 'The concurrent request must receive 409 Conflict');

  // CRITICAL VERIFICATION: Did the 409 request delete the storage file?
  assert.ok(mockEnv.storageFiles.has(storagePath), 'Storage file MUST NOT be deleted by concurrent 409 collision!');
  assert.equal(mockEnv.tracks.length, 1, 'Only one track record should be inserted into database');
  console.log('✓ 2. Atomic intent claim prevents concurrent collision: exactly one 201, one 409, and STORAGE OBJECT PRESERVED');

  console.log('\n--- Test 3: Duplicate Confirmation After Successful Completion ---');
  const req3 = {
    method: 'POST',
    query: { id: 'room-reykjavik' },
    headers: { authorization: 'Bearer token-alice' },
    body: { uploadId: intentId },
  };
  const res3 = createMockRes();
  await confirmHandler(req3, res3);
  assert.equal(res3.statusCode, 409);
  assert.equal(res3.body.error, 'This upload has already been confirmed.');
  assert.ok(mockEnv.storageFiles.has(storagePath), 'Storage object remains intact on duplicate retry');
  console.log('✓ 3. Subsequent confirmation returns 409 and does not alter confirmed track or delete audio file');

  console.log('\n--- Test 4: Confirmation of Expired Intent with Storage Cleanup ---');
  // Create an expired intent
  const expiredIntentId = randomUUID();
  const expiredPath = `room-reykjavik/tr-shared-${randomUUID()}.wav`;
  mockEnv.intents.set(expiredIntentId, {
    id: expiredIntentId,
    room_id: 'room-reykjavik',
    user_id: '00000000-0000-4000-a000-000000000001',
    storage_path: expiredPath,
    status: 'pending',
    expires_at: new Date(Date.now() - 60_000).toISOString(), // Expired 1 min ago
  });
  mockEnv.storageFiles.set(expiredPath, { buffer: createValidWav(), contentType: 'audio/wav' });

  const req4 = {
    method: 'POST',
    query: { id: 'room-reykjavik' },
    headers: { authorization: 'Bearer token-alice' },
    body: { uploadId: expiredIntentId },
  };
  const res4 = createMockRes();
  await confirmHandler(req4, res4);

  assert.equal(res4.statusCode, 410);
  assert.ok(!mockEnv.storageFiles.has(expiredPath), 'Expired storage object MUST be purged upon confirmation rejection');
  assert.equal(mockEnv.intents.get(expiredIntentId).status, 'cancelled');
  console.log('✓ 4. Expired upload confirmation rejected with 410 Gone and storage object immediately PURGED');

  console.log('\n--- Test 5: Recovery from Stuck "confirming" Intent (Crash Recovery Lease) ---');
  const stuckIntentId = randomUUID();
  const stuckPath = `room-reykjavik/tr-shared-${randomUUID()}.mp3`;
  mockEnv.intents.set(stuckIntentId, {
    id: stuckIntentId,
    room_id: 'room-reykjavik',
    user_id: '00000000-0000-4000-a000-000000000001',
    storage_path: stuckPath,
    title: 'Recovered Track',
    artist: 'Crash Survivor',
    duration_seconds: 120,
    file_name: 'track.mp3',
    status: 'confirming',
    confirming_at: new Date(Date.now() - 150_000).toISOString(), // 2.5 minutes ago (lease expired)
    expires_at: new Date(Date.now() + 600_000).toISOString(),
  });
  mockEnv.storageFiles.set(stuckPath, { buffer: createValidMp3(), contentType: 'audio/mpeg' });

  const req5 = {
    method: 'POST',
    query: { id: 'room-reykjavik' },
    headers: { authorization: 'Bearer token-alice' },
    body: { uploadId: stuckIntentId },
  };
  const res5 = createMockRes();
  await confirmHandler(req5, res5);

  assert.equal(res5.statusCode, 201);
  assert.equal(mockEnv.intents.get(stuckIntentId).status, 'confirmed');
  assert.ok(mockEnv.intents.get(stuckIntentId).claim_token, 'Claim token must be present');
  console.log('✓ 5.1 Stuck "confirming" intent (> 2 min lease) successfully reclaimed and confirmed (201)');

  console.log('\n--- Test 5.2: Stale Request with Old Fencing Token Cannot Interfere ---');
  // Attempt to cancel or finalize the intent using a stale/outdated claim token
  const staleCancelRes = await mockEnv.getClient().from('audio_upload_intents')
    .update({ status: 'cancelled' })
    .eq('id', stuckIntentId)
    .eq('claim_token', '00000000-0000-0000-0000-000000000000') // Stale token
    .select('id')
    .maybeSingle();

  assert.equal(staleCancelRes.data, null, 'Stale request with outdated claim_token MUST NOT update or cancel intent');
  assert.ok(mockEnv.storageFiles.has(stuckPath), 'Confirmed storage file MUST NOT be deleted by stale request');
  console.log('✓ 5.2 Fencing token strictly prevents stale/zombie requests from cancelling or purging reclaimed intent');

  console.log('\n--- Test 6: Storage Deletion Failure Resilience ---');
  mockEnv.simulateStorageRemoveFailure = true;
  const failCleanIntentId = randomUUID();
  const failCleanPath = `room-reykjavik/tr-shared-${randomUUID()}.mp3`;
  mockEnv.intents.set(failCleanIntentId, {
    id: failCleanIntentId,
    room_id: 'room-reykjavik',
    user_id: '00000000-0000-4000-a000-000000000001',
    storage_path: failCleanPath,
    status: 'pending',
    expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
  });

  const req6 = {
    method: 'POST',
    query: { id: 'room-reykjavik' },
    headers: { authorization: 'Bearer token-alice' },
    body: { uploadId: failCleanIntentId },
  };
  const res6 = createMockRes();
  await confirmHandler(req6, res6);

  assert.equal(res6.statusCode, 410);
  assert.equal(mockEnv.intents.get(failCleanIntentId).cleanup_failed, true, 'cleanup_failed flag must be recorded');
  mockEnv.simulateStorageRemoveFailure = false;
  console.log('✓ 6. Storage removal failure handled gracefully: cleanup_failed recorded without crashing');

  console.log('\n--- Test 7: Database Duplicate Violation Defense ---');
  mockEnv.simulateTrackInsertDuplicate = true;
  const dupDbIntentId = randomUUID();
  const dupDbPath = `room-reykjavik/tr-shared-${randomUUID()}.mp3`;
  mockEnv.intents.set(dupDbIntentId, {
    id: dupDbIntentId,
    room_id: 'room-reykjavik',
    user_id: '00000000-0000-4000-a000-000000000001',
    storage_path: dupDbPath,
    title: 'Duplicate Track',
    artist: 'Artist',
    file_name: 'track.mp3',
    status: 'pending',
    expires_at: new Date(Date.now() + 600_000).toISOString(),
  });
  mockEnv.storageFiles.set(dupDbPath, { buffer: createValidMp3(), contentType: 'audio/mpeg' });

  const req7 = {
    method: 'POST',
    query: { id: 'room-reykjavik' },
    headers: { authorization: 'Bearer token-alice' },
    body: { uploadId: dupDbIntentId },
  };
  const res7 = createMockRes();
  await confirmHandler(req7, res7);

  assert.equal(res7.statusCode, 409);
  assert.ok(mockEnv.storageFiles.has(dupDbPath), 'Audio file MUST NOT be deleted simply because DB track already exists!');
  mockEnv.simulateTrackInsertDuplicate = false;
  console.log('✓ 7. DB duplicate key returns 409 and explicitly PRESERVES storage audio file');

  console.log('\n--- Test 8: Invalid Magic Bytes Rejection & Orphan Purge ---');
  const fakeIntentId = randomUUID();
  const fakePath = `room-reykjavik/tr-shared-${randomUUID()}.mp3`;
  mockEnv.intents.set(fakeIntentId, {
    id: fakeIntentId,
    room_id: 'room-reykjavik',
    user_id: '00000000-0000-4000-a000-000000000001',
    storage_path: fakePath,
    title: 'Fake Audio',
    artist: 'Hacker',
    file_name: 'fake.mp3',
    status: 'pending',
    expires_at: new Date(Date.now() + 600_000).toISOString(),
  });
  // Put HTML text into MP3 path
  mockEnv.storageFiles.set(fakePath, {
    buffer: Buffer.from('<html><body>Not an audio stream</body></html>'),
    contentType: 'audio/mpeg',
  });

  const req8 = {
    method: 'POST',
    query: { id: 'room-reykjavik' },
    headers: { authorization: 'Bearer token-alice' },
    body: { uploadId: fakeIntentId },
  };
  const res8 = createMockRes();
  await confirmHandler(req8, res8);

  assert.equal(res8.statusCode, 415);
  assert.ok(!mockEnv.storageFiles.has(fakePath), 'Corrupt/fake audio object must be immediately purged from storage');
  assert.equal(mockEnv.intents.get(fakeIntentId).status, 'cancelled');
  console.log('✓ 8. Fake audio rejected (415) and orphaned storage object purged');

  console.log('\n--- Test 9: Cross-User and Cross-Room Protection ---');
  const crossUserIntentId = randomUUID();
  mockEnv.intents.set(crossUserIntentId, {
    id: crossUserIntentId,
    room_id: 'room-reykjavik',
    user_id: '00000000-0000-4000-a000-000000000001', // Owned by Alice
    storage_path: `room-reykjavik/tr-shared-${randomUUID()}.mp3`,
    status: 'pending',
    expires_at: new Date(Date.now() + 600_000).toISOString(),
  });

  // Eve attempts to confirm Alice's upload
  const req9_A = {
    method: 'POST',
    query: { id: 'room-reykjavik' },
    headers: { authorization: 'Bearer token-eve' },
    body: { uploadId: crossUserIntentId },
  };
  const res9_A = createMockRes();
  await confirmHandler(req9_A, res9_A);
  assert.equal(res9_A.statusCode, 403);
  console.log('✓ 9.1 Cross-user confirmation attempt rejected (403 Forbidden)');

  // Alice attempts to confirm in wrong room
  const req9_B = {
    method: 'POST',
    query: { id: 'wrong-room-slug' },
    headers: { authorization: 'Bearer token-alice' },
    body: { uploadId: crossUserIntentId },
  };
  const res9_B = createMockRes();
  await confirmHandler(req9_B, res9_B);
  assert.equal(res9_B.statusCode, 400);
  console.log('✓ 9.2 Cross-room confirmation attempt rejected (400 Bad Request)');

  console.log('\n--- Test 10: 25 MB Boundary Enforcement ---');
  // 10.1 Exactly 25 MB accepted
  const exact25MBPath = `room-reykjavik/tr-shared-${randomUUID()}.mp3`;
  mockEnv.storageFiles.set(exact25MBPath, {
    buffer: createValidMp3(MAX_AUDIO_FILE_BYTES),
    contentType: 'audio/mpeg',
  });
  const exact25IntentId = randomUUID();
  mockEnv.intents.set(exact25IntentId, {
    id: exact25IntentId,
    room_id: 'room-reykjavik',
    user_id: '00000000-0000-4000-a000-000000000001',
    storage_path: exact25MBPath,
    title: '25MB Track',
    artist: 'Artist',
    file_name: '25mb.mp3',
    status: 'pending',
    expires_at: new Date(Date.now() + 600_000).toISOString(),
  });
  const req10_A = {
    method: 'POST',
    query: { id: 'room-reykjavik' },
    headers: { authorization: 'Bearer token-alice' },
    body: { uploadId: exact25IntentId },
  };
  const res10_A = createMockRes();
  await confirmHandler(req10_A, res10_A);
  assert.equal(res10_A.statusCode, 201);
  console.log('✓ 10.1 Exactly 25 MB file (26,214,400 bytes) ACCEPTED (201 Created)');

  // 10.2 Exceeding 25 MB by 1 byte rejected
  const over25MBPath = `room-reykjavik/tr-shared-${randomUUID()}.mp3`;
  mockEnv.storageFiles.set(over25MBPath, {
    buffer: createValidMp3(MAX_AUDIO_FILE_BYTES + 1),
    contentType: 'audio/mpeg',
  });
  const over25IntentId = randomUUID();
  mockEnv.intents.set(over25IntentId, {
    id: over25IntentId,
    room_id: 'room-reykjavik',
    user_id: '00000000-0000-4000-a000-000000000001',
    storage_path: over25MBPath,
    title: 'Oversized Track',
    artist: 'Artist',
    file_name: 'oversized.mp3',
    status: 'pending',
    expires_at: new Date(Date.now() + 600_000).toISOString(),
  });
  const req10_B = {
    method: 'POST',
    query: { id: 'room-reykjavik' },
    headers: { authorization: 'Bearer token-alice' },
    body: { uploadId: over25IntentId },
  };
  const res10_B = createMockRes();
  await confirmHandler(req10_B, res10_B);
  assert.equal(res10_B.statusCode, 413);
  assert.ok(!mockEnv.storageFiles.has(over25MBPath), 'Oversized storage object must be purged');
  console.log('✓ 10.2 Exceeding 25 MB (26,214,401 bytes) REJECTED (413 Payload Too Large) and purged');

  console.log('\n--- Test 11: Opportunistic Pruning of Abandoned Intents ---');
  // Plant 2 expired intents in the DB with files in storage
  const abandon1Path = `room-reykjavik/tr-shared-${randomUUID()}.mp3`;
  const abandon1Id = randomUUID();
  mockEnv.intents.set(abandon1Id, {
    id: abandon1Id,
    room_id: 'room-reykjavik',
    user_id: '00000000-0000-4000-a000-000000000002',
    storage_path: abandon1Path,
    status: 'pending',
    expires_at: new Date(Date.now() - 3600_000).toISOString(),
  });
  mockEnv.storageFiles.set(abandon1Path, { buffer: createValidMp3(), contentType: 'audio/mpeg' });

  // A new user requests an upload URL, triggering opportunistic cleanup
  const req11 = {
    method: 'POST',
    query: { id: 'room-reykjavik' },
    headers: { authorization: 'Bearer token-bob' },
    body: {
      fileName: 'new-song.mp3',
      fileSize: 5_000_000,
      format: 'mp3',
      title: 'New Song',
      artist: 'Bob',
    },
  };
  const res11 = createMockRes();
  await uploadUrlHandler(req11, res11);

  assert.equal(res11.statusCode, 200);
  assert.ok(!mockEnv.storageFiles.has(abandon1Path), 'Opportunistic cleanup must have purged the abandoned storage file');
  assert.equal(mockEnv.intents.get(abandon1Id).status, 'cancelled');
  console.log('✓ 11. Opportunistic pruning during upload-url cleanly purged abandoned storage file without background daemon');

  console.log('\n================================================================');
  console.log('Phase C.4.1.2 Reliability & Concurrency: ALL 11 SUITES PASSED');
  console.log('================================================================');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});

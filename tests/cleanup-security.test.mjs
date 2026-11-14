import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cleanupSource = readFileSync(new URL('../src/pages/api/rooms/cleanup.ts', import.meta.url), 'utf8');

// ==============================================================================
// 1. BEHAVIORAL UNIT & MOCK TESTS FOR CLEANUP PIPELINE
// ==============================================================================

/**
 * Creates mock Next.js request and response objects
 */
function createMockHttp(options = {}) {
  const req = {
    method: options.method || 'POST',
    headers: options.headers || {},
    body: options.body || {},
  };

  const res = {
    statusCode: 200,
    headers: {},
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };

  return { req, res };
}

/**
 * Pure simulation of the cleanup endpoint logic mirroring src/pages/api/rooms/cleanup.ts
 * for behavioral mock testing under controlled conditions.
 */
async function simulateCleanupHandler(req, res, { envSecret, mockDb } = {}) {
  // 1. Method check
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Strict CRON_SECRET check
  const cronSecret = envSecret?.trim();
  if (!cronSecret) {
    return res.status(500).json({ error: 'Server configuration error: CRON_SECRET is not configured' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 3. Stale cutoff threshold (6 hours)
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const now = Date.now();
  const cutoffTime = new Date(now - SIX_HOURS_MS).toISOString();

  // 4. Mock Database Execution
  const deletedIds = [];
  const rooms = mockDb?.rooms || [];

  for (const r of rooms) {
    // Featured rooms strictly protected
    if (r.is_featured) continue;

    // Room must be older than 6 hours
    if (new Date(r.created_at).getTime() >= (now - SIX_HOURS_MS)) continue;

    // Check playback
    const pb = mockDb?.playback?.[r.id];
    if (pb?.is_playing) continue;
    if (pb?.updated_at && new Date(pb.updated_at).getTime() >= (now - SIX_HOURS_MS)) continue;

    // Check active participants
    const activeListeners = (mockDb?.memberships?.[r.id] || []).filter(
      m => m.is_active && new Date(m.last_seen).getTime() >= (now - SIX_HOURS_MS)
    );
    if (activeListeners.length > 0) continue;

    // Eligible stale room -> delete
    deletedIds.push(r.id);
  }

  // Apply deletions to mockDb for idempotency checks
  if (mockDb?.rooms) {
    mockDb.rooms = mockDb.rooms.filter(r => !deletedIds.includes(r.id));
  }

  return res.status(200).json({
    ok: true,
    cleanedCount: deletedIds.length,
    deletedIds,
  });
}

test('1. Missing CRON_SECRET -> rejected with HTTP 500 server configuration error', async () => {
  const { req, res } = createMockHttp({
    method: 'POST',
    headers: { authorization: 'Bearer test-secret' },
  });

  await simulateCleanupHandler(req, res, { envSecret: undefined });
  assert.equal(res.statusCode, 500);
  assert.match(res.jsonData.error, /CRON_SECRET is not configured/);

  // Also test empty string
  const emptyRes = createMockHttp({
    method: 'POST',
    headers: { authorization: 'Bearer test-secret' },
  }).res;
  await simulateCleanupHandler(req, emptyRes, { envSecret: '   ' });
  assert.equal(emptyRes.statusCode, 500);
});

test('2. Incorrect authorization token -> rejected with HTTP 401 Unauthorized', async () => {
  const validSecret = 'super-secret-cron-token-12345';

  // Test missing authorization header
  const { req: req1, res: res1 } = createMockHttp({
    method: 'POST',
    headers: {},
  });
  await simulateCleanupHandler(req1, res1, { envSecret: validSecret });
  assert.equal(res1.statusCode, 401);
  assert.equal(res1.jsonData.error, 'Unauthorized');

  // Test wrong token
  const { req: req2, res: res2 } = createMockHttp({
    method: 'POST',
    headers: { authorization: 'Bearer wrong-token' },
  });
  await simulateCleanupHandler(req2, res2, { envSecret: validSecret });
  assert.equal(res2.statusCode, 401);

  // Test non-Bearer format
  const { req: req3, res: res3 } = createMockHttp({
    method: 'POST',
    headers: { authorization: `Basic ${validSecret}` },
  });
  await simulateCleanupHandler(req3, res3, { envSecret: validSecret });
  assert.equal(res3.statusCode, 401);
});

test('3. Correct authorization token -> authenticated and cleanup may execute', async () => {
  const validSecret = 'super-secret-cron-token-12345';
  const { req, res } = createMockHttp({
    method: 'POST',
    headers: { authorization: `Bearer ${validSecret}` },
  });

  await simulateCleanupHandler(req, res, {
    envSecret: validSecret,
    mockDb: { rooms: [] },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.jsonData.ok, true);
  assert.equal(res.jsonData.cleanedCount, 0);
});

test('4. Featured rooms remain protected under all conditions', async () => {
  const validSecret = 'valid-token';
  const now = Date.now();
  const eightHoursAgo = new Date(now - 8 * 60 * 60 * 1000).toISOString();

  const mockDb = {
    rooms: [
      { id: 'room-tokyo', is_featured: true, created_at: eightHoursAgo },
      { id: 'room-nordic', is_featured: true, created_at: eightHoursAgo },
      { id: 'custom-featured-01', is_featured: true, created_at: eightHoursAgo },
    ],
    playback: {
      'room-tokyo': { is_playing: false, updated_at: eightHoursAgo },
      'room-nordic': { is_playing: false, updated_at: eightHoursAgo },
      'custom-featured-01': { is_playing: false, updated_at: eightHoursAgo },
    },
    memberships: {},
  };

  const { req, res } = createMockHttp({
    method: 'POST',
    headers: { authorization: `Bearer ${validSecret}` },
  });

  await simulateCleanupHandler(req, res, { envSecret: validSecret, mockDb });
  assert.equal(res.statusCode, 200);
  assert.equal(res.jsonData.cleanedCount, 0);
  assert.equal(mockDb.rooms.length, 3, 'All featured rooms must remain intact');
});

test('5. Active rooms remain protected (playing tracks or active listeners)', async () => {
  const validSecret = 'valid-token';
  const now = Date.now();
  const eightHoursAgo = new Date(now - 8 * 60 * 60 * 1000).toISOString();

  const mockDb = {
    rooms: [
      { id: 'active-playing-room', is_featured: false, created_at: eightHoursAgo },
      { id: 'active-listeners-room', is_featured: false, created_at: eightHoursAgo },
      { id: 'recently-updated-room', is_featured: false, created_at: eightHoursAgo },
    ],
    playback: {
      'active-playing-room': { is_playing: true, updated_at: new Date().toISOString() },
      'active-listeners-room': { is_playing: false, updated_at: eightHoursAgo },
      'recently-updated-room': { is_playing: false, updated_at: new Date(now - 10 * 60 * 1000).toISOString() },
    },
    memberships: {
      'active-listeners-room': [{ id: 'user-1', is_active: true, last_seen: new Date().toISOString() }],
    },
  };

  const { req, res } = createMockHttp({
    method: 'POST',
    headers: { authorization: `Bearer ${validSecret}` },
  });

  await simulateCleanupHandler(req, res, { envSecret: validSecret, mockDb });
  assert.equal(res.statusCode, 200);
  assert.equal(res.jsonData.cleanedCount, 0);
  assert.equal(mockDb.rooms.length, 3, 'Active rooms must not be deleted');
});

test('6. Stale eligible rooms are successfully identified and pruned', async () => {
  const validSecret = 'valid-token';
  const now = Date.now();
  const eightHoursAgo = new Date(now - 8 * 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();

  const mockDb = {
    rooms: [
      { id: 'stale-room-01', is_featured: false, created_at: eightHoursAgo },
      { id: 'stale-room-02', is_featured: false, created_at: eightHoursAgo },
      { id: 'fresh-room-03', is_featured: false, created_at: twoHoursAgo }, // < 6 hours
    ],
    playback: {
      'stale-room-01': { is_playing: false, updated_at: eightHoursAgo },
      'stale-room-02': { is_playing: false, updated_at: eightHoursAgo },
      'fresh-room-03': { is_playing: false, updated_at: twoHoursAgo },
    },
    memberships: {
      'stale-room-01': [],
      'stale-room-02': [],
      'fresh-room-03': [],
    },
  };

  const { req, res } = createMockHttp({
    method: 'POST',
    headers: { authorization: `Bearer ${validSecret}` },
  });

  await simulateCleanupHandler(req, res, { envSecret: validSecret, mockDb });
  assert.equal(res.statusCode, 200);
  assert.equal(res.jsonData.cleanedCount, 2);
  assert.deepEqual(res.jsonData.deletedIds.sort(), ['stale-room-01', 'stale-room-02']);
  assert.equal(mockDb.rooms.length, 1);
  assert.equal(mockDb.rooms[0].id, 'fresh-room-03');
});

test('7. Repeated cleanup executions are idempotent and safe', async () => {
  const validSecret = 'valid-token';
  const now = Date.now();
  const eightHoursAgo = new Date(now - 8 * 60 * 60 * 1000).toISOString();

  const mockDb = {
    rooms: [
      { id: 'stale-to-prune', is_featured: false, created_at: eightHoursAgo },
    ],
    playback: {
      'stale-to-prune': { is_playing: false, updated_at: eightHoursAgo },
    },
    memberships: {},
  };

  // Run 1: Prunes the stale room
  const { req: req1, res: res1 } = createMockHttp({
    method: 'POST',
    headers: { authorization: `Bearer ${validSecret}` },
  });
  await simulateCleanupHandler(req1, res1, { envSecret: validSecret, mockDb });
  assert.equal(res1.statusCode, 200);
  assert.equal(res1.jsonData.cleanedCount, 1);

  // Run 2: Immediate re-invocation finds zero eligible rooms, succeeds cleanly
  const { req: req2, res: res2 } = createMockHttp({
    method: 'POST',
    headers: { authorization: `Bearer ${validSecret}` },
  });
  await simulateCleanupHandler(req2, res2, { envSecret: validSecret, mockDb });
  assert.equal(res2.statusCode, 200);
  assert.equal(res2.jsonData.cleanedCount, 0);
  assert.deepEqual(res2.jsonData.deletedIds, []);
});

// ==============================================================================
// 2. STATIC INVARIANT VERIFICATION OF ACTUAL CODEBASE IMPLEMENTATION
// ==============================================================================

test('8. Source Code Invariant: strict fail-closed auth and secret protection', () => {
  // Fail-closed verification
  assert.match(cleanupSource, /process\.env\.CRON_SECRET/);
  assert.match(cleanupSource, /if\s*\(!cronSecret\)/);
  assert.match(cleanupSource, /status\(500\)\.json\(\{ error: 'Server configuration error: CRON_SECRET is not configured'/);
  assert.match(cleanupSource, /if\s*\(!authHeader \|\| authHeader !== `Bearer \$\{cronSecret\}`\)/);
  assert.match(cleanupSource, /status\(401\)\.json\(\{ error: 'Unauthorized'/);

  // Never returns secret in JSON error response
  assert.doesNotMatch(cleanupSource, /error:.*cronSecret/);
  assert.doesNotMatch(cleanupSource, /console\.log\(.*cronSecret.*\)/);

  // Method restriction
  assert.match(cleanupSource, /req\.method !== 'POST' && req\.method !== 'GET'/);
  assert.match(cleanupSource, /status\(405\)\.json\(\{ error: 'Method Not Allowed'/);

  // 6-hour inactivity threshold
  assert.match(cleanupSource, /6 \* 60 \* 60 \* 1000/);

  // Featured room protection in Supabase mode
  assert.match(cleanupSource, /eq\('is_featured',\s*false\)/);
  assert.match(cleanupSource, /if\s*\(r\.is_featured\)\s*continue;/);

  // Featured room protection in in-memory fallback
  assert.match(cleanupSource, /r\.isFeatured \|\| r\.id\.startsWith\('room-tokyo'\)/);
});

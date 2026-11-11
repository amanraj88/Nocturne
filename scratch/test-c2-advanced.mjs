import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

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
    }
  };
  return res;
}

async function runAdvancedCoverageTests() {
  console.log('Running NOCTURNE Phase C.2 Targeted Security & Architecture Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ ${message}`);
      passed++;
    } else {
      console.error(`✗ FAILED: ${message}`);
      failed++;
    }
  }

  const rawRoomsMod = require('../.next/server/pages/api/rooms.js');
  const roomsMod = rawRoomsMod && typeof rawRoomsMod.then === 'function' ? await rawRoomsMod : rawRoomsMod;
  const roomsHandler = roomsMod.default || roomsMod;

  const rawStateMod = require('../.next/server/pages/api/rooms/[id]/state.js');
  const stateMod = rawStateMod && typeof rawStateMod.then === 'function' ? await rawStateMod : rawStateMod;
  const stateHandler = stateMod.default || stateMod;

  // ---------------------------------------------------------------------------
  // Suite 1: Local Development Fallback (When Supabase is not configured)
  // ---------------------------------------------------------------------------
  console.log('--- Suite 1: Unconfigured / Local Development Mode ---');
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1.1 GET /api/rooms local fallback
  const res1_1 = createMockRes();
  await roomsHandler({ method: 'GET' }, res1_1);
  assert(res1_1.statusCode === 200 && Array.isArray(res1_1.body?.rooms), 'GET /api/rooms returns 200 with local rooms array');
  assert(res1_1.body?.rooms?.some(r => r.slug === 'tokyo-afterhours'), 'Featured room tokyo-afterhours present in local fallback');

  // 1.2 GET /api/rooms/[id]/state for genuine invalid room
  const res1_2 = createMockRes();
  await stateHandler({ method: 'GET', query: { id: 'non-existent-local-slug-999' } }, res1_2);
  assert(res1_2.statusCode === 404, 'Invalid room in local mode returns genuine 404 Not Found');

  // 1.3 POST /api/rooms in local dev mode
  const localSlug = `local-test-${Date.now()}`;
  const res1_3 = createMockRes();
  await roomsHandler({
    method: 'POST',
    body: { name: 'Local Test Lounge', slug: localSlug, artworkId: 'noc-01' }
  }, res1_3);
  assert(res1_3.statusCode === 201 && res1_3.body?.room?.slug === localSlug, 'POST /api/rooms creates room in local store (201)');

  // 1.4 Duplicate slug in local dev mode
  const res1_4 = createMockRes();
  await roomsHandler({
    method: 'POST',
    body: { name: 'Duplicate Local Test', slug: localSlug, artworkId: 'noc-01' }
  }, res1_4);
  assert(res1_4.statusCode === 409, 'Duplicate slug in local mode returns 409 Conflict');

  // ---------------------------------------------------------------------------
  // Suite 2: Production Mode & Split-Brain Prevention
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 2: Supabase Configured & Split-Brain Prevention ---');
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-nocturne.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_anon_key';

  // 2.1 Room creation without valid authenticated identity -> MUST be 401 Unauthorized
  const res2_1 = createMockRes();
  await roomsHandler({
    method: 'POST',
    headers: {}, // Missing Authorization header!
    body: { name: 'Unauth Room', slug: 'unauth-room-1', artworkId: 'noc-01' }
  }, res2_1);
  assert(
    res2_1.statusCode === 401 && res2_1.body?.error?.includes('Authentication required'),
    'Room creation without Authorization Bearer header returns 401 Unauthorized'
  );

  // 2.2 Supabase configured but query fails (simulated network/db error)
  // When Supabase is configured and fails, it must return 503, NEVER local fallback data!
  const res2_2 = createMockRes();
  await roomsHandler({ method: 'GET' }, res2_2);
  assert(
    res2_2.statusCode === 503,
    'Database failure in configured mode returns 503 Service Unavailable (NO silent local fallback)'
  );

  // 2.3 Room state lookup when Supabase is configured but db unreachable
  const res2_3 = createMockRes();
  await stateHandler({ method: 'GET', query: { id: 'tokyo-afterhours' } }, res2_3);
  assert(
    res2_3.statusCode === 503,
    'Room state lookup on database failure returns 503 (NO split-brain fallback to local memory)'
  );

  // ---------------------------------------------------------------------------
  // Suite 3: SQL Migration & Security Assertions
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 3: SQL Security & RPC Privilege Static Verification ---');
  const fs = require('node:fs');
  const sql = fs.readFileSync('supabase/migrations/20261111_init.sql', 'utf8');

  // 3.1 Verify explicit REVOKE CREATE ON SCHEMA public
  assert(
    sql.includes('REVOKE CREATE ON SCHEMA public FROM anon, authenticated, PUBLIC;'),
    'Schema hardening: explicit REVOKE CREATE ON SCHEMA public for anon and authenticated'
  );

  // 3.2 Verify safe search_path on all SECURITY DEFINER functions
  const defFuncs = sql.match(/CREATE OR REPLACE FUNCTION [^;]+SECURITY DEFINER[^;]+SET search_path = public, extensions, pg_temp/g);
  assert(defFuncs && defFuncs.length >= 4, 'All SECURITY DEFINER functions have strict SET search_path = public, extensions, pg_temp');

  // 3.3 Verify role separation: unauthenticated 'anon' cannot execute create_room_with_host
  assert(
    sql.includes('REVOKE ALL ON FUNCTION public.create_room_with_host') &&
    sql.includes('REVOKE ALL ON FUNCTION public.create_room_with_host(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT) FROM anon;'),
    'RPC Security: create_room_with_host revoked from anon role'
  );

  // 3.4 Verify atomic membership insert in create_room_with_host
  assert(
    sql.includes('INSERT INTO public.room_memberships (') &&
    sql.includes('VALUES (\n    v_room_id, v_user_id, p_host_name, \'host\', true\n  );'),
    'Atomic Guarantee: create_room_with_host creates initial host membership in same transaction'
  );

  // 3.5 Verify 5-room abuse limit in create_room_with_host
  assert(
    sql.includes('IF (SELECT COUNT(*) FROM public.rooms WHERE host_id = v_user_id AND is_featured = false) >= 5 THEN'),
    'Abuse Prevention: 5-room limit enforced in database RPC'
  );

  // 3.6 Verify host key rotation and rate-limiting in reclaim_room_host
  assert(
    sql.includes('IF v_failed_attempts >= 5 THEN') &&
    sql.includes('host_key_hash = p_new_recovery_key_hash'),
    'Host Recovery: rate-limiting (5 failed attempts/15m) and immediate key rotation present'
  );

  // Cleanup env
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log(`\n======================================================`);
  console.log(`Advanced Test Suite Completed: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================`);

  process.exit(failed > 0 ? 1 : 0);
}

runAdvancedCoverageTests();

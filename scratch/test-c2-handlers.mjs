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

async function run() {
  console.log('Testing compiled Phase C.2 API routes in-process...\n');
  let allPass = true;

  const rawRoomsMod = require('../.next/server/pages/api/rooms.js');
  const roomsMod = rawRoomsMod && typeof rawRoomsMod.then === 'function' ? await rawRoomsMod : rawRoomsMod;
  const roomsHandler = roomsMod.default || roomsMod;

  const rawStateMod = require('../.next/server/pages/api/rooms/[id]/state.js');
  const stateMod = rawStateMod && typeof rawStateMod.then === 'function' ? await rawStateMod : rawStateMod;
  const stateHandler = stateMod.default || stateMod;

  // Test 1: GET /api/rooms
  const req1 = { method: 'GET' };
  const res1 = createMockRes();
  await roomsHandler(req1, res1);
  const rooms = res1.body?.rooms || [];
  const hasTokyo = rooms.some(r => r.slug === 'tokyo-afterhours');
  const hasNordic = rooms.some(r => r.slug === 'nordic-solitude');
  const hasBerlin = rooms.some(r => r.slug === 'berlin-basement');

  if (res1.statusCode === 200 && hasTokyo && hasNordic && hasBerlin) {
    console.log('✓ Test 1: GET /api/rooms returned 200 with all 3 featured rooms (count=' + rooms.length + ')');
  } else {
    console.error('✗ Test 1 FAILED:', res1.statusCode, res1.body);
    allPass = false;
  }

  // Test 2: GET /api/rooms/tokyo-afterhours/state
  const req2 = { method: 'GET', query: { id: 'tokyo-afterhours' } };
  const res2 = createMockRes();
  await stateHandler(req2, res2);
  if (res2.statusCode === 200 && res2.body?.room?.slug === 'tokyo-afterhours' && Array.isArray(res2.body?.queue)) {
    console.log('✓ Test 2: GET /api/rooms/tokyo-afterhours/state hydrated featured room cleanly');
  } else {
    console.error('✗ Test 2 FAILED:', res2.statusCode, res2.body);
    allPass = false;
  }

  // Test 3: GET /api/rooms/non-existent-room-slug-999/state (Invalid room lookup)
  const req3 = { method: 'GET', query: { id: 'non-existent-room-slug-999' } };
  const res3 = createMockRes();
  await stateHandler(req3, res3);
  if (res3.statusCode === 404 && res3.body?.error) {
    console.log('✓ Test 3: Invalid room state lookup correctly returns 404 Not Found');
  } else {
    console.error('✗ Test 3 FAILED:', res3.statusCode, res3.body);
    allPass = false;
  }

  // Test 4: POST /api/rooms (Create new room)
  const testSlug = `lounge-${Date.now()}`;
  const req4 = {
    method: 'POST',
    body: {
      name: 'Modular Sanctuary Test',
      slug: testSlug,
      description: 'C.2 verification session',
      artworkId: 'noc-02',
      vibeTag: 'Ambient Drone'
    }
  };
  const res4 = createMockRes();
  await roomsHandler(req4, res4);
  if (res4.statusCode === 201 && res4.body?.room?.slug === testSlug) {
    console.log('✓ Test 4: POST /api/rooms creates room successfully with status 201');
  } else {
    console.error('✗ Test 4 FAILED:', res4.statusCode, res4.body);
    allPass = false;
  }

  // Test 5: GET newly created room state
  const req5 = { method: 'GET', query: { id: testSlug } };
  const res5 = createMockRes();
  await stateHandler(req5, res5);
  if (res5.statusCode === 200 && res5.body?.room?.slug === testSlug) {
    console.log('✓ Test 5: GET /api/rooms/' + testSlug + '/state hydrates newly created room cleanly');
  } else {
    console.error('✗ Test 5 FAILED:', res5.statusCode, res5.body);
    allPass = false;
  }

  // Test 6: POST duplicate slug (Conflict)
  const req6 = {
    method: 'POST',
    body: {
      name: 'Modular Sanctuary Test',
      slug: testSlug,
    }
  };
  const res6 = createMockRes();
  await roomsHandler(req6, res6);
  if (res6.statusCode === 409) {
    console.log('✓ Test 6: POST duplicate slug returns 409 Conflict as expected');
  } else {
    console.error('✗ Test 6 FAILED:', res6.statusCode, res6.body);
    allPass = false;
  }

  console.log('\nFinal In-Process Suite Result:', allPass ? 'ALL TESTS PASSED' : 'SUITE FAILED');
  process.exit(allPass ? 0 : 1);
}

run();

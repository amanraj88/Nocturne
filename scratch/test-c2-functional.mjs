import http from 'node:http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Running NOCTURNE Phase C.2 Functional Verification...\n');
  let allPass = true;

  // 1. Room Listing
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/rooms',
      method: 'GET'
    });
    const rooms = res.body?.rooms || [];
    const hasTokyo = rooms.some(r => r.slug === 'tokyo-afterhours');
    const hasNordic = rooms.some(r => r.slug === 'nordic-solitude');
    const hasBerlin = rooms.some(r => r.slug === 'berlin-basement');

    if (res.status === 200 && hasTokyo && hasNordic && hasBerlin) {
      console.log('Test 1 [Room Listing]: PASS (All 3 featured rooms present, status 200)');
    } else {
      console.error('Test 1 [Room Listing]: FAIL', res.status, rooms);
      allPass = false;
    }
  } catch (err) {
    console.error('Test 1 [Room Listing]: ERROR', err);
    allPass = false;
  }

  // 2. Room State Hydration (Featured Room)
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/rooms/tokyo-afterhours/state',
      method: 'GET'
    });
    const b = res.body;
    if (res.status === 200 && b?.room?.slug === 'tokyo-afterhours' && Array.isArray(b?.queue) && b?.playback) {
      console.log('Test 2 [Room State Hydration]: PASS (Room state, queue, and playback resolved)');
    } else {
      console.error('Test 2 [Room State Hydration]: FAIL', res.status, b);
      allPass = false;
    }
  } catch (err) {
    console.error('Test 2 [Room State Hydration]: ERROR', err);
    allPass = false;
  }

  // 3. Invalid Room State Lookup
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/rooms/non-existent-room-slug-999/state',
      method: 'GET'
    });
    if (res.status === 404 && res.body?.error) {
      console.log('Test 3 [Invalid Room State]: PASS (Returns 404 with error message)');
    } else {
      console.error('Test 3 [Invalid Room State]: FAIL', res.status, res.body);
      allPass = false;
    }
  } catch (err) {
    console.error('Test 3 [Invalid Room State]: ERROR', err);
    allPass = false;
  }

  // 4. Room Creation
  const testSlug = `lounge-${Date.now()}`;
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/rooms',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Modular Sanctuary Test',
      slug: testSlug,
      description: 'C.2 verification session',
      artworkId: 'noc-02',
      vibeTag: 'Ambient Drone'
    });

    if (res.status === 201 && res.body?.room?.slug === testSlug) {
      console.log('Test 4 [Room Creation]: PASS (Room created with status 201)');
    } else {
      console.error('Test 4 [Room Creation]: FAIL', res.status, res.body);
      allPass = false;
    }
  } catch (err) {
    console.error('Test 4 [Room Creation]: ERROR', err);
    allPass = false;
  }

  // 5. Hydration of Newly Created Room
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: `/api/rooms/${testSlug}/state`,
      method: 'GET'
    });
    if (res.status === 200 && res.body?.room?.slug === testSlug) {
      console.log('Test 5 [Created Room Hydration]: PASS (Newly created room hydrates cleanly)');
    } else {
      console.error('Test 5 [Created Room Hydration]: FAIL', res.status, res.body);
      allPass = false;
    }
  } catch (err) {
    console.error('Test 5 [Created Room Hydration]: ERROR', err);
    allPass = false;
  }

  // 6. Duplicate Room Slug Rejection
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/rooms',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Modular Sanctuary Test',
      slug: testSlug,
    });

    if (res.status === 409) {
      console.log('Test 6 [Duplicate Room Collision]: PASS (Returns 409 Conflict)');
    } else {
      console.error('Test 6 [Duplicate Room Collision]: FAIL', res.status, res.body);
      allPass = false;
    }
  } catch (err) {
    console.error('Test 6 [Duplicate Room Collision]: ERROR', err);
    allPass = false;
  }

  console.log('\nResult:', allPass ? 'ALL TESTS PASSED' : 'TESTS FAILED');
  process.exit(allPass ? 0 : 1);
}

runTests();

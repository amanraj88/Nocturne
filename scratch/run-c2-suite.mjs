import { spawn } from 'node:child_process';
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

function waitForReady(port, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await makeRequest({ hostname: 'localhost', port, path: '/', method: 'GET' });
        if (res.status === 200) {
          clearInterval(interval);
          resolve();
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error('Server failed to start within timeout'));
        }
      }
    }, 500);
  });
}

async function main() {
  console.log('Spawning Next.js production server on port 3002...');
  const nextProcess = spawn(
    'cmd.exe',
    ['/c', 'set PATH=C:\\NOCTURNE\\.tools\\node;%PATH% && npx next start -p 3002'],
    { stdio: 'inherit' }
  );

  try {
    await waitForReady(3002);
    console.log('Server is ready. Executing test suite...\n');

    let allPass = true;

    // Test 1: Room Listing
    const t1 = await makeRequest({ hostname: 'localhost', port: 3002, path: '/api/rooms', method: 'GET' });
    const rooms = t1.body?.rooms || [];
    const hasTokyo = rooms.some(r => r.slug === 'tokyo-afterhours');
    const hasNordic = rooms.some(r => r.slug === 'nordic-solitude');
    const hasBerlin = rooms.some(r => r.slug === 'berlin-basement');
    if (t1.status === 200 && hasTokyo && hasNordic && hasBerlin) {
      console.log('✓ Test 1: Room Listing returns 200 and all 3 featured rooms');
    } else {
      console.error('✗ Test 1 FAILED:', t1.status, rooms);
      allPass = false;
    }

    // Test 2: Room State Hydration (Featured Room)
    const t2 = await makeRequest({ hostname: 'localhost', port: 3002, path: '/api/rooms/tokyo-afterhours/state', method: 'GET' });
    if (t2.status === 200 && t2.body?.room?.slug === 'tokyo-afterhours' && Array.isArray(t2.body?.queue)) {
      console.log('✓ Test 2: Room State Hydration resolves tokyo-afterhours cleanly');
    } else {
      console.error('✗ Test 2 FAILED:', t2.status, t2.body);
      allPass = false;
    }

    // Test 3: Invalid Room Lookup (404)
    const t3 = await makeRequest({ hostname: 'localhost', port: 3002, path: '/api/rooms/non-existent-room-slug-999/state', method: 'GET' });
    if (t3.status === 404 && t3.body?.error) {
      console.log('✓ Test 3: Invalid Room State correctly returns 404');
    } else {
      console.error('✗ Test 3 FAILED:', t3.status, t3.body);
      allPass = false;
    }

    // Test 4: Custom Room Creation
    const testSlug = `lounge-${Date.now()}`;
    const t4 = await makeRequest({
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
    if (t4.status === 201 && t4.body?.room?.slug === testSlug) {
      console.log('✓ Test 4: Room Creation returns 201 and valid room payload');
    } else {
      console.error('✗ Test 4 FAILED:', t4.status, t4.body);
      allPass = false;
    }

    // Test 5: Hydration of Newly Created Room
    const t5 = await makeRequest({ hostname: 'localhost', port: 3002, path: `/api/rooms/${testSlug}/state`, method: 'GET' });
    if (t5.status === 200 && t5.body?.room?.slug === testSlug) {
      console.log('✓ Test 5: Newly created room state hydrates cleanly with 200');
    } else {
      console.error('✗ Test 5 FAILED:', t5.status, t5.body);
      allPass = false;
    }

    // Test 6: Duplicate Slug Collision Handling
    const t6 = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/rooms',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Modular Sanctuary Test',
      slug: testSlug,
    });
    if (t6.status === 409) {
      console.log('✓ Test 6: Duplicate Room Slug returns 409 Conflict');
    } else {
      console.error('✗ Test 6 FAILED:', t6.status, t6.body);
      allPass = false;
    }

    console.log('\nFinal Suite Result:', allPass ? 'ALL TESTS PASSED' : 'SUITE FAILED');
    nextProcess.kill();
    process.exit(allPass ? 0 : 1);
  } catch (err) {
    console.error('Fatal test error:', err);
    nextProcess.kill();
    process.exit(1);
  }
}

main();

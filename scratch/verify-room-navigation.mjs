import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const artDir = 'C:\\Users\\major\\.gemini\\antigravity\\brain\\f4b92a27-4f4d-489b-b69e-f37ac6572507';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.idCounter = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res) => this.ws.addEventListener('open', res));
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
    await this.send('Page.enable');
    await this.send('Runtime.enable');
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const id = this.idCounter++;
      this.pending.set(id, { resolve: res, reject: rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
    });
    return res.result?.value;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`[Screenshot saved] ${filePath}`);
  }

  close() {
    try {
      this.ws.close();
    } catch (e) {}
  }
}

async function run() {
  console.log('=== VERIFYING INVALID-ROOM NAVIGATION FIX ===');

  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9223',
    '--hide-scrollbars',
    'about:blank',
  ]);

  let versionData = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9223/json/version');
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (e) {}
    await sleep(300);
  }

  if (!versionData) {
    console.error('Failed to connect to CDP on 9223');
    edgeProc.kill();
    process.exit(1);
  }

  const listRes = await fetch('http://127.0.0.1:9223/json/list');
  const targets = await listRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // 1. Valid room navigation: Tokyo
  console.log('1. Loading valid room: /room/tokyo-afterhours');
  await client.send('Page.navigate', { url: 'http://localhost:3002/room/tokyo-afterhours' });
  await sleep(2500);

  const tokyoCheck = await client.eval(`(() => {
    return {
      title: document.title,
      headerTitle: document.querySelector('header')?.innerText || '',
      bodySnippet: document.body.innerText.slice(0, 300),
      hasRoomContent: document.body.innerText.includes('Shibuya Midnight Reverie'),
    };
  })()`);
  console.log('Tokyo Room Check:', tokyoCheck);

  // 2. Client-side navigation to invalid room
  console.log('2. Navigating to invalid room: /room/non-existent-room-slug-999');
  await client.send('Page.navigate', { url: 'http://localhost:3002/room/non-existent-room-slug-999' });
  await sleep(2000);

  const invalidCheck = await client.eval(`(() => {
    const text = document.body.innerText;
    const previousContentLeaked = text.includes('Shibuya Midnight Reverie');
    const showsNotFound = text.includes('This lounge is unavailable') && text.includes('Room not found');
    const browseLink = document.querySelector('a[href="/"]')?.textContent?.trim();
    return {
      title: document.title,
      showsNotFound,
      previousContentLeaked,
      browseLink,
    };
  })()`);
  console.log('Invalid Room Check:', invalidCheck);
  await client.screenshot(resolve(artDir, 'nocturne_invalid_room_verified.png'));

  // 3. Switch to another valid room: Nordic
  console.log('3. Navigating to another valid room: /room/nordic-solitude');
  await client.send('Page.navigate', { url: 'http://localhost:3002/room/nordic-solitude' });
  await sleep(2500);

  const nordicCheck = await client.eval(`(() => {
    return {
      title: document.title,
      hasNordicContent: document.body.innerText.includes('Reykjavik Obsidian Echoes'),
      hasPreviousTokyo: document.body.innerText.includes('Shibuya Midnight Reverie'),
    };
  })()`);
  console.log('Nordic Room Check:', nordicCheck);

  // 4. Browser back button to invalid room
  console.log('4. Triggering browser back to invalid room...');
  await client.eval(`window.history.back()`);
  await sleep(2000);

  const backCheck = await client.eval(`(() => {
    const text = document.body.innerText;
    return {
      title: document.title,
      showsNotFound: text.includes('This lounge is unavailable'),
      leakedNordic: text.includes('Reykjavik Obsidian Echoes'),
      leakedTokyo: text.includes('Shibuya Midnight Reverie'),
    };
  })()`);
  console.log('Browser Back to Invalid Room Check:', backCheck);

  client.close();
  edgeProc.kill();

  const allPassed =
    tokyoCheck.hasRoomContent &&
    invalidCheck.showsNotFound &&
    !invalidCheck.previousContentLeaked &&
    nordicCheck.hasNordicContent &&
    !nordicCheck.hasPreviousTokyo &&
    backCheck.showsNotFound &&
    !backCheck.leakedNordic &&
    !backCheck.leakedTokyo;

  console.log('\n=== NAVIGATION VERIFICATION RESULT ===');
  console.log('ALL CHECKS PASSED:', allPassed);
  if (!allPassed) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

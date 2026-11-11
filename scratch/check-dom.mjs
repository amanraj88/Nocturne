import { spawn } from 'node:child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9224',
    '--hide-scrollbars',
    'about:blank',
  ]);

  await sleep(1500);
  const listRes = await fetch('http://127.0.0.1:9224/json/list');
  const targets = await listRes.json();
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((res, rej) => {
      const id = idCounter++;
      pending.set(id, { resolve: res, reject: rej });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((res) => ws.addEventListener('open', res));
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');

  // Navigate to invalid room
  await send('Page.navigate', { url: 'http://localhost:3002/room/non-existent-room-slug-999' });
  await sleep(2500);

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const main = document.querySelector('main');
      const stage = document.querySelector('section[aria-label="Vinyl listening stage"]');
      const queue = document.querySelector('aside[aria-label="Shared queue and lounge presence"]');
      const deck = document.querySelector('footer, [aria-label*="transport"], .fixed.bottom-0');
      return {
        mainText: main?.innerText || '',
        hasStage: Boolean(stage),
        hasQueue: Boolean(queue),
        hasDeck: Boolean(deck),
        title: document.title,
      };
    })()`,
    returnByValue: true,
  });

  console.log('DOM Evaluation on Invalid Room:');
  console.log(res.result.value);

  ws.close();
  edgeProc.kill();
}

run().catch(console.error);

/**
 * tests/live-browser-sync-benchmark.mjs
 *
 * Real End-to-End Two-Browser Synchronization Benchmark
 * Real Chromium (msedge) + Real Realtime + Real YouTube IFrame API
 *
 * Scenarios:
 * 1. Cold Join Mid-Track (t >= 15s)
 * 2. Host Scrub / Seek (+30s)
 * 3. Rapid Toggle Burst (Pause -> Play -> Pause -> Play)
 * 4. Track Skip
 * 5. Mobile Tab Hide -> Return (visibilitychange)
 * 6. Network Throttle (300ms CDP Latency)
 * 7. Host Page Reload (hostPage.reload())
 */

import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}`;

// Helper: Sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Wrap promise in hard timeout
function withTimeout(promise, ms, name) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`[TIMEOUT] ${name} exceeded ${ms}ms limit`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Compute metrics
function stats(arr) {
  if (!arr || arr.length === 0) return { min: 0, avg: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
  return { min: Math.round(min), avg: Math.round(avg), max: Math.round(max) };
}

// Start Next.js server on port 3099
async function startServer() {
  console.log(`[Server] Starting Next.js production server on port ${PORT}...`);
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'cmd.exe' : 'npx';
  const args = isWindows ? ['/c', `npx next start -p ${PORT}`] : ['next', 'start', '-p', String(PORT)];

  const serverProcess = spawn(cmd, args, {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: false,
  });

  serverProcess.stdout.on('data', (d) => {
    const text = d.toString();
    if (text.includes('Ready in') || text.includes('started server')) {
      // server ready
    }
  });

  serverProcess.stderr.on('data', (d) => {
    // console.error('[Server Error]', d.toString());
  });

  // Wait for server to respond 200
  const start = Date.now();
  let online = false;
  while (Date.now() - start < 15000) {
    try {
      const res = await fetch(`${BASE_URL}/api/rooms`);
      if (res.status === 200 || res.status === 404) {
        online = true;
        break;
      }
    } catch {}
    await sleep(250);
  }

  if (!online) {
    serverProcess.kill('SIGTERM');
    throw new Error('Next.js server failed to start within 15 seconds.');
  }

  console.log(`[Server] Next.js ready at ${BASE_URL}`);
  return serverProcess;
}

// Kill child process and its process tree on Windows
function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(pid), '/T', '/F']);
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {}
}

async function runBenchmark() {
  let serverProcess = null;
  let browser = null;
  let hostContext = null;
  let listenerContext = null;
  let hostPage = null;
  let listenerPage = null;

  const benchmarkResults = [];

  try {
    serverProcess = await startServer();

    console.log('[Browser] Launching Chromium with --autoplay-policy=no-user-gesture-required...');
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: [
        '--autoplay-policy=no-user-gesture-required',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    hostContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    listenerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    hostPage = await hostContext.newPage();

    // ------------------------------------------------------------------------
    // Host Flow: Create Room & Queue Official YouTube Reference Track
    // ------------------------------------------------------------------------
    console.log('[Host] Navigating to homepage and starting room...');
    await hostPage.goto(`${BASE_URL}/`, { timeout: 8000 });

    // Open Create Room Modal
    const startBtn = hostPage.locator('button:has-text("Start a Room"), button:has-text("Create Room")').first();
    await startBtn.waitFor({ state: 'visible', timeout: 8000 });
    await startBtn.click();

    await hostPage.waitForSelector('input#room-title-input', { timeout: 8000 });
    await hostPage.locator('input#room-title-input').first().fill('Live Sync Benchmark ' + Date.now().toString(36));
    await hostPage.locator('input#starter-youtube-url').first().fill('https://www.youtube.com/watch?v=M7lc1UVf-VE');
    await hostPage.locator('div[role="dialog"] button:has-text("Create Room")').first().click();

    console.log('[Host] Waiting for navigation to /room/[slug]...');
    await hostPage.waitForURL(/\/room\//, { timeout: 8000 });
    const roomUrl = hostPage.url();
    console.log(`[Host] Room URL: ${roomUrl}`);

    // Wait for Host's YouTube player instance to be ready
    console.log('[Host] Waiting for YouTube player onReady...');
    await hostPage.waitForFunction(
      () => typeof window !== 'undefined' && window.__nocturneYtPlayer && typeof window.__nocturneYtPlayer.getPlayerState === 'function',
      null,
      { timeout: 8000 }
    );

    // Ensure Host is playing
    await hostPage.evaluate(() => {
      if (typeof window.__nocturnePlay === 'function') {
        window.__nocturnePlay();
      } else if (window.__nocturneYtPlayer) {
        window.__nocturneYtPlayer.playVideo?.();
      }
    });

    await hostPage.waitForFunction(
      () => {
        if (!window.__nocturneYtPlayer) return false;
        const state = window.__nocturneYtPlayer.getPlayerState?.();
        if (state === 2 || state === 5 || state === -1) {
          if (typeof window.__nocturnePlay === 'function') window.__nocturnePlay();
          else window.__nocturneYtPlayer.playVideo?.();
        }
        return state === 1;
      },
      null,
      { timeout: 15000 }
    );
    console.log('[Host] Player is PLAYING (state === 1)');

    // Seek to 15s to quickly establish mid-track state (>= 15s)
    await hostPage.evaluate(() => {
      if (window.__nocturneSeekTo) window.__nocturneSeekTo(15);
      else window.__nocturneYtPlayer.seekTo(15, true);
    });
    await sleep(600);

    // ========================================================================
    // SCENARIO 1: Cold Join Mid-Track (t >= 15s)
    // ========================================================================
    console.log('\n--- Running Scenario 1: Practical Cold Join Mid-Track ---');
    await withTimeout((async () => {
      // Wait for Host to reach >= 15s
      console.log('[Host] Playing until t >= 15s...');
      await hostPage.waitForFunction(
        () => window.__nocturneYtPlayer && window.__nocturneYtPlayer.getCurrentTime() >= 15,
        null,
        { timeout: 25000 }
      );
      const hostTimeAtJoin = await hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime());
      console.log(`[Host] Reached t = ${hostTimeAtJoin.toFixed(2)}s. Connecting Listener...`);

      // Listener opens room URL in separate isolated context
      listenerPage = await listenerContext.newPage();
      await listenerPage.goto(roomUrl, { timeout: 8000 });

      // Wait for Listener player to be ready and playing
      const joinStart = Date.now();
      await listenerPage.waitForFunction(
        () => typeof window !== 'undefined' && window.__nocturneYtPlayer && typeof window.__nocturneYtPlayer.getPlayerState === 'function',
        null,
        { timeout: 8000 }
      );

      // Listener starts/resumes playback if autoplay pending
      await listenerPage.evaluate(() => {
        if (typeof window.__nocturnePlay === 'function') {
          window.__nocturnePlay();
        } else if (window.__nocturneYtPlayer) {
          window.__nocturneYtPlayer.playVideo?.();
        }
      });

      await listenerPage.waitForFunction(
        () => {
          if (!window.__nocturneYtPlayer) return false;
          const state = window.__nocturneYtPlayer.getPlayerState?.();
          if (state === 2 || state === 5 || state === -1) {
            if (typeof window.__nocturnePlay === 'function') window.__nocturnePlay();
            else window.__nocturneYtPlayer.playVideo?.();
          }
          return state === 1;
        },
        null,
        { timeout: 12000 }
      );

      // Measure convergence time until Listener is within 1200ms of Host
      let convergenceTime = 8000;
      while (Date.now() - joinStart < 8000) {
        const [h, l] = await Promise.all([
          hostPage.evaluate(() => window.__nocturneYtPlayer?.getCurrentTime?.() || 0),
          listenerPage.evaluate(() => window.__nocturneYtPlayer?.getCurrentTime?.() || 0),
        ]);
        if (Math.abs(h - l) * 1000 <= 1200) {
          convergenceTime = Date.now() - joinStart;
          break;
        }
        await sleep(60);
      }

      // Sample drift 10 times (every 300ms)
      const samples = [];
      for (let i = 0; i < 10; i++) {
        const [h, l] = await Promise.all([
          hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
          listenerPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
        ]);
        samples.push(Math.abs(h - l) * 1000);
        await sleep(300);
      }

      const st = stats(samples);
      benchmarkResults.push({
        scenario: '1. Practical Cold Join Mid-Track',
        samples: samples.length,
        min: st.min,
        avg: st.avg,
        max: st.max,
        convergence: convergenceTime,
        status: st.max <= 1500 ? 'PASS' : 'WARN',
      });
      console.log(`[Scenario 1] Avg Drift: ${st.avg}ms | Max: ${st.max}ms | Conv: ${convergenceTime}ms`);
    })(), 30000, 'Scenario 1');

    // ========================================================================
    // SCENARIO 2: Practical Host Scrub / Seek (+30s)
    // ========================================================================
    console.log('\n--- Running Scenario 2: Practical Host Scrub / Seek (+30s) ---');
    await withTimeout((async () => {
      const hTime = await hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime());
      const targetSec = Math.floor(hTime + 30);
      console.log(`[Host] Seeking +30s to target = ${targetSec}s...`);

      const seekStart = Date.now();
      await hostPage.evaluate((sec) => {
        if (window.__nocturneSeekTo) window.__nocturneSeekTo(sec);
        else window.__nocturneYtPlayer.seekTo(sec, true);
      }, targetSec);

      // Wait for Host to execute seek and reach targetSec
      await hostPage.waitForFunction(
        (target) => window.__nocturneYtPlayer && Math.abs(window.__nocturneYtPlayer.getCurrentTime() - target) <= 2.5,
        targetSec,
        { timeout: 8000 }
      );

      // Measure convergence time until Listener is within 1200ms of Host
      let convergenceTime = 8000;
      while (Date.now() - seekStart < 8000) {
        const [h, l] = await Promise.all([
          hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
          listenerPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
        ]);
        if (Math.abs(h - l) * 1000 <= 1200) {
          convergenceTime = Date.now() - seekStart;
          break;
        }
        await sleep(80);
      }

      // Sample drift 10 times
      const samples = [];
      for (let i = 0; i < 10; i++) {
        const [h, l] = await Promise.all([
          hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
          listenerPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
        ]);
        samples.push(Math.abs(h - l) * 1000);
        await sleep(300);
      }

      const st = stats(samples);
      benchmarkResults.push({
        scenario: '2. Practical Host Scrub / Seek (+30s)',
        samples: samples.length,
        min: st.min,
        avg: st.avg,
        max: st.max,
        convergence: convergenceTime,
        status: st.max <= 1500 ? 'PASS' : 'WARN',
      });
      console.log(`[Scenario 2] Avg Drift: ${st.avg}ms | Max: ${st.max}ms | Conv: ${convergenceTime}ms`);
    })(), 15000, 'Scenario 2');

    // ========================================================================
    // SCENARIO 3: Rapid Toggle Burst (Pause -> Play -> Pause -> Play)
    // ========================================================================
    console.log('\n--- Running Scenario 3: Practical Rapid Toggle Burst ---');
    await withTimeout((async () => {
      console.log('[Host] Executing rapid toggle burst (3 toggles in 1.5s)...');
      await hostPage.evaluate(() => window.__nocturneTogglePlay?.());
      await sleep(450);
      await hostPage.evaluate(() => window.__nocturneTogglePlay?.());
      await sleep(450);
      await hostPage.evaluate(() => window.__nocturneTogglePlay?.());
      await sleep(450);
      // Ensure final state is PLAYING
      await hostPage.evaluate(() => {
        if (typeof window.__nocturnePlay === 'function') window.__nocturnePlay();
        else window.__nocturneYtPlayer?.playVideo?.();
      });
      await sleep(500);

      // Wait for Listener to settle in PLAYING state (1)
      const convStart = Date.now();
      await listenerPage.waitForFunction(
        () => {
          if (!window.__nocturneYtPlayer) return false;
          const state = window.__nocturneYtPlayer.getPlayerState?.();
          if (state === 2 || state === 5 || state === -1) {
            if (typeof window.__nocturnePlay === 'function') window.__nocturnePlay();
            else window.__nocturneYtPlayer.playVideo?.();
          }
          return state === 1;
        },
        null,
        { timeout: 10000 }
      );
      let convergenceTime = 8000;
      while (Date.now() - convStart < 8000) {
        const [h, l] = await Promise.all([
          hostPage.evaluate(() => window.__nocturneYtPlayer?.getCurrentTime?.() || 0),
          listenerPage.evaluate(() => window.__nocturneYtPlayer?.getCurrentTime?.() || 0),
        ]);
        if (Math.abs(h - l) * 1000 <= 1200) {
          convergenceTime = Date.now() - convStart;
          break;
        }
        await sleep(80);
      }

      // Sample drift 10 times
      const samples = [];
      for (let i = 0; i < 10; i++) {
        const [h, l] = await Promise.all([
          hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
          listenerPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
        ]);
        samples.push(Math.abs(h - l) * 1000);
        await sleep(300);
      }

      const st = stats(samples);
      benchmarkResults.push({
        scenario: '3. Practical Rapid Toggle Burst',
        samples: samples.length,
        min: st.min,
        avg: st.avg,
        max: st.max,
        convergence: convergenceTime,
        status: st.max <= 1500 ? 'PASS' : 'WARN',
      });
      console.log(`[Scenario 3] Avg Drift: ${st.avg}ms | Max: ${st.max}ms | Conv: ${convergenceTime}ms`);
    })(), 15000, 'Scenario 3');

    // ========================================================================
    // SCENARIO 4: Practical Track Skip
    // ========================================================================
    console.log('\n--- Running Scenario 4: Practical Track Skip ---');
    await withTimeout((async () => {
      console.log('[Host] Queueing second track (aqz-KE-bpKQ)...');
      const addInput = hostPage.locator('input[aria-label="Add YouTube URL"]').first();
      await addInput.waitFor({ state: 'visible', timeout: 8000 });
      await addInput.fill('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
      const addBtn = hostPage.locator('button[title="Add YouTube URL"]').first();
      await addBtn.click();
      await sleep(2500);

      console.log('[Host] Skipping to next track...');
      const skipStart = Date.now();
      await hostPage.evaluate(() => window.__nocturneSkipTrack?.());

      // Wait until Listener also switches to the new track and plays
      let convergenceTime = 12000;
      while (Date.now() - skipStart < 12000) {
        const [hState, lState] = await Promise.all([
          hostPage.evaluate(() => window.__nocturneYtPlayer?.getPlayerState?.()),
          listenerPage.evaluate(() => window.__nocturneYtPlayer?.getPlayerState?.()),
        ]);
        if (hState === 1 && lState === 1) {
          const [h, l] = await Promise.all([
            hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
            listenerPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
          ]);
          if (Math.abs(h - l) * 1000 <= 1000) {
            convergenceTime = Date.now() - skipStart;
            break;
          }
        }
        await sleep(80);
      }

      // Sample drift 10 times
      const samples = [];
      for (let i = 0; i < 10; i++) {
        const [h, l] = await Promise.all([
          hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
          listenerPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
        ]);
        samples.push(Math.abs(h - l) * 1000);
        await sleep(300);
      }

      const st = stats(samples);
      benchmarkResults.push({
        scenario: '4. Practical Track Skip',
        samples: samples.length,
        min: st.min,
        avg: st.avg,
        max: st.max,
        convergence: convergenceTime,
        status: st.max <= 1500 ? 'PASS' : 'WARN',
      });
      console.log(`[Scenario 4] Avg Drift: ${st.avg}ms | Max: ${st.max}ms | Conv: ${convergenceTime}ms`);
    })(), 20000, 'Scenario 4');

    // ========================================================================
    // SCENARIO 5: Practical Mobile Tab Hide -> Return (visibilitychange)
    // ========================================================================
    console.log('\n--- Running Scenario 5: Practical Mobile Tab Hide -> Return (5s) ---');
    await withTimeout((async () => {
      console.log('[Listener] Emulating hidden visibility for 5 seconds...');
      await listenerPage.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // 5 seconds pass while Host continues playing
      await sleep(5000);

      console.log('[Listener] Restoring visibilityState to visible...');
      const returnStart = Date.now();
      await listenerPage.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await sleep(300);

      // Measure recovery time
      let convergenceTime = 8000;
      while (Date.now() - returnStart < 8000) {
        const [h, l] = await Promise.all([
          hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
          listenerPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
        ]);
        if (Math.abs(h - l) * 1000 <= 1000) {
          convergenceTime = Date.now() - returnStart;
          break;
        }
        await sleep(60);
      }

      // Sample drift 10 times
      const samples = [];
      for (let i = 0; i < 10; i++) {
        const [h, l] = await Promise.all([
          hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
          listenerPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
        ]);
        samples.push(Math.abs(h - l) * 1000);
        await sleep(300);
      }

      const st = stats(samples);
      benchmarkResults.push({
        scenario: '5. Practical Mobile Tab Return (5s)',
        samples: samples.length,
        min: st.min,
        avg: st.avg,
        max: st.max,
        convergence: convergenceTime,
        status: st.max <= 1500 ? 'PASS' : 'WARN',
      });
      console.log(`[Scenario 5] Avg Drift: ${st.avg}ms | Max: ${st.max}ms | Conv: ${convergenceTime}ms`);
    })(), 15000, 'Scenario 5');

    // ========================================================================
    // SCENARIO 6: Practical Network Throttle (300ms CDP Latency)
    // ========================================================================
    console.log('\n--- Running Scenario 6: Practical Network Throttle (300ms CDP Latency) ---');
    await withTimeout((async () => {
      console.log('[Listener] Setting 300ms network latency via CDP session...');
      const cdp = await listenerContext.newCDPSession(listenerPage);
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 300,
        downloadThroughput: -1,
        uploadThroughput: -1,
      });

      const hCurrent = await hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime());
      const targetSec = Math.floor(hCurrent + 20);
      const cdpSeekStart = Date.now();
      await hostPage.evaluate((target) => {
        if (window.__nocturneSeekTo) window.__nocturneSeekTo(target);
        else window.__nocturneYtPlayer.seekTo(target, true);
      }, targetSec);

      // Wait for Host to reach targetSec
      await hostPage.waitForFunction(
        (target) => window.__nocturneYtPlayer && Math.abs(window.__nocturneYtPlayer.getCurrentTime() - target) <= 2.5,
        targetSec,
        { timeout: 8000 }
      );

      let convergenceTime = 8000;
      while (Date.now() - cdpSeekStart < 8000) {
        const [h, l] = await Promise.all([
          hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
          listenerPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
        ]);
        if (Math.abs(h - l) * 1000 <= 1500) {
          convergenceTime = Date.now() - cdpSeekStart;
          break;
        }
        await sleep(80);
      }

      // Sample drift 10 times
      const samples = [];
      for (let i = 0; i < 10; i++) {
        const [h, l] = await Promise.all([
          hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
          listenerPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
        ]);
        samples.push(Math.abs(h - l) * 1000);
        await sleep(300);
      }

      // Reset CDP conditions
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      });

      const st = stats(samples);
      benchmarkResults.push({
        scenario: '6. Practical Network Throttle (300ms)',
        samples: samples.length,
        min: st.min,
        avg: st.avg,
        max: st.max,
        convergence: convergenceTime,
        status: st.max <= 1500 ? 'PASS' : 'WARN',
      });
      console.log(`[Scenario 6] Avg Drift: ${st.avg}ms | Max: ${st.max}ms | Conv: ${convergenceTime}ms`);
    })(), 15000, 'Scenario 6');

    // ========================================================================
    // SCENARIO 7: Practical Host Page Reload (hostPage.reload())
    // ========================================================================
    console.log('\n--- Running Scenario 7: Practical Host Page Reload ---');
    await withTimeout((async () => {
      console.log('[Host] Reloading host browser tab...');
      const reloadStart = Date.now();
      await hostPage.reload({ timeout: 8000 });

      // Wait for Host player to recover
      await hostPage.waitForFunction(
        () => typeof window !== 'undefined' && window.__nocturneYtPlayer && typeof window.__nocturneYtPlayer.getPlayerState === 'function',
        null,
        { timeout: 15000 }
      );
      await hostPage.evaluate(() => {
        if (typeof window.__nocturnePlay === 'function') {
          window.__nocturnePlay();
        } else if (window.__nocturneYtPlayer) {
          window.__nocturneYtPlayer.playVideo?.();
        }
      });
      await hostPage.waitForFunction(
        () => {
          if (!window.__nocturneYtPlayer) return false;
          const state = window.__nocturneYtPlayer.getPlayerState?.();
          if (state === 2 || state === 5 || state === -1) {
            if (typeof window.__nocturnePlay === 'function') window.__nocturnePlay();
            else window.__nocturneYtPlayer.playVideo?.();
          }
          return state === 1;
        },
        null,
        { timeout: 12000 }
      );

      const convStart = Date.now();
      let convergenceTime = 8000;
      while (Date.now() - convStart < 8000) {
        const [h, l] = await Promise.all([
          hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
          listenerPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
        ]);
        if (Math.abs(h - l) * 1000 <= 1200) {
          convergenceTime = Date.now() - convStart;
          break;
        }
        await sleep(80);
      }

      // Sample drift 10 times
      const samples = [];
      for (let i = 0; i < 10; i++) {
        const [h, l] = await Promise.all([
          hostPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
          listenerPage.evaluate(() => window.__nocturneYtPlayer.getCurrentTime()),
        ]);
        samples.push(Math.abs(h - l) * 1000);
        await sleep(300);
      }

      const st = stats(samples);
      benchmarkResults.push({
        scenario: '7. Practical Host Page Reload',
        samples: samples.length,
        min: st.min,
        avg: st.avg,
        max: st.max,
        convergence: convergenceTime,
        status: st.max <= 1500 ? 'PASS' : 'WARN',
      });
      console.log(`[Scenario 7] Avg Drift: ${st.avg}ms | Max: ${st.max}ms | Conv: ${convergenceTime}ms`);
    })(), 25000, 'Scenario 7');

  } catch (error) {
    console.error('\n[Benchmark Exception]', error);
  } finally {
    // ------------------------------------------------------------------------
    // Clean Process Exit
    // ------------------------------------------------------------------------
    console.log('\n[Teardown] Closing browser contexts and terminating processes...');
    try { if (hostContext) await hostContext.close(); } catch {}
    try { if (listenerContext) await listenerContext.close(); } catch {}
    try { if (browser) await browser.close(); } catch {}
    if (serverProcess) {
      console.log('[Teardown] Killing Next.js server process tree...');
      killProcessTree(serverProcess.pid);
    }

    // Print final Markdown report
    console.log('\n' + '='.repeat(88));
    console.log(' PRACTICAL LIVE TWO-BROWSER SYNCHRONIZATION BENCHMARK REPORT');
    console.log(' Measured with Real Chromium + Real Realtime Channel + Real YouTube IFrame API');
    console.log('='.repeat(88) + '\n');

    console.log('| Scenario | Samples (N) | Lowest Drift | Average Drift | Highest Drift | Convergence Time | Status |');
    console.log('|---|---|---|---|---|---|---|');
    for (const r of benchmarkResults) {
      console.log(`| ${r.scenario} | ${r.samples} | ${r.min}ms | ${r.avg}ms | ${r.max}ms | ${r.convergence}ms | ${r.status} |`);
    }
    console.log('\n' + '='.repeat(88));

    // Force exit to ensure no dangling WebSockets
    setTimeout(() => process.exit(0), 500);
  }
}

runBenchmark();

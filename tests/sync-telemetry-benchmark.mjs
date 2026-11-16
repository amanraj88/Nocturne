/**
 * tests/sync-telemetry-benchmark.mjs
 *
 * Deterministic Two-Client Playback Synchronization Telemetry Benchmark
 * Simulates Host and Listener clients communicating over a simulated Realtime
 * WebSocket channel with realistic network jitter (25ms-320ms), clock ticks (50ms-100ms),
 * and YouTube seek settle latency (40ms-140ms) across 50 trials per scenario (N=50).
 *
 * Scenarios:
 * 1. Cold Join Mid-Track (t = +45s)
 * 2. Host Scrub / Seek Jump (+60s forward & -30s backward)
 * 3. Rapid Play -> Pause -> Play Toggle Burst (3 toggles in 1.2s)
 * 4. Track Skip / Auto-Advance Transition
 * 5. Mobile Tab Background -> Foreground Return (8s hidden -> visible)
 * 6. Network Jitter / Packet Transit Delay (50ms-350ms variable latency)
 * 7. Host Page Refresh / Reconnect
 */

import { performance } from 'node:perf_hooks';

// ============================================================================
// SIMULATION PRIMITIVES & PSEUDO-RANDOM NUMBER GENERATOR
// ============================================================================

// Seedable deterministic PRNG (Linear Congruential Generator) for reproducible benchmarks
class LCG {
  constructor(seed = 133742) {
    this.m = 0x80000000;
    this.a = 1103515245;
    this.c = 12345;
    this.state = seed;
  }
  next() {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state / (this.m - 1);
  }
  range(min, max) {
    return min + this.next() * (max - min);
  }
}

const rng = new LCG(20261116);

// Statistics helper
function computeStats(arr) {
  if (arr.length === 0) return { mean: 0, median: 0, p95: 0, max: 0, min: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / sorted.length;
  const median = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return { mean, median, p95, max, min };
}

// ============================================================================
// CLIENT SIMULATOR (Mirrors LoungeContext.tsx & VinylStage.tsx)
// ============================================================================

class VirtualClient {
  constructor(id, role, sim) {
    this.id = id;
    this.role = role; // 'host' | 'listener'
    this.sim = sim;

    // LoungeContext state
    this.isPlaying = false;
    this.progressSeconds = 0;
    this.durationSeconds = 240;
    this.trackId = 'track-01';
    this.loadedYoutubeId = 'vid-01';
    this.lastSeekTimestamp = 0;
    this.lastReceivedRevision = 0;
    this.lastReceivedTimestamp = 0;
    this.playbackRevision = 0;
    this.broadcastCount = 0;
    this.stalePacketsRejected = 0;

    // VinylStage / YouTube Player simulation
    this.playerCurrentTime = 0;
    this.playerState = 1; // 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING
    this.pendingSettleTime = 0; // ms until seek settles
    this.targetSeekPosition = null;

    // Mobile background recovery state
    this.hiddenAt = null;
    this.hiddenProgress = 0;
  }

  // Update physical player playhead per time step
  tick(dtSeconds) {
    if (this.pendingSettleTime > 0) {
      this.pendingSettleTime -= dtSeconds * 1000;
      if (this.pendingSettleTime <= 0) {
        this.pendingSettleTime = 0;
        if (this.targetSeekPosition !== null) {
          this.playerCurrentTime = this.targetSeekPosition;
          this.targetSeekPosition = null;
        }
        this.playerState = this.isPlaying ? 1 : 2;
        this.onPlayerStateChange(this.playerState);
      }
    } else if (this.isPlaying && !this.isBackgrounded) {
      this.playerCurrentTime = Math.round((this.playerCurrentTime + dtSeconds) * 1000) / 1000;
      if (this.playerCurrentTime > this.durationSeconds) {
        this.playerCurrentTime = this.durationSeconds;
      }
      this.progressSeconds = Math.floor(this.playerCurrentTime);
    }
  }

  // Player seek action with realistic YouTube settle latency
  playerSeekTo(targetSeconds, settleLatencyMs) {
    this.targetSeekPosition = targetSeconds;
    this.pendingSettleTime = settleLatencyMs;
    this.playerState = 3; // BUFFERING
  }

  // YouTube onStateChange handler (VinylStage.tsx)
  onPlayerStateChange(state) {
    // Role-checked echo suppression: Non-host listeners NEVER broadcast!
    if (this.role !== 'host') {
      return;
    }
    // Host broadcasts play/pause changes if any
  }

  // Host initiates seek (LoungeContext.tsx: seekTo)
  hostSeekTo(targetSeconds) {
    if (this.role !== 'host') return;
    const clamped = Math.max(0, Math.min(targetSeconds, this.durationSeconds));
    this.lastSeekTimestamp = this.sim.now;
    this.progressSeconds = clamped;
    this.playerCurrentTime = clamped;

    this.playbackRevision += 1;
    this.broadcastCount++;

    this.sim.broadcast({
      type: 'SEEK',
      senderId: this.id,
      timestamp: this.sim.now,
      progressSeconds: clamped,
      trackId: this.trackId,
      isPlaying: this.isPlaying,
      revision: this.playbackRevision,
    });
  }

  // Host initiates toggle play/pause (LoungeContext.tsx: togglePlay)
  hostTogglePlay() {
    if (this.role !== 'host') return;
    this.isPlaying = !this.isPlaying;
    this.playerState = this.isPlaying ? 1 : 2;
    this.playbackRevision += 1;
    this.broadcastCount++;

    this.sim.broadcast({
      type: this.isPlaying ? 'PLAY' : 'PAUSE',
      senderId: this.id,
      timestamp: this.sim.now,
      progressSeconds: Math.floor(this.playerCurrentTime),
      trackId: this.trackId,
      isPlaying: this.isPlaying,
      revision: this.playbackRevision,
    });
  }

  // Host initiates track select / skip (LoungeContext.tsx: selectTrack)
  hostSelectTrack(newTrackId, newYoutubeId) {
    if (this.role !== 'host') return;
    this.trackId = newTrackId;
    this.loadedYoutubeId = newYoutubeId;
    this.progressSeconds = 0;
    this.playerCurrentTime = 0;
    this.playbackRevision += 1;
    this.broadcastCount++;

    this.sim.broadcast({
      type: 'SELECT_TRACK',
      senderId: this.id,
      timestamp: this.sim.now,
      progressSeconds: 0,
      trackId: newTrackId,
      isPlaying: this.isPlaying,
      revision: this.playbackRevision,
    });
  }

  // Host periodic heartbeat sync (LoungeContext.tsx: every 5s)
  hostBroadcastPeriodicSync() {
    if (this.role !== 'host') return;
    this.playbackRevision += 1;
    this.broadcastCount++;

    this.sim.broadcast({
      type: 'PLAY',
      senderId: this.id,
      timestamp: this.sim.now,
      progressSeconds: Math.floor(this.playerCurrentTime),
      trackId: this.trackId,
      isPlaying: this.isPlaying,
      revision: this.playbackRevision,
    });
  }

  // Listener receives incoming Realtime playback packet (LoungeContext.tsx: handleRealtimePlayback)
  handleRealtimePlayback(payload) {
    if (!payload || typeof payload !== 'object') return;
    if (payload.senderId === this.id) return; // 1. Self filter

    // 4. Stale and out-of-order rejection
    const hasRevision = typeof payload.revision === 'number' && payload.revision > 0;
    if (hasRevision) {
      if (payload.revision <= this.lastReceivedRevision) {
        this.stalePacketsRejected++;
        return; // REJECT STALE/OUT-OF-ORDER
      }
      this.lastReceivedRevision = payload.revision;
      if (typeof payload.timestamp === 'number') {
        this.lastReceivedTimestamp = Math.max(this.lastReceivedTimestamp, payload.timestamp);
      }
    } else if (typeof payload.timestamp === 'number') {
      if (payload.timestamp < this.lastReceivedTimestamp) {
        this.stalePacketsRejected++;
        return; // REJECT OUT-OF-ORDER
      }
      this.lastReceivedTimestamp = payload.timestamp;
      if (typeof payload.revision === 'number') {
        this.lastReceivedRevision = payload.revision;
      }
    }

    // 5. Track change
    if (payload.trackId && payload.trackId !== this.trackId) {
      this.trackId = payload.trackId;
      const startProgress = typeof payload.progressSeconds === 'number' ? payload.progressSeconds : 0;
      this.progressSeconds = startProgress;
      this.playerCurrentTime = startProgress;
    }

    // 6. Play / Pause
    if (typeof payload.isPlaying === 'boolean' && payload.isPlaying !== this.isPlaying) {
      this.isPlaying = payload.isPlaying;
      this.playerState = this.isPlaying ? 1 : 2;
    }

    // 7. Seek / Drift correction with transit delay compensation
    if (typeof payload.progressSeconds === 'number') {
      const transitDelaySec = (typeof payload.timestamp === 'number' && (payload.isPlaying ?? this.isPlaying))
        ? Math.max(0, Math.min(5, (this.sim.now - payload.timestamp) / 1000))
        : 0;
      const targetSeconds = payload.progressSeconds + transitDelaySec;

      const localCurrentTime = this.playerCurrentTime;
      const drift = Math.abs(localCurrentTime - payload.progressSeconds);

      if (payload.type === 'SEEK') {
        this.lastSeekTimestamp = this.sim.now;
        const effectiveTarget = payload.progressSeconds;
        this.progressSeconds = effectiveTarget;
        this.playerSeekTo(effectiveTarget, rng.range(40, 140));
      } else if (drift > 2.0) {
        this.lastSeekTimestamp = this.sim.now;
        const effectiveTarget = Math.round(targetSeconds);
        this.progressSeconds = effectiveTarget;
        this.playerSeekTo(effectiveTarget, rng.range(40, 140));
      }
    }
  }

  // Listener cold join execution (LoungeContext.tsx: resolveAndSetRoom)
  executeColdJoin(roomPlaybackData) {
    const isPlayingNow = Boolean(roomPlaybackData.isPlaying);
    this.isPlaying = isPlayingNow;
    this.trackId = roomPlaybackData.currentTrackId || 'track-01';

    let initialProgress = Number.isFinite(roomPlaybackData.progressSeconds)
      ? Math.max(0, roomPlaybackData.progressSeconds)
      : 0;
    const lastTimestamp = roomPlaybackData.lastUpdatedTimestamp || (roomPlaybackData.updatedAt ? new Date(roomPlaybackData.updatedAt).getTime() : 0);
    if (isPlayingNow && lastTimestamp > 0) {
      const elapsed = Math.max(0, (this.sim.now - lastTimestamp) / 1000);
      initialProgress = initialProgress + elapsed;
    }
    this.progressSeconds = Math.floor(initialProgress);
    this.playerCurrentTime = Math.round(initialProgress * 1000) / 1000;
    this.lastReceivedRevision = roomPlaybackData.revision || 0;
    this.lastReceivedTimestamp = lastTimestamp || this.sim.now;
    this.playerState = isPlayingNow ? 1 : 2;
  }

  // Mobile background -> foreground return (VinylStage.tsx: visibilitychange)
  onVisibilityChange(visibilityState) {
    if (visibilityState === 'hidden') {
      this.isBackgrounded = true;
      this.hiddenAt = this.sim.now;
      this.hiddenProgress = this.playerCurrentTime;
    } else if (visibilityState === 'visible') {
      this.isBackgrounded = false;
      if (this.hiddenAt && this.sim.now - this.hiddenAt > 500 && this.isPlaying) {
        const elapsedSec = (this.sim.now - this.hiddenAt) / 1000;
        const targetSec = Math.min(this.durationSeconds, this.hiddenProgress + elapsedSec);
        this.progressSeconds = Math.floor(targetSec);
        this.playerSeekTo(targetSec, rng.range(40, 140));
      }
      this.hiddenAt = null;
    }
  }
}

// ============================================================================
// SIMULATION ENVIRONMENT WITH JITTER & PACKET QUEUE
// ============================================================================

class SyncSimulation {
  constructor() {
    this.now = 1000000; // Start at arbitrary epoch ms
    this.host = new VirtualClient('host-01', 'host', this);
    this.listener = new VirtualClient('listener-01', 'listener', this);
    this.inFlightPackets = [];
  }

  // Broadcast message across simulated WebSocket network with variable jitter (25ms - 320ms)
  broadcast(payload) {
    const transitDelay = rng.range(25, 320);
    this.inFlightPackets.push({
      deliverAt: this.now + transitDelay,
      payload,
    });
  }

  // Step simulation forward by dt ms with clock tick resolution (50ms - 100ms)
  step(dtMs) {
    const targetNow = this.now + dtMs;
    while (this.now < targetNow) {
      // Step in small tick increments (e.g. 50ms)
      const tick = Math.min(50, targetNow - this.now);
      this.now += tick;
      const dtSec = tick / 1000;

      // Tick players
      this.host.tick(dtSec);
      this.listener.tick(dtSec);

      // Deliver arrived packets
      const remaining = [];
      for (const packet of this.inFlightPackets) {
        if (packet.deliverAt <= this.now) {
          this.listener.handleRealtimePlayback(packet.payload);
        } else {
          remaining.push(packet);
        }
      }
      this.inFlightPackets = remaining;
    }
  }

  // Flush remaining in-flight packets and allow settle
  drainAndSettle(timeoutMs = 600) {
    this.step(timeoutMs);
  }

  getDrift() {
    return Math.abs(this.host.playerCurrentTime - this.listener.playerCurrentTime);
  }
}

// ============================================================================
// SCENARIO TEST SUITE (50 TRIALS PER SCENARIO)
// ============================================================================

const TRIALS = 50;

async function runBenchmark() {
  const startTime = performance.now();
  console.log('='.repeat(80));
  console.log(' NOCTURNE TWO-CLIENT PLAYBACK SYNCHRONIZATION TELEMETRY BENCHMARK');
  console.log(` Samples per scenario: N = ${TRIALS} | Jitter: 25ms-320ms | Settle: 40ms-140ms`);
  console.log('='.repeat(80));

  const results = {};

  // --------------------------------------------------------------------------
  // Scenario 1: Cold Join Mid-Track (t = +45s)
  // --------------------------------------------------------------------------
  {
    const drifts = [];
    const convTimes = [];
    let echoFree = true;

    for (let i = 0; i < TRIALS; i++) {
      const sim = new SyncSimulation();
      // Host plays from 0 to 45s
      sim.host.isPlaying = true;
      sim.step(45000);

      // Snapshot host state in DB (with 10-60ms network delay before listener joins)
      const hostTime = Math.round(sim.host.playerCurrentTime * 1000) / 1000;
      const dbPlayback = {
        isPlaying: true,
        currentTrackId: 'track-01',
        progressSeconds: hostTime,
        updatedAt: new Date(sim.now - rng.range(10, 60)).toISOString(),
        lastUpdatedTimestamp: sim.now - rng.range(10, 60),
        revision: sim.host.playbackRevision,
      };

      // Listener joins cold
      const t0 = sim.now;
      sim.listener.executeColdJoin(dbPlayback);
      sim.drainAndSettle(200);

      const drift = sim.getDrift();
      drifts.push(drift);
      convTimes.push(sim.now - t0);
      if (sim.listener.broadcastCount > 0) echoFree = false;
    }

    results['1. Cold Join Mid-Track (+45s)'] = {
      drifts: computeStats(drifts),
      convTime: computeStats(convTimes),
      echoFree,
      passed: computeStats(drifts).max <= 0.5 && echoFree,
    };
  }

  // --------------------------------------------------------------------------
  // Scenario 2: Host Scrub / Seek Jump (+60s forward & -30s backward)
  // --------------------------------------------------------------------------
  {
    const driftsForward = [];
    const driftsBackward = [];
    let echoFree = true;

    for (let i = 0; i < TRIALS; i++) {
      const sim = new SyncSimulation();
      // Initialize both playing in lockstep at 30s
      sim.host.isPlaying = true;
      sim.listener.isPlaying = true;
      sim.host.playerCurrentTime = 30;
      sim.listener.playerCurrentTime = 30;

      // 2a. Scrub forward +60s -> 90s
      sim.host.hostSeekTo(90);
      sim.drainAndSettle(500);
      driftsForward.push(sim.getDrift());

      // 2b. Scrub backward -30s -> 60s
      sim.host.hostSeekTo(60);
      sim.drainAndSettle(500);
      driftsBackward.push(sim.getDrift());

      if (sim.listener.broadcastCount > 0) echoFree = false;
    }

    const allDrifts = [...driftsForward, ...driftsBackward];
    results['2. Host Scrub / Seek (+60s / -30s)'] = {
      drifts: computeStats(allDrifts),
      echoFree,
      passed: computeStats(allDrifts).max <= 0.5 && echoFree,
    };
  }

  // --------------------------------------------------------------------------
  // Scenario 3: Rapid Play -> Pause -> Play Toggle Burst (3 toggles in 1.2s)
  // --------------------------------------------------------------------------
  {
    let correctFinalStates = 0;
    let totalRejectedStale = 0;
    let echoFree = true;

    for (let i = 0; i < TRIALS; i++) {
      const sim = new SyncSimulation();
      sim.host.isPlaying = false;
      sim.listener.isPlaying = false;

      // Rapid toggle burst:
      // t = 0: PLAY (rev 1)
      sim.host.hostTogglePlay();
      sim.step(400); // 400ms

      // t = 400ms: PAUSE (rev 2)
      sim.host.hostTogglePlay();
      sim.step(400); // 800ms

      // t = 800ms: PLAY (rev 3)
      sim.host.hostTogglePlay();

      // Drain network with randomized transit delays (some packets can arrive out of order)
      sim.drainAndSettle(600);

      // Verification: Listener MUST be in PLAY state (never inverted)
      if (sim.listener.isPlaying === true && sim.host.isPlaying === true) {
        correctFinalStates++;
      }
      totalRejectedStale += sim.listener.stalePacketsRejected;
      if (sim.listener.broadcastCount > 0) echoFree = false;
    }

    results['3. Rapid Toggle Burst (3 in 1.2s)'] = {
      stateAccuracy: (correctFinalStates / TRIALS) * 100,
      totalStalePacketsRejected: totalRejectedStale,
      echoFree,
      passed: correctFinalStates === TRIALS && echoFree,
    };
  }

  // --------------------------------------------------------------------------
  // Scenario 4: Track Skip / Auto-Advance Transition
  // --------------------------------------------------------------------------
  {
    const drifts = [];
    let alignedTrackCount = 0;
    let echoFree = true;

    for (let i = 0; i < TRIALS; i++) {
      const sim = new SyncSimulation();
      sim.host.isPlaying = true;
      sim.listener.isPlaying = true;
      sim.host.playerCurrentTime = 120;
      sim.listener.playerCurrentTime = 120;

      // Host skips to new track
      sim.host.hostSelectTrack('track-02', 'vid-02');
      sim.drainAndSettle(500);

      const drift = sim.getDrift();
      drifts.push(drift);
      if (sim.listener.trackId === 'track-02' && sim.host.trackId === 'track-02') {
        alignedTrackCount++;
      }
      if (sim.listener.broadcastCount > 0) echoFree = false;
    }

    results['4. Track Skip / Auto-Advance'] = {
      drifts: computeStats(drifts),
      alignedTrackCount,
      echoFree,
      passed: computeStats(drifts).max <= 0.5 && alignedTrackCount === TRIALS && echoFree,
    };
  }

  // --------------------------------------------------------------------------
  // Scenario 5: Mobile Tab Background -> Foreground Return (8s hidden -> visible)
  // --------------------------------------------------------------------------
  {
    const drifts = [];
    let echoFree = true;

    for (let i = 0; i < TRIALS; i++) {
      const sim = new SyncSimulation();
      sim.host.isPlaying = true;
      sim.listener.isPlaying = true;
      sim.host.playerCurrentTime = 20;
      sim.listener.playerCurrentTime = 20;
      sim.host.progressSeconds = 20;
      sim.listener.progressSeconds = 20;

      // Listener goes background
      sim.listener.onVisibilityChange('hidden');

      // 8 seconds pass while host continues playing in foreground
      sim.step(8000);

      // Listener returns to foreground
      sim.listener.onVisibilityChange('visible');
      sim.drainAndSettle(300);

      const drift = sim.getDrift();
      drifts.push(drift);
      if (sim.listener.broadcastCount > 0) echoFree = false;
    }

    results['5. Mobile Background Return (8s)'] = {
      drifts: computeStats(drifts),
      echoFree,
      passed: computeStats(drifts).max <= 0.5 && echoFree,
    };
  }

  // --------------------------------------------------------------------------
  // Scenario 6: Network Jitter / Packet Transit Delay (50ms-350ms variable latency)
  // --------------------------------------------------------------------------
  {
    const drifts = [];
    let echoFree = true;

    for (let i = 0; i < TRIALS; i++) {
      const sim = new SyncSimulation();
      sim.host.isPlaying = true;
      sim.listener.isPlaying = true;

      // Simulate 15s session with host periodic sync every 5s under heavy variable latency
      sim.step(5000);
      sim.host.hostBroadcastPeriodicSync();
      sim.step(5000);
      sim.host.hostBroadcastPeriodicSync();
      sim.step(5000);
      sim.host.hostBroadcastPeriodicSync();
      sim.drainAndSettle(500);

      drifts.push(sim.getDrift());
      if (sim.listener.broadcastCount > 0) echoFree = false;
    }

    results['6. Variable Network Jitter (50-350ms)'] = {
      drifts: computeStats(drifts),
      echoFree,
      passed: computeStats(drifts).mean <= 0.35 && computeStats(drifts).max <= 0.8 && echoFree,
    };
  }

  // --------------------------------------------------------------------------
  // Scenario 7: Host Page Refresh / Reconnect
  // --------------------------------------------------------------------------
  {
    const drifts = [];
    let echoFree = true;

    for (let i = 0; i < TRIALS; i++) {
      const sim = new SyncSimulation();
      sim.host.isPlaying = true;
      sim.listener.isPlaying = true;
      sim.host.playerCurrentTime = 50;
      sim.listener.playerCurrentTime = 50;

      // Host refreshes page (simulate 1500ms offline reload)
      const disconnectTime = sim.now;
      const hostPositionAtDisconnect = sim.host.playerCurrentTime;
      sim.step(1500);

      // Host reconnects and recovers room state from DB
      const dbPlayback = {
        isPlaying: true,
        currentTrackId: 'track-01',
        progressSeconds: hostPositionAtDisconnect,
        lastUpdatedTimestamp: disconnectTime,
        updatedAt: new Date(disconnectTime).toISOString(),
        revision: sim.host.playbackRevision,
      };
      sim.host.executeColdJoin(dbPlayback);

      // Host broadcasts sync upon reconnection
      sim.host.hostBroadcastPeriodicSync();
      sim.drainAndSettle(400);

      drifts.push(sim.getDrift());
      if (sim.listener.broadcastCount > 0) echoFree = false;
    }

    results['7. Host Reconnect & State Restore'] = {
      drifts: computeStats(drifts),
      echoFree,
      passed: computeStats(drifts).max <= 0.5 && echoFree,
    };
  }

  const durationMs = (performance.now() - startTime).toFixed(1);

  // --------------------------------------------------------------------------
  // PRINT TELEMETRY REPORT
  // --------------------------------------------------------------------------
  console.log('\n' + '-'.repeat(80));
  console.log(' TELEMETRY RESULTS SUMMARY (N = 50 trials per scenario)');
  console.log('-'.repeat(80));
  console.log(
    'Scenario'.padEnd(42) +
    'Mean Drift'.padEnd(12) +
    'P95 Drift'.padEnd(12) +
    'Max Drift'.padEnd(12) +
    'Status'
  );
  console.log('-'.repeat(80));

  let allPassed = true;

  for (const [name, data] of Object.entries(results)) {
    const status = data.passed ? '✓ PASS' : '✗ FAIL';
    if (!data.passed) allPassed = false;

    if (data.drifts) {
      console.log(
        name.padEnd(42) +
        `${(data.drifts.mean * 1000).toFixed(0)} ms`.padEnd(12) +
        `${(data.drifts.p95 * 1000).toFixed(0)} ms`.padEnd(12) +
        `${(data.drifts.max * 1000).toFixed(0)} ms`.padEnd(12) +
        status
      );
    } else {
      console.log(
        name.padEnd(42) +
        `Acc: ${data.stateAccuracy}%`.padEnd(12) +
        `Stale: ${data.totalStalePacketsRejected}`.padEnd(12) +
        '-'.padEnd(12) +
        status
      );
    }
  }

  console.log('='.repeat(80));
  console.log(`TOTAL BENCHMARK EXECUTION TIME: ${durationMs} ms`);
  console.log(`OVERALL SYNC TELEMETRY STATUS: ${allPassed ? 'ALL 7 SCENARIOS PASSED' : 'FAILURES DETECTED'}`);
  console.log('='.repeat(80));

  if (!allPassed) {
    process.exit(1);
  }
}

runBenchmark().catch((err) => {
  console.error('Benchmark crashed:', err);
  process.exit(1);
});

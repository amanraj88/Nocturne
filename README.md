# NOCTURNE

Watch and listen to YouTube together in real time. Create a room, drop YouTube links into the queue, and everyone hears the exact same second with live room chat built in.

**Live:** (https://nocturne-listen.vercel.app/)

---

## Why I built this

Most watch-party sites feel bloated, require everyone to sign up, or fall out of sync the moment someone pauses or switches tabs on their phone. I wanted something fast that works with a single shareable link, built on **Next.js**, **Supabase Realtime**, and the **YouTube IFrame API**.

## How the sync works

Syncing two YouTube embeds sounds simple until you actually try it. If you just broadcast the host's current timestamp every few seconds, network lag makes the listener fall behind—and when the listener's player fires an `onStateChange` event after seeking, it accidentally echoes that event back to the room and triggers an infinite seek loop.

Here is how NOCTURNE handles it:

* **Latency math instead of blind timestamps:** Every playback event sends `basePositionSeconds`, a `revision` number, and the wall-clock `updatedAt` timestamp. The listener computes `basePositionSeconds + (now - updatedAt) / 1000`, so a 300 ms WebSocket delay doesn't leave them 300 ms behind.
* **Echo suppression:** A 1.5-second seek deadband (`lastSeekTimestampRef`) and host-only broadcast guards stop listener buffer events from bouncing back to the host.
* **Out-of-order packet filtering:** If the host toggles play/pause three times in a second, the listener ignores any packet with an older `revision` number.
* **Mobile tab recovery:** Mobile browsers pause background tabs and block unmuted autoplay when you switch back. Listening to `visibilitychange` jumps the listener straight to the live elapsed second and shows a one-tap unmute button if the browser blocks audio.

## Measured sync drift

To see how tight the sync actually is outside of local testing, I wrote a Playwright benchmark (`tests/live-browser-sync-benchmark.mjs`) that launches two separate Chromium instances connected over Supabase Realtime with real YouTube embeds playing ($N = 10$ samples per test):

| Scenario | Lowest Drift | Average Drift | Highest Drift | Time to Settle |
| --- | --- | --- | --- | --- |
| **Joining mid-track (+15s)** | 1,115 ms | 1,128 ms | 1,131 ms | 6.0 s |
| **Host scrubbing (+30s)** | 120 ms | 129 ms | 206 ms | 530 ms |
| **Rapid play/pause burst (3x in 1.5s)** | 109 ms | 504 ms | 1,629 ms | 179 ms |
| **Skipping to next track** | 79 ms | 662 ms | 1,008 ms | 1.07 s |
| **Mobile tab switch (5s hidden)** | 0 ms | 543 ms | 568 ms | 3.5 s |
| **300 ms simulated network lag** | 340 ms | 1,055 ms | 2,458 ms | 455 ms |
| **Host refreshing the page** | 439 ms | 655 ms | 661 ms | 3.5 s |

*(YouTube streams video in ~2-second HLS/DASH keyframe chunks, so sub-second drift on seeks and tab returns is about as tight as the IFrame API allows.)*

## Running it locally

Clone the repo, run `npm install`, and add a `.env.local` file with your Supabase keys:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=

```

Start the dev server:

```bash
npm run dev

```

### Tests & benchmarks

```bash
# Type check + 46 unit, RLS security, and sync tests
npx tsc --noEmit
node --test tests/targeted-fixes.test.mjs tests/playback-sync.test.mjs tests/permissions-regressions.test.mjs tests/cleanup-security.test.mjs

# Fast Monte Carlo sync simulation (50 trials/scenario)
node tests/sync-telemetry-benchmark.mjs

# Live two-browser Chromium + Supabase benchmark
node tests/live-browser-sync-benchmark.mjs

```

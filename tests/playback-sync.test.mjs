import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Playback Synchronization & Light Theme Invariants', async (t) => {
  const vinylStageSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/lounge/VinylStage.tsx'), 'utf8');
  const loungeCtxSrc = fs.readFileSync(path.join(process.cwd(), 'src/context/LoungeContext.tsx'), 'utf8');
  const headerSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/Header.tsx'), 'utf8');
  const footerSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/Footer.tsx'), 'utf8');
  const globalsCss = fs.readFileSync(path.join(process.cwd(), 'src/styles/globals.css'), 'utf8');

  await t.test('1. VinylStage uses loadedYoutubeIdRef to prevent video reloads on play/pause', () => {
    assert.ok(vinylStageSrc.includes('loadedYoutubeIdRef'), 'VinylStage must track loaded video ID with ref');
    assert.ok(vinylStageSrc.includes('loadedYoutubeIdRef.current !== targetYtId'), 'VinylStage must only reload when target YouTube ID changes');
    assert.ok(vinylStageSrc.includes('player.playVideo?.()'), 'VinylStage must play video on resume without calling loadVideoById');
    assert.ok(vinylStageSrc.includes('player.pauseVideo?.()'), 'VinylStage must pause video without calling cueVideoById');
  });

  await t.test('2. VinylStage contains continuous playhead tracking & gentle drift correction', () => {
    assert.ok(vinylStageSrc.includes('Periodic playhead tracking & gentle drift correction'), 'VinylStage must have continuous drift correction effect');
    assert.ok(vinylStageSrc.includes('drift > 2.5'), 'Drift threshold must be calibrated around 2.5s');
    assert.ok(vinylStageSrc.includes('player.seekTo'), 'Must seek to authoritative targetSeconds when drifted');
  });

  await t.test('3. LoungeContext togglePlay captures authoritative live YouTube time at toggle moment', () => {
    assert.ok(loungeCtxSrc.includes('ytPlayerRef.current.getCurrentTime()'), 'togglePlay must inspect live player time');
    assert.ok(loungeCtxSrc.includes('progressSecondsRef.current = realTime'), 'Must set real-time position into ref before broadcast');
  });

  await t.test('4. LoungeContext host sync broadcasts authoritative progress to room members over Realtime', () => {
    assert.ok(loungeCtxSrc.includes("realtimeChannelRef.current.send"), 'Host interval must broadcast playhead');
    assert.ok(loungeCtxSrc.includes("progressSeconds: currentSecs"), 'Broadcast must supply authoritative seconds');
    assert.ok(loungeCtxSrc.includes("type: 'PLAY'"), 'Broadcast must supply playback event');
  });

  await t.test('5. LoungeContext handleRealtimePlayback checks drift against live YouTube player', () => {
    assert.ok(loungeCtxSrc.includes('ytPlayerRef.current?.getCurrentTime'), 'handleRealtimePlayback must read live player clock');
    assert.ok(loungeCtxSrc.includes('const drift = Math.abs(localCurrentTime - payload.progressSeconds)'), 'Must calculate drift against local player time');
    assert.ok(loungeCtxSrc.includes('if (drift > 2.0)'), 'Must enforce 2.0s drift threshold');
  });

  await t.test('6. Header isRoomPage strictly matches /room and /room/ without false-positive on /rooms', () => {
    assert.ok(headerSrc.includes("router.pathname === '/room' || router.pathname.startsWith('/room/')"), 'isRoomPage must not match /rooms');
    assert.ok(headerSrc.includes("text-[#7C3AED] dark:text-white font-semibold border-b-2 border-[#7C3AED] dark:border-[#8B5CF6]"), 'Active /rooms link must use deep violet text in light mode');
  });

  await t.test('7. globals.css enforces violet contrast on active nav links and dark text in Light Mode', () => {
    assert.ok(globalsCss.includes("html.light header nav a.border-b-2 *"), 'Active header nav items must force #7C3AED in light mode');
    assert.ok(globalsCss.includes("color: #7C3AED !important"), 'Violet color must be forced with !important');
    assert.ok(globalsCss.includes("color: #5E5873 !important"), 'Non-active header nav items must use #5E5873 in light mode');
  });

  await t.test('8. Footer cleanly supports light mode and dark mode', () => {
    assert.ok(footerSrc.includes('bg-white dark:bg-[#0F0E17]'), 'Footer must have light background in light mode');
    assert.ok(footerSrc.includes('border-[#EDEAF5] dark:border-[#2D2945]'), 'Footer border must be light in light mode');
    assert.ok(footerSrc.includes('text-[#12101F] dark:text-white'), 'Footer title must be dark in light mode');
  });
});

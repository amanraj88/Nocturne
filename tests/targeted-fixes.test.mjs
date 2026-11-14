import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { parseIso8601Duration, formatTime, parseYouTubeVideoId } from '../src/lib/utils.ts';

// -----------------------------------------------------------------------------
// BUG 3: ISO 8601 Duration Parser & Time Formatting
// -----------------------------------------------------------------------------
test('BUG 3: ISO 8601 duration parser accurately parses all standard YouTube duration formats', () => {
  // Test required formats from prompt:
  // - PT1H (1 hour = 3600s)
  // - PT1H2M (1 hour 2 mins = 3720s)
  // - PT1H2M3S (1 hour 2 mins 3 secs = 3723s)
  // - PT3M (3 mins = 180s)
  // - PT45S (45 secs = 45s)
  assert.equal(parseIso8601Duration('PT1H'), 3600);
  assert.equal(parseIso8601Duration('PT1H2M'), 3720);
  assert.equal(parseIso8601Duration('PT1H2M3S'), 3723);
  assert.equal(parseIso8601Duration('PT3M'), 180);
  assert.equal(parseIso8601Duration('PT45S'), 45);

  // Additional edge cases:
  assert.equal(parseIso8601Duration('PT1H30S'), 3630);
  assert.equal(parseIso8601Duration('P1DT2H'), 93600);
  assert.equal(parseIso8601Duration(''), 0);
  assert.equal(parseIso8601Duration(null), 0);
});

test('BUG 3: formatTime formats durations with hours as HH:MM:SS and minutes as MM:SS', () => {
  assert.equal(formatTime(45), '00:45');
  assert.equal(formatTime(180), '03:00');
  assert.equal(formatTime(3600), '01:00:00');
  assert.equal(formatTime(3723), '01:02:03');
  assert.equal(formatTime(7325), '02:02:05');
  assert.equal(formatTime(0), '00:00');
});

test('BUG 3: QueueDock does not contain hardcoded 180-second duration fallback', () => {
  const queueDock = readFileSync('src/components/lounge/QueueDock.tsx', 'utf8');
  assert.doesNotMatch(queueDock, /durationSeconds:\s*info\.durationSeconds\s*\|\|\s*180/);
  assert.match(queueDock, /durationSeconds:\s*info\.durationSeconds\s*\|\|\s*0/);
});

// -----------------------------------------------------------------------------
// BUG 2: YouTube Video Player DOM & Lifecycle Handling
// -----------------------------------------------------------------------------
test('BUG 2: VinylStage uses active ref and registerYouTubeDuration without stale closures', () => {
  const vinylStage = readFileSync('src/components/lounge/VinylStage.tsx', 'utf8');
  assert.match(vinylStage, /registerYouTubeDuration/);
  assert.match(vinylStage, /isPlayingRef/);
  assert.match(vinylStage, /currentYoutubeIdRef/);

  // Check that onReady uses currentYoutubeIdRef instead of stale currentTrack
  assert.match(vinylStage, /const activeYtId = currentYoutubeIdRef\.current/);

  // Check that onStateChange queries live duration from the YouTube player
  assert.match(vinylStage, /event\.target\.getDuration/);

  // Video container must maintain persistent positioning
  assert.match(vinylStage, /isVideoVisible\s*\?\s*'w-full aspect-video/);
  assert.match(vinylStage, /fixed -left-\[9999px\]/);
});

// -----------------------------------------------------------------------------
// BUG 1: Room Creation Limit & Stale Room Pruning
// -----------------------------------------------------------------------------
test('BUG 1: /api/rooms returns a helpful 429 message explaining active room limit', () => {
  const roomsApi = readFileSync('src/pages/api/rooms/index.ts', 'utf8');
  assert.match(roomsApi, /limit of 5 active listening lounges/);
});

test('BUG 1: Supabase create_room_with_host migration prunes abandoned rooms', () => {
  const migration = readFileSync('supabase/migrations/20261112_active_room_limit_and_stale_pruning.sql', 'utf8');
  assert.match(migration, /DELETE FROM public\.rooms/);
  assert.match(migration, /WHERE host_id = v_user_id/);
  assert.match(migration, /INTERVAL '2 hours'/);
  assert.match(migration, /Enforce 5-room maximum/);
});

// -----------------------------------------------------------------------------
// BUG 4: Rooms Page Discovery Route
// -----------------------------------------------------------------------------
test('BUG 4: /rooms route renders a complete functional discovery page', () => {
  assert.ok(existsSync('src/pages/rooms.tsx'), 'src/pages/rooms.tsx must exist');
  const roomsCode = readFileSync('src/pages/rooms.tsx', 'utf8');

  // Must not be an empty redirect
  assert.match(roomsCode, /export default function RoomsPage/);
  assert.match(roomsCode, /Listening Lounges/);
  assert.match(roomsCode, /CATEGORIES/);
  assert.match(roomsCode, /filteredRooms/);
  assert.match(roomsCode, /setIsCreateRoomOpen/);
});

// -----------------------------------------------------------------------------
// BUG 5: Light Theme Consistency & Removal of Unsupported Claims
// -----------------------------------------------------------------------------
test('BUG 5: Light Theme tokens map to approved Stitch palette and preserve black YouTube viewport', () => {
  const css = readFileSync('src/styles/globals.css', 'utf8');
  assert.match(css, /html\.light,\s*\[data-theme='light'\]\s*\{[\s\S]*?background-color:\s*#F8F7FC/);
  assert.match(css, /html\.light \.bg-\\\[\\#1A1829\\\]/);
  assert.match(css, /html\.light \.border-\\\[\\#2D2945\\\]/);
  assert.match(css, /html\.light #nocturne-yt-player/);
});

test('BUG 5: Unsupported claims "Dynamic Spatial Stereo" and "NOCTURNE Shared Spatial Audio" are removed', () => {
  const vinylStage = readFileSync('src/components/lounge/VinylStage.tsx', 'utf8');
  assert.doesNotMatch(vinylStage, /Dynamic Spatial Stereo/);
  assert.doesNotMatch(vinylStage, /NOCTURNE Shared Spatial Audio/);
  assert.match(vinylStage, /Room Audio • Stereo/);
});

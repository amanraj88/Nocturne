import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('1. VinylStage guards player.seekTo and getCurrentTime to prevent runtime TypeError', () => {
  const vinylCode = readFileSync('src/components/lounge/VinylStage.tsx', 'utf8');
  assert.match(vinylCode, /typeof player\.seekTo === 'function'/);
  assert.match(vinylCode, /typeof player\.getCurrentTime === 'function'/);
});

test('2. Room Lifecycle SQL Migration defines is_room_active with 5-minute grace policy', () => {
  const migrationPath = 'supabase/migrations/20261112_active_room_lifecycle_and_presence.sql';
  assert.ok(existsSync(migrationPath), 'Migration file must exist');
  const migrationSql = readFileSync(migrationPath, 'utf8');
  assert.match(migrationSql, /FUNCTION public\.is_room_active/);
  assert.match(migrationSql, /INTERVAL '5 minutes'/);
  assert.match(migrationSql, /FUNCTION public\.get_active_rooms/);
  assert.match(migrationSql, /FUNCTION public\.touch_room_membership/);
  assert.match(migrationSql, /FUNCTION public\.leave_room_membership/);
});

test('3. API routes enforce active room lifecycle and honest listener counts', () => {
  const roomsApi = readFileSync('src/pages/api/rooms/index.ts', 'utf8');
  assert.match(roomsApi, /get_active_rooms/);

  const stateApi = readFileSync('src/pages/api/rooms/[id]/state.ts', 'utf8');
  assert.match(stateApi, /is_room_active/);
  assert.match(stateApi, /room_memberships/);
  assert.match(stateApi, /last_seen/);
});

test('4. Real User-Created Rooms: HeroSection and LiveLoungesGrid have zero fabricated counts', () => {
  const heroCode = readFileSync('src/components/home/HeroSection.tsx', 'utf8');
  assert.doesNotMatch(heroCode, /12 \+ idx \* 4/, 'HeroSection must not fabricate listener count');
  assert.doesNotMatch(heroCode, /FEATURED_ROOMS/, 'HeroSection must not use hardcoded mock rooms');
  assert.match(heroCode, /room\.listenerCount/, 'HeroSection must use genuine listenerCount');

  const gridCode = readFileSync('src/components/home/LiveLoungesGrid.tsx', 'utf8');
  assert.doesNotMatch(gridCode, /18 - idx \* 4/, 'LiveLoungesGrid must not fabricate listener count');
  assert.doesNotMatch(gridCode, /FEATURED_ROOMS/, 'LiveLoungesGrid must not use hardcoded mock rooms');
  assert.match(gridCode, /No Public Lounges Live/, 'LiveLoungesGrid must render honest empty state');
});

test('5. Mini-Player Stale State: Clears on endRoom/leaveRoom and returns null when empty', () => {
  const miniCode = readFileSync('src/components/layout/MiniPlayer.tsx', 'utf8');
  assert.match(miniCode, /!currentRoom\?\.id\s*\|\|\s*!currentRoom\?\.slug\s*\|\|\s*!currentTrack/);
  assert.doesNotMatch(miniCode, /'tokyo-afterhours'/, 'MiniPlayer must not fallback to mock room slug');
  assert.doesNotMatch(miniCode, /'Shibuya Midnight Reverie'/, 'MiniPlayer must not fallback to mock room title');
  assert.match(miniCode, /leaveRoom/, 'MiniPlayer must provide dismissal/leave capability');

  const contextCode = readFileSync('src/context/LoungeContext.tsx', 'utf8');
  assert.match(contextCode, /leaveRoom/, 'LoungeContext must provide leaveRoom action');
  assert.match(contextCode, /touch_room_membership/, 'LoungeContext must send periodic presence heartbeats');
});

test('6. PhilosophySection: Redesigned into distinctive editorial storytelling layout', () => {
  const philoCode = readFileSync('src/components/home/PhilosophySection.tsx', 'utf8');
  assert.doesNotMatch(philoCode, /heading:\s*'Queue together\.'/, 'PhilosophySection must not use generic cards');
  assert.match(philoCode, /COMMUNAL SOUND SYSTEM/, 'PhilosophySection must use editorial storytelling header');
  assert.match(philoCode, /TRANSIENT ROOM LIFECYCLES/, 'PhilosophySection must emphasize room lifecycles');
});

test('7. Light Theme Readability & Black Video Monitor Invariant', () => {
  const css = readFileSync('src/styles/globals.css', 'utf8');
  assert.match(css, /html\.light #nocturne-yt-player[\s\S]*background-color:\s*#000000 !important/);
  assert.match(css, /html\.light \.text-\\\[\\\#A19EB5\\\][\s\S]*color:\s*#5E5873 !important/);
  assert.match(css, /html\.light \.text-\\\[\\\#4ADE80\\\][\s\S]*color:\s*#16A34A !important/);
});

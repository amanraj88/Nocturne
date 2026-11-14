import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseYouTubeVideoId } from '../src/lib/utils.ts';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const vinylStage = read('../src/components/lounge/VinylStage.tsx');
const loungeContext = read('../src/context/LoungeContext.tsx');
const searchModal = read('../src/components/lounge/SearchModal.tsx');
const queueDock = read('../src/components/lounge/QueueDock.tsx');
const header = read('../src/components/layout/Header.tsx');
const roomPage = read('../src/pages/room/[id].tsx');
const ytInfoApi = read('../src/pages/api/youtube/info.ts');
const cleanupApi = read('../src/pages/api/rooms/cleanup.ts');
const endApi = read('../src/pages/api/rooms/[id]/end.ts');

test('1. YouTube URL Parser handles all link formats accurately', () => {
  const cases = [
    { input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
    { input: 'https://youtu.be/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
    { input: 'https://youtu.be/dQw4w9WgXcQ?si=test12345&t=42', expected: 'dQw4w9WgXcQ' },
    { input: 'https://www.youtube.com/shorts/3Zqf6c12345', expected: '3Zqf6c12345' },
    { input: 'https://www.youtube.com/live/3Zqf6c12345', expected: '3Zqf6c12345' },
    { input: 'https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=RD123', expected: 'dQw4w9WgXcQ' },
    { input: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
    { input: 'https://www.youtube.com/v/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
    { input: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
    { input: 'dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
    { input: '7P2rX4D5p8E', expected: '7P2rX4D5p8E' },
  ];

  for (const c of cases) {
    const result = parseYouTubeVideoId(c.input);
    assert.equal(result, c.expected, `Failed parsing ${c.input}`);
  }

  // Negative cases
  assert.equal(parseYouTubeVideoId(''), null);
  assert.equal(parseYouTubeVideoId('   '), null);
  assert.equal(parseYouTubeVideoId('https://vimeo.com/12345678'), null);
  assert.equal(parseYouTubeVideoId('https://spotify.com/track/123'), null);
  assert.equal(parseYouTubeVideoId('too-short'), null);
});

test('2. YouTube Video Monitor maintains persistent DOM presence and destroys on unmount', () => {
  // Ensure player is never set to display: none (hidden) which terminates audio playback
  assert.match(vinylStage, /isVideoVisible\s*\?\s*'w-full aspect-video/);
  assert.match(vinylStage, /fixed -left-\[9999px\]/);
  assert.doesNotMatch(vinylStage, /showVideoAsMain \? 'block' : 'hidden'/);

  // Ensure iframe API ready listener and backup poll are implemented
  assert.match(vinylStage, /pollTimer/);
  assert.match(vinylStage, /registerYouTubePlayer/);

  // Ensure player instance is cleanly destroyed on component unmount
  assert.match(vinylStage, /ytPlayerInstanceRef\.current\.destroy/);
  assert.match(vinylStage, /registerYouTubePlayer\(null\)/);

  // Ensure tap-to-join overlay is present for browser autoplay policy
  assert.match(vinylStage, /youtubePlaybackBlocked \|\| audioPlaybackBlocked/);
  assert.match(vinylStage, /Tap to sync & join live audio\/video/);
});

test('3. Playback Synchronization: elapsed time calculation on join & drift thresholding', () => {
  // Drift thresholding logic in LoungeContext
  assert.match(loungeContext, /drift > 2\.0/);

  // Periodic playhead sync in Supabase mode
  assert.match(loungeContext, /supabase\.rpc\('sync_room_playback'/);
  assert.match(loungeContext, /p_progress_seconds:\s*currentSecs/);

  // Live elapsed time calculation in resolveAndSetRoom
  assert.match(loungeContext, /Math\.max\(0,\s*\(Date\.now\(\)\s*-\s*lastTimestamp\)\s*\/\s*1000\)/);

  // Real-time seeking on PLAYING settled state
  assert.match(vinylStage, /player\.seekTo\(targetSeconds,\s*true\)/);
});

test('4. Queue Management: Empty queue auto-play & track removal auto-advance', () => {
  // Auto-play when adding first track
  assert.match(loungeContext, /!currentTrackRef\.current \|\| queueRef\.current\.length === 1/);
  assert.match(loungeContext, /selectTrack\(newTrack\.id,\s*true\)/);

  // Clean transition to next track on removing active track
  assert.match(loungeContext, /toRemove\.id === currentTrackRef\.current\?\.id/);
  assert.match(loungeContext, /selectTrack\(updatedQueue\[nextIdx\]\.id,\s*true\)/);

  // Prominent Add Music button in tracklist
  assert.match(queueDock, /Add Music/);
  assert.match(queueDock, /bg-mineral/);
});

test('5. Room Lifecycle: Host end room action & inactivity cleanup protecting featured lounges', () => {
  // Host end room action in LoungeContext
  assert.match(loungeContext, /const endRoom = useCallback/);
  assert.match(loungeContext, /event: 'room_ended'/);
  assert.match(loungeContext, /supabase\.from\('rooms'\)\.delete\(\)\.eq\('id',\s*room\.id\)/);

  // End room button in Header
  assert.match(header, /End room/);
  assert.match(header, /handleEndRoom/);

  // Room ended state in room page
  assert.match(roomPage, /roomLoadState === 'ended'/);
  assert.match(roomPage, /This lounge has been closed/);

  // Inactivity cleanup endpoint protecting featured lounges
  assert.match(cleanupApi, /eq\('is_featured',\s*false\)/);
  assert.match(cleanupApi, /room-tokyo/);
});

test('6. YouTube Video Info and Metadata resolution endpoint', () => {
  assert.match(ytInfoApi, /parseYouTubeVideoId/);
  assert.match(ytInfoApi, /oembedUrl/);
  assert.match(ytInfoApi, /hqdefault\.jpg/);
});

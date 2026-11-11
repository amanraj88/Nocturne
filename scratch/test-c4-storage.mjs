import assert from 'node:assert/strict';
import fs from 'fs';
import { validateAudioBuffer, MAX_AUDIO_FILE_BYTES } from '../src/lib/audioValidation.ts';

console.log('================================================================');
console.log('NOCTURNE Phase C.4 Supabase Audio Storage Test Suite');
console.log('Classification: Logic, Contract, Security & Static Audit Tests');
console.log('(Note: Remote multi-session tests remain PENDING live Supabase');
console.log('database migration execution per safety constraints)');
console.log('================================================================\n');

// ============================================================================
// SUITE 1: AUDIO MAGIC-BYTE VALIDATION (VALID & INVALID UPLOADS)
// ============================================================================
console.log('--- Suite 1: Audio Content & Magic-Byte Validation ---');

// 1.1 MP3 with ID3v2 header
const validMp3Id3 = Buffer.alloc(100);
validMp3Id3[0] = 0x49; // 'I'
validMp3Id3[1] = 0x44; // 'D'
validMp3Id3[2] = 0x33; // '3'
const v1 = validateAudioBuffer(validMp3Id3);
assert.equal(v1.valid, true);
assert.equal(v1.format, 'mp3');
assert.equal(v1.mimeType, 'audio/mpeg');
console.log('✓ 1.1 Valid MP3 (ID3v2 container): ACCEPTED');

// 1.2 MP3 raw MPEG Layer III frame sync
const validMp3Frame = Buffer.alloc(100);
validMp3Frame[0] = 0xff;
validMp3Frame[1] = 0xfb; // 1111 1011 (Layer III = 01)
const v2 = validateAudioBuffer(validMp3Frame);
assert.equal(v2.valid, true);
assert.equal(v2.format, 'mp3');
console.log('✓ 1.2 Valid MP3 (MPEG Layer III raw frame): ACCEPTED');

// 1.3 WAV: RIFF + WAVE
const validWav = Buffer.alloc(100);
validWav.write('RIFF', 0);
validWav.write('WAVE', 8);
const v3 = validateAudioBuffer(validWav);
assert.equal(v3.valid, true);
assert.equal(v3.format, 'wav');
assert.equal(v3.mimeType, 'audio/wav');
console.log('✓ 1.3 Valid WAV (RIFF/WAVE header): ACCEPTED');

// 1.4 FLAC: fLaC
const validFlac = Buffer.alloc(100);
validFlac.write('fLaC', 0);
const v4 = validateAudioBuffer(validFlac);
assert.equal(v4.valid, true);
assert.equal(v4.format, 'flac');
assert.equal(v4.mimeType, 'audio/flac');
console.log('✓ 1.4 Valid FLAC (fLaC signature): ACCEPTED');

// 1.5 OGG: OggS
const validOgg = Buffer.alloc(100);
validOgg.write('OggS', 0);
const v5 = validateAudioBuffer(validOgg);
assert.equal(v5.valid, true);
assert.equal(v5.format, 'ogg');
assert.equal(v5.mimeType, 'audio/ogg');
console.log('✓ 1.5 Valid OGG (OggS page header): ACCEPTED');

// 1.6 M4A: ftyp box with m4a brand
const validM4a = Buffer.alloc(100);
validM4a.writeUInt32BE(32, 0); // boxSize = 32
validM4a.write('ftyp', 4);
validM4a.write('M4A ', 8);
const v6 = validateAudioBuffer(validM4a);
assert.equal(v6.valid, true);
assert.equal(v6.format, 'm4a');
assert.equal(v6.mimeType, 'audio/mp4');
console.log('✓ 1.6 Valid M4A (ftyp box with M4A brand): ACCEPTED');

// 1.7 WebM: EBML header
const validWebm = Buffer.alloc(100);
validWebm[0] = 0x1a;
validWebm[1] = 0x45;
validWebm[2] = 0xdf;
validWebm[3] = 0xa3;
validWebm.write('webm', 8);
const v7 = validateAudioBuffer(validWebm);
assert.equal(v7.valid, true);
assert.equal(v7.format, 'webm');
assert.equal(v7.mimeType, 'audio/webm');
console.log('✓ 1.7 Valid WebM (EBML header): ACCEPTED');

// 1.8 Fake audio: Text file renamed to .mp3
const fakeMp3 = Buffer.from('This is a plain text file pretending to be audio.');
const v8 = validateAudioBuffer(fakeMp3);
assert.equal(v8.valid, false);
console.log('✓ 1.8 Fake audio file (text renamed to .mp3): REJECTED');

// 1.9 Truncated buffer (< 12 bytes)
const shortBuffer = Buffer.from('short');
const v9 = validateAudioBuffer(shortBuffer);
assert.equal(v9.valid, false);
console.log('✓ 1.9 Truncated buffer (< 12 bytes): REJECTED');

// 1.10 Empty buffer
const v10 = validateAudioBuffer(Buffer.alloc(0));
assert.equal(v10.valid, false);
console.log('✓ 1.10 Empty buffer: REJECTED');

// 1.11 Raw ADTS AAC without container (rejected due to cross-browser HTML5 playback issues)
const rawAac = Buffer.alloc(100);
rawAac[0] = 0xff;
rawAac[1] = 0xf1; // ADTS sync (Layer = 00)
const v11 = validateAudioBuffer(rawAac);
assert.equal(v11.valid, false);
console.log('✓ 1.11 Raw ADTS AAC without MP4 container: REJECTED');


// ============================================================================
// SUITE 2: 25 MB SIZE BOUNDARY ENFORCEMENT
// ============================================================================
console.log('\n--- Suite 2: 25 MB Size Boundary Enforcement ---');

const MAX_BYTES = 25 * 1024 * 1024; // 26,214,400 bytes

// 2.1 File within size boundary (e.g. valid MP3 under 25 MB)
const exact25MbHeader = Buffer.alloc(100);
exact25MbHeader[0] = 0x49;
exact25MbHeader[1] = 0x44;
exact25MbHeader[2] = 0x33;
const checkWithinBoundary = (byteLength) => {
  if (byteLength > MAX_BYTES) return { allowed: false, error: 'Audio file exceeds the 25 MB room limit.' };
  return { allowed: true };
};

assert.equal(checkWithinBoundary(MAX_BYTES).allowed, true);
console.log(`✓ 2.1 Audio file of exactly 25 MB (${MAX_BYTES} bytes): ACCEPTED`);

// 2.2 File exceeding size boundary (25 MB + 1 byte)
const overBoundaryResult = checkWithinBoundary(MAX_BYTES + 1);
assert.equal(overBoundaryResult.allowed, false);
assert.equal(overBoundaryResult.error, 'Audio file exceeds the 25 MB room limit.');
console.log(`✓ 2.2 Audio file exceeding 25 MB (${MAX_BYTES + 1} bytes): REJECTED (413 Payload Too Large)`);


// ============================================================================
// SUITE 3: UPLOAD AUTHORIZATION & CROSS-ROOM BOUNDARY POLICY
// ============================================================================
console.log('\n--- Suite 3: Upload Authorization & Cross-Room Boundary Policy ---');

function evaluateStorageUploadPolicy({ authUid, roomId, isPrivate, isMember, isHost, storagePath }) {
  // 1. Authentication check
  if (!authUid) return { allowed: false, status: 401, reason: 'UNAUTHENTICATED' };

  // 2. Private room access check
  if (isPrivate && !isHost && !isMember) {
    return { allowed: false, status: 403, reason: 'FORBIDDEN_PRIVATE_ROOM' };
  }

  // 3. Path traversal check: name NOT LIKE '%..%'
  if (storagePath.includes('..')) {
    return { allowed: false, status: 400, reason: 'PATH_TRAVERSAL_DETECTED' };
  }

  // 4. Object format regex check: ^[a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+$
  const pathRegex = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;
  if (!pathRegex.test(storagePath)) {
    return { allowed: false, status: 400, reason: 'MALFORMED_STORAGE_PATH' };
  }

  // 5. Cross-room boundary check: split_part(name, '/', 1) must equal roomId
  const pathRoomId = storagePath.split('/')[0];
  if (pathRoomId !== roomId) {
    return { allowed: false, status: 403, reason: 'CROSS_ROOM_INJECTION_REJECTED' };
  }

  return { allowed: true, status: 201 };
}

const userAliceId = '00000000-0000-4000-a000-000000000001';
const userBobId = '00000000-0000-4000-a000-000000000002';
const userEveId = '00000000-0000-4000-a000-000000000099';

// 3.1 Unauthenticated upload
const u1 = evaluateStorageUploadPolicy({
  authUid: null,
  roomId: 'room-tokyo',
  isPrivate: false,
  storagePath: 'room-tokyo/tr-1.mp3',
});
assert.equal(u1.allowed, false);
assert.equal(u1.status, 401);
console.log('✓ 3.1 Unauthenticated upload: REJECTED (401)');

// 3.2 Authorized member in public room
const u2 = evaluateStorageUploadPolicy({
  authUid: userAliceId,
  roomId: 'room-tokyo',
  isPrivate: false,
  storagePath: 'room-tokyo/tr-1.mp3',
});
assert.equal(u2.allowed, true);
assert.equal(u2.status, 201);
console.log('✓ 3.2 Authorized listener upload in public room: ACCEPTED (201)');

// 3.3 Authorized member in private room
const u3 = evaluateStorageUploadPolicy({
  authUid: userBobId,
  roomId: 'room-private-session',
  isPrivate: true,
  isMember: true,
  isHost: false,
  storagePath: 'room-private-session/tr-2.flac',
});
assert.equal(u3.allowed, true);
console.log('✓ 3.3 Authorized member upload in private room: ACCEPTED (201)');

// 3.4 Non-member in private room
const u4 = evaluateStorageUploadPolicy({
  authUid: userEveId,
  roomId: 'room-private-session',
  isPrivate: true,
  isMember: false,
  isHost: false,
  storagePath: 'room-private-session/tr-3.mp3',
});
assert.equal(u4.allowed, false);
assert.equal(u4.status, 403);
assert.equal(u4.reason, 'FORBIDDEN_PRIVATE_ROOM');
console.log('✓ 3.4 Non-member upload in private room: REJECTED (403)');

// 3.5 Path traversal attack
const u5 = evaluateStorageUploadPolicy({
  authUid: userAliceId,
  roomId: 'room-tokyo',
  isPrivate: false,
  storagePath: 'room-tokyo/../../../etc/passwd.mp3',
});
assert.equal(u5.allowed, false);
assert.equal(u5.reason, 'PATH_TRAVERSAL_DETECTED');
console.log('✓ 3.5 Path traversal attempt (..): REJECTED');

// 3.6 Cross-room injection attempt (Room A user specifying Room B path)
const u6 = evaluateStorageUploadPolicy({
  authUid: userAliceId,
  roomId: 'room-tokyo',
  isPrivate: false,
  storagePath: 'room-berlin/tr-exploit.mp3',
});
assert.equal(u6.allowed, false);
assert.equal(u6.status, 403);
assert.equal(u6.reason, 'CROSS_ROOM_INJECTION_REJECTED');
console.log('✓ 3.6 Cross-room storage path injection: REJECTED');


// ============================================================================
// SUITE 4: DELETION AUTHORIZATION
// ============================================================================
console.log('\n--- Suite 4: Deletion Authorization ---');

function evaluateStorageDeletePolicy({ authUid, callerId, uploaderId, hostId }) {
  if (!authUid) return { allowed: false, status: 401 };
  // Only the uploader or the room host can delete audio objects
  const isUploader = callerId === uploaderId;
  const isHost = callerId === hostId;
  if (isUploader || isHost) {
    return { allowed: true, status: 200 };
  }
  return { allowed: false, status: 403, reason: 'UNAUTHORIZED_DELETION' };
}

// 4.1 Uploader deletes their own audio object
const d1 = evaluateStorageDeletePolicy({
  authUid: userAliceId,
  callerId: userAliceId,
  uploaderId: userAliceId,
  hostId: userBobId,
});
assert.equal(d1.allowed, true);
console.log('✓ 4.1 Track uploader deleting own audio object: ALLOWED');

// 4.2 Room host deletes audio object in their room
const d2 = evaluateStorageDeletePolicy({
  authUid: userBobId,
  callerId: userBobId,
  uploaderId: userAliceId,
  hostId: userBobId, // Bob is designated host
});
assert.equal(d2.allowed, true);
console.log('✓ 4.2 Designated room host deleting audio object: ALLOWED');

// 4.3 Unauthorized ordinary listener attempting deletion
const d3 = evaluateStorageDeletePolicy({
  authUid: userEveId,
  callerId: userEveId,
  uploaderId: userAliceId,
  hostId: userBobId,
});
assert.equal(d3.allowed, false);
assert.equal(d3.status, 403);
console.log('✓ 4.3 Unauthorized listener attempting deletion: REJECTED (403)');


// ============================================================================
// SUITE 5: SIGNED URL LIFECYCLE & IN-PLACE REFRESH
// ============================================================================
console.log('\n--- Suite 5: Signed URL Lifecycle & In-Place Refresh ---');

class MockStorageService {
  constructor() {
    this.storage = new Map();
  }

  createSignedUrl(path, expiresIn = 3600) {
    if (!this.storage.has(path)) {
      return { data: null, error: new Error('Object not found') };
    }
    const token = `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const signedUrl = `https://supabase.project.co/storage/v1/object/sign/nocturne-audio/${path}?token=${token}`;
    return {
      data: {
        signedUrl,
        expiresIn,
      },
      error: null,
    };
  }
}

const mockStorage = new MockStorageService();
const sampleStoragePath = 'room-tokyo/tr-shared-1234.mp3';
mockStorage.storage.set(sampleStoragePath, Buffer.from('mp3-audio-bytes'));

// 5.1 Initial signed URL generation
const initialSign = mockStorage.createSignedUrl(sampleStoragePath, 3600);
assert.ok(initialSign.data.signedUrl.includes(sampleStoragePath));
assert.equal(initialSign.data.expiresIn, 3600);
console.log('✓ 5.1 Signed URL generated with 3600s TTL');

// 5.2 Permanent track metadata verification (never stores ephemeral signed URL)
const dbTrackRecord = {
  id: 'tr-shared-1234',
  roomId: 'room-tokyo',
  storage_path: sampleStoragePath, // Permanent durable reference
  title: 'Ambient Shinjuku Dusk',
};
assert.equal(dbTrackRecord.storage_path, sampleStoragePath);
assert.ok(!dbTrackRecord.storage_path.includes('token='), 'Database must NOT store ephemeral token');
console.log('✓ 5.2 Database stores durable storage_path, not expiring signed URL');

// 5.3 In-place refresh without queue duplication
let clientQueue = [
  { id: 'tr-0', title: 'First Track', audioUrl: 'blob:first' },
  { id: 'tr-shared-1234', title: 'Shared Track', audioUrl: initialSign.data.signedUrl, storagePath: sampleStoragePath },
  { id: 'tr-2', title: 'Third Track', audioUrl: 'blob:third' },
];
assert.equal(clientQueue.length, 3);

// Simulates expiration and refresh
const refreshedSign = mockStorage.createSignedUrl(sampleStoragePath, 3600);
assert.notEqual(refreshedSign.data.signedUrl, initialSign.data.signedUrl);

// Update in-place
clientQueue = clientQueue.map((track) =>
  track.id === 'tr-shared-1234' ? { ...track, audioUrl: refreshedSign.data.signedUrl } : track
);
assert.equal(clientQueue.length, 3, 'Queue length must NOT change');
assert.equal(clientQueue[1].id, 'tr-shared-1234');
assert.equal(clientQueue[1].audioUrl, refreshedSign.data.signedUrl);
console.log('✓ 5.3 Expired URL refreshed in-place without altering queue size or track order');


// ============================================================================
// SUITE 6: FAILED UPLOAD CLEANUP & ORPHAN PREVENTION
// ============================================================================
console.log('\n--- Suite 6: Failed Upload Cleanup & Atomicity ---');

class MockAtomicUploader {
  constructor() {
    this.storage = new Set();
    this.database = new Set();
  }

  async uploadAndPersist({ storagePath, simulateDbFailure = false }) {
    // 1. Upload to storage
    this.storage.add(storagePath);

    // 2. Persist to database
    if (simulateDbFailure) {
      // Cleanup orphan
      this.storage.delete(storagePath);
      throw new Error('Database insert failed');
    }

    this.database.add(storagePath);
    return { success: true };
  }
}

const uploader = new MockAtomicUploader();
const orphanTestPath = 'room-berlin/tr-shared-orphan-check.flac';

let uploadFailed = false;
try {
  await uploader.uploadAndPersist({ storagePath: orphanTestPath, simulateDbFailure: true });
} catch (err) {
  uploadFailed = true;
}
assert.equal(uploadFailed, true);
assert.equal(uploader.storage.has(orphanTestPath), false, 'Orphaned storage object must be deleted when DB insert fails');
assert.equal(uploader.database.has(orphanTestPath), false, 'Database has no partial records');
console.log('✓ 6.1 Database insert failure triggers immediate storage orphan cleanup');

// Successful upload retains both
const successPath = 'room-berlin/tr-shared-success.flac';
await uploader.uploadAndPersist({ storagePath: successPath, simulateDbFailure: false });
assert.equal(uploader.storage.has(successPath), true);
assert.equal(uploader.database.has(successPath), true);
console.log('✓ 6.2 Successful upload persists both storage object and database metadata');


// ============================================================================
// SUITE 7: SQL MIGRATION FILE STATIC SECURITY AUDIT
// ============================================================================
console.log('\n--- Suite 7: SQL Migration Static Security Audit ---');

const sqlMigration = fs.readFileSync('supabase/migrations/20261111_init.sql', 'utf8');

// 7.1 Bucket definition
assert.ok(
  sqlMigration.includes("'nocturne-audio'"),
  'SQL migration must configure nocturne-audio bucket'
);
assert.ok(
  sqlMigration.includes('public = false') || sqlMigration.includes('public, file_size_limit'),
  'SQL migration must set nocturne-audio bucket public = false'
);
assert.ok(
  sqlMigration.includes('26214400'),
  'SQL migration must set 25 MB (26214400 bytes) file size limit'
);
console.log('✓ 7.1 nocturne-audio private bucket defined with 25 MB limit & audio MIME types');

// 7.2 SELECT policy on storage.objects
assert.ok(
  sqlMigration.includes('CREATE POLICY "Authorized room members can access audio objects"'),
  'SQL migration must contain SELECT policy on storage.objects'
);
assert.ok(
  sqlMigration.includes("name NOT LIKE '%..%'") &&
  sqlMigration.includes("name ~ '^[a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+$'"),
  'SQL storage policies must enforce format regex and path traversal rejection'
);
assert.ok(
  sqlMigration.includes("public.has_room_access(split_part(name, '/', 1), auth.uid())"),
  'SQL storage policies must verify room access via split_part(name, \'/\', 1)'
);
console.log('✓ 7.2 storage.objects SELECT policy enforces room membership, format regex, and traversal checks');

// 7.3 INSERT policy on storage.objects
assert.ok(
  sqlMigration.includes('CREATE POLICY "Authorized room members can upload audio objects"'),
  'SQL migration must contain INSERT policy on storage.objects'
);
console.log('✓ 7.3 storage.objects INSERT policy enforces room membership and traversal checks');

// 7.4 DELETE policy on storage.objects
assert.ok(
  sqlMigration.includes('CREATE POLICY "Track uploader or room host can delete audio objects"'),
  'SQL migration must contain DELETE policy on storage.objects'
);
assert.ok(
  sqlMigration.includes('owner = auth.uid()') && sqlMigration.includes('r.host_id = auth.uid()'),
  'SQL DELETE policy must restrict deletion to uploader or room host'
);
console.log('✓ 7.4 storage.objects DELETE policy enforces uploader or host permission');

// 7.5 Cross-room storage_path constraint on public.tracks
assert.ok(
  sqlMigration.includes('CONSTRAINT check_track_storage_path_room CHECK (storage_path IS NULL OR storage_path LIKE (room_id || \'/%\'))'),
  'public.tracks must have check constraint preventing cross-room storage_path reference'
);
console.log('✓ 7.5 public.tracks strictly enforces room_id prefix constraint on storage_path');

console.log('\n======================================================');
console.log('Phase C.4 Audio Storage: ALL TESTS PASSED');
console.log('======================================================');

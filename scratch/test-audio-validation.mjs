import fs from 'node:fs';

// Quick standalone verification of audio validation logic
function validateAudioBuffer(buffer) {
  if (!buffer || buffer.length === 0) return { valid: false, error: 'Empty buffer' };
  if (buffer.length < 12) return { valid: false, error: 'Too small' };

  // MP3 ID3
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return { valid: true, format: 'mp3', mimeType: 'audio/mpeg' };
  }
  // WAV RIFF...WAVE
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x41 && buffer[10] === 0x56 && buffer[11] === 0x45
  ) {
    return { valid: true, format: 'wav', mimeType: 'audio/wav' };
  }
  // FLAC fLaC
  if (buffer[0] === 0x66 && buffer[1] === 0x4c && buffer[2] === 0x61 && buffer[3] === 0x43) {
    return { valid: true, format: 'flac', mimeType: 'audio/flac' };
  }
  // OGG OggS
  if (buffer[0] === 0x4f && buffer[1] === 0x47 && buffer[2] === 0x67 && buffer[3] === 0x53) {
    return { valid: true, format: 'ogg', mimeType: 'audio/ogg' };
  }
  // M4A
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    const brand = buffer.toString('ascii', 8, 12).trim().toLowerCase();
    const VALID_M4A_BRANDS = new Set(['m4a', 'mp41', 'mp42', 'isom', 'dash']);
    if (VALID_M4A_BRANDS.has(brand)) {
      return { valid: true, format: 'm4a', mimeType: 'audio/mp4' };
    }
    return { valid: false, error: `Unsupported MP4 container brand "${brand}".` };
  }
  return { valid: false, error: 'Unsupported format' };
}

// Tests
const mp3Buf = Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
console.log('MP3 Test:', validateAudioBuffer(mp3Buf).format === 'mp3' ? 'PASS' : 'FAIL');

const wavBuf = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
  0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20
]);
console.log('WAV Test:', validateAudioBuffer(wavBuf).format === 'wav' ? 'PASS' : 'FAIL');

const flacBuf = Buffer.from([0x66, 0x4c, 0x61, 0x43, 0x00, 0x00, 0x00, 0x22, 0x00, 0x00, 0x00, 0x00]);
console.log('FLAC Test:', validateAudioBuffer(flacBuf).format === 'flac' ? 'PASS' : 'FAIL');

const oggBuf = Buffer.from([0x4f, 0x47, 0x67, 0x53, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
console.log('OGG Test:', validateAudioBuffer(oggBuf).format === 'ogg' ? 'PASS' : 'FAIL');

const m4aBuf = Buffer.from([
  0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ... ftyp
  0x4d, 0x34, 0x41, 0x20, 0x00, 0x00, 0x00, 0x00  // M4A
]);
console.log('M4A Test:', validateAudioBuffer(m4aBuf).format === 'm4a' ? 'PASS' : 'FAIL');

const fakeBuf = Buffer.from('this is not audio at all');
console.log('Fake Test (Reject):', validateAudioBuffer(fakeBuf).valid === false ? 'PASS' : 'FAIL');

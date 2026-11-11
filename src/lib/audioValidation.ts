/**
 * NOCTURNE Audio Content & Magic-Byte Validator
 *
 * Validates audio file buffers server-side using file header signatures.
 * Only formats with reliable browser playback and unambiguous signatures are accepted.
 *
 * Supported formats:
 * - MP3 (audio/mpeg): ID3v2 header or MPEG audio frame sync
 * - WAV (audio/wav): RIFF + WAVE chunks
 * - FLAC (audio/flac): fLaC signature
 * - OGG (audio/ogg): OggS page header
 * - M4A/MP4 Audio (audio/mp4): ftyp container with audio-compatible brand
 * - WebM Audio (audio/webm): EBML header with webm doctype
 *
 * Note: Raw AAC/ADTS streams without an MP4/M4A container are intentionally rejected
 * due to inconsistent cross-browser decoding in standard HTML5 <audio> elements.
 */

export interface AudioValidationResult {
  valid: boolean;
  format?: 'mp3' | 'wav' | 'flac' | 'ogg' | 'm4a' | 'webm';
  mimeType?: string;
  error?: string;
}

export const MAX_AUDIO_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export function validateAudioBuffer(buffer: unknown): AudioValidationResult {
  const isBytes =
    buffer &&
    ((typeof Buffer !== 'undefined' && Buffer.isBuffer(buffer)) ||
      buffer instanceof Uint8Array ||
      (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(buffer)));

  if (!isBytes) {
    return { valid: false, error: 'The audio file is empty or invalid.' };
  }

  const bytes = buffer as Uint8Array & { readUInt32BE?: (offset: number) => number };
  if (bytes.length === 0) {
    return { valid: false, error: 'The audio file is empty or invalid.' };
  }

  if (bytes.length > MAX_AUDIO_FILE_BYTES) {
    return { valid: false, error: 'Audio file exceeds the 25 MB room limit.' };
  }

  if (bytes.length < 12) {
    return { valid: false, error: 'File is too small to contain valid audio metadata.' };
  }

  // 1. MP3 with ID3v2 container: "ID3" (0x49 0x44 0x33)
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return { valid: true, format: 'mp3', mimeType: 'audio/mpeg' };
  }

  // 2. MP3 raw frame sync: 11 bits set (0xFF followed by 0xE0 mask with Layer III check)
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    const layer = (bytes[1] >> 1) & 0x03;
    // MPEG Audio Layer III is strictly encoded as 0b01
    // (ADTS/raw AAC has layer = 0b00, and is thus cleanly rejected here)
    if (layer === 0x01) {
      return { valid: true, format: 'mp3', mimeType: 'audio/mpeg' };
    }
  }

  // 3. WAV: "RIFF" .... "WAVE"
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
    bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45   // WAVE
  ) {
    return { valid: true, format: 'wav', mimeType: 'audio/wav' };
  }

  // 4. FLAC: "fLaC" (0x66 0x4C 0x61 0x43)
  if (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) {
    return { valid: true, format: 'flac', mimeType: 'audio/flac' };
  }

  // 5. OGG: "OggS" (0x4F 0x67 0x67 0x53, RFC 3533)
  if (bytes[0] === 0x4f && (bytes[1] === 0x67 || bytes[1] === 0x47) && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return { valid: true, format: 'ogg', mimeType: 'audio/ogg' };
  }

  // 6. M4A / MP4 Container: "ftyp" box at offset 4
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    // Read box size from first 4 bytes (big-endian)
    const boxSize = typeof bytes.readUInt32BE === 'function'
      ? bytes.readUInt32BE(0)
      : (((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0);
    const scanLimit = Math.min(boxSize > 0 ? boxSize : 64, bytes.length, 128);

    const VALID_M4A_BRANDS = ['m4a', 'mp41', 'mp42', 'isom', 'dash'];
    // Scan 4-byte brand slots from byte 8 up to scanLimit
    for (let offset = 8; offset + 4 <= scanLimit; offset += 4) {
      let brand = '';
      for (let i = 0; i < 4; i++) {
        brand += String.fromCharCode(bytes[offset + i]);
      }
      brand = brand.trim().toLowerCase();
      if (VALID_M4A_BRANDS.includes(brand)) {
        return { valid: true, format: 'm4a', mimeType: 'audio/mp4' };
      }
    }

    return {
      valid: false,
      error: 'Unsupported MP4 container brand. Please provide a standard M4A audio file.',
    };
  }

  // 7. WebM Audio: EBML header (0x1A 0x45 0xDF 0xA3)
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    let headerStr = '';
    const scanLen = Math.min(64, bytes.length);
    for (let i = 0; i < scanLen; i++) {
      headerStr += String.fromCharCode(bytes[i]);
    }
    if (headerStr.includes('webm')) {
      return { valid: true, format: 'webm', mimeType: 'audio/webm' };
    }
  }

  return {
    valid: false,
    error: 'Unsupported or unverified audio stream. Supported formats: MP3, WAV, FLAC, OGG, M4A, and WebM audio.',
  };
}

import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public', 'audio');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const sampleRate = 44100;
const durationSec = 6;
const numSamples = sampleRate * durationSec;
const numChannels = 1;
const bitsPerSample = 16;
const bytesPerSample = bitsPerSample / 8;
const blockAlign = numChannels * bytesPerSample;
const byteRate = sampleRate * blockAlign;
const dataSize = numSamples * blockAlign;
const headerSize = 44;
const totalSize = headerSize + dataSize;

const buffer = Buffer.alloc(totalSize);

// RIFF chunk
buffer.write('RIFF', 0);
buffer.writeUInt32LE(totalSize - 8, 4);
buffer.write('WAVE', 8);

// fmt chunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(bitsPerSample, 34);

// data chunk
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

// Generate dual sine wave: 440 Hz (A4) and 554.37 Hz (C#5) with a gentle fade-in / fade-out
const freq1 = 440;
const freq2 = 554.37;
let offset = 44;

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  // envelope: 0.1s attack, 0.2s release
  let env = 1.0;
  if (t < 0.1) {
    env = t / 0.1;
  } else if (t > durationSec - 0.2) {
    env = (durationSec - t) / 0.2;
  }

  // Soft synth-like harmonic blend: primary + third + gentle sub
  const s1 = Math.sin(2 * Math.PI * freq1 * t);
  const s2 = 0.5 * Math.sin(2 * Math.PI * freq2 * t);
  const s3 = 0.25 * Math.sin(2 * Math.PI * (freq1 / 2) * t);
  const combined = (s1 + s2 + s3) / 1.75;

  const sampleVal = Math.round(combined * env * 0.45 * 32767);
  const clamped = Math.max(-32768, Math.min(32767, sampleVal));
  buffer.writeInt16LE(clamped, offset);
  offset += 2;
}

const outFile = path.join(outDir, 'test-tone.wav');
fs.writeFileSync(outFile, buffer);
console.log(`Generated test-tone.wav (${buffer.length} bytes, ${durationSec}s at ${sampleRate}Hz) at ${outFile}`);

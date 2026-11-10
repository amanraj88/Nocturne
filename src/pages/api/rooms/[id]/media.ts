import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { roomManager } from '@/lib/server/rooms';
import { Track } from '@/types';

export const config = { api: { bodyParser: { sizeLimit: '34mb' } } };

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const MAX_SHARED_TRACKS_PER_ROOM = 20;
const MIME_BY_EXTENSION: Record<string, string> = {
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.flac': 'audio/flac',
  '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.webm': 'audio/webm',
};
const safeRoomFolder = (roomId: string) => roomId.replace(/[^a-zA-Z0-9_-]/g, '_');
const safeLabel = (value: unknown, fallback: string, limit = 120) => {
  if (typeof value !== 'string') return fallback;
  const clean = value.replaceAll('/', '').replaceAll(String.fromCharCode(92), '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, limit);
  return clean || fallback;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Room ID is required' });
  const room = roomManager.getRoomState(id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.queue.filter((track) => track.sourceType === 'shared-audio').length >= MAX_SHARED_TRACKS_PER_ROOM) {
    return res.status(409).json({ error: 'This room has reached its limit of 20 shared audio files. Remove one before uploading another.' });
  }

  const body = req.body || {};
  const fileName = safeLabel(body.fileName, 'shared-audio.mp3');
  const extension = path.extname(fileName).toLowerCase();
  if (!MIME_BY_EXTENSION[extension]) return res.status(415).json({ error: 'Supported file types are MP3, WAV, FLAC, OGG, M4A, AAC, and WebM audio.' });
  if (typeof body.base64 !== 'string' || body.base64.length > 35_000_000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(body.base64)) {
    return res.status(400).json({ error: 'The uploaded audio data is invalid or too large.' });
  }

  const bytes = Buffer.from(body.base64, 'base64');
  if (bytes.length === 0) return res.status(400).json({ error: 'The selected file is empty.' });
  if (bytes.length > MAX_AUDIO_BYTES) return res.status(413).json({ error: 'Room audio files must be 25 MB or smaller.' });

  const trackId = 'tr-shared-' + randomUUID();
  const audioDirectory = path.join(process.cwd(), '.data', 'audio', safeRoomFolder(room.room.id));
  await fs.mkdir(audioDirectory, { recursive: true });
  await fs.writeFile(path.join(audioDirectory, trackId + '.audio'), bytes, { flag: 'wx' });

  const user = body.addedBy && typeof body.addedBy === 'object' ? body.addedBy : {};
  const artworkId = room.room.artworkId || 'noc-01';
  const track: Track = {
    id: trackId,
    sourceType: 'shared-audio',
    title: safeLabel(body.title, path.basename(fileName, extension)),
    artist: safeLabel(body.artist, 'Shared local audio', 80),
    albumArt: '/artwork/' + artworkId + '.svg',
    artworkId,
    durationSeconds: Number.isFinite(body.durationSeconds) ? Math.max(0, Math.min(86400, Math.round(body.durationSeconds))) : 0,
    audioUrl: '/api/rooms/' + room.room.id + '/media/' + trackId,
    fileName,
    addedBy: {
      id: safeLabel(user.id, 'guest', 80),
      name: safeLabel(user.name, 'Room listener', 60),
    },
    addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    upvotes: 0,
    skipVotes: 0,
  };

  roomManager.addTrackToQueue(room.room.id, track);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(201).json({ track });
}

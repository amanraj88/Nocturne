import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { roomManager } from '@/lib/server/rooms';

const MIME_BY_EXTENSION: Record<string, string> = {
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.flac': 'audio/flac',
  '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.webm': 'audio/webm',
};
const safeRoomFolder = (roomId: string) => roomId.replace(/[^a-zA-Z0-9_-]/g, '_');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', ['GET', 'HEAD']);
    return res.status(405).end();
  }

  const { id, trackId } = req.query;
  if (typeof id !== 'string' || typeof trackId !== 'string' || !/^tr-shared-[0-9a-f-]{36}$/i.test(trackId)) {
    return res.status(404).end();
  }
  const room = roomManager.getRoomState(id);
  const track = room?.queue.find((item) => item.id === trackId && item.sourceType === 'shared-audio');
  if (!room || !track) return res.status(404).end();

  const audioPath = path.join(process.cwd(), '.data', 'audio', safeRoomFolder(room.room.id), trackId + '.audio');
  let stat: fs.Stats;
  try { stat = fs.statSync(audioPath); } catch (error) { return res.status(404).end(); }
  const extension = path.extname(track.fileName || '').toLowerCase();
  res.setHeader('Content-Type', MIME_BY_EXTENSION[extension] || 'application/octet-stream');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'private, max-age=60');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const rangeHeader = req.headers.range;
  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if (!match) {
      res.setHeader('Content-Range', 'bytes */' + stat.size);
      return res.status(416).end();
    }
    const suffixLength = match[1] ? 0 : Number(match[2]);
    const start = match[1] ? Number(match[1]) : Math.max(0, stat.size - suffixLength);
    const end = match[2] && match[1] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
    if (start > end || start >= stat.size) {
      res.setHeader('Content-Range', 'bytes */' + stat.size);
      return res.status(416).end();
    }
    res.status(206);
    res.setHeader('Content-Range', 'bytes ' + start + '-' + end + '/' + stat.size);
    res.setHeader('Content-Length', String(end - start + 1));
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(audioPath, { start, end }).pipe(res);
  }

  res.setHeader('Content-Length', String(stat.size));
  if (req.method === 'HEAD') return res.end();
  return fs.createReadStream(audioPath).pipe(res);
}

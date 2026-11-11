import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { roomManager } from '@/lib/server/rooms';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getServiceRoleClient } from '@/lib/server/supabaseAdmin';

const MIME_BY_EXTENSION: Record<string, string> = {
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.flac': 'audio/flac',
  '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.webm': 'audio/webm',
};
const safeRoomFolder = (roomId: string) => roomId.replace(/[^a-zA-Z0-9_-]/g, '_');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['GET', 'HEAD', 'DELETE']);
    return res.status(405).end();
  }

  const { id, trackId } = req.query;
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(id) ||
      typeof trackId !== 'string' || !/^tr-shared-[0-9a-f-]{36}$/i.test(trackId)) {
    return res.status(404).end();
  }

  // ===========================================================================
  // 1. SUPABASE CONFIGURED MODE
  // ===========================================================================
  if (isSupabaseConfigured()) {
    const admin = getServiceRoleClient();
    if (!admin) {
      return res.status(503).json({ error: 'Supabase admin service unavailable.' });
    }

    // Lookup room
    const { data: dbRoom, error: roomErr } = await admin
      .from('rooms')
      .select('id,slug,is_private,host_id')
      .or(`slug.eq.${id},id.eq.${id},id.eq.room-${id}`)
      .maybeSingle();

    if (roomErr || !dbRoom) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    // Lookup track
    const { data: dbTrack, error: trackErr } = await admin
      .from('tracks')
      .select('id,room_id,added_by_id,storage_path')
      .eq('id', trackId)
      .eq('room_id', dbRoom.id)
      .maybeSingle();

    if (trackErr || !dbTrack) {
      return res.status(404).json({ error: 'Track not found.' });
    }

    // Handle DELETE
    if (req.method === 'DELETE') {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required to delete audio.' });
      }
      const token = authHeader.slice(7).trim();
      const { data: { user }, error: authErr } = await admin.auth.getUser(token);
      if (authErr || !user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      // Private-room revocation is immediate: uploader status alone does not grant access.
      if (dbRoom.is_private && dbRoom.host_id !== user.id) {
        const { data: membership, error: membershipError } = await admin
          .from('room_memberships')
          .select('id')
          .eq('room_id', dbRoom.id)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (membershipError) {
          return res.status(503).json({ error: 'Room access service unavailable.' });
        }
        if (!membership) {
          return res.status(404).json({ error: 'Room or track not found.' });
        }
      }

      // Active room members may delete only their own tracks; hosts may delete any track.
      const isUploader = dbTrack.added_by_id === user.id;
      const isHost = dbRoom.host_id === user.id;
      if (!isUploader && !isHost) {
        return res.status(dbRoom.is_private ? 404 : 403).json({ error: 'Track cannot be deleted.' });
      }

      // Delete from PostgreSQL
      const { error: deleteError } = await admin
        .from('tracks')
        .delete()
        .eq('id', trackId)
        .eq('room_id', dbRoom.id);
      if (deleteError) {
        console.error('[NOCTURNE Media] Track deletion failed:', deleteError.code || 'unknown');
        return res.status(503).json({ error: 'Could not delete this track right now.' });
      }

      // Delete from Supabase Storage
      if (dbTrack.storage_path) {
        const { error: storageError } = await admin.storage.from('nocturne-audio').remove([dbTrack.storage_path]);
        if (storageError) {
          console.error('[NOCTURNE Media] Audio cleanup failed:', storageError.name || 'storage error');
          return res.status(200).json({ success: true, cleanupPending: true });
        }
      }

      return res.status(200).json({ success: true });
    }

    // Handle GET / HEAD: Check private room access
    if (dbRoom.is_private) {
      let token: string | null = null;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      } else if (typeof req.query.token === 'string') {
        token = req.query.token;
      }

      if (!token) {
        return res.status(404).json({ error: 'Room or track not found.' });
      }

      const { data: { user }, error: authErr } = await admin.auth.getUser(token);
      if (authErr || !user) {
        return res.status(404).json({ error: 'Room or track not found.' });
      }

      if (dbRoom.host_id !== user.id) {
        const { data: member } = await admin
          .from('room_memberships')
          .select('id')
          .eq('room_id', dbRoom.id)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!member) {
          return res.status(404).json({ error: 'Room or track not found.' });
        }
      }
    }

    if (!dbTrack.storage_path) {
      return res.status(404).json({ error: 'Track has no associated storage object.' });
    }

    // Generate fresh signed URL (3600 seconds)
    const { data: signData, error: signErr } = await admin.storage
      .from('nocturne-audio')
      .createSignedUrl(dbTrack.storage_path, 300);

    if (signErr || !signData?.signedUrl) {
      return res.status(404).json({ error: 'Storage object missing or unavailable in nocturne-audio.' });
    }

    // JSON response for refresh requests
    if (
      req.query.refresh === '1' ||
      req.query.json === '1' ||
      req.headers.accept?.includes('application/json')
    ) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({
        signedUrl: signData.signedUrl,
        expiresIn: 300,
        storagePath: dbTrack.storage_path,
      });
    }

    // Standard audio playback redirect
    res.setHeader('Cache-Control', 'private, no-store');
    return res.redirect(307, signData.signedUrl);
  }

  // ===========================================================================
  // 2. LOCAL DEVELOPMENT FALLBACK MODE
  // ===========================================================================
  const room = roomManager.getRoomState(id);
  const track = room?.queue.find((item) => item.id === trackId && item.sourceType === 'shared-audio');
  if (!room || !track) return res.status(404).end();

  const audioPath = path.join(process.cwd(), '.data', 'audio', safeRoomFolder(room.room.id), trackId + '.audio');

  if (req.method === 'DELETE') {
    roomManager.removeTrackFromQueue(room.room.id, trackId);
    return res.status(200).json({ success: true });
  }

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

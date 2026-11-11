import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { roomManager } from '@/lib/server/rooms';
import { Track } from '@/types';
import { validateAudioBuffer, MAX_AUDIO_FILE_BYTES } from '@/lib/audioValidation';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getServiceRoleClient } from '@/lib/server/supabaseAdmin';

export const config = { api: { bodyParser: { sizeLimit: '34mb' } } };

const MAX_SHARED_TRACKS_PER_ROOM = 20;

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

  const { id, action } = req.query;
  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(id)) {
    return res.status(400).json({ error: 'A valid room ID is required.' });
  }

  if (action === 'upload-url') {
    const uploadUrlHandler = (await import('./media/upload-url')).default;
    return uploadUrlHandler(req, res);
  }
  if (action === 'confirm') {
    const confirmHandler = (await import('./media/confirm')).default;
    return confirmHandler(req, res);
  }

  const body = req.body || {};
  const fileName = safeLabel(body.fileName, 'shared-audio.mp3');

  if (typeof body.base64 !== 'string' || body.base64.length > 35_000_000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(body.base64)) {
    return res.status(400).json({ error: 'The uploaded audio data is invalid or too large.' });
  }

  const bytes = Buffer.from(body.base64, 'base64');
  if (bytes.length === 0) return res.status(400).json({ error: 'The selected file is empty.' });

  // Magic-byte and content validation (does NOT trust client file extension or client MIME type)
  const validation = validateAudioBuffer(bytes);
  if (!validation.valid) {
    if (bytes.length > MAX_AUDIO_FILE_BYTES) {
      return res.status(413).json({ error: validation.error || 'Room audio files must be 25 MB or smaller.' });
    }
    return res.status(415).json({ error: validation.error || 'Unsupported audio format. Supported formats: MP3, WAV, FLAC, OGG, M4A, WebM.' });
  }

  // ===========================================================================
  // 1. SUPABASE CONFIGURED MODE (Production / Supabase Free Tier)
  // ===========================================================================
  if (isSupabaseConfigured()) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required to upload audio to this room.' });
    }
    const token = authHeader.slice(7).trim();

    const admin = getServiceRoleClient();
    if (!admin) {
      return res.status(503).json({ error: 'Supabase administrative client unavailable.' });
    }

    // Authenticate user identity from token
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired authentication session.' });
    }

    // Look up room
    const { data: dbRoom, error: roomError } = await admin
      .from('rooms')
      .select('id,slug,is_private,host_id,artwork_id')
      .or(`slug.eq.${id},id.eq.${id},id.eq.room-${id}`)
      .maybeSingle();

    if (roomError) {
      return res.status(503).json({ error: 'Database service unavailable while finding room.' });
    }
    if (!dbRoom) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    // Authorization: Verify room access for private rooms
    if (dbRoom.is_private && dbRoom.host_id !== user.id) {
      const { data: memberRecord, error: membershipError } = await admin
        .from('room_memberships')
        .select('id')
        .eq('room_id', dbRoom.id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (membershipError) {
        return res.status(503).json({ error: 'Room access service unavailable.' });
      }
      if (!memberRecord) {
        return res.status(404).json({ error: 'Room not found.' });
      }
    }

    // Enforce 20 shared tracks per room limit
    const { count: sharedCount } = await admin
      .from('tracks')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', dbRoom.id)
      .eq('source_type', 'shared-audio');

    if (sharedCount !== null && sharedCount >= MAX_SHARED_TRACKS_PER_ROOM) {
      return res.status(409).json({ error: 'This room has reached its limit of 20 shared audio files. Remove one before uploading another.' });
    }

    // Unique non-guessable storage path
    const fileId = randomUUID();
    const storagePath = `${dbRoom.id}/tr-shared-${fileId}.${validation.format}`;

    // Upload object to private Supabase Storage bucket 'nocturne-audio'
    const { error: uploadError } = await admin.storage
      .from('nocturne-audio')
      .upload(storagePath, bytes, {
        contentType: validation.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('[NOCTURNE Storage Upload Failed]:', uploadError.name || 'storage error');
      return res.status(503).json({ error: 'Audio upload could not be completed. Please try again.' });
    }

    // Get current queue count for position
    const { count: totalTracks } = await admin
      .from('tracks')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', dbRoom.id);

    const trackId = 'tr-shared-' + fileId;
    const artworkId = dbRoom.artwork_id || 'noc-01';
    const title = safeLabel(body.title, path.basename(fileName, path.extname(fileName)));
    const artist = safeLabel(body.artist, 'Shared local audio', 80);
    const durationSeconds = Number.isFinite(body.durationSeconds) ? Math.max(0, Math.min(86400, Math.round(body.durationSeconds))) : 0;
    const addedByName = safeLabel(body.addedBy?.name, 'Room listener', 60);

    // Persist track metadata in PostgreSQL
    const { error: dbError } = await admin
      .from('tracks')
      .insert({
        id: trackId,
        room_id: dbRoom.id,
        source_type: 'shared-audio',
        title,
        artist,
        album_art: `/artwork/${artworkId}.svg`,
        artwork_id: artworkId,
        duration_seconds: durationSeconds,
        storage_path: storagePath,
        file_name: fileName,
        added_by_id: user.id,
        added_by_name: addedByName,
        position: totalTracks || 0,
      });

    // Cleanup storage object if metadata persistence fails
    if (dbError) {
      console.error('[NOCTURNE Metadata Insert Failed, cleaning up storage object]:', dbError.code || 'database error');
      await admin.storage.from('nocturne-audio').remove([storagePath]);
      return res.status(503).json({ error: 'Audio metadata could not be saved. Please try again.' });
    }

    // Short-lived URL limits the impact of sharing a private storage capability.
    const { data: signData } = await admin.storage
      .from('nocturne-audio')
      .createSignedUrl(storagePath, 300);

    const track: Track = {
      id: trackId,
      sourceType: 'shared-audio',
      title,
      artist,
      albumArt: `/artwork/${artworkId}.svg`,
      artworkId,
      durationSeconds,
      audioUrl: signData?.signedUrl || `/api/rooms/${dbRoom.id}/media/${trackId}`,
      storagePath,
      fileName,
      addedBy: {
        id: user.id,
        name: addedByName,
      },
      addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      upvotes: 0,
      skipVotes: 0,
    };

    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json({ track });
  }

  // ===========================================================================
  // 2. LOCAL DEVELOPMENT FALLBACK MODE (When Supabase is not configured)
  // ===========================================================================
  const room = roomManager.getRoomState(id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.queue.filter((track) => track.sourceType === 'shared-audio').length >= MAX_SHARED_TRACKS_PER_ROOM) {
    return res.status(409).json({ error: 'This room has reached its limit of 20 shared audio files. Remove one before uploading another.' });
  }

  const trackId = 'tr-shared-' + randomUUID();
  const audioDirectory = path.join(process.cwd(), '.data', 'audio', safeRoomFolder(room.room.id));
  await fs.mkdir(audioDirectory, { recursive: true });
  await fs.writeFile(path.join(audioDirectory, trackId + '.audio'), bytes, { flag: 'wx' });

  const user = body.addedBy && typeof body.addedBy === 'object' ? body.addedBy : {};
  const artworkId = room.room.artworkId || 'noc-01';
  const track: Track = {
    id: trackId,
    sourceType: 'shared-audio',
    title: safeLabel(body.title, path.basename(fileName, path.extname(fileName))),
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

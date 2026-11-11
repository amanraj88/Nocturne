import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getServiceRoleClient } from '@/lib/server/supabaseAdmin';
import { MAX_AUDIO_FILE_BYTES } from '@/lib/audioValidation';

const MAX_SHARED_TRACKS_PER_ROOM = 20;
const ALLOWED_FORMATS = new Set(['mp3', 'wav', 'flac', 'ogg', 'm4a', 'webm']);

const safeLabel = (value: unknown, fallback: string, limit = 120) => {
  if (typeof value !== 'string') return fallback;
  const clean = value
    .replaceAll('/', '')
    .replaceAll(String.fromCharCode(92), '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, limit);
  return clean || fallback;
};

async function runOpportunisticCleanup(admin: any) {
  try {
    const nowIso = new Date().toISOString();
    // Bounded search for up to 5 expired pending intents or failed cleanups
    const { data: candidates } = await admin
      .from('audio_upload_intents')
      .select('id, storage_path, status, cleanup_failed')
      .or(`and(status.eq.pending,expires_at.lt.${nowIso}),cleanup_failed.eq.true`)
      .limit(5);

    if (!candidates || candidates.length === 0) return;

    for (const item of candidates) {
      // Safely transition status to 'cancelled' ensuring it was never confirmed or currently in 'confirming'
      let lockQuery = admin
        .from('audio_upload_intents')
        .update({ status: 'cancelled' })
        .eq('id', item.id);

      if (item.status === 'pending') {
        lockQuery = lockQuery.eq('status', 'pending').lt('expires_at', nowIso);
      } else if (item.status === 'cancelled') {
        lockQuery = lockQuery.eq('status', 'cancelled');
      } else {
        // Under no circumstances touch 'confirming' or 'confirmed' intents
        continue;
      }

      const { data: locked } = await lockQuery.select('id').maybeSingle();
      if (!locked) continue; // Skip if another request claimed, confirmed or processed it

      let cleanFailed = false;
      try {
        const { error: rmErr } = await admin.storage
          .from('nocturne-audio')
          .remove([item.storage_path]);
        if (rmErr) cleanFailed = true;
      } catch {
        cleanFailed = true;
      }

      await admin
        .from('audio_upload_intents')
        .update({ cleanup_failed: cleanFailed })
        .eq('id', item.id);
    }
  } catch (err) {
    // Opportunistic cleanup is best-effort and must never block user operations
    console.warn('[NOCTURNE Opportunistic Cleanup warning]:', err);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(id)) {
    return res.status(400).json({ error: 'A valid room ID is required.' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(501).json({
      error: 'Direct-to-storage upload requires Supabase. Fall back to standard media upload.',
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required to initiate audio upload.' });
  }
  const token = authHeader.slice(7).trim();

  const admin = getServiceRoleClient();
  if (!admin) {
    return res.status(503).json({ error: 'Supabase administrative service unavailable.' });
  }

  // Authenticate user
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
    return res.status(409).json({
      error: 'This room has reached its limit of 20 shared audio files. Remove one before uploading another.',
    });
  }

  // Validate metadata
  const body = req.body || {};
  const fileSize = typeof body.fileSize === 'number' ? body.fileSize : parseInt(body.fileSize, 10);
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return res.status(400).json({ error: 'Valid file size is required.' });
  }
  if (fileSize > MAX_AUDIO_FILE_BYTES) {
    return res.status(413).json({ error: 'Room audio files must be 25 MB or smaller.' });
  }

  const format = typeof body.format === 'string' ? body.format.toLowerCase().trim() : '';
  if (!ALLOWED_FORMATS.has(format)) {
    return res.status(415).json({
      error: 'Unsupported format. Allowed formats: MP3, WAV, FLAC, OGG, M4A, WebM.',
    });
  }

  const rawFileName = typeof body.fileName === 'string' ? body.fileName : `audio.${format}`;
  const fileName = safeLabel(rawFileName, `shared-audio.${format}`);
  const title = safeLabel(body.title, path.basename(fileName, path.extname(fileName)));
  const artist = safeLabel(body.artist, 'Shared local audio', 80);
  const durationSeconds = Number.isFinite(body.durationSeconds)
    ? Math.max(0, Math.min(86400, Math.round(body.durationSeconds)))
    : 0;

  // Server-controlled, deterministic room-scoped storage path
  const fileId = randomUUID();
  const storagePath = `${dbRoom.id}/tr-shared-${fileId}.${format}`;

  // Request signed upload URL from Supabase Storage with upsert: false (prevent overwrite)
  const { data: signedData, error: signError } = await admin.storage
    .from('nocturne-audio')
    .createSignedUploadUrl(storagePath, { upsert: false });

  if (signError || !signedData) {
    console.error('[NOCTURNE Upload URL generation failed]:', signError?.name || 'storage error');
    return res.status(503).json({
      error: 'Audio upload could not be prepared. Please try again.',
    });
  }

  // Record pending upload intent in PostgreSQL for single-use verification
  const { data: intent, error: intentError } = await admin
    .from('audio_upload_intents')
    .insert({
      room_id: dbRoom.id,
      user_id: user.id,
      storage_path: storagePath,
      file_name: fileName,
      file_size: fileSize,
      title,
      artist,
      duration_seconds: durationSeconds,
      status: 'pending',
    })
    .select('id')
    .single();

  if (intentError || !intent) {
    console.error('[NOCTURNE Intent insert failed]:', intentError?.code || 'database error');
    return res.status(503).json({
      error: 'Audio upload could not be prepared. Please try again.',
    });
  }

  // Trigger opportunistic cleanup of expired/failed intents in the background (bounded to 5)
  await runOpportunisticCleanup(admin).catch(() => {});

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    uploadId: intent.id,
    storagePath,
    token: signedData.token,
    signedUrl: signedData.signedUrl,
    path: signedData.path,
  });
}

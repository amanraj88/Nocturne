import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getServiceRoleClient } from '@/lib/server/supabaseAdmin';
import { validateAudioBuffer, MAX_AUDIO_FILE_BYTES } from '@/lib/audioValidation';
import { Track } from '@/types';

const MAX_SHARED_TRACKS_PER_ROOM = 20;

// Supabase Storage validation reads up to 25 MB from the private bucket. Vercel
// Hobby allows Pages Functions to be configured up to 60 seconds.
export const config = { maxDuration: 60 };

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

async function safeStorageRemove(admin: any, storagePath: string): Promise<boolean> {
  try {
    const { error } = await admin.storage.from('nocturne-audio').remove([storagePath]);
    if (error) console.error('[NOCTURNE Storage Remove Failed]:', error.name || 'storage error');
    return !error;
  } catch (err) {
    console.error('[NOCTURNE Storage Remove Exception]:', err instanceof Error ? err.name : 'unknown error');
    return false;
  }
}

async function safeCancelAndPurge(
  admin: any,
  intentId: string,
  storagePath: string,
  claimToken: string
): Promise<boolean> {
  // Atomically cancel ONLY if this request still holds the active claim_token
  const { data: locked } = await admin
    .from('audio_upload_intents')
    .update({ status: 'cancelled' })
    .eq('id', intentId)
    .eq('claim_token', claimToken)
    .select('id')
    .maybeSingle();

  if (!locked) {
    // Lease expired or reclaimed by a newer request. Do NOT touch storage.
    return false;
  }

  const cleanOk = await safeStorageRemove(admin, storagePath);
  if (!cleanOk) {
    await admin.from('audio_upload_intents').update({ cleanup_failed: true }).eq('id', intentId);
  }
  return true;
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
      error: 'Direct-to-storage confirmation requires Supabase.',
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required to confirm audio upload.' });
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

  const body = req.body || {};
  const uploadId = body.uploadId;
  if (typeof uploadId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uploadId)) {
    return res.status(400).json({ error: 'Valid upload ID is required.' });
  }

  // Fetch pending upload intent
  const { data: intent, error: intentError } = await admin
    .from('audio_upload_intents')
    .select('id,room_id,user_id,storage_path,file_name,file_size,title,artist,duration_seconds,status,confirming_at,claim_token,expires_at')
    .eq('id', uploadId)
    .maybeSingle();

  if (intentError) {
    return res.status(503).json({ error: 'Database service unavailable while fetching upload intent.' });
  }
  if (!intent) {
    return res.status(404).json({ error: 'Upload intent not found.' });
  }

  // Security: Verify user identity matches the intent initiator
  if (intent.user_id !== user.id) {
    return res.status(403).json({ error: 'You are not authorized to confirm this upload.' });
  }

  // State inspection & immediate fast returns
  if (intent.status === 'confirmed') {
    return res.status(409).json({ error: 'This upload has already been confirmed.' });
  }
  if (intent.status === 'cancelled') {
    return res.status(410).json({ error: 'This upload intent was cancelled or failed verification.' });
  }

  // Expiration check: If expired, atomically transition to cancelled before deleting storage
  if (new Date(intent.expires_at).getTime() < Date.now()) {
    const { data: locked } = await admin
      .from('audio_upload_intents')
      .update({ status: 'cancelled' })
      .eq('id', intent.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (locked) {
      const cleanOk = await safeStorageRemove(admin, intent.storage_path);
      if (!cleanOk) {
        await admin
          .from('audio_upload_intents')
          .update({ cleanup_failed: true })
          .eq('id', intent.id);
      }
    }
    return res.status(410).json({ error: 'This upload session has expired. The object was removed.' });
  }

  // Verify room exists and matches intent
  const { data: dbRoom, error: roomError } = await admin
    .from('rooms')
    .select('id,slug,is_private,host_id,artwork_id')
    .eq('id', intent.room_id)
    .maybeSingle();

  if (roomError || !dbRoom) {
    return res.status(404).json({ error: 'Room associated with upload intent not found.' });
  }

  if (dbRoom.id !== id && dbRoom.slug !== id && dbRoom.id !== `room-${id}`) {
    return res.status(400).json({ error: 'Room identifier does not match upload intent.' });
  }

  // Membership may have been revoked after the upload URL was issued.
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
      return res.status(403).json({ error: 'You are not authorized to confirm audio for this private room.' });
    }
  }

  // ATOMIC CLAIM WITH FENCING TOKEN & 2-MINUTE LEASE:
  const confirmingAgeMs = intent.confirming_at
    ? Date.now() - new Date(intent.confirming_at).getTime()
    : 0;

  if (intent.status === 'confirming' && confirmingAgeMs < 120_000) {
    return res.status(409).json({ error: 'This upload is currently being confirmed by another request.' });
  }

  const claimToken = randomUUID();
  const nowIso = new Date().toISOString();
  let claimQuery = admin
    .from('audio_upload_intents')
    .update({
      status: 'confirming',
      confirming_at: nowIso,
      claim_token: claimToken,
    })
    .eq('id', intent.id);

  if (intent.status === 'pending') {
    claimQuery = claimQuery.eq('status', 'pending');
  } else {
    // Reclaiming stuck intent where lease expired
    claimQuery = claimQuery
      .eq('status', 'confirming')
      .eq('confirming_at', intent.confirming_at);
  }

  const { data: claimedIntent, error: claimError } = await claimQuery.select('id').maybeSingle();
  if (claimError || !claimedIntent) {
    // Another concurrent request beat us to the claim! Exit without deleting the file.
    return res.status(409).json({ error: 'This upload is currently being processed or has already been updated.' });
  }

  // OPTIMIZED STORAGE VALIDATION:
  // Step 1: Verify exact object size via metadata (without downloading full binary)
  const { data: fileInfo, error: infoError } = await admin.storage
    .from('nocturne-audio')
    .info(intent.storage_path);

  if (infoError || !fileInfo) {
    return res.status(404).json({
      error: 'Uploaded audio file not found in storage. Upload may not have completed.',
    });
  }

  const objectSize = typeof fileInfo.size === 'number' ? fileInfo.size : parseInt(fileInfo.size as any, 10);
  if (!Number.isFinite(objectSize) || objectSize <= 0) {
    const purged = await safeCancelAndPurge(admin, intent.id, intent.storage_path, claimToken);
    if (!purged) {
      return res.status(409).json({ error: 'Upload confirmation lease expired and was reclaimed by another request.' });
    }
    return res.status(400).json({ error: 'The uploaded file is empty.' });
  }

  if (objectSize > MAX_AUDIO_FILE_BYTES) {
    const purged = await safeCancelAndPurge(admin, intent.id, intent.storage_path, claimToken);
    if (!purged) {
      return res.status(409).json({ error: 'Upload confirmation lease expired and was reclaimed by another request.' });
    }
    return res.status(413).json({ error: 'Uploaded audio file exceeds the 25 MB room limit.' });
  }

  // Step 2: Download object with strict 8s timeout to validate actual audio magic bytes
  const { data: fileBlob, error: downloadError } = await admin.storage
    .from('nocturne-audio')
    .download(intent.storage_path, {}, { signal: AbortSignal.timeout(8000) });

  if (downloadError || !fileBlob) {
    return res.status(404).json({
      error: 'Could not read audio header from storage.',
    });
  }

  const buffer = Buffer.from(await fileBlob.arrayBuffer());

  // Magic-byte signature verification
  const validation = validateAudioBuffer(buffer);
  if (!validation.valid) {
    const purged = await safeCancelAndPurge(admin, intent.id, intent.storage_path, claimToken);
    if (!purged) {
      return res.status(409).json({ error: 'Upload confirmation lease expired and was reclaimed by another request.' });
    }
    return res.status(415).json({
      error: validation.error || 'Uploaded file failed audio signature verification.',
    });
  }

  // Verify format matches container extension
  if (!intent.storage_path.endsWith(`.${validation.format}`)) {
    const purged = await safeCancelAndPurge(admin, intent.id, intent.storage_path, claimToken);
    if (!purged) {
      return res.status(409).json({ error: 'Upload confirmation lease expired and was reclaimed by another request.' });
    }
    return res.status(415).json({
      error: 'Uploaded audio stream format does not match expected container format.',
    });
  }

  // Re-verify room capacity limit of 20 shared tracks
  const { count: sharedCount } = await admin
    .from('tracks')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', dbRoom.id)
    .eq('source_type', 'shared-audio');

  if (sharedCount !== null && sharedCount >= MAX_SHARED_TRACKS_PER_ROOM) {
    const purged = await safeCancelAndPurge(admin, intent.id, intent.storage_path, claimToken);
    if (!purged) {
      return res.status(409).json({ error: 'Upload confirmation lease expired and was reclaimed by another request.' });
    }
    return res.status(409).json({
      error: 'This room has reached its limit of 20 shared audio files.',
    });
  }

  // Total tracks for position calculation
  const { count: totalTracks } = await admin
    .from('tracks')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', dbRoom.id);

  // Validation can take several seconds. Recheck private membership immediately
  // before persisting the queue row so a revocation during confirmation fails closed.
  if (dbRoom.is_private && dbRoom.host_id !== user.id) {
    const { data: currentMembership, error: currentMembershipError } = await admin
      .from('room_memberships')
      .select('id')
      .eq('room_id', dbRoom.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (currentMembershipError) {
      return res.status(503).json({ error: 'Room access service unavailable.' });
    }
    if (!currentMembership) {
      const purged = await safeCancelAndPurge(admin, intent.id, intent.storage_path, claimToken);
      if (!purged) {
        return res.status(409).json({ error: 'Upload confirmation lease expired and was reclaimed by another request.' });
      }
      return res.status(403).json({ error: 'You are not authorized to confirm audio for this private room.' });
    }
  }

  const trackId = path.basename(intent.storage_path, path.extname(intent.storage_path));
  const artworkId = dbRoom.artwork_id || 'noc-01';
  const addedByName = safeLabel(body.addedByName || user.user_metadata?.display_name || user.email, 'Room listener', 60);

  // Persist track metadata in PostgreSQL
  const { error: dbError } = await admin
    .from('tracks')
    .insert({
      id: trackId,
      room_id: dbRoom.id,
      source_type: 'shared-audio',
      title: intent.title,
      artist: intent.artist,
      album_art: `/artwork/${artworkId}.svg`,
      artwork_id: artworkId,
      duration_seconds: intent.duration_seconds,
      storage_path: intent.storage_path,
      file_name: intent.file_name,
      added_by_id: user.id,
      added_by_name: addedByName,
      position: totalTracks || 0,
    });

  // Handle DB insertion error safely
  if (dbError) {
    // If error is unique violation, track is already inserted! NEVER delete the storage object.
    const isDuplicate = dbError.code === '23505' || dbError.message.includes('unique') || dbError.message.includes('duplicate');
    if (isDuplicate) {
      await admin
        .from('audio_upload_intents')
        .update({ status: 'confirmed' })
        .eq('id', intent.id)
        .eq('claim_token', claimToken);
      return res.status(409).json({ error: 'This track has already been added to the room queue.' });
    }

    // Genuine database infrastructure error: purge storage object ONLY if we still own the claim
    console.error('[NOCTURNE Metadata Insert Failed, cleaning up storage object]:', dbError.code || 'database error');
    await safeCancelAndPurge(admin, intent.id, intent.storage_path, claimToken);
    return res.status(503).json({
      error: 'Failed to save track metadata. Storage object cleaned up: ' + dbError.message,
    });
  }

  // Atomically finalize intent to 'confirmed' requiring our matching claim_token
  const { data: confirmedIntent } = await admin
    .from('audio_upload_intents')
    .update({ status: 'confirmed' })
    .eq('id', intent.id)
    .eq('claim_token', claimToken)
    .select('id')
    .maybeSingle();

  if (!confirmedIntent) {
    // Stale request! A newer claim or retry won.
    return res.status(409).json({ error: 'Upload confirmation lease expired and was claimed by another request.' });
  }

  // Generate initial signed URL for playback (3600 seconds)
  const { data: signData } = await admin.storage
    .from('nocturne-audio')
    .createSignedUrl(intent.storage_path, 300);

  const track: Track = {
    id: trackId,
    sourceType: 'shared-audio',
    title: intent.title,
    artist: intent.artist,
    albumArt: `/artwork/${artworkId}.svg`,
    artworkId,
    durationSeconds: intent.duration_seconds,
    audioUrl: signData?.signedUrl || `/api/rooms/${dbRoom.id}/media/${trackId}`,
    storagePath: intent.storage_path,
    fileName: intent.file_name,
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

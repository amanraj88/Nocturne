import type { NextApiRequest, NextApiResponse } from 'next';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getServiceRoleClient } from '@/lib/server/supabaseAdmin';
import { roomManager } from '@/lib/server/rooms';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Enforce allowed HTTP methods
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Strict, fail-closed CRON_SECRET verification
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return res.status(500).json({ error: 'Server configuration error: CRON_SECRET is not configured' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 6 hours cutoff for stale room inactivity
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const cutoffTime = new Date(Date.now() - SIX_HOURS_MS).toISOString();

  // 3. Strict Supabase Mode
  if (isSupabaseConfigured()) {
    try {
      const admin = getServiceRoleClient();
      if (!admin) {
        return res.status(503).json({ error: 'Database service unconfigured.' });
      }

      // Find non-featured rooms created before the cutoff threshold
      const { data: candidateRooms, error: findError } = await admin
        .from('rooms')
        .select('id, title, is_featured, created_at, updated_at')
        .eq('is_featured', false)
        .lt('created_at', cutoffTime)
        .limit(50);

      if (findError) {
        return res.status(500).json({ error: findError.message });
      }

      const deletedIds: string[] = [];

      if (candidateRooms && candidateRooms.length > 0) {
        for (const r of candidateRooms) {
          // Extra guard: NEVER delete featured rooms under any circumstances
          if (r.is_featured) continue;

          // Check if room has active playback
          const { data: pb } = await admin
            .from('room_playback')
            .select('is_playing, updated_at')
            .eq('room_id', r.id)
            .maybeSingle();

          // If playback is currently active or updated recently, preserve room
          if (pb?.is_playing) continue;
          if (pb?.updated_at && pb.updated_at >= cutoffTime) continue;

          // Check if there are active listeners/participants in this room
          const { count: activeParticipants } = await admin
            .from('room_memberships')
            .select('id', { count: 'exact', head: true })
            .eq('room_id', r.id)
            .eq('is_active', true)
            .gte('last_seen', cutoffTime);

          if (activeParticipants && activeParticipants > 0) continue;

          // Eligible stale room: safely clean up (cascading foreign keys handle dependents)
          const { error: deleteError } = await admin
            .from('rooms')
            .delete()
            .eq('id', r.id)
            .eq('is_featured', false);

          if (!deleteError) {
            deletedIds.push(r.id);
          }
        }
      }

      return res.status(200).json({
        ok: true,
        cleanedCount: deletedIds.length,
        deletedIds,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Cleanup error' });
    }
  }

  // 4. Local In-Memory Fallback Mode
  const activeRooms = roomManager.getAllRooms();
  const cleanedIds: string[] = [];

  for (const r of activeRooms) {
    // Preserve featured rooms
    if (r.isFeatured || r.id.startsWith('room-tokyo') || r.id.startsWith('room-nordic') || r.id.startsWith('room-berlin')) {
      continue;
    }
    const state = roomManager.getRoomState(r.id);
    if (state && state.participants.size === 0 && !state.playback.isPlaying) {
      roomManager.deleteRoom(r.id);
      cleanedIds.push(r.id);
    }
  }

  return res.status(200).json({
    ok: true,
    cleanedCount: cleanedIds.length,
    deletedIds: cleanedIds,
  });
}


import type { NextApiRequest, NextApiResponse } from 'next';
import { isSupabaseConfigured, getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { roomManager } from '@/lib/server/rooms';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Room ID is required' });
  }

  // Strict Supabase Mode
  if (isSupabaseConfigured()) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required to end room' });
    }

    const client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userRes, error: userError } = await client.auth.getUser();
    if (userError || !userRes?.user?.id) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const userId = userRes.user.id;

    // Check room host (supports either full ID or slug)
    const { data: room, error: roomError } = await client
      .from('rooms')
      .select('id, host_id, is_featured')
      .or(`id.eq.${id},slug.eq.${id},id.eq.room-${id}`)
      .maybeSingle();

    if (roomError || !room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.is_featured) {
      return res.status(403).json({ error: 'Editorial featured lounges cannot be closed.' });
    }

    if (room.host_id !== userId) {
      return res.status(403).json({ error: 'Only the room host can close this room.' });
    }

    // Execute room deletion (cascades to playback, queue, chat, etc.)
    const { error: deleteError } = await client
      .from('rooms')
      .delete()
      .eq('id', room.id);

    if (deleteError) {
      return res.status(500).json({ error: 'Failed to close room: ' + deleteError.message });
    }

    return res.status(200).json({ ok: true, message: 'Room successfully closed' });
  }

  // In-memory fallback mode
  const deleted = roomManager.deleteRoom(id);
  return res.status(200).json({ ok: deleted });
}

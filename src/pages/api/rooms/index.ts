import type { NextApiRequest, NextApiResponse } from 'next';
import { roomManager } from '@/lib/server/rooms';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getServiceRoleClient } from '@/lib/server/supabaseAdmin';
import { mapDbRoomToRoom } from '@/lib/server/mappers';
import { createClient } from '@supabase/supabase-js';
import { Room } from '@/types';

// Fallback dummy WebSocket on server if needed
if (typeof window === 'undefined' && typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class WebSocket {} as any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  if (req.method === 'GET') {
    // 1. Strict Supabase Mode (No split-brain fallback)
    if (isSupabaseConfigured()) {
      try {
        const admin = getServiceRoleClient();
        if (!admin) return res.status(503).json({ error: 'Room service is not configured.' });
        const { data: dbRooms, error } = await admin
          .from('rooms')
          .select('id,slug,title,vibe_tag,description,artwork_id,ambient_color,accent_color,is_private,host_id,host_name,created_at')
          .eq('is_private', false)
          .order('created_at', { ascending: false });

        if (error) {
          // If Supabase is configured and query fails, return 503 Service Unavailable (do not return stale local data)
          return res.status(503).json({ error: 'Database service unavailable. Please try again shortly.' });
        }

        const rooms: Room[] = (dbRooms || []).map((dbR) => mapDbRoomToRoom(dbR, 0));
        return res.status(200).json({ rooms });
      } catch {
        return res.status(503).json({ error: 'Database connection failed.' });
      }
    }

    // 2. Strict Local Development Mode (When Supabase is not configured)
    const rooms = roomManager.getAllRooms();
    return res.status(200).json({ rooms });
  }

  if (req.method === 'POST') {
    const { name, description, slug, artworkId, tags, host, vibeTag, mode, isPrivate, recoveryKeyHash } = req.body || {};
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
      return res.status(400).json({ error: 'Room name must be between 2 and 60 characters.' });
    }

    const cleanSlug = typeof slug === 'string'
      ? slug.trim().toLowerCase()
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!cleanSlug || cleanSlug.length > 70 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      return res.status(400).json({ error: 'Room link must use lowercase letters, numbers, and hyphens.' });
    }

    if (mode !== undefined && mode !== 'collaborative') {
      return res.status(400).json({ error: 'Choose a valid listening mode.' });
    }

    const validArtwork = ['noc-01', 'noc-02', 'noc-03'];
    const chosenArtwork = validArtwork.includes(artworkId) ? artworkId : 'noc-01';

    const cleanHost = host && typeof host === 'object'
      ? {
          id: typeof host.id === 'string' ? host.id.slice(0, 80) : `usr-${Date.now().toString(36)}`,
          name: typeof host.name === 'string' ? host.name.trim().slice(0, 60) || 'Guest Curator' : 'Guest Curator',
          role: 'host' as const,
          isListening: true,
          joinedAt: 'Just now',
        }
      : undefined;

    // 1. Strict Supabase Mode (Atomic RPC Execution)
    if (isSupabaseConfigured()) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required to create a lounge.' });
      }

      try {
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        // Atomic RPC: Inserts room, host membership, initial playback row, and system message in 1 transaction
        const { data: dbRoom, error } = await userClient.rpc('create_room_with_host', {
          p_slug: cleanSlug,
          p_title: name.trim(),
          p_vibe_tag: typeof vibeTag === 'string' ? vibeTag.trim().slice(0, 80) : 'Ambient & Modular',
          p_description: typeof description === 'string' ? description.trim().slice(0, 500) : '',
          p_artwork_id: chosenArtwork,
          p_mode: 'collaborative',
          p_is_private: Boolean(isPrivate),
          p_host_name: cleanHost?.name || 'Guest Curator',
          p_recovery_key_hash: typeof recoveryKeyHash === 'string' && /^[0-9a-f]{64}$/i.test(recoveryKeyHash)
            ? recoveryKeyHash.toLowerCase()
            : null,
        });

        if (error) {
          // Check duplicate slug collision
          if (error.code === '23505' || error.message?.includes('already exists') || error.message?.includes('duplicate')) {
            return res.status(409).json({ error: 'A room with that name already exists. Choose a different title.' });
          }
          if (error.message?.includes('Authentication required')) {
            return res.status(401).json({ error: 'Authentication required to create a lounge.' });
          }
          if (error.message?.includes('limit reached')) {
            return res.status(429).json({ error: 'This account has reached the room creation limit.' });
          }
          console.error('[NOCTURNE Room Creation] Database request failed:', error.code || 'unknown');
          return res.status(503).json({ error: 'Could not create this room right now. Please try again shortly.' });
        }

        const room = mapDbRoomToRoom(dbRoom, 0);
        return res.status(201).json({ room });
      } catch {
        return res.status(503).json({ error: 'Could not create this room right now. Please try again shortly.' });
      }
    }

    // 2. Strict Local Development Mode (When Supabase is not configured)
    const roomId = `room-${cleanSlug}`;
    if (roomManager.getRoomState(cleanSlug) || roomManager.getRoomState(roomId)) {
      return res.status(409).json({ error: 'A room with that name already exists. Choose a different title.' });
    }

    const room = roomManager.createRoom({
      id: roomId,
      name: name.trim(),
      description: typeof description === 'string' ? description.trim().slice(0, 500) : undefined,
      slug: cleanSlug,
      vibeTag: typeof vibeTag === 'string' ? vibeTag.trim().slice(0, 80) : undefined,
      mode: 'collaborative',
      artworkId: chosenArtwork,
      tags: Array.isArray(tags) ? tags : undefined,
      host: cleanHost,
    });

    return res.status(201).json({ room });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

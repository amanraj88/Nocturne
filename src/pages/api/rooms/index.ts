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
    // 1. Strict Supabase Mode (with graceful fallback if database service is offline/unmigrated)
    if (isSupabaseConfigured()) {
      try {
        const admin = getServiceRoleClient();
        if (admin) {
          // Use active room lifecycle function (enforcing 5-min grace policy & honest presence)
          const { data: dbRooms, error } = await admin.rpc('get_active_rooms');

          if (!error && Array.isArray(dbRooms)) {
            const rooms: Room[] = dbRooms.map((dbR: any) =>
              mapDbRoomToRoom(dbR, Number(dbR.listener_count) || 0)
            );
            return res.status(200).json({ rooms });
          }

          // Fallback query if RPC is unmigrated
          const { data: fallbackRooms, error: fbError } = await admin
            .from('rooms')
            .select('id,slug,title,vibe_tag,description,artwork_id,ambient_color,accent_color,is_private,host_id,host_name,created_at,is_featured')
            .eq('is_private', false)
            .eq('is_featured', false)
            .not('host_id', 'is', null)
            .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false });

          if (!fbError && Array.isArray(fallbackRooms)) {
            const rooms: Room[] = fallbackRooms.map((dbR) => mapDbRoomToRoom(dbR, 0));
            return res.status(200).json({ rooms });
          }
        }
      } catch {
        // Fall through to in-memory manager
      }
    }

    // 2. Local In-Memory Development Mode
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

    // 1. Supabase Mode (Atomic RPC Execution)
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
        let { data: dbRoom, error } = await userClient.rpc('create_room_with_host', {
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
          // Check duplicate slug collision: disambiguate and retry transparently
          if (error.code === '23505' || error.message?.includes('already exists') || error.message?.includes('duplicate')) {
            const disambiguatedSlug = `${cleanSlug}-${Date.now().toString(36).slice(-4)}`;
            const retryRes = await userClient.rpc('create_room_with_host', {
              p_slug: disambiguatedSlug,
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

            if (!retryRes.error && retryRes.data) {
              const room = mapDbRoomToRoom(retryRes.data, 0);
              return res.status(201).json({ room });
            }
            return res.status(409).json({ error: 'A room with that name already exists. Choose a different title.' });
          }
          if (error.message?.includes('Authentication required')) {
            return res.status(401).json({ error: 'Authentication required to create a lounge.' });
          }
          if (error.message?.includes('limit reached')) {
            return res.status(429).json({
              error: 'You have reached the limit of 5 active listening lounges. Please end one of your active rooms before creating a new one.',
            });
          }
          console.warn('[NOCTURNE Room Creation] Database request returned error:', error.message || error.code);
          return res.status(500).json({ error: error.message || 'Failed to create room in database.' });
        } else if (dbRoom) {
          const room = mapDbRoomToRoom(dbRoom, 0);
          return res.status(201).json({ room });
        }
      } catch (dbErr: any) {
        console.warn('[NOCTURNE Room Creation] Database invocation failed:', dbErr);
        return res.status(503).json({ error: 'Database service unavailable. Please try again shortly.' });
      }
    }

    // 2. In-Memory Mode / Resilient Local Fallback
    const finalSlug = roomManager.getAvailableSlug(cleanSlug);
    const roomId = `room-${finalSlug}`;

    const room = roomManager.createRoom({
      id: roomId,
      name: name.trim(),
      description: typeof description === 'string' ? description.trim().slice(0, 500) : undefined,
      slug: finalSlug,
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

import type { NextApiRequest, NextApiResponse } from 'next';
import { roomManager } from '@/lib/server/rooms';
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { mapDbRoomToRoom, mapDbTrackToTrack, mapDbPlaybackToPlayback, mapDbChatToChat } from '@/lib/server/mappers';

// Fallback dummy WebSocket on server if needed
if (typeof window === 'undefined' && typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class WebSocket {} as any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Room ID is required' });
  }
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(id)) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.setHeader('Cache-Control', 'private, no-store');

  // 1. Strict Supabase Mode (No split-brain fallback)
  if (isSupabaseConfigured()) {
    try {
      const authorization = req.headers.authorization;
      const bearerToken = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
      const client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
        global: { headers: bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {} },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: dbRoom, error: roomError } = await client
        .from('rooms')
        .select('id,slug,title,vibe_tag,description,artwork_id,ambient_color,accent_color,is_private,host_id,host_name,created_at')
        .or(`slug.eq.${id},id.eq.${id},id.eq.room-${id}`)
        .maybeSingle();

      if (roomError) {
        // Database query failed -> 503 Service Unavailable (do NOT fall back to local store)
        return res.status(503).json({ error: 'Database service unavailable. Please try again shortly.' });
      }

      if (!dbRoom) {
        // Genuine missing room in Supabase -> 404 Not Found (do NOT fall back to local store)
        return res.status(404).json({ error: `Room "${id}" not found` });
      }

      // The visitor-scoped client applies the room RLS policies to every read.
      // Fetch related records in parallel
      const [tracksRes, playbackRes, chatRes] = await Promise.all([
        client.from('tracks').select('*').eq('room_id', dbRoom.id).order('position', { ascending: true }),
        client.from('room_playback').select('*').eq('room_id', dbRoom.id).maybeSingle(),
        client.from('chat_messages').select('*').eq('room_id', dbRoom.id).order('created_at', { ascending: true }).limit(50),
      ]);

      if (tracksRes.error || playbackRes.error || chatRes.error) {
        return res.status(503).json({ error: 'Database service unavailable while fetching room details.' });
      }

      const rawTracks = tracksRes.data || [];
      const storagePaths = rawTracks
        .map((t) => t.storage_path)
        .filter((p): p is string => typeof p === 'string' && p.length > 0);

      const signedUrlMap = new Map<string, string>();
      if (storagePaths.length > 0) {
        try {
          const { data: signedResults } = await client.storage
            .from('nocturne-audio')
            .createSignedUrls(storagePaths, 300);
          if (Array.isArray(signedResults)) {
            for (const item of signedResults) {
              if (item.signedUrl && item.path) {
                signedUrlMap.set(item.path, item.signedUrl);
              }
            }
          }
        } catch (e) {
          console.warn('[NOCTURNE State] Signed URL generation warning:', e);
        }
      }

      const room = mapDbRoomToRoom(dbRoom, 0);
      const queue = rawTracks.map((row) => {
        const mapped = mapDbTrackToTrack(row);
        if (row.storage_path && signedUrlMap.has(row.storage_path)) {
          mapped.audioUrl = signedUrlMap.get(row.storage_path);
        } else if (row.storage_path) {
          mapped.audioUrl = `/api/rooms/${dbRoom.id}/media/${row.id}`;
        }
        return mapped;
      });
      const playback = mapDbPlaybackToPlayback(playbackRes.data);
      const chatMessages = (chatRes.data || []).map(mapDbChatToChat);

      return res.status(200).json({
        room,
        queue,
        playback,
        participants: [],
        chatMessages,
      });
    } catch (err: any) {
      return res.status(503).json({ error: 'Database connection failed.' });
    }
  }

  // 2. Strict Local Development Mode (When Supabase is not configured)
  const roomState = roomManager.getRoomState(id);
  if (!roomState) {
    return res.status(404).json({ error: `Room "${id}" not found` });
  }

  return res.status(200).json({
    room: {
      ...roomState.room,
      listenerCount: roomState.participants.size,
    },
    queue: roomState.queue,
    playback: roomState.playback,
    participants: Array.from(roomState.participants.values()),
    chatMessages: roomState.chatMessages,
  });
}

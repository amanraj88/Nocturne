import type { NextApiRequest, NextApiResponse } from 'next';
import { roomManager } from '@/lib/server/rooms';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const rooms = roomManager.getAllRooms();
    return res.status(200).json({ rooms });
  }

  if (req.method === 'POST') {
    const { name, description, slug, artworkId, tags, host, vibeTag, mode } = req.body || {};
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
      return res.status(400).json({ error: 'Room name must be between 2 and 60 characters.' });
    }

    const cleanSlug = typeof slug === 'string'
      ? slug.trim().toLowerCase()
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!cleanSlug || cleanSlug.length > 70 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      return res.status(400).json({ error: 'Room link must use lowercase letters, numbers, and hyphens.' });
    }
    if (roomManager.getRoomState(cleanSlug) || roomManager.getRoomState(`room-${cleanSlug}`)) {
      return res.status(409).json({ error: 'A room with that name already exists. Choose a different title.' });
    }
    if (mode !== undefined && mode !== 'collaborative') {
      return res.status(400).json({ error: 'Choose a valid listening mode.' });
    }
    const validArtwork = ['noc-01', 'noc-02', 'noc-03'];
    const cleanHost = host && typeof host === 'object'
      ? {
          id: typeof host.id === 'string' ? host.id.slice(0, 80) : `usr-${Date.now().toString(36)}`,
          name: typeof host.name === 'string' ? host.name.trim().slice(0, 60) || 'Guest Curator' : 'Guest Curator',
          role: 'host' as const,
          isListening: true,
          joinedAt: 'Just now',
        }
      : undefined;

    const room = roomManager.createRoom({
      name: name.trim(),
      description: typeof description === 'string' ? description.trim().slice(0, 500) : undefined,
      slug: cleanSlug,
      vibeTag: typeof vibeTag === 'string' ? vibeTag.trim().slice(0, 80) : undefined,
      mode: 'collaborative',
      artworkId: validArtwork.includes(artworkId) ? artworkId : 'noc-01',
      tags: Array.isArray(tags) ? tags : undefined,
      host: cleanHost,
    });

    return res.status(201).json({ room });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

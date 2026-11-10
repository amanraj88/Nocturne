import type { NextApiRequest, NextApiResponse } from 'next';
import { roomManager } from '@/lib/server/rooms';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const { id, userId, userName } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Room ID is required' });
  }

  const roomState = roomManager.getRoomState(id);
  if (!roomState) {
    return res.status(404).json({ error: `Room "${id}" not found` });
  }

  const roomId = roomState.room.id;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Subscribe before joining so room updates cannot fall into a snapshot gap.
  const listener = (payload: any) => {
    if (res.writableEnded || res.destroyed) return;
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (e) {
      // The response close handler removes this listener.
    }
  };
  roomManager.on(`room:${roomId}`, listener);

  let pingInterval: NodeJS.Timeout | null = null;
  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (pingInterval) clearInterval(pingInterval);
    roomManager.off(`room:${roomId}`, listener);
    if (userId && typeof userId === 'string') roomManager.leaveParticipant(roomId, userId);
  };
  pingInterval = setInterval(() => {
    if (res.writableEnded || res.destroyed) return cleanup();
    try {
      res.write(': keepalive\n\n');
    } catch (e) {
      cleanup();
    }
  }, 15000);

  // If userId was provided, register participant after the listener is ready.
  if (userId && typeof userId === 'string') {
    roomManager.joinParticipant(roomId, {
      id: userId,
      name: typeof userName === 'string' && userName ? userName : 'Anonymous Listener',
      role: 'listener',
    });
  }

  // Send initial snapshot
  const initialSnapshot = {
    type: 'SNAPSHOT',
    room: {
      ...roomState.room,
      listenerCount: roomState.participants.size,
    },
    queue: roomState.queue,
    playback: roomState.playback,
    participants: Array.from(roomState.participants.values()),
    chatMessages: roomState.chatMessages,
  };
  res.write(`data: ${JSON.stringify(initialSnapshot)}\n\n`);
  res.on('close', cleanup);
  res.on('error', cleanup);
}

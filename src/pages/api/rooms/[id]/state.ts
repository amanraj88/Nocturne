import type { NextApiRequest, NextApiResponse } from 'next';
import { roomManager } from '@/lib/server/rooms';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Room ID is required' });
  }

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

import type { NextApiRequest, NextApiResponse } from 'next';
import { roomManager } from '@/lib/server/rooms';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Room ID is required' });
  }

  const roomState = roomManager.getRoomState(id);
  if (!roomState) {
    return res.status(404).json({ error: `Room "${id}" not found` });
  }

  const roomId = roomState.room.id;
  const action = req.body || {};

  switch (action.type) {
    case 'JOIN': {
      if (action.user && action.user.id) {
        roomManager.joinParticipant(roomId, action.user);
      }
      return res.status(200).json({ ok: true });
    }

    case 'LEAVE': {
      if (action.userId) {
        roomManager.leaveParticipant(roomId, action.userId);
      }
      return res.status(200).json({ ok: true });
    }

    case 'HEARTBEAT': {
      if (action.userId) {
        roomManager.heartbeat(roomId, action.userId);
      }
      return res.status(200).json({ ok: true });
    }

    case 'PLAY': {
      if (action.sourceType === 'local' || (action.sourceType === 'fixture' && action.localFileName)) {
        return res.status(400).json({ error: 'Local file playback is private to the selecting browser.' });
      }
      roomManager.updatePlayback(roomId, {
        isPlaying: true,
        progressSeconds: typeof action.progressSeconds === 'number' ? action.progressSeconds : undefined,
        currentTrackId: action.trackId || roomState.playback.currentTrackId,
        sourceType: action.sourceType || roomState.playback.sourceType,
      });
      return res.status(200).json({ ok: true, playback: roomState.playback });
    }

    case 'PAUSE': {
      roomManager.updatePlayback(roomId, {
        isPlaying: false,
        progressSeconds: typeof action.progressSeconds === 'number' ? action.progressSeconds : undefined,
        currentTrackId: action.trackId || roomState.playback.currentTrackId,
      });
      return res.status(200).json({ ok: true, playback: roomState.playback });
    }

    case 'SEEK': {
      roomManager.updatePlayback(roomId, {
        progressSeconds: typeof action.progressSeconds === 'number' ? action.progressSeconds : 0,
      });
      return res.status(200).json({ ok: true, playback: roomState.playback });
    }

    case 'SELECT_TRACK': {
      if (action.trackId) {
        const found = roomState.queue.find((t) => t.id === action.trackId);
        const sourceType = found?.sourceType || (found?.audioUrl ? 'local' : 'youtube');
        roomManager.updatePlayback(roomId, {
          currentTrackId: action.trackId,
          progressSeconds: 0,
          isPlaying: true,
          sourceType,
        });
      }
      return res.status(200).json({ ok: true, playback: roomState.playback });
    }

    case 'SYNC_PROGRESS': {
      const track = roomState.queue.find((item) => item.id === action.trackId);
      if (!track || track.isLocalFile || track.sourceType === 'local' || (track.audioUrl || '').startsWith('blob:')) {
        return res.status(400).json({ error: 'Room progress can only sync a shared queue source.' });
      }
      if (!Number.isFinite(action.progressSeconds) || action.progressSeconds < 0) {
        return res.status(400).json({ error: 'A valid playhead position is required.' });
      }
      if (roomState.playback.currentTrackId !== action.trackId) {
        return res.status(409).json({ error: 'The room is playing a different track.' });
      }
      roomManager.updatePlayback(roomId, {
        currentTrackId: action.trackId,
        progressSeconds: Math.floor(action.progressSeconds),
        isPlaying: true,
      });
      return res.status(200).json({ ok: true, playback: roomState.playback });
    }

    case 'TRACK_DURATION': {
      const durationSeconds = action.durationSeconds;
      const track = roomState.queue.find((item) => item.id === action.trackId && item.youtubeId);
      if (!track || !Number.isInteger(durationSeconds) || durationSeconds <= 0 || durationSeconds > 604800) {
        return res.status(400).json({ error: 'A valid YouTube track and duration are required.' });
      }
      roomManager.updateTrackDuration(roomId, track.id, durationSeconds);
      return res.status(200).json({ ok: true });
    }

    case 'QUEUE_ADD': {
      const track = action.track;
      if (track && track.title) {
        const isPrivateLocal = track.isLocalFile || track.sourceType === 'local' ||
          (typeof track.audioUrl === 'string' && track.audioUrl.startsWith('blob:'));
        if (isPrivateLocal) {
          return res.status(400).json({ error: 'Local audio stays in the selecting browser and cannot be added to the shared room queue.' });
        }
        roomManager.addTrackToQueue(roomId, track);
      }
      return res.status(200).json({ ok: true });
    }

    case 'QUEUE_REMOVE': {
      if (action.trackId) {
        roomManager.removeTrackFromQueue(roomId, action.trackId);
      }
      return res.status(200).json({ ok: true });
    }

    case 'QUEUE_VOTE': {
      if (action.trackId) {
        roomManager.voteSkip(roomId, action.trackId);
      }
      return res.status(200).json({ ok: true });
    }

    case 'CHAT_MESSAGE': {
      if (action.message && action.message.text) {
        roomManager.addChatMessage(roomId, action.message);
      }
      return res.status(200).json({ ok: true });
    }

    case 'REACTION': {
      if (action.reaction && action.reaction.emoji) {
        roomManager.addReaction(roomId, action.reaction);
      }
      return res.status(200).json({ ok: true });
    }

    default:
      return res.status(400).json({ error: `Unknown action type "${action.type}"` });
  }
}

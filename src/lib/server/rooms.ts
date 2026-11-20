/**
 * NOCTURNE Persistent Room & Realtime State Store
 * Single-process room state for local and single-node hosting; multi-instance deployment needs shared storage.
 */
import type { Room, Track, UserProfile, ChatMessage, ReactionBurst } from '@/types';
import { FEATURED_ROOMS, INITIAL_TRACKS, INITIAL_CHAT } from '@/lib/mockData';

const LEGACY_DEMO_TRACK_IDS = new Set(['tr-1', 'tr-2', 'tr-3', 'tr-4', 'tr-5', 'tr-fixture-tone']);
const YOUTUBE_API_TEST_VIDEO_IDS = new Set(['M7lc1UVf-VE']);
const cleanPersistedQueue = (queue: unknown): Track[] =>
  Array.isArray(queue)
    ? queue.filter((track: Track) =>
        track &&
        track.id &&
        !LEGACY_DEMO_TRACK_IDS.has(track.id) &&
        !track.isTestFixture &&
        !YOUTUBE_API_TEST_VIDEO_IDS.has(track.youtubeId || '') &&
        !track.isLocalFile &&
        !track.audioUrl?.startsWith('blob:')
      )
    : [];
import fs from 'node:fs';
import path from 'node:path';
import EventEmitter from 'node:events';

export interface RoomPlaybackState {
  currentTrackId: string;
  isPlaying: boolean;
  progressSeconds: number;
  lastUpdatedTimestamp: number;
  updatedAt?: string;
  sourceType: 'youtube' | 'shared-audio' | 'local' | 'fixture' | 'specimen';
  localFileName?: string;
}

export interface ActiveParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'host' | 'collaborator' | 'listener';
  isListening: boolean;
  joinedAt: string;
  lastSeen: number;
}

export interface ServerRoomState {
  room: Room;
  queue: Track[];
  playback: RoomPlaybackState;
  participants: Map<string, ActiveParticipant>;
  chatMessages: ChatMessage[];
  reactions: ReactionBurst[];
}

class RoomManager extends EventEmitter {
  private rooms: Map<string, ServerRoomState> = new Map();
  private dataDir: string;
  private storageFile: string;
  private pruneInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.setMaxListeners(200);

    this.dataDir = path.resolve(process.cwd(), '.data');
    this.storageFile = path.resolve(this.dataDir, 'rooms.json');

    this.initDefaultRooms();
    this.loadPersistedRooms();
    this.startPruneCycle();
  }

  private initDefaultRooms() {
    for (const room of FEATURED_ROOMS) {
      this.rooms.set(room.id, {
        room: { ...room },
        queue: [...INITIAL_TRACKS],
        playback: {
          currentTrackId: room.currentTrackId || INITIAL_TRACKS[0]?.id || '',
          isPlaying: false,
          progressSeconds: 0,
          lastUpdatedTimestamp: Date.now(),
          sourceType: 'specimen',
        },
        participants: new Map(),
        chatMessages: [...INITIAL_CHAT],
        reactions: [],
      });
    }
  }

  private loadPersistedRooms() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.room && item.room.id) {
              const existing = this.rooms.get(item.room.id);
              if (existing) {
                if (Array.isArray(item.queue)) {
                  existing.queue = cleanPersistedQueue(item.queue);
                  const savedPlayback = item.playback || existing.playback;
                  const savedTrackExists = existing.queue.some((track) => track.id === savedPlayback.currentTrackId);
                  existing.playback = {
                    ...savedPlayback,
                    currentTrackId: savedTrackExists ? savedPlayback.currentTrackId : (existing.queue[0]?.id || ''),
                    isPlaying: Boolean(savedTrackExists && savedPlayback.isPlaying),
                    progressSeconds: savedTrackExists && Number.isFinite(savedPlayback.progressSeconds) ? Math.max(0, savedPlayback.progressSeconds) : 0,
                    sourceType: savedTrackExists ? savedPlayback.sourceType : 'specimen',
                  };
                }
              } else {
                this.rooms.set(item.room.id, {
                  room: { ...item.room, listenerCount: 0, mode: 'collaborative' },
                  queue: cleanPersistedQueue(item.queue),
                  playback: item.playback && cleanPersistedQueue(item.queue).some((track) => track.id === item.playback.currentTrackId)
                    ? item.playback
                    : {
                        currentTrackId: cleanPersistedQueue(item.queue)[0]?.id || '',
                        isPlaying: false,
                        progressSeconds: 0,
                        lastUpdatedTimestamp: Date.now(),
                        sourceType: 'specimen',
                      },
                  participants: new Map(),
                  chatMessages: Array.isArray(item.chatMessages) ? item.chatMessages : [],
                  reactions: [],
                });
              }
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  public persistRooms() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const exportData: any[] = [];
      Array.from(this.rooms.entries()).forEach(([id, state]) => {
        exportData.push({
          room: state.room,
          queue: state.queue,
          playback: state.playback,
          chatMessages: state.chatMessages.slice(-50),
        });
      });
      fs.writeFileSync(this.storageFile, JSON.stringify(exportData, null, 2), 'utf8');
    } catch (e) {
      // ignore
    }
  }

  private startPruneCycle() {
    if (this.pruneInterval) return;
    this.pruneInterval = setInterval(() => {
      const now = Date.now();
      const STALE_TIMEOUT = 30000; // 30 seconds

      Array.from(this.rooms.entries()).forEach(([roomId, state]) => {
        let changed = false;
        Array.from(state.participants.entries()).forEach(([userId, participant]) => {
          if (now - participant.lastSeen > STALE_TIMEOUT) {
            state.participants.delete(userId);
            changed = true;
          }
        });
        if (changed) {
          state.room.listenerCount = state.participants.size;
          this.emitRoomUpdate(roomId, {
            type: 'PARTICIPANTS_UPDATE',
            participants: Array.from(state.participants.values()),
            listenerCount: state.room.listenerCount,
          });
        }
      });
    }, 10000);
    if (this.pruneInterval && typeof this.pruneInterval.unref === 'function') {
      this.pruneInterval.unref();
    }
  }

  public getAllRooms(): Room[] {
    const list: Room[] = [];
    Array.from(this.rooms.values()).forEach((state) => {
      list.push({
        ...state.room,
        listenerCount: state.participants.size,
      });
    });
    return list;
  }

  public getRoomState(roomId: string): ServerRoomState | null {
    let state = this.rooms.get(roomId);
    if (!state) {
      const all = Array.from(this.rooms.entries());
      for (let i = 0; i < all.length; i++) {
        const [id, s] = all[i];
        if (s.room.slug === roomId || id.toLowerCase() === roomId.toLowerCase()) {
          state = s;
          break;
        }
      }
    }
    return state || null;
  }

  public isRoomActive(roomIdOrSlug: string): boolean {
    const state = this.getRoomState(roomIdOrSlug);
    if (!state) return false;
    // Featured editorial lounges are permanently protected
    if (
      state.room.isFeatured ||
      state.room.id.startsWith('room-tokyo') ||
      state.room.id.startsWith('room-nordic') ||
      state.room.id.startsWith('room-berlin')
    ) {
      return true;
    }
    // Genuinely active if listeners are present or playback is running
    return state.participants.size > 0 || Boolean(state.playback?.isPlaying);
  }

  public getAvailableSlug(baseSlug: string): string {
    let candidate = baseSlug;
    let counter = 2;
    while (this.isRoomActive(candidate)) {
      candidate = `${baseSlug}-${counter}`;
      counter++;
    }
    return candidate;
  }

  public createRoom(roomData: Partial<Room> & { name?: string; tags?: string[] }): Room {
    const title = roomData.title || roomData.name || 'Untitled Room';
    const slug = (roomData.slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const id = roomData.id || `room-${slug}`;

    const hostUser: UserProfile = roomData.host || {
      id: `usr-${Date.now().toString(36)}`,
      name: 'Guest Curator',
      role: 'host',
      isListening: true,
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newRoom: Room = {
      id,
      slug,
      title,
      vibeTag: roomData.vibeTag || (roomData.tags ? roomData.tags.join(' & ') : 'Ambient & Modular'),
      description: roomData.description || 'Live electronic music listening session.',
      host: hostUser,
      listenerCount: 0,
      isPrivate: Boolean(roomData.isPrivate),
      mode: 'collaborative',
      currentTrackId: INITIAL_TRACKS[0]?.id || '',
      artworkId: roomData.artworkId || 'noc-01',
      ambientColor: roomData.ambientColor || '#A0B7A8',
      accentColor: roomData.accentColor || '#A0B7A8',
    };

    const serverState: ServerRoomState = {
      room: newRoom,
      queue: [...INITIAL_TRACKS],
      playback: {
        currentTrackId: INITIAL_TRACKS[0]?.id || '',
        isPlaying: false,
        progressSeconds: 0,
        lastUpdatedTimestamp: Date.now(),
        sourceType: 'specimen',
      },
      participants: new Map(),
      chatMessages: [
        {
          id: `msg-${Date.now()}`,
          user: hostUser,
          text: 'Room started. Copy the invite link above to listen with friends.',
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isSystem: true,
        },
      ],
      reactions: [],
    };

    this.rooms.set(id, serverState);
    this.persistRooms();
    return newRoom;
  }

  public joinParticipant(
    roomId: string,
    user: { id: string; name: string; avatar?: string; role?: 'host' | 'collaborator' | 'listener' }
  ) {
    const state = this.getRoomState(roomId);
    if (!state) return;

    const participant: ActiveParticipant = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      role: user.role || 'listener',
      isListening: true,
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lastSeen: Date.now(),
    };

    state.participants.set(user.id, participant);
    state.room.listenerCount = state.participants.size;

    this.emitRoomUpdate(state.room.id, {
      type: 'PARTICIPANTS_UPDATE',
      participants: Array.from(state.participants.values()),
      listenerCount: state.room.listenerCount,
    });
  }

  public heartbeat(roomId: string, userId: string) {
    const state = this.getRoomState(roomId);
    if (!state) return;

    const p = state.participants.get(userId);
    if (p) {
      p.lastSeen = Date.now();
    }
  }

  public leaveParticipant(roomId: string, userId: string) {
    const state = this.getRoomState(roomId);
    if (!state) return;

    if (state.participants.has(userId)) {
      state.participants.delete(userId);
      state.room.listenerCount = state.participants.size;

      this.emitRoomUpdate(state.room.id, {
        type: 'PARTICIPANTS_UPDATE',
        participants: Array.from(state.participants.values()),
        listenerCount: state.room.listenerCount,
      });
    }
  }

  public updatePlayback(roomId: string, update: Partial<RoomPlaybackState>) {
    const state = this.getRoomState(roomId);
    if (!state) return;

    state.playback = {
      ...state.playback,
      ...update,
      lastUpdatedTimestamp: Date.now(),
    };

    this.emitRoomUpdate(state.room.id, {
      type: 'PLAYBACK_UPDATE',
      playback: state.playback,
    });
  }

  public updateQueue(roomId: string, newQueue: Track[]) {
    const state = this.getRoomState(roomId);
    if (!state) return;

    state.queue = newQueue;
    this.emitRoomUpdate(state.room.id, {
      type: 'QUEUE_UPDATE',
      queue: state.queue,
    });
    this.persistRooms();
  }

  public addTrackToQueue(roomId: string, track: Track) {
    if (track.isLocalFile || track.sourceType === 'local' || (typeof track.audioUrl === 'string' && track.audioUrl.startsWith('blob:'))) {
      return;
    }
    const state = this.getRoomState(roomId);
    if (!state) return;

    state.queue.push(track);
    this.emitRoomUpdate(state.room.id, {
      type: 'QUEUE_UPDATE',
      queue: state.queue,
    });
    this.persistRooms();
  }

  public updateTrackDuration(roomId: string, trackId: string, durationSeconds: number) {
    const state = this.getRoomState(roomId);
    const track = state?.queue.find((item) => item.id === trackId && item.youtubeId);
    if (!state || !track || track.durationSeconds === durationSeconds) return false;

    track.durationSeconds = durationSeconds;
    this.emitRoomUpdate(state.room.id, {
      type: 'QUEUE_UPDATE',
      queue: state.queue,
    });
    this.persistRooms();
    return true;
  }

  public deleteRoom(roomId: string): boolean {
    const state = this.getRoomState(roomId);
    if (!state) return false;
    this.rooms.delete(state.room.id);
    this.rooms.delete(state.room.slug);
    this.emitRoomUpdate(state.room.id, { type: 'ROOM_ENDED' });
    this.persistRooms();
    return true;
  }

  public promoteHost(roomId: string, targetUserId: string, targetUserName?: string): boolean {
    const state = this.getRoomState(roomId);
    if (!state) return false;

    const targetParticipant = state.participants.get(targetUserId);
    const newHostName = targetUserName || targetParticipant?.name || 'Listener';
    const previousHost = { ...state.room.host };

    // Update previous host in participants map
    if (previousHost.id && state.participants.has(previousHost.id)) {
      const prev = state.participants.get(previousHost.id)!;
      prev.role = 'listener';
    }

    // Update new host in participants map
    if (targetParticipant) {
      targetParticipant.role = 'host';
    }

    // Update room host
    state.room.host = {
      id: targetUserId,
      name: newHostName,
      role: 'host',
      isListening: true,
      joinedAt: targetParticipant?.joinedAt || 'Just now',
    };

    // Add system message
    const sysMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      user: {
        id: targetUserId,
        name: 'NOCTURNE',
        role: 'host',
        isListening: true,
        joinedAt: '',
      },
      text: `${newHostName} is now the host`,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isSystem: true,
    };
    state.chatMessages.push(sysMsg);

    this.emitRoomUpdate(state.room.id, {
      type: 'HOST_PROMOTED',
      newHost: state.room.host,
      previousHostId: previousHost.id,
      systemMessage: sysMsg,
    });
    this.persistRooms();
    return true;
  }

  public removeTrackFromQueue(roomId: string, trackId: string) {
    const state = this.getRoomState(roomId);
    if (!state) return;

    const removedTrack = state.queue.find((track) => track.id === trackId);
    if (removedTrack?.sourceType === 'shared-audio') {
      const safeRoomFolder = state.room.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const mediaPath = path.join(this.dataDir, 'audio', safeRoomFolder, removedTrack.id + '.audio');
      try { fs.unlinkSync(mediaPath); } catch (e) {}
    }
    state.queue = state.queue.filter((t) => t.id !== trackId);
    this.emitRoomUpdate(state.room.id, {
      type: 'QUEUE_UPDATE',
      queue: state.queue,
    });
    this.persistRooms();
  }

  public voteSkip(roomId: string, trackId: string) {
    const state = this.getRoomState(roomId);
    if (!state) return;

    const t = state.queue.find((item) => item.id === trackId);
    if (t) {
      t.skipVotes = (t.skipVotes || 0) + 1;
      this.emitRoomUpdate(state.room.id, {
        type: 'QUEUE_UPDATE',
        queue: state.queue,
      });
    }
  }

  public addChatMessage(roomId: string, message: ChatMessage) {
    const state = this.getRoomState(roomId);
    if (!state) return;

    state.chatMessages.push(message);
    if (state.chatMessages.length > 100) {
      state.chatMessages = state.chatMessages.slice(-100);
    }

    this.emitRoomUpdate(state.room.id, {
      type: 'CHAT_MESSAGE',
      message,
    });
  }

  public addReaction(roomId: string, reaction: ReactionBurst) {
    const state = this.getRoomState(roomId);
    if (!state) return;

    this.emitRoomUpdate(state.room.id, {
      type: 'REACTION',
      reaction,
    });
  }

  public emitRoomUpdate(roomId: string, payload: any) {
    this.emit(`room:${roomId}`, payload);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __nocturneRoomManager: RoomManager | undefined;
}

export const roomManager: RoomManager = global.__nocturneRoomManager || new RoomManager();
global.__nocturneRoomManager = roomManager;

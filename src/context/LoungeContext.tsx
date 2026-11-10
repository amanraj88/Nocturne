import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Room, Track, UserProfile, ChatMessage, ReactionBurst, GraphicsQuality, TrackSourceType } from '@/types';
import { FEATURED_ROOMS, INITIAL_TRACKS } from '@/lib/mockData';

interface LoungeContextType {
  currentRoom: Room;
  roomLoadState: 'ready' | 'loading' | 'not-found' | 'error';
  rooms: Room[];
  queue: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  progressSeconds: number;
  durationSeconds: number;
  volume: number;
  isMuted: boolean;
  quality: GraphicsQuality;
  members: UserProfile[];
  chatMessages: ChatMessage[];
  reactions: ReactionBurst[];
  isSearchOpen: boolean;
  isCreateRoomOpen: boolean;
  // Dual audio engine state
  hasPhysicalAudio: boolean;
  isYouTubeActive: boolean;
  youtubePlaybackBlocked: boolean;
  setYouTubePlaybackBlocked: (blocked: boolean) => void;
  audioPlaybackBlocked: boolean;
  audioError: string | null;
  loadLocalAudioFiles: (files: FileList | File[]) => Promise<void>;
  shareLocalAudioFile: (trackId: string) => Promise<void>;
  sharingTrackId: string | null;
  registerYouTubePlayer: (player: any) => void;
  syncYouTubePlaybackState: (isPlaying: boolean) => void;
  // Actions
  setQuality: (q: GraphicsQuality) => void;
  togglePlay: () => void;
  seekTo: (seconds: number, broadcast?: boolean) => void;
  skipTrack: (broadcast?: boolean) => void;
  previousTrack: (broadcast?: boolean) => void;
  selectTrack: (trackId: string, broadcast?: boolean) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  voteSkip: (trackId: string) => void;
  addTrackToQueue: (track: Partial<Track>) => void;
  removeTrack: (trackId: string) => void;
  sendChatMessage: (text: string) => void;
  triggerReaction: (emoji: string) => void;
  switchRoom: (roomId: string) => void;
  createRoom: (data: Partial<Room>) => Promise<Room>;
  resolveAndSetRoom: (slugOrId: string) => Promise<void>;
  setIsSearchOpen: (open: boolean) => void;
  setIsCreateRoomOpen: (open: boolean) => void;
}

const LoungeContext = createContext<LoungeContextType | undefined>(undefined);

const isBrowserLocalTrack = (track?: Track) => Boolean(
  track && (track.isLocalFile || track.sourceType === 'local' || track.audioUrl?.startsWith('blob:'))
);

const mergeRoomQueueWithBrowserLocalTracks = (remoteQueue: Track[], localQueue: Track[], activeTrackId?: string) => {
  const merged = [
    ...localQueue.filter(isBrowserLocalTrack),
    ...remoteQueue.filter((track) => !isBrowserLocalTrack(track)),
  ];
  return { queue: merged, activeIndex: activeTrackId ? merged.findIndex((track) => track.id === activeTrackId) : -1 };
};

const EMPTY_ROOM: Room = {
  id: '',
  slug: '',
  title: '',
  vibeTag: '',
  description: '',
  host: { id: '', name: '', role: 'listener', isListening: false, joinedAt: '' },
  listenerCount: 0,
  isPrivate: false,
  mode: 'collaborative',
  currentTrackId: '',
  artworkId: 'noc-01',
  ambientColor: '#101514',
  accentColor: '#A0B7A8',
};

export const LoungeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistent anonymous client identity for room participation
  const [clientId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('nocturne_client_id');
      if (stored) return stored;
      const gen = 'usr-' + Math.random().toString(36).substring(2, 9);
      try {
        sessionStorage.setItem('nocturne_client_id', gen);
      } catch (e) {}
      return gen;
    }
    return 'usr-guest';
  });

  const [clientName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('nocturne_client_name');
      if (stored) return stored;
      const gen = 'Listener ' + Math.floor(100 + Math.random() * 900);
      try {
        sessionStorage.setItem('nocturne_client_name', gen);
      } catch (e) {}
      return gen;
    }
    return 'Listener 101';
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('nocturne_custom_rooms');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return [...FEATURED_ROOMS, ...parsed];
          }
        }
      } catch {
        // ignore
      }
    }
    return FEATURED_ROOMS;
  });

  const [currentRoom, setCurrentRoom] = useState<Room>(FEATURED_ROOMS[0]);
  const [roomLoadState, setRoomLoadState] = useState<'ready' | 'loading' | 'not-found' | 'error'>('ready');
  const [queue, setQueue] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [physicalDuration, setPhysicalDuration] = useState<number | null>(null);
  const [volume, setVolumeState] = useState(82);
  const [isMuted, setIsMuted] = useState(false);
  const [quality, setQualityState] = useState<GraphicsQuality>('high');
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<ReactionBurst[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);

  // Dual audio engine state
  const [hasPhysicalAudio, setHasPhysicalAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [youtubePlaybackBlocked, setYouTubePlaybackBlocked] = useState(false);
  const [audioPlaybackBlocked, setAudioPlaybackBlocked] = useState(false);
  const [sharingTrackId, setSharingTrackId] = useState<string | null>(null);

  // Player references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const localFilesRef = useRef<Map<string, File>>(new Map());
  const pendingSharedSeekRef = useRef<number | null>(null);
  const reportedYouTubeDurationsRef = useRef<Set<string>>(new Set());
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const tabActionsRef = useRef<{
    seekTo: (seconds: number, broadcast?: boolean) => void;
    selectTrack: (trackId: string, broadcast?: boolean) => void;
    skipTrack: (broadcast?: boolean) => void;
  }>({ seekTo: () => {}, selectTrack: () => {}, skipTrack: () => {} });
  const roomLoadRequestRef = useRef(0);
  const roomLoadAbortRef = useRef<AbortController | null>(null);

  // Refs for stable access in SSE event handlers
  const currentTrackIndexRef = useRef(currentTrackIndex);
  currentTrackIndexRef.current = currentTrackIndex;
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const progressSecondsRef = useRef(progressSeconds);
  progressSecondsRef.current = progressSeconds;
  const currentRoomRef = useRef(currentRoom);
  currentRoomRef.current = currentRoom;

  const currentTrack = queue[currentTrackIndex] || queue[0] || null;
  const currentTrackRef = useRef<Track | null>(currentTrack);
  currentTrackRef.current = currentTrack;
  const durationSeconds = physicalDuration ?? (currentTrack ? currentTrack.durationSeconds : 0);

  useEffect(() => {
    setYouTubePlaybackBlocked(false);
  }, [currentRoom.id, currentTrack?.id]);

  // Active source detection
  const isYouTubeActive = Boolean(
    currentTrack?.sourceType === 'youtube' || (!currentTrack?.audioUrl && currentTrack?.youtubeId)
  );
  const isLocalAudioActive = Boolean(
    currentTrack?.sourceType === 'local' || currentTrack?.sourceType === 'fixture' || currentTrack?.audioUrl
  );

  const isYouTubeActiveRef = useRef(isYouTubeActive);
  isYouTubeActiveRef.current = isYouTubeActive;
  const isLocalAudioActiveRef = useRef(isLocalAudioActive);
  isLocalAudioActiveRef.current = isLocalAudioActive;

  // Dispatch realtime action to server
  const dispatchServerAction = useCallback(
    async (action: any) => {
      try {
        const roomId = currentRoomRef.current?.id;
        if (!roomId) return;
        const response = await fetch(`/api/rooms/${roomId}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action),
        });
        return response.ok;
      } catch (err) {
        // network failure or offline
        return false;
      }
    },
    []
  );

  // Broadcast same-device tab sync message
  const broadcastTabSync = useCallback(
    (data: {
      type: 'PLAY' | 'PAUSE' | 'SEEK' | 'SELECT_TRACK';
      trackId?: string;
      progressSeconds?: number;
    }) => {
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({
            ...data,
            roomId: currentRoom.id,
            timestamp: Date.now(),
          });
        } catch {
          // ignore
        }
      }
    },
    [currentRoom.id]
  );

  // Initialize same-device BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('nocturne_same_device_tab_sync');
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data || data.roomId !== currentRoom.id) return;

      if (data.type === 'PLAY') {
        setIsPlaying(true);
      } else if (data.type === 'PAUSE') {
        setIsPlaying(false);
      } else if (data.type === 'SEEK' && typeof data.progressSeconds === 'number') {
        tabActionsRef.current.seekTo(data.progressSeconds, false);
      } else if (data.type === 'SELECT_TRACK' && data.trackId) {
        tabActionsRef.current.selectTrack(data.trackId, false);
      }
    };

    return () => {
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [currentRoom.id]);

  // Connect to Server-Sent Events (SSE) for live room updates
  useEffect(() => {
    if (typeof window === 'undefined' || !currentRoom?.id) return;

    const roomId = currentRoom.id;
    const url = `/api/rooms/${roomId}/events?userId=${clientId}&userName=${encodeURIComponent(clientName)}`;
    let eventSource: EventSource | null = null;
    let heartbeatTimer: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource(url);

      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (!payload) return;

          if (payload.type === 'SNAPSHOT') {
            if (Array.isArray(payload.queue)) {
              const merged = mergeRoomQueueWithBrowserLocalTracks(payload.queue, queueRef.current, queueRef.current[currentTrackIndexRef.current]?.id);
              setQueue(merged.queue);
              if (merged.activeIndex >= 0) setCurrentTrackIndex(merged.activeIndex);
              else if (merged.queue.length === 0) setCurrentTrackIndex(0);
              else setCurrentTrackIndex((index) => Math.min(index, merged.queue.length - 1));
            }
            if (payload.room && typeof payload.room.listenerCount === 'number') {
              setCurrentRoom((prev) => ({ ...prev, listenerCount: payload.room.listenerCount }));
            }
            if (Array.isArray(payload.participants)) {
              setMembers(
                payload.participants.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  role: p.role || 'listener',
                  isListening: true,
                  joinedAt: p.joinedAt || 'Just now',
                  avatar: p.avatar,
                }))
              );
            }
            if (payload.playback) {
              const pb = payload.playback;
              if (pb.sourceType === 'shared-audio' && Number.isFinite(pb.progressSeconds)) {
                pendingSharedSeekRef.current = Math.max(0, pb.progressSeconds);
              }
              if (pb.currentTrackId) {
                const idx = (payload.queue || queueRef.current).findIndex((t: Track) => t.id === pb.currentTrackId);
                if (idx !== -1 && idx !== currentTrackIndexRef.current) {
                  setCurrentTrackIndex(idx);
                }
              }
              if (typeof pb.isPlaying === 'boolean' && pb.isPlaying !== isPlayingRef.current) {
                setIsPlaying(pb.isPlaying);
              }
              if (typeof pb.progressSeconds === 'number') {
                setProgressSeconds(pb.progressSeconds);
                if (isYouTubeActiveRef.current && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
                  try { ytPlayerRef.current.seekTo(pb.progressSeconds, true); } catch (err) {}
                } else if (isLocalAudioActiveRef.current && audioRef.current && isFinite(audioRef.current.duration)) {
                  try {
                    audioRef.current.currentTime = pb.progressSeconds;
                    if (pb.sourceType === 'shared-audio') pendingSharedSeekRef.current = null;
                  } catch (err) {}
                }
              }
            }
            if (Array.isArray(payload.chatMessages)) {
              setChatMessages(payload.chatMessages);
            }
          } else if (payload.type === 'PLAYBACK_UPDATE' && payload.playback) {
            const pb = payload.playback;
            if (pb.sourceType === 'shared-audio' && Number.isFinite(pb.progressSeconds)) {
              pendingSharedSeekRef.current = Math.max(0, pb.progressSeconds);
            }
            if (pb.currentTrackId && pb.currentTrackId !== queueRef.current[currentTrackIndexRef.current]?.id) {
              const idx = queueRef.current.findIndex((t) => t.id === pb.currentTrackId);
              if (idx !== -1) {
                setCurrentTrackIndex(idx);
              }
            }
            if (typeof pb.isPlaying === 'boolean' && pb.isPlaying !== isPlayingRef.current) {
              setIsPlaying(pb.isPlaying);
              if (isYouTubeActiveRef.current && ytPlayerRef.current) {
                try {
                  if (pb.isPlaying && typeof ytPlayerRef.current.playVideo === 'function') {
                    ytPlayerRef.current.playVideo();
                  } else if (!pb.isPlaying && typeof ytPlayerRef.current.pauseVideo === 'function') {
                    ytPlayerRef.current.pauseVideo();
                  }
                } catch (err) {}
              }
            }
            if (typeof pb.progressSeconds === 'number') {
              const drift = Math.abs(progressSecondsRef.current - pb.progressSeconds);
              if (drift > 2) {
                setProgressSeconds(pb.progressSeconds);
                if (isYouTubeActiveRef.current && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
                  try { ytPlayerRef.current.seekTo(pb.progressSeconds, true); } catch (err) {}
                } else if (isLocalAudioActiveRef.current && audioRef.current && isFinite(audioRef.current.duration)) {
                  try {
                    audioRef.current.currentTime = pb.progressSeconds;
                    if (pb.sourceType === 'shared-audio') pendingSharedSeekRef.current = null;
                  } catch (err) {}
                }
              }
            }
          } else if (payload.type === 'QUEUE_UPDATE' && Array.isArray(payload.queue)) {
            const merged = mergeRoomQueueWithBrowserLocalTracks(payload.queue, queueRef.current, queueRef.current[currentTrackIndexRef.current]?.id);
            setQueue(merged.queue);
            if (merged.activeIndex >= 0) setCurrentTrackIndex(merged.activeIndex);
            else if (merged.queue.length === 0) setCurrentTrackIndex(0);
            else setCurrentTrackIndex((index) => Math.min(index, merged.queue.length - 1));
          } else if (payload.type === 'PARTICIPANTS_UPDATE') {
            if (Array.isArray(payload.participants)) {
              setMembers(
                payload.participants.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  role: p.role || 'listener',
                  isListening: true,
                  joinedAt: p.joinedAt || 'Just now',
                  avatar: p.avatar,
                }))
              );
            }
            if (typeof payload.listenerCount === 'number') {
              setCurrentRoom((prev) => ({ ...prev, listenerCount: payload.listenerCount }));
            }
          } else if (payload.type === 'CHAT_MESSAGE' && payload.message) {
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === payload.message.id)) return prev;
              return [...prev, payload.message];
            });
          } else if (payload.type === 'REACTION' && payload.reaction) {
            setReactions((prev) => [...prev.slice(-15), payload.reaction]);
          }
        } catch (err) {}
      };

      eventSource.onerror = () => {
        // SSE error, will auto-reconnect
      };

      // Periodic heartbeat every 10 seconds
      heartbeatTimer = setInterval(() => {
        fetch(`/api/rooms/${roomId}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'HEARTBEAT', userId: clientId }),
        }).catch(() => {});
      }, 10000);
    } catch (e) {}

    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (eventSource) eventSource.close();
      // Inform server of leave
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify({ type: 'LEAVE', userId: clientId })], {
            type: 'application/json',
          });
          navigator.sendBeacon(`/api/rooms/${roomId}/action`, blob);
        } else {
          fetch(`/api/rooms/${roomId}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'LEAVE', userId: clientId }),
            keepalive: true,
          }).catch(() => {});
        }
      } catch (err) {}
    };
  }, [currentRoom?.id, clientId, clientName]);

  // Clean up object URLs on unmount
  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
      });
      urls.clear();
      localFilesRef.current.clear();
    };
  }, []);

  // Initialize physical HTMLAudioElement for local/test-tone audio
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volume / 100;
    audio.muted = isMuted;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (pendingSharedSeekRef.current === null && audioRef.current && isFinite(audioRef.current.currentTime)) {
        setProgressSeconds(Math.floor(audioRef.current.currentTime));
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
        setPhysicalDuration(Math.round(audioRef.current.duration));
        const pendingSeek = pendingSharedSeekRef.current;
        if (currentTrackRef.current?.sourceType === 'shared-audio' && pendingSeek !== null) {
          const target = Math.min(pendingSeek, Math.max(0, audioRef.current.duration - 0.25));
          try {
            audioRef.current.currentTime = target;
            setProgressSeconds(target);
          } catch (e) {}
          pendingSharedSeekRef.current = null;
        }
      }
    };

    const handleEnded = () => {
      tabActionsRef.current.skipTrack(true);
    };

    const handlePlay = () => {
      // STRICT SIMULTANEOUS-SOURCE PREVENTION:
      // If local audio plays, ensure YouTube is paused!
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch (e) {}
      }
      setIsPlaying(true);
      setAudioPlaybackBlocked(false);
    };

    const handlePause = () => {
      if (!isYouTubeActiveRef.current) {
        setIsPlaying(false);
      }
    };

    const handleError = () => {
      if (audio.error) {
        setAudioError(`Audio error (${audio.error.code}): Unable to decode audio stream.`);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Register YouTube Player instance from VinylStage
  const registerYouTubePlayer = useCallback(
    (player: any) => {
      ytPlayerRef.current = player;
      if (player && typeof player.setVolume === 'function') {
        try {
          player.setVolume(volume);
          if (isMuted) player.mute();
          else player.unMute();
        } catch (e) {}
      }
      const activeTrack = currentTrackRef.current;
      if (isYouTubeActiveRef.current && activeTrack?.youtubeId) {
        try {
          if (isPlayingRef.current) player.loadVideoById(activeTrack.youtubeId);
          else player.cueVideoById(activeTrack.youtubeId);
          if (progressSecondsRef.current > 0) player.seekTo(progressSecondsRef.current, true);
        } catch (e) {}
      }
    },
    [volume, isMuted]
  );

  const syncYouTubePlaybackState = useCallback(
    (nextPlaying: boolean) => {
      if (!currentRoomRef.current?.id) return;
      if (!isYouTubeActiveRef.current || !currentTrackRef.current || !(currentTrackRef.current.sourceType === 'youtube' || (!currentTrackRef.current.audioUrl && currentTrackRef.current.youtubeId))) return;
      if (nextPlaying) setYouTubePlaybackBlocked(false);
      if (isPlayingRef.current === nextPlaying) return;
      isPlayingRef.current = nextPlaying;
      setIsPlaying(nextPlaying);
      const actionType = nextPlaying ? 'PLAY' : 'PAUSE';
      broadcastTabSync({ type: actionType });
      dispatchServerAction({
        type: actionType,
        progressSeconds: progressSecondsRef.current,
        trackId: currentTrackRef.current.id,
        sourceType: 'youtube',
      });
    },
    [broadcastTabSync, dispatchServerAction]
  );

  // Synchronize currentTrack with active engine
  useEffect(() => {
    const audio = audioRef.current;
    const yt = ytPlayerRef.current;

    if (isYouTubeActive) {
      // PREVENT SIMULTANEOUS: PAUSE PHYSICAL AUDIO IMMEDIATELY!
      if (audio && !audio.paused) {
        audio.pause();
      }
      setHasPhysicalAudio(false);
      setAudioError(null);

      if (yt && typeof yt.loadVideoById === 'function' && currentTrack?.youtubeId) {
        try {
          if (isPlaying) {
            yt.loadVideoById(currentTrack.youtubeId);
          } else {
            yt.cueVideoById(currentTrack.youtubeId);
          }
        } catch (e) {}
      }
    } else if (isLocalAudioActive && currentTrack?.audioUrl) {
      // PREVENT SIMULTANEOUS: PAUSE YOUTUBE IMMEDIATELY!
      if (yt && typeof yt.pauseVideo === 'function') {
        try {
          yt.pauseVideo();
        } catch (e) {}
      }
      setHasPhysicalAudio(true);
      setAudioError(null);

      if (audio) {
        const targetUrl = new URL(currentTrack.audioUrl, window.location.href).href;
        if (audio.src !== targetUrl) {
          audio.src = currentTrack.audioUrl;
          audio.currentTime = 0;
          setProgressSeconds(0);
        }
        if (isPlaying) {
          audio.play().catch((err) => {
            console.warn('Autoplay prevented by browser:', err);
            setIsPlaying(false);
          });
        }
      }
    } else {
      // Specimen without audio stream: pause both
      setHasPhysicalAudio(false);
      setPhysicalDuration(null);
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
      }
      if (yt && typeof yt.pauseVideo === 'function') {
        try {
          yt.pauseVideo();
        } catch (e) {}
      }
    }
  }, [currentTrack?.id, currentTrack?.audioUrl, currentTrack?.youtubeId, isYouTubeActive, isLocalAudioActive]);

  // Synchronize isPlaying with active source
  useEffect(() => {
    const audio = audioRef.current;
    const yt = ytPlayerRef.current;

    if (isPlaying) {
      if (isYouTubeActive) {
        if (audio && !audio.paused) audio.pause();
        if (yt && typeof yt.playVideo === 'function') {
          try {
            yt.playVideo();
          } catch (e) {}
        }
      } else if (isLocalAudioActive && currentTrack?.audioUrl) {
        if (yt && typeof yt.pauseVideo === 'function') {
          try {
            yt.pauseVideo();
          } catch (e) {}
        }
        if (audio && audio.paused) {
          audio.play().catch((err) => {
            console.warn('Play prevented:', err);
            setAudioPlaybackBlocked(true);
            setAudioError('Playback in this tab needs a tap. Press play to join the room.');
          });
        }
      }
    } else {
      if (isYouTubeActive) {
        if (yt && typeof yt.pauseVideo === 'function') {
          try {
            yt.pauseVideo();
          } catch (e) {}
        }
      } else {
        if (audio && !audio.paused) {
          audio.pause();
        }
      }
    }
  }, [isPlaying, isYouTubeActive, isLocalAudioActive, currentTrack?.audioUrl]);

  // Read real YouTube duration and playhead from the official player.
  useEffect(() => {
    if (!isYouTubeActive) return;

    const interval = setInterval(() => {
      const yt = ytPlayerRef.current;
      if (yt) {
        if (typeof yt.getCurrentTime === 'function') {
          try {
            const curTime = yt.getCurrentTime();
            if (isPlayingRef.current && typeof curTime === 'number' && isFinite(curTime)) {
              setProgressSeconds(Math.floor(curTime));
            }
          } catch (e) {}
        }
        if (typeof yt.getDuration === 'function') {
          try {
            const dur = yt.getDuration();
            if (typeof dur === 'number' && isFinite(dur) && dur > 0) {
              const durationSeconds = Math.round(dur);
              setPhysicalDuration(durationSeconds);
              const track = currentTrackRef.current;
              const reportKey = track ? `${track.id}:${durationSeconds}` : '';
              if (track?.youtubeId && track.durationSeconds !== durationSeconds && reportKey && !reportedYouTubeDurationsRef.current.has(reportKey)) {
                reportedYouTubeDurationsRef.current.add(reportKey);
                void dispatchServerAction({ type: 'TRACK_DURATION', trackId: track.id, durationSeconds }).then((ok) => {
                  if (!ok) reportedYouTubeDurationsRef.current.delete(reportKey);
                });
              }
            }
          } catch (e) {}
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isYouTubeActive, dispatchServerAction]);

  // One participant periodically publishes the actual playhead for room sync.
  useEffect(() => {
    if (!isPlaying || !currentTrack || isBrowserLocalTrack(currentTrack)) return;

    const interval = setInterval(() => {
      if (isYouTubeActive && ytPlayerRef.current?.getPlayerState?.() !== 1) return;
      if (!isYouTubeActive && audioRef.current?.paused) return;
      const time = isYouTubeActive
        ? ytPlayerRef.current?.getCurrentTime?.()
        : audioRef.current?.currentTime;
      if (typeof time !== 'number' || !isFinite(time)) return;
      dispatchServerAction({
        type: 'SYNC_PROGRESS',
        trackId: currentTrack.id,
        progressSeconds: Math.max(0, Math.floor(time)),
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack?.id, isYouTubeActive, dispatchServerAction]);

  // Sync quality to document attribute for CSS switches
  const setQuality = (q: GraphicsQuality) => {
    setQualityState(q);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-quality', q);
    }
  };

  const togglePlay = (broadcast = true) => {
    if (isYouTubeActive && isPlayingRef.current && youtubePlaybackBlocked) {
      setAudioError(null);
      try {
        ytPlayerRef.current?.playVideo?.();
      } catch {
        setAudioError('Playback in this tab needs a tap. Try again to join the room.');
      }
      return;
    }

    if (isLocalAudioActive && isPlayingRef.current && audioPlaybackBlocked) {
      setAudioError(null);
      audioRef.current?.play().catch(() => {
        setAudioPlaybackBlocked(true);
        setAudioError('Playback in this tab needs a tap. Press play to join the room.');
      });
      return;
    }

    if (!currentTrack || (!isYouTubeActive && !isLocalAudioActive)) {
      setIsPlaying(false);
      setAudioError(currentTrack
        ? 'This queue item has no playable audio source.'
        : 'Queue a YouTube video or choose a local audio file to start playback.');
      return;
    }

    setAudioError(null);
    setIsPlaying((prev) => {
      const next = !prev;

      if (next) {
        if (isYouTubeActive) {
          if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();
          if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
            try { ytPlayerRef.current.playVideo(); } catch (e) {}
          }
        } else if (isLocalAudioActive && currentTrack.audioUrl) {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
            try { ytPlayerRef.current.pauseVideo(); } catch (e) {}
          }
          if (audioRef.current) {
            audioRef.current.play().catch(() => {
              setAudioError('This browser could not play the selected audio file. Try another format.');
              setIsPlaying(false);
            });
          }
        }
      } else if (isYouTubeActive) {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          try { ytPlayerRef.current.pauseVideo(); } catch (e) {}
        }
      } else if (audioRef.current) {
        audioRef.current.pause();
      }

      if (broadcast && !isBrowserLocalTrack(currentTrack)) {
        broadcastTabSync({ type: next ? 'PLAY' : 'PAUSE' });
        dispatchServerAction({
          type: next ? 'PLAY' : 'PAUSE',
          progressSeconds,
          trackId: currentTrack.id,
          sourceType: isYouTubeActive ? 'youtube' : 'fixture',
        });
      }
      return next;
    });
  };

  const seekTo = (seconds: number, broadcast = true) => {
    if (!currentTrack) return;
    const clamped = Math.max(0, Math.min(seconds, durationSeconds));
    setProgressSeconds(clamped);

    if (isYouTubeActive) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        try {
          ytPlayerRef.current.seekTo(clamped, true);
        } catch (e) {}
      }
    } else if (isLocalAudioActive) {
      const audio = audioRef.current;
      if (audio && currentTrack?.audioUrl && isFinite(audio.duration)) {
        audio.currentTime = clamped;
      }
    }

    if (broadcast && !isBrowserLocalTrack(currentTrack)) {
      broadcastTabSync({ type: 'SEEK', progressSeconds: clamped });
      dispatchServerAction({ type: 'SEEK', progressSeconds: clamped, trackId: currentTrack?.id });
    }
  };

  const skipTrack = (broadcast = true) => {
    if (queue.length === 0) return;
    if (audioRef.current) audioRef.current.pause();
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      try { ytPlayerRef.current.pauseVideo(); } catch (e) {}
    }

    const nextIdx = (currentTrackIndex + 1) % queue.length;
    const nextTrack = queue[nextIdx];
    setCurrentTrackIndex(nextIdx);
    setProgressSeconds(0);
    setPhysicalDuration(null);
    const nextIsPlayable = Boolean(nextTrack?.youtubeId || nextTrack?.audioUrl);
    if (!nextIsPlayable) {
      setIsPlaying(false);
      setAudioError('The next queue item has no playable audio source.');
    } else {
      setAudioError(null);
    }

    if (broadcast && nextTrack && !isBrowserLocalTrack(nextTrack)) {
      broadcastTabSync({ type: 'SELECT_TRACK', trackId: nextTrack.id });
      dispatchServerAction({ type: 'SELECT_TRACK', trackId: nextTrack.id });
    }
  };

  const previousTrack = (broadcast = true) => {
    if (queue.length === 0) return;
    if (progressSeconds > 4) {
      seekTo(0, broadcast);
    } else {
      if (audioRef.current) audioRef.current.pause();
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch (e) {}
      }

      const prevIdx = (currentTrackIndex - 1 + queue.length) % queue.length;
      setCurrentTrackIndex(prevIdx);
      setProgressSeconds(0);
      setPhysicalDuration(null);

      if (broadcast && queue[prevIdx] && !isBrowserLocalTrack(queue[prevIdx])) {
        broadcastTabSync({ type: 'SELECT_TRACK', trackId: queue[prevIdx].id });
        dispatchServerAction({ type: 'SELECT_TRACK', trackId: queue[prevIdx].id });
      }
    }
  };

  const selectTrack = (trackId: string, broadcast = true) => {
    const idx = queue.findIndex((track) => track.id === trackId);
    if (idx < 0) return;

    if (audioRef.current) audioRef.current.pause();
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      try { ytPlayerRef.current.pauseVideo(); } catch (e) {}
    }

    const targetTrack = queue[idx];
    const hasPlayableSource = Boolean(targetTrack.youtubeId || targetTrack.audioUrl);
    setCurrentTrackIndex(idx);
    setProgressSeconds(0);
    setPhysicalDuration(null);
    setIsPlaying(hasPlayableSource);
    setAudioError(hasPlayableSource ? null : 'This queue item has no playable audio source.');

    const targetIsYouTube = Boolean(targetTrack.youtubeId && (targetTrack.sourceType === 'youtube' || !targetTrack.audioUrl));
    if (targetIsYouTube) {
      setHasPhysicalAudio(false);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        try { ytPlayerRef.current.loadVideoById(targetTrack.youtubeId); } catch (e) {}
      }
    } else if (targetTrack.audioUrl) {
      setHasPhysicalAudio(true);
      if (audioRef.current) {
        audioRef.current.src = targetTrack.audioUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          setAudioError('This browser could not play the selected audio file. Try another format.');
          setIsPlaying(false);
        });
      }
    } else {
      setHasPhysicalAudio(false);
    }

    if (broadcast && !isBrowserLocalTrack(targetTrack)) {
      broadcastTabSync({ type: 'SELECT_TRACK', trackId });
      dispatchServerAction({ type: 'SELECT_TRACK', trackId });
    }
  };

  tabActionsRef.current = { seekTo, selectTrack, skipTrack };

  const setVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(100, v));
    setVolumeState(clamped);
    if (clamped > 0) setIsMuted(false);

    if (audioRef.current) {
      audioRef.current.volume = clamped / 100;
      audioRef.current.muted = false;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try {
        ytPlayerRef.current.setVolume(clamped);
        ytPlayerRef.current.unMute();
      } catch (e) {}
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      if (ytPlayerRef.current) {
        try {
          if (next && typeof ytPlayerRef.current.mute === 'function') {
            ytPlayerRef.current.mute();
          } else if (!next && typeof ytPlayerRef.current.unMute === 'function') {
            ytPlayerRef.current.unMute();
          }
        } catch (e) {}
      }
      return next;
    });
  };

  const voteSkip = (trackId: string) => {
    setQueue((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const already = t.userVotedSkip;
          return {
            ...t,
            userVotedSkip: !already,
            skipVotes: already ? t.skipVotes - 1 : t.skipVotes + 1,
          };
        }
        return t;
      })
    );
    dispatchServerAction({ type: 'QUEUE_VOTE', trackId });
  };

  const addTrackToQueue = (trackPartial: Partial<Track>) => {
    const artworkId =
      trackPartial.artworkId || (currentRoom.artworkId as 'noc-01' | 'noc-02' | 'noc-03') || 'noc-01';

    const inferredSource: TrackSourceType =
      trackPartial.sourceType ||
      (trackPartial.audioUrl
        ? trackPartial.isTestFixture
          ? 'fixture'
          : 'local'
        : trackPartial.youtubeId
        ? 'youtube'
        : 'specimen');

    const newTrack: Track = {
      id: trackPartial.id || `tr-${Date.now()}`,
      sourceType: inferredSource,
      youtubeId: trackPartial.youtubeId,
      title: trackPartial.title || 'Untitled Track',
      artist: trackPartial.artist || (inferredSource === 'youtube' ? 'YouTube Broadcast' : 'Curated Artist'),
      albumArt: trackPartial.albumArt || `/artwork/${artworkId}.svg`,
      artworkId,
      durationSeconds: trackPartial.durationSeconds ?? 0,
      audioUrl: trackPartial.audioUrl,
      isLocalFile: trackPartial.isLocalFile,
      isTestFixture: trackPartial.isTestFixture,
      fileName: trackPartial.fileName,
      fileSize: trackPartial.fileSize,
      addedBy: {
        id: clientId,
        name: clientName,
      },
      addedAt: 'Just now',
      upvotes: 1,
      skipVotes: 0,
    };

    setQueue((prev) => [...prev, newTrack]);
    if (newTrack.isLocalFile || newTrack.audioUrl?.startsWith('blob:')) {
      // Browser-local audio stays in this tab and is never sent to room chat or APIs.
      return;
    }
    sendChatMessage(`Queued ${inferredSource === 'youtube' ? 'YouTube stream' : 'track'}: "${newTrack.title}"`);
    dispatchServerAction({ type: 'QUEUE_ADD', track: newTrack });
  };

  const loadLocalAudioFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) =>
        f.type.startsWith('audio/') ||
        /\.(mp3|wav|flac|ogg|m4a|aac|webm)$/i.test(f.name)
    );

    if (fileArray.length === 0) {
      setAudioError('Please select valid audio files (.mp3, .wav, .flac, .ogg, .m4a).');
      return;
    }

    const newTracks: Track[] = [];
    const artworkCycle: Array<'noc-01' | 'noc-02' | 'noc-03'> = ['noc-01', 'noc-02', 'noc-03'];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const objectUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(objectUrl);

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      let artist = 'Local Master';
      let title = baseName;
      if (baseName.includes(' - ')) {
        const parts = baseName.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }

      const duration = await new Promise<number>((resolve) => {
        const tmp = new Audio();
        tmp.preload = 'metadata';
        tmp.src = objectUrl;
        tmp.onloadedmetadata = () => {
          if (isFinite(tmp.duration) && tmp.duration > 0) {
            resolve(Math.round(tmp.duration));
          } else {
            resolve(180);
          }
        };
        tmp.onerror = () => resolve(180);
        setTimeout(() => resolve(180), 2000);
      });

      const chosenArtwork =
        currentRoom.artworkId || artworkCycle[(queue.length + i) % artworkCycle.length];

      const localTrackId = `tr-local-${Date.now()}-${i}`;
      localFilesRef.current.set(localTrackId, file);
      const track: Track = {
        id: localTrackId,
        sourceType: 'local',
        title,
        artist,
        albumArt: `/artwork/${chosenArtwork}.svg`,
        artworkId: chosenArtwork,
        durationSeconds: duration,
        audioUrl: objectUrl,
        isLocalFile: true,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        addedBy: {
          id: clientId,
          name: clientName,
        },
        addedAt: 'Just now',
        upvotes: 1,
        skipVotes: 0,
      };

      newTracks.push(track);
    }

    setQueue((prev) => [...newTracks, ...prev]);
    setCurrentTrackIndex(0);
    setProgressSeconds(0);
    setIsPlaying(true);
    setAudioError(null);
    // Keep filenames, file sizes, blob URLs, and local playback state in this browser only.
  };

  const shareLocalAudioFile = async (trackId: string) => {
    const localTrack = queueRef.current.find((track) => track.id === trackId && isBrowserLocalTrack(track));
    const file = localFilesRef.current.get(trackId);
    if (!localTrack || !file) {
      setAudioError('This local file is no longer available. Choose it again before sharing.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setAudioError('Room audio uploads are limited to 25 MB. The file still plays locally.');
      return;
    }

    setSharingTrackId(trackId);
    setAudioError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read the selected audio file.'));
        reader.onload = () => {
          const result = String(reader.result || '');
          const separator = result.indexOf(',');
          if (separator < 0) reject(new Error('Could not prepare this audio file for upload.'));
          else resolve(result.slice(separator + 1));
        };
        reader.readAsDataURL(file);
      });
      const response = await fetch('/api/rooms/' + encodeURIComponent(currentRoomRef.current.id) + '/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          base64,
          title: localTrack.title,
          artist: localTrack.artist,
          durationSeconds: localTrack.durationSeconds,
          addedBy: { id: clientId, name: clientName },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.track) throw new Error(result.error || 'The file could not be shared with this room.');

      const sharedTrack = result.track as Track;
      const nextQueue = queueRef.current.filter((track) => track.id !== trackId && track.id !== sharedTrack.id);
      const oldIndex = queueRef.current.findIndex((track) => track.id === trackId);
      nextQueue.splice(Math.max(0, Math.min(oldIndex, nextQueue.length)), 0, sharedTrack);
      setQueue(nextQueue);
      const sharedIndex = nextQueue.findIndex((track) => track.id === sharedTrack.id);
      setCurrentTrackIndex(sharedIndex);
      currentTrackIndexRef.current = sharedIndex;
      setProgressSeconds(0);
      setPhysicalDuration(sharedTrack.durationSeconds || null);
      setIsPlaying(true);
      setHasPhysicalAudio(true);
      const objectUrl = localTrack.audioUrl;
      if (objectUrl && objectUrlsRef.current.has(objectUrl)) {
        URL.revokeObjectURL(objectUrl);
        objectUrlsRef.current.delete(objectUrl);
      }
      localFilesRef.current.delete(trackId);
      broadcastTabSync({ type: 'SELECT_TRACK', trackId: sharedTrack.id });
      await dispatchServerAction({ type: 'SELECT_TRACK', trackId: sharedTrack.id });
      sendChatMessage('Shared audio with the room: "' + sharedTrack.title + '"');
    } catch (error: any) {
      setAudioError(error?.message || 'The audio file could not be shared with this room.');
    } finally {
      setSharingTrackId(null);
    }
  };

  const removeTrack = (trackId: string) => {
    setQueue((prev) => {
      const toRemove = prev.find((t) => t.id === trackId);
      localFilesRef.current.delete(trackId);
      if (toRemove?.audioUrl && objectUrlsRef.current.has(toRemove.audioUrl)) {
        try {
          URL.revokeObjectURL(toRemove.audioUrl);
          objectUrlsRef.current.delete(toRemove.audioUrl);
        } catch (e) {}
      }
      return prev.filter((t) => t.id !== trackId);
    });
    if (!isBrowserLocalTrack(queue.find((track) => track.id === trackId))) {
      dispatchServerAction({ type: 'QUEUE_REMOVE', trackId });
    }
  };

  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;
    const newMsg: ChatMessage = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user: {
        id: clientId,
        name: clientName,
        role: currentRoom.host?.id === clientId ? 'host' : 'listener',
        isListening: true,
        joinedAt: 'Just now',
      },
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    dispatchServerAction({ type: 'CHAT_MESSAGE', message: newMsg });
  };

  const triggerReaction = (emoji: string) => {
    const burst: ReactionBurst = {
      id: `r-${Date.now()}-${Math.random()}`,
      emoji,
      userName: clientName,
      x: Math.floor(Math.random() * 80) + 10,
    };
    setReactions((prev) => [...prev.slice(-15), burst]);
    dispatchServerAction({ type: 'REACTION', reaction: burst });
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== burst.id));
    }, 2500);
  };

  const resolveAndSetRoom = useCallback(
    async (slugOrId: string) => {
      if (!slugOrId) return;
      const requestId = ++roomLoadRequestRef.current;
      roomLoadAbortRef.current?.abort();
      const controller = new AbortController();
      roomLoadAbortRef.current = controller;

      // Clear every room-scoped value before requesting the next room. Never leave
      // the previous room visible while a shared link is loading or failing.
      setRoomLoadState('loading');
      currentTrackRef.current = null;
      currentRoomRef.current = EMPTY_ROOM;
      queueRef.current = [];
      currentTrackIndexRef.current = 0;
      isPlayingRef.current = false;
      pendingSharedSeekRef.current = null;
      setCurrentRoom(EMPTY_ROOM);
      setQueue([]);
      setCurrentTrackIndex(0);
      setIsPlaying(false);
      setProgressSeconds(0);
      setPhysicalDuration(null);
      setMembers([]);
      setChatMessages([]);
      setReactions([]);
      setAudioError(null);
      setAudioPlaybackBlocked(false);
      setYouTubePlaybackBlocked(false);
      setSharingTrackId(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
      try { ytPlayerRef.current?.pauseVideo?.(); } catch (e) {}
      localFilesRef.current.clear();
      objectUrlsRef.current.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch (e) {}
      });
      objectUrlsRef.current.clear();

      try {
        const response = await fetch(`/api/rooms/${encodeURIComponent(slugOrId)}/state`, { signal: controller.signal });
        if (requestId !== roomLoadRequestRef.current) return;
        if (response.status === 404) {
          setRoomLoadState('not-found');
          return;
        }
        if (!response.ok) throw new Error(`Room request failed (${response.status}).`);
        const data = await response.json();
        if (requestId !== roomLoadRequestRef.current) return;
        if (!data?.room?.id || !Array.isArray(data.queue) || !data.playback) {
          throw new Error('The room response was incomplete.');
        }

        const nextQueue = data.queue.filter((track: Track) => !isBrowserLocalTrack(track));
        const nextIndex = nextQueue.findIndex((track: Track) => track.id === data.playback.currentTrackId);
        setCurrentRoom(data.room as Room);
        currentRoomRef.current = data.room as Room;
        setQueue(nextQueue);
        queueRef.current = nextQueue;
        const selectedIndex = nextIndex >= 0 ? nextIndex : 0;
        setCurrentTrackIndex(selectedIndex);
        currentTrackIndexRef.current = selectedIndex;
        setIsPlaying(Boolean(data.playback.isPlaying && nextQueue.length > 0));
        isPlayingRef.current = Boolean(data.playback.isPlaying && nextQueue.length > 0);
        setProgressSeconds(nextIndex >= 0 && Number.isFinite(data.playback.progressSeconds) ? Math.max(0, data.playback.progressSeconds) : 0);
        setMembers(Array.isArray(data.participants) ? data.participants.map((p: any) => ({
          id: p.id,
          name: p.name,
          role: p.role || 'listener',
          isListening: true,
          joinedAt: p.joinedAt || 'Just now',
          avatar: p.avatar,
        })) : []);
        setChatMessages(Array.isArray(data.chatMessages) ? data.chatMessages : []);
        setRooms((prev) => prev.some((room) => room.id === data.room.id) ? prev : [...prev, data.room]);
        if (data.playback.sourceType === 'shared-audio' && Number.isFinite(data.playback.progressSeconds)) {
          pendingSharedSeekRef.current = Math.max(0, data.playback.progressSeconds);
        }
        setRoomLoadState('ready');
      } catch (error) {
        if (controller.signal.aborted || requestId !== roomLoadRequestRef.current) return;
        console.error('Unable to load listening room:', error);
        setRoomLoadState('error');
      } finally {
        if (requestId === roomLoadRequestRef.current) roomLoadAbortRef.current = null;
      }
    },
    []
  );

  const switchRoom = (roomId: string) => {
    resolveAndSetRoom(roomId);
  };

  const createRoom = async (data: Partial<Room>): Promise<Room> => {
    const rawTitle = data.title?.trim() || 'Untitled Lounge';
    const slug =
      rawTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `lounge-${Date.now()}`;

    const artworkCycle: Array<'noc-01' | 'noc-02' | 'noc-03'> = ['noc-01', 'noc-02', 'noc-03'];
    const chosenArtwork = data.artworkId || artworkCycle[rooms.length % artworkCycle.length];
    const accentPalette: Record<'noc-01' | 'noc-02' | 'noc-03', string> = {
      'noc-01': '#A0B7A8',
      'noc-02': '#E8E4D9',
      'noc-03': '#A65D45',
    };

    const hostUser: UserProfile = {
      id: clientId,
      name: clientName,
      role: 'host',
      isListening: true,
      joinedAt: 'Just now',
    };

    const requestedRoom: Room = {
      id: `room-${slug}`,
      slug,
      title: rawTitle,
      vibeTag: data.vibeTag?.trim() || 'Ambient & Modular',
      description: data.description?.trim() || 'Curated intimate listening session on NOCTURNE.',
      host: hostUser,
      listenerCount: 0,
      isPrivate: Boolean(data.isPrivate),
      mode: data.mode || 'collaborative',
      currentTrackId: queue[0]?.id || '',
      artworkId: chosenArtwork,
      ambientColor: accentPalette[chosenArtwork],
      accentColor: accentPalette[chosenArtwork],
    };

    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: requestedRoom.slug,
        name: requestedRoom.title,
        description: requestedRoom.description,
        vibeTag: requestedRoom.vibeTag,
        mode: requestedRoom.mode,
        artworkId: requestedRoom.artworkId,
        host: hostUser,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.room) {
      throw new Error(result.error || 'Could not create this room. Check your connection and try again.');
    }
    const newRoom = result.room as Room;

    setRooms((prev) => {
      const filtered = prev.filter((r) => r.slug !== newRoom.slug);
      const updated = [...filtered, newRoom];
      if (typeof window !== 'undefined') {
        try {
          const customOnly = updated.filter((r) => !FEATURED_ROOMS.some((fr) => fr.slug === r.slug));
          sessionStorage.setItem('nocturne_custom_rooms', JSON.stringify(customOnly));
        } catch {
          // ignore
        }
      }
      return updated;
    });

    setCurrentRoom(newRoom);
    setCurrentTrackIndex(0);
    setProgressSeconds(0);
    return newRoom;
  };

  // Global Media Keyboard Controls (Space, Left/Right, Up/Down, M)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInteractive = activeEl instanceof HTMLElement && Boolean(
        activeEl.closest('input, textarea, select, button, a, [role="button"], [role="slider"], [contenteditable="true"]')
      );
      if (isInteractive) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay(true);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekTo(Math.max(0, progressSeconds - 5), true);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekTo(Math.min(durationSeconds, progressSeconds + 5), true);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume(Math.min(100, volume + 5));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume(Math.max(0, volume - 5));
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seekTo, progressSeconds, durationSeconds, setVolume, volume, toggleMute]);

  return (
    <LoungeContext.Provider
      value={{
        currentRoom,
        roomLoadState,
        rooms,
        queue,
        currentTrack,
        isPlaying,
        progressSeconds,
        durationSeconds,
        volume,
        isMuted,
        quality,
        members,
        chatMessages,
        reactions,
        isSearchOpen,
        isCreateRoomOpen,
        hasPhysicalAudio,
        isYouTubeActive,
        youtubePlaybackBlocked,
        setYouTubePlaybackBlocked,
        audioPlaybackBlocked,
        audioError,
        loadLocalAudioFiles,
        shareLocalAudioFile,
        sharingTrackId,
        registerYouTubePlayer,
        syncYouTubePlaybackState,
        setQuality,
        togglePlay,
        seekTo,
        skipTrack,
        previousTrack,
        selectTrack,
        setVolume,
        toggleMute,
        voteSkip,
        addTrackToQueue,
        removeTrack,
        sendChatMessage,
        triggerReaction,
        switchRoom,
        createRoom,
        resolveAndSetRoom,
        setIsSearchOpen,
        setIsCreateRoomOpen,
      }}
    >
      {children}
    </LoungeContext.Provider>
  );
};

export const useLounge = () => {
  const context = useContext(LoungeContext);
  if (!context) {
    throw new Error('useLounge must be used within a LoungeProvider');
  }
  return context;
};

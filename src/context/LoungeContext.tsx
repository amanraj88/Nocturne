import React, { createContext, useContext, useState, useEffect } from 'react';
import { Room, Track, UserProfile, ChatMessage, ReactionBurst, GraphicsQuality } from '@/types';
import { FEATURED_ROOMS, INITIAL_TRACKS, INITIAL_USERS, INITIAL_CHAT } from '@/lib/mockData';

interface LoungeContextType {
  currentRoom: Room;
  queue: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  progressSeconds: number;
  durationSeconds: number;
  volume: number;
  isMuted: boolean;
  driftMs: number;
  quality: GraphicsQuality;
  members: UserProfile[];
  chatMessages: ChatMessage[];
  reactions: ReactionBurst[];
  isSearchOpen: boolean;
  isCreateRoomOpen: boolean;
  // Actions
  setQuality: (q: GraphicsQuality) => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  skipTrack: () => void;
  previousTrack: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  voteSkip: (trackId: string) => void;
  addTrackToQueue: (track: Partial<Track>) => void;
  removeTrack: (trackId: string) => void;
  sendChatMessage: (text: string) => void;
  triggerReaction: (emoji: string) => void;
  switchRoom: (roomId: string) => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsCreateRoomOpen: (open: boolean) => void;
}

const LoungeContext = createContext<LoungeContextType | undefined>(undefined);

export const LoungeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState<Room>(FEATURED_ROOMS[0]);
  const [queue, setQueue] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressSeconds, setProgressSeconds] = useState(74);
  const [volume, setVolumeState] = useState(82);
  const [isMuted, setIsMuted] = useState(false);
  const [driftMs, setDriftMs] = useState(14);
  const [quality, setQualityState] = useState<GraphicsQuality>('high');
  const [members] = useState<UserProfile[]>(INITIAL_USERS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [reactions, setReactions] = useState<ReactionBurst[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);

  const currentTrack = queue[currentTrackIndex] || queue[0];
  const durationSeconds = currentTrack ? currentTrack.durationSeconds : 284;

  // Track progress ticker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgressSeconds((prev) => {
        if (prev >= durationSeconds) {
          // auto advance
          setCurrentTrackIndex((idx) => (idx + 1) % queue.length);
          return 0;
        }
        return prev + 1;
      });

      // simulate tiny realistic network sync jitter (10-25ms)
      setDriftMs(Math.floor(12 + Math.random() * 12));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, durationSeconds, queue.length]);

  // Sync quality to document attribute for CSS switches
  const setQuality = (q: GraphicsQuality) => {
    setQualityState(q);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-quality', q);
    }
  };

  const togglePlay = () => setIsPlaying((p) => !p);

  const seekTo = (seconds: number) => {
    setProgressSeconds(Math.max(0, Math.min(seconds, durationSeconds)));
  };

  const skipTrack = () => {
    setCurrentTrackIndex((idx) => (idx + 1) % queue.length);
    setProgressSeconds(0);
  };

  const previousTrack = () => {
    if (progressSeconds > 4) {
      setProgressSeconds(0);
    } else {
      setCurrentTrackIndex((idx) => (idx - 1 + queue.length) % queue.length);
      setProgressSeconds(0);
    }
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (v > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted((m) => !m);

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
  };

  const addTrackToQueue = (trackPartial: Partial<Track>) => {
    const newTrack: Track = {
      id: `tr-${Date.now()}`,
      youtubeId: trackPartial.youtubeId || 'dQw4w9WgXcQ',
      title: trackPartial.title || 'Untitled Track',
      artist: trackPartial.artist || 'Curated Artist',
      albumArt: trackPartial.albumArt || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=85',
      durationSeconds: trackPartial.durationSeconds || 240,
      addedBy: {
        id: 'u-me',
        name: 'You (Listener)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      },
      addedAt: 'Just now',
      upvotes: 1,
      skipVotes: 0,
    };
    setQueue((prev) => [...prev, newTrack]);
    sendChatMessage(`Queued "${newTrack.title}" by ${newTrack.artist}`);
  };

  const removeTrack = (trackId: string) => {
    setQueue((prev) => prev.filter((t) => t.id !== trackId));
  };

  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;
    const newMsg: ChatMessage = {
      id: `c-${Date.now()}`,
      user: {
        id: 'u-me',
        name: 'You',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        role: 'collaborator',
        isListening: true,
        joinedAt: 'Just now',
      },
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const triggerReaction = (emoji: string) => {
    const burst: ReactionBurst = {
      id: `r-${Date.now()}-${Math.random()}`,
      emoji,
      userName: 'You',
      x: Math.floor(Math.random() * 80) + 10,
    };
    setReactions((prev) => [...prev.slice(-15), burst]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== burst.id));
    }, 2500);
  };

  const switchRoom = (roomId: string) => {
    const found = FEATURED_ROOMS.find((r) => r.id === roomId);
    if (found) {
      setCurrentRoom(found);
      setProgressSeconds(15);
    }
  };

  return (
    <LoungeContext.Provider
      value={{
        currentRoom,
        queue,
        currentTrack,
        isPlaying,
        progressSeconds,
        durationSeconds,
        volume,
        isMuted,
        driftMs,
        quality,
        members,
        chatMessages,
        reactions,
        isSearchOpen,
        isCreateRoomOpen,
        setQuality,
        togglePlay,
        seekTo,
        skipTrack,
        previousTrack,
        setVolume,
        toggleMute,
        voteSkip,
        addTrackToQueue,
        removeTrack,
        sendChatMessage,
        triggerReaction,
        switchRoom,
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

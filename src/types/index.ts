export type GraphicsQuality = 'high' | 'low' | 'off';

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  role: 'host' | 'collaborator' | 'listener';
  isListening: boolean;
  joinedAt: string;
}

export type TrackSourceType = 'local' | 'shared-audio' | 'youtube' | 'fixture' | 'specimen';

export interface Track {
  id: string;
  sourceType?: TrackSourceType;
  youtubeId?: string;
  title: string;
  artist: string;
  albumArt: string;
  artworkId?: 'noc-01' | 'noc-02' | 'noc-03';
  artworkUrl?: string;
  durationSeconds: number;
  audioUrl?: string;
  storagePath?: string;
  isLocalFile?: boolean;
  fileName?: string;
  fileSize?: string;
  isTestFixture?: boolean;
  addedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  addedAt: string;
  upvotes: number;
  skipVotes: number;
  userVotedSkip?: boolean;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface Room {
  id: string;
  slug: string;
  title: string;
  vibeTag: string;
  description: string;
  host: UserProfile;
  listenerCount: number;
  isPrivate: boolean;
  isFeatured?: boolean;
  mode: 'collaborative' | 'host-curated';
  currentTrackId: string;
  artworkId?: 'noc-01' | 'noc-02' | 'noc-03';
  artworkUrl?: string;
  ambientColor: string;
  accentColor: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  progressSeconds: number;
  durationSeconds: number;
  volume: number;
  isMuted: boolean;
  revision: number;
  quality: GraphicsQuality;
}

export interface ChatMessage {
  id: string;
  user: UserProfile;
  text: string;
  timestamp: string;
  createdAt?: string;
  isSystem?: boolean;
  reactionEmoji?: string;
}

export interface ReactionBurst {
  id: string;
  emoji: string;
  userName: string;
  x: number;
}

export type GraphicsQuality = 'high' | 'low' | 'off';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'collaborator' | 'listener';
  isListening: boolean;
  joinedAt: string;
}

export interface Track {
  id: string;
  youtubeId: string;
  title: string;
  artist: string;
  albumArt: string;
  artworkId?: 'noc-01' | 'noc-02' | 'noc-03';
  durationSeconds: number;
  addedBy: {
    id: string;
    name: string;
    avatar: string;
  };
  addedAt: string;
  upvotes: number;
  skipVotes: number;
  userVotedSkip?: boolean;
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
  mode: 'collaborative' | 'host-curated';
  currentTrackId: string;
  artworkId?: 'noc-01' | 'noc-02' | 'noc-03';
  ambientColor: string;
  accentColor: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  progressSeconds: number;
  durationSeconds: number;
  volume: number;
  isMuted: boolean;
  driftMs: number;
  revision: number;
  quality: GraphicsQuality;
}

export interface ChatMessage {
  id: string;
  user: UserProfile;
  text: string;
  timestamp: string;
  isSystem?: boolean;
  reactionEmoji?: string;
}

export interface ReactionBurst {
  id: string;
  emoji: string;
  userName: string;
  x: number;
}

import { Room, Track, UserProfile, ChatMessage } from '@/types';

const NOCTURNE_CURATOR: UserProfile = {
  id: 'nocturne-editorial',
  name: 'NOCTURNE',
  role: 'host',
  isListening: false,
  joinedAt: '',
};

// Featured room shells are editorial starting points, not claims about live activity.
export const INITIAL_USERS: UserProfile[] = [];
export const INITIAL_TRACKS: Track[] = [];
export const INITIAL_CHAT: ChatMessage[] = [];

export const FEATURED_ROOMS: Room[] = [
  {
    id: 'room-tokyo-afterhours',
    slug: 'tokyo-afterhours',
    title: 'Shibuya Midnight Reverie',
    vibeTag: 'Deep IDM & Minimal Synth',
    description: 'Analog synthesizers, tape saturation, and ambient dusk textures from Tokyo.',
    host: NOCTURNE_CURATOR,
    listenerCount: 0,
    isPrivate: false,
    mode: 'collaborative',
    currentTrackId: '',
    artworkId: 'noc-01',
    ambientColor: '#A0B7A8',
    accentColor: '#A0B7A8',
  },
  {
    id: 'room-nordic-solitude',
    slug: 'nordic-solitude',
    title: 'Reykjavik Obsidian Echoes',
    vibeTag: 'Neoclassical & Glitch',
    description: 'Sub-bass drones, felted piano pedals, and glacial strings for deep focus.',
    host: NOCTURNE_CURATOR,
    listenerCount: 0,
    isPrivate: false,
    mode: 'collaborative',
    currentTrackId: '',
    artworkId: 'noc-02',
    ambientColor: '#E8E4D9',
    accentColor: '#E8E4D9',
  },
  {
    id: 'room-berlin-basement',
    slug: 'berlin-basement',
    title: 'Kreuzberg Concrete Velvet',
    vibeTag: 'Dub Techno & Modular',
    description: '4AM warehouse warmth, Roland 909 kicks, and hypnotic chord stabs.',
    host: NOCTURNE_CURATOR,
    listenerCount: 0,
    isPrivate: false,
    mode: 'collaborative',
    currentTrackId: '',
    artworkId: 'noc-03',
    ambientColor: '#A65D45',
    accentColor: '#A65D45',
  },
];

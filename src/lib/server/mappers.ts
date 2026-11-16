import { Room, Track, ChatMessage } from '@/types';
import { RoomPlaybackState } from './rooms';
import { formatRoomTitle } from '@/lib/utils';

/**
 * Transforms a Supabase PostgreSQL rooms row into a NOCTURNE Room object.
 */
export function mapDbRoomToRoom(row: any, listenerCount = 0): Room {
  const isEditorial =
    ['tokyo-afterhours', 'ambient-drift', 'cyber-lounge'].includes(row.slug) ||
    ['room-tokyo-afterhours', 'room-ambient-drift', 'room-cyber-lounge'].includes(row.id) ||
    Boolean(row.is_featured);

  return {
    id: row.id,
    slug: row.slug,
    title: formatRoomTitle(row.title, row.slug || row.id),
    vibeTag: row.vibe_tag || 'Ambient & Modular',
    description: row.description || '',
    artworkId: row.artwork_id || 'noc-01',
    ambientColor: row.ambient_color || '#A0B7A8',
    accentColor: row.accent_color || '#A0B7A8',
    mode: 'collaborative',
    isPrivate: Boolean(row.is_private),
    isFeatured: isEditorial,
    listenerCount,
    currentTrackId: '',
    host: {
      id: row.host_id || 'nocturne-editorial',
      name: row.host_name || 'NOCTURNE',
      role: 'host',
      isListening: true,
      joinedAt: row.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Earlier',
    },
  };
}

/**
 * Transforms a Supabase PostgreSQL tracks row into a NOCTURNE Track object.
 */
export function mapDbTrackToTrack(row: any): Track {
  return {
    id: row.id,
    sourceType: row.source_type,
    youtubeId: row.youtube_id || undefined,
    title: row.title,
    artist: row.artist,
    albumArt: row.album_art || `/artwork/${row.artwork_id || 'noc-01'}.svg`,
    artworkId: row.artwork_id || 'noc-01',
    durationSeconds: Number(row.duration_seconds) || 0,
    audioUrl: row.audio_url || undefined,
    storagePath: row.storage_path || undefined,
    fileName: row.file_name || undefined,
    addedBy: {
      id: row.added_by_id || 'guest',
      name: row.added_by_name || 'Listener',
    },
    addedAt: row.added_at ? new Date(row.added_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
    upvotes: Number(row.upvotes) || 0,
    skipVotes: Number(row.skip_votes) || 0,
  };
}

/**
 * Transforms a Supabase PostgreSQL room_playback row into a RoomPlaybackState object.
 */
export function mapDbPlaybackToPlayback(row: any): RoomPlaybackState {
  if (!row) {
    return {
      currentTrackId: '',
      isPlaying: false,
      progressSeconds: 0,
      lastUpdatedTimestamp: Date.now(),
      sourceType: 'specimen',
    };
  }

  const updatedAtMs = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
  return {
    currentTrackId: row.current_track_id || '',
    isPlaying: Boolean(row.is_playing),
    progressSeconds: Number(row.progress_seconds) || 0,
    lastUpdatedTimestamp: updatedAtMs,
    updatedAt: row.updated_at || new Date().toISOString(),
    sourceType: row.source_type || 'specimen',
  };
}

/**
 * Transforms a Supabase PostgreSQL chat_messages row into a NOCTURNE ChatMessage object.
 */
export function mapDbChatToChat(row: any): ChatMessage {
  const rawTime = row.created_at || new Date().toISOString();
  return {
    id: row.id,
    user: {
      id: row.user_id || 'listener',
      name: row.user_name || 'Anonymous',
      role: row.user_role || 'listener',
      isListening: true,
      joinedAt: '',
    },
    text: row.text,
    timestamp: rawTime,
    createdAt: rawTime,
    isSystem: Boolean(row.is_system),
  };
}

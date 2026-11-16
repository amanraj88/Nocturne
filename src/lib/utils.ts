import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function parseIso8601Duration(durationStr: string): number {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  const trimmed = durationStr.trim();
  const regex = /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i;
  const match = trimmed.match(regex);
  if (!match) return 0;

  const days = parseFloat(match[1] || '0');
  const hours = parseFloat(match[2] || '0');
  const minutes = parseFloat(match[3] || '0');
  const seconds = parseFloat(match[4] || '0');

  return Math.round(days * 86400 + hours * 3600 + minutes * 60 + seconds);
}

export function formatNumberCompact(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

export function formatLocalTime(input?: string | number | Date): string {
  if (!input) return 'Just now';
  if (typeof input === 'string') {
    const trimmed = input.trim();
    // If it's an ISO or Postgres date string
    if (trimmed.includes('-') || trimmed.includes('T') || (trimmed.includes(':') && trimmed.length > 8)) {
      const normalized = !/[Z+\-]\d*$/i.test(trimmed)
        ? `${trimmed.replace(' ', 'T')}Z`
        : trimmed;
      const d = new Date(normalized);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      }
    }
    // If it's already a short formatted time string (e.g. "10:08 PM")
    if (/^\d{1,2}:\d{2}/.test(trimmed)) {
      return trimmed;
    }
  }
  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return String(input);
}

export function parseYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Direct 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  // Standard watch, embed, shorts, live, youtu.be, music.youtube.com
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|(?:embed|v|shorts|live)\/))([a-zA-Z0-9_-]{11})/i
  );
  if (match) return match[1];

  // Secondary match for query parameter v= anywhere
  const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
  if (vMatch) return vMatch[1];

  return null;
}

/**
 * Maps legacy synthetic/two-adjective seeded room titles to clean, natural display names.
 */
export function formatRoomTitle(title?: string, slug?: string, id?: string): string {
  const t = title?.trim() || '';
  const s = `${slug || ''} ${id || ''}`.toLowerCase();
  if (s.includes('tokyo-afterhours') || t === 'Shibuya Midnight Reverie') {
    return 'Tokyo Afterhours';
  }
  if (s.includes('reykjavik-ambient') || t === 'Reykjavik Obsidian Echoes') {
    return 'Reykjavik Ambient';
  }
  if (s.includes('berlin-dub') || t === 'Kreuzberg Concrete Velvet') {
    return 'Berlin Dub';
  }
  return t || 'Untitled Room';
}

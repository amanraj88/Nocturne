import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { Room } from '@/types';
import { STARTER_TAPES, StarterTape, TapeMood } from '@/data/starterTapes';
import { formatRoomTitle } from '@/lib/utils';
import { Disc, Users, Loader2, Radio } from 'lucide-react';

const CATEGORIES: Array<'All Rooms' | TapeMood> = [
  'All Rooms',
  'Late Night',
  'Deep Focus',
  'Electronic',
  'Ambient',
];

const getLiveRoomCover = (room: Room): string | null => {
  const current = (room as any).currentTrack;
  if (current?.thumbnailUrl) return current.thumbnailUrl;
  if (current?.albumArt) return current.albumArt;
  if (current?.youtubeId) return `https://i.ytimg.com/vi/${current.youtubeId}/hqdefault.jpg`;

  const firstQueue = (room as any).queue?.[0];
  if (firstQueue?.thumbnailUrl) return firstQueue.thumbnailUrl;
  if (firstQueue?.albumArt) return firstQueue.albumArt;
  if (firstQueue?.youtubeId) return `https://i.ytimg.com/vi/${firstQueue.youtubeId}/hqdefault.jpg`;

  const matchingTape = STARTER_TAPES.find(
    (t) =>
      t.title.trim().toLowerCase() === room.title?.trim().toLowerCase() ||
      t.id === room.slug ||
      t.id === room.id
  );
  if (matchingTape?.tracks?.[0]?.thumbnailUrl) {
    return matchingTape.tracks[0].thumbnailUrl;
  }
  if (matchingTape?.tracks?.[0]?.youtubeId) {
    return `https://i.ytimg.com/vi/${matchingTape.tracks[0].youtubeId}/hqdefault.jpg`;
  }

  const slug = (room.slug || room.id || '').toLowerCase();
  if (slug.includes('tokyo-afterhours') || slug.includes('shibuya')) {
    return 'https://i.ytimg.com/vi/A7ZxRs45tTg/hqdefault.jpg';
  }
  if (slug.includes('reykjavik-ambient') || slug.includes('reykjavik')) {
    return 'https://i.ytimg.com/vi/4y33h81phKU/hqdefault.jpg';
  }
  if (slug.includes('berlin-dub') || slug.includes('kreuzberg')) {
    return 'https://i.ytimg.com/vi/V-_O7nl0Ii0/hqdefault.jpg';
  }

  return null;
};

export const LiveLoungesGrid: React.FC = () => {
  const router = useRouter();
  const { rooms, launchStarterTape } = useLounge();
  const [activeCategory, setActiveCategory] = useState<'All Rooms' | TapeMood>('All Rooms');
  const [launchingTapeId, setLaunchingTapeId] = useState<string | null>(null);

  // Filter only genuine, active user rooms
  const activeRooms = rooms.filter((r) => !r.isFeatured && r.id);
  const spotlightRoomId = activeRooms.length > 0 ? activeRooms[0].id : null;

  const filteredLiveRooms = activeRooms
    .filter((room) => !spotlightRoomId || room.id !== spotlightRoomId)
    .filter((room) => {
      if (activeCategory === 'All Rooms') return true;
      const cat = activeCategory.toLowerCase();
      return (
        room.vibeTag.toLowerCase().includes(cat) ||
        room.title.toLowerCase().includes(cat) ||
        room.description.toLowerCase().includes(cat)
      );
    });

  // Filter out any Starter Tape whose title already matches an active Live Room,
  // or that is currently featured in the Hero spotlight when no live user rooms are active
  const filteredTapes = STARTER_TAPES.filter((tape) => {
    const isAlreadyLive = activeRooms.some(
      (r) => r.title.trim().toLowerCase() === tape.title.trim().toLowerCase()
    );
    if (isAlreadyLive) return false;

    // Exclude the Hero spotlight tape (After Hours Electronic) when no live user rooms are active
    if (activeRooms.length === 0 && tape.id === 'after-hours-electronic') {
      return false;
    }

    if (activeCategory === 'All Rooms') return true;
    return tape.mood === activeCategory;
  });

  const handleLaunchTape = async (tape: StarterTape) => {
    if (launchingTapeId) return;
    setLaunchingTapeId(tape.id);
    try {
      const room = await launchStarterTape(tape);
      if (room?.slug) {
        void router.push(`/room/${room.slug}`);
      }
    } catch (err) {
      console.error('Failed to launch starter tape:', err);
    } finally {
      setLaunchingTapeId(null);
    }
  };

  return (
    <section id="explore" className="w-full max-w-[1280px] max-w-full min-w-0 mx-auto px-4 sm:px-6 py-8">
      {/* Header & Filter Chips Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[var(--border-subtle)] w-full max-w-full min-w-0">
        <div>
          <h2 className="font-syne font-bold text-xl text-[var(--text-primary)]">
            Rooms
          </h2>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 w-full max-w-full min-w-0 overflow-x-auto pb-2 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[var(--bg-thumb)] border border-[#8B5CF6]/40 text-[var(--text-primary)]'
                    : 'bg-[var(--bg-recessed)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-Column Responsive Card Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-full min-w-0">
        {/* 1. Live Rooms (if any match category) */}
        {filteredLiveRooms.map((room) => {
          const coverUrl = getLiveRoomCover(room);

          return (
            <article
              key={room.id}
              className="w-full max-w-full min-w-0 overflow-hidden box-border rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-4 flex flex-col justify-between hover:border-[#8B5CF6]/40 transition-colors shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between min-w-0 gap-2">
                  {room.listenerCount > 0 ? (
                    <span className="text-[11px] font-medium text-[#10B981] flex items-center gap-1.5 font-mono shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      LIVE · {room.listenerCount} listening
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-[var(--text-muted)] font-mono shrink-0">
                      Featured
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-recessed)] text-[var(--text-muted)] border border-[var(--border-subtle)] shrink-0">
                    {room.vibeTag || 'Live Room'}
                  </span>
                </div>

                <div className="mt-3.5 flex items-center gap-3.5 min-w-0 w-full overflow-hidden">
                  {/* Tactile Vinyl Sleeve Preview */}
                  <div className="relative w-[72px] h-[72px] shrink-0">
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#0E0E13] border border-[#2D2945] flex items-center justify-center shadow-md">
                      <div className="w-5 h-5 rounded-full border border-[#8B5CF6]/40 bg-[#181624] flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-[#0E0E13]" />
                      </div>
                    </div>
                    <div className="relative w-[72px] h-[72px] rounded-lg overflow-hidden bg-[#181624] border border-[var(--border-subtle)] shadow-md">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={formatRoomTitle(room.title, room.slug, room.id)}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                            }
                          }}
                          className="w-full h-full object-cover scale-[1.35]"
                        />
                      ) : null}
                      <div
                        style={{ display: coverUrl ? 'none' : 'block' }}
                        className="w-full h-full bg-[#0E0E13] flex items-center justify-center"
                      >
                        <svg viewBox="0 0 100 100" className="w-full h-full p-1">
                          <circle cx="50" cy="50" r="48" fill="#0E0E13" stroke="#2D2945" strokeWidth="2" />
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#1A1829" strokeWidth="1" />
                          <circle cx="50" cy="50" r="28" fill="none" stroke="#1A1829" strokeWidth="1" />
                          <circle cx="50" cy="50" r="18" fill="#181624" stroke="#8B5CF6" strokeWidth="1.5" />
                          <circle cx="50" cy="50" r="4" fill="#0E0E13" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="font-syne font-bold text-sm text-[var(--text-primary)] truncate">
                      {formatRoomTitle(room.title, room.slug, room.id)}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                      Hosted by {room.host?.name || 'Curator'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 min-w-0">
                <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 shrink-0">
                  <Users className="w-3 h-3" />
                  <span>
                    {room.listenerCount > 0
                      ? `${room.listenerCount} listening`
                      : 'Ready to play'}
                  </span>
                </span>
                <Link
                  href={`/room/${room.slug}`}
                  className="h-8 px-3.5 rounded-md dark:bg-white/[0.07] dark:hover:bg-white/[0.13] dark:border-white/15 dark:hover:border-white/25 dark:text-white bg-black/[0.05] hover:bg-black/[0.09] border border-black/15 text-neutral-900 active:scale-[0.98] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all font-medium text-xs flex items-center justify-center shrink-0"
                >
                  Open Room
                </Link>
              </div>
            </article>
          );
        })}

        {/* 2. Curated Starter Tapes (Deduplicated) */}
        {filteredTapes.map((tape) => {
          const isThisTapeLaunching = launchingTapeId === tape.id;
          const coverTrack = tape.tracks[0];

          return (
            <article
              key={tape.id}
              className="w-full max-w-full min-w-0 overflow-hidden box-border rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-4 flex flex-col justify-between hover:border-[#8B5CF6]/40 transition-colors shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between min-w-0 gap-2">
                  <span className="text-[11px] text-[var(--text-muted)] font-mono truncate flex-1 min-w-0">
                    1. {tape.tracks[0]?.title} · 2. {tape.tracks[1]?.title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-recessed)] text-[var(--text-muted)] border border-[var(--border-subtle)] shrink-0">
                    {tape.mood}
                  </span>
                </div>

                <div className="mt-3.5 flex items-center gap-3.5 min-w-0 w-full overflow-hidden">
                  {/* Tactile Vinyl Sleeve Preview */}
                  <div className="relative w-[72px] h-[72px] shrink-0">
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#0E0E13] border border-[#2D2945] flex items-center justify-center shadow-md">
                      <div className="w-5 h-5 rounded-full border border-[#8B5CF6]/40 bg-[#181624] flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-[#0E0E13]" />
                      </div>
                    </div>
                    <div className="relative w-[72px] h-[72px] rounded-lg overflow-hidden bg-[#181624] border border-[var(--border-subtle)] shadow-md">
                      <img
                        src={coverTrack?.thumbnailUrl || 'https://i.ytimg.com/vi/A7ZxRs45tTg/hqdefault.jpg'}
                        alt={tape.title}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80';
                        }}
                        className="w-full h-full object-cover scale-[1.35]"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="font-syne font-bold text-sm text-[var(--text-primary)] truncate">
                      {tape.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                      {tape.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 min-w-0">
                <span className="text-[11px] text-[var(--text-muted)] truncate min-w-0 font-mono">
                  {tape.tracks.length} tracks · {tape.totalDurationLabel?.match(/\d+m/)?.[0] || '35m'}
                </span>
                <button
                  type="button"
                  onClick={() => handleLaunchTape(tape)}
                  disabled={Boolean(launchingTapeId)}
                  className="h-8 px-3.5 rounded-md dark:bg-white/[0.07] dark:hover:bg-white/[0.13] dark:border-white/15 dark:hover:border-white/25 dark:text-white bg-black/[0.05] hover:bg-black/[0.09] border border-black/15 text-neutral-900 active:scale-[0.98] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all font-medium text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                >
                  {isThisTapeLaunching ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-[#8B5CF6]" />
                      <span>Opening...</span>
                    </>
                  ) : (
                    <span>Open Room</span>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

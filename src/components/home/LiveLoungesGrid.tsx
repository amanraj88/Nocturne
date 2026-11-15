import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { Room } from '@/types';
import { STARTER_TAPES, StarterTape, TapeMood } from '@/data/starterTapes';
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

  const firstQueue = (room as any).queue?.[0];
  if (firstQueue?.thumbnailUrl) return firstQueue.thumbnailUrl;
  if (firstQueue?.albumArt) return firstQueue.albumArt;

  const matchingTape = STARTER_TAPES.find(
    (t) => t.title.trim().toLowerCase() === room.title?.trim().toLowerCase()
  );
  if (matchingTape?.tracks?.[0]?.thumbnailUrl) {
    return matchingTape.tracks[0].thumbnailUrl;
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

  const filteredLiveRooms = activeRooms.filter((room) => {
    if (activeCategory === 'All Rooms') return true;
    const cat = activeCategory.toLowerCase();
    return (
      room.vibeTag.toLowerCase().includes(cat) ||
      room.title.toLowerCase().includes(cat) ||
      room.description.toLowerCase().includes(cat)
    );
  });

  // Filter out any Starter Tape whose title already matches an active Live Room
  const filteredTapes = STARTER_TAPES.filter((tape) => {
    const isAlreadyLive = activeRooms.some(
      (r) => r.title.trim().toLowerCase() === tape.title.trim().toLowerCase()
    );
    if (isAlreadyLive) return false;

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
    <section id="explore" className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
      {/* Header & Filter Chips Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="font-syne font-bold text-xl text-[var(--text-primary)]">
            Live Rooms & Starter Tapes
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)]">
            Active communal sessions and one-click launchable collections.
          </p>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
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

      {/* Honest active rooms status notice if no rooms are currently live */}
      {activeRooms.length === 0 && (
        <div className="mt-4 px-3.5 py-2 rounded-lg bg-[var(--bg-recessed)] border border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>No Public Lounges Live right now. Launch any curated tape below to start listening.</span>
          </div>
        </div>
      )}

      {/* 3-Column Responsive Card Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Live Rooms (if any match category) */}
        {filteredLiveRooms.map((room) => {
          const coverUrl = getLiveRoomCover(room);

          return (
            <article
              key={room.id}
              className="rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-4 flex flex-col justify-between hover:border-[#8B5CF6]/40 transition-colors shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#10B981] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    LIVE · {room.listenerCount} listening
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-recessed)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                    {room.vibeTag || 'Live Room'}
                  </span>
                </div>

                <div className="mt-3.5 flex items-center gap-3.5">
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
                          alt={room.title}
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

                  <div className="flex-1 min-w-0">
                    <h3 className="font-syne font-bold text-sm text-[var(--text-primary)] truncate">
                      {room.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                      Hosted by {room.host?.name || 'Curator'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{room.listenerCount} in room</span>
                </span>
                <Link
                  href={`/room/${room.slug}`}
                  className="h-8 px-3.5 rounded-md bg-[#111115] text-white dark:bg-[#F4F4F6] dark:text-[#111115] hover:opacity-90 font-medium text-xs flex items-center justify-center transition-opacity"
                >
                  Tune In →
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
              className="rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-4 flex flex-col justify-between hover:border-[#8B5CF6]/40 transition-colors shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#8B5CF6] flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5 shrink-0" />
                    STARTER TAPE · {tape.tracks.length} tracks
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-recessed)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                    {tape.mood}
                  </span>
                </div>

                <div className="mt-3.5 flex items-center gap-3.5">
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

                  <div className="flex-1 min-w-0">
                    <h3 className="font-syne font-bold text-sm text-[var(--text-primary)] truncate">
                      {tape.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                      {tape.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                <span className="text-[11px] text-[var(--text-muted)]">
                  {tape.totalDurationLabel}
                </span>
                <button
                  type="button"
                  onClick={() => handleLaunchTape(tape)}
                  disabled={Boolean(launchingTapeId)}
                  className="h-8 px-3.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/40 text-[var(--text-primary)] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isThisTapeLaunching ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-[#8B5CF6]" />
                      <span>Launching...</span>
                    </>
                  ) : (
                    <span>▶ Launch Room</span>
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

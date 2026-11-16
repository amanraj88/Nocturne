import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { Room } from '@/types';
import { STARTER_TAPES } from '@/data/starterTapes';
import { formatRoomTitle } from '@/lib/utils';
import { Plus, Disc, Loader2, ArrowRight } from 'lucide-react';

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

export const HeroSection: React.FC = () => {
  const router = useRouter();
  const { currentRoom, rooms, setIsCreateRoomOpen, launchStarterTape } = useLounge();
  const [isMounted, setIsMounted] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter active user-created rooms
  const activeLounges = rooms.filter((r) => !r.isFeatured && r.id);
  const spotlightRoom = activeLounges.length > 0 ? activeLounges[0] : null;
  const defaultTape = STARTER_TAPES[0];

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInput.trim()) return;
    let slug = joinInput.trim();
    if (slug.includes('/room/')) {
      slug = slug.split('/room/').pop()?.split('?')[0].split('#')[0] || '';
    } else if (slug.includes('/')) {
      slug = slug.split('/').filter(Boolean).pop()?.split('?')[0].split('#')[0] || '';
    }
    if (slug) {
      void router.push(`/room/${encodeURIComponent(slug)}`);
    }
  };

  const handleLaunchTape = async () => {
    if (isLaunching) return;
    setIsLaunching(true);
    try {
      const room = await launchStarterTape(defaultTape);
      if (room?.slug) {
        void router.push(`/room/${room.slug}`);
      }
    } catch (err) {
      console.error('Failed to launch starter tape:', err);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-10">
      <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12">
        {/* ============================================================== */}
        {/* Left Zone (lg:w-[58%] flex flex-col justify-center)            */}
        {/* ============================================================== */}
        <div className="lg:w-[58%] flex flex-col justify-center">
          <h1 className="font-syne font-bold text-3xl sm:text-5xl tracking-[-0.02em] text-[var(--text-primary)] leading-[1.15]">
            Listen to YouTube together, in real time.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[var(--text-muted)] max-w-xl leading-relaxed">
            Start a room, paste any YouTube link or playlist into the queue, and everyone hears the exact same second.
          </p>

          {/* Action Row: Stack full-width on mobile (< sm), inline on desktop */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Primary Coral Button (Full-width on mobile, auto on desktop) */}
            <button
              type="button"
              onClick={() => setIsCreateRoomOpen(true)}
              className="h-11 px-5 w-full sm:w-auto rounded-lg bg-[#F43F5E] hover:bg-[#E11D48] text-white font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors shrink-0 shadow-none active:translate-y-px"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Start a Room</span>
            </button>

            {/* Recessed Inline Join Capsule */}
            <form
              onSubmit={handleJoinSubmit}
              className="h-11 max-sm:h-12 w-full max-sm:w-full sm:flex-1 sm:max-w-md rounded-lg bg-[var(--bg-recessed)] border border-[var(--border-subtle)] focus-within:border-[#8B5CF6]/50 p-1.5 max-sm:p-1.5 pl-3 flex items-center gap-2 transition-colors"
            >
              <input
                type="text"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                placeholder="Paste room link or code"
                className="flex-1 min-w-0 !bg-transparent bg-transparent border-0 shadow-none outline-none focus:ring-0 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] p-0"
              />
              <button
                type="submit"
                className="h-8 px-3.5 rounded-md bg-[var(--bg-elevated)] hover:bg-[#8B5CF6] text-[var(--text-primary)] hover:text-white text-xs font-medium transition-colors shrink-0"
              >
                Join
              </button>
            </form>
          </div>

          {/* Active room resume link if user previously joined a room */}
          {isMounted && currentRoom?.slug && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">Currently participating in:</span>
              <Link
                href={`/room/${currentRoom.slug}`}
                className="text-xs font-medium text-[#8B5CF6] hover:underline inline-flex items-center gap-1"
              >
                <span>{formatRoomTitle(currentRoom.title, currentRoom.slug, currentRoom.id) || currentRoom.slug}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* Right Zone (lg:w-[42%]) — Featured Session Spotlight Card     */}
        {/* ============================================================== */}
        <div className="hidden lg:flex lg:w-[42%] items-center">
          <div className="w-full rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-5 shadow-sm transition-colors">
            {isMounted && spotlightRoom ? (() => {
              const room = spotlightRoom;
              const coverUrl = getLiveRoomCover(room);

              return (
                /* Live Room Spotlight */
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    {room.listenerCount > 0 ? (
                      <span className="text-[11px] font-medium text-[#10B981] flex items-center gap-1.5 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        LIVE · {room.listenerCount} listening
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-[var(--text-muted)] font-mono">
                        Featured
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--bg-recessed)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                      {room.vibeTag || 'Live Room'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Vinyl Sleeve Preview */}
                    <div className="relative w-20 h-20 shrink-0">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#0E0E13] border border-[#2D2945] flex items-center justify-center shadow-md">
                        <div className="w-6 h-6 rounded-full border border-[#8B5CF6]/40 bg-[#181624] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0E0E13]" />
                        </div>
                      </div>
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#181624] border border-[var(--border-subtle)] shadow-md">
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

                    <div className="flex-1 min-w-0">
                      <h3 className="font-syne font-bold text-base text-[var(--text-primary)] truncate">
                        {formatRoomTitle(room.title, room.slug, room.id)}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
                        Hosted by {room.host?.name || 'Curator'}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/room/${room.slug}`}
                    className="w-full h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/40 text-[var(--text-primary)] font-medium text-xs sm:text-sm flex items-center justify-center transition-colors"
                  >
                    <span>Open Room</span>
                  </Link>
                </div>
              );
            })() : (
              /* Starter Tape #1 Spotlight (when 0 active live rooms) */
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#8B5CF6] flex items-center gap-1.5 font-mono">
                    <Disc className="w-3.5 h-3.5 shrink-0" />
                    {defaultTape.tracks.length} tracks · {defaultTape.totalDurationLabel?.match(/\d+m/)?.[0] || '38m'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--bg-recessed)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                    {defaultTape.mood}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Vinyl Sleeve Preview */}
                  <div className="relative w-20 h-20 shrink-0">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#0E0E13] border border-[#2D2945] flex items-center justify-center shadow-md">
                      <div className="w-6 h-6 rounded-full border border-[#8B5CF6]/40 bg-[#181624] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0E0E13]" />
                      </div>
                    </div>
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#181624] border border-[var(--border-subtle)] shadow-md">
                      <img
                        src={defaultTape.tracks[0]?.thumbnailUrl || 'https://i.ytimg.com/vi/A7ZxRs45tTg/hqdefault.jpg'}
                        alt={defaultTape.title}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80';
                        }}
                        className="w-full h-full object-cover scale-[1.35]"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-syne font-bold text-base text-[var(--text-primary)] truncate">
                      {defaultTape.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
                      {defaultTape.subtitle}
                    </p>
                  </div>
                </div>

                {/* 3-track preview list */}
                <div className="space-y-1 py-1 text-xs text-[var(--text-muted)] font-mono border-t border-[var(--border-subtle)]/60">
                  {defaultTape.tracks.slice(0, 3).map((t, idx) => (
                    <div key={idx} className="truncate">
                      {idx + 1}. {t.title} — {t.artist}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleLaunchTape}
                  disabled={isLaunching}
                  className="w-full h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/40 text-[var(--text-primary)] font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isLaunching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8B5CF6]" />
                      <span>Creating Room...</span>
                    </>
                  ) : (
                    <span>Open Room</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

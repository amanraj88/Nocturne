import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { Room } from '@/types';
import { STARTER_TAPES, StarterTape } from '@/data/starterTapes';
import { Search, Disc, RefreshCw, AlertCircle, Loader2, Users } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

const CATEGORIES = [
  'All Lounges',
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

export default function RoomsPage() {
  const router = useRouter();
  const { setIsCreateRoomOpen, launchStarterTape } = useLounge();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Lounges');
  const [launchingTapeId, setLaunchingTapeId] = useState<string | null>(null);

  // router.replace fallback handler if needed
  const handleExitToHome = () => {
    void router.replace('/');
  };

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rooms');
      if (!res.ok) {
        throw new Error('Failed to load active listening lounges.');
      }
      const data = await res.json();
      if (Array.isArray(data.rooms)) {
        setRooms(data.rooms);
      } else {
        setRooms([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to room directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter((room) => {
    // 1. Category filter
    if (activeCategory !== 'All Lounges') {
      const cat = activeCategory.toLowerCase();
      const matchesCategory =
        room.vibeTag?.toLowerCase().includes(cat) ||
        room.title?.toLowerCase().includes(cat) ||
        room.description?.toLowerCase().includes(cat);
      if (!matchesCategory) return false;
    }

    // 2. Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      room.title?.toLowerCase().includes(q) ||
      room.vibeTag?.toLowerCase().includes(q) ||
      room.description?.toLowerCase().includes(q) ||
      room.host?.name?.toLowerCase().includes(q)
    );
  });

  const filteredTapes = STARTER_TAPES.filter((tape) => {
    // Filter out any Starter Tape whose title already matches an active Live Room
    const isAlreadyLive = rooms.some(
      (r) => !r.isFeatured && r.id && r.title?.trim().toLowerCase() === tape.title.trim().toLowerCase()
    );
    if (isAlreadyLive) return false;

    // 1. Category filter
    if (activeCategory !== 'All Lounges') {
      if (tape.mood !== activeCategory) return false;
    }
    // 2. Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      tape.title.toLowerCase().includes(q) ||
      tape.subtitle.toLowerCase().includes(q) ||
      tape.mood.toLowerCase().includes(q) ||
      tape.tracks.some((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q))
    );
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
    <>
      <Head>
        <title>Discover Listening Lounges • NOCTURNE</title>
        <meta
          name="description"
          content="Explore collaborative listening rooms, join active music sessions, and discover soundscapes."
        />
      </Head>

      <div className="w-full min-h-screen flex flex-col justify-between">
        <main className="flex-1">
          {/* Hero Header Stage */}
          <section className="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-8 sm:py-10 transition-colors">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
              <h1 className="font-syne font-bold text-2xl sm:text-4xl text-[var(--text-primary)] tracking-tight">
                Rooms
                <span className="sr-only">Listening Lounges</span>
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[var(--text-muted)] max-w-xl">
                Join real-time communal music rooms, share playback with friends, or launch curated starter collections.
              </p>

              {/* Search & Filter Row */}
              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-full min-w-0">
                {/* Search Input Bar */}
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search lounges by name, vibe, or curator..."
                    className="w-full pl-9 pr-4 py-2 bg-[var(--bg-recessed)] border border-[var(--border-subtle)] rounded-lg text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-2 w-full max-w-full min-w-0 overflow-x-auto pb-2 no-scrollbar touch-pan-x">
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
            </div>
          </section>

          {/* Directory Content Section */}
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
            {/* Header Status Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-6">
              <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <span className="font-semibold text-[var(--text-primary)]">
                  {filteredRooms.length + filteredTapes.length}
                </span>
                <span>sessions available</span>
              </div>

              <button
                type="button"
                onClick={fetchRooms}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[#8B5CF6] transition-colors"
                title="Refresh directory"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8B5CF6]' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-4 flex flex-col gap-3 animate-pulse"
                  >
                    <div className="h-4 bg-[var(--bg-recessed)] rounded w-1/3" />
                    <div className="h-16 bg-[var(--bg-recessed)] rounded-lg" />
                    <div className="h-4 bg-[var(--bg-recessed)] rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {/* Error Message */}
            {!loading && error && (
              <div className="p-8 rounded-xl bg-[var(--bg-panel)] border border-[#F43F5E]/40 text-center flex flex-col items-center gap-3">
                <AlertCircle className="w-8 h-8 text-[#F43F5E]" />
                <h3 className="font-syne font-bold text-[var(--text-primary)] text-base">Directory Unavailable</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-md">{error}</p>
                <button
                  type="button"
                  onClick={fetchRooms}
                  className="mt-2 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg text-xs font-medium hover:bg-[#7C3AED] transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Cards Grid */}
            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-full min-w-0">
                {/* 1. Filtered Live Rooms */}
                {filteredRooms.map((room) => {
                  const coverUrl = getLiveRoomCover(room);

                  return (
                    <article
                      key={room.id}
                      className="w-full max-w-full min-w-0 overflow-hidden box-border rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-4 flex flex-col justify-between hover:border-[#8B5CF6]/40 transition-colors shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between min-w-0 gap-2">
                          <span className="text-[11px] font-medium text-[#10B981] flex items-center gap-1.5 font-mono shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                            LIVE · {room.listenerCount} listening
                          </span>
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

                          <div className="flex-1 min-w-0 overflow-hidden">
                            <h3 className="font-syne font-bold text-sm text-[var(--text-primary)] truncate">
                              {room.title}
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
                          <span>{room.listenerCount} in room</span>
                        </span>
                        <Link
                          href={`/room/${room.slug}`}
                          className="h-8 px-3.5 rounded-md bg-[#111115] text-white dark:bg-[#F4F4F6] dark:text-[#111115] hover:opacity-90 font-medium text-xs flex items-center justify-center transition-opacity shrink-0"
                        >
                          Tune In
                        </Link>
                      </div>
                    </article>
                  );
                })}

                {/* 2. Filtered Starter Tapes (Deduplicated) */}
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
                          {tape.tracks.length} tracks ({tape.totalDurationLabel?.match(/\d+m/)?.[0] || '35m'})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleLaunchTape(tape)}
                          disabled={Boolean(launchingTapeId)}
                          className="h-8 px-3.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/40 text-[var(--text-primary)] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
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
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

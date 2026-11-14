import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { Room } from '@/types';
import { ArtworkRenderer } from '@/components/artwork';
import { Search, Radio, Plus, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

const CATEGORIES = [
  'All Lounges',
  'Late Night',
  'Deep Focus',
  'Sub-bass Warmth',
  'Ambient Electronic',
  'Synthwave',
];

export default function RoomsPage() {
  const router = useRouter();
  const { setIsCreateRoomOpen } = useLounge();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Lounges');

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
    if (activeCategory === 'Featured' && !room.isFeatured) return false;
    if (activeCategory !== 'All Lounges' && activeCategory !== 'Featured') {
      const cat = activeCategory.toLowerCase();
      const matchesCategory =
        room.vibeTag.toLowerCase().includes(cat) ||
        room.title.toLowerCase().includes(cat) ||
        room.description.toLowerCase().includes(cat);
      if (!matchesCategory) return false;
    }

    // 2. Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      room.title.toLowerCase().includes(q) ||
      room.vibeTag.toLowerCase().includes(q) ||
      room.description.toLowerCase().includes(q) ||
      room.host?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Head>
        <title>Discover Listening Lounges • NOCTURNE</title>
        <meta
          name="description"
          content="Explore collaborative listening rooms, join active music sessions, and discover soundscapes."
        />
      </Head>

      <div className="w-full min-h-screen pb-32">
        {/* Hero Header Stage */}
        <section className="border-b border-[#EDEAF5] dark:border-[#2D2945] bg-[#F8F7FC] dark:bg-[#12101F]/60 py-10 sm:py-14 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F0FA] dark:bg-[#8B5CF6]/15 border border-[#DDD6FE] dark:border-[#8B5CF6]/30 text-[#6D28D9] dark:text-[#DDD6FE] text-xs font-semibold tracking-wide">
                  <Radio className="w-3.5 h-3.5 text-[#F43F5E] dark:text-[#FF5C8A] animate-pulse" />
                  <span>LIVE DIRECTORY</span>
                </div>
                <h1 className="mt-3 font-headline font-black text-3xl sm:text-4xl text-[#12101F] dark:text-white tracking-tight">
                  Listening Lounges
                </h1>
                <p className="mt-2 text-sm sm:text-base text-[#5E5873] dark:text-[#A19EB5] max-w-xl">
                  Join real-time communal music rooms, share playback with friends, or host your own curated listening space.
                </p>
              </div>

              {/* Host Room Trigger */}
              <button
                type="button"
                onClick={() => setIsCreateRoomOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#F43F5E] to-[#7C3AED] hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all duration-200 active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create a Lounge</span>
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="mt-8 relative max-w-xl">
              <Search className="w-4 h-4 text-[#5E5873] dark:text-[#A19EB5] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lounges by name, vibe, or curator..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] rounded-xl text-sm text-[#12101F] dark:text-white placeholder:text-[#5E5873] dark:placeholder:text-[#6B6785] focus:outline-none focus:border-[#7C3AED] dark:focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#7C3AED] dark:focus:ring-[#8B5CF6] transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 active:scale-95 ${
                      isActive
                        ? 'bg-[#7C3AED] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20 font-semibold'
                        : 'bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white hover:border-[#7C3AED]/40 shadow-xs'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Status Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-[#EDEAF5] dark:border-[#2D2945]/70 mb-6">
            <div className="text-xs text-[#5E5873] dark:text-[#A19EB5] flex items-center gap-2">
              <span className="font-semibold text-[#12101F] dark:text-white">{filteredRooms.length}</span>
              <span>{filteredRooms.length === 1 ? 'room available' : 'rooms available'}</span>
            </div>

            <button
              type="button"
              onClick={fetchRooms}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs text-[#5E5873] dark:text-[#A19EB5] hover:text-[#7C3AED] dark:hover:text-[#8B5CF6] transition-colors"
              title="Refresh directory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#7C3AED] dark:text-[#8B5CF6]' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] p-5 flex flex-col gap-4 animate-pulse shadow-sm"
                >
                  <div className="aspect-[16/10] bg-[#F3F0FA] dark:bg-[#242138] rounded-xl" />
                  <div className="h-5 bg-[#F3F0FA] dark:bg-[#242138] rounded w-3/4" />
                  <div className="h-3 bg-[#F3F0FA] dark:bg-[#242138] rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {!loading && error && (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#1A1829] border border-[#F43F5E]/40 text-center flex flex-col items-center gap-3 shadow-sm">
              <AlertCircle className="w-8 h-8 text-[#F43F5E]" />
              <h3 className="font-headline font-bold text-[#12101F] dark:text-white text-base">Directory Unavailable</h3>
              <p className="text-xs text-[#5E5873] dark:text-[#A19EB5] max-w-md">{error}</p>
              <button
                type="button"
                onClick={fetchRooms}
                className="mt-2 px-4 py-2 bg-[#7C3AED] text-white rounded-full text-xs font-semibold hover:bg-[#6d28d9] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredRooms.length === 0 && (
            <div className="p-12 rounded-2xl bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] text-center flex flex-col items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-[#F3F0FA] dark:bg-[#8B5CF6]/15 border border-[#DDD6FE] dark:border-[#8B5CF6]/30 flex items-center justify-center text-[#7C3AED] dark:text-[#DDD6FE]">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-[#12101F] dark:text-white text-lg">No Lounges Found</h3>
                <p className="text-xs text-[#5E5873] dark:text-[#A19EB5] mt-1 max-w-sm">
                  {searchQuery
                    ? `No listening lounges match "${searchQuery}". Try a different term or clear filters.`
                    : 'No active lounges in this category. Be the first to start a listening session!'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateRoomOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#F43F5E] to-[#7C3AED] text-white rounded-full text-xs font-semibold shadow-md hover:opacity-95 transition-all"
              >
                + Create a Lounge
              </button>
            </div>
          )}

          {/* Room Cards Grid */}
          {!loading && !error && filteredRooms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room) => {
                const artworkId = (room.artworkId as 'noc-01' | 'noc-02' | 'noc-03') || 'noc-01';

                return (
                  <article
                    key={room.id}
                    className="group bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] hover:border-[#7C3AED]/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Artwork Canvas Stage */}
                      <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-black border border-[#EDEAF5] dark:border-[#2D2945]">
                        <ArtworkRenderer
                          artworkId={artworkId}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                        {/* Top Left: Live Status Pill */}
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium flex items-center gap-1.5 shadow-md">
                          <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
                          <span>Live</span>
                          <span className="text-[#A19EB5]">•</span>
                          <span>{room.listenerCount || 1}</span>
                        </div>

                        {/* Top Right: Featured Badge if applicable */}
                        {room.isFeatured && (
                          <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-[#7C3AED]/80 backdrop-blur-md border border-[#7C3AED] text-white text-[10px] font-bold tracking-wide uppercase shadow-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#FBBF24]" />
                            <span>Featured</span>
                          </div>
                        )}
                      </div>

                      {/* Room Metadata */}
                      <div className="mt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-[#7C3AED] bg-[#F3F0FA] dark:bg-[#8B5CF6]/10 px-2 py-0.5 rounded border border-[#DDD6FE] dark:border-[#8B5CF6]/20">
                            {room.vibeTag || 'Ambient & Electronic'}
                          </span>
                        </div>

                        <h2 className="mt-2 font-headline font-bold text-lg text-[#12101F] dark:text-white group-hover:text-[#7C3AED] transition-colors truncate">
                          {room.title}
                        </h2>

                        <p className="mt-1 text-xs text-[#5E5873] dark:text-[#A19EB5] line-clamp-2 leading-relaxed">
                          {room.description || 'Community listening session with live shared queue.'}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-5 pt-4 border-t border-[#EDEAF5] dark:border-[#2D2945] flex items-center justify-between">
                      <div className="text-[11px] text-[#8A879E] dark:text-[#6B6785] truncate max-w-[140px]">
                        Curated by <span className="text-[#12101F] dark:text-[#A19EB5] font-medium">{room.host?.name || 'Curator'}</span>
                      </div>

                      <Link
                        href={`/room/${room.slug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#F43F5E] hover:bg-[#e11d48] text-white text-xs font-semibold shadow-md shadow-pink-500/20 transition-all duration-150 active:scale-95"
                      >
                        <span>Listen In</span>
                        <span>↗</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}

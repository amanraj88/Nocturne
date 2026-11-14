import React, { useState } from 'react';
import Link from 'next/link';
import { useLounge } from '@/context/LoungeContext';
import { ArtworkRenderer } from '@/components/artwork';
import { ArrowUpRight, Radio, Sparkles, Filter, Plus } from 'lucide-react';

const MOOD_FILTERS = [
  'All Rooms',
  'Late Night',
  'Deep Focus',
  'Sub-bass Warmth',
  'Ambient Electronic',
  'Lo-Fi Beats',
  'Synthwave',
];

export const LiveLoungesGrid: React.FC = () => {
  const { rooms, setIsCreateRoomOpen } = useLounge();
  const [activeMood, setActiveMood] = useState('All Rooms');

  // Filter only genuine, active user rooms
  const activeRooms = rooms.filter((r) => !r.isFeatured && r.id);

  const filteredRooms = activeRooms.filter((room) => {
    if (activeMood === 'All Rooms') return true;
    const mood = activeMood.toLowerCase();
    return (
      room.vibeTag.toLowerCase().includes(mood) ||
      room.title.toLowerCase().includes(mood) ||
      room.description.toLowerCase().includes(mood)
    );
  });

  return (
    <section id="explore" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Section Header & Mood Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#EDEAF5] dark:border-[#2D2945]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] dark:bg-[#8B5CF6]" />
            <span className="text-xs font-semibold text-[#7C3AED] dark:text-[#DDD6FE] tracking-wider uppercase">
              Curated Spaces
            </span>
          </div>
          <h2 className="mt-1 font-headline font-extrabold text-2xl sm:text-3xl text-[#12101F] dark:text-white tracking-tight">
            Featured Rooms
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#5E5873] dark:text-[#A19EB5]">
            Explore collaborative rooms with active playlists and live listeners.
          </p>
        </div>

        {/* Mood Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          {MOOD_FILTERS.map((mood) => {
            const isActive = activeMood === mood;
            return (
              <button
                key={mood}
                type="button"
                onClick={() => setActiveMood(mood)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'bg-[#7C3AED] dark:bg-[#8B5CF6] text-white shadow-lg shadow-purple-500/25 font-semibold'
                    : 'bg-white dark:bg-[#1A1829] text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white border border-[#EDEAF5] dark:border-[#2D2945] hover:border-[#7C3AED]/40'
                }`}
              >
                {mood}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lounges Grid or Honest Empty State */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeRooms.length === 0 ? (
          <div className="col-span-full py-16 px-6 text-center rounded-2xl bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] flex flex-col items-center justify-center shadow-sm dark:shadow-xl">
            <div className="w-16 h-16 rounded-full bg-[#F3F0FA] dark:bg-[#8B5CF6]/15 border border-[#DDD6FE] dark:border-[#8B5CF6]/30 flex items-center justify-center text-[#7C3AED] dark:text-[#8B5CF6] mb-4">
              <Radio className="w-7 h-7" />
            </div>
            <h3 className="font-headline font-bold text-xl text-[#12101F] dark:text-white">No Public Lounges Live</h3>
            <p className="mt-2 text-sm text-[#5E5873] dark:text-[#A19EB5] max-w-md leading-relaxed">
              All listening rooms have wrapped up for now. Start a new collaborative room, share your link, and listen together.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateRoomOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white bg-[#F43F5E] hover:bg-[#e11d48] dark:bg-[#FF5C8A] dark:hover:bg-[#ff477b] shadow-xl shadow-pink-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Host a Lounge</span>
            </button>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="col-span-full py-12 px-6 text-center rounded-2xl bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] flex flex-col items-center justify-center">
            <p className="text-sm font-semibold text-[#12101F] dark:text-white">No lounges match "{activeMood}"</p>
            <p className="mt-1 text-xs text-[#5E5873] dark:text-[#A19EB5]">Try selecting "All Rooms" or choose a different vibe.</p>
            <button
              type="button"
              onClick={() => setActiveMood('All Rooms')}
              className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold text-[#7C3AED] dark:text-[#8B5CF6] bg-[#F3F0FA] dark:bg-[#8B5CF6]/15 hover:bg-[#EDEAF5] dark:hover:bg-[#8B5CF6]/25 transition-colors"
            >
              Show All Lounges
            </button>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const artworkId = room.artworkId || 'noc-01';
            const listenerCount = typeof room.listenerCount === 'number' ? room.listenerCount : 0;

            return (
              <Link
                key={room.id}
                href={`/room/${room.slug}`}
                className="group flex flex-col h-full rounded-2xl overflow-hidden bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] hover:border-[#7C3AED]/50 dark:hover:border-[#8B5CF6]/50 transition-all duration-300 hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-purple-500/10 flex-1"
              >
                {/* Card Artwork Header */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black shrink-0 border-b border-[#EDEAF5] dark:border-[#2D2945]">
                  <div className="w-full h-full transform transition-transform duration-700 group-hover:scale-105">
                    <ArtworkRenderer artworkId={artworkId} className="w-full h-full object-cover" />
                  </div>

                  {/* Live Pill Badge */}
                  <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-[#4ADE80]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                    <span>Live • {listenerCount} {listenerCount === 1 ? 'listener' : 'listeners'}</span>
                  </div>

                  {/* Category Monogram Pill */}
                  <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#DDD6FE]">
                    [{artworkId.toUpperCase()}]
                  </div>

                  {/* Vibe Tag Overlay */}
                  <div className="absolute bottom-3 left-3.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white">
                    {room.vibeTag}
                  </div>
                </div>

                {/* Card Details */}
                <div className="flex flex-col flex-1 p-5 sm:p-6 justify-between">
                  <div>
                    <h3 className="font-headline text-lg sm:text-xl font-bold text-[#12101F] dark:text-white group-hover:text-[#7C3AED] dark:group-hover:text-[#DDD6FE] transition-colors leading-snug">
                      {room.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-[#5E5873] dark:text-[#A19EB5] line-clamp-2 leading-relaxed">
                      {room.description || 'Intimate collaborative soundscape curated on NOCTURNE.'}
                    </p>
                  </div>

                  {/* Card Baseline Footer */}
                  <div className="mt-6 pt-4 border-t border-[#EDEAF5] dark:border-[#2D2945] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#F43F5E] p-[1px] flex items-center justify-center">
                        <div className="w-full h-full bg-white dark:bg-[#1A1829] rounded-full flex items-center justify-center text-[10px] font-bold text-[#12101F] dark:text-white">
                          {room.host?.name?.charAt(0) || 'N'}
                        </div>
                      </div>
                      <span className="text-xs text-[#5E5873] dark:text-[#A19EB5]">
                        Curated by <span className="text-[#12101F] dark:text-white font-medium">{room.host?.name || 'Guest Curator'}</span>
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C3AED] dark:text-[#8B5CF6] group-hover:text-[#F43F5E] dark:group-hover:text-[#FF5C8A] transition-colors">
                      <span>Listen In</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
};

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLounge } from '@/context/LoungeContext';
import { Headphones, Plus, Compass, Radio, ArrowUpRight, Sparkles } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { currentRoom, rooms, setIsCreateRoomOpen } = useLounge();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Active user-created rooms only (excluding demo seed rooms)
  const activeLounges = rooms.filter((r) => !r.isFeatured && r.id);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ============================================================== */}
        {/* Left Hero Banner (lg:col-span-8 / ~65% width)                  */}
        {/* ============================================================== */}
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] p-6 sm:p-10 flex flex-col justify-between shadow-sm dark:shadow-2xl min-h-[460px] group transition-colors">
          {/* Atmospheric Twilight Artwork Background */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 dark:opacity-40 transition-transform duration-700 group-hover:scale-105 pointer-events-none"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDJRil4lZKQ-SzMvnT1LAlz2SRrlE6mlJO-p9uCNh5BDmiQNV_NRIV_SmIaSClU2ObWQPVS152PgnHp9FDErx8tdeul8zwzv9HtJS1Br0OAkL1t5jsBlVrms0MQaIbrNwCC28LxGDWgS-8iXXOddjQTossQVzznWUaAIGb79G4rHxkMAVgv_26aINEj4VleMGLf5Dr99FLkMoentc8ubIfLgPqOcByadrkCgTaFev9Q1BGNn2T7TJBkx4uWBx_4xL_ho-U3XMfJYVY')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-transparent dark:from-[#1A1829] dark:via-[#1A1829]/80 dark:to-transparent pointer-events-none" />

          {/* Top Pill Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#7C3AED]/10 dark:bg-[#8B5CF6]/20 border border-[#DDD6FE] dark:border-[#8B5CF6]/40 text-[#7C3AED] dark:text-[#DDD6FE] backdrop-blur-md">
              <Headphones className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#8B5CF6]" />
              <span>LISTEN TOGETHER</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F0FA] dark:bg-[#242138]/80 border border-[#EDEAF5] dark:border-[#2D2945] text-[11px] text-[#5E5873] dark:text-[#A19EB5]">
              <Sparkles className="w-3 h-3 text-[#F43F5E] dark:text-[#FF5C8A]" />
              <span>Direction B v3</span>
            </span>
          </div>

          {/* Main Hero Statement */}
          <div className="relative z-10 my-auto py-6 max-w-2xl">
            <h1 className="font-headline font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[#12101F] dark:text-white tracking-tight leading-[1.1]">
              Music hits different <span className="bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F43F5E] dark:from-[#8B5CF6] dark:via-[#EC4899] dark:to-[#FF5C8A] bg-clip-text text-transparent">together.</span>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#5E5873] dark:text-[#A19EB5] max-w-xl leading-relaxed">
              Step into intimate, real-time listening rooms curated by creators and music lovers worldwide.
              Queue tracks, watch YouTube together, and experience shared synchronized sound.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCreateRoomOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold font-headline text-white bg-[#F43F5E] hover:bg-[#e11d48] dark:bg-[#FF5C8A] dark:hover:bg-[#ff477b] shadow-xl shadow-pink-500/25 transition-all duration-150 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create a Room</span>
              </button>

              {isMounted && currentRoom?.slug ? (
                <Link
                  href={`/room/${currentRoom.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-[#12101F] dark:text-white bg-[#F3F0FA] dark:bg-[#242138] hover:bg-[#EDEAF5] dark:hover:bg-[#2D2945] border border-[#EDEAF5] dark:border-[#2D2945] hover:border-[#7C3AED]/50 transition-all duration-150 active:scale-[0.98]"
                >
                  <Radio className="w-4 h-4 text-[#7C3AED] dark:text-[#8B5CF6]" />
                  <span>Resume Lounge</span>
                </Link>
              ) : isMounted && activeLounges.length > 0 ? (
                <Link
                  href={`/room/${activeLounges[0].slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-[#12101F] dark:text-white bg-[#F3F0FA] dark:bg-[#242138] hover:bg-[#EDEAF5] dark:hover:bg-[#2D2945] border border-[#EDEAF5] dark:border-[#2D2945] hover:border-[#7C3AED]/50 transition-all duration-150 active:scale-[0.98]"
                >
                  <Radio className="w-4 h-4 text-[#7C3AED] dark:text-[#8B5CF6]" />
                  <span>Enter Lounge</span>
                </Link>
              ) : (
                <Link
                  href="/rooms"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-[#12101F] dark:text-white bg-[#F3F0FA] dark:bg-[#242138] hover:bg-[#EDEAF5] dark:hover:bg-[#2D2945] border border-[#EDEAF5] dark:border-[#2D2945] hover:border-[#7C3AED]/50 transition-all duration-150 active:scale-[0.98]"
                >
                  <Compass className="w-4 h-4 text-[#7C3AED] dark:text-[#8B5CF6]" />
                  <span>Browse Lounges</span>
                </Link>
              )}

              <a
                href="#explore"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Lounges</span>
              </a>
            </div>
          </div>

          {/* Bottom Live Grounding Stat */}
          <div className="relative z-10 pt-4 border-t border-[#EDEAF5] dark:border-[#2D2945]/70 flex flex-wrap items-center justify-between text-xs text-[#5E5873] dark:text-[#A19EB5] gap-3">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 text-[#12101F] dark:text-white font-medium">
                <span className="w-2 h-2 rounded-full bg-[#10B981] dark:bg-[#4ADE80]" />
                <span>Zero Latency Sync</span>
              </span>
              <span>Collaborative Queue</span>
              <span className="hidden sm:inline">Live Room Chat</span>
            </div>
            <span className="text-[#8E88A8] dark:text-[#6B6785]">Realtime PostgreSQL &amp; Supabase</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Right "Live Now" Sidebar Card (lg:col-span-4 / ~35% width)    */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] p-5 sm:p-6 flex flex-col justify-between shadow-sm dark:shadow-2xl transition-colors">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#EDEAF5] dark:border-[#2D2945]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] dark:bg-[#4ADE80] animate-pulse" />
              <h2 className="font-headline font-bold text-sm text-[#12101F] dark:text-white tracking-wide uppercase">
                Live Now
              </h2>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3F0FA] dark:bg-[#8B5CF6]/20 text-[#6D28D9] dark:text-[#DDD6FE] font-medium border border-[#DDD6FE] dark:border-[#8B5CF6]/30">
              {activeLounges.length} {activeLounges.length === 1 ? 'Lounge' : 'Lounges'} Active
            </span>
          </div>

          {/* Active Lounges List / Empty State */}
          <div className="py-3 flex-1 flex flex-col justify-center">
            {activeLounges.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-[340px]">
                {activeLounges.slice(0, 4).map((room) => (
                  <Link
                    key={room.id}
                    href={`/room/${room.slug}`}
                    className="group flex items-center justify-between p-3 rounded-xl bg-[#F8F7FC] dark:bg-[#242138]/60 hover:bg-[#F3F0FA] dark:hover:bg-[#242138] border border-[#EDEAF5] dark:border-transparent hover:border-[#7C3AED]/40 dark:hover:border-[#8B5CF6]/40 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Equalizer Indicator Avatar */}
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#F43F5E] p-[1.5px] shrink-0">
                        <div className="w-full h-full bg-white dark:bg-[#1A1829] rounded-[7px] flex items-center justify-center">
                          <div className="flex items-end gap-[2px] h-3.5">
                            <span className="w-[2px] bg-[#10B981] dark:bg-[#4ADE80] rounded-full eq-1" />
                            <span className="w-[2px] bg-[#10B981] dark:bg-[#4ADE80] rounded-full eq-2" />
                            <span className="w-[2px] bg-[#10B981] dark:bg-[#4ADE80] rounded-full eq-3" />
                            <span className="w-[2px] bg-[#10B981] dark:bg-[#4ADE80] rounded-full eq-4" />
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-[#12101F] dark:text-white group-hover:text-[#7C3AED] dark:group-hover:text-[#DDD6FE] truncate">
                          {room.title}
                        </h3>
                        <p className="text-[11px] text-[#5E5873] dark:text-[#A19EB5] truncate mt-0.5">
                          {room.vibeTag}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-2 shrink-0">
                      <span className="text-[11px] font-mono text-[#16A34A] dark:text-[#4ADE80]">
                        {room.listenerCount} {room.listenerCount === 1 ? 'listener' : 'listening'}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-[#F3F0FA] dark:bg-[#2D2945] group-hover:bg-[#F43F5E] dark:group-hover:bg-[#FF5C8A] text-[#5E5873] dark:text-white group-hover:text-white flex items-center justify-center transition-colors">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-5 text-center rounded-xl bg-[#F8F7FC] dark:bg-[#242138]/40 border border-[#EDEAF5] dark:border-[#2D2945]/60 flex flex-col items-center justify-center my-auto">
                <div className="w-12 h-12 rounded-full bg-[#F3F0FA] dark:bg-[#8B5CF6]/15 border border-[#DDD6FE] dark:border-[#8B5CF6]/30 flex items-center justify-center text-[#7C3AED] dark:text-[#8B5CF6] mb-3">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-[#12101F] dark:text-white">No active lounges live</p>
                <p className="text-xs text-[#5E5873] dark:text-[#A19EB5] mt-1.5 max-w-[240px] leading-relaxed">
                  Be the first to curate a soundscape tonight. Create a room and invite your friends.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateRoomOpen(true)}
                  className="mt-4 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] transition-all shadow-md shadow-purple-500/20"
                >
                  Host First Lounge
                </button>
              </div>
            )}
          </div>

          {/* Quick Create Prompt at bottom */}
          <div className="pt-3 border-t border-[#EDEAF5] dark:border-[#2D2945]">
            <button
              type="button"
              onClick={() => setIsCreateRoomOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F3F0FA] dark:bg-[#8B5CF6]/15 hover:bg-[#EDEAF5] dark:hover:bg-[#8B5CF6]/25 border border-[#DDD6FE] dark:border-[#8B5CF6]/30 text-xs font-semibold text-[#7C3AED] dark:text-[#DDD6FE] hover:text-[#6D28D9] dark:hover:text-white flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 text-[#7C3AED] dark:text-[#8B5CF6]" />
              <span>Host your own lounge</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

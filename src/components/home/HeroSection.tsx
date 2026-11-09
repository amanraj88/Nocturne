import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { Play, Pause, Radio, ArrowRight, Sparkles, Disc3, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const HeroSection: React.FC = () => {
  const { currentRoom, currentTrack, isPlaying, togglePlay, setIsCreateRoomOpen } = useLounge();

  return (
    <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
      {/* Deep Atmospheric Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-lavender-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-coral-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Manifesto */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            {/* Supertag Pill */}
            <div className="inline-flex items-center gap-2 rounded-full bg-plum-800/80 px-3.5 py-1.5 border border-lavender-400/20 shadow-sm text-xs text-lavender-300">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Phase 1 Prototype Active
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-300 font-medium">Sub-30ms Sync Engine</span>
            </div>

            {/* Editorial Title */}
            <div className="space-y-3">
              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-100 leading-[1.08]">
                SYNCHRONIZED SOUND FOR AFTER-HOURS MINDS.
              </h1>
              <p className="max-w-xl text-base sm:text-lg text-zinc-400 leading-relaxed font-normal">
                NOCTURNE is a shared listening lounge crafted for music obsessives.
                Gather with friends, spin collaborative vinyl queues, and listen in micro-second lockstep.
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href={`/room/${currentRoom.slug}`}
                className="inline-flex items-center gap-2.5 rounded-full bg-lavender-500 hover:bg-lavender-400 text-midnight-950 font-semibold px-7 py-3.5 text-sm shadow-glow-lavender transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Enter Live Lounge</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setIsCreateRoomOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-plum-800/80 hover:bg-plum-700/80 text-zinc-200 border border-plum-600/50 px-6 py-3.5 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Curate New Lounge</span>
              </button>
            </div>

            {/* Quality Principles Telemetry */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-plum-800/70 max-w-lg">
              <div>
                <div className="font-mono text-xs text-lavender-300 font-semibold">±15ms</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Drift Tolerance</div>
              </div>
              <div>
                <div className="font-mono text-xs text-coral-400 font-semibold">Zero AI Slop</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Art-Directed Design</div>
              </div>
              <div>
                <div className="font-mono text-xs text-lime-400 font-semibold">High / Low / Off</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Motion Accessibility</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Vinyl Sleeve Teaser */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md">
              {/* Outer Decorative Aura */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-lavender-500/20 via-plum-700/10 to-coral-500/20 rounded-3xl blur-2xl opacity-60" />

              {/* Sleeve Card */}
              <div className="relative rounded-2xl bg-midnight-950/90 border border-lavender-400/25 p-5 shadow-2xl backdrop-blur-xl">
                {/* Header Tag */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-plum-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
                    <span className="text-xs font-mono font-medium text-zinc-300">
                      NOW SPINNING
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-lavender-400 bg-lavender-500/10 px-2 py-0.5 rounded-full border border-lavender-400/20">
                    {currentRoom.title}
                  </span>
                </div>

                {/* Album Cover & Play Button Overlay */}
                <div className="relative aspect-square rounded-xl overflow-hidden mb-4 group bg-plum-900 border border-plum-700/60 shadow-lg">
                  <Image
                    src={currentTrack.albumArt}
                    alt={currentTrack.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-midnight-950/40 group-hover:bg-midnight-950/20 transition-colors flex items-center justify-center">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="w-14 h-14 rounded-full bg-lavender-500 hover:bg-lavender-400 text-midnight-950 flex items-center justify-center shadow-glow-lavender transition-all group-hover:scale-110 active:scale-95"
                      aria-label={isPlaying ? 'Pause sample' : 'Play sample'}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Track Details */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-zinc-100">
                      {currentTrack.title}
                    </h3>
                    <p className="text-xs text-lavender-300 font-medium">
                      {currentTrack.artist}
                    </p>
                  </div>
                  <Link
                    href={`/room/${currentRoom.slug}`}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-lavender-300 transition-colors group"
                  >
                    <span>Lounge</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

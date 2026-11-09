import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { ArrowRight, Play, Pause, Users } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { currentRoom, currentTrack, isPlaying, togglePlay, setIsCreateRoomOpen } = useLounge();

  return (
    <section className="relative overflow-hidden min-h-[92dvh] flex flex-col lg:flex-row">
      {/* Subtle Atmospheric Ground */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 ambient-glow"
      />

      {/* Left Column: Editorial Statement & Actions */}
      <div className="relative z-10 flex flex-col justify-end lg:justify-center w-full lg:w-[58%] px-8 pb-12 pt-20 sm:px-12 sm:pb-16 lg:px-16 lg:py-0">
        <h1 className="font-serif font-bold text-ivory tracking-tight text-[2.75rem] leading-[1.04] sm:text-6xl sm:leading-[1.02] lg:text-[5.5rem] lg:leading-[1.01] max-w-[15ch]">
          After-hours listening, together.
        </h1>

        <p className="mt-6 max-w-[36ch] text-base leading-relaxed text-warm-grey">
          A shared listening lounge. Spin records in lockstep with your room.
        </p>

        {/* Primary CTA Row */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`/room/${currentRoom.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-lavender hover:bg-lavender-400 active:scale-[0.97] text-obsidian font-semibold px-6 py-3 text-sm shadow-glow-lavender transition-transform"
          >
            <span>Enter a room</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => setIsCreateRoomOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-plum-subtle bg-plum-surface/60 hover:border-lavender/40 hover:bg-plum-surface text-ivory px-6 py-3 text-sm font-medium transition-colors active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Start a room</span>
          </button>
        </div>

        {/* Honest Grounding Features */}
        <div className="mt-12 pt-8 border-t border-plum-subtle flex items-center gap-8 text-xs text-warm-dim">
          <span className="flex items-center gap-2 text-warm-grey">
            <Users className="w-3.5 h-3.5 text-lavender" />
            <span>Collaborative rooms</span>
          </span>
          <span>Synchronized playback</span>
          <span className="hidden sm:inline">Shared queue</span>
        </div>
      </div>

      {/* Right Column: Physical Vinyl Photography */}
      <div className="relative overflow-hidden h-[60vw] min-h-[300px] w-full lg:w-[42%] order-first lg:order-last">
        <Image
          src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=88"
          alt="Vinyl record under warm studio light"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 42vw"
          className="object-cover object-[center_35%]"
        />

        {/* Left and Bottom Edge Atmospheric Fades */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/30 to-transparent lg:from-obsidian lg:via-obsidian/50 lg:to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-obsidian to-transparent"
        />

        {/* Listening Anchor Card */}
        <div className="absolute bottom-6 right-6 left-6 sm:left-auto sm:w-72">
          <div className="rounded-xl bg-plum-surface/95 backdrop-blur-md border border-plum-subtle p-4">
            <div className="flex items-start gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-plum-subtle">
                <Image
                  src={currentTrack.albumArt}
                  alt={`${currentTrack.title} album cover`}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-warm-dim leading-tight mb-1">
                  Sample listening state
                </p>
                <p className="text-sm font-serif font-bold text-ivory truncate leading-tight">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-warm-grey truncate mt-0.5">
                  {currentTrack.artist}
                </p>
              </div>

              <button
                type="button"
                onClick={togglePlay}
                className="shrink-0 w-9 h-9 rounded-full bg-lavender hover:bg-lavender-400 active:scale-95 flex items-center justify-center text-obsidian transition-colors disabled:opacity-50"
                aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>
            </div>

            <div className="mt-3.5 h-[2px] rounded-full bg-plum-subtle overflow-hidden">
              <div className="h-full w-[28%] bg-lavender rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

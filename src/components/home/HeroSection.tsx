import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { ArrowRight, Play, Pause, Users, Disc3 } from 'lucide-react';

/* Resilient Image with Graceful Fallback */
const HeroImageWithFallback: React.FC<{
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}> = ({ src, alt, className = '', priority = false, sizes = '100vw' }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-plum-base/95 p-6 text-center">
        <Disc3 className="w-12 h-12 text-lavender/50 mb-3 animate-pulse" />
        <span className="font-serif text-sm text-ivory/80 tracking-wide">
          NOCTURNE Vinyl Lounge
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

export const HeroSection: React.FC = () => {
  const { currentRoom, currentTrack, isPlaying, togglePlay, setIsCreateRoomOpen } = useLounge();

  return (
    <section className="relative overflow-hidden min-h-[90dvh] flex flex-col lg:flex-row">
      {/* Subtle Atmospheric Ground */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 ambient-glow"
      />

      {/* Left Column: Editorial Statement & Actions */}
      <div className="relative z-10 flex flex-col justify-end lg:justify-center w-full lg:w-[56%] px-8 pb-12 pt-20 sm:px-12 sm:pb-16 lg:px-16 lg:py-0">
        <h1 className="font-serif font-bold text-ivory tracking-tight text-[2.5rem] leading-[1.08] sm:text-5xl sm:leading-[1.06] lg:text-[4.25rem] lg:leading-[1.04] max-w-[14ch]">
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

      {/* Right Column: Authentic Physical Vinyl & Turntable Atmosphere */}
      <div className="relative overflow-hidden h-[60vw] min-h-[320px] w-full lg:w-[44%] order-first lg:order-last bg-obsidian">
        <HeroImageWithFallback
          src="https://images.unsplash.com/photo-1539185441755-769473a23570?w=1200&auto=format&fit=crop&q=88"
          alt="Vinyl record spinning on turntable tonearm under atmospheric late-night amber light"
          priority
          sizes="(max-width: 1024px) 100vw, 44vw"
          className="object-cover object-[center_35%]"
        />

        {/* Seamless Atmospheric Gradient Fades into Obsidian Palette */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/40 to-transparent lg:from-obsidian lg:via-obsidian/50 lg:to-transparent pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-obsidian to-transparent pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-obsidian/50 to-transparent pointer-events-none"
        />

        {/* Listening Anchor Card */}
        <div className="absolute bottom-6 right-6 left-6 sm:left-auto sm:w-72 z-20">
          <div className="rounded-xl bg-plum-surface/95 backdrop-blur-md border border-plum-subtle p-4">
            <div className="flex items-start gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-plum-subtle bg-plum-base">
                <HeroImageWithFallback
                  src={currentTrack.albumArt}
                  alt={`${currentTrack.title} album cover`}
                  sizes="48px"
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

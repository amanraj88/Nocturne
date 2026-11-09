import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { ArrowRight, Play, Pause, Users } from 'lucide-react';

/*
  Hero — full-bleed split layout
  ─────────────────────────────────────────────────────────────────────────────
  Left 58%: editorial text, anchored mid-left
  Right 42%: atmospheric vinyl photograph

  Vinyl photograph chosen:
    photo-1511671782779-c97d3d27a1d4 — close-up of a vinyl record under warm
    studio light, strong bokeh background, tangible and cinematic.
    Already confirmed working in this project (used as a Four Tet album art proxy).

  We use it at a different crop/size here so it reads as the hero's own image.
  Alt text is specific and honest.
*/
export const HeroSection: React.FC = () => {
  const { currentRoom, currentTrack, isPlaying, togglePlay, setIsCreateRoomOpen } = useLounge();

  return (
    <section className="relative overflow-hidden min-h-[92vh] flex flex-col lg:flex-row">

      {/* ── Atmospheric diffuse glow — behind everything ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0
                   bg-[radial-gradient(ellipse_80%_60%_at_20%_60%,rgba(185,154,255,0.06)_0%,transparent_70%)]"
      />

      {/* ════════════════════════════════════════════════════
          LEFT COLUMN — text, anchored to vertical middle
         ════════════════════════════════════════════════════ */}
      <div
        className="relative z-10 flex flex-col justify-end lg:justify-center
                   w-full lg:w-[58%]
                   px-8 pb-10 pt-24
                   sm:px-12 sm:pb-14
                   lg:px-16 lg:py-0"
      >
        {/* ── Chapter label ── */}
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-lavender-400 mb-7">
          Collaborative Listening — Private Rooms
        </p>

        {/* ── Headline ── */}
        <h1
          className="font-serif font-bold text-zinc-100 tracking-tight
                     text-[2.6rem] leading-[1.04]
                     sm:text-6xl sm:leading-[1.03]
                     lg:text-[5.5rem] lg:leading-[1.01]
                     max-w-[15ch]"
        >
          After-hours<br />
          listening,<br />
          together.
        </h1>

        {/* ── Manifesto ── */}
        <p className="mt-5 max-w-[36ch] text-[15px] leading-relaxed text-zinc-400">
          NOCTURNE is a shared lounge where friends spin music in sync.
          One queue, one moment — wherever everyone is.
        </p>

        {/* ── CTA ── */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`/room/${currentRoom.slug}`}
            className="inline-flex items-center gap-2 rounded-full
                       bg-lavender-500 hover:bg-lavender-400 active:scale-[0.97]
                       text-midnight-950 font-semibold
                       px-6 py-3 text-sm
                       shadow-glow-lavender
                       transition-all duration-200"
          >
            Enter a Room
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => setIsCreateRoomOpen(true)}
            className="inline-flex items-center gap-2 rounded-full
                       border border-plum-600/70 bg-plum-900/40
                       hover:border-plum-500/60 hover:bg-plum-800/50
                       text-zinc-300 px-6 py-3 text-sm font-medium
                       transition-all duration-200 active:scale-[0.97]"
          >
            Start a Room
          </button>
        </div>

        {/* ── Honest product descriptor — no fake numbers ── */}
        <div className="mt-10 pt-8 border-t border-plum-800/50 flex items-center gap-7">
          <span className="flex items-center gap-2 text-xs text-zinc-600">
            <Users className="w-3.5 h-3.5" />
            Collaborative
          </span>
          <span className="text-xs text-zinc-600">Synchronized playback</span>
          <span className="text-xs text-zinc-600 hidden sm:block">Shared queue</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          RIGHT COLUMN — vinyl photograph, full height
         ════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden
                   h-[55vw] min-h-[280px]
                   w-full lg:w-[42%]
                   order-first lg:order-last"
      >
        {/*
          Vinyl record close-up — warm directional studio light, bokeh background.
          photo-1511671782779-c97d3d27a1d4 confirmed in this project.
          Cropped slightly upward so the record groove fills the frame.
        */}
        <Image
          src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=88"
          alt="Vinyl record under warm directional studio light"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 42vw"
          className="object-cover object-[center_35%]"
        />

        {/* Left-edge gradient — blends photo into dark left column */}
        <div
          aria-hidden="true"
          className="absolute inset-0
                     bg-gradient-to-r from-midnight-900 via-midnight-900/30 to-transparent
                     lg:from-midnight-900 lg:via-midnight-900/50 lg:to-transparent"
        />
        {/* Bottom-edge gradient — softens transition to next section */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-28
                     bg-gradient-to-t from-midnight-900 to-transparent"
        />

        {/* ── Now Playing overlay — compact, bottom-right ── */}
        <div className="absolute bottom-6 right-5 left-5 sm:left-auto sm:w-68 lg:w-72">
          <div
            className="rounded-xl bg-midnight-950/92 backdrop-blur-md
                       border border-plum-700/60 p-4 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              {/* Album art thumbnail */}
              <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0
                              border border-plum-700/60">
                <Image
                  src={currentTrack.albumArt}
                  alt={`${currentTrack.title} album art`}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Track info */}
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-zinc-600 mb-0.5">
                  Demo · Now Spinning
                </p>
                <p className="text-sm font-serif font-bold text-zinc-100 truncate leading-tight">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-lavender-300/70 truncate">
                  {currentTrack.artist}
                </p>
              </div>

              {/* Play/Pause */}
              <button
                type="button"
                onClick={togglePlay}
                className="shrink-0 w-9 h-9 rounded-full
                           bg-lavender-500 hover:bg-lavender-400 active:scale-95
                           flex items-center justify-center text-midnight-950
                           transition-all duration-150"
                aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
              >
                {isPlaying
                  ? <Pause className="w-3.5 h-3.5 fill-current" />
                  : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                }
              </button>
            </div>

            {/* Progress bar — static visual, honest */}
            <div className="mt-3 h-[2px] rounded-full bg-plum-800 overflow-hidden">
              <div className="h-full w-[26%] bg-lavender-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

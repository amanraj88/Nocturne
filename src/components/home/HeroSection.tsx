import React from 'react';
import Link from 'next/link';
import { useLounge } from '@/context/LoungeContext';
import { ArtworkRenderer } from '@/components/artwork';
import { ArrowRight, ArrowUpRight, Users } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { currentRoom, currentTrack, progressSeconds, durationSeconds, setIsCreateRoomOpen } = useLounge();
  const activeArtworkId = currentRoom.artworkId || 'noc-01';
  const progressPercent = durationSeconds > 0 ? Math.min(100, Math.max(0, (progressSeconds / durationSeconds) * 100)) : 0;

  return (
    <section className="relative overflow-hidden flex flex-col lg:flex-row border-b border-graphite">
      {/* Left Column: Editorial Statement & Actions */}
      <div className="relative z-10 flex flex-col justify-center w-full lg:w-[56%] px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <h1 className="font-serif font-bold text-warm-bone tracking-tight text-[2.5rem] leading-[1.08] sm:text-5xl sm:leading-[1.06] lg:text-[4.25rem] lg:leading-[1.04] max-w-[14ch]">
          After-hours listening, together.
        </h1>

        <p className="mt-6 max-w-[36ch] text-base leading-relaxed text-ash">
          A shared listening lounge. Follow one playhead across your room.
        </p>

        {/* Primary CTA Row */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`/room/${currentRoom.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-mineral hover:bg-mineral/90 active:scale-[0.97] text-deep-ink font-semibold px-6 py-3 text-sm transition-transform"
          >
            <span>Enter a room</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => setIsCreateRoomOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-graphite bg-carbon/60 hover:border-mineral/50 hover:bg-carbon text-warm-bone px-6 py-3 text-sm font-medium transition-colors active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Start a room</span>
          </button>
        </div>

        {/* Honest Grounding Features */}
        <div className="mt-10 pt-6 border-t border-graphite flex items-center gap-8 text-xs text-ash">
          <span className="flex items-center gap-2 text-warm-bone">
            <Users className="w-3.5 h-3.5 text-mineral" />
            <span>Collaborative rooms</span>
          </span>
          <span>Synchronized playback</span>
          <span className="hidden sm:inline">Shared queue</span>
        </div>
      </div>

      {/* Right Column: Approved Original Release Artwork Presentation */}
      <div className="relative flex items-center justify-center p-6 sm:p-10 lg:p-12 w-full lg:w-[44%] order-first lg:order-last bg-carbon/30 border-b lg:border-b-0 lg:border-l border-graphite">
        {/* Understated Physical Sleeve Composition featuring Approved Artwork */}
        <div className="relative w-full max-w-[300px] sm:max-w-[360px] aspect-square rounded-[3px] overflow-hidden border border-graphite bg-deep-ink shadow-md">
          {/* Authentic Left Spine Fold */}
          <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-graphite/60 z-20 pointer-events-none" />
          <div className="w-full h-full">
            <ArtworkRenderer artworkId={activeArtworkId} />
          </div>
        </div>

        {/* Listening Anchor Card */}
        <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-72 z-20">
          <div className="rounded-xl bg-carbon/95 backdrop-blur-md border border-graphite p-3.5 shadow-md">
            <div className="flex items-start gap-3">
              <div className="relative w-11 h-11 rounded-[3px] overflow-hidden shrink-0 border border-graphite bg-deep-ink">
                <ArtworkRenderer artworkId={currentTrack?.artworkId || activeArtworkId} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-ash leading-tight mb-1 font-sans">
                  [{activeArtworkId.toUpperCase()}] Featured room
                </p>
                <p className="text-sm font-serif font-bold text-warm-bone truncate leading-tight">
                  {currentTrack?.title || 'No track selected'}
                </p>
                <p className="text-xs text-ash truncate mt-0.5">
                  {currentTrack?.artist || 'Add a source inside the room'}
                </p>
              </div>

              <Link
                href={`/room/${currentRoom.slug}`}
                className="shrink-0 w-8 h-8 rounded-full bg-mineral hover:bg-mineral/90 active:scale-95 flex items-center justify-center text-deep-ink transition-colors"
                aria-label="Open this room to listen"
                title="Open this room to listen"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-2.5 h-[2px] rounded-full bg-graphite overflow-hidden">
              <div
                className="h-full bg-mineral rounded-full"
                style={{ width: `${progressPercent.toFixed(1)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

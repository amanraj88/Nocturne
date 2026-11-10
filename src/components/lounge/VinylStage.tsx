import React, { useState } from 'react';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { AudioVisualizer } from './AudioVisualizer';
import { ArtworkRenderer } from '@/components/artwork';
import { formatTime } from '@/lib/utils';
import { Disc3, Heart, Share2, Radio, Check } from 'lucide-react';

export const VinylStage: React.FC = () => {
  const {
    currentRoom,
    currentTrack,
    isPlaying,
    progressSeconds,
    durationSeconds,
    seekTo,
    quality,
    driftMs,
  } = useLounge();

  const [isLiked, setIsLiked] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const progressPercent = durationSeconds > 0 ? (progressSeconds / durationSeconds) * 100 : 0;

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo((val / 100) * durationSeconds);
  };

  const copyRoomLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  // Determine artwork identifier based on current track or room
  const activeArtworkId = currentTrack.artworkId || currentRoom.artworkId || 'noc-01';

  // Spindle label color based on room identity
  const spindleColorClass =
    activeArtworkId === 'noc-03'
      ? 'border-oxide/60 text-oxide'
      : activeArtworkId === 'noc-02'
      ? 'border-warm-bone/60 text-warm-bone'
      : 'border-mineral/60 text-mineral';

  return (
    <div className="relative flex flex-col items-center justify-center p-3 sm:p-8 lg:p-10 w-full max-w-full mx-auto overflow-hidden">
      {/* Restrained Ambient Backglow */}
      {quality !== 'off' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 ambient-glow opacity-50"
        />
      )}

      {/* Main Sleeve & Vinyl Showcase */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Vinyl & Sleeve Container */}
        <div className="relative w-full max-w-[240px] sm:max-w-[340px] lg:max-w-[390px] aspect-square mb-5 sm:mb-8">
          {/* Physical 180g Vinyl Record Peeking Behind */}
          <div
            className={`absolute top-1 sm:top-2 -right-3.5 sm:-right-7 lg:-right-9 w-[92%] h-[92%] rounded-full bg-carbon border border-graphite flex items-center justify-center transition-transform duration-700 ease-out ${
              isPlaying ? 'translate-x-2.5 sm:translate-x-6 lg:translate-x-8' : 'translate-x-0'
            }`}
            aria-hidden="true"
          >
            {/* Concentric Vinyl Micro-Grooves */}
            <div className="w-[84%] h-[84%] rounded-full border border-graphite/40 flex items-center justify-center">
              <div className="w-[68%] h-[68%] rounded-full border border-graphite/30 flex items-center justify-center">
                {/* Center Spindle Label */}
                <div
                  className={`w-[40%] h-[40%] rounded-full bg-carbon border ${spindleColorClass} flex items-center justify-center ${
                    isPlaying && quality !== 'off' ? 'animate-vinyl-spin' : ''
                  }`}
                >
                  <Disc3 className="w-5 h-5 opacity-90" />
                </div>
              </div>
            </div>
          </div>

          {/* Physical Album Sleeve Master Frame */}
          <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden bg-deep-ink border border-graphite">
            {/* Subtle Spine Relief Line */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-graphite/60 z-20 pointer-events-none" />

            {/* Approved Dynamic Vector Artwork */}
            <div className="w-full h-full transition-opacity duration-500">
              <ArtworkRenderer artworkId={activeArtworkId} />
            </div>

            {/* Live Room / Broadcast Badge */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 rounded-full bg-deep-ink/90 backdrop-blur-md px-2.5 sm:px-3 py-1 border border-graphite text-[11px] sm:text-xs text-ash">
              <span className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${isPlaying ? 'bg-mineral animate-pulse' : 'bg-ash/50'}`} />
              <span className="font-sans font-medium">{isPlaying ? 'Now playing' : 'Paused'}</span>
            </div>

            {/* Quick Actions (Favorite & Share) */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setIsLiked(!isLiked)}
                className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-colors border ${
                  isLiked
                    ? 'bg-mineral text-deep-ink border-mineral'
                    : 'bg-deep-ink/80 text-ash border-graphite hover:text-warm-bone hover:border-mineral/50'
                }`}
                aria-label={isLiked ? 'Unlike track' : 'Favorite track'}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={copyRoomLink}
                className="p-1.5 sm:p-2 rounded-full bg-deep-ink/80 text-ash border border-graphite hover:text-warm-bone hover:border-mineral/50 backdrop-blur-md transition-colors"
                aria-label="Share lounge link"
              >
                {copiedToast ? <Check className="w-3.5 h-3.5 text-mineral" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Contributor Pill */}
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex items-center justify-between rounded-xl bg-deep-ink/90 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 border border-graphite text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden shrink-0 border border-graphite">
                  <Image
                    src={currentTrack.addedBy.avatar}
                    alt={currentTrack.addedBy.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-[11px] sm:text-xs text-ash truncate">
                  Queued by <span className="text-warm-bone font-medium">{currentTrack.addedBy.name}</span>
                </span>
              </div>
              <span className="text-[11px] sm:text-xs text-ash font-mono shrink-0">
                {currentTrack.addedAt}
              </span>
            </div>
          </div>
        </div>

        {/* Track Typography & Hierarchy */}
        <div className="w-full text-center space-y-1 mb-4 sm:mb-6 max-w-xl px-2">
          <h1 className="font-display text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-warm-bone leading-tight">
            {currentTrack.title}
          </h1>
          <p className="font-sans text-xs sm:text-base font-medium text-ash">
            {currentTrack.artist}
          </p>
        </div>

        {/* Playback State Monitor (Technically Honest Harmonic Stream Monitor) */}
        <div className="w-full max-w-[280px] sm:max-w-md mb-3 sm:mb-4 px-1 sm:px-2">
          <AudioVisualizer lineCount={36} />
        </div>

        {/* Scrubber & Sync Status */}
        <div className="w-full max-w-[280px] sm:max-w-md space-y-1.5 sm:space-y-2 px-1 sm:px-2">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progressPercent}
              onChange={handleScrubberChange}
              className="w-full h-1.5 bg-carbon rounded-lg appearance-none cursor-pointer accent-mineral border border-graphite/40"
              aria-label="Track progress"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-ash px-0.5">
            <span className="font-mono text-warm-bone">{formatTime(progressSeconds)}</span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-mineral' : 'bg-ash/50'}`} />
              <span className="font-sans text-ash text-[11px]">
                {isPlaying ? (
                  <>
                    Sync ±<span className="font-mono">{driftMs}</span>ms
                  </>
                ) : (
                  'Paused'
                )}
              </span>
            </div>
            <span className="font-mono text-warm-bone">{formatTime(durationSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Copy link notice */}
      {copiedToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full bg-mineral text-deep-ink px-4 py-1.5 text-xs font-semibold shadow-lg border border-mineral">
          Lounge link copied to clipboard
        </div>
      )}
    </div>
  );
};

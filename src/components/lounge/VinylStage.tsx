import React, { useState } from 'react';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { AudioVisualizer } from './AudioVisualizer';
import { ArtworkRenderer } from '@/components/artwork';
import { formatTime } from '@/lib/utils';
import { Disc3, Heart, Share2, Check } from 'lucide-react';

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
  const catalogMark = activeArtworkId.toUpperCase();

  // Spindle label styling matched to room identity
  const spindleAccentClass =
    activeArtworkId === 'noc-03'
      ? 'border-oxide/70 text-oxide'
      : activeArtworkId === 'noc-02'
      ? 'border-warm-bone/70 text-warm-bone'
      : 'border-mineral/70 text-mineral';

  return (
    <div className="relative flex flex-col items-center justify-center py-4 px-3 sm:py-8 sm:px-6 lg:py-10 lg:px-8 w-full max-w-full mx-auto overflow-hidden">
      {/* Restrained Acoustic Backglow */}
      {quality !== 'off' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 ambient-glow opacity-40"
        />
      )}

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Release Metadata Header */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4 text-ash">
          <span className="font-mono text-xs text-ash">
            [{catalogMark}]
          </span>
          <span className="text-graphite font-mono hidden sm:inline">/</span>
          <span className="font-sans text-xs text-ash font-medium hidden sm:inline">
            12&quot; 180g master
          </span>
          <span className="text-graphite font-mono">/</span>
          <span className="font-sans text-xs text-mineral flex items-center gap-1 font-medium">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPlaying ? 'bg-mineral animate-pulse' : 'bg-ash/50'
              }`}
            />
            {isPlaying ? 'Live stream' : 'Standby'}
          </span>
        </div>

        {/* 12" Vinyl Sleeve & Peeking Record Stage */}
        <div className="relative w-full max-w-[260px] sm:max-w-[340px] md:max-w-[400px] lg:max-w-[430px] xl:max-w-[460px] aspect-square mb-5 sm:mb-8">
          {/* Physical 180g Heavyweight Vinyl Disc */}
          <div
            className={`absolute top-1.5 -right-3 sm:-right-8 lg:-right-12 w-[92%] h-[92%] rounded-full bg-deep-ink border border-graphite/80 flex items-center justify-center transition-transform duration-700 ease-out shadow-md ${
              isPlaying
                ? 'translate-x-2 sm:translate-x-8 lg:translate-x-12'
                : 'translate-x-0'
            }`}
            aria-hidden="true"
          >
            {/* Outer Vinyl Edge & Run-In Groove Lip */}
            <div className="w-[96%] h-[96%] rounded-full border border-graphite/40 flex items-center justify-center bg-carbon/60">
              {/* Play Surface Micro-Grooves */}
              <div className="w-[84%] h-[84%] rounded-full border border-graphite/30 flex items-center justify-center bg-carbon/90">
                {/* Dead-Wax Run-Out Zone */}
                <div className="w-[56%] h-[56%] rounded-full border border-graphite/40 flex items-center justify-center bg-deep-ink">
                  {/* Center Spindle Label (33⅓ RPM) */}
                  <div
                    className={`w-[52%] h-[52%] rounded-full bg-carbon border ${spindleAccentClass} flex flex-col items-center justify-center p-1 relative shadow-inner ${
                      isPlaying && quality !== 'off' ? 'animate-vinyl-spin' : ''
                    }`}
                  >
                    <span className="font-mono text-xs opacity-90 font-semibold">
                      {catalogMark}
                    </span>
                    <span className="font-sans text-[10px] text-ash font-medium mt-0.5">
                      33⅓ rpm
                    </span>
                    {/* Spindle Center Hole */}
                    <div className="w-2 h-2 rounded-full bg-deep-ink border border-graphite/80 mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Physical 12" Cardboard Sleeve Master Frame */}
          <div className="relative z-10 w-full h-full rounded-[2px] overflow-hidden bg-deep-ink border border-graphite/90 shadow-md">
            {/* Authentic Sleeve Spine Relief with subtle edge highlight */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-r from-graphite to-carbon/40 z-20 pointer-events-none" />
            <div className="absolute left-[4px] top-0 bottom-0 w-[1px] bg-graphite/40 z-20 pointer-events-none" />

            {/* Approved Dynamic Vector Artwork — Unobstructed */}
            <div className="w-full h-full">
              <ArtworkRenderer artworkId={activeArtworkId} />
            </div>

            {/* Subtle Floating Actions (Top-Right) */}
            <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-20 flex items-center gap-1.5">
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
                {copiedToast ? (
                  <Check className="w-3.5 h-3.5 text-mineral" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Release Typographic Block (Title, Artist & Liner Attribution) */}
        <div className="w-full text-center space-y-1 mb-5 sm:mb-6 max-w-xl px-2">
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-warm-bone leading-tight">
            {currentTrack.title}
          </h1>
          <p className="font-sans text-sm sm:text-base font-medium text-ash">
            {currentTrack.artist}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-ash/80 pt-1">
            <span className="truncate">
              Queued by{' '}
              <span className="text-warm-bone font-medium">
                {currentTrack.addedBy.name}
              </span>
            </span>
            <span className="text-graphite font-mono">·</span>
            <span className="font-mono text-[11px] text-ash shrink-0">
              {currentTrack.addedAt}
            </span>
          </div>
        </div>

        {/* Acoustic Harmonic Amplitude Monitor */}
        <div className="w-full max-w-[280px] sm:max-w-md mb-2 sm:mb-3 px-1 sm:px-2">
          <AudioVisualizer lineCount={44} />
        </div>

        {/* Console Scrubber Strip */}
        <div className="w-full max-w-[280px] sm:max-w-md space-y-2 px-1 sm:px-2">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progressPercent}
              onChange={handleScrubberChange}
              className="w-full h-1.5 bg-carbon rounded-none appearance-none cursor-pointer accent-mineral border border-graphite/60"
              aria-label="Track playback progress"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-ash px-0.5">
            <span className="font-mono text-warm-bone text-[11px] sm:text-xs">
              {formatTime(progressSeconds)}
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPlaying ? 'bg-mineral animate-pulse' : 'bg-ash/50'
                }`}
              />
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
            <span className="font-mono text-warm-bone text-[11px] sm:text-xs">
              {formatTime(durationSeconds)}
            </span>
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

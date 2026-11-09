import React, { useState } from 'react';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { AudioVisualizer } from './AudioVisualizer';
import { formatTime } from '@/lib/utils';
import { Disc3, Heart, Share2, Radio } from 'lucide-react';

export const VinylStage: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    progressSeconds,
    durationSeconds,
    seekTo,
    quality,
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

  return (
    <div className="relative flex flex-col items-center justify-center p-6 sm:p-10 w-full overflow-hidden">
      {/* Restrained Ambient Backglow */}
      {quality !== 'off' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 ambient-glow"
        />
      )}

      {/* Main Sleeve & Vinyl Showcase */}
      <div className="relative z-10 w-full max-w-[380px] sm:max-w-[420px] flex flex-col items-center">
        {/* Vinyl & Sleeve Container */}
        <div className="relative w-full aspect-square max-w-[340px] sm:max-w-[380px] mb-8">
          {/* Vinyl Record Peeking Behind */}
          <div
            className={`absolute top-2 right-[-24px] sm:right-[-32px] w-[90%] h-[90%] rounded-full bg-obsidian border border-plum-subtle shadow-xl flex items-center justify-center transition-transform duration-700 ease-out ${
              isPlaying ? 'translate-x-3 sm:translate-x-5' : 'translate-x-0'
            }`}
          >
            <div className="w-[82%] h-[82%] rounded-full border border-plum-subtle/80 flex items-center justify-center">
              <div className="w-[64%] h-[64%] rounded-full border border-plum-subtle/60 flex items-center justify-center">
                <div
                  className={`w-[40%] h-[40%] rounded-full bg-lavender-subtle border border-lavender/40 flex items-center justify-center ${
                    isPlaying && quality !== 'off' ? 'animate-vinyl-spin' : ''
                  }`}
                >
                  <Disc3 className="w-5 h-5 text-lavender opacity-80" />
                </div>
              </div>
            </div>
          </div>

          {/* Physical Album Sleeve */}
          <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden bg-plum-surface border border-plum-subtle shadow-glow-album">
            <Image
              src={currentTrack.albumArt}
              alt={`${currentTrack.title} by ${currentTrack.artist}`}
              fill
              priority
              sizes="(max-width: 768px) 340px, 420px"
              className="object-cover"
            />

            {/* Quiet Live Stage Tag */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-obsidian/85 backdrop-blur-md px-3 py-1 border border-hairline text-xs text-warm-grey">
              <Radio className="w-3 h-3 text-lavender" />
              <span>Now playing</span>
            </div>

            {/* Quick Actions */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                  isLiked
                    ? 'bg-lavender text-obsidian'
                    : 'bg-obsidian/80 text-warm-grey hover:text-ivory'
                }`}
                aria-label="Favorite track"
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={copyRoomLink}
                className="p-2 rounded-full bg-obsidian/80 text-warm-grey hover:text-ivory backdrop-blur-md transition-colors"
                aria-label="Share lounge link"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Contributor Note */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-obsidian/90 backdrop-blur-md px-3.5 py-2 border border-plum-subtle text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 border border-plum-subtle">
                  <Image
                    src={currentTrack.addedBy.avatar}
                    alt={currentTrack.addedBy.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-xs text-warm-dim truncate">
                  Queued by <span className="text-ivory font-medium">{currentTrack.addedBy.name}</span>
                </span>
              </div>
              <span className="text-xs text-warm-dim shrink-0">
                {currentTrack.addedAt}
              </span>
            </div>
          </div>
        </div>

        {/* Track Typography */}
        <div className="w-full text-center space-y-1 mb-5">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ivory">
            {currentTrack.title}
          </h1>
          <p className="text-sm font-medium text-warm-grey">
            {currentTrack.artist}
          </p>
        </div>

        {/* Audio Waveform */}
        <div className="w-full mb-4 px-2">
          <AudioVisualizer barCount={32} />
        </div>

        {/* Scrubber Bar */}
        <div className="w-full space-y-2">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progressPercent}
              onChange={handleScrubberChange}
              className="w-full h-1.5 bg-plum-subtle rounded-lg appearance-none cursor-pointer accent-lavender"
              aria-label="Track progress"
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-warm-dim px-0.5">
            <span>{formatTime(progressSeconds)}</span>
            <span className="text-[11px] text-warm-dim font-sans">
              {isPlaying ? 'Synchronized' : 'Paused'}
            </span>
            <span>{formatTime(durationSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Copy link notice */}
      {copiedToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full bg-lavender text-obsidian px-4 py-1.5 text-xs font-semibold shadow-glow-lavender">
          Lounge link copied to clipboard
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useLounge } from '@/context/LoungeContext';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Heart,
  Flame,
  Moon,
} from 'lucide-react';

export const PlaybackDeck: React.FC = () => {
  const {
    isPlaying,
    togglePlay,
    skipTrack,
    previousTrack,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    driftMs,
    sendChatMessage,
  } = useLounge();

  const handleVibeReaction = (label: string) => {
    sendChatMessage(`felt: ${label}`);
  };

  return (
    <div className="relative w-full border-t border-plum-subtle bg-obsidian/95 backdrop-blur-md px-4 py-3 sm:py-4">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
        {/* Left: Intimate Mood Triggers */}
        <div className="flex items-center gap-2 order-2 sm:order-1">
          <span className="text-xs text-warm-dim mr-1 hidden lg:inline">
            React:
          </span>
          <button
            type="button"
            onClick={() => handleVibeReaction('Deep focus')}
            className="px-2.5 py-1 rounded-full bg-plum-surface hover:bg-plum-subtle text-warm-grey hover:text-ivory text-xs border border-plum-subtle transition-colors flex items-center gap-1.5"
          >
            <Moon className="w-3 h-3 text-lavender" />
            <span>Late night</span>
          </button>
          <button
            type="button"
            onClick={() => handleVibeReaction('Warm warmth')}
            className="px-2.5 py-1 rounded-full bg-plum-surface hover:bg-plum-subtle text-warm-grey hover:text-ivory text-xs border border-plum-subtle transition-colors flex items-center gap-1.5"
          >
            <Flame className="w-3 h-3 text-coral" />
            <span>Energy</span>
          </button>
          <button
            type="button"
            onClick={() => handleVibeReaction('Pure bliss')}
            className="px-2.5 py-1 rounded-full bg-plum-surface hover:bg-plum-subtle text-warm-grey hover:text-ivory text-xs border border-plum-subtle transition-colors flex items-center gap-1.5"
          >
            <Heart className="w-3 h-3 text-lavender" />
            <span>Love</span>
          </button>
        </div>

        {/* Center: Playback Transport Buttons */}
        <div className="flex items-center gap-5 sm:gap-6 order-1 sm:order-2">
          <button
            type="button"
            onClick={previousTrack}
            className="p-2 text-warm-grey hover:text-ivory transition-colors"
            aria-label="Previous track"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-transform active:scale-95 ${
              isPlaying
                ? 'bg-lavender text-obsidian shadow-glow-lavender hover:bg-lavender-400'
                : 'bg-ivory text-obsidian hover:bg-white'
            }`}
            aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={skipTrack}
            className="p-2 text-warm-grey hover:text-ivory transition-colors"
            aria-label="Skip to next track"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Volume & Sync Telemetry */}
        <div className="flex items-center gap-4 order-3 w-full sm:w-auto justify-end">
          <div className="hidden md:flex items-center gap-2 rounded-full bg-plum-surface px-3 py-1 border border-plum-subtle text-xs">
            <Radio className="w-3 h-3 text-green" />
            <span className="text-warm-dim">Sync lock</span>
            <span className="text-ivory text-xs">{driftMs}ms</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="text-warm-grey hover:text-ivory transition-colors"
              aria-label={isMuted ? 'Unmute volume' : 'Mute volume'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-coral" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16 sm:w-24 h-1 bg-plum-subtle rounded-lg appearance-none cursor-pointer accent-lavender"
              aria-label="Volume slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

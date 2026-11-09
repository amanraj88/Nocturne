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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    reactions,
    triggerReaction,
  } = useLounge();

  const reactionEmojis = ['💜', '✨', '🔥', '🌙', '🪩', '🌊'];

  return (
    <div className="relative w-full border-t border-plum-700/60 bg-midnight-950/90 backdrop-blur-xl px-4 py-3 sm:py-4">
      {/* Floating Reaction Particles */}
      <div className="absolute inset-x-0 bottom-full h-32 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 30, scale: 0.5, x: `${r.x}%` }}
              animate={{ opacity: [0, 1, 1, 0], y: -90, scale: [0.6, 1.2, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              className="absolute text-2xl select-none"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
        {/* Left: Reaction Launcher & Mood Bar */}
        <div className="flex items-center gap-1.5 order-2 sm:order-1">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mr-1 hidden lg:inline">
            Vibe:
          </span>
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => triggerReaction(emoji)}
              className="px-2 py-1 rounded-lg bg-plum-800/60 hover:bg-plum-700 hover:scale-110 active:scale-95 text-sm transition-all border border-plum-700/40"
              aria-label={`Send reaction ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Center: Playback Transport Buttons */}
        <div className="flex items-center gap-4 sm:gap-6 order-1 sm:order-2">
          {/* Previous Track */}
          <button
            type="button"
            onClick={previousTrack}
            className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors hover:scale-105 active:scale-95"
            aria-label="Previous track"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Master Play / Pause */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={togglePlay}
            className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
              isPlaying
                ? 'bg-lavender-500 text-midnight-950 shadow-glow-lavender hover:bg-lavender-400'
                : 'bg-zinc-100 text-midnight-950 hover:bg-white shadow-lg'
            }`}
            aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </motion.button>

          {/* Next / Skip Track */}
          <button
            type="button"
            onClick={skipTrack}
            className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors hover:scale-105 active:scale-95"
            aria-label="Skip to next track"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Volume & Sync Telemetry */}
        <div className="flex items-center gap-4 order-3 w-full sm:w-auto justify-end">
          {/* Audio Sync Telemetry */}
          <div className="hidden md:flex items-center gap-2 rounded-full bg-plum-900/70 px-3 py-1 border border-plum-700/60 text-[11px] font-mono">
            <Radio className="w-3 h-3 text-lime-400 animate-pulse" />
            <span className="text-zinc-400">Sync Drift:</span>
            <span className="text-lime-400 font-semibold">{driftMs}ms</span>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
              aria-label={isMuted ? 'Unmute volume' : 'Mute volume'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-coral-500" />
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
              className="w-16 sm:w-24 h-1 bg-plum-800 rounded-lg appearance-none cursor-pointer accent-lavender-400"
              aria-label="Volume slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

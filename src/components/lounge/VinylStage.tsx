import React, { useState } from 'react';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { AudioVisualizer } from './AudioVisualizer';
import { formatTime } from '@/lib/utils';
import { Disc3, Heart, Share2, Sparkles, User, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const VinylStage: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    progressSeconds,
    durationSeconds,
    seekTo,
    quality,
    triggerReaction,
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
    <div className="relative flex flex-col items-center justify-center p-4 sm:p-8 lg:p-10 w-full overflow-hidden">
      {/* Ambient Mood Backglow */}
      {quality !== 'off' && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
            isPlaying ? 'opacity-80' : 'opacity-30'
          }`}
          style={{
            background:
              'radial-gradient(circle at 50% 40%, rgba(185, 154, 255, 0.16) 0%, rgba(255, 128, 107, 0.08) 40%, transparent 75%)',
          }}
        />
      )}

      {/* Main Sleeve & Vinyl Showcase */}
      <div className="relative z-10 w-full max-w-[380px] sm:max-w-[420px] lg:max-w-[460px] flex flex-col items-center">
        {/* Vinyl & Sleeve Container */}
        <div className="relative group w-full aspect-square max-w-[340px] sm:max-w-[380px] mb-8">
          {/* Vinyl Record Peeking Behind */}
          <div
            className={`absolute top-2 right-[-24px] sm:right-[-32px] w-[90%] h-[90%] rounded-full bg-zinc-950 border border-zinc-800/80 shadow-2xl flex items-center justify-center transition-transform duration-700 ease-out ${
              isPlaying ? 'translate-x-3 sm:translate-x-5' : 'translate-x-0'
            }`}
          >
            {/* Vinyl Grooves */}
            <div className="w-[82%] h-[82%] rounded-full border border-zinc-900/90 flex items-center justify-center">
              <div className="w-[64%] h-[64%] rounded-full border border-zinc-800/60 flex items-center justify-center">
                <div
                  className={`w-[40%] h-[40%] rounded-full bg-lavender-500/20 border-2 border-lavender-400/40 flex items-center justify-center ${
                    isPlaying && quality !== 'off' ? 'animate-vinyl-spin' : ''
                  }`}
                >
                  <Disc3 className="w-5 h-5 text-lavender-300 opacity-80" />
                </div>
              </div>
            </div>
          </div>

          {/* Album Sleeve Cover Art */}
          <motion.div
            animate={{
              scale: isPlaying && quality === 'high' ? [1, 1.018, 1] : 1,
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative z-10 w-full h-full rounded-2xl overflow-hidden bg-plum-900 border border-lavender-400/20 shadow-glow-album transition-all duration-500"
          >
            <Image
              src={currentTrack.albumArt}
              alt={`${currentTrack.title} by ${currentTrack.artist}`}
              fill
              priority
              sizes="(max-width: 768px) 340px, 420px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Subtle Sheen / Lighting Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-midnight-950/60 via-transparent to-lavender-300/10 pointer-events-none" />

            {/* Floating Live Badge */}
            <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-full bg-midnight-950/80 backdrop-blur-md px-3 py-1 border border-lavender-400/20 text-[10px] font-mono text-zinc-300">
              <Radio className="w-2.5 h-2.5 text-coral-500 animate-pulse" />
              <span>LIVE ON STAGE</span>
            </div>

            {/* Quick Actions Overlay (Heart & Share) */}
            <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsLiked(!isLiked);
                  triggerReaction(isLiked ? '💔' : '💜');
                }}
                className={`p-2 rounded-full backdrop-blur-md transition-all ${
                  isLiked
                    ? 'bg-lavender-500 text-midnight-950 scale-110 shadow-glow-lavender'
                    : 'bg-midnight-950/70 text-zinc-300 hover:text-lavender-300 hover:bg-midnight-950'
                }`}
                aria-label="Like track"
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={copyRoomLink}
                className="p-2 rounded-full bg-midnight-950/70 text-zinc-300 hover:text-lavender-300 hover:bg-midnight-950 backdrop-blur-md transition-all"
                aria-label="Share lounge link"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Queued By Contributor Pill */}
            <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between rounded-xl bg-midnight-950/85 backdrop-blur-md px-3 py-2 border border-plum-700/60 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 border border-lavender-400/30">
                  <Image
                    src={currentTrack.addedBy.avatar}
                    alt={currentTrack.addedBy.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-[11px] text-zinc-400 truncate">
                  Queued by <span className="text-zinc-200 font-medium">{currentTrack.addedBy.name}</span>
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                {currentTrack.addedAt}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Track Typography & Editorial Metadata */}
        <div className="w-full text-center space-y-1 mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTrack.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                {currentTrack.title}
              </h1>
              <p className="text-sm sm:text-base font-medium text-lavender-300/90 mt-0.5">
                {currentTrack.artist}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Delicate Audio Reactive Visualizer */}
        <div className="w-full mb-4 px-2">
          <AudioVisualizer barCount={32} />
        </div>

        {/* Precision Progress Scrubber Bar */}
        <div className="w-full space-y-1.5">
          <div className="relative group flex items-center">
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progressPercent}
              onChange={handleScrubberChange}
              className="w-full h-1.5 bg-plum-800 rounded-lg appearance-none cursor-pointer accent-lavender-400 transition-all focus:outline-none focus:ring-1 focus:ring-lavender-400/50"
              aria-label="Track progress scrubber"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-0.5">
            <span>{formatTime(progressSeconds)}</span>
            <span className="text-[10px] tracking-widest text-lavender-400/70 font-sans uppercase">
              {isPlaying ? 'Synchronized' : 'Paused'}
            </span>
            <span>{formatTime(durationSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Copy link feedback toast */}
      <AnimatePresence>
        {copiedToast && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full bg-lavender-500 text-midnight-950 px-4 py-1.5 text-xs font-semibold shadow-glow-lavender"
          >
            Lounge invite link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

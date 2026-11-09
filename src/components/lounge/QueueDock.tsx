import React from 'react';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { formatTime } from '@/lib/utils';
import { Plus, Trash2, ArrowUp, Disc3, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const QueueDock: React.FC = () => {
  const { queue, currentTrack, voteSkip, removeTrack, setIsSearchOpen } = useLounge();

  return (
    <div className="flex flex-col h-full bg-plum-900/40 border-l border-plum-700/50 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-plum-700/50">
        <div className="flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-lavender-400" />
          <h2 className="font-serif text-sm font-bold tracking-wider text-zinc-100 uppercase">
            Shared Queue
          </h2>
          <span className="rounded-full bg-plum-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-plum-700/60">
            {queue.length}
          </span>
        </div>

        {/* Add Song Button */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-lavender-500/15 hover:bg-lavender-500/25 border border-lavender-400/30 text-lavender-300 px-3 py-1 text-xs font-medium transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Queue Track</span>
        </button>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        <AnimatePresence initial={false}>
          {queue.map((track, index) => {
            const isCurrent = track.id === currentTrack.id;

            return (
              <motion.div
                key={track.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`group relative flex items-center justify-between rounded-xl p-2.5 transition-all ${
                  isCurrent
                    ? 'bg-plum-800/90 border border-lavender-400/30 shadow-md'
                    : 'bg-plum-900/30 hover:bg-plum-800/50 border border-plum-700/30'
                }`}
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-plum-800">
                    <Image
                      src={track.albumArt}
                      alt={track.title}
                      fill
                      className="object-cover"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-midnight-950/60 flex items-center justify-center">
                        <Radio className="w-4 h-4 text-lavender-400 animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-zinc-100 truncate group-hover:text-lavender-200 transition-colors">
                        {track.title}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-mono uppercase bg-lavender-500/20 text-lavender-300 border border-lavender-400/30 rounded px-1.5 py-0.2 shrink-0">
                          Now
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                      <span className="truncate">{track.artist}</span>
                      <span>•</span>
                      <span className="text-[10px] text-zinc-500 truncate">
                        via {track.addedBy.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Duration, Vote Skip & Remove */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-zinc-400">
                    {formatTime(track.durationSeconds)}
                  </span>

                  {/* Vote to Skip */}
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => voteSkip(track.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono transition-all ${
                        track.userVotedSkip
                          ? 'bg-coral-500/20 text-coral-400 border border-coral-500/40'
                          : 'bg-plum-800/80 text-zinc-400 hover:text-zinc-200 border border-plum-700/60'
                      }`}
                      title="Vote to skip this track"
                    >
                      <ArrowUp className="w-3 h-3" />
                      <span>{track.skipVotes}</span>
                    </button>
                  )}

                  {/* Remove Track if added */}
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => removeTrack(track.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-coral-400 transition-opacity"
                      aria-label="Remove track from queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {queue.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500">
            <Disc3 className="w-8 h-8 mb-2 opacity-30 animate-spin" />
            <p className="text-xs">Queue is quiet</p>
            <p className="text-[11px] text-zinc-600 mt-1">Search & queue tracks to keep the lounge spinning</p>
          </div>
        )}
      </div>
    </div>
  );
};

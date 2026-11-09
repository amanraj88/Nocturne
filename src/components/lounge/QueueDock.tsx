import React from 'react';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { formatTime } from '@/lib/utils';
import { Plus, Trash2, ArrowUp, Disc3, Radio } from 'lucide-react';

export const QueueDock: React.FC = () => {
  const { queue, currentTrack, voteSkip, removeTrack, setIsSearchOpen } = useLounge();

  return (
    <div className="flex flex-col h-full bg-plum-base/60 border-l border-plum-subtle">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-plum-subtle">
        <div className="flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-lavender" />
          <h2 className="font-serif text-sm font-bold text-ivory">
            Shared queue
          </h2>
          <span className="rounded-full bg-plum-surface px-2 py-0.5 text-xs font-mono text-warm-dim border border-plum-subtle">
            {queue.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-lavender-subtle hover:bg-lavender/20 border border-lavender/30 text-lavender px-3 py-1 text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Queue track</span>
        </button>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {queue.map((track) => {
          const isCurrent = track.id === currentTrack.id;

          return (
            <div
              key={track.id}
              className={`group flex items-center justify-between rounded-xl p-2.5 transition-colors ${
                isCurrent
                  ? 'bg-plum-surface border border-lavender/30'
                  : 'bg-plum-surface/40 hover:bg-plum-surface/80 border border-plum-subtle/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-plum-surface">
                  <Image
                    src={track.albumArt}
                    alt={track.title}
                    fill
                    className="object-cover"
                  />
                  {isCurrent && (
                    <div className="absolute inset-0 bg-obsidian/60 flex items-center justify-center">
                      <Radio className="w-4 h-4 text-lavender" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-ivory truncate group-hover:text-lavender transition-colors">
                      {track.title}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] bg-lavender-subtle text-lavender border border-lavender/30 rounded px-1.5 py-0.2 shrink-0">
                        Playing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-warm-dim">
                    <span className="truncate">{track.artist}</span>
                    <span>·</span>
                    <span className="truncate text-warm-dim/80">
                      via {track.addedBy.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-warm-dim">
                  {formatTime(track.durationSeconds)}
                </span>

                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => voteSkip(track.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                      track.userVotedSkip
                        ? 'bg-coral-subtle text-coral border border-coral/40'
                        : 'bg-plum-surface text-warm-dim hover:text-ivory border border-plum-subtle'
                    }`}
                    title="Vote to skip track"
                  >
                    <ArrowUp className="w-3 h-3" />
                    <span className="font-mono text-[11px]">{track.skipVotes}</span>
                  </button>
                )}

                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => removeTrack(track.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-warm-dim hover:text-coral transition-opacity"
                    aria-label="Remove track from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {queue.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-warm-dim">
            <Disc3 className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs">Queue is quiet</p>
            <p className="text-[11px] text-warm-dim mt-1">Search and add tracks to begin listening</p>
          </div>
        )}
      </div>
    </div>
  );
};

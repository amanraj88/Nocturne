import React from 'react';
import { useLounge } from '@/context/LoungeContext';
import { ArtworkRenderer } from '@/components/artwork';
import { formatTime } from '@/lib/utils';
import { Plus, Trash2, ArrowUp, Disc3 } from 'lucide-react';
import { Track } from '@/types';

const TrackThumb: React.FC<{ track: Track; isCurrent: boolean }> = ({ track, isCurrent }) => {
  const artworkId = track.artworkId || 'noc-01';

  return (
    <div className="relative w-9 h-9 rounded-[2px] overflow-hidden shrink-0 bg-deep-ink border border-graphite">
      <ArtworkRenderer artworkId={artworkId} className="w-full h-full" />
      {isCurrent && (
        <div className="absolute inset-0 bg-deep-ink/40 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-mineral animate-pulse" />
        </div>
      )}
    </div>
  );
};

export const QueueDock: React.FC = () => {
  const { queue, currentTrack, voteSkip, removeTrack, setIsSearchOpen } = useLounge();

  return (
    <div className="flex flex-col h-full bg-carbon/50 border-l border-graphite">
      {/* Editorial Tracklist Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-graphite">
        <div className="flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-mineral" />
          <h2 className="font-display text-sm font-bold text-warm-bone tracking-tight">
            Tracklist
          </h2>
          <span className="text-ash font-mono text-[11px]">
            [<span className="font-mono">{queue.length}</span>]
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-deep-ink hover:bg-graphite border border-graphite text-warm-bone px-3 py-1 text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-mineral" />
          <span>Queue track</span>
        </button>
      </div>

      {/* Editorial Vinyl Tracklist Rows */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {queue.map((track, idx) => {
          const isCurrent = track.id === currentTrack.id;
          const trackIndex = String(idx + 1).padStart(2, '0');

          return (
            <div
              key={track.id}
              className={`group flex items-center justify-between p-2 rounded-lg transition-colors border ${
                isCurrent
                  ? 'bg-carbon/90 border-graphite shadow-sm'
                  : 'hover:bg-carbon/60 border-transparent hover:border-graphite/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                {/* Index / Active indicator */}
                <span className="w-5 shrink-0 text-center text-[11px] font-mono">
                  {isCurrent ? (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-mineral animate-pulse" />
                  ) : (
                    <span className="text-ash/60">{trackIndex}</span>
                  )}
                </span>

                <TrackThumb track={track} isCurrent={isCurrent} />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs truncate transition-colors ${
                        isCurrent
                          ? 'font-semibold text-warm-bone'
                          : 'font-medium text-ash group-hover:text-warm-bone'
                      }`}
                    >
                      {track.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-ash/80 mt-0.5">
                    <span className="truncate">{track.artist}</span>
                    <span className="text-graphite font-mono">/</span>
                    <span className="truncate text-ash/60 text-[10px]">
                      via {track.addedBy.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-ash">
                  {formatTime(track.durationSeconds)}
                </span>

                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => voteSkip(track.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                      track.userVotedSkip
                        ? 'bg-oxide/20 text-oxide border border-oxide/40'
                        : 'bg-deep-ink text-ash hover:text-warm-bone border border-graphite'
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
                    className="opacity-0 group-hover:opacity-100 p-1 text-ash hover:text-oxide transition-opacity"
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
          <div className="flex flex-col items-center justify-center p-8 text-center text-ash">
            <Disc3 className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-medium text-warm-bone">Tracklist is empty</p>
            <p className="text-xs text-ash mt-1">
              Search and add tracks to begin listening
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

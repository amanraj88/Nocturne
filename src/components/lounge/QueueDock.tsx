import React, { useState } from 'react';
import { useLounge } from '@/context/LoungeContext';
import { ArtworkRenderer } from '@/components/artwork';
import { formatTime } from '@/lib/utils';
import { Plus, Trash2, ArrowUp, Disc3, Upload, AlertCircle } from 'lucide-react';
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
  const {
    queue,
    currentTrack,
    voteSkip,
    removeTrack,
    selectTrack,
    setIsSearchOpen,
    loadLocalAudioFiles,
    shareLocalAudioFile,
    sharingTrackId,
    audioError,
  } = useLounge();

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadLocalAudioFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col h-full bg-carbon/50 border-l border-graphite transition-colors ${
        isDragOver ? 'bg-carbon/90 ring-1 ring-mineral/50' : ''
      }`}
    >
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

        <div className="flex items-center gap-1.5">
          <label
            className="flex items-center gap-1.5 rounded-full bg-deep-ink hover:bg-graphite border border-graphite text-warm-bone px-3 py-1 text-xs font-medium transition-colors cursor-pointer"
            title="Load local audio file (.mp3, .wav, .flac)"
          >
            <Upload className="w-3.5 h-3.5 text-mineral" />
            <span className="hidden sm:inline">Load file</span>
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  loadLocalAudioFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-deep-ink hover:bg-graphite border border-graphite text-warm-bone px-3 py-1 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-mineral" />
            <span>Catalogue</span>
          </button>
        </div>
      </div>

      {audioError && (
        <div
          role="alert"
          aria-live="polite"
          className="mx-3 mt-2 p-2 rounded-[2px] bg-oxide/10 border border-oxide/40 text-oxide text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Editorial Vinyl Tracklist Rows */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {queue.map((track, idx) => {
          const isCurrent = track.id === currentTrack?.id;
          const trackIndex = String(idx + 1).padStart(2, '0');

          return (
            <div
              key={track.id}
              onClick={() => selectTrack(track.id)}
              className={`group flex items-center justify-between p-2 rounded-lg transition-colors border cursor-pointer ${
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
                    {track.isLocalFile && (
                      <span className="rounded-[2px] bg-mineral/20 text-mineral border border-mineral/40 px-1 py-0.2 text-[9px] font-sans font-medium shrink-0">
                        Master
                      </span>
                    )}
                    {track.sourceType === 'shared-audio' && (
                      <span className="rounded-[2px] bg-mineral/10 text-mineral border border-mineral/30 px-1 py-0.2 text-[9px] font-sans font-medium shrink-0">Shared</span>
                    )}
                    {track.isTestFixture && (
                      <span className="rounded-[2px] bg-oxide/20 text-oxide border border-oxide/40 px-1 py-0.2 text-[9px] font-sans font-medium shrink-0">
                        Fixture
                      </span>
                    )}
                    {(track.sourceType === 'youtube' || (!track.audioUrl && track.youtubeId)) && (
                      <span className="rounded-[2px] bg-carbon text-warm-bone border border-graphite px-1 py-0.2 text-[9px] font-sans font-medium shrink-0">
                        YouTube
                      </span>
                    )}
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
                  {track.durationSeconds > 0 ? formatTime(track.durationSeconds) : '—:—'}
                </span>

                {track.isLocalFile && (
                  <button
                    type="button"
                    disabled={sharingTrackId === track.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      void shareLocalAudioFile(track.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-[2px] border border-mineral/50 px-1.5 py-1 text-[10px] text-mineral hover:bg-mineral/10 disabled:opacity-60"
                    aria-label={sharingTrackId === track.id ? 'Uploading audio to room' : 'Share audio with room'}
                    title="Uploads a copy for room guests to stream. Only share audio you have permission to share."
                  >
                    <Upload className={`w-3 h-3 ${sharingTrackId === track.id ? 'animate-pulse text-warm-bone' : ''}`} />
                    <span>{sharingTrackId === track.id ? 'Uploading…' : 'Share'}</span>
                  </button>
                )}

                {!isCurrent && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      voteSkip(track.id);
                    }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTrack(track.id);
                    }}
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
            <p className="text-xs font-medium text-warm-bone">The queue is empty</p>
            <p className="text-xs text-ash mt-1 max-w-[24ch]">
              Add a YouTube link for the room, or load a local file to play on this device.
            </p>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-mineral px-3 py-1.5 text-xs font-semibold text-deep-ink hover:bg-mineral/90"
            >
              <Plus className="w-3.5 h-3.5" /> Add a YouTube link
            </button>
          </div>
        )}
      </div>

      {/* Drag & drop overlay indicator */}
      {isDragOver && (
        <div className="absolute inset-0 bg-deep-ink/90 border-2 border-dashed border-mineral flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-none">
          <Upload className="w-8 h-8 text-mineral mb-2" />
          <p className="text-xs font-semibold text-warm-bone">Drop audio master file here</p>
          <p className="text-[11px] text-ash mt-1">.mp3, .wav, .flac, .ogg supported</p>
        </div>
      )}
    </div>
  );
};

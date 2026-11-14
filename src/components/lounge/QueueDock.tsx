import React, { useState } from 'react';
import { useLounge } from '@/context/LoungeContext';
import { ArtworkRenderer } from '@/components/artwork';
import { formatTime } from '@/lib/utils';
import {
  Plus,
  Trash2,
  ArrowUp,
  Disc3,
  Upload,
  AlertCircle,
  GripVertical,
  Link as LinkIcon,
  Loader2,
  Info,
  Radio,
  Check,
} from 'lucide-react';
import { Track } from '@/types';

const TrackThumb: React.FC<{ track: Track; isCurrent: boolean }> = ({ track, isCurrent }) => {
  const artworkId = track.artworkId || 'noc-01';

  return (
    <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[#0F0E17] border border-[#2D2945]">
      <ArtworkRenderer artworkId={artworkId} className="w-full h-full object-cover" />
      {isCurrent && (
        <div className="absolute inset-0 bg-[#0F0E17]/40 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
        </div>
      )}
    </div>
  );
};

export const QueueDock: React.FC = () => {
  const {
    currentRoom,
    queue,
    currentTrack,
    voteSkip,
    removeTrack,
    selectTrack,
    setIsSearchOpen,
    addTrackToQueue,
    loadLocalAudioFiles,
    shareLocalAudioFile,
    sharingTrackId,
    audioError,
  } = useLounge();

  const [activeTab, setActiveTab] = useState<'queue' | 'info'>('queue');
  const [youtubeInputUrl, setYoutubeInputUrl] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Directly handle adding a YouTube URL from the inline input
  const handleInlineAddYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = youtubeInputUrl.trim();
    if (!url) return;

    setIsAddingUrl(true);
    setInputError(null);

    try {
      // Validate YouTube URL
      const res = await fetch(`/api/youtube/info?url=${encodeURIComponent(url)}`);
      const info = await res.json();

      if (!res.ok || !info.valid) {
        setInputError(info.error || 'Could not resolve YouTube video info.');
        setIsAddingUrl(false);
        return;
      }

      const didAdd = await addTrackToQueue({
        title: info.title || 'YouTube Track',
        artist: info.artist || 'YouTube Broadcast',
        youtubeId: info.videoId,
        durationSeconds: info.durationSeconds || 0,
        artworkId: currentRoom?.artworkId || 'noc-01',
        sourceType: 'youtube',
      });

      if (didAdd) {
        setYoutubeInputUrl('');
      } else {
        setInputError('Failed to add track to queue. Try again.');
      }
    } catch (err: any) {
      setInputError(err.message || 'Error processing YouTube URL');
    } finally {
      setIsAddingUrl(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] rounded-xl shadow-sm dark:shadow-xl overflow-hidden transition-colors">
      {/* Queue Header with Navigation Tabs (Stitch Direction B v3) */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#EDEAF5] dark:border-[#2D2945] bg-white dark:bg-[#1A1829]">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`text-sm font-semibold pb-1.5 transition-colors flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'text-[#7C3AED] dark:text-white border-b-2 border-[#7C3AED] dark:border-[#8B5CF6]'
                : 'text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white'
            }`}
          >
            <span>Up Next</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F3F0FA] dark:bg-[#8B5CF6]/20 text-[#6D28D9] dark:text-[#DDD6FE] font-mono">
              {queue.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`text-sm font-medium pb-1.5 transition-colors ${
              activeTab === 'info'
                ? 'text-[#7C3AED] dark:text-white border-b-2 border-[#7C3AED] dark:border-[#8B5CF6]'
                : 'text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white'
            }`}
          >
            Room Info
          </button>
        </div>

        {/* Load File & Add Music Actions */}
        <div className="flex items-center gap-2">
          <label
            className="flex items-center gap-1.5 rounded-full bg-[#F3F0FA] dark:bg-[#242138] hover:bg-[#EDEAF5] dark:hover:bg-[#2D2945] border border-[#EDEAF5] dark:border-[#2D2945] text-xs font-medium text-[#7C3AED] dark:text-[#DDD6FE] px-2.5 py-1 transition-colors cursor-pointer"
            title="Load local audio file"
          >
            <Upload className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#8B5CF6]" />
            <span className="hidden sm:inline">File</span>
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.flac"
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
            aria-label="Add YouTube URL"
            title="Add YouTube URL"
            className="flex items-center gap-1.5 rounded-full bg-mineral bg-[#7C3AED] dark:bg-[#8B5CF6] hover:bg-[#6D28D9] dark:hover:bg-[#7C3AED] text-white px-3 py-1 text-xs font-semibold shadow-md shadow-purple-500/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Music</span>
          </button>
        </div>
      </div>

      {/* Inline YouTube URL Input (Visible in Queue Tab) */}
      {activeTab === 'queue' && (
        <div className="p-3 bg-[#F8F7FC] dark:bg-[#12101F]/80 border-b border-[#EDEAF5] dark:border-[#2D2945]">
          <form onSubmit={handleInlineAddYouTube} className="flex items-center gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5E5873] dark:text-[#A19EB5]" />
              <input
                type="text"
                value={youtubeInputUrl}
                onChange={(e) => setYoutubeInputUrl(e.target.value)}
                placeholder="Paste YouTube link (e.g. https://youtu.be/...)"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-[#242138] border border-[#EDEAF5] dark:border-[#2D2945] focus:border-[#7C3AED] dark:focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#7C3AED] dark:focus:ring-[#8B5CF6] text-xs text-[#12101F] dark:text-white placeholder-[#8E88A8] dark:placeholder-[#6B6785] transition-colors outline-none shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isAddingUrl || !youtubeInputUrl.trim()}
              className="px-3 py-1.5 rounded-lg bg-[#F43F5E] hover:bg-[#e11d48] dark:bg-[#FF5C8A] dark:hover:bg-[#ff477b] disabled:opacity-50 text-white text-xs font-semibold shrink-0 transition-transform active:scale-95 flex items-center gap-1 shadow-md shadow-pink-500/20"
            >
              {isAddingUrl ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding…</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Queue</span>
                </>
              )}
            </button>
          </form>

          {inputError && (
            <p className="mt-1.5 text-[11px] text-[#FF5C8A] flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{inputError}</span>
            </p>
          )}
        </div>
      )}

      {/* Tab 1: Queue Scroll Area */}
      {activeTab === 'queue' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {/* CURRENTLY PLAYING ITEM (Elevated Highlight Card - Direction B v3) */}
          {currentTrack && (
            <div
              onClick={() => selectTrack(currentTrack.id)}
              className="p-3 rounded-xl bg-[#F5F2FC] dark:bg-gradient-to-r dark:from-[#242138] dark:to-[#1F1C33] border border-[#DDD6FE] dark:border-[#8B5CF6]/50 shadow-sm dark:shadow-lg relative cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#4ADE80]/15 border border-emerald-200 dark:border-[#4ADE80]/30 text-[10px] font-bold text-emerald-700 dark:text-[#4ADE80] uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#4ADE80] animate-ping" />
                  <span>Playing Now</span>
                </div>
                <div className="flex items-end gap-[2px] h-3.5">
                  <span className="w-[2px] bg-[#7C3AED] dark:bg-[#8B5CF6] rounded-full eq-1" />
                  <span className="w-[2px] bg-[#7C3AED] dark:bg-[#8B5CF6] rounded-full eq-2" />
                  <span className="w-[2px] bg-[#7C3AED] dark:bg-[#8B5CF6] rounded-full eq-3" />
                  <span className="w-[2px] bg-[#7C3AED] dark:bg-[#8B5CF6] rounded-full eq-4" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <TrackThumb track={currentTrack} isCurrent={true} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[#12101F] dark:text-white truncate group-hover:text-[#7C3AED] dark:group-hover:text-[#DDD6FE]">
                    {currentTrack.title}
                  </h4>
                  <p className="text-xs text-[#5E5873] dark:text-[#A19EB5] truncate">
                    {currentTrack.artist}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-medium text-[#12101F] dark:text-white">
                    {currentTrack.durationSeconds > 0 ? formatTime(currentTrack.durationSeconds) : '—:—'}
                  </span>
                  <p className="text-[10px] text-[#8E88A8] dark:text-[#6B6785]">via {currentTrack.addedBy.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* UPCOMING TRACKS IN SHARED QUEUE */}
          {queue.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Disc3 className="w-10 h-10 text-[#7C3AED]/50 dark:text-[#8B5CF6]/50 mx-auto animate-spin-slow mb-3" />
              <p className="text-sm font-semibold text-[#12101F] dark:text-white">The queue is empty</p>
              <p className="text-xs text-[#5E5873] dark:text-[#A19EB5] mt-1 max-w-xs mx-auto">
                Paste any YouTube link above or click Add Music to start the session.
              </p>
            </div>
          ) : (
            queue.map((track, idx) => {
              const isCurrent = track.id === currentTrack?.id;

              return (
                <div
                  key={track.id}
                  onClick={() => selectTrack(track.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl transition-all border cursor-pointer ${
                    isCurrent
                      ? 'bg-[#F3F0FA] dark:bg-[#242138]/90 border-[#DDD6FE] dark:border-[#8B5CF6]/40 shadow-xs'
                      : 'hover:bg-[#F8F7FC] dark:hover:bg-[#242138]/60 border-transparent hover:border-[#EDEAF5] dark:hover:border-[#2D2945]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="w-4 text-xs font-mono font-semibold text-[#6B6785] text-center group-hover:text-white shrink-0">
                      {idx + 1}
                    </span>

                    <TrackThumb track={track} isCurrent={isCurrent} />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs truncate transition-colors ${
                            isCurrent ? 'font-semibold text-[#12101F] dark:text-white' : 'font-medium text-[#12101F] dark:text-[#DDD6FE] group-hover:text-[#7C3AED] dark:group-hover:text-white'
                          }`}
                        >
                          {track.title}
                        </span>
                        {track.sourceType === 'youtube' && (
                          <span className="rounded-[3px] bg-[#F3F0FA] dark:bg-[#242138] text-[#7C3AED] dark:text-[#DDD6FE] border border-[#EDEAF5] dark:border-[#2D2945] px-1 py-0.2 text-[9px] font-sans font-medium shrink-0">
                            YouTube
                          </span>
                        )}
                        {track.sourceType === 'shared-audio' && (
                          <span className="rounded-[3px] bg-[#7C3AED]/10 dark:bg-[#8B5CF6]/20 text-[#7C3AED] dark:text-[#DDD6FE] border border-[#DDD6FE] dark:border-[#8B5CF6]/30 px-1 py-0.2 text-[9px] font-sans font-medium shrink-0">
                            Shared
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#5E5873] dark:text-[#A19EB5] mt-0.5">
                        <span className="truncate">{track.artist}</span>
                        <span className="text-[#8E88A8] dark:text-[#6B6785]">•</span>
                        <span className="truncate text-[#8E88A8] dark:text-[#6B6785] text-[10px]">via {track.addedBy.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-[#5E5873] dark:text-[#A19EB5]">
                      {track.durationSeconds > 0 ? formatTime(track.durationSeconds) : '—:—'}
                    </span>

                    {/* Local file sharing */}
                    {track.isLocalFile && (
                      <button
                        type="button"
                        disabled={sharingTrackId === track.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void shareLocalAudioFile(track.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-[#8B5CF6]/50 px-2 py-0.5 text-[10px] text-[#DDD6FE] hover:bg-[#8B5CF6]/10 disabled:opacity-60"
                        title="Share audio copy with room"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{sharingTrackId === track.id ? 'Sharing…' : 'Share'}</span>
                      </button>
                    )}

                    {/* Skip vote */}
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          voteSkip(track.id);
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                          track.userVotedSkip
                            ? 'bg-[#FF5C8A]/20 text-[#FF5C8A] border border-[#FF5C8A]/40'
                            : 'bg-[#242138] text-[#A19EB5] hover:text-white border border-[#2D2945]'
                        }`}
                        title="Vote to skip track"
                      >
                        <ArrowUp className="w-3 h-3" />
                        <span className="font-mono text-[11px]">{track.skipVotes}</span>
                      </button>
                    )}

                    {/* Remove track */}
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTrack(track.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#A19EB5] hover:text-[#FF5C8A] transition-opacity"
                        aria-label="Remove track from queue"
                        title="Remove track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Drag handle */}
                    <span className="text-[#6B6785] group-hover:text-[#A19EB5] p-0.5">
                      <GripVertical className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Tab 2: Room Info Tab */
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#5E5873] dark:text-[#A19EB5]">
          <div>
            <h4 className="text-[#12101F] dark:text-white font-semibold text-sm mb-1">{currentRoom.title}</h4>
            <p className="leading-relaxed">{currentRoom.description}</p>
          </div>
          <div className="pt-3 border-t border-[#EDEAF5] dark:border-[#2D2945] space-y-2">
            <div className="flex items-center justify-between">
              <span>Mode</span>
              <span className="text-[#12101F] dark:text-white font-medium capitalize">{currentRoom.mode || 'Collaborative'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Host</span>
              <span className="text-[#12101F] dark:text-white font-medium">{currentRoom.host?.name || 'NOCTURNE'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Vibe</span>
              <span className="text-[#12101F] dark:text-white font-medium">{currentRoom.vibeTag}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Artwork ID</span>
              <span className="font-mono text-[#6D28D9] dark:text-[#DDD6FE]">[{currentRoom.artworkId?.toUpperCase() || 'NOC-01'}]</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Collaborative Status Banner (Stitch Direction B v3) */}
      <div className="px-4 py-3 border-t border-[#EDEAF5] dark:border-[#2D2945] bg-white dark:bg-[#1A1829] flex items-center justify-between text-xs text-[#5E5873] dark:text-[#A19EB5]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
          <span>Collaborative Queue • Anyone can add tracks</span>
        </div>
        <span className="text-[#DDD6FE] text-[11px] font-medium">Auto-sync</span>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useLounge } from '@/context/LoungeContext';
import { formatTime, parseYouTubeVideoId } from '@/lib/utils';
import {
  Youtube,
  ChevronDown,
  X,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';

export const QueueDock: React.FC = () => {
  const {
    currentRoom,
    queue,
    currentTrack,
    removeTrack,
    addTrackToQueue,
    clientId,
    clientName,
  } = useLounge();

  const [youtubeInputUrl, setYoutubeInputUrl] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);

  // Role check: Host vs Member
  const isHost = Boolean(
    currentRoom?.host?.id && (currentRoom.host.id === clientId || currentRoom.host.name === clientName)
  );

  // Strict FIFO queue: all tracks after the active track
  const currentIdx = queue.findIndex((t) => t.id === currentTrack?.id);
  const upcomingQueue = currentIdx >= 0 ? queue.slice(currentIdx + 1) : queue;
  const nextTrack = upcomingQueue.length > 0 ? upcomingQueue[0] : null;

  // Handle adding a YouTube URL directly from the inline composer capsule
  const handleInlineAddYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = youtubeInputUrl.trim();
    if (!url || isAddingUrl) return;

    const videoId = parseYouTubeVideoId(url);
    if (!videoId) {
      setInputError('Please enter a valid YouTube video URL or ID.');
      return;
    }

    setIsAddingUrl(true);
    setInputError(null);

    try {
      const res = await fetch(`/api/youtube/info?id=${encodeURIComponent(videoId)}`);
      let info: any = null;
      try {
        info = await res.json();
      } catch {}

      let title = 'YouTube Track';
      let artist = 'YouTube Broadcast';
      let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      let durationSeconds = 0;

      if (res.ok && info && info.valid !== false) {
        title = info.title || title;
        artist = info.artist || artist;
        thumbnail = info.thumbnail || thumbnail;
        durationSeconds = info.durationSeconds || 0;
      } else if (res.status === 400 || (info && info.valid === false && res.status !== 503)) {
        setInputError(info?.error || 'Could not resolve YouTube video info.');
        setIsAddingUrl(false);
        return;
      }

      if (!info) {
        info = { durationSeconds: 0 };
      }

      const didAdd = await addTrackToQueue({
        title: title || 'YouTube Track',
        artist: artist || 'YouTube Broadcast',
        youtubeId: (info && info.videoId) || videoId,
        durationSeconds: info.durationSeconds || 0,
        artworkId: currentRoom?.artworkId || 'noc-01',
        albumArt: thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        sourceType: 'youtube',
      });

      if (didAdd) {
        setYoutubeInputUrl('');
        setInputError(null);
      } else {
        setInputError('Failed to add track to queue. Please try again.');
      }
    } catch (err: any) {
      setInputError(err?.message || 'Error processing YouTube URL.');
    } finally {
      setIsAddingUrl(false);
    }
  };

  return (
    <div className="w-full bg-[var(--bg-panel)] border-b border-[var(--border-subtle)] shrink-0 relative z-20 flex flex-col">
      {/* ================================================================== */}
      {/* ROW 1 (44px): Unified Composer Capsule                              */}
      {/* Invariant: Add YouTube URL                                         */}
      {/* Invariant: Add Music                                               */}
      {/* Invariant: bg-mineral                                              */}
      {/* ================================================================== */}
      <div className="h-[44px] px-3 flex items-center border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] shrink-0">
        <form onSubmit={handleInlineAddYouTube} className="w-full">
          <div className="w-full h-8 rounded-lg bg-[var(--bg-recessed)] border border-[var(--border-subtle)] focus-within:border-[#8B5CF6]/50 px-2.5 flex items-center gap-2 transition-colors shadow-inner">
            <Youtube className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <input
              type="text"
              value={youtubeInputUrl}
              onChange={(e) => {
                setYoutubeInputUrl(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder="Paste YouTube URL..."
              className="flex-1 bg-transparent border-none p-0 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-0 focus:outline-none min-w-0"
              aria-label="Add YouTube URL"
            />
            <button
              type="submit"
              disabled={isAddingUrl || !youtubeInputUrl.trim()}
              className="h-6 px-2.5 rounded-md bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white text-[11px] font-medium shrink-0 flex items-center gap-1 transition-colors"
              title="Add YouTube URL"
            >
              {isAddingUrl ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Adding…</span>
                </>
              ) : (
                <span>+ Add</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Persistent Inline Error Banner */}
      {inputError && (
        <div className="px-3 py-1.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-2 shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{inputError}</span>
          </div>
          <button
            type="button"
            onClick={() => setInputError(null)}
            className="text-rose-400 hover:text-white p-0.5 shrink-0"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ================================================================== */}
      {/* ROW 2 (44px): Expandable Up Next Drawer Trigger                     */}
      {/* ================================================================== */}
      <div
        onClick={() => setIsQueueExpanded(!isQueueExpanded)}
        className="h-[44px] px-3.5 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-elevated)]/60 transition-colors select-none shrink-0"
        title={isQueueExpanded ? 'Collapse queue' : 'Expand upcoming queue'}
      >
        <span className="flex items-center gap-1.5 font-mono text-xs text-[var(--text-primary)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
          <span>
            Up Next · {upcomingQueue.length} {upcomingQueue.length === 1 ? 'track' : 'tracks'}
          </span>
        </span>

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs text-[var(--text-muted)] truncate max-w-[165px]">
            {nextTrack ? `Next: ${nextTrack.title}` : 'Queue empty'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 shrink-0 ${
              isQueueExpanded ? 'rotate-180 text-[var(--text-primary)]' : ''
            }`}
          />
        </div>
      </div>

      {/* ================================================================== */}
      {/* EXPANDABLE FIFO QUEUE SHEET (Opens directly below Row 2)           */}
      {/* ================================================================== */}
      {isQueueExpanded && (
        <div className="max-h-[260px] overflow-y-auto bg-[var(--bg-panel)] border-t border-[var(--border-subtle)] shadow-2xl z-30 transition-all divide-y divide-[var(--border-subtle)]/50">
          {upcomingQueue.length === 0 ? (
            <div className="p-4 text-xs font-mono text-[var(--text-muted)] text-center leading-relaxed">
              Queue is empty — paste a YouTube link above to line up the next track.
            </div>
          ) : (
            upcomingQueue.map((track, idx) => {
              // Role-gated removal: Host can remove any; Member only tracks they added
              const canRemove = Boolean(
                isHost ||
                (track.addedBy?.id && track.addedBy.id === clientId) ||
                ((track as any).addedByUid && (track as any).addedByUid === clientId)
              );

              return (
                <div
                  key={track.id}
                  className="px-3 py-2 flex items-center justify-between gap-2.5 hover:bg-[var(--bg-recessed)]/60 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Monospace index */}
                    <span className="font-mono text-[11px] text-[var(--text-muted)] w-5 shrink-0 text-center">
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    {/* 32x32 Thumbnail */}
                    <div className="w-8 h-8 rounded-md overflow-hidden bg-black shrink-0 border border-white/10 relative">
                      {track.albumArt ? (
                        <img
                          src={track.albumArt}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#181324] flex items-center justify-center text-[9px] font-mono text-zinc-400">
                          YT
                        </div>
                      )}
                    </div>

                    {/* Title & Curator */}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-medium text-[var(--text-primary)] truncate">
                        {track.title}
                      </h4>
                      <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                        Added by {track.addedBy?.name || 'Curator'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Duration & Remove action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
                      {track.durationSeconds > 0 ? formatTime(track.durationSeconds) : '—:—'}
                    </span>

                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => removeTrack(track.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-rose-400 transition-all"
                        title="Remove from queue"
                        aria-label="Remove track"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

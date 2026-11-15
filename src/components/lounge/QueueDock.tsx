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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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

    const isPlaylistUrl = /[?&]list=([a-zA-Z0-9_-]+)/.test(url) && (!url.includes('v=') || url.includes('/playlist'));
    const videoId = parseYouTubeVideoId(url);
    if (!videoId && !isPlaylistUrl) {
      setInputError('Please enter a valid YouTube video or playlist URL.');
      return;
    }

    setIsAddingUrl(true);
    setInputError(null);

    try {
      const endpoint = isPlaylistUrl
        ? `/api/youtube/info?url=${encodeURIComponent(url)}`
        : `/api/youtube/info?id=${encodeURIComponent(videoId!)}`;

      const res = await fetch(endpoint);
      let info: any = null;
      try {
        info = await res.json();
      } catch {}

      // Handle Playlist batch insertion
      if (info && info.isPlaylist && Array.isArray(info.tracks)) {
        if (info.tracks.length === 0) {
          setInputError('Playlist is empty or contains no accessible tracks.');
          setIsAddingUrl(false);
          return;
        }

        for (const track of info.tracks) {
          await addTrackToQueue({
            title: track.title || 'YouTube Track',
            artist: info.playlistTitle || 'YouTube Playlist',
            youtubeId: track.youtubeId,
            durationSeconds: track.durationSeconds || 0,
            artworkId: currentRoom?.artworkId || 'noc-01',
            albumArt: track.thumbnailUrl || `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`,
            sourceType: 'youtube',
          });
        }

        setYoutubeInputUrl('');
        setInputError(null);
        return;
      }

      let title = 'YouTube Track';
      let artist = 'YouTube Broadcast';
      let thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';
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
        youtubeId: (info && info.videoId) || videoId || '',
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
    <>
      {/* Desktop Locked 88px Right Dock Architecture (hidden on mobile < lg) */}
      <div className="hidden lg:flex flex-col w-full bg-[var(--bg-panel)] border-b border-[var(--border-subtle)] shrink-0 relative z-20">
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

      {/* ================================================================== */}
      {/* 2. MOBILE PERSISTENT 40px UP NEXT BAR (< lg)                         */}
      {/* ================================================================== */}
      <div
        onClick={() => setIsMobileDrawerOpen(true)}
        className="lg:hidden h-10 px-3.5 flex items-center justify-between cursor-pointer bg-[var(--bg-panel)] border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]/60 transition-colors select-none shrink-0"
        title="Open Queue & Add Music"
      >
        <span className="flex items-center gap-1.5 font-mono text-xs text-[var(--text-primary)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
          <span>
            Up Next · {upcomingQueue.length} {upcomingQueue.length === 1 ? 'track' : 'tracks'}
          </span>
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMobileDrawerOpen(true);
          }}
          className="text-xs font-mono font-medium text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-1 transition-colors"
        >
          <span>▲ Queue / + Add</span>
        </button>
      </div>

      {/* ================================================================== */}
      {/* 3. MOBILE 75dvh SLIDE-UP BOTTOM SHEET DRAWER                         */}
      {/* ================================================================== */}
      {isMobileDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* 75dvh Sheet */}
          <div className="fixed inset-x-0 bottom-0 h-[75dvh] z-50 rounded-t-2xl bg-[var(--bg-panel)] border-t border-[var(--border-subtle)] shadow-2xl flex flex-col lg:hidden animate-in slide-in-from-bottom duration-200">
            {/* Top Drag Handle + Header */}
            <div className="pt-2.5 pb-2 px-4 border-b border-[var(--border-subtle)] flex flex-col gap-1.5 shrink-0">
              <div className="w-10 h-1 rounded-full bg-[var(--border-subtle)] self-center mb-1" />
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                  <span>Up Next · {upcomingQueue.length} {upcomingQueue.length === 1 ? 'track' : 'tracks'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-recessed)] transition-colors"
                  aria-label="Close queue sheet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pinned YouTube URL Composer Capsule */}
            <div className="p-3 border-b border-[var(--border-subtle)] bg-[var(--bg-recessed)]/50 shrink-0">
              <form onSubmit={handleInlineAddYouTube} className="w-full">
                <div className="w-full h-9 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] focus-within:border-[#8B5CF6]/50 px-2.5 flex items-center gap-2 transition-colors shadow-inner">
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
                    className="h-7 px-3 rounded-md bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white text-xs font-medium shrink-0 flex items-center gap-1 transition-colors"
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

              {inputError && (
                <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-md flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{inputError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInputError(null)}
                    className="text-rose-400 hover:text-white p-0.5 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable Queue List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]/50 p-2">
              {upcomingQueue.length === 0 ? (
                <div className="p-8 text-xs font-mono text-[var(--text-muted)] text-center leading-relaxed">
                  Queue is empty — paste a YouTube link above to line up the next track.
                </div>
              ) : (
                upcomingQueue.map((track, idx) => {
                  const canRemove = Boolean(
                    isHost ||
                    (track.addedBy?.id && track.addedBy.id === clientId) ||
                    ((track as any).addedByUid && (track as any).addedByUid === clientId)
                  );

                  return (
                    <div
                      key={track.id}
                      className="px-3 py-2.5 flex items-center justify-between gap-2.5 hover:bg-[var(--bg-recessed)]/60 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="font-mono text-xs text-[var(--text-muted)] w-5 shrink-0 text-center">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="w-9 h-9 rounded-md overflow-hidden bg-black shrink-0 border border-white/10 relative">
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
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-medium text-[var(--text-primary)] truncate">
                            {track.title}
                          </h4>
                          <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                            Added by {track.addedBy?.name || 'Curator'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          {track.durationSeconds > 0 ? formatTime(track.durationSeconds) : '—:—'}
                        </span>
                        {canRemove && (
                          <button
                            type="button"
                            onClick={() => removeTrack(track.id)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all"
                            title="Remove from queue"
                            aria-label="Remove track"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

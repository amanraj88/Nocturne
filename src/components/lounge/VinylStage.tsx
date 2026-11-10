import React, { useState, useEffect, useRef } from 'react';
import { useLounge } from '@/context/LoungeContext';
import { AudioVisualizer } from './AudioVisualizer';
import { ArtworkRenderer } from '@/components/artwork';
import { formatTime } from '@/lib/utils';
import { Heart, Share2, Check, Tv, Disc, AlertCircle, SkipForward } from 'lucide-react';

export const VinylStage: React.FC = () => {
  const {
    currentRoom,
    currentTrack,
    isPlaying,
    progressSeconds,
    durationSeconds,
    youtubePlaybackBlocked,
    audioPlaybackBlocked,
    seekTo,
    skipTrack,
    hasPhysicalAudio,
    isYouTubeActive,
    audioError,
    sendChatMessage,
    registerYouTubePlayer,
    syncYouTubePlaybackState,
    setYouTubePlaybackBlocked,
  } = useLounge();

  const [isLiked, setIsLiked] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [viewMode, setViewMode] = useState<'monitor' | 'sleeve'>('monitor');
  const [ytErrorNotice, setYtErrorNotice] = useState<string | null>(null);

  const ytPlayerInstanceRef = useRef<any>(null);
  const isScriptLoadedRef = useRef(false);
  const skipTrackRef = useRef(skipTrack);
  skipTrackRef.current = skipTrack;
  const syncYouTubePlaybackStateRef = useRef(syncYouTubePlaybackState);
  syncYouTubePlaybackStateRef.current = syncYouTubePlaybackState;
  const autoplayBlockedRef = useRef(false);
  const progressSecondsRef = useRef(progressSeconds);
  progressSecondsRef.current = progressSeconds;

  const progressPercent = durationSeconds > 0 ? (progressSeconds / durationSeconds) * 100 : 0;

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo((val / 100) * durationSeconds);
  };

  const copyRoomLink = async () => {
    try {
      if (typeof window !== 'undefined') {
        const url = window.location.href;
        let copied = false;
        if (navigator?.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(url);
            copied = true;
          } catch {
            copied = false;
          }
        }
        if (!copied) {
          const ta = document.createElement('textarea');
          ta.value = url;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try {
            copied = document.execCommand('copy');
          } finally {
            document.body.removeChild(ta);
          }
        }
        if (!copied) throw new Error('Clipboard copy was denied.');
        setCopyStatus('copied');
        sendChatMessage('Copied shareable lounge link to clipboard.');
        setTimeout(() => setCopyStatus('idle'), 2500);
      }
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  // Dynamically load YouTube IFrame API script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.YT) {
      const existing = document.getElementById('nocturne-yt-api-script');
      if (!existing) {
        const tag = document.createElement('script');
        tag.id = 'nocturne-yt-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
        isScriptLoadedRef.current = true;
      }
    }
  }, []);

  // Initialize official YouTube IFrame Player
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let destroyed = false;

    const setupPlayer = () => {
      if (destroyed) return;
      if (!window.YT || !window.YT.Player) {
        setTimeout(setupPlayer, 150);
        return;
      }

      const playerElement = document.getElementById('nocturne-yt-player');
      if (!playerElement) return;

      // Avoid re-creating if player already initialized on this DOM element
      if (ytPlayerInstanceRef.current) return;

      try {
        const player = new window.YT.Player('nocturne-yt-player', {
          ...(currentTrack?.youtubeId ? { videoId: currentTrack.youtubeId } : {}),
          playerVars: {
            autoplay: 0,
            controls: 1, // Official YouTube player controls visible and unobstructed
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              ytPlayerInstanceRef.current = event.target;
              registerYouTubePlayer(event.target);
            },
            onStateChange: (event: any) => {
              const player = event.target;
              const eventVideoId = player?.getVideoData?.()?.video_id;
              if (currentYoutubeIdRef.current && eventVideoId && eventVideoId !== currentYoutubeIdRef.current) return;

              // The IFrame briefly reports PAUSED while replacing a video. Confirm after its state settles.
              if (event.data === 1) {
                autoplayBlockedRef.current = false;
                setYouTubePlaybackBlocked(false);
                setYtErrorNotice(null);
                const targetSeconds = progressSecondsRef.current;
                const currentSeconds = player?.getCurrentTime?.();
                if (targetSeconds > 2 && typeof currentSeconds === 'number' && Math.abs(currentSeconds - targetSeconds) > 2) {
                  try { player.seekTo(targetSeconds, true); } catch (err) {}
                }
                syncYouTubePlaybackStateRef.current(true);
              }
              if (event.data === 5 && progressSecondsRef.current > 2) {
                try { player.seekTo(progressSecondsRef.current, true); } catch (err) {}
              }
              if (event.data === 2) {
                window.setTimeout(() => {
                  const settledState = player?.getPlayerState?.();
                  const settledVideoId = player?.getVideoData?.()?.video_id;
                  if (destroyed || settledState !== 2) return;
                  if (currentYoutubeIdRef.current && settledVideoId && settledVideoId !== currentYoutubeIdRef.current) return;
                  if (autoplayBlockedRef.current) return;
                  if (document.visibilityState !== 'visible') return;
                  syncYouTubePlaybackStateRef.current(false);
                }, 250);
              }
              if (event.data === 0) {
                syncYouTubePlaybackStateRef.current(false);
                skipTrackRef.current(true);
              }
            },
            onError: (event: any) => {
              const errorVideoId = event.target?.getVideoData?.()?.video_id;
              if (currentYoutubeIdRef.current && errorVideoId && errorVideoId !== currentYoutubeIdRef.current) return;
              syncYouTubePlaybackStateRef.current(false);
              const code = event.data;
              let msg = 'YouTube playback error.';
              if (code === 2) msg = 'Invalid YouTube video ID parameter.';
              else if (code === 5) msg = 'HTML5 player rendering error.';
              else if (code === 100) msg = 'This video is unavailable, private, or removed.';
              else if (code === 101 || code === 150) {
                msg = 'This video could not play here. Check that the link is valid and embeddable.';
              }
              setYtErrorNotice(msg);
            },
            onAutoplayBlocked: () => {
              autoplayBlockedRef.current = true;
              setYouTubePlaybackBlocked(true);
              setYtErrorNotice('Playback needs a tap in this tab. Press the room play button to join.');
            },
          },
        });
      } catch (err) {
        console.warn('YouTube Player initialization notice:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      window.onYouTubeIframeAPIReady = setupPlayer;
    }

    return () => {
      destroyed = true;
    };
  }, [registerYouTubePlayer]);

  useEffect(() => {
    const resumeVisibleRoomPlayback = () => {
      if (document.visibilityState !== 'visible' || !isYouTubeActive || !isPlaying) return;
      const player = ytPlayerInstanceRef.current;
      if (player && player.getPlayerState?.() !== 1) {
        try { player.playVideo(); } catch (err) {}
      }
    };

    document.addEventListener('visibilitychange', resumeVisibleRoomPlayback);
    return () => document.removeEventListener('visibilitychange', resumeVisibleRoomPlayback);
  }, [isYouTubeActive, isPlaying]);

  const currentYoutubeIdRef = useRef(currentTrack?.youtubeId || '');
  currentYoutubeIdRef.current = currentTrack?.youtubeId || '';

  // Determine artwork identifier based on current track or room
  const activeArtworkId = currentTrack?.artworkId || currentRoom.artworkId || 'noc-01';
  const displayTitle = currentTrack?.title || 'No track selected';
  const displayArtist = currentTrack?.artist || 'Add a YouTube link or local audio file to begin listening.';
  const catalogMark = activeArtworkId.toUpperCase();

  // Spindle label accent styling matched to room identity
  const spindleAccentClass =
    activeArtworkId === 'noc-03'
      ? 'border-oxide/70 text-oxide'
      : activeArtworkId === 'noc-02'
      ? 'border-warm-bone/70 text-warm-bone'
      : 'border-mineral/70 text-mineral';

  const showVideoAsMain = isYouTubeActive;

  return (
    <div className="relative flex flex-col items-center justify-start py-3 px-3 sm:py-6 sm:px-6 lg:py-8 lg:px-8 w-full max-w-full mx-auto overflow-x-hidden shrink-0">
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Release Metadata Header with Discreet Quick Actions */}
        <div className="flex items-center justify-between w-full max-w-[316px] sm:max-w-[360px] md:max-w-[420px] lg:max-w-[480px] mb-3 text-ash px-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="font-mono text-[11px] sm:text-xs text-ash">
              [{isYouTubeActive ? 'YT' : catalogMark}]
            </span>
            <span className="text-graphite font-mono hidden sm:inline">/</span>
            <span className="font-sans text-xs text-ash font-medium hidden sm:inline">
              {isYouTubeActive ? 'Official YouTube embed' : currentTrack?.isTestFixture ? 'Generated test tone' : currentTrack?.isLocalFile ? 'Local audio file' : currentTrack?.sourceType === 'shared-audio' ? 'Shared audio file' : currentTrack ? 'Audio source' : 'No track queued'}
            </span>
            <span className="text-graphite font-mono">/</span>
            <span className="font-sans text-[11px] sm:text-xs text-mineral flex items-center gap-1 font-medium">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPlaying ? 'bg-mineral animate-pulse' : 'bg-ash/50'
                }`}
              />
              {(youtubePlaybackBlocked || audioPlaybackBlocked) && isPlaying ? 'Tap to join' : isPlaying ? 'Playing' : currentTrack ? 'Standby' : 'Awaiting source'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Switcher for YouTube tracks: Video Monitor vs Sleeve */}
            {isYouTubeActive && (
              <div className="flex items-center bg-carbon border border-graphite rounded-[2px] p-0.5 mr-1">
                <button
                  type="button"
                  onClick={() => setViewMode('monitor')}
                  className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans font-medium rounded-[2px] transition-colors ${
                    viewMode === 'monitor'
                      ? 'bg-deep-ink text-mineral font-semibold'
                      : 'text-ash hover:text-warm-bone'
                  }`}
                  title="Display YouTube video monitor on stage"
                >
                  <Tv className="w-3 h-3" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('sleeve')}
                  className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans font-medium rounded-[2px] transition-colors ${
                    viewMode === 'sleeve'
                      ? 'bg-deep-ink text-mineral font-semibold'
                      : 'text-ash hover:text-warm-bone'
                  }`}
                  title="Display vinyl sleeve artwork"
                >
                  <Disc className="w-3 h-3" />
                  <span>Sleeve</span>
                </button>
              </div>
            )}

            {copyStatus === 'copied' && (
              <span
                role="status"
                aria-live="polite"
                className="text-[10px] font-sans font-medium text-mineral px-2 py-0.5 rounded-[2px] bg-carbon border border-graphite shrink-0"
              >
                Link copied
              </span>
            )}
            {copyStatus === 'error' && (
              <span
                role="status"
                aria-live="polite"
                className="text-[10px] font-sans font-medium text-oxide px-2 py-0.5 rounded-[2px] bg-carbon border border-oxide/40 shrink-0"
              >
                Copy failed
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsLiked(!isLiked)}
              className={`p-1.5 rounded-full transition-colors border ${
                isLiked
                  ? 'bg-mineral text-deep-ink border-mineral'
                  : 'bg-carbon text-ash border-graphite hover:text-warm-bone hover:border-mineral/50'
              }`}
              aria-label={isLiked ? 'Unlike track' : 'Favorite track'}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={copyRoomLink}
              className={`p-1.5 rounded-full bg-carbon text-ash border border-graphite hover:text-warm-bone hover:border-mineral/50 transition-colors ${
                copyStatus === 'copied' ? 'border-mineral text-mineral' : ''
              }`}
              aria-label="Share lounge link"
              title="Copy shareable lounge link"
            >
              {copyStatus === 'copied' ? (
                <Check className="w-3 h-3 text-mineral" />
              ) : (
                <Share2 className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Primary Stage Centerpiece: YouTube Video Monitor OR Vinyl Sleeve */}
        <div className="relative w-full max-w-[316px] sm:max-w-[360px] md:max-w-[420px] lg:max-w-[480px] mb-4">
          {/* Official YouTube Video Monitor Frame */}
          <div
            className={`w-full aspect-video rounded-[3px] bg-carbon border border-graphite shadow-md overflow-hidden relative ${
              showVideoAsMain ? 'block' : 'hidden'
            }`}
          >
            {/* YouTube IFrame Player Container (controls, branding & attribution completely visible and unobstructed) */}
            <div id="nocturne-yt-player" className="w-full h-full" />
          </div>

          {/* 12" Vinyl Sleeve & Peeking Record Stage */}
          <div
            className={`relative w-full aspect-square transition-transform duration-700 ease-out ${
              !showVideoAsMain || viewMode === 'sleeve' ? 'block' : 'hidden'
            } ${
              isPlaying
                ? '-translate-x-2.5 sm:-translate-x-4 lg:-translate-x-5'
                : 'translate-x-0'
            }`}
          >
            {/* Physical 180g Heavyweight Vinyl Disc */}
            <div
              className={`absolute top-1.5 -right-5 sm:-right-8 lg:-right-10 w-[94%] h-[94%] rounded-full bg-carbon border border-graphite flex items-center justify-center transition-transform duration-700 ease-out shadow-md ${
                isPlaying
                  ? 'translate-x-5 sm:translate-x-8 lg:translate-x-10'
                  : 'translate-x-0'
              }`}
            >
              <div
                className={`relative w-full h-full rounded-full flex items-center justify-center overflow-hidden border border-graphite/40 ${
                  isPlaying ? 'animate-spin-slow' : ''
                }`}
              >
                <div className="absolute inset-0 rounded-full pointer-events-none bg-[radial-gradient(circle,var(--tw-gradient-stops))] from-graphite via-carbon to-deep-ink" />
                <div className="absolute inset-[8%] rounded-full border border-graphite/30 pointer-events-none" />
                <div className="absolute inset-[16%] rounded-full border border-graphite/20 pointer-events-none" />
                <div className="absolute inset-[24%] rounded-full border border-graphite/35 pointer-events-none" />
                <div className="absolute inset-[32%] rounded-full border border-graphite/25 pointer-events-none" />
                <div className="absolute inset-[37%] rounded-full border border-graphite/50 pointer-events-none" />

                {/* Center Spindle Label */}
                <div
                  className={`relative z-10 w-[27%] h-[27%] rounded-full bg-deep-ink border ${spindleAccentClass} flex flex-col items-center justify-center p-1 text-center select-none shadow-sm`}
                >
                  <span className="font-sans text-[8px] sm:text-[9px] font-medium text-ash/80">
                    {catalogMark}
                  </span>
                  <span className="font-display font-bold text-[8px] sm:text-[10px] text-warm-bone tracking-tight leading-none mt-0.5">
                    NOCTURNE
                  </span>
                  <span className="font-sans text-[7px] text-ash/70 mt-0.5">
                    33⅓ RPM
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full bg-deep-ink border border-graphite mt-0.5" />
                </div>
              </div>
            </div>

            {/* Die-Cut Cardboard Jacket / Sleeve */}
            <div className="relative z-10 w-full h-full rounded-[3px] bg-carbon border border-graphite shadow-md overflow-hidden flex flex-col justify-between">
              <div className="relative w-full flex-1 overflow-hidden bg-deep-ink">
                <ArtworkRenderer artworkId={activeArtworkId} className="w-full h-full" />
                <div className="absolute top-0 right-0 bottom-0 w-3 bg-gradient-to-l from-deep-ink/50 to-transparent pointer-events-none" />
              </div>

              <div className="shrink-0 px-3 py-2 border-t border-graphite/70 bg-carbon flex items-center justify-between text-[11px] font-sans">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-warm-bone font-medium">
                    {catalogMark}
                  </span>
                  <span className="text-graphite font-mono">/</span>
                  <span className="text-ash truncate max-w-[170px] sm:max-w-[220px]">
                    {displayTitle}
                  </span>
                </div>
                {currentTrack?.sourceType === 'shared-audio' && (
                  <span className="font-sans text-ash/70 text-[10px]">Shared room audio</span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Track Title & Artist Information Display */}
        <div className="text-center max-w-[316px] sm:max-w-[360px] md:max-w-md mb-2 sm:mb-3 px-2">
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-warm-bone truncate leading-tight">
            {displayTitle}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-ash mt-0.5 truncate">
            {displayArtist}
          </p>

          <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-ash">
            {currentTrack && <>
              <span>Queued by {currentTrack.addedBy.name}</span>
              <span className="text-graphite font-mono">·</span>
              <span className="font-mono text-[11px]">{currentTrack.addedAt}</span>
            </>}
          </div>
        </div>

        {/* YouTube Video Error Alert if embedding is restricted */}
        {ytErrorNotice && (
          <div
            role="alert"
            aria-live="polite"
            className="w-full max-w-[316px] sm:max-w-[360px] md:max-w-md p-2.5 rounded-[2px] bg-oxide/15 border border-oxide/50 text-oxide text-xs mb-3 flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{ytErrorNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => skipTrack(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-[2px] bg-oxide/20 hover:bg-oxide/30 border border-oxide/60 text-warm-bone text-[10px] font-sans font-medium shrink-0"
            >
              <SkipForward className="w-3 h-3" />
              <span>Next</span>
            </button>
          </div>
        )}

        {/* Acoustic Harmonic Amplitude Monitor */}
        <div className="w-full max-w-[280px] sm:max-w-md mb-2 sm:mb-3 px-1 sm:px-2">
          <AudioVisualizer lineCount={44} />
        </div>

        {/* Console Scrubber Strip */}
        <div className="w-full max-w-[280px] sm:max-w-md space-y-2 px-1 sm:px-2">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progressPercent}
              onChange={handleScrubberChange}
              className="w-full h-1.5 bg-carbon rounded-none appearance-none cursor-pointer accent-mineral border border-graphite/60"
              disabled={!currentTrack || durationSeconds <= 0}
              aria-label="Track playback progress"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-ash px-0.5">
            <span className="font-mono text-warm-bone text-[11px] sm:text-xs">
              {formatTime(progressSeconds)}
            </span>
            <span className="font-mono text-warm-bone text-[11px] sm:text-xs">
              {formatTime(durationSeconds)}
            </span>
          </div>

          {/* Audio Engine & Sync Status Bar */}
          <div className="flex items-center justify-between text-[11px] text-ash/80 px-0.5 pt-1.5 border-t border-graphite/40">
            <span className="font-sans flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isYouTubeActive
                    ? 'bg-mineral'
                    : hasPhysicalAudio
                    ? 'bg-mineral'
                    : 'bg-ash/40'
                }`}
              />
              <span className="text-[10px] sm:text-[11px]">
                {isYouTubeActive
                  ? 'YouTube embed'
                  : hasPhysicalAudio
                  ? currentTrack?.isLocalFile
                    ? `Local audio (${currentTrack?.fileSize || 'file'})`
                    : currentTrack?.sourceType === 'shared-audio'
                    ? 'Shared room audio'
                    : currentTrack?.isTestFixture
                    ? 'Generated test tone fixture'
                    : 'Audio source'
                  : currentTrack ? 'No playable audio source' : 'No source selected'}
              </span>
            </span>
          </div>

          {/* Explicit Notice regarding Local Audio Privacy in Shared Rooms */}
          {hasPhysicalAudio && currentTrack?.isLocalFile && (
            <div className="p-2 rounded-[2px] bg-carbon border border-graphite text-[10px] sm:text-[11px] text-ash/90 mt-1.5 leading-relaxed font-sans">
              <span className="font-medium text-warm-bone">Local Master Audio:</span>{' '}
              This file plays only on your device unless you choose “Share with room” in the tracklist. Sharing uploads an audio copy so room guests can stream it.
            </div>
          )}

          {audioError && (
            <div
              role="alert"
              aria-live="polite"
              className="p-2 rounded-[2px] bg-oxide/10 border border-oxide/40 text-oxide text-xs mt-2"
            >
              {audioError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

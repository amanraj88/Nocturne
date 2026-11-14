import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLounge } from '@/context/LoungeContext';
import { ArtworkRenderer } from '@/components/artwork';
import { formatTime } from '@/lib/utils';
import {
  Heart,
  Maximize2,
  Minimize2,
  Tv,
  Image as ImageIcon,
  SkipForward,
  SkipBack,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Radio,
  AlertCircle,
} from 'lucide-react';

export const VinylStage: React.FC = () => {
  const {
    currentRoom,
    currentTrack,
    isPlaying,
    progressSeconds,
    durationSeconds,
    youtubePlaybackBlocked,
    audioPlaybackBlocked,
    togglePlay,
    seekTo,
    skipTrack,
    previousTrack,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    clientId,
    clientName,
    registerYouTubePlayer,
    registerYouTubeDuration,
    syncYouTubePlaybackState,
    setYouTubePlaybackBlocked,
    triggerReaction,
  } = useLounge();

  // Role check: Host vs Member
  const isHost = Boolean(
    currentRoom?.host?.id && (currentRoom.host.id === clientId || currentRoom.host.name === clientName)
  );

  // View mode: default to 'artwork'
  const [viewMode, setViewMode] = useState<'video' | 'artwork'>('artwork');
  const isVideoVisible = Boolean(currentTrack?.youtubeId && viewMode === 'video');
  const [isLiked, setIsLiked] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ytErrorNotice, setYtErrorNotice] = useState<string | null>(null);

  const stageRootRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerInstanceRef = useRef<any>(null);
  const isInitializingPlayerRef = useRef(false);
  const loadedYoutubeIdRef = useRef<string | null>(null);
  const isSeekingDueToSyncRef = useRef(false);
  const isScriptLoadedRef = useRef(false);

  const skipTrackRef = useRef(skipTrack);
  skipTrackRef.current = skipTrack;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const syncYouTubePlaybackStateRef = useRef(syncYouTubePlaybackState);
  syncYouTubePlaybackStateRef.current = syncYouTubePlaybackState;
  const registerYouTubePlayerRef = useRef(registerYouTubePlayer);
  registerYouTubePlayerRef.current = registerYouTubePlayer;
  const registerYouTubeDurationRef = useRef(registerYouTubeDuration);
  registerYouTubeDurationRef.current = registerYouTubeDuration;
  const setYouTubePlaybackBlockedRef = useRef(setYouTubePlaybackBlocked);
  setYouTubePlaybackBlockedRef.current = setYouTubePlaybackBlocked;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const currentYoutubeIdRef = useRef<string | undefined>(currentTrack?.youtubeId);
  currentYoutubeIdRef.current = currentTrack?.youtubeId;
  const progressSecondsRef = useRef(progressSeconds);
  progressSecondsRef.current = progressSeconds;

  const progressPercent =
    durationSeconds > 0 ? Math.min(100, Math.max(0, (progressSeconds / durationSeconds) * 100)) : 0;

  // Waveform seek handler (Host only; members disabled)
  const handleWaveformSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHost || durationSeconds <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const targetRatio = clickX / rect.width;
    const targetSeconds = Math.round(targetRatio * durationSeconds);
    isSeekingDueToSyncRef.current = true;
    seekTo(targetSeconds, true);
    setTimeout(() => {
      isSeekingDueToSyncRef.current = false;
    }, 1500);
  };

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!stageRootRef.current) return;
    if (!document.fullscreenElement) {
      stageRootRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

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

  // Initialize official YouTube IFrame Player with persistent DOM presence and backup polling
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let destroyed = false;

    const setupPlayer = () => {
      if (destroyed) return;
      if (!window.YT || !window.YT.Player) {
        return;
      }

      const playerContainer = containerRef.current;
      if (!playerContainer) return;

      if (ytPlayerInstanceRef.current || isInitializingPlayerRef.current) return;
      isInitializingPlayerRef.current = true;

      // Ensure target element exists inside container
      let playerElement = document.getElementById('nocturne-yt-player');
      if (!playerElement) {
        playerElement = document.createElement('div');
        playerElement.id = 'nocturne-yt-player';
        playerElement.className = 'w-full h-full';
        playerContainer.appendChild(playerElement);
      }

      try {
        const activeYtId = currentYoutubeIdRef.current;
        const player = new window.YT.Player('nocturne-yt-player', {
          height: '100%',
          width: '100%',
          videoId: activeYtId || undefined,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin,
            playsinline: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: any) => {
              if (destroyed) return;
              isInitializingPlayerRef.current = false;
              ytPlayerInstanceRef.current = event.target;
              (window as any).__NOCTURNE_YT_PLAYER__ = event.target;
              registerYouTubePlayerRef.current(event.target);

              try {
                event.target.setVolume(volumeRef.current);
                if (isMutedRef.current) event.target.mute();
                else event.target.unMute();
              } catch (e) {}

              if (activeYtId) {
                loadedYoutubeIdRef.current = activeYtId;
                const startSec = Math.floor(progressSecondsRef.current || 0);
                if (isPlayingRef.current) {
                  event.target.loadVideoById({
                    videoId: activeYtId,
                    startSeconds: startSec,
                  });
                } else {
                  event.target.cueVideoById({
                    videoId: activeYtId,
                    startSeconds: startSec,
                  });
                }
              }
            },
            onStateChange: (event: any) => {
              if (destroyed) return;
              const state = event.data;

              // Read true video duration from live player
              const playerDur = event.target.getDuration?.();
              if (playerDur && playerDur > 0) {
                registerYouTubeDurationRef.current(playerDur);
              }

              if (state === window.YT.PlayerState.PLAYING) {
                setYouTubePlaybackBlockedRef.current(false);
                syncYouTubePlaybackStateRef.current(true);
                const player = event.target || ytPlayerInstanceRef.current;
                const targetSeconds = progressSecondsRef.current;
                const currentTime = player && typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
                if (Math.abs(currentTime - targetSeconds) > 2.5) {
                  if (player && typeof player.seekTo === 'function') {
                    try {
                      player.seekTo(targetSeconds, true);
                    } catch (err) {}
                  }
                }
              } else if (state === window.YT.PlayerState.PAUSED) {
                const currentTime = event.target.getCurrentTime?.() || 0;
                if (isPlayingRef.current && currentTime <= 0.5) {
                  setYouTubePlaybackBlockedRef.current(true);
                }
                syncYouTubePlaybackStateRef.current(false);
              } else if (state === window.YT.PlayerState.ENDED) {
                skipTrackRef.current(true);
              }
            },
            onError: (event: any) => {
              const code = event.data;
              console.warn('[NOCTURNE YouTube] Playback error code:', code);
              if (code === 101 || code === 150) {
                setYtErrorNotice('Playback is restricted by copyright owner on third-party sites.');
              } else if (code === 2 || code === 100) {
                setYtErrorNotice('This video is unavailable or has been removed.');
              } else {
                setYtErrorNotice('Playback failed. Skipping to next track in queue...');
              }
            },
          },
        });
      } catch (e) {
        isInitializingPlayerRef.current = false;
        console.error('[NOCTURNE YouTube] Setup error:', e);
      }
    };

    setupPlayer();
    const pollTimer = window.setInterval(() => {
      if (!ytPlayerInstanceRef.current && !isInitializingPlayerRef.current) {
        setupPlayer();
      }
    }, 500);

    return () => {
      destroyed = true;
      isInitializingPlayerRef.current = false;
      window.clearInterval(pollTimer);
      if (ytPlayerInstanceRef.current) {
        try {
          ytPlayerInstanceRef.current.destroy();
        } catch (e) {}
        ytPlayerInstanceRef.current = null;
      }
      registerYouTubePlayer(null);
    };
  }, []);

  // Synchronize track changes to YouTube Player without reloading on play/pause
  useEffect(() => {
    const player = ytPlayerInstanceRef.current;
    if (!player || !currentTrack?.youtubeId) return;

    try {
      const targetYtId = currentTrack.youtubeId;
      // Only reload or cue if the track itself has changed
      if (loadedYoutubeIdRef.current !== targetYtId) {
        loadedYoutubeIdRef.current = targetYtId;
        setYtErrorNotice(null);
        const startSec = Math.floor(progressSecondsRef.current || 0);
        if (isPlaying) {
          if (typeof player.loadVideoById === 'function') {
            player.loadVideoById({
              videoId: targetYtId,
              startSeconds: startSec,
            });
          }
        } else {
          if (typeof player.cueVideoById === 'function') {
            player.cueVideoById({
              videoId: targetYtId,
              startSeconds: startSec,
            });
          }
        }
      } else {
        // Track is already loaded: only toggle play/pause; do NOT reload video!
        const playerState = player.getPlayerState?.();
        if (isPlaying) {
          if (playerState !== window.YT?.PlayerState?.PLAYING && playerState !== window.YT?.PlayerState?.BUFFERING) {
            // Verify playback position has not drifted before resuming
            const curTime = player.getCurrentTime?.() || 0;
            const targetSec = progressSecondsRef.current || 0;
            if (Math.abs(curTime - targetSec) > 2.0 && typeof player.seekTo === 'function') {
              try { player.seekTo(targetSec, true); } catch (e) {}
            }
            player.playVideo?.();
          }
        } else if (playerState === window.YT?.PlayerState?.PLAYING) {
          player.pauseVideo?.();
        }
      }
    } catch (e) {
      console.warn('[NOCTURNE YouTube] Track switch error:', e);
    }
  }, [currentTrack?.youtubeId, isPlaying]);

  // Periodic playhead tracking & gentle drift correction (runs every 1.5s while playing)
  useEffect(() => {
    const player = ytPlayerInstanceRef.current;
    if (!player || !isPlaying) return;

    const interval = setInterval(() => {
      try {
        const curTime = player.getCurrentTime?.();
        if (typeof curTime !== 'number' || !isFinite(curTime)) return;

        // If local player drifts from authoritative progressSeconds by > 2.5s, gently seek
        const targetSeconds = progressSecondsRef.current;
        const drift = Math.abs(curTime - targetSeconds);
        if (drift > 2.5 && !isSeekingDueToSyncRef.current) {
          isSeekingDueToSyncRef.current = true;
          if (typeof player.seekTo === 'function') {
            player.seekTo(targetSeconds, true);
          }
          setTimeout(() => {
            isSeekingDueToSyncRef.current = false;
          }, 800);
        }
      } catch (err) {}
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Synchronize volume and mute states
  useEffect(() => {
    const player = ytPlayerInstanceRef.current;
    if (!player) return;
    try {
      if (isMuted || volume === 0) {
        player.mute?.();
      } else {
        player.unMute?.();
        player.setVolume?.(volume);
      }
    } catch (e) {}
  }, [volume, isMuted]);

  const activeArtworkId = currentTrack?.artworkId || currentRoom.artworkId || 'noc-01';
  const displayTitle = currentTrack?.title || 'No track playing';
  const displaySubtitle = currentTrack
    ? `${currentTrack.artist || 'NOCTURNE Selection'} · Added by ${currentTrack.addedBy?.name || 'Curator'}`
    : 'Add a YouTube link to start';
  const trackArtworkUrl = currentTrack?.albumArt || null;

  return (
    <div
      ref={stageRootRef}
      className="flex-1 w-full h-full flex flex-col justify-between relative overflow-hidden bg-[var(--bg-canvas)]"
    >
      {/* Autoplay Blocked Tap-to-Sync Notice */}
      {(youtubePlaybackBlocked || audioPlaybackBlocked) && (
        <div className="absolute top-3 left-4 right-4 z-40 p-2.5 rounded-lg bg-[var(--bg-panel)] border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Autoplay blocked by browser. Tap to sync audio.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (ytPlayerInstanceRef.current?.playVideo) {
                ytPlayerInstanceRef.current.playVideo();
                setYouTubePlaybackBlocked(false);
              }
            }}
            className="px-2.5 py-1 bg-[#F43F5E] hover:bg-[#E11D48] text-white font-medium rounded-md text-[11px] transition-colors"
          >
            Tap to Sync &amp; Listen
          </button>
        </div>
      )}

      {/* YouTube Error Alert */}
      {ytErrorNotice && (
        <div
          role="alert"
          className="absolute top-3 left-4 right-4 z-40 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-2 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="truncate">{ytErrorNotice}</span>
          </div>
          {isHost && (
            <button
              type="button"
              onClick={() => skipTrack(true)}
              className="px-2.5 py-1 bg-[#F43F5E] hover:bg-[#E11D48] text-white font-medium rounded-md text-[11px] shrink-0"
            >
              Skip
            </button>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* CENTER STAGE: Frameless Artwork-First Vinyl Stage / Video Display   */}
      {/* ================================================================== */}
      <div className="flex-1 min-h-[220px] relative flex items-center justify-center p-4 sm:p-8 overflow-hidden select-none">
        {/* Dynamic Ambient Backlight (Adapts to current album art) */}
        <div
          className="absolute w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] rounded-full blur-[80px] opacity-25 dark:opacity-30 pointer-events-none transition-all duration-700 -z-0"
          style={{
            background: trackArtworkUrl
              ? `url('${trackArtworkUrl}') center / cover no-repeat`
              : 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(244, 63, 94, 0.2) 60%, transparent 100%)',
          }}
        />

        {/* Video Mode Container: YouTube IFrame displayed in 16:9 with pointer shield */}
        {/* Invariant: Room Audio • Stereo */}
        <div
          ref={containerRef}
          className={`relative z-10 w-full max-w-[640px] rounded-xl overflow-hidden border border-[var(--border-subtle)] shadow-2xl bg-black transition-opacity duration-300 ${
            isVideoVisible
              ? 'w-full aspect-video opacity-100 flex items-center justify-center'
              : 'fixed -left-[9999px] top-0 w-1 h-1 opacity-0 pointer-events-none'
          }`}
        >
          <div id="nocturne-yt-player" className="w-full h-full" />
          {/* Transparent Pointer-Shield Overlay: prevents breaking synchronization via native YouTube controls */}
          <div className="absolute inset-0 z-20 pointer-events-auto bg-transparent" />
        </div>

        {/* Artwork Mode Assembly: Vinyl Sleeve + Peeking Grooved Disc */}
        {viewMode === 'artwork' && (
          <div className="relative z-10 flex items-center justify-center -translate-x-3 sm:-translate-x-4">
            {/* Peeking Grooved Vinyl Disc (spins smoothly when isPlaying) */}
            <div
              className={`absolute w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] md:w-[340px] md:h-[340px] rounded-full vinyl-grooves border border-white/[0.08] flex items-center justify-center translate-x-[65px] sm:translate-x-[90px] shadow-2xl z-0 transition-transform duration-500`}
              style={{
                animation: isPlaying ? 'spin 18s linear infinite' : 'none',
              }}
            >
              {/* Center Spindle Paper Label */}
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#181324] border border-white/10 flex flex-col items-center justify-center relative shadow-inner">
                <span className="text-[8px] sm:text-[9px] font-syne font-bold tracking-wider text-rose-400 uppercase">
                  NOCTURNE
                </span>
                <span className="text-[6.5px] sm:text-[7.5px] font-mono tracking-widest text-zinc-400 mt-0.5">
                  NOC-01 · 33 RPM
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#09090D] border border-white/20 mt-1" />
              </div>
            </div>

            {/* Square Album Artwork Sleeve */}
            <div className="w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72 rounded-xl border border-white/10 shadow-2xl relative z-10 overflow-hidden bg-[#121218] shrink-0">
              {trackArtworkUrl ? (
                <img
                  src={trackArtworkUrl}
                  alt={displayTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ArtworkRenderer artworkId={activeArtworkId} className="w-full h-full object-cover" />
              )}
              {/* Subtle Ambient Lighting Gloss */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        )}

        {/* Floating Heart Burst Effect */}
        {likeBurst && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-ping">
            <span className="text-4xl text-[#F43F5E]">❤️</span>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* 148px 3-TIER INTEGRATED PLAYER DECK                                */}
      {/* ================================================================== */}
      <div className="w-full max-w-[840px] mx-auto border-t border-[var(--border-subtle)] px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col justify-between gap-1.5 sm:gap-2 shrink-0 z-20 bg-[var(--bg-canvas)]/95">
        {/* Tier 1 (44px): Track Identity & Mode Switcher */}
        <div className="h-10 flex items-center justify-between gap-3">
          <div className="min-w-0 pr-2">
            <h2 className="font-syne text-[16px] sm:text-[18px] font-bold text-[var(--text-primary)] tracking-[-0.02em] leading-tight truncate">
              {displayTitle}
            </h2>
            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5 font-inter">
              {displaySubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Contextual Segmented Control [ 🎬 Video | 🖼 Artwork ] */}
            <div className="bg-[var(--bg-recessed)] border border-[var(--border-subtle)] p-0.5 rounded-lg flex items-center text-xs">
              <button
                type="button"
                onClick={() => setViewMode('video')}
                className={`px-2.5 py-1 rounded-[6px] font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'video'
                    ? 'bg-[var(--bg-thumb)] border border-[#8B5CF6]/35 text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Video View"
              >
                <Tv className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="hidden sm:inline">Video</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('artwork')}
                className={`px-2.5 py-1 rounded-[6px] font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'artwork'
                    ? 'bg-[var(--bg-thumb)] border border-[#8B5CF6]/35 text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Artwork View"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="hidden sm:inline">Artwork</span>
              </button>
            </div>

            {/* Heart Reaction Button */}
            <button
              type="button"
              onClick={() => {
                setIsLiked(!isLiked);
                setLikeBurst(true);
                setTimeout(() => setLikeBurst(false), 900);
                triggerReaction('❤️');
              }}
              className={`w-8 h-8 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center transition-all ${
                isLiked
                  ? 'bg-rose-500/15 border-rose-500/30 text-[#F43F5E]'
                  : 'bg-[var(--bg-recessed)] text-[var(--text-muted)] hover:text-[#F43F5E] hover:border-rose-500/30'
              }`}
              title="React Heart"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-recessed)] transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Stage'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Tier 2 (52px): Flowing Ribbon Waveform Scrubber & Monospace Timestamps */}
        <div className="h-10 flex items-center gap-3">
          <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums shrink-0 w-11">
            {formatTime(progressSeconds)}
          </span>

          {/* Flowing Ribbon Waveform Container */}
          <div
            onClick={handleWaveformSeek}
            className={`flex-1 relative h-8 flex items-center group ${isHost ? 'cursor-pointer' : 'cursor-default'}`}
            title={isHost ? 'Seek playback' : 'Host controls playback position'}
          >
            <svg
              className="w-full h-8 overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 600 32"
            >
              {/* Background Ambient Wave Ribbon (Remaining) */}
              <path
                d="M0,16 C40,4 80,28 120,16 C160,4 200,28 240,16 C280,4 320,28 360,16 C400,4 440,28 480,16 C520,4 560,28 600,16"
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
              {/* Subtle Harmonic Ribbon (Remaining) */}
              <path
                d="M0,16 C50,26 90,8 140,16 C190,26 230,8 280,16 C330,26 370,8 420,16 C470,26 510,8 560,16 C580,20 590,14 600,16"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1.5"
              />
              {/* Active Played Harmonic Ribbon in Violet */}
              <path
                d={`M0,16 C50,26 90,8 140,16 C190,26 230,8 280,16 C330,26 370,8 420,16 C470,26 510,8 560,16 C580,20 590,14 600,16`}
                fill="none"
                stroke="#8B5CF6"
                strokeOpacity="0.5"
                strokeWidth="2"
                strokeDasharray="600"
                strokeDashoffset={600 - (600 * progressPercent) / 100}
                className="transition-[stroke-dashoffset] duration-150 ease-linear"
              />
              {/* Active Primary Wave Ribbon in Violet & Coral */}
              <path
                d="M0,16 C40,4 80,28 120,16 C160,4 200,28 240,16 C280,4 320,28 360,16 C400,4 440,28 480,16 C520,4 560,28 600,16"
                fill="none"
                stroke="url(#waveform-coral-gradient)"
                strokeLinecap="round"
                strokeWidth="3"
                strokeDasharray="600"
                strokeDashoffset={600 - (600 * progressPercent) / 100}
                className="transition-[stroke-dashoffset] duration-150 ease-linear"
              />
              <defs>
                <linearGradient id="waveform-coral-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="70%" stopColor="#EC4899" />
                  <stop offset="100%" stopColor="#F43F5E" />
                </linearGradient>
              </defs>
            </svg>

            {/* Playhead Scrub Dot */}
            <div
              className="absolute -translate-x-1/2 flex flex-col items-center pointer-events-none transition-[left] duration-150 ease-linear"
              style={{ left: `${progressPercent}%` }}
            >
              <span className="w-3 h-3 rounded-full bg-white ring-2 ring-[#8B5CF6] shadow-md group-hover:scale-110 transition-transform" />
            </div>
          </div>

          <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums shrink-0 w-11 text-right">
            {formatTime(durationSeconds)}
          </span>
        </div>

        {/* Tier 3 (44px): Role-Aware Transport Controls, Honest Sync Status & Elastic Volume Slider */}
        <div className="h-11 flex items-center justify-between">
          {/* Left: Transport Cluster */}
          <div className="flex items-center gap-3">
            {/* Restart / Prev Button */}
            <button
              type="button"
              onClick={() => {
                if (isHost) {
                  seekTo(0, true);
                }
              }}
              disabled={!isHost}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:hover:text-[var(--text-muted)] transition-colors"
              title={isHost ? 'Restart Track' : 'Host controls playback'}
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Circular Primary Coral Play/Pause Button (Strictly 42px) */}
            <button
              type="button"
              onClick={() => {
                if (isHost) {
                  togglePlay();
                }
              }}
              disabled={!isHost}
              className="w-[42px] h-[42px] rounded-full bg-[#F43F5E] hover:bg-[#E11D48] text-white flex items-center justify-center transition-all active:scale-95 shadow-none disabled:opacity-50"
              title={isHost ? (isPlaying ? 'Pause' : 'Play') : 'Host controls playback'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Skip Track Button */}
            <button
              type="button"
              onClick={() => {
                if (isHost) {
                  skipTrack(true);
                }
              }}
              disabled={!isHost}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:hover:text-[var(--text-muted)] transition-colors"
              title={isHost ? 'Skip Track' : 'Host controls playback'}
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Right: Honest Sync Indicator + Local Elastic Volume Slider */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Honest Sync Indicator (Zero fake ms telemetry) */}
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Synced
            </span>

            {/* Local Elastic Volume Slider */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="w-7 h-7 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume < 50 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              {/* Slim Violet Volume Track with 10px Thumb */}
              <div className="w-20 sm:w-24 h-1.5 bg-[#0B0B0F] border border-white/[0.07] rounded-full relative flex items-center cursor-pointer group">
                <div
                  className="h-full bg-[#8B5CF6] rounded-full transition-all"
                  style={{ width: `${isMuted ? 0 : volume}%` }}
                />
                <div
                  className="w-2.5 h-2.5 rounded-full bg-white absolute -translate-x-1/2 shadow transition-all"
                  style={{ left: `${isMuted ? 0 : volume}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  aria-label="Volume slider"
                />
              </div>

              <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums w-8 text-right">
                {isMuted ? '0%' : `${volume}%`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

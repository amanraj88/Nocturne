import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLounge } from '@/context/LoungeContext';
import { ArtworkRenderer } from '@/components/artwork';
import { formatTime } from '@/lib/utils';
import {
  Heart,
  Share2,
  Check,
  Tv,
  Disc,
  AlertCircle,
  SkipForward,
  SkipBack,
  Play,
  Pause,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Speaker,
  Radio,
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
    hasPhysicalAudio,
    isYouTubeActive,
    audioError,
    sendChatMessage,
    registerYouTubePlayer,
    registerYouTubeDuration,
    syncYouTubePlaybackState,
    setYouTubePlaybackBlocked,
  } = useLounge();

  const [isLiked, setIsLiked] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [viewMode, setViewMode] = useState<'monitor' | 'sleeve'>('monitor');
  const [ytErrorNotice, setYtErrorNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
  const autoplayBlockedRef = useRef(false);
  const progressSecondsRef = useRef(progressSeconds);
  progressSecondsRef.current = progressSeconds;

  const progressPercent =
    durationSeconds > 0 ? Math.min(100, Math.max(0, (progressSeconds / durationSeconds) * 100)) : 0;

  // Waveform click / drag seek handler
  const handleWaveformSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (durationSeconds <= 0) return;
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

  // Flowing Waveform Canvas Animator (Stitch Direction B v3)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };

    resize();
    window.addEventListener('resize', resize);

    const layers = [
      { color: '#8B5CF6', alpha: 0.35, freq: 0.015, speed: 0.03, amp: 22, offset: 0 },
      { color: '#06B6D4', alpha: 0.25, freq: 0.022, speed: 0.02, amp: 14, offset: 1.5 },
      { color: '#EC4899', alpha: 0.40, freq: 0.018, speed: 0.035, amp: 18, offset: 3.0 },
      { color: '#FF5C8A', alpha: 0.50, freq: 0.012, speed: 0.025, amp: 26, offset: 4.2 },
    ];

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const dynamicAmpMult = isPlaying ? 1.0 : 0.25;
      const dynamicSpeedMult = isPlaying ? 1.0 : 0.15;

      layers.forEach((layer) => {
        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 4) {
          const y1 =
            Math.sin(x * layer.freq + step * layer.speed * dynamicSpeedMult + layer.offset) *
            (layer.amp * dynamicAmpMult);
          const y2 =
            Math.cos(x * 0.008 - step * 0.015 * dynamicSpeedMult) *
            (layer.amp * 0.5 * dynamicAmpMult);
          const y = height / 2 + y1 + y2;

          if (x === 0) {
            ctx.lineTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, layer.color);
        gradient.addColorStop(0.5, '#7C3AED');
        gradient.addColorStop(1, '#FF5C8A');

        ctx.fillStyle = gradient;
        ctx.globalAlpha = layer.alpha;
        ctx.fill();
      });

      ctx.globalAlpha = 1.0;
      step++;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  const activeArtworkId = currentTrack?.artworkId || currentRoom.artworkId || 'noc-01';
  const displayTitle = currentTrack?.title || currentRoom.title || 'Shibuya Midnight Reverie';
  const displayArtist = currentTrack?.artist || 'NOCTURNE Curated Selection';
  const hostName = currentRoom?.host?.name || 'Alex';
  const isVideoVisible = Boolean(currentTrack?.youtubeId && viewMode === 'monitor');

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Tap-to-Join Live Playback Overlay for Strict Mobile Autoplay Policies */}
      {(youtubePlaybackBlocked || audioPlaybackBlocked) && (
        <div className="w-full p-3 rounded-xl bg-[#F3F0FA] dark:bg-[#8B5CF6]/20 border border-[#DDD6FE] dark:border-[#8B5CF6]/50 text-[#12101F] dark:text-white text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#F43F5E] dark:text-[#FF5C8A] animate-pulse" />
            <span>Tap to sync & join live audio/video</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isYouTubeActive && ytPlayerInstanceRef.current?.playVideo) {
                ytPlayerInstanceRef.current.playVideo();
                setYouTubePlaybackBlocked(false);
              }
            }}
            className="px-3 py-1 bg-[#FF5C8A] hover:bg-[#ff477b] text-white font-semibold rounded-full text-xs shadow-md"
          >
            Sync
          </button>
        </div>
      )}

      {/* Player Card Container (Stitch Direction B v3) */}
      <div className="bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-2xl relative overflow-hidden flex flex-col justify-between transition-colors">
        {/* Subtle Ambient Radial Glow Backdrops */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#FF5C8A]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Stage Container */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden group shadow-2xl border border-[#EDEAF5] dark:border-[#2D2945]/80 bg-black">
          {/* YouTube Video Monitor (Persistent DOM element with persistent positioning to prevent audio termination) */}
          <div
            ref={containerRef}
            className={`transition-all duration-300 rounded-lg overflow-hidden border border-[#EDEAF5] dark:border-[#2D2945] shadow-2xl bg-black ${
              isVideoVisible
                ? 'w-full aspect-video z-20 shadow-glow-album'
                : 'fixed -left-[9999px] top-0 w-1 h-1 opacity-0 pointer-events-none'
            }`}
          >
            <div id="nocturne-yt-player" className="w-full h-full" />
          </div>

          {/* Fallback Artwork Sleeve View */}
          <div
            className={`w-full h-full transition-transform duration-700 group-hover:scale-105 ${
              !isVideoVisible ? 'block' : 'hidden'
            }`}
          >
            <ArtworkRenderer artworkId={activeArtworkId} className="w-full h-full object-cover" />
          </div>

          {/* Category Tag Pill */}
          <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-[#DDD6FE] flex items-center gap-1.5 shadow-lg z-20">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
            <span>{currentRoom.vibeTag || 'Atmospheric Chill'}</span>
          </div>

          {/* Synced with Host Indicator Badge */}
          <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-[#38BDF8] flex items-center gap-1.5 z-20 shadow-lg">
            <Radio className="w-3 h-3 text-[#38BDF8]" />
            <span>Synced with {hostName}</span>
          </div>

          {/* Mode Switcher Pill (Video / Artwork) if YouTube is present */}
          {currentTrack?.youtubeId && (
            <div className="absolute bottom-3 right-3 z-20">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'monitor' ? 'sleeve' : 'monitor')}
                className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 text-[11px] font-medium text-white flex items-center gap-1.5 backdrop-blur-md transition-colors"
                title={viewMode === 'monitor' ? 'Show Sleeve Artwork' : 'Show YouTube Video'}
              >
                {viewMode === 'monitor' ? (
                  <>
                    <Disc className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>Artwork View</span>
                  </>
                ) : (
                  <>
                    <Tv className="w-3.5 h-3.5 text-[#4ADE80]" />
                    <span>Video View</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Album Mark Pill */}
          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-[#A19EB5] z-20">
            <span>Room • [{activeArtworkId.toUpperCase()}]</span>
          </div>
        </div>

        {/* Track Title & Primary Action Cluster */}
        <div className="flex items-center justify-between mt-5">
          <div className="min-w-0 pr-3">
            <h2 className="text-xl sm:text-2xl font-headline font-bold text-[#12101F] dark:text-white tracking-tight truncate">
              {displayTitle}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-[#7C3AED] dark:text-[#DDD6FE] font-medium truncate">
                {displayArtist}
              </span>
              <span className="text-xs text-[#8E88A8] dark:text-[#6B6785]">•</span>
              <span className="text-xs text-[#5E5873] dark:text-[#A19EB5] bg-[#F3F0FA] dark:bg-[#242138] border border-[#EDEAF5] dark:border-[#2D2945] px-2.5 py-0.5 rounded-full truncate">
                {isYouTubeActive ? 'YouTube Stream' : 'Curated Audio'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Favorite / Like Toggle */}
            <button
              type="button"
              onClick={() => setIsLiked(!isLiked)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isLiked
                  ? 'text-[#F43F5E] bg-[#F43F5E]/10'
                  : 'text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white hover:bg-[#F3F0FA] dark:hover:bg-[#242138]'
              }`}
              title="Save to Library"
              aria-label="Save to Library"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>

            {/* Share / Copy Room Link */}
            <button
              type="button"
              onClick={copyRoomLink}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white hover:bg-[#F3F0FA] dark:hover:bg-[#242138] transition-all"
              title="Share Room Link"
              aria-label="Share Room Link"
            >
              {copyStatus === 'copied' ? (
                <Check className="w-5 h-5 text-[#4ADE80]" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* YouTube Video Error Alert */}
        {ytErrorNotice && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-xl bg-[#FF5C8A]/15 border border-[#FF5C8A]/40 text-[#FF5C8A] text-xs flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{ytErrorNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => skipTrack(true)}
              className="px-2.5 py-1 rounded-full bg-[#F43F5E] hover:bg-[#e11d48] dark:bg-[#FF5C8A] dark:hover:bg-[#ff477b] text-white text-[11px] font-semibold transition-transform active:scale-95"
            >
              Next
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* SIGNATURE FLOWING WAVEFORM VISUALIZER CENTERPIECE               */}
        {/* ============================================================== */}
        <div className="mt-5 p-4 sm:p-5 rounded-xl bg-[#F8F7FC] dark:bg-[#0F0E17]/85 border border-[#EDEAF5] dark:border-[#2D2945] relative transition-colors">
          <div className="flex items-center justify-between text-xs text-[#5E5873] dark:text-[#A19EB5] mb-2.5 font-medium">
            <span className="flex items-center gap-1.5 text-[#0284C7] dark:text-[#38BDF8]">
              <span className="material-symbols-outlined text-[16px]">graphic_eq</span>
              <span>Flowing Audio Waveform</span>
            </span>
            <span className="text-[#8E88A8] dark:text-[#6B6785] text-[11px]">Room Audio • Stereo</span>
          </div>

          {/* Interactive Waveform Canvas Container */}
          <div
            onClick={handleWaveformSeek}
            className="relative w-full h-24 sm:h-28 overflow-hidden rounded-xl bg-white dark:bg-[#12101F] border border-[#EDEAF5] dark:border-transparent flex items-center cursor-pointer group select-none shadow-xs"
            title="Click or drag anywhere on waveform to seek"
          >
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Glowing Scrubber Needle with knob at progressPercent */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none transition-all duration-75 flex flex-col items-center justify-center shadow-[0_0_12px_#FF5C8A]"
              style={{ left: `${progressPercent}%` }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-[#FF5C8A] ring-2 ring-white shadow-lg shadow-[#FF5C8A]/60 -mt-0.5" />
            </div>
          </div>

          {/* Playback Timestamps */}
          <div className="flex items-center justify-between mt-3 px-1 text-xs font-mono font-medium text-[#5E5873] dark:text-[#A19EB5]">
            <span className="text-[#12101F] dark:text-white font-semibold">{formatTime(progressSeconds)}</span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#5E5873] dark:text-[#6B6785] font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] dark:bg-[#8B5CF6]" />
              <span>Shared Session Time</span>
            </div>
            <span>{durationSeconds > 0 ? formatTime(durationSeconds) : '—:—'}</span>
          </div>

          {/* Playback Transport Controls Cluster Centered */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4">
            {/* Shuffle */}
            <button
              type="button"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white hover:bg-[#F3F0FA] dark:hover:bg-[#242138] transition-colors"
              title="Shuffle"
              aria-label="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous Track */}
            <button
              type="button"
              onClick={() => previousTrack(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#12101F] dark:text-white hover:text-[#7C3AED] dark:hover:text-white hover:bg-[#F3F0FA] dark:hover:bg-[#242138] transition-colors active:scale-95"
              title="Previous Track"
              aria-label="Previous Track"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Prominent 56px circular Play/Pause button with radiant violet-coral glow */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#FF5C8A] text-white flex items-center justify-center shadow-lg shadow-[#8B5CF6]/40 hover:shadow-xl hover:shadow-[#FF5C8A]/50 transition-all duration-200 active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>

            {/* Next Track */}
            <button
              type="button"
              onClick={() => skipTrack(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#12101F] dark:text-white hover:text-[#7C3AED] dark:hover:text-white hover:bg-[#F3F0FA] dark:hover:bg-[#242138] transition-colors active:scale-95"
              title="Next Track"
              aria-label="Next Track"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat */}
            <button
              type="button"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#7C3AED] dark:text-[#8B5CF6] hover:bg-[#F3F0FA] dark:hover:bg-[#242138] transition-colors"
              title="Repeat Room"
              aria-label="Repeat Room"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Volume & Audio Output Row */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#EDEAF5] dark:border-[#2D2945]">
          <div className="flex items-center gap-2 text-xs text-[#5E5873] dark:text-[#A19EB5]">
            <Speaker className="w-4 h-4 text-[#7C3AED] dark:text-[#8B5CF6]" />
            <span className="hidden sm:inline">Room Audio • Stereo</span>
            <span className="sm:hidden">Stereo</span>
          </div>

          <div className="flex items-center gap-3 w-36 sm:w-44">
            <button
              type="button"
              onClick={toggleMute}
              className="text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#F43F5E]" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1.5 bg-[#EDEAF5] dark:bg-[#242138] rounded-full accent-[#7C3AED] dark:accent-[#8B5CF6] cursor-pointer"
              aria-label="Volume Slider"
            />
            <span className="text-xs text-[#5E5873] dark:text-[#6B6785] font-mono w-8 text-right">
              {isMuted ? 0 : volume}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

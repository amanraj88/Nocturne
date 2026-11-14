import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { ArtworkRenderer } from '@/components/artwork';
import { formatTime } from '@/lib/utils';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize2,
  Radio,
  ExternalLink,
  X,
} from 'lucide-react';

export const MiniPlayer: React.FC = () => {
  const router = useRouter();
  const {
    currentRoom,
    roomLoadState,
    currentTrack,
    isPlaying,
    progressSeconds,
    durationSeconds,
    togglePlay,
    skipTrack,
    previousTrack,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    seekTo,
    leaveRoom,
  } = useLounge();

  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Mini waveform canvas animation
  useEffect(() => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      // Draw subtle wave
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      for (let x = 0; x <= width; x += 3) {
        const amp = isPlaying ? 6 : 2;
        const y = height / 2 + Math.sin(x * 0.05 + step * (isPlaying ? 0.05 : 0.01)) * amp;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = isPlaying ? '#FF5C8A' : '#8B5CF6';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      step++;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Hide mini-player when already inside the full listening room, or when no active room/track exists
  const isRoomPage = router.pathname === '/room' || router.pathname.startsWith('/room/');
  if (!isMounted || isRoomPage || !currentRoom?.id || !currentRoom?.slug || !currentTrack || roomLoadState === 'ended') {
    return null;
  }

  const roomSlug = currentRoom.slug;
  const displayTitle = currentTrack.title || currentRoom.title;
  const displayArtist = currentTrack.artist || (currentRoom.host?.name ? `Curated by ${currentRoom.host.name}` : 'NOCTURNE Stream');
  const artworkId = currentTrack.artworkId || currentRoom.artworkId || 'noc-01';
  const progressPercent =
    durationSeconds > 0 ? Math.min(100, Math.max(0, (progressSeconds / durationSeconds) * 100)) : 0;

  return (
    <aside
      aria-label="Persistent Audio Player"
      className="fixed bottom-0 left-0 right-0 z-40 h-16 sm:h-[72px] bg-white/95 dark:bg-[#1A1829]/95 border-t border-[#EDEAF5] dark:border-[#2D2945] backdrop-blur-xl shadow-2xl transition-all"
    >
      {/* Top micro seek bar */}
      <div
        className="absolute -top-[2px] left-0 right-0 h-1 bg-[#F3F0FA] dark:bg-[#242138] cursor-pointer group"
        onClick={(e) => {
          if (durationSeconds > 0) {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            seekTo(Math.floor(clickPos * durationSeconds), true);
          }
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F43F5E] dark:from-[#8B5CF6] dark:via-[#EC4899] dark:to-[#FF5C8A] transition-all relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover:opacity-100 shadow-md transition-opacity" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Track Metadata & Thumbnail */}
        <div className="flex items-center gap-3 min-w-0 max-w-[200px] sm:max-w-xs lg:max-w-sm">
          <Link
            href={`/room/${roomSlug}`}
            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden shrink-0 border border-[#EDEAF5] dark:border-[#2D2945] bg-[#0F0E17] group"
          >
            <ArtworkRenderer artworkId={artworkId} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </Link>

          <div className="min-w-0">
            <Link
              href={`/room/${roomSlug}`}
              className="text-xs sm:text-sm font-semibold text-[#12101F] dark:text-white hover:text-[#7C3AED] dark:hover:text-[#DDD6FE] truncate block transition-colors"
            >
              {displayTitle}
            </Link>
            <p className="text-[11px] text-[#5E5873] dark:text-[#A19EB5] truncate">
              {displayArtist}
            </p>
          </div>
        </div>

        {/* Center: Waveform & Playback Controls */}
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => previousTrack(true)}
              className="text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white transition-colors p-1"
              aria-label="Previous Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F43F5E] dark:from-[#8B5CF6] dark:via-[#EC4899] dark:to-[#FF5C8A] text-white flex items-center justify-center shadow-md shadow-[#7C3AED]/30 hover:scale-105 active:scale-95 transition-all"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skipTrack(true)}
              className="text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white transition-colors p-1"
              aria-label="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Time display & mini waveform */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-[#5E5873] dark:text-[#A19EB5]">
            <span>{formatTime(progressSeconds)}</span>
            <canvas ref={miniCanvasRef} width={80} height={16} className="h-4 w-20 opacity-80" />
            <span>{durationSeconds > 0 ? formatTime(durationSeconds) : '—:—'}</span>
          </div>
        </div>

        {/* Right: Volume & Room Navigation Link */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-2 w-28 lg:w-32">
            <button
              type="button"
              onClick={toggleMute}
              className="text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#FF5C8A]" />
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
              className="w-full h-1 bg-[#242138] rounded-full accent-[#8B5CF6] cursor-pointer"
              aria-label="Volume Slider"
            />
          </div>

          <Link
            href={`/room/${roomSlug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#242138] hover:bg-[#2D2945] border border-[#2D2945] hover:border-[#8B5CF6]/50 text-xs font-semibold text-[#DDD6FE] hover:text-white transition-all shadow-sm active:scale-95"
          >
            <Radio className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="hidden sm:inline">Open Room</span>
          </Link>

          <button
            type="button"
            onClick={() => void leaveRoom()}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#A19EB5] hover:text-white hover:bg-[#242138] transition-colors"
            title="Leave Lounge & Close Player"
            aria-label="Close audio player and leave lounge"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

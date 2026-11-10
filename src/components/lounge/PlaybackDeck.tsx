import React from 'react';
import { useLounge } from '@/context/LoungeContext';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Moon,
  Flame,
  Activity,
} from 'lucide-react';

export const PlaybackDeck: React.FC = () => {
  const {
    currentRoom,
    currentTrack,
    isPlaying,
    isYouTubeActive,
    youtubePlaybackBlocked,
    audioPlaybackBlocked,
    togglePlay,
    skipTrack,
    previousTrack,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    sendChatMessage,
    hasPhysicalAudio,
  } = useLounge();

  const handleVibeReaction = (label: string) => {
    sendChatMessage(`felt: ${label}`);
  };

  const catalogMark = (currentTrack?.artworkId || currentRoom.artworkId || 'noc-01').toUpperCase();
  const canPlayTrack = Boolean(currentTrack?.youtubeId || currentTrack?.audioUrl);
  const needsPlaybackGesture = isPlaying && (
    (isYouTubeActive && youtubePlaybackBlocked) || (hasPhysicalAudio && audioPlaybackBlocked)
  );

  return (
    <footer className="relative w-full border-t border-graphite bg-carbon/95 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3.5">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-6">
        {/* Left: Atmospheric Reaction Signals (Desktop) / Release Mark (Mobile) */}
        <div className="hidden sm:flex items-center gap-2 order-2 sm:order-1">
          <span className="text-xs text-ash mr-1 hidden lg:inline font-sans font-medium">
            Signal:
          </span>
          <button
            type="button"
            onClick={() => handleVibeReaction('Late night')}
            className="px-2 py-0.5 rounded-[2px] bg-deep-ink hover:bg-carbon text-ash hover:text-warm-bone text-xs border border-graphite hover:border-mineral/50 transition-colors flex items-center gap-1.5 active:scale-[0.98] select-none"
          >
            <Moon className="w-3 h-3 text-mineral" />
            <span>Late night</span>
          </button>
          <button
            type="button"
            onClick={() => handleVibeReaction('Deep focus')}
            className="px-2 py-0.5 rounded-[2px] bg-deep-ink hover:bg-carbon text-ash hover:text-warm-bone text-xs border border-graphite hover:border-mineral/50 transition-colors flex items-center gap-1.5 active:scale-[0.98] select-none"
          >
            <Activity className="w-3 h-3 text-warm-bone" />
            <span>Deep focus</span>
          </button>
          <button
            type="button"
            onClick={() => handleVibeReaction('Sub-bass warmth')}
            className="px-2 py-0.5 rounded-[2px] bg-deep-ink hover:bg-carbon text-ash hover:text-warm-bone text-xs border border-graphite hover:border-mineral/50 transition-colors flex items-center gap-1.5 active:scale-[0.98] select-none"
          >
            <Flame className="w-3 h-3 text-oxide" />
            <span>Warmth</span>
          </button>
        </div>

        {/* Center: Tactile Playback Transport Buttons */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-2 sm:gap-6 order-1 sm:order-2 px-1 sm:px-0">
          {/* Mobile Release Monogram with Physical Audio Indicator */}
          <div className="flex sm:hidden items-center gap-1.5 text-xs font-mono text-ash shrink-0">
            <span>[{catalogMark}]</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasPhysicalAudio ? 'bg-mineral' : 'bg-ash/40'
              }`}
            />
          </div>

          {/* Transport Controls Core */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={() => previousTrack()}
              className="p-1 sm:p-2 text-ash hover:text-warm-bone transition-colors rounded-full hover:bg-graphite/40"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={() => togglePlay()}
              className={`flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-full border transition-transform active:translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mineral focus-visible:ring-offset-2 focus-visible:ring-offset-deep-ink shadow-sm ${
                !canPlayTrack
                  ? 'bg-graphite text-ash border-graphite cursor-not-allowed'
                  : isPlaying && !needsPlaybackGesture
                  ? 'bg-mineral text-deep-ink hover:bg-mineral/90 border-mineral'
                  : 'bg-warm-bone text-deep-ink hover:bg-white border-warm-bone'
              }`}
              disabled={!canPlayTrack}
              aria-label={!canPlayTrack ? 'Queue a track to play' : needsPlaybackGesture ? 'Join room playback on this device' : isPlaying ? 'Pause playback' : 'Start playback'}
              title={!canPlayTrack ? 'Queue a YouTube video or load a local audio file first' : undefined}
            >
              {isPlaying && !needsPlaybackGesture ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skipTrack()}
              className="p-1 sm:p-2 text-ash hover:text-warm-bone transition-colors rounded-full hover:bg-graphite/40"
              aria-label="Skip to next track"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Mobile Local Volume Monitor */}
          <div className="flex sm:hidden items-center gap-1 bg-deep-ink px-1.5 py-1 rounded-full border border-graphite shrink-0">
            <button
              type="button"
              onClick={toggleMute}
              className="text-ash hover:text-warm-bone transition-colors"
              aria-label={isMuted ? 'Unmute volume' : 'Mute volume'}
              title="Independent local volume"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-oxide" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-10 h-1 bg-graphite rounded-lg appearance-none cursor-pointer accent-mineral"
              aria-label="Local monitor volume"
            />
          </div>
        </div>

        {/* Right: Desktop Volume Monitor & Audio Engine Status */}
        <div className="hidden sm:flex items-center gap-3 order-3 w-auto justify-end">
          <div className="hidden xl:flex items-center gap-1.5 text-[10px] font-mono text-ash/70 px-2 py-1 rounded-[2px] bg-deep-ink border border-graphite">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPlaying && !needsPlaybackGesture && (hasPhysicalAudio || isYouTubeActive) ? 'bg-mineral animate-pulse' : (hasPhysicalAudio || isYouTubeActive) ? 'bg-mineral/60' : 'bg-ash/40'
              }`}
            />
            <span>{needsPlaybackGesture ? 'Tap play to join' : currentTrack?.sourceType === 'shared-audio' ? 'Shared audio source' : hasPhysicalAudio ? 'Local audio source' : isYouTubeActive ? 'YouTube source' : 'No audio source'}</span>
          </div>

          {/* Local Volume Monitor (Client-side Independent) */}
          <div className="flex items-center gap-2 bg-deep-ink px-2.5 py-1 rounded-full border border-graphite">
            <button
              type="button"
              onClick={toggleMute}
              className="text-ash hover:text-warm-bone transition-colors"
              aria-label={isMuted ? 'Unmute volume' : 'Mute volume'}
              title="Independent local volume"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-oxide" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16 sm:w-20 h-1 bg-graphite rounded-lg appearance-none cursor-pointer accent-mineral"
              aria-label="Local monitor volume"
            />
            <span className="font-mono text-[11px] text-ash w-7 text-right">
              {isMuted ? '0%' : `${volume}%`}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

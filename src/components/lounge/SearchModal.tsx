import React, { useState, useEffect } from 'react';
import { useLounge } from '@/context/LoungeContext';
import { Search, X, Plus, Check, Radio, Upload, Link2, AlertCircle } from 'lucide-react';
import { ArtworkRenderer } from '@/components/artwork';
import { parseYouTubeVideoId } from '@/lib/utils';
import { TrackSourceType } from '@/types';

interface SearchCatalogItem {
  id: string;
  youtubeId?: string;
  title: string;
  artist: string;
  albumArt: string;
  artworkId: 'noc-01' | 'noc-02' | 'noc-03';
  durationSeconds: number;
  sourceType: TrackSourceType;
  audioUrl?: string;
  isTestFixture?: boolean;
}

const MOCK_SEARCH_RESULTS: SearchCatalogItem[] = [
  {
    id: 'tr-cat-tone',
    title: '[TEST-TONE] Acoustic Calibration 440Hz',
    artist: 'NOCTURNE Laboratory',
    albumArt: '/artwork/noc-01.svg',
    artworkId: 'noc-01',
    durationSeconds: 6,
    audioUrl: '/audio/test-tone.wav',
    sourceType: 'fixture',
    isTestFixture: true,
  },
];

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, addTrackToQueue, loadLocalAudioFiles, currentRoom } = useLounge();
  const [query, setQuery] = useState('');
  const [addedIds, setAddedIds] = useState<string[]>([]);

  // YouTube paste state
  const [pasteInput, setPasteInput] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteInfo, setPasteInfo] = useState<{
    videoId: string;
    title: string;
    artist: string;
    thumbnail: string;
    durationSeconds: number;
  } | null>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [liveResults, setLiveResults] = useState<SearchCatalogItem[] | null>(null);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'available' | 'unavailable' | 'error'>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);

  // Validate and fetch metadata when YouTube link is entered
  useEffect(() => {
    const videoId = parseYouTubeVideoId(pasteInput);
    if (!videoId) {
      setPasteInfo(null);
      setIsFetchingInfo(false);
      return;
    }

    let cancelled = false;
    setIsFetchingInfo(true);
    setPasteError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/youtube/info?id=${encodeURIComponent(videoId)}`);
        const data = await res.json();
        if (cancelled) return;
        setIsFetchingInfo(false);

        if (!res.ok || data.valid === false) {
          setPasteInfo(null);
          setPasteError(data.error || 'Video could not be loaded or is restricted.');
          return;
        }

        setPasteInfo({
          videoId,
          title: data.title || `YouTube Video (${videoId})`,
          artist: data.artist || 'YouTube Broadcast',
          thumbnail: data.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          durationSeconds: data.durationSeconds || 0,
        });
      } catch {
        if (!cancelled) {
          setIsFetchingInfo(false);
          setPasteInfo(null);
          setPasteError('YouTube could not verify this link. Check your connection and try again.');
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pasteInput]);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setLiveResults(null);
      setSearchStatus('idle');
      setSearchError(null);
      return;
    }

    let cancelled = false;
    setSearchStatus('loading');
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(term)}`);
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok || !data.available) {
          setLiveResults(null);
          setSearchError(typeof data.error === 'string' ? data.error : null);
          setSearchStatus(!response.ok || data.error ? 'error' : 'unavailable');
          return;
        }
        setSearchError(null);
        const roomArtwork = currentRoom.artworkId || 'noc-01';
        setLiveResults((data.items || []).filter((item: any) => item.id).map((item: any) => ({
          id: `youtube-${item.id}`,
          youtubeId: item.id,
          title: item.title || 'Untitled YouTube video',
          artist: item.channelTitle || 'YouTube channel',
          albumArt: `/artwork/${roomArtwork}.svg`,
          artworkId: roomArtwork,
          durationSeconds: 0,
          sourceType: 'youtube' as const,
        })));
        setSearchStatus('available');
      } catch {
        if (!cancelled) {
          setLiveResults(null);
          setSearchError('YouTube search request failed.');
          setSearchStatus('error');
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, currentRoom.artworkId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    if (isSearchOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const handleAdd = async (result: SearchCatalogItem) => {
    const didAdd = await addTrackToQueue({
      youtubeId: result.youtubeId,
      sourceType: result.sourceType,
      title: result.title,
      artist: result.artist,
      albumArt: result.albumArt,
      artworkId: result.artworkId,
      durationSeconds: result.durationSeconds,
      audioUrl: result.audioUrl,
      isTestFixture: result.isTestFixture,
    });
    if (!didAdd) return;
    if (result.youtubeId) {
      setAddedIds((prev) => [...prev, result.youtubeId!]);
    }
  };

  const handleQueuePastedYouTube = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPasteError(null);

    const videoId = parseYouTubeVideoId(pasteInput);
    if (!videoId) {
      setPasteError('Invalid YouTube URL or ID. Please paste a valid 11-character video link (e.g. youtube.com/watch?v=... or youtu.be/...).');
      return;
    }
    if (isFetchingInfo || pasteInfo?.videoId !== videoId) {
      setPasteError('Wait for the YouTube link check to finish before adding it.');
      return;
    }
    if (!pasteInfo) {
      setPasteError('YouTube could not verify this link. Check the URL and try again.');
      return;
    }

    const artworkChoices: Array<'noc-01' | 'noc-02' | 'noc-03'> = ['noc-01', 'noc-02', 'noc-03'];
    const chosenArtwork = currentRoom.artworkId || artworkChoices[0];
    const didAdd = await addTrackToQueue({
      sourceType: 'youtube',
      youtubeId: videoId,
      title: customTitle.trim() || pasteInfo.title,
      artist: pasteInfo.artist,
      albumArt: pasteInfo.thumbnail || `/artwork/${chosenArtwork}.svg`,
      artworkId: chosenArtwork,
      durationSeconds: pasteInfo.durationSeconds || 0,
    });
    if (!didAdd) return;

    setPasteInput('');
    setCustomTitle('');
    setPasteInfo(null);
    setIsSearchOpen(false);
  };
  const offlineFiltered = query.trim()
    ? MOCK_SEARCH_RESULTS.filter(
        (r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.artist.toLowerCase().includes(query.toLowerCase())
      )
    : MOCK_SEARCH_RESULTS;
  const filtered = searchStatus === 'available' ? liveResults || [] : offlineFiltered;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0F0E17]/85 backdrop-blur-md animate-in fade-in"
    >
      <div
        className="fixed inset-0"
        onClick={() => setIsSearchOpen(false)}
      />

      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Editorial Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EDEAF5] dark:border-[#2D2945] bg-[#F8F7FC] dark:bg-[#12101F]/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#F43F5E] flex items-center justify-center text-white shadow-md">
              <Search className="w-3.5 h-3.5" />
            </span>
            <h3 id="search-modal-title" className="font-headline text-sm font-bold tracking-tight text-[#12101F] dark:text-white">
              Queue a track (YouTube link, local master, or catalogue)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="p-1.5 rounded-full text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white hover:bg-[#F3F0FA] dark:hover:bg-[#242138] transition-colors"
            aria-label="Close search dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Section 1: Paste YouTube URL or Video ID */}
          <div className="p-4 border-b border-[#EDEAF5] dark:border-graphite bg-[#F8F7FC] dark:bg-deep-ink/30 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#12101F] dark:text-warm-bone">
              <Link2 className="w-3.5 h-3.5 text-[#7C3AED] dark:text-mineral" />
              <span>Paste YouTube Video URL or Video ID (No key required)</span>
            </div>
            <form onSubmit={handleQueuePastedYouTube} className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={pasteInput}
                  onChange={(e) => {
                    setPasteInput(e.target.value);
                    if (pasteError) setPasteError(null);
                  }}
                  placeholder="e.g. https://www.youtube.com/watch?v=7P2rX4D5p8E or 7P2rX4D5p8E"
                  className="flex-1 rounded-lg bg-white dark:bg-deep-ink border border-[#EDEAF5] dark:border-graphite px-3 py-1.5 text-xs text-[#12101F] dark:text-warm-bone placeholder-[#8E88A8] dark:placeholder:text-ash/50 focus:outline-none focus:border-[#7C3AED] dark:focus:border-mineral font-sans transition-colors shadow-xs"
                />
                <button
                  type="submit"
                  disabled={isFetchingInfo || !pasteInfo || pasteInfo.videoId !== parseYouTubeVideoId(pasteInput)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#F43F5E] hover:bg-[#e11d48] dark:bg-[#FF5C8A] dark:hover:bg-[#ff477b] text-white text-xs font-semibold shrink-0 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-pink-500/20"
                >
                  Add to Queue
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-0.5">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Optional custom title (e.g. Floating Points - Live at Printworks)"
                  className="w-full rounded-lg bg-white dark:bg-deep-ink/70 border border-[#EDEAF5] dark:border-graphite px-2.5 py-1 text-[11px] text-[#12101F] dark:text-warm-bone placeholder-[#8E88A8] dark:placeholder:text-ash/40 focus:outline-none focus:border-[#7C3AED] dark:focus:border-mineral font-sans transition-colors shadow-xs"
                />
              </div>

              {isFetchingInfo && (
                <div className="flex items-center gap-2 text-[11px] text-[#5E5873] dark:text-ash pt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] dark:bg-mineral animate-pulse" />
                  <span>Fetching YouTube video details...</span>
                </div>
              )}

              {pasteInfo && (
                <div className="flex items-center gap-3 p-2 bg-[#F3F0FA] dark:bg-deep-ink border border-[#EDEAF5] dark:border-graphite rounded-lg mt-1 shadow-xs">
                  <img
                    src={pasteInfo.thumbnail}
                    alt=""
                    className="w-12 h-9 object-cover rounded-md bg-[#EDEAF5] dark:bg-carbon border border-[#EDEAF5] dark:border-graphite/40 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#12101F] dark:text-warm-bone truncate">{pasteInfo.title}</p>
                    <p className="text-[11px] text-[#5E5873] dark:text-ash truncate">{pasteInfo.artist}</p>
                  </div>
                  <span className="text-[10px] text-[#7C3AED] dark:text-mineral border border-[#DDD6FE] dark:border-mineral/40 bg-[#EDEAF5] dark:bg-mineral/10 px-1.5 py-0.5 rounded shrink-0 font-medium">
                    Link details
                  </span>
                </div>
              )}

              {pasteError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-2 rounded-lg bg-[#F43F5E]/10 border border-[#F43F5E]/40 text-[#F43F5E] dark:text-oxide text-[11px] flex items-center gap-1.5 mt-1"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{pasteError}</span>
                </div>
              )}
            </form>
          </div>

          {/* Section 2: Load Local Audio Master */}
          <div className="p-4 border-b border-graphite bg-deep-ink/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div>
              <p className="text-xs font-semibold text-warm-bone flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-mineral" />
                <span>Load local audio master</span>
              </p>
              <p className="text-[11px] text-ash mt-0.5">
                Local files stay on this device until you choose Share with room. Shared uploads are limited to 25 MB.
              </p>
            </div>
            <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7C3AED] dark:bg-mineral hover:bg-[#6D28D9] dark:hover:bg-mineral/90 text-white text-xs font-semibold shrink-0 transition-transform active:scale-[0.98] shadow-md shadow-purple-500/20">
              <Upload className="w-3.5 h-3.5" />
              <span>Select file</span>
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    loadLocalAudioFiles(e.target.files);
                    setIsSearchOpen(false);
                  }
                }}
              />
            </label>
          </div>

          {/* Section 3: Live Search API Status Notice */}
          <div className="px-5 py-2.5 border-b border-[#EDEAF5] dark:border-graphite/60 bg-[#F3F0FA] dark:bg-carbon text-[11px] text-[#5E5873] dark:text-ash flex items-start sm:items-center justify-between gap-2">
            <span>
              {searchStatus === 'loading'
                ? 'Searching YouTube…'
                : searchStatus === 'available'
                ? 'Live YouTube Data API results.'
                : searchStatus === 'error'
                ? (searchError || 'YouTube search could not be reached. Direct video links still work.')
                : searchStatus === 'unavailable'
                ? 'Live YouTube search is unavailable because the server YOUTUBE_API_KEY is not configured. Direct video links work without a key.'
                : 'Type a query to search YouTube. Direct video links work without a search key.'}
            </span>
            <span className="font-mono text-[10px] text-ash/60 shrink-0">
              {searchStatus === 'loading' ? '[SEARCHING]' : searchStatus === 'available' ? '[LIVE]' : searchStatus === 'error' ? '[ERROR]' : searchStatus === 'unavailable' ? '[UNSET]' : '[READY]'}
            </span>
          </div>

          {/* Section 4: Filterable Catalogue Archive Specimens */}
          <div className="p-4 border-b border-graphite bg-carbon">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search YouTube or filter offline catalogue specimens..."
                className="w-full rounded-[2px] bg-deep-ink border border-graphite pl-9 pr-4 py-1.5 text-xs text-warm-bone placeholder:text-ash/50 focus:outline-none focus:border-mineral focus:ring-1 focus:ring-mineral font-sans transition-colors"
              />
            </div>
          </div>

          <div className="px-5 py-3">
            <div className="flex items-center justify-between text-[11px] font-sans font-medium text-ash mb-2 pb-1.5 border-b border-graphite/40">
              <span>{searchStatus === 'available' ? 'YouTube search results' : 'Catalogue archive specimens (Offline Mock Catalog)'}</span>
              <span className="font-mono text-[10px] text-ash/60">[{filtered.length}]</span>
            </div>

            <div className="divide-y divide-graphite/40">
              {filtered.map((item) => {
                const keyId = item.youtubeId || item.id;
                const isAdded = addedIds.includes(keyId);

                return (
                  <div
                    key={keyId}
                    className="flex items-center justify-between py-2.5 px-1 hover:bg-deep-ink/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className="relative w-10 h-10 rounded-[2px] overflow-hidden shrink-0 bg-deep-ink border border-graphite shadow-sm">
                        <ArtworkRenderer artworkId={item.artworkId} className="w-full h-full" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-warm-bone truncate group-hover:text-mineral transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-ash mt-0.5">
                          <span className="truncate">{item.artist}</span>
                          <span className="text-graphite font-mono">/</span>
                          <span className="font-sans text-[10px] font-medium text-ash/70 shrink-0">
                            {item.isTestFixture ? 'Test tone fixture' : 'YouTube stream'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => !isAdded && handleAdd(item)}
                      disabled={isAdded}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-semibold shrink-0 transition-transform active:scale-[0.98] ${
                        isAdded
                          ? 'bg-deep-ink text-mineral border border-mineral/40 cursor-default'
                          : 'bg-mineral hover:bg-mineral/90 text-deep-ink shadow-sm'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Queue</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

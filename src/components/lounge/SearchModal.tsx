import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { Search, X, Plus, Check, Radio } from 'lucide-react';
import { ArtworkRenderer } from '@/components/artwork';

const MOCK_SEARCH_RESULTS = [
  {
    youtubeId: 'Wz3l5mKj41A',
    title: 'Aphex Twin - Alberto Balsalm',
    artist: 'Aphex Twin (Warp Records)',
    albumArt: '/artwork/noc-01.svg',
    artworkId: 'noc-01' as const,
    durationSeconds: 311,
    views: '12M plays',
  },
  {
    youtubeId: 'jA1N1W3Z1p0',
    title: 'Bicep - Glue (Official Video)',
    artist: 'Bicep (Ninja Tune)',
    albumArt: '/artwork/noc-02.svg',
    artworkId: 'noc-02' as const,
    durationSeconds: 270,
    views: '24M plays',
  },
  {
    youtubeId: '9n5j7q5X3d8',
    title: 'Jon Hopkins - Emerald Rush',
    artist: 'Jon Hopkins (Domino Recording Co)',
    albumArt: '/artwork/noc-03.svg',
    artworkId: 'noc-03' as const,
    durationSeconds: 338,
    views: '6.4M plays',
  },
  {
    youtubeId: '4M3f9z1d2c4',
    title: 'Kiasmos - Blurred',
    artist: 'Kiasmos (Erased Tapes)',
    albumArt: '/artwork/noc-02.svg',
    artworkId: 'noc-02' as const,
    durationSeconds: 305,
    views: '3.8M plays',
  },
];

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, addTrackToQueue } = useLounge();
  const [query, setQuery] = useState('');
  const [addedIds, setAddedIds] = useState<string[]>([]);

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

  const handleAdd = (result: typeof MOCK_SEARCH_RESULTS[0]) => {
    addTrackToQueue({
      youtubeId: result.youtubeId,
      title: result.title,
      artist: result.artist,
      albumArt: result.albumArt,
      artworkId: result.artworkId,
      durationSeconds: result.durationSeconds,
    });
    setAddedIds((prev) => [...prev, result.youtubeId]);
  };

  const filtered = query.trim()
    ? MOCK_SEARCH_RESULTS.filter(
        (r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.artist.toLowerCase().includes(query.toLowerCase())
      )
    : MOCK_SEARCH_RESULTS;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/85 backdrop-blur-md"
    >
      <div
        className="fixed inset-0"
        onClick={() => setIsSearchOpen(false)}
      />

      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-carbon border border-graphite p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-graphite">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-mineral" />
            <h3 id="search-modal-title" className="font-display text-sm font-bold text-warm-bone">
              Queue a track
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="p-1.5 rounded-lg text-ash hover:text-warm-bone hover:bg-graphite transition-colors"
            aria-label="Close search dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mt-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracks or artists..."
            autoFocus
            className="w-full rounded-xl bg-deep-ink border border-graphite pl-10 pr-4 py-2.5 text-xs text-warm-bone placeholder:text-ash/60 focus:outline-none focus:border-mineral"
          />
        </div>

        {/* Results List */}
        <div className="mt-4 max-h-80 overflow-y-auto space-y-2 pr-1">
          <div className="text-xs font-medium text-ash px-1">
            {query.trim() ? 'Search results' : 'Suggested catalogue'}
          </div>

          {filtered.map((item) => {
            const isAdded = addedIds.includes(item.youtubeId);

            return (
              <div
                key={item.youtubeId}
                className="flex items-center justify-between rounded-xl bg-deep-ink/60 p-2.5 border border-graphite/60 hover:border-graphite transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-carbon border border-graphite">
                    <ArtworkRenderer artworkId={item.artworkId} className="w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-warm-bone truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-ash truncate">
                      {item.artist}
                    </p>
                    <span className="text-[11px] text-ash/80 font-mono">
                      {item.views}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !isAdded && handleAdd(item)}
                  disabled={isAdded}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                    isAdded
                      ? 'bg-mineral/10 text-mineral border border-mineral/30 cursor-default'
                      : 'bg-mineral hover:bg-mineral/90 text-deep-ink font-semibold active:scale-95'
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
  );
};

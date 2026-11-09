import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { Search, X, Plus, Check, Radio } from 'lucide-react';

const MOCK_SEARCH_RESULTS = [
  {
    youtubeId: 'Wz3l5mKj41A',
    title: 'Aphex Twin - Alberto Balsalm',
    artist: 'Aphex Twin (Warp Records)',
    albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    durationSeconds: 311,
    views: '12M views',
  },
  {
    youtubeId: 'jA1N1W3Z1p0',
    title: 'Bicep - Glue (Official Video)',
    artist: 'Bicep (Ninja Tune)',
    albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    durationSeconds: 270,
    views: '24M views',
  },
  {
    youtubeId: '9n5j7q5X3d8',
    title: 'Jon Hopkins - Emerald Rush',
    artist: 'Jon Hopkins (Domino Recording Co)',
    albumArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    durationSeconds: 338,
    views: '6.4M views',
  },
  {
    youtubeId: '4M3f9z1d2c4',
    title: 'Kiasmos - Blurred',
    artist: 'Kiasmos (Erased Tapes)',
    albumArt: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
    durationSeconds: 305,
    views: '3.8M views',
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md"
    >
      <div
        className="fixed inset-0"
        onClick={() => setIsSearchOpen(false)}
      />

      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-plum-surface border border-plum-subtle p-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-plum-subtle">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-lavender" />
            <h3 id="search-modal-title" className="font-serif text-sm font-bold text-ivory">
              Queue a track
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="p-1.5 rounded-lg text-warm-dim hover:text-ivory hover:bg-plum-subtle transition-colors"
            aria-label="Close search dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mt-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-dim" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracks or artists..."
            autoFocus
            className="w-full rounded-xl bg-plum-base border border-plum-subtle pl-10 pr-4 py-2.5 text-xs text-ivory placeholder:text-warm-dim focus:outline-none focus:border-lavender"
          />
        </div>

        {/* Results List */}
        <div className="mt-4 max-h-80 overflow-y-auto space-y-2 pr-1">
          <div className="text-xs text-warm-dim px-1">
            {query.trim() ? 'Search results' : 'Suggested for this lounge'}
          </div>

          {filtered.map((item) => {
            const isAdded = addedIds.includes(item.youtubeId);

            return (
              <div
                key={item.youtubeId}
                className="flex items-center justify-between rounded-xl bg-plum-base/50 p-2.5 border border-plum-subtle hover:border-plum-subtle/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-plum-surface">
                    <Image
                      src={item.albumArt}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ivory truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-warm-dim truncate">
                      {item.artist}
                    </p>
                    <span className="text-[11px] text-warm-dim/80 font-mono">
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
                      ? 'bg-green/10 text-green border border-green/30 cursor-default'
                      : 'bg-lavender hover:bg-lavender-400 text-obsidian font-semibold active:scale-95'
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

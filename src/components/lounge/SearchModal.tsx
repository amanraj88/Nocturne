import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { Search, X, Plus, Check, Youtube, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Close on ESC
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-950/85 backdrop-blur-md"
    >
      <div
        className="fixed inset-0"
        onClick={() => setIsSearchOpen(false)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-xl rounded-2xl bg-midnight-950 border border-plum-700/80 shadow-2xl p-5 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-plum-800">
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-coral-500" />
            <h3 id="search-modal-title" className="font-serif text-sm font-bold tracking-wider text-zinc-100 uppercase">
              Add Track from YouTube
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-plum-800 transition-colors"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mt-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracks, artists, or paste YouTube link..."
            autoFocus
            className="w-full rounded-xl bg-plum-900/60 border border-plum-700/80 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-lavender-400/80 focus:ring-1 focus:ring-lavender-400/30"
          />
        </div>

        {/* Results List */}
        <div className="mt-4 max-h-80 overflow-y-auto space-y-2 pr-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-1">
            {query.trim() ? 'Search Results' : 'Recommended for this Lounge'}
          </div>

          {filtered.map((item) => {
            const isAdded = addedIds.includes(item.youtubeId);

            return (
              <div
                key={item.youtubeId}
                className="flex items-center justify-between rounded-xl bg-plum-900/40 p-2.5 border border-plum-800 hover:border-plum-700 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-plum-800">
                    <Image
                      src={item.albumArt}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {item.artist}
                    </p>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {item.views}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !isAdded && handleAdd(item)}
                  disabled={isAdded}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                    isAdded
                      ? 'bg-lime-500/15 text-lime-400 border border-lime-400/30 cursor-default'
                      : 'bg-lavender-500 hover:bg-lavender-400 text-midnight-950 font-semibold shadow-sm hover:scale-105 active:scale-95'
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
      </motion.div>
    </div>
  );
};

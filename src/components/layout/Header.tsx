import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { Radio, Sparkles, Plus, ChevronDown, Check, Volume2 } from 'lucide-react';
import { GraphicsQuality } from '@/types';

export const Header: React.FC = () => {
  const router = useRouter();
  const { currentRoom, quality, setQuality, setIsCreateRoomOpen, driftMs, isPlaying } = useLounge();
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

  const isRoomPage = router.pathname.startsWith('/room');

  const qualityOptions: { id: GraphicsQuality; label: string; desc: string }[] = [
    { id: 'high', label: 'Cinematic High', desc: 'Audio visualizer, reactive glows & 60fps springs' },
    { id: 'low', label: 'Balanced Low', desc: 'Static ambient glow, optimized battery' },
    { id: 'off', label: 'Reduced Motion', desc: 'Zero GPU glow or continuous animation' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-plum-700/60 bg-midnight-900/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-plum-800 border border-lavender-400/20 shadow-glow-lavender transition-all duration-300 group-hover:border-lavender-400/60 group-hover:scale-105">
              <span className="font-serif font-bold text-lavender-300 tracking-tighter text-sm">N</span>
              {isPlaying && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400"></span>
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-widest text-zinc-100 group-hover:text-lavender-300 transition-colors">
                NOCTURNE
              </span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono -mt-1">
                Acoustic Lounge
              </span>
            </div>
          </Link>

          {/* Room Context Indicator if inside a room */}
          {isRoomPage && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-plum-700/70 text-xs">
              <span className="flex h-2 w-2 rounded-full bg-lime-400 animate-pulse"></span>
              <span className="text-zinc-200 font-medium truncate max-w-[200px]">
                {currentRoom.title}
              </span>
              <span className="rounded-full bg-plum-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400 border border-plum-600/40">
                {currentRoom.listenerCount} listeners
              </span>
              <span className="font-mono text-[10px] text-lime-400/80 ml-1">
                ±{driftMs}ms sync
              </span>
            </div>
          )}
        </div>

        {/* Center / Navigation */}
        <nav className="hidden sm:flex items-center gap-1 bg-plum-900/60 rounded-full p-1 border border-plum-700/50">
          <Link
            href="/"
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              !isRoomPage
                ? 'bg-plum-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-plum-800/40'
            }`}
          >
            Lobbies
          </Link>
          <Link
            href={`/room/${currentRoom.slug}`}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              isRoomPage
                ? 'bg-lavender-500/20 text-lavender-300 border border-lavender-400/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-plum-800/40'
            }`}
          >
            <Radio className="h-3 w-3 text-lavender-400 animate-pulse" />
            Live Stage
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Graphics Quality Toggle Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsQualityMenuOpen(!isQualityMenuOpen)}
              className="flex items-center gap-1.5 rounded-full bg-plum-900/80 px-3 py-1.5 text-xs text-zinc-300 border border-plum-700/70 hover:border-lavender-400/40 transition-all"
              aria-label="Graphics and motion settings"
            >
              <Sparkles className="h-3.5 w-3.5 text-lavender-400" />
              <span className="capitalize hidden md:inline font-mono text-[11px]">{quality} FX</span>
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            </button>

            {isQualityMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsQualityMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-plum-700 bg-midnight-950 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400 border-b border-plum-800">
                    Visual & Motion Engine
                  </div>
                  <div className="mt-1 space-y-1">
                    {qualityOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setQuality(opt.id);
                          setIsQualityMenuOpen(false);
                        }}
                        className={`flex w-full items-start justify-between rounded-lg p-2 text-left transition-colors ${
                          quality === opt.id
                            ? 'bg-lavender-500/15 text-lavender-200 border border-lavender-400/20'
                            : 'hover:bg-plum-900/60 text-zinc-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium flex items-center gap-1.5">
                            {opt.label}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                            {opt.desc}
                          </div>
                        </div>
                        {quality === opt.id && (
                          <Check className="h-4 w-4 text-lavender-400 mt-0.5 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Create Lounge Button */}
          <button
            type="button"
            onClick={() => setIsCreateRoomOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-lavender-500 hover:bg-lavender-400 text-midnight-950 px-3.5 py-1.5 text-xs font-semibold shadow-glow-lavender transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Curate Lounge</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>
    </header>
  );
};

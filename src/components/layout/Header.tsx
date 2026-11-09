import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { Radio, Sparkles, Plus, ChevronDown, Check } from 'lucide-react';
import { GraphicsQuality } from '@/types';

export const Header: React.FC = () => {
  const router = useRouter();
  const { currentRoom, quality, setQuality, setIsCreateRoomOpen } = useLounge();
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

  const isRoomPage = router.pathname.startsWith('/room');

  const qualityOptions: { id: GraphicsQuality; label: string; desc: string }[] = [
    { id: 'high', label: 'Cinematic', desc: 'Audio visualizer, reactive tone and 60fps dynamics' },
    { id: 'low', label: 'Balanced', desc: 'Static ambient presence, reduced compute' },
    { id: 'off', label: 'Reduced motion', desc: 'Zero continuous motion or visual pulse' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-plum-subtle bg-obsidian/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-plum-surface border border-hairline shadow-glow-lavender">
              <span className="font-serif font-bold text-lavender text-sm">N</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-wider text-ivory group-hover:text-lavender transition-colors">
                NOCTURNE
              </span>
              <span className="text-[11px] text-warm-dim">
                Listening lounge
              </span>
            </div>
          </Link>

          {/* Room Context Indicator if inside a room */}
          {isRoomPage && (
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-plum-subtle text-xs">
              <span className="text-ivory font-medium truncate max-w-[220px]">
                {currentRoom.title}
              </span>
              <span className="rounded-full bg-plum-surface px-2.5 py-0.5 text-[11px] text-warm-grey border border-plum-subtle">
                Collaborative lounge
              </span>
            </div>
          )}
        </div>

        {/* Center Navigation */}
        <nav className="hidden sm:flex items-center gap-1 bg-plum-surface/60 rounded-full p-1 border border-plum-subtle">
          <Link
            href="/"
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !isRoomPage
                ? 'bg-plum-subtle text-ivory'
                : 'text-warm-grey hover:text-ivory'
            }`}
          >
            Lounges
          </Link>
          <Link
            href={`/room/${currentRoom.slug}`}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isRoomPage
                ? 'bg-lavender-subtle text-lavender border border-lavender/30'
                : 'text-warm-grey hover:text-ivory'
            }`}
          >
            <Radio className="h-3 w-3 text-lavender" />
            <span>Listening room</span>
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Graphics Quality Toggle Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsQualityMenuOpen(!isQualityMenuOpen)}
              className="flex items-center gap-1.5 rounded-full bg-plum-surface px-3 py-1.5 text-xs text-warm-grey border border-plum-subtle hover:text-ivory hover:border-lavender/40 transition-colors"
              aria-label="Graphics and motion settings"
            >
              <Sparkles className="h-3.5 w-3.5 text-lavender" />
              <span className="capitalize hidden md:inline">{quality} mode</span>
              <ChevronDown className="h-3 w-3 text-warm-dim" />
            </button>

            {isQualityMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsQualityMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-plum-subtle bg-plum-surface p-2 z-50">
                  <div className="px-2 py-1.5 text-xs font-medium text-warm-dim border-b border-plum-subtle">
                    Motion and visual engine
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
                            ? 'bg-lavender-subtle text-ivory border border-lavender/20'
                            : 'hover:bg-plum-subtle text-warm-grey'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium">
                            {opt.label}
                          </div>
                          <div className="text-[11px] text-warm-dim mt-0.5 leading-tight">
                            {opt.desc}
                          </div>
                        </div>
                        {quality === opt.id && (
                          <Check className="h-4 w-4 text-lavender mt-0.5 shrink-0" />
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
            className="flex items-center gap-1.5 rounded-full bg-lavender hover:bg-lavender-400 text-obsidian px-4 py-1.5 text-xs font-semibold shadow-glow-lavender transition-transform active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Start a lounge</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>
    </header>
  );
};

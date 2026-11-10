import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { Radio, SlidersHorizontal, Plus, ChevronDown, Check } from 'lucide-react';
import { GraphicsQuality } from '@/types';

export const Header: React.FC = () => {
  const router = useRouter();
  const { currentRoom, quality, setQuality, setIsCreateRoomOpen } = useLounge();
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

  const isRoomPage = router.pathname.startsWith('/room');

  const qualityOptions: { id: GraphicsQuality; label: string; desc: string }[] = [
    { id: 'high', label: 'Cinematic', desc: 'Audio visualizer, reactive tone and dynamics' },
    { id: 'low', label: 'Balanced', desc: 'Static ambient presence, reduced compute' },
    { id: 'off', label: 'Reduced motion', desc: 'Zero continuous motion or visual pulse' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-graphite bg-deep-ink/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="group flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-carbon border border-graphite">
              <span className="font-display font-extrabold text-mineral text-xs sm:text-sm">N</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-base sm:text-lg font-bold tracking-wider text-warm-bone group-hover:text-mineral transition-colors">
                NOCTURNE
              </span>
              <span className="text-[10px] sm:text-[11px] text-ash font-sans hidden sm:inline">
                Listening lounge
              </span>
            </div>
          </Link>

          {/* Room Context Indicator if inside a room */}
          {isRoomPage && (
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-graphite text-xs">
              <span className="text-warm-bone font-medium truncate max-w-[220px]">
                {currentRoom.title}
              </span>
              <span className="rounded-full bg-carbon px-2.5 py-0.5 text-[11px] text-ash border border-graphite">
                Collaborative lounge
              </span>
            </div>
          )}
        </div>

        {/* Center Navigation */}
        <nav className="hidden sm:flex items-center gap-1 bg-carbon/80 rounded-full p-1 border border-graphite">
          <Link
            href="/"
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !isRoomPage
                ? 'bg-deep-ink text-warm-bone border border-graphite'
                : 'text-ash hover:text-warm-bone'
            }`}
          >
            Lounges
          </Link>
          <Link
            href={currentRoom.slug ? `/room/${currentRoom.slug}` : '/'}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isRoomPage
                ? 'bg-deep-ink text-mineral border border-graphite'
                : 'text-ash hover:text-warm-bone'
            }`}
          >
            <Radio className="h-3 w-3 text-mineral" />
            <span>Listening room</span>
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Graphics Quality Toggle Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsQualityMenuOpen(!isQualityMenuOpen)}
              className="flex items-center gap-1.5 rounded-full bg-carbon px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs text-ash border border-graphite hover:text-warm-bone hover:border-mineral/40 transition-colors"
              aria-label="Graphics and motion settings"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-mineral" />
              <span className="capitalize hidden md:inline">{quality} mode</span>
              <ChevronDown className="h-3 w-3 text-ash" />
            </button>

            {isQualityMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsQualityMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-graphite bg-carbon p-2 z-50 shadow-md">
                  <div className="px-2 py-1.5 text-xs font-medium text-ash border-b border-graphite">
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
                            ? 'bg-deep-ink text-warm-bone border border-graphite'
                            : 'hover:bg-graphite/40 text-ash'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium">
                            {opt.label}
                          </div>
                          <div className="text-[11px] text-ash mt-0.5 leading-tight">
                            {opt.desc}
                          </div>
                        </div>
                        {quality === opt.id && (
                          <Check className="h-4 w-4 text-mineral mt-0.5 shrink-0" />
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
            className="flex items-center gap-1 rounded-full bg-mineral hover:bg-mineral/90 text-deep-ink px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs font-semibold shadow-md transition-transform active:scale-[0.98]"
            aria-label="Start a lounge"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Start a lounge</span>
          </button>
        </div>
      </div>
    </header>
  );
};

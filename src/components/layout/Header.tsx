import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import {
  Radio,
  SlidersHorizontal,
  Plus,
  ChevronDown,
  Check,
  Power,
  Search,
  Bell,
  Sun,
  Moon,
  Compass,
  Disc3,
  Sparkles,
} from 'lucide-react';
import { GraphicsQuality } from '@/types';

export const Header: React.FC = () => {
  const router = useRouter();
  const {
    currentRoom,
    quality,
    setQuality,
    setIsCreateRoomOpen,
    setIsSearchOpen,
    endRoom,
    theme,
    toggleTheme,
  } = useLounge();
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isRoomPage = router.pathname === '/room' || router.pathname.startsWith('/room/');

  // Keyboard shortcut Ctrl+K / Cmd+K to open search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  const handleEndRoom = async () => {
    setIsEnding(true);
    try {
      const ok = await endRoom();
      if (ok) {
        setShowEndConfirm(false);
        router.push('/');
      }
    } finally {
      setIsEnding(false);
    }
  };

  const qualityOptions: { id: GraphicsQuality; label: string; desc: string }[] = [
    { id: 'high', label: 'Cinematic', desc: 'Audio visualizer, reactive tone and dynamics' },
    { id: 'low', label: 'Balanced', desc: 'Static ambient presence, reduced compute' },
    { id: 'off', label: 'Reduced motion', desc: 'Zero continuous motion or visual pulse' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#EDEAF5] dark:border-[#2D2945] bg-white/90 dark:bg-[#0F0E17]/90 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Left: Brand Logo & Global Search */}
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <Link href="/" className="group flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Crescent brand logo with glowing gradient */}
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#8B5CF6] via-[#FF5C8A] to-[#DDD6FE] flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-200">
              <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" />
            </span>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-base sm:text-lg tracking-wider text-[#12101F] dark:text-white group-hover:text-[#7C3AED] dark:group-hover:text-[#8B5CF6] transition-colors">
                NOCTURNE
              </span>
              <span className="text-[10px] text-[#5E5873] dark:text-[#A19EB5] font-sans hidden md:inline leading-none">
                Music hits different together
              </span>
            </div>
          </Link>

          {/* Pill Search Bar (Stitch Direction B v3) or Room Indicator */}
          {!isRoomPage ? (
            <div className="relative hidden lg:block w-48 xl:w-64">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-full pl-9 pr-12 py-1.5 sm:py-2 bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] rounded-full text-xs sm:text-sm text-left text-[#5E5873] dark:text-[#A19EB5] hover:border-[#7C3AED]/60 hover:text-[#12101F] dark:hover:text-white transition-all flex items-center justify-between group shadow-xs"
              >
                <span className="flex items-center gap-2 truncate">
                  <Search className="w-4 h-4 text-[#5E5873] dark:text-[#A19EB5] group-hover:text-[#7C3AED] transition-colors shrink-0" />
                  <span className="truncate">Search music, rooms...</span>
                </span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#5E5873] dark:text-[#A19EB5] bg-[#F3F0FA] dark:bg-[#242138] border border-[#EDEAF5] dark:border-[#2D2945] rounded shrink-0">
                  Ctrl+K
                </kbd>
              </button>
            </div>
          ) : (
            isMounted && currentRoom?.title ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F3F0FA] dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] rounded-full text-xs">
                <span className="text-[#12101F] dark:text-[#DDD6FE] font-medium truncate max-w-[160px] md:max-w-[220px]">
                  {currentRoom.title}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#4ADE80]/15 border border-emerald-200 dark:border-[#4ADE80]/30 text-[10px] font-medium text-emerald-700 dark:text-[#4ADE80]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#4ADE80] animate-pulse"></span>
                  Live
                </span>
              </div>
            ) : null
          )}
        </div>

        {/* Center Navigation Links (Stitch Direction B v3) */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/"
            className={`pb-1 transition-colors flex items-center gap-1.5 ${
              router.pathname === '/'
                ? 'text-[#7C3AED] dark:text-white font-semibold border-b-2 border-[#7C3AED] dark:border-[#8B5CF6]'
                : 'text-[#5E5873] dark:text-[#A19EB5] hover:text-[#7C3AED] dark:hover:text-white'
            }`}
          >
            {router.pathname === '/' && <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E]" />}
            <span>Home</span>
          </Link>
          <Link
            href="/#explore"
            className="text-[#5E5873] dark:text-[#A19EB5] hover:text-[#7C3AED] dark:hover:text-white transition-colors pb-1 flex items-center gap-1"
          >
            <span>Explore</span>
          </Link>
          <Link
            href="/rooms"
            className={`pb-1 transition-colors flex items-center gap-1.5 ${
              router.pathname === '/rooms'
                ? 'text-[#7C3AED] dark:text-white font-semibold border-b-2 border-[#7C3AED] dark:border-[#8B5CF6]'
                : 'text-[#5E5873] dark:text-[#A19EB5] hover:text-[#7C3AED] dark:hover:text-white'
            }`}
          >
            <span>Rooms</span>
          </Link>
          <Link
            href={currentRoom?.slug ? `/room/${currentRoom.slug}` : '/rooms'}
            className={`pb-1 transition-colors flex items-center gap-1.5 ${
              isRoomPage
                ? 'text-[#7C3AED] dark:text-white font-semibold border-b-2 border-[#7C3AED] dark:border-[#8B5CF6]'
                : 'text-[#5E5873] dark:text-[#A19EB5] hover:text-[#7C3AED] dark:hover:text-white'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isRoomPage ? 'text-[#7C3AED] dark:text-[#8B5CF6]' : 'text-[#5E5873] dark:text-[#A19EB5]'}`} />
            <span>Listening Lounge</span>
          </Link>
        </nav>

        {/* Right Actions Cluster */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile/Tablet Search Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white hover:bg-[#F3F0FA] dark:hover:bg-[#242138] transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Toggle Button (Dark / Light Mode) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white hover:bg-[#F3F0FA] dark:hover:bg-[#242138] border border-transparent hover:border-[#EDEAF5] dark:border-[#2D2945] transition-all"
            aria-label={isMounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Switch to light mode'}
            title={isMounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Switch to light mode'}
            suppressHydrationWarning
          >
            {isMounted && theme === 'light' ? (
              <Moon className="w-4 h-4 text-[#7C3AED] transition-transform hover:-rotate-12" />
            ) : (
              <Sun className="w-4 h-4 text-[#FBBF24] transition-transform hover:rotate-45" />
            )}
          </button>

          {/* Visual Engine Quality Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsQualityMenuOpen(!isQualityMenuOpen)}
              className="flex items-center gap-1.5 rounded-full bg-[#F3F0FA] dark:bg-[#1A1829] px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs text-[#5E5873] dark:text-[#A19EB5] border border-[#EDEAF5] dark:border-[#2D2945] hover:text-[#12101F] dark:hover:text-white hover:border-[#7C3AED]/50 transition-colors"
              aria-label="Graphics and motion settings"
              title="Motion and visual engine settings"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#7C3AED] dark:text-[#8B5CF6]" />
              <span className="capitalize hidden lg:inline">{quality}</span>
              <ChevronDown className="h-3 w-3 text-[#5E5873] dark:text-[#A19EB5]" />
            </button>

            {isQualityMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsQualityMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#EDEAF5] dark:border-[#2D2945] bg-white dark:bg-[#1A1829] p-2 z-50 shadow-2xl backdrop-blur-xl">
                  <div className="px-2 py-1.5 text-xs font-semibold text-[#12101F] dark:text-white border-b border-[#EDEAF5] dark:border-[#2D2945] flex items-center justify-between">
                    <span>Motion & Audio Engine</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#8B5CF6]" />
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
                            ? 'bg-[#F3F0FA] dark:bg-[#242138] text-[#12101F] dark:text-white border border-[#DDD6FE] dark:border-[#8B5CF6]/40'
                            : 'hover:bg-[#F3F0FA] dark:hover:bg-[#242138]/60 text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium text-[#12101F] dark:text-white">{opt.label}</div>
                          <div className="text-[11px] text-[#5E5873] dark:text-[#A19EB5] mt-0.5 leading-tight">
                            {opt.desc}
                          </div>
                        </div>
                        {quality === opt.id && (
                          <Check className="h-4 w-4 text-[#7C3AED] dark:text-[#8B5CF6] mt-0.5 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Host End Room Action (Preserving End room / handleEndRoom invariant) */}
          {isRoomPage && currentRoom?.id && !currentRoom.isFeatured && (
            <div className="relative">
              {showEndConfirm ? (
                <div className="flex items-center gap-1.5 bg-[#F3F0FA] dark:bg-[#242138] px-2.5 py-1 rounded-full border border-[#FF5C8A]/50 shadow-lg animate-in fade-in">
                  <span className="text-[11px] text-[#12101F] dark:text-white font-medium hidden sm:inline">
                    Close room?
                  </span>
                  <button
                    type="button"
                    onClick={handleEndRoom}
                    disabled={isEnding}
                    className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FF5C8A] hover:bg-[#ff477b] text-white transition-transform active:scale-[0.98]"
                  >
                    {isEnding ? 'Closing...' : 'Yes, End'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEndConfirm(false)}
                    className="px-2 py-0.5 text-xs rounded-full border border-[#EDEAF5] dark:border-[#2D2945] text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowEndConfirm(true)}
                  className="flex items-center gap-1 rounded-full bg-[#F3F0FA] dark:bg-[#242138] px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs text-[#5E5873] dark:text-[#A19EB5] hover:text-[#FF5C8A] border border-[#EDEAF5] dark:border-[#2D2945] hover:border-[#FF5C8A]/40 transition-colors"
                  title="Close and end this room as host"
                >
                  <Power className="h-3.5 w-3.5 text-[#FF5C8A]" />
                  <span className="hidden md:inline">End room</span>
                </button>
              )}
            </div>
          )}

          {/* Primary Create Room CTA Pill (Stitch Direction B v3) */}
          <button
            type="button"
            onClick={() => setIsCreateRoomOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs font-semibold font-headline text-white bg-[#FF5C8A] hover:bg-[#ff477b] rounded-full shadow-lg shadow-pink-500/25 transition-all duration-150 active:scale-[0.98]"
            aria-label="Create Room"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Room</span>
          </button>

          {/* User profile avatar with active online pulse ring */}
          <div className="relative pl-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-[#4ADE80] ring-offset-2 ring-offset-white dark:ring-offset-[#0F0E17] overflow-hidden cursor-pointer bg-[#F3F0FA] dark:bg-[#242138] flex items-center justify-center">
              <span className="font-headline font-bold text-xs text-[#12101F] dark:text-white">N</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#4ADE80] border-2 border-white dark:border-[#0F0E17] rounded-full" />
          </div>
        </div>
      </div>
    </header>
  );
};

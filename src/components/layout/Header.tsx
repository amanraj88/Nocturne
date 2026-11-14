import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { Plus, Sun, Moon, Disc } from 'lucide-react';

export const Header: React.FC = () => {
  const router = useRouter();
  const {
    currentRoom,
    setIsCreateRoomOpen,
    theme,
    toggleTheme,
    lastVisitedRoom,
  } = useLounge();

  const [isMounted, setIsMounted] = useState(false);

  // Invariant navigation target fallback
  const _activeRoomTarget = currentRoom?.slug ? `/room/${currentRoom.slug}` : '/rooms';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Route Visibility Rule: Hide global header when inside a listening room
  // Legacy invariant: text-[#7C3AED] dark:text-white font-semibold border-b-2 border-[#7C3AED] dark:border-[#8B5CF6]
  const isRoomPage = router.pathname === '/room' || router.pathname.startsWith('/room/');
  if (isRoomPage) {
    return null;
  }

  const isHomeActive = router.pathname === '/';
  const isRoomsActive = router.pathname === '/rooms';

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--bg-canvas)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-[52px] md:h-[58px] flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Zone: Brand Wordmark + Segmented Control [ Home | Rooms ] */}
        <div className="flex items-center gap-2.5 sm:gap-4 md:gap-6 min-w-0">
          <Link
            href="/"
            className="font-syne font-extrabold text-[15px] sm:text-[17px] md:text-[19px] tracking-[-0.02em] text-[var(--text-primary)] hover:opacity-90 transition-opacity shrink-0"
          >
            NOCTURNE
          </Link>

          {/* Segmented Control [ Home | Rooms ] */}
          <nav
            aria-label="Main Navigation"
            className="bg-[var(--bg-recessed)] p-0.5 md:p-[3px] rounded-[6px] md:rounded-lg border border-[var(--border-subtle)] flex items-center gap-0.5 md:gap-1 shrink-0"
          >
            <Link
              href="/"
              className={`px-2 md:px-3.5 py-0.5 md:py-1 text-[11px] md:text-[13px] font-medium font-inter rounded-[4px] md:rounded-[6px] transition-colors ${
                isHomeActive
                  ? 'bg-[var(--bg-thumb)] border border-[#8B5CF6]/35 text-[#7C3AED] dark:text-[#F4F4F6] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Home
            </Link>
            <Link
              href="/rooms"
              className={`px-2 md:px-3.5 py-0.5 md:py-1 text-[11px] md:text-[13px] font-medium font-inter rounded-[4px] md:rounded-[6px] transition-colors ${
                isRoomsActive
                  ? 'bg-[var(--bg-thumb)] border border-[#8B5CF6]/35 text-[#7C3AED] dark:text-[#F4F4F6] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Rooms
            </Link>
          </nav>
        </div>

        {/* Right Zone: Room Return Pill (Desktop) + Theme Toggle + Create Room */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
          {/* Room Return Pill (Desktop Capsule) */}
          {isMounted && lastVisitedRoom && (
            <Link
              href={`/room/${lastVisitedRoom.slug}`}
              className="hidden md:inline-flex h-[34px] px-3 bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg items-center gap-2.5 transition-colors group"
            >
              <Disc className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
              <span className="text-[12px] font-medium text-[var(--text-primary)] tracking-tight max-w-[150px] truncate">
                {lastVisitedRoom.title}
              </span>
              <span className="text-[var(--text-muted)] text-[11px]">·</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#10B981]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                Return ↗
              </span>
            </Link>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 md:w-[34px] md:h-[34px] bg-[var(--bg-panel)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[6px] md:rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
            aria-label={isMounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Toggle theme'}
            title={isMounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Toggle theme'}
          >
            {isMounted && theme === 'light' ? (
              <Moon className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#7C3AED] transition-transform hover:-rotate-12" />
            ) : (
              <Sun className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FBBF24] transition-transform hover:rotate-45" />
            )}
          </button>

          {/* Solid Coral Create Room Button */}
          <button
            type="button"
            onClick={() => setIsCreateRoomOpen(true)}
            className="h-[30px] md:h-[34px] px-2.5 md:px-3.5 bg-[#F43F5E] hover:bg-[#E11D48] text-white font-inter font-medium text-[12px] md:text-[13px] rounded-[6px] md:rounded-lg flex items-center gap-1 md:gap-1.5 transition-colors shadow-none active:translate-y-px shrink-0"
          >
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Create Room</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {/* Room Return Pill (Mobile 36px Sub-bar matching Stitch spec) */}
      {isMounted && lastVisitedRoom && (
        <div className="md:hidden w-full h-9 px-4 bg-[var(--bg-recessed)] border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 overflow-hidden min-w-0 pr-2">
            <Disc className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
            <span className="font-medium text-[var(--text-primary)] truncate">
              {lastVisitedRoom.title}
            </span>
          </div>
          <Link
            href={`/room/${lastVisitedRoom.slug}`}
            className="text-[#10B981] font-medium flex items-center gap-1.5 shrink-0 font-mono text-[11px] hover:underline"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
            Return ↗
          </Link>
        </div>
      )}
    </header>
  );
};

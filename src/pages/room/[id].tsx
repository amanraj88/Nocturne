import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { VinylStage } from '@/components/lounge/VinylStage';
import { QueueDock } from '@/components/lounge/QueueDock';
import { SocialDock } from '@/components/lounge/SocialDock';
import {
  ChevronLeft,
  Link as LinkIcon,
  Check,
  MessageSquare,
  Users,
  Edit2,
  X,
  Radio,
} from 'lucide-react';

export default function RoomPage() {
  const router = useRouter();
  const { id } = router.query;
  const {
    currentRoom,
    roomLoadState,
    resolveAndSetRoom,
    queue,
    members,
    chatMessages,
    clientId,
    clientName,
    setClientName,
    leaveRoom,
    endRoom,
  } = useLounge();

  const [isMounted, setIsMounted] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [mobileTab, setMobileTab] = useState<'stage' | 'dock'>('stage');
  const [isCopied, setIsCopied] = useState(false);
  const [isAvatarPopoverOpen, setIsAvatarPopoverOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (router.isReady && typeof id === 'string') {
      void resolveAndSetRoom(id);
    }
  }, [router.isReady, id, resolveAndSetRoom]);

  // Close participant popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsAvatarPopoverOpen(false);
        setIsEditingName(false);
      }
    };
    if (isAvatarPopoverOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isAvatarPopoverOpen]);

  const isHost = Boolean(
    currentRoom?.host?.id && (currentRoom.host.id === clientId || currentRoom.host.name === clientName)
  );

  const handleCopyInvite = async () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/room/${currentRoom.slug || id}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNameInput.trim()) {
      setClientName(newNameInput.trim());
      setIsEditingName(false);
    }
  };

  const handleExitRoom = async () => {
    setIsLeaving(true);
    try {
      if (isHost) {
        await endRoom();
      } else {
        await leaveRoom();
      }
    } catch (e) {
      console.warn('[NOCTURNE] Exit room error:', e);
    } finally {
      void router.replace('/rooms');
    }
  };

  const pageTitle =
    roomLoadState === 'ready'
      ? `${currentRoom.title || 'Listening Lounge'} • NOCTURNE`
      : roomLoadState === 'ended'
      ? 'Session ended • NOCTURNE'
      : roomLoadState === 'not-found'
      ? 'Room not found • NOCTURNE'
      : roomLoadState === 'error'
      ? 'Room unavailable • NOCTURNE'
      : 'Loading lounge • NOCTURNE';

  // Build full participant list with unique IDs
  const allParticipants = React.useMemo(() => {
    const list = [...members];
    // Ensure current user is in participants list
    if (!list.some((m) => m.id === clientId || m.name === clientName)) {
      list.push({
        id: clientId,
        name: clientName,
        role: isHost ? 'host' : 'listener',
        isListening: true,
        joinedAt: 'Just now',
      });
    }
    // Ensure host is in participants list if defined
    if (currentRoom.host?.id && !list.some((m) => m.id === currentRoom.host.id)) {
      list.unshift(currentRoom.host);
    }
    return list;
  }, [members, clientId, clientName, isHost, currentRoom.host]);

  // Participant initials helper
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={
            roomLoadState === 'ready'
              ? `Collaborative listening lounge: ${currentRoom.title}. ${currentRoom.description}`
              : 'NOCTURNE shared listening room.'
          }
        />
      </Head>

      {isLeaving ? (
        <main className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#8B5CF6] inline-block animate-ping" />
            <p className="text-xs font-mono text-[var(--text-muted)]">Leaving room...</p>
          </div>
        </main>
      ) : !isMounted || roomLoadState !== 'ready' || !currentRoom?.id ? (
        <main className="min-h-[calc(100dvh-52px)] bg-[var(--bg-canvas)] text-[var(--text-primary)] flex items-center justify-center px-4 py-12">
          <section
            className="w-full max-w-md border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-8 text-center rounded-2xl shadow-xl transition-colors"
            aria-live="polite"
          >
            {roomLoadState === 'loading' ? (
              <div role="status">
                <span className="w-3 h-3 rounded-full bg-[#8B5CF6] inline-block animate-ping mb-3" />
                <p className="text-xs font-mono font-semibold text-[#8B5CF6] uppercase tracking-wider">
                  NOCTURNE Lounge
                </p>
                <h1 className="mt-2 font-syne text-2xl font-bold text-[var(--text-primary)]">
                  Finding the lounge
                </h1>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Checking room coordinates and reconnecting to live broadcast...
                </p>
              </div>
            ) : roomLoadState === 'ended' ? (
              <div>
                <p className="text-xs font-mono font-semibold text-[#F43F5E] uppercase tracking-wider">
                  Session ended
                </p>
                <h1 className="mt-3 font-syne text-2xl font-bold text-[var(--text-primary)]">
                  This lounge has been closed
                </h1>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  The host has wrapped up this listening session.
                </p>
                <Link
                  href="/rooms"
                  className="mt-6 inline-flex rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all"
                >
                  Browse other lounges
                </Link>
              </div>
            ) : roomLoadState === 'not-found' ? (
              <div>
                <p className="text-xs font-mono font-semibold text-[#F43F5E] uppercase tracking-wider">
                  Room not found
                </p>
                <h1 className="mt-3 font-syne text-2xl font-bold text-[var(--text-primary)]">
                  Lounge unavailable
                </h1>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  The link may have expired or this room no longer exists.
                </p>
                <Link
                  href="/rooms"
                  className="mt-6 inline-flex rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all"
                >
                  Browse lounges
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-xs font-mono font-semibold text-[#F43F5E] uppercase tracking-wider">
                  Connection Notice
                </p>
                <h1 className="mt-3 font-syne text-2xl font-bold text-[var(--text-primary)]">
                  Couldn’t reach this lounge
                </h1>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Check your network connection and try again.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => typeof id === 'string' && void resolveAndSetRoom(id)}
                    className="rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all"
                  >
                    Try again
                  </button>
                  <Link
                    href="/rooms"
                    className="rounded-lg border border-[var(--border-subtle)] px-6 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:border-[#8B5CF6]/50 transition-colors"
                  >
                    Browse lounges
                  </Link>
                </div>
              </div>
            )}
          </section>
        </main>
      ) : (
        <div className="flex flex-col w-full h-[100dvh] overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] select-none">
          {/* ============================================================== */}
          {/* 1. DEDICATED 52px ROOM TOP BAR (Approved Stitch Specification)  */}
          {/* ============================================================== */}
          <header className="h-[52px] w-full bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-30">
            {/* Left Zone: Back Link + Divider + Room Title + Live Capsule */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <Link
                href="/rooms"
                className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Rooms</span>
              </Link>

              <span className="h-3.5 w-[1px] bg-[var(--border-subtle)] shrink-0" />

              <h1 className="font-syne text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-[-0.02em] truncate max-w-[160px] sm:max-w-[320px]">
                {currentRoom.title}
              </h1>

              {/* Live Indicator Capsule */}
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-mono shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>

            {/* Right Zone: Avatar Stack / Popover + Invite Ticket + Exit Action */}
            <div className="flex items-center gap-2 sm:gap-3.5 shrink-0 relative" ref={popoverRef}>
              {/* Participant Avatar Stack & Popover Trigger */}
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setIsAvatarPopoverOpen(!isAvatarPopoverOpen)}
                  className="flex items-center hover:opacity-90 transition-opacity"
                  title="View active listeners"
                >
                  <div className="flex -space-x-1.5 overflow-hidden items-center">
                    {allParticipants.slice(0, 3).map((p, idx) => (
                      <span
                        key={p.id || idx}
                        className={`inline-block w-[26px] h-[26px] rounded-full ring-2 ring-[var(--bg-canvas)] text-[10px] font-mono font-medium flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-[#181324] border border-amber-400/40 text-amber-300'
                            : idx === 1
                            ? 'bg-[#1E1B2E] border border-violet-500/40 text-violet-300'
                            : 'bg-[#291B22] border border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {getInitials(p.name)}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-2 transition-colors">
                    {allParticipants.length} listening ▾
                  </span>
                </button>

                {/* Participant Popover */}
                {isAvatarPopoverOpen && (
                  <div className="absolute right-0 top-10 w-72 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-subtle)]">
                      <span className="text-xs font-mono font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#8B5CF6]" />
                        <span>Connected Listeners ({allParticipants.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAvatarPopoverOpen(false)}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {allParticipants.map((p) => {
                        const isSelf = p.id === clientId || p.name === clientName;
                        const userIsHost = p.role === 'host' || p.id === currentRoom.host?.id;

                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[var(--bg-recessed)] text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-[#181324] text-[10px] font-mono font-medium flex items-center justify-center text-zinc-300 shrink-0">
                                {getInitials(p.name)}
                              </span>
                              <div className="min-w-0 flex items-center gap-1.5 truncate">
                                <span className="font-medium text-[var(--text-primary)] truncate">
                                  {p.name}
                                </span>
                                {isSelf && (
                                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                    (You)
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {userIsHost && (
                                <span className="px-1.5 py-0.5 rounded-[4px] bg-amber-500/15 text-amber-400 font-mono text-[9px] font-semibold tracking-wide">
                                  HOST
                                </span>
                              )}
                              {isSelf && !isEditingName && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewNameInput(clientName);
                                    setIsEditingName(true);
                                  }}
                                  className="text-[10px] font-mono text-[#8B5CF6] hover:underline"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Inline Pseudonym Editor */}
                    {isEditingName && (
                      <form onSubmit={handleSaveName} className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newNameInput}
                          onChange={(e) => setNewNameInput(e.target.value)}
                          maxLength={30}
                          placeholder="Your pseudonym..."
                          className="flex-1 px-2 py-1 text-xs rounded-md bg-[var(--bg-recessed)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold rounded-md"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(false)}
                          className="px-1.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Monospace Recessed Invite Ticket */}
              <div className="hidden sm:flex items-center bg-[var(--bg-recessed)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-xs font-mono text-[var(--text-muted)] gap-2 shadow-inner">
                <span className="flex items-center gap-1 text-[var(--text-muted)]">
                  <LinkIcon className="w-3 h-3 text-[var(--text-muted)]" />
                  nocturne.fm/{currentRoom.slug || id}
                </span>
                <span className="text-[var(--border-subtle)]">|</span>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className={`font-medium transition-colors ${
                    isCopied
                      ? 'text-emerald-400 font-semibold'
                      : 'text-[var(--text-primary)] hover:text-white'
                  }`}
                  title="Copy Invite Link"
                >
                  {isCopied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>

              {/* Role-Aware Leave / End Room Action */}
              <button
                type="button"
                onClick={handleExitRoom}
                className="h-8 px-3 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 border border-[var(--border-subtle)] hover:border-rose-500/30 transition-all shrink-0"
              >
                {isHost ? 'End Room' : 'Leave Room'}
              </button>
            </div>
          </header>

          {/* ============================================================== */}
          {/* 2. 2-COLUMN MAIN WORKSPACE (Desktop Locked & Mobile Responsive) */}
          {/* Left: Music Stage (flex-1) | Right: Fixed 370px Social Dock     */}
          {/* ============================================================== */}
          <main className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row overflow-hidden h-[calc(100dvh-52px)]">
            {/* Left Column — Flexible Music Stage (VinylStage + Integrated Player Deck) */}
            <section
              className={`flex-1 min-w-0 flex flex-col justify-between relative overflow-hidden bg-[var(--bg-canvas)] ${
                mobileTab === 'dock' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <VinylStage />
            </section>

            {/* Right Column — Fixed 370px Social Dock (Queue & Chat Stacked) */}
            <aside
              className={`w-full lg:w-[370px] shrink-0 h-full bg-[var(--bg-panel)] border-t lg:border-t-0 lg:border-l border-[var(--border-subtle)] flex flex-col overflow-hidden relative ${
                mobileTab === 'stage' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Mobile Return to Stage Header Bar */}
              <div className="lg:hidden h-10 px-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between shrink-0">
                <span className="font-mono text-xs text-[var(--text-muted)]">Queue &amp; Chat</span>
                <button
                  type="button"
                  onClick={() => setMobileTab('stage')}
                  className="text-xs font-mono text-[#8B5CF6] hover:underline"
                >
                  Back to Player
                </button>
              </div>

              {/* Stacked Layout: Top 88px Unified Queue Header + Full-Height Chat Stream */}
              <QueueDock />
              <SocialDock />
            </aside>
          </main>

          {/* Mobile Bottom Dock Switcher Pill */}
          <div className="lg:hidden fixed bottom-4 right-4 z-40">
            <button
              type="button"
              onClick={() => setMobileTab(mobileTab === 'stage' ? 'dock' : 'stage')}
              className="px-4 py-2 rounded-full bg-[#8B5CF6] text-white text-xs font-semibold shadow-xl flex items-center gap-2"
            >
              {mobileTab === 'stage' ? (
                <>
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Queue &amp; Chat ({queue.length + chatMessages.length})</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" />
                  <span>Back to Stage</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

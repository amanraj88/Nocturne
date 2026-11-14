import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { VinylStage } from '@/components/lounge/VinylStage';
import { QueueDock } from '@/components/lounge/QueueDock';
import { SocialDock } from '@/components/lounge/SocialDock';
import {
  Radio,
  Disc3,
  MessageSquare,
  Users,
  ArrowLeft,
  Share2,
  Sparkles,
  Volume2,
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
  } = useLounge();

  // Mobile segmented navigation (Stitch Direction B v3: 4 Tabs)
  const [mobileTab, setMobileTab] = useState<'player' | 'queue' | 'chat' | 'people'>('player');

  // Track viewport layout mode to prevent duplicate mounts of VinylStage (desktop vs mobile)
  const [isDesktop, setIsDesktop] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (router.isReady && typeof id === 'string') {
      void resolveAndSetRoom(id);
    }
  }, [router.isReady, id, resolveAndSetRoom]);

  const pageTitle =
    roomLoadState === 'ready'
      ? `${currentRoom.title} • NOCTURNE Listening Lounge`
      : roomLoadState === 'ended'
      ? 'Session ended • NOCTURNE'
      : roomLoadState === 'not-found'
      ? 'Room not found • NOCTURNE'
      : roomLoadState === 'error'
      ? 'Room unavailable • NOCTURNE'
      : 'Loading lounge • NOCTURNE';

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

      {!isMounted || roomLoadState !== 'ready' || !currentRoom?.id ? (
        <main className="min-h-[calc(100dvh-4rem)] bg-[#0F0E17] text-white flex items-center justify-center px-4 py-12">
          <section
            className="w-full max-w-md border border-[#EDEAF5] dark:border-[#2D2945] bg-white dark:bg-[#1A1829] p-8 text-center rounded-2xl shadow-xl transition-colors"
            aria-live="polite"
          >
            {roomLoadState === 'loading' ? (
              <div role="status">
                <span className="w-3 h-3 rounded-full bg-[#7C3AED] dark:bg-[#8B5CF6] inline-block animate-ping mb-3" />
                <p className="text-xs font-semibold text-[#7C3AED] dark:text-[#8B5CF6] uppercase tracking-wider">
                  NOCTURNE Room
                </p>
                <h1 className="mt-2 font-headline text-2xl font-bold text-[#12101F] dark:text-white">
                  Finding the lounge
                </h1>
                <p className="mt-2 text-sm text-[#5E5873] dark:text-[#A19EB5]">
                  Checking the room link and reconnecting you to its live queue.
                </p>
              </div>
            ) : roomLoadState === 'ended' ? (
              <div>
                <p className="text-xs font-semibold text-[#F43F5E] dark:text-[#FF5C8A] uppercase tracking-wider">
                  Session ended
                </p>
                <h1 className="mt-3 font-headline text-2xl font-bold text-[#12101F] dark:text-white">
                  This lounge has been closed
                </h1>
                <p className="mt-2 text-sm text-[#5E5873] dark:text-[#A19EB5]">
                  The host has closed this listening room. Thank you for listening together.
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-flex rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all"
                >
                  Browse other lounges
                </Link>
              </div>
            ) : roomLoadState === 'not-found' ? (
              <div>
                <p className="text-xs font-semibold text-[#F43F5E] dark:text-[#FF5C8A] uppercase tracking-wider">
                  Room not found
                </p>
                <h1 className="mt-3 font-headline text-2xl font-bold text-[#12101F] dark:text-white">
                  This lounge is unavailable
                </h1>
                <p className="mt-2 text-sm text-[#5E5873] dark:text-[#A19EB5]">
                  The link may be incorrect, or the room may have been removed.
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-flex rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all"
                >
                  Browse lounges
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-[#F43F5E] dark:text-[#FF5C8A] uppercase tracking-wider">
                  Room connection issue
                </p>
                <h1 className="mt-3 font-headline text-2xl font-bold text-[#12101F] dark:text-white">
                  Couldn’t reach this lounge
                </h1>
                <p className="mt-2 text-sm text-[#5E5873] dark:text-[#A19EB5]">
                  Your previous room has been cleared. Check your connection and try again.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => typeof id === 'string' && void resolveAndSetRoom(id)}
                    className="rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all"
                  >
                    Try again
                  </button>
                  <Link
                    href="/"
                    className="rounded-full border border-[#EDEAF5] dark:border-[#2D2945] px-6 py-2.5 text-sm font-medium text-[#12101F] dark:text-white hover:border-[#7C3AED]/50 dark:hover:border-[#8B5CF6]/50 transition-colors"
                  >
                    Browse lounges
                  </Link>
                </div>
              </div>
            )}
          </section>
        </main>
      ) : (
        <div className="flex flex-col flex-1 w-full bg-[var(--color-deep-ink)] text-[var(--color-warm-bone)] transition-colors">
          {/* Sub-Header Breadcrumb Bar (Stitch Direction B v3) */}
          <div className="w-full border-b border-[#EDEAF5] dark:border-[#2D2945] bg-white/70 dark:bg-[#12101F]/70 px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/rooms"
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white hover:bg-[#F3F0FA] dark:hover:bg-[#242138] transition-colors shrink-0"
                title="Back to Lounges"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2 truncate text-[#5E5873] dark:text-[#A19EB5]">
                <span>Lounges</span>
                <span className="text-[#EDEAF5] dark:text-[#2D2945]">/</span>
                <span className="text-[#12101F] dark:text-white font-semibold truncate">{currentRoom.title}</span>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-[#4ADE80]/15 border border-emerald-200 dark:border-[#4ADE80]/30 text-emerald-700 dark:text-[#4ADE80] text-[11px] font-medium shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#4ADE80] animate-pulse" />
                <span>Live Room</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden md:flex items-center gap-2 text-[#5E5873] dark:text-[#A19EB5]">
                <Users className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#8B5CF6]" />
                <span className="font-mono">{members.length}</span>
                <span>listening together</span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* DESKTOP VIEW: Approved 3-Column Layout (Stitch Direction B v3)  */}
          {/* Left (~42%): Player | Middle (~32%): Queue | Right (~26%): Chat */}
          {/* ============================================================== */}
          <div className="hidden lg:grid grid-cols-12 gap-5 max-w-[1600px] w-full mx-auto px-4 lg:px-6 py-5 flex-1 items-start">
            {/* Column 1: Signature Music Player (~42% -> 5 cols) */}
            <section className="lg:col-span-5 flex flex-col gap-4">
              {isDesktop && <VinylStage />}
            </section>

            {/* Column 2: Shared Queue & YouTube Input (~33% -> 4 cols) */}
            <section className="lg:col-span-4 flex flex-col h-[780px]">
              <QueueDock />
            </section>

            {/* Column 3: Live Chat & Presence (~25% -> 3 cols) */}
            <section className="lg:col-span-3 flex flex-col h-[780px]">
              <SocialDock />
            </section>
          </div>

          {/* ============================================================== */}
          {/* MOBILE VIEW: Segmented 4-Tab Navigation (Stitch Direction B v3)*/}
          {/* [ Player ]  [ Queue (N) ]  [ Chat (N) ]  [ People (N) ]        */}
          {/* ============================================================== */}
          <div className="lg:hidden flex flex-col flex-1 pb-20">
            {/* Mobile Segmented Tab Bar */}
            <div className="sticky top-14 z-30 flex items-center justify-between border-b border-[#EDEAF5] dark:border-[#2D2945] bg-white/95 dark:bg-[#1A1829]/95 backdrop-blur-md px-2 py-1.5">
              <button
                type="button"
                onClick={() => setMobileTab('player')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mobileTab === 'player'
                    ? 'bg-[#7C3AED] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20'
                    : 'text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Player</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab('queue')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mobileTab === 'queue'
                    ? 'bg-[#7C3AED] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20'
                    : 'text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white'
                }`}
              >
                <Disc3 className="w-3.5 h-3.5" />
                <span>Queue ({queue.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab('chat')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mobileTab === 'chat'
                    ? 'bg-[#7C3AED] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20'
                    : 'text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat ({chatMessages.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab('people')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mobileTab === 'people'
                    ? 'bg-[#7C3AED] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20'
                    : 'text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>People ({members.length})</span>
              </button>
            </div>

            {/* Mobile Tab Content Viewports */}
            <div className="flex-1 p-4">
              {!isDesktop && mobileTab === 'player' && <VinylStage />}
              {mobileTab === 'queue' && (
                <div className="h-[650px]">
                  <QueueDock />
                </div>
              )}
              {mobileTab === 'chat' && (
                <div className="h-[650px]">
                  <SocialDock />
                </div>
              )}
              {mobileTab === 'people' && (
                <div className="h-[650px]">
                  <SocialDock />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

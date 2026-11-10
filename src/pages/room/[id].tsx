import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { VinylStage } from '@/components/lounge/VinylStage';
import { PlaybackDeck } from '@/components/lounge/PlaybackDeck';
import { QueueDock } from '@/components/lounge/QueueDock';
import { SocialDock } from '@/components/lounge/SocialDock';
import { Disc3, Users, Radio } from 'lucide-react';

export default function RoomPage() {
  const router = useRouter();
  const { id } = router.query;
  const { currentRoom, roomLoadState, resolveAndSetRoom } = useLounge();
  const [mobileTab, setMobileTab] = useState<'stage' | 'queue' | 'social'>('stage');
  const [desktopSideTab, setDesktopSideTab] = useState<'queue' | 'social'>('queue');

  useEffect(() => {
    if (router.isReady && typeof id === 'string') {
      void resolveAndSetRoom(id);
    }
  }, [router.isReady, id, resolveAndSetRoom]);

  return (
    <>
      <Head>
        <title>{roomLoadState === 'ready' ? `${currentRoom.title} • NOCTURNE Listening Lounge` : roomLoadState === 'not-found' ? 'Room not found • NOCTURNE' : roomLoadState === 'error' ? 'Room unavailable • NOCTURNE' : 'Loading room • NOCTURNE'}</title>
        <meta
          name="description"
          content={roomLoadState === 'ready' ? `Social listening room: ${currentRoom.title}. ${currentRoom.description}` : 'NOCTURNE shared listening room.'}
        />
      </Head>

      {roomLoadState !== 'ready' ? (
        <main className="min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)] bg-deep-ink text-warm-bone flex items-center justify-center px-5 py-12">
          <section className="w-full max-w-md border border-graphite bg-carbon p-7 sm:p-9 text-center" aria-live="polite">
            {roomLoadState === 'loading' ? (
              <div role="status">
                <p className="font-sans text-xs font-medium tracking-wide text-mineral">NOCTURNE room</p>
                <h1 className="mt-3 font-display text-2xl font-bold">Finding the lounge</h1>
                <p className="mt-2 text-sm text-ash">Checking the room link and reconnecting you to its queue.</p>
              </div>
            ) : roomLoadState === 'not-found' ? (
              <div>
                <p className="font-sans text-xs font-medium tracking-wide text-oxide">Room not found</p>
                <h1 className="mt-3 font-display text-2xl font-bold">This lounge is unavailable</h1>
                <p className="mt-2 text-sm text-ash">The link may be incorrect, or the room may have been removed.</p>
                <Link href="/" className="mt-6 inline-flex rounded-full bg-mineral px-5 py-2.5 text-sm font-semibold text-deep-ink hover:bg-mineral/90">Browse lounges</Link>
              </div>
            ) : (
              <div>
                <p className="font-sans text-xs font-medium tracking-wide text-oxide">Room connection issue</p>
                <h1 className="mt-3 font-display text-2xl font-bold">Couldn’t reach this lounge</h1>
                <p className="mt-2 text-sm text-ash">Your previous room has been cleared. Check your connection and try again.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => typeof id === 'string' && void resolveAndSetRoom(id)} className="rounded-full bg-mineral px-5 py-2.5 text-sm font-semibold text-deep-ink hover:bg-mineral/90">Try again</button>
                  <Link href="/" className="rounded-full border border-graphite px-5 py-2.5 text-sm font-medium text-warm-bone hover:border-mineral/50">Browse lounges</Link>
                </div>
              </div>
            )}
          </section>
        </main>
      ) : <div className="flex flex-col h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] overflow-hidden bg-deep-ink text-warm-bone w-full">
        {/* Main Stage Grid Container */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden w-full min-w-0 min-h-0">
          {/* Central Listening Stage */}
          <section
            aria-label="Vinyl listening stage"
            className={`lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-start overflow-x-hidden overflow-y-auto border-b lg:border-b-0 lg:border-r border-graphite bg-deep-ink w-full min-w-0 min-h-0 py-3 sm:py-5 lg:py-6 ${
              mobileTab !== 'stage' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <VinylStage />
          </section>

          {/* Right Panels Dock: Queue + Social Presence */}
          <aside
            aria-label="Shared queue and lounge presence"
            className={`lg:col-span-5 xl:col-span-4 flex flex-col h-full overflow-hidden bg-carbon/30 ${
              mobileTab === 'stage' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Desktop View: Split Queue & Social with Header Tab Switcher on XL */}
            <div className="hidden xl:flex flex-col h-full overflow-hidden">
              {/* Desktop Segmented Tab Switcher */}
              <div className="flex items-center border-b border-graphite bg-carbon/80 p-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDesktopSideTab('queue')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                    desktopSideTab === 'queue'
                      ? 'bg-deep-ink text-warm-bone border border-graphite'
                      : 'text-ash hover:text-warm-bone'
                  }`}
                >
                  <Disc3 className="w-3.5 h-3.5 text-mineral" />
                  <span>Tracklist</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDesktopSideTab('social')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                    desktopSideTab === 'social'
                      ? 'bg-deep-ink text-warm-bone border border-graphite'
                      : 'text-ash hover:text-warm-bone'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-mineral" />
                  <span>Lounge Notes</span>
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                {desktopSideTab === 'queue' ? <QueueDock /> : <SocialDock />}
              </div>
            </div>

            {/* Tablet & Large Mobile Dock */}
            <div className="flex xl:hidden flex-1 overflow-hidden">
              {mobileTab === 'queue' ? <QueueDock /> : <SocialDock />}
            </div>
          </aside>
        </div>

        {/* Mobile View Tab Switcher (Visible on small screens < 1024px) */}
        <div className="lg:hidden flex items-center justify-around border-t border-graphite bg-carbon py-1.5 px-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('stage')}
            className={`flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium transition-colors ${
              mobileTab === 'stage'
                ? 'bg-mineral text-deep-ink font-semibold'
                : 'text-ash hover:text-warm-bone'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Stage</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('queue')}
            className={`flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium transition-colors ${
              mobileTab === 'queue'
                ? 'bg-mineral text-deep-ink font-semibold'
                : 'text-ash hover:text-warm-bone'
            }`}
          >
            <Disc3 className="w-3 h-3" />
            <span>Tracklist</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('social')}
            className={`flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium transition-colors ${
              mobileTab === 'social'
                ? 'bg-mineral text-deep-ink font-semibold'
                : 'text-ash hover:text-warm-bone'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Notes</span>
          </button>
        </div>

        {/* Pinned Bottom Playback Transport Deck */}
        <div className="shrink-0 z-30">
          <PlaybackDeck />
        </div>
      </div>}
    </>
  );
}

import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { VinylStage } from '@/components/lounge/VinylStage';
import { PlaybackDeck } from '@/components/lounge/PlaybackDeck';
import { QueueDock } from '@/components/lounge/QueueDock';
import { SocialDock } from '@/components/lounge/SocialDock';
import { Disc3, Users } from 'lucide-react';

export default function RoomPage() {
  const router = useRouter();
  const { currentRoom } = useLounge();
  const [mobileTab, setMobileTab] = useState<'queue' | 'social'>('queue');

  return (
    <>
      <Head>
        <title>{`${currentRoom.title} • NOCTURNE Lounge`}</title>
      </Head>

      <div className="flex flex-col h-[calc(100dvh-4rem)] overflow-hidden bg-obsidian">
        {/* Main Stage Grid Container */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Central Listening Stage */}
          <section
            aria-label="Vinyl stage"
            className="lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-center overflow-y-auto border-b lg:border-b-0 lg:border-r border-plum-subtle bg-gradient-to-b from-plum-base/40 to-obsidian"
          >
            <VinylStage />
          </section>

          {/* Right Panels Dock: Queue + Social Presence */}
          <aside
            aria-label="Shared queue and lounge presence"
            className="lg:col-span-5 xl:col-span-4 flex flex-col h-full overflow-hidden bg-plum-base/30"
          >
            {/* Desktop View: Split Queue & Social */}
            <div className="hidden xl:grid xl:grid-rows-2 h-full overflow-hidden">
              <div className="overflow-hidden border-b border-plum-subtle">
                <QueueDock />
              </div>
              <div className="overflow-hidden">
                <SocialDock />
              </div>
            </div>

            {/* Tablet / Mobile View: Segmented Tab Switcher */}
            <div className="flex flex-col xl:hidden h-full overflow-hidden">
              <div className="flex items-center border-b border-plum-subtle bg-obsidian p-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMobileTab('queue')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    mobileTab === 'queue'
                      ? 'bg-plum-surface text-ivory border border-plum-subtle'
                      : 'text-warm-dim hover:text-warm-grey'
                  }`}
                >
                  <Disc3 className="w-3.5 h-3.5 text-lavender" />
                  <span>Queue</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('social')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    mobileTab === 'social'
                      ? 'bg-plum-surface text-ivory border border-plum-subtle'
                      : 'text-warm-dim hover:text-warm-grey'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-lavender" />
                  <span>People & Chat</span>
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                {mobileTab === 'queue' ? <QueueDock /> : <SocialDock />}
              </div>
            </div>
          </aside>
        </div>

        {/* Pinned Bottom Playback Transport Deck */}
        <div className="shrink-0 z-30">
          <PlaybackDeck />
        </div>
      </div>
    </>
  );
}

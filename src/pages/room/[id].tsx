import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { VinylStage } from '@/components/lounge/VinylStage';
import { PlaybackDeck } from '@/components/lounge/PlaybackDeck';
import { QueueDock } from '@/components/lounge/QueueDock';
import { SocialDock } from '@/components/lounge/SocialDock';
import { Disc3, Users, MessageSquare, Radio, Shield, Sparkles } from 'lucide-react';

export default function RoomPage() {
  const router = useRouter();
  const { currentRoom, currentTrack } = useLounge();
  const [mobileTab, setMobileTab] = useState<'queue' | 'social'>('queue');

  return (
    <>
      <Head>
        <title>{`${currentRoom.title} • NOCTURNE Lounge`}</title>
      </Head>

      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-midnight-950">
        {/* Main Stage Grid Container */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Central Listening Stage (Vinyl, Track Typography, Waveform) */}
          <section
            aria-label="Vinyl stage"
            className="lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-center overflow-y-auto border-b lg:border-b-0 lg:border-r border-plum-700/50 bg-gradient-to-b from-midnight-900/60 to-midnight-950"
          >
            <VinylStage />
          </section>

          {/* Right Panels Dock: Queue + Social Presence */}
          <aside
            aria-label="Shared queue and lounge presence"
            className="lg:col-span-5 xl:col-span-4 flex flex-col h-full overflow-hidden bg-midnight-900/40"
          >
            {/* Desktop View: Split Queue & Social or Tabbed */}
            <div className="hidden xl:grid xl:grid-rows-2 h-full overflow-hidden">
              <div className="overflow-hidden border-b border-plum-700/50">
                <QueueDock />
              </div>
              <div className="overflow-hidden">
                <SocialDock />
              </div>
            </div>

            {/* Laptop / Tablet / Mobile View: Segmented Tab Switcher */}
            <div className="flex flex-col xl:hidden h-full overflow-hidden">
              <div className="flex items-center border-b border-plum-700/60 bg-midnight-950 p-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMobileTab('queue')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    mobileTab === 'queue'
                      ? 'bg-plum-800 text-zinc-100 shadow-sm border border-plum-700'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Disc3 className="w-3.5 h-3.5 text-lavender-400" />
                  <span>Shared Queue</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('social')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    mobileTab === 'social'
                      ? 'bg-plum-800 text-zinc-100 shadow-sm border border-plum-700'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-lavender-400" />
                  <span>Lounge & Chat</span>
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

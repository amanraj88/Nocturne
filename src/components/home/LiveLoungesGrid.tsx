import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { FEATURED_ROOMS } from '@/lib/mockData';
import { Radio, Users, ArrowRight, Disc3 } from 'lucide-react';

export const LiveLoungesGrid: React.FC = () => {
  const { switchRoom } = useLounge();

  return (
    <section className="py-16 sm:py-24 border-t border-plum-800/60 bg-midnight-950/40 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-lavender-400">
              Active Transmissions
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-zinc-100 mt-1">
              Curated Listening Lounges
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
            Rooms sync playback in realtime. Join any open transmission or launch your private salon.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_ROOMS.map((room) => (
            <div
              key={room.id}
              className="group relative rounded-2xl bg-midnight-950 border border-plum-700/60 p-6 flex flex-col justify-between hover:border-lavender-400/40 transition-all duration-300 hover:shadow-glow-lavender"
            >
              {/* Top Tag & Listener Count */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-plum-800/80 px-3 py-1 text-[11px] font-mono text-lavender-300 border border-plum-600/40">
                    {room.vibeTag}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-lime-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                    <span>{room.listenerCount} live</span>
                  </div>
                </div>

                <h3 className="font-serif text-xl font-bold text-zinc-100 group-hover:text-lavender-200 transition-colors">
                  {room.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                  {room.description}
                </p>
              </div>

              {/* Bottom Host Info & Action */}
              <div className="pt-6 mt-6 border-t border-plum-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-lavender-400/30">
                    <Image
                      src={room.host.avatar}
                      alt={room.host.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-[11px]">
                    <span className="text-zinc-500 block">Host</span>
                    <span className="text-zinc-300 font-medium">{room.host.name}</span>
                  </div>
                </div>

                <Link
                  href={`/room/${room.slug}`}
                  onClick={() => switchRoom(room.id)}
                  className="flex items-center gap-1.5 rounded-full bg-plum-800 hover:bg-lavender-500 text-zinc-200 hover:text-midnight-950 px-4 py-2 text-xs font-semibold transition-all group-hover:scale-105"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Enter</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

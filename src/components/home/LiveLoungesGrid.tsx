import React from 'react';
import Link from 'next/link';
import { FEATURED_ROOMS } from '@/lib/mockData';
import { ArtworkRenderer } from '@/components/artwork';
import { ArrowUpRight } from 'lucide-react';

type RoomId = 'room-tokyo-afterhours' | 'room-nordic-solitude' | 'room-berlin-basement';

const getInitials = (name: string): string => {
  const clean = name.replace(/[^a-zA-Z\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return 'NO';
};

const HostBadge: React.FC<{ name: string }> = ({ name }) => (
  <span
    aria-hidden="true"
    className="w-5 h-5 rounded-[2px] bg-deep-ink border border-mineral/70 text-mineral flex items-center justify-center font-sans text-[9px] font-semibold select-none shrink-0"
  >
    {getInitials(name)}
  </span>
);

const LoungeTag: React.FC<{ label?: string }> = ({ label = 'Curated lounge' }) => (
  <span className="inline-flex items-center rounded-full bg-deep-ink px-2.5 py-0.5 text-[11px] font-medium text-ash border border-graphite">
    {label}
  </span>
);

/* Card 1: Tokyo — Header Sleeve with NOC-01 Shibuya */
const TokyoCard: React.FC<{ room: typeof FEATURED_ROOMS[0] }> = ({ room }) => (
  <Link
    href={`/room/${room.slug}`}
    className="group flex flex-col h-full rounded-2xl overflow-hidden bg-carbon border border-graphite hover:border-mineral/50 transition-colors"
  >
    {/* Release Artwork Header Visual — NOC-01 Shibuya */}
    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-deep-ink shrink-0 border-b border-graphite flex items-center justify-center p-3">
      <div className="w-full h-full max-w-[190px] aspect-square rounded-[2px] overflow-hidden border border-graphite shadow-sm">
        <ArtworkRenderer artworkId="noc-01" className="w-full h-full" />
      </div>
      <div className="absolute top-4 left-4">
        <LoungeTag label="Curated lounge" />
      </div>
      <div className="absolute top-4 right-4">
        <span className="font-sans text-[10px] text-ash bg-deep-ink px-2 py-0.5 rounded border border-graphite">
          [{room.artworkId ? room.artworkId.toUpperCase() : 'NOC-01'}]
        </span>
      </div>
    </div>

    {/* Content */}
    <div className="flex flex-col flex-1 p-6">
      <p className="text-xs text-ash mb-2 tracking-wide font-sans">
        {room.vibeTag}
      </p>
      <h3 className="font-serif text-xl font-bold text-warm-bone leading-snug group-hover:text-mineral transition-colors">
        {room.title}
      </h3>
      <p className="mt-2.5 text-xs text-ash leading-relaxed">
        {room.description}
      </p>

      {/* Aligned Baseline Footer */}
      <div className="mt-auto pt-6 border-t border-graphite flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HostBadge name={room.host.name} />
          <span className="text-xs text-ash">Curated by NOCTURNE</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-ash group-hover:text-warm-bone transition-colors">
          <span>Enter lounge</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </span>
      </div>
    </div>
  </Link>
);

/* Card 2: Reykjavik — Inset Sleeve with NOC-02 Reykjavik */
const ReykjavikCard: React.FC<{ room: typeof FEATURED_ROOMS[0] }> = ({ room }) => (
  <Link
    href={`/room/${room.slug}`}
    className="group flex flex-col h-full rounded-2xl overflow-hidden bg-carbon border border-graphite hover:border-mineral/50 transition-colors"
  >
    {/* Inset Sleeve Framing */}
    <div className="p-6 pb-0">
      <div className="flex items-center justify-between mb-4">
        <LoungeTag label="Curated lounge" />
        <span className="font-sans text-[11px] text-ash">
          [{room.artworkId ? room.artworkId.toUpperCase() : 'NOC-02'}] · Open queue
        </span>
      </div>
      <div className="relative h-44 w-full rounded-xl overflow-hidden bg-deep-ink border border-graphite shrink-0 flex items-center justify-center p-3">
        <div className="w-full h-full max-w-[160px] aspect-square rounded-[2px] overflow-hidden border border-graphite shadow-sm">
          <ArtworkRenderer artworkId="noc-02" className="w-full h-full" />
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="flex flex-col flex-1 p-6">
      <p className="text-xs text-ash mb-2 tracking-wide font-sans">
        {room.vibeTag}
      </p>
      <h3 className="font-serif text-xl font-bold text-warm-bone leading-snug group-hover:text-mineral transition-colors">
        {room.title}
      </h3>
      <p className="mt-2.5 text-xs text-ash leading-relaxed">
        {room.description}
      </p>

      {/* Aligned Baseline Footer */}
      <div className="mt-auto pt-6 border-t border-graphite flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HostBadge name={room.host.name} />
          <span className="text-xs text-ash">Host {room.host.name}</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-ash group-hover:text-warm-bone transition-colors">
          <span>Enter lounge</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </span>
      </div>
    </div>
  </Link>
);

/* Card 3: Kreuzberg — Typographic Header with NOC-03 Kreuzberg */
const KreuzbergCard: React.FC<{ room: typeof FEATURED_ROOMS[0] }> = ({ room }) => (
  <Link
    href={`/room/${room.slug}`}
    className="group flex flex-col h-full rounded-2xl overflow-hidden bg-carbon border border-graphite hover:border-mineral/50 transition-colors relative"
  >
    <div className="flex flex-col flex-1 p-6">
      {/* Header with thumbnail release artwork */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <LoungeTag label="Curated lounge" />
            <span className="font-sans text-[10px] text-ash">
              [{room.artworkId ? room.artworkId.toUpperCase() : 'NOC-03'}]
            </span>
          </div>
          <p className="text-xs text-ash mt-3 tracking-wide font-sans">
            {room.vibeTag}
          </p>
        </div>
        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-graphite shrink-0 bg-deep-ink shadow-sm">
          <ArtworkRenderer artworkId="noc-03" className="w-full h-full" />
        </div>
      </div>

      <h3 className="font-serif text-2xl font-bold text-warm-bone leading-tight group-hover:text-mineral transition-colors">
        {room.title}
      </h3>

      <p className="mt-3 text-xs text-ash leading-relaxed">
        {room.description}
      </p>

      {/* Atmospheric Audio Details */}
      <div className="mt-4 flex items-center gap-2 text-[11px] text-ash">
        <span className="px-2 py-0.5 rounded bg-deep-ink border border-graphite">
          Dub Techno
        </span>
        <span className="px-2 py-0.5 rounded bg-deep-ink border border-graphite">
          Vinyl Master
        </span>
      </div>

      {/* Aligned Baseline Footer */}
      <div className="mt-auto pt-6 border-t border-graphite flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HostBadge name={room.host.name} />
          <span className="text-xs text-ash">Host {room.host.name}</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-ash group-hover:text-warm-bone transition-colors">
          <span>Enter lounge</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </span>
      </div>
    </div>
  </Link>
);

const CARD_COMPONENTS: Record<RoomId, React.FC<{ room: typeof FEATURED_ROOMS[0] }>> = {
  'room-tokyo-afterhours': TokyoCard,
  'room-nordic-solitude': ReykjavikCard,
  'room-berlin-basement': KreuzbergCard,
};

export const LiveLoungesGrid: React.FC = () => {
  return (
    <section className="py-14 sm:py-20 border-t border-graphite bg-carbon/20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="mb-10 max-w-lg">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-warm-bone leading-tight">
            Curated listening lounges
          </h2>
          <p className="text-xs sm:text-sm text-ash mt-3 leading-relaxed">
            Sample rooms with distinct sonic directions, ready for shared playback.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {FEATURED_ROOMS.map((room) => {
            const CardComponent = CARD_COMPONENTS[room.id as RoomId];
            if (!CardComponent) return null;
            return <CardComponent key={room.id} room={room} />;
          })}
        </div>
      </div>
    </section>
  );
};

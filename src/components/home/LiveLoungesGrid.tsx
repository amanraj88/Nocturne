import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FEATURED_ROOMS } from '@/lib/mockData';
import { ArrowUpRight, Disc3 } from 'lucide-react';

type RoomId = 'room-tokyo-afterhours' | 'room-nordic-solitude' | 'room-berlin-basement';

interface RoomConfig {
  img: string;
  imgAlt: string;
  imgPosition: string;
}

const ROOM_CONFIG: Record<RoomId, RoomConfig> = {
  'room-tokyo-afterhours': {
    // Verified 200 OK: Studio audio mixing faders in atmospheric moody light
    img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=900&auto=format&fit=crop&q=85',
    imgAlt: 'Audio mixing console faders illuminated in dark studio',
    imgPosition: 'object-center',
  },
  'room-nordic-solitude': {
    // Verified 200 OK: Piano keys with moody side lighting
    img: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=900&auto=format&fit=crop&q=85',
    imgAlt: 'Acoustic piano keys under low-key Nordic light',
    imgPosition: 'object-[center_35%]',
  },
  'room-berlin-basement': {
    // Verified 200 OK: Dark venue sound system and club lighting
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&auto=format&fit=crop&q=85',
    imgAlt: 'Sound system speakers and warehouse ambient light',
    imgPosition: 'object-center',
  },
};

const LoungeTag: React.FC<{ label?: string }> = ({ label = 'Curated lounge' }) => (
  <span className="inline-flex items-center rounded-full bg-plum-base/90 px-2.5 py-0.5 text-[11px] font-medium text-warm-dim border border-plum-subtle">
    {label}
  </span>
);

/* Resilient Image Component with Graceful Fallback */
const CardImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}> = ({ src, alt, className = '', sizes = '(max-width: 768px) 100vw, 33vw' }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-plum-base/95 p-4 text-center">
        <Disc3 className="w-8 h-8 text-lavender/50 mb-2 animate-pulse" />
        <span className="text-[11px] text-warm-dim tracking-wide font-sans">
          Atmospheric Audio Lounge
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

/* Card 1: Tokyo — Cinematic Top Visual */
const TokyoCard: React.FC<{ room: typeof FEATURED_ROOMS[0]; cfg: RoomConfig }> = ({ room, cfg }) => (
  <Link
    href={`/room/${room.slug}`}
    className="group flex flex-col h-full rounded-2xl overflow-hidden bg-plum-surface border border-plum-subtle hover:border-lavender/40 transition-colors"
  >
    {/* Cinematic Header Visual */}
    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-plum-base shrink-0">
      <CardImage
        src={cfg.img}
        alt={cfg.imgAlt}
        className={`object-cover ${cfg.imgPosition}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-plum-surface via-plum-surface/40 to-transparent" />
      <div className="absolute top-4 left-4">
        <LoungeTag label="Curated lounge" />
      </div>
    </div>

    {/* Content */}
    <div className="flex flex-col flex-1 p-6">
      <p className="text-xs text-warm-dim mb-2 tracking-wide">
        {room.vibeTag}
      </p>
      <h3 className="font-serif text-xl font-bold text-ivory leading-snug group-hover:text-lavender transition-colors">
        {room.title}
      </h3>
      <p className="mt-2.5 text-xs text-warm-grey leading-relaxed">
        {room.description}
      </p>

      {/* Aligned Baseline Footer */}
      <div className="mt-auto pt-6 border-t border-plum-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-plum-subtle shrink-0">
            <Image src={room.host.avatar} alt={room.host.name} fill className="object-cover" />
          </div>
          <span className="text-xs text-warm-dim">Host {room.host.name}</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-warm-grey group-hover:text-lavender transition-colors">
          <span>Enter lounge</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </span>
      </div>
    </div>
  </Link>
);

/* Card 2: Reykjavik — Tactile Inset Sleeve */
const ReykjavikCard: React.FC<{ room: typeof FEATURED_ROOMS[0]; cfg: RoomConfig }> = ({ room, cfg }) => (
  <Link
    href={`/room/${room.slug}`}
    className="group flex flex-col h-full rounded-2xl overflow-hidden bg-plum-surface border border-plum-subtle hover:border-lavender/40 transition-colors"
  >
    {/* Inset Sleeve Framing */}
    <div className="p-6 pb-0">
      <div className="flex items-center justify-between mb-4">
        <LoungeTag label="Curated lounge" />
        <span className="text-[11px] text-warm-dim">Host-curated</span>
      </div>
      <div className="relative h-40 w-full rounded-xl overflow-hidden bg-plum-base border border-plum-subtle/80 shrink-0">
        <CardImage
          src={cfg.img}
          alt={cfg.imgAlt}
          className={`object-cover ${cfg.imgPosition}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-plum-surface/80 via-transparent to-transparent" />
      </div>
    </div>

    {/* Content */}
    <div className="flex flex-col flex-1 p-6">
      <p className="text-xs text-warm-dim mb-2 tracking-wide">
        {room.vibeTag}
      </p>
      <h3 className="font-serif text-xl font-bold text-ivory leading-snug group-hover:text-lavender transition-colors">
        {room.title}
      </h3>
      <p className="mt-2.5 text-xs text-warm-grey leading-relaxed">
        {room.description}
      </p>

      {/* Aligned Baseline Footer */}
      <div className="mt-auto pt-6 border-t border-plum-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-plum-subtle shrink-0">
            <Image src={room.host.avatar} alt={room.host.name} fill className="object-cover" />
          </div>
          <span className="text-xs text-warm-dim">Host {room.host.name}</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-warm-grey group-hover:text-lavender transition-colors">
          <span>Enter lounge</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </span>
      </div>
    </div>
  </Link>
);

/* Card 3: Kreuzberg — Typographic Club & Soundstage Texture */
const KreuzbergCard: React.FC<{ room: typeof FEATURED_ROOMS[0]; cfg: RoomConfig }> = ({ room, cfg }) => (
  <Link
    href={`/room/${room.slug}`}
    className="group flex flex-col h-full rounded-2xl overflow-hidden bg-plum-surface border border-plum-subtle hover:border-lavender/40 transition-colors relative"
  >
    <div className="flex flex-col flex-1 p-6">
      {/* Header with thumbnail artwork */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <LoungeTag label="Curated lounge" />
          <p className="text-xs text-warm-dim mt-3 tracking-wide">
            {room.vibeTag}
          </p>
        </div>
        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-plum-subtle shrink-0 bg-plum-base">
          <CardImage
            src={cfg.img}
            alt={cfg.imgAlt}
            sizes="64px"
            className={`object-cover ${cfg.imgPosition}`}
          />
        </div>
      </div>

      <h3 className="font-serif text-2xl font-bold text-ivory leading-tight group-hover:text-lavender transition-colors">
        {room.title}
      </h3>

      <p className="mt-3 text-xs text-warm-grey leading-relaxed">
        {room.description}
      </p>

      {/* Atmospheric Audio Details */}
      <div className="mt-4 flex items-center gap-2 text-[11px] text-warm-dim">
        <span className="px-2 py-0.5 rounded bg-plum-base border border-plum-subtle">
          Dub Techno
        </span>
        <span className="px-2 py-0.5 rounded bg-plum-base border border-plum-subtle">
          Vinyl Master
        </span>
      </div>

      {/* Aligned Baseline Footer */}
      <div className="mt-auto pt-6 border-t border-plum-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-plum-subtle shrink-0">
            <Image src={room.host.avatar} alt={room.host.name} fill className="object-cover" />
          </div>
          <span className="text-xs text-warm-dim">Host {room.host.name}</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-warm-grey group-hover:text-lavender transition-colors">
          <span>Enter lounge</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </span>
      </div>
    </div>
  </Link>
);

const CARD_COMPONENTS: Record<RoomId, React.FC<{ room: typeof FEATURED_ROOMS[0]; cfg: RoomConfig }>> = {
  'room-tokyo-afterhours': TokyoCard,
  'room-nordic-solitude': ReykjavikCard,
  'room-berlin-basement': KreuzbergCard,
};

export const LiveLoungesGrid: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 border-t border-plum-subtle bg-plum-base/40">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="mb-14 max-w-lg">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ivory leading-tight">
            Curated listening lounges
          </h2>
          <p className="text-xs sm:text-sm text-warm-grey mt-3 leading-relaxed">
            Sample rooms with distinct sonic directions, ready for shared playback.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {FEATURED_ROOMS.map((room) => {
            const cfg = ROOM_CONFIG[room.id as RoomId];
            if (!cfg) return null;
            const CardComponent = CARD_COMPONENTS[room.id as RoomId];
            if (!CardComponent) return null;
            return <CardComponent key={room.id} room={room} cfg={cfg} />;
          })}
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { FEATURED_ROOMS } from '@/lib/mockData';
import { ArrowUpRight } from 'lucide-react';

type RoomId = 'room-tokyo-afterhours' | 'room-nordic-solitude' | 'room-berlin-basement';

const ROOM_CONFIG: Record<RoomId, {
  img: string;
  imgAlt: string;
  imgPosition: string;
  accentClass: string;
  overlayClass: string;
  layout: 'portrait' | 'horizontal' | 'typographic';
}> = {
  'room-tokyo-afterhours': {
    img: 'https://images.unsplash.com/photo-1598387993441-a364f854cac2?w=900&auto=format&fit=crop&q=85',
    imgAlt: 'Analog synthesizer patch bay with cables',
    imgPosition: 'object-center',
    accentClass: 'text-lavender',
    overlayClass: 'from-obsidian via-obsidian/40 to-transparent',
    layout: 'portrait',
  },
  'room-nordic-solitude': {
    img: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=900&auto=format&fit=crop&q=85',
    imgAlt: 'Grand piano keys side lit',
    imgPosition: 'object-[center_30%]',
    accentClass: 'text-warm-grey',
    overlayClass: 'from-obsidian via-obsidian/30 to-transparent',
    layout: 'horizontal',
  },
  'room-berlin-basement': {
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&auto=format&fit=crop&q=85',
    imgAlt: 'Concert venue room with speaker stacks',
    imgPosition: 'object-center',
    accentClass: 'text-lavender',
    overlayClass: 'from-obsidian via-obsidian/60 to-transparent',
    layout: 'typographic',
  },
};

const DemoTag: React.FC<{ label?: string }> = ({ label = 'Sample room' }) => (
  <span className="inline-flex items-center rounded-full bg-plum-base px-2.5 py-0.5 text-xs text-warm-dim border border-plum-subtle">
    {label}
  </span>
);

/* Card 1: Portrait Image Focus */
const PortraitCard: React.FC<{ room: typeof FEATURED_ROOMS[0]; cfg: typeof ROOM_CONFIG[RoomId] }> = ({ room, cfg }) => (
  <Link
    href={`/room/${room.slug}`}
    className="group block rounded-2xl overflow-hidden bg-plum-surface border border-plum-subtle hover:border-lavender/40 transition-colors"
  >
    <div className="relative h-64 sm:h-72 overflow-hidden">
      <Image
        src={cfg.img}
        alt={cfg.imgAlt}
        fill
        className={`object-cover ${cfg.imgPosition}`}
      />
      <div className={`absolute inset-0 bg-gradient-to-t ${cfg.overlayClass}`} />
      <div className="absolute top-4 left-4">
        <DemoTag />
      </div>
    </div>

    <div className="p-6">
      <p className="text-xs text-warm-dim mb-2">
        {room.vibeTag}
      </p>
      <h3 className="font-serif text-xl font-bold text-ivory leading-snug group-hover:text-lavender transition-colors">
        {room.title}
      </h3>
      <p className="mt-2.5 text-xs text-warm-grey leading-relaxed">
        {room.description}
      </p>

      <div className="mt-6 pt-4 border-t border-plum-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-plum-subtle">
            <Image src={room.host.avatar} alt={room.host.name} fill className="object-cover" />
          </div>
          <span className="text-xs text-warm-dim">{room.host.name}</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-warm-grey group-hover:text-lavender transition-colors">
          <span>Enter lounge</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  </Link>
);

/* Card 2: Horizontal Layout */
const HorizontalCard: React.FC<{ room: typeof FEATURED_ROOMS[0]; cfg: typeof ROOM_CONFIG[RoomId] }> = ({ room, cfg }) => (
  <Link
    href={`/room/${room.slug}`}
    className="group flex flex-col sm:flex-row rounded-2xl overflow-hidden bg-plum-surface border border-plum-subtle hover:border-lavender/40 transition-colors"
  >
    <div className="relative h-48 sm:h-auto sm:w-48 sm:shrink-0 overflow-hidden">
      <Image
        src={cfg.img}
        alt={cfg.imgAlt}
        fill
        className={`object-cover ${cfg.imgPosition}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-obsidian via-obsidian/20 to-transparent" />
    </div>

    <div className="flex flex-col justify-between p-6">
      <div>
        <div className="mb-3">
          <DemoTag />
        </div>
        <p className="text-xs text-warm-dim mb-1.5">
          {room.vibeTag}
        </p>
        <h3 className="font-serif text-xl font-bold text-ivory leading-snug group-hover:text-lavender transition-colors">
          {room.title}
        </h3>
        <p className="mt-2.5 text-xs text-warm-grey leading-relaxed line-clamp-3">
          {room.description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between pt-4 border-t border-plum-subtle">
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-plum-subtle">
            <Image src={room.host.avatar} alt={room.host.name} fill className="object-cover" />
          </div>
          <span className="text-xs text-warm-dim">{room.host.name}</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-warm-grey group-hover:text-lavender transition-colors">
          <span>Enter lounge</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  </Link>
);

/* Card 3: Typographic Focus */
const TypographicCard: React.FC<{ room: typeof FEATURED_ROOMS[0]; cfg: typeof ROOM_CONFIG[RoomId] }> = ({ room, cfg }) => (
  <Link
    href={`/room/${room.slug}`}
    className="group block rounded-2xl overflow-hidden bg-plum-surface border border-plum-subtle hover:border-lavender/40 transition-colors relative"
  >
    <div className="p-6 h-full flex flex-col justify-between min-h-[300px]">
      <div>
        <div className="flex items-start justify-between mb-4">
          <DemoTag />
          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-plum-subtle shrink-0">
            <Image src={cfg.img} alt={cfg.imgAlt} fill className="object-cover" />
          </div>
        </div>

        <p className="text-xs text-warm-dim mb-2">
          {room.vibeTag}
        </p>

        <h3 className="font-serif text-2xl font-bold text-ivory leading-tight group-hover:text-lavender transition-colors">
          {room.title}
        </h3>

        <p className="mt-3 text-xs text-warm-grey leading-relaxed">
          {room.description}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-plum-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-plum-subtle">
            <Image src={room.host.avatar} alt={room.host.name} fill className="object-cover" />
          </div>
          <span className="text-xs text-warm-dim">{room.host.name}</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-warm-grey group-hover:text-lavender transition-colors">
          <span>Enter lounge</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  </Link>
);

const CARD_COMPONENTS = {
  portrait: PortraitCard,
  horizontal: HorizontalCard,
  typographic: TypographicCard,
} as const;

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {FEATURED_ROOMS.map((room) => {
            const cfg = ROOM_CONFIG[room.id as RoomId];
            if (!cfg) return null;
            const CardComponent = CARD_COMPONENTS[cfg.layout];
            return <CardComponent key={room.id} room={room} cfg={cfg} />;
          })}
        </div>
      </div>
    </section>
  );
};

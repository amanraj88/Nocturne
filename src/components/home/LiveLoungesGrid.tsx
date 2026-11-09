import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { FEATURED_ROOMS } from '@/lib/mockData';
import { ArrowUpRight } from 'lucide-react';

/*
  ─── ROOM VISUAL IDENTITIES ─────────────────────────────────────────────────
  Each room has three things that distinguish it:
    1. A purpose-chosen photograph that evokes its sonic world
    2. A structural layout (portrait card vs horizontal vs typography-led)
    3. A colour accent drawn from the NOCTURNE palette

  IMPORTANT: All listener counts are removed. These are sample/demo rooms,
  not live production data. No fabricated metrics are shown.

  Photograph choices:
  · Tokyo (IDM/Synth): Close-up of analog synthesizer faders & patch cables —
    tactile, neon-tinged, electronic.
  · Reykjavik (Neoclassical): Grand piano keys under raking side light —
    spare, cold, intimate.
  · Berlin (Dub Techno): Dark concrete room, speaker stacks, industrial scale —
    warehouse weight, monolithic.
*/

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
    // Analog synthesizer patch bay — warm amber light, dense cables
    img: 'https://images.unsplash.com/photo-1598387993441-a364f854cac2?w=900&auto=format&fit=crop&q=85',
    imgAlt: 'Analog synthesizer patch bay under amber studio light',
    imgPosition: 'object-center',
    accentClass: 'text-lavender-400',
    // Lavender tint over image bottom
    overlayClass: 'from-midnight-950 via-midnight-950/50 to-lavender-500/10',
    layout: 'portrait',
  },
  'room-nordic-solitude': {
    // Grand piano keys, side-lit — sparse, monochrome, classical
    img: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=900&auto=format&fit=crop&q=85',
    imgAlt: 'Grand piano keys under cool side lighting',
    imgPosition: 'object-[center_30%]',
    accentClass: 'text-zinc-300',
    // Near-neutral cool overlay
    overlayClass: 'from-midnight-950 via-midnight-950/40 to-transparent',
    layout: 'horizontal',
  },
  'room-berlin-basement': {
    // Dark concert room, speaker stacks — raw, industrial
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&auto=format&fit=crop&q=85',
    imgAlt: 'Dark concrete concert room with speaker stacks',
    imgPosition: 'object-center',
    accentClass: 'text-lime-400',
    // Warm lime/dark tint
    overlayClass: 'from-midnight-950 via-midnight-950/60 to-lime-900/10',
    layout: 'typographic',
  },
};

/* ── DEMO BADGE ─────────────────────────────────────────────────────────── */
const DemoBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full
                bg-midnight-950/80 backdrop-blur-sm
                px-2.5 py-1 border border-plum-600/60 ${className}`}
  >
    <span className="w-1.5 h-1.5 rounded-full bg-plum-500" />
    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
      Sample Room
    </span>
  </span>
);

/* ── CARD 1: Portrait — tall image, text panel below ────────────────────── */
const PortraitCard: React.FC<{ room: typeof FEATURED_ROOMS[0]; cfg: typeof ROOM_CONFIG[RoomId] }> = ({ room, cfg }) => (
  <Link
    href={`/room/${room.slug}`}
    className="group block rounded-2xl overflow-hidden bg-midnight-950
               border border-plum-700/60 hover:border-plum-600
               transition-all duration-300 hover:-translate-y-1"
  >
    {/* Tall image panel */}
    <div className="relative h-64 sm:h-72 overflow-hidden">
      <Image
        src={cfg.img}
        alt={cfg.imgAlt}
        fill
        className={`object-cover ${cfg.imgPosition}
                    transition-transform duration-700 group-hover:scale-[1.04]`}
      />
      <div className={`absolute inset-0 bg-gradient-to-t ${cfg.overlayClass}`} />
      <DemoBadge className="absolute top-3.5 left-3.5" />
    </div>

    {/* Text panel */}
    <div className="p-6">
      <p className={`text-[9px] font-mono uppercase tracking-[0.2em] mb-3 ${cfg.accentClass}`}>
        {room.vibeTag}
      </p>
      <h3 className="font-serif text-xl font-bold text-zinc-100 leading-snug
                     group-hover:text-lavender-200 transition-colors duration-200">
        {room.title}
      </h3>
      <p className="mt-2.5 text-[13px] text-zinc-500 leading-relaxed">
        {room.description}
      </p>
      <div className="mt-5 pt-4 border-t border-plum-800/60
                      flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-plum-600/50">
            <Image src={room.host.avatar} alt={room.host.name} fill className="object-cover" />
          </div>
          <span className="text-[11px] text-zinc-600">{room.host.name}</span>
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium text-zinc-600
                          group-hover:${cfg.accentClass} transition-colors duration-200`}>
          Open
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
        </span>
      </div>
    </div>
  </Link>
);

/* ── CARD 2: Horizontal — image left, editorial text right ──────────────── */
const HorizontalCard: React.FC<{ room: typeof FEATURED_ROOMS[0]; cfg: typeof ROOM_CONFIG[RoomId] }> = ({ room, cfg }) => (
  <Link
    href={`/room/${room.slug}`}
    className="group flex flex-col sm:flex-row rounded-2xl overflow-hidden bg-midnight-950
               border border-plum-700/60 hover:border-plum-600
               transition-all duration-300 hover:-translate-y-1"
  >
    {/* Image panel — fixed width on the left */}
    <div className="relative h-48 sm:h-auto sm:w-44 sm:shrink-0 overflow-hidden">
      <Image
        src={cfg.img}
        alt={cfg.imgAlt}
        fill
        className={`object-cover ${cfg.imgPosition}
                    transition-transform duration-700 group-hover:scale-[1.04]`}
      />
      {/* Right-edge fade on sm+ so image bleeds into text area cleanly */}
      <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r
                      from-midnight-950 via-midnight-950/20 to-transparent" />
    </div>

    {/* Text panel */}
    <div className="flex flex-col justify-between p-6">
      <div>
        <DemoBadge className="mb-4" />
        <p className={`text-[9px] font-mono uppercase tracking-[0.2em] mb-2 ${cfg.accentClass}`}>
          {room.vibeTag}
        </p>
        <h3 className="font-serif text-xl font-bold text-zinc-100 leading-snug
                       group-hover:text-zinc-200 transition-colors duration-200">
          {room.title}
        </h3>
        <p className="mt-2.5 text-[13px] text-zinc-500 leading-relaxed line-clamp-3">
          {room.description}
        </p>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-plum-600/50">
            <Image src={room.host.avatar} alt={room.host.name} fill className="object-cover" />
          </div>
          <span className="text-[11px] text-zinc-600">{room.host.name}</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-zinc-600
                         group-hover:text-zinc-300 transition-colors duration-200">
          Open
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
        </span>
      </div>
    </div>
  </Link>
);

/* ── CARD 3: Typographic — text-dominant, small corner image ────────────── */
const TypographicCard: React.FC<{ room: typeof FEATURED_ROOMS[0]; cfg: typeof ROOM_CONFIG[RoomId] }> = ({ room, cfg }) => (
  <Link
    href={`/room/${room.slug}`}
    className="group block rounded-2xl overflow-hidden bg-midnight-950
               border border-plum-700/60 hover:border-plum-600
               transition-all duration-300 hover:-translate-y-1 relative"
  >
    {/* Full-bleed background image at low opacity — texture, not centrepiece */}
    <div className="absolute inset-0">
      <Image
        src={cfg.img}
        alt=""
        aria-hidden="true"
        fill
        className={`object-cover ${cfg.imgPosition} opacity-[0.12]
                    transition-opacity duration-500 group-hover:opacity-[0.18]`}
      />
    </div>
    {/* Strong full overlay so text is always legible */}
    <div className="absolute inset-0 bg-gradient-to-br from-midnight-950/95 via-midnight-950/90 to-midnight-950/80" />

    {/* Content */}
    <div className="relative z-10 p-6 h-full flex flex-col justify-between min-h-[280px]">
      <div>
        <div className="flex items-start justify-between mb-6">
          <DemoBadge />
          {/* Small square inset image */}
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-plum-700/60 shrink-0">
            <Image src={cfg.img} alt={cfg.imgAlt} fill className="object-cover" />
          </div>
        </div>

        <p className={`text-[9px] font-mono uppercase tracking-[0.2em] mb-3 ${cfg.accentClass}`}>
          {room.vibeTag}
        </p>

        {/* Title — large, editorial */}
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-100 leading-[1.1]
                       group-hover:text-lime-200 transition-colors duration-200">
          {room.title}
        </h3>

        <p className="mt-3 text-[13px] text-zinc-500 leading-relaxed">
          {room.description}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-plum-800/40
                      flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-plum-600/50">
            <Image src={room.host.avatar} alt={room.host.name} fill className="object-cover" />
          </div>
          <span className="text-[11px] text-zinc-600">{room.host.name}</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-zinc-600
                         group-hover:text-lime-400 transition-colors duration-200">
          Open
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
        </span>
      </div>
    </div>
  </Link>
);

/* ── RENDER MAP ─────────────────────────────────────────────────────────── */
const CARD_COMPONENTS = {
  portrait: PortraitCard,
  horizontal: HorizontalCard,
  typographic: TypographicCard,
} as const;

export const LiveLoungesGrid: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 border-t border-plum-800/50">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">

        {/* Section header */}
        <div className="mb-12 sm:mb-16 flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-16">
          <div className="shrink-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-lavender-400 mb-3">
              Sample Rooms · Demo
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100 leading-[1.1]">
              Three listening<br className="hidden sm:block" /> rooms.
            </h2>
          </div>
          <p className="text-[13px] text-zinc-500 leading-relaxed max-w-sm sm:pb-1">
            These are prototype demo rooms — illustrating the kind of sonic identities
            NOCTURNE will support when collaborative listening is live.
          </p>
        </div>

        {/*
          Three cards, each with a structurally distinct layout:
          · Card 1 (portrait): image-led, full-width image at top
          · Card 2 (horizontal): editorial sidebar layout, image left
          · Card 3 (typographic): text-dominant, image as texture and inset
        */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {FEATURED_ROOMS.map((room) => {
            const cfg = ROOM_CONFIG[room.id as RoomId];
            if (!cfg) return null;
            const CardComponent = CARD_COMPONENTS[cfg.layout];
            return <CardComponent key={room.id} room={room} cfg={cfg} />;
          })}
        </div>

        {/* Honest disclaimer */}
        <p className="mt-8 text-[11px] font-mono text-zinc-700 text-center">
          Sample rooms shown for design review. No real listener data is displayed.
        </p>

      </div>
    </section>
  );
};

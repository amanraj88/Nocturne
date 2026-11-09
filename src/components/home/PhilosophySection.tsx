import React from 'react';

/*
  Editorial manifesto section — replaces the 4-column feature card grid.

  Design rationale:
  - Three numbered ideas instead of four identical icon cards.
  - Typographic hierarchy driven by oversized ordinals (01, 02, 03) acting
    as visual anchors rather than icon badges.
  - Two-column asymmetric layout: ordinal + heading on the left,
    body paragraph on the right, separated by a subtle rule.
  - Generous vertical whitespace between items — this section should breathe,
    not feel like a marketing bullet list.
  - No icons, no borders, no background fills — the type IS the design.
*/

const PILLARS = [
  {
    num: '01',
    heading: 'Queue together.',
    body: 'Every person in the room can search, add, and reorder tracks. The queue belongs to everyone — not just the host.',
  },
  {
    num: '02',
    heading: 'Hear together.',
    body: 'Playback is kept in continuous sync across all listeners. When the room plays, everyone plays. When it pauses, everyone pauses.',
  },
  {
    num: '03',
    heading: 'Stay present.',
    body: 'Chat, react, and see who\'s listening in real time. NOCTURNE is built for the people in the room, not for the algorithm.',
  },
];

export const PhilosophySection: React.FC = () => {
  return (
    <section className="py-20 sm:py-32 border-t border-plum-800/50 bg-midnight-950/70">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">

        {/* Chapter header */}
        <div className="mb-16 sm:mb-20">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-lavender-400 mb-4">
            How it works
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-100
                         leading-[1.1] max-w-[20ch]">
            Built for the room,<br className="hidden sm:block" /> not the algorithm.
          </h2>
        </div>

        {/* Numbered editorial pillars */}
        <div className="space-y-0 divide-y divide-plum-800/50">
          {PILLARS.map(({ num, heading, body }) => (
            <div
              key={num}
              className="group grid grid-cols-1 sm:grid-cols-[6rem_1fr_1fr] lg:grid-cols-[8rem_1fr_1fr]
                         gap-y-3 sm:gap-x-10 lg:gap-x-16
                         py-10 sm:py-12
                         items-baseline"
            >
              {/* Oversized ordinal — visual anchor */}
              <span className="font-serif text-5xl sm:text-6xl font-bold text-plum-700/80
                               group-hover:text-lavender-500/30 transition-colors duration-300
                               leading-none select-none">
                {num}
              </span>

              {/* Heading — left content column */}
              <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-100
                             leading-snug sm:pr-4">
                {heading}
              </h3>

              {/* Body — right content column */}
              <p className="text-sm sm:text-[15px] text-zinc-500 leading-relaxed max-w-sm">
                {body}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

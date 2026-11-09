import React from 'react';

const PILLARS = [
  {
    num: '01',
    heading: 'Queue together.',
    body: 'Anyone in the lounge can search, suggest, and reorder tracks. The queue is a shared collective listening session.',
  },
  {
    num: '02',
    heading: 'Hear together.',
    body: 'Playback stays in continuous sync across listeners. When the room pauses, everyone pauses in place.',
  },
  {
    num: '03',
    heading: 'Stay present.',
    body: 'Chat, react, and see who is listening in real time. NOCTURNE is built for the people in the room.',
  },
];

export const PhilosophySection: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 border-t border-plum-subtle bg-plum-base/70">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="mb-16 max-w-2xl">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ivory leading-tight">
            Built for the room, not the feed.
          </h2>
          <p className="mt-4 text-sm text-warm-grey leading-relaxed max-w-lg">
            No endless algorithmic recommendation rabbit holes. Music chosen by the listeners present.
          </p>
        </div>

        <div className="divide-y divide-plum-subtle border-t border-b border-plum-subtle">
          {PILLARS.map(({ num, heading, body }) => (
            <div
              key={num}
              className="grid grid-cols-1 sm:grid-cols-[5rem_1fr_1.5fr] lg:grid-cols-[6rem_1fr_2fr] gap-4 sm:gap-8 py-10 items-baseline"
            >
              <span className="font-serif text-4xl sm:text-5xl font-bold text-plum-600 select-none">
                {num}
              </span>

              <h3 className="font-serif text-xl sm:text-2xl font-bold text-ivory leading-snug">
                {heading}
              </h3>

              <p className="text-sm text-warm-grey leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

import React from 'react';

const PILLARS = [
  {
    num: '01',
    heading: 'Queue together.',
    body: 'Add a YouTube link or choose a local audio file. Files stay on your device until you share a copy with the room.',
  },
  {
    num: '02',
    heading: 'Hear together.',
    body: 'YouTube and audio shared to the room follow one playhead. Each listener joins playback in their browser and sets their own volume.',
  },
  {
    num: '03',
    heading: 'Stay present.',
    body: 'Chat, react, and see who is listening in real time. NOCTURNE is built for the people in the room.',
  },
];

export const PhilosophySection: React.FC = () => {
  return (
    <section className="py-14 sm:py-20 border-t border-graphite bg-deep-ink">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-warm-bone leading-tight">
            Built for the room, not the feed.
          </h2>
          <p className="mt-4 text-sm text-ash leading-relaxed max-w-lg">
            No endless algorithmic recommendation rabbit holes. Music chosen by the listeners present.
          </p>
        </div>

        <div className="divide-y divide-graphite border-t border-b border-graphite">
          {PILLARS.map(({ num, heading, body }) => (
            <div
              key={num}
              className="grid grid-cols-1 sm:grid-cols-[5rem_1fr_1.5fr] lg:grid-cols-[6rem_1fr_2fr] gap-4 sm:gap-8 py-8 items-baseline"
            >
              <span className="font-serif text-4xl sm:text-5xl font-bold text-graphite select-none">
                {num}
              </span>

              <h3 className="font-serif text-xl sm:text-2xl font-bold text-warm-bone leading-snug">
                {heading}
              </h3>

              <p className="text-sm text-ash leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

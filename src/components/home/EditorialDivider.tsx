import React from 'react';

/*
  Editorial chapter break — a full-bleed typographic statement that acts
  as a visual breath between Hero and the room discovery section.

  Intentionally minimal: large tracking, low opacity, centred.
  Inspired by record sleeve liner notes and music magazine section breaks.
*/
export const EditorialDivider: React.FC = () => {
  return (
    <div className="border-t border-plum-800/50 py-14 sm:py-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <p
          className="font-serif text-[2.5rem] sm:text-[3.5rem] lg:text-[4.5rem]
                     font-bold text-zinc-100/[0.07] tracking-tight
                     whitespace-nowrap overflow-hidden select-none"
          aria-hidden="true"
        >
          NOCTURNE &nbsp;·&nbsp; COLLABORATIVE LISTENING &nbsp;·&nbsp; REAL-TIME SYNC &nbsp;·&nbsp; SHARED QUEUE
        </p>
      </div>
    </div>
  );
};

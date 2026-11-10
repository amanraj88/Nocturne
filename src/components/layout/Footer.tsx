import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-graphite bg-deep-ink py-10 px-6 sm:px-8 lg:px-10 text-xs text-ash">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="font-serif font-bold text-warm-bone text-sm">NOCTURNE</span>
          <p className="mt-1 text-xs text-ash">
            Collaborative listening lounge prototype.
          </p>
        </div>

        <nav className="flex items-center gap-6 text-xs text-ash">
          <Link href="/" className="hover:text-warm-bone transition-colors">Lounges</Link>
          <Link href="/room/tokyo-afterhours" className="hover:text-warm-bone transition-colors">Listening stage</Link>
        </nav>
      </div>
    </footer>
  );
};

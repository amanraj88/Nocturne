import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#EDEAF5] dark:border-[#2D2945] bg-white dark:bg-[#0F0E17] py-6 max-sm:pb-8 px-4 sm:px-6 mt-12 text-xs transition-colors">
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="font-syne font-bold text-[#12101F] dark:text-white tracking-wider">NOCTURNE</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
            Home
          </Link>
          <Link href="/rooms" className="hover:text-[var(--text-primary)] transition-colors">
            Rooms
          </Link>
          <a
            href="https://github.com/amanraj88"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1 font-medium"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
};

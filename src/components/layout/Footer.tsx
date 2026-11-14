import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#EDEAF5] dark:border-[#2D2945] bg-white dark:bg-[#0F0E17] py-6 px-6 sm:px-8 text-xs text-[#5E5873] dark:text-[#6B6785] transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-headline font-bold text-[#12101F] dark:text-white tracking-wider">NOCTURNE</span>
          <span className="text-[#EDEAF5] dark:text-[#2D2945]">•</span>
          <span className="text-[#5E5873] dark:text-[#A19EB5]">Music hits different together.</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-[#5E5873] dark:text-[#A19EB5]">
          <Link href="/rooms" className="hover:text-[#7C3AED] dark:hover:text-white transition-colors">
            Discover Rooms
          </Link>
          <Link href="/room/tokyo-afterhours" className="hover:text-[#7C3AED] dark:hover:text-white transition-colors">
            Listening Stage
          </Link>
          <a href="#guidelines" className="hover:text-[#7C3AED] dark:hover:text-white transition-colors">
            Guidelines
          </a>
          <a href="#help" className="hover:text-[#7C3AED] dark:hover:text-white transition-colors">
            Help &amp; Support
          </a>
          <span className="text-[#8D88A5] dark:text-[#6B6785]">© {new Date().getFullYear()} NOCTURNE</span>
        </nav>
      </div>
    </footer>
  );
};

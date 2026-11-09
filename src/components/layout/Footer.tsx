import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-plum-800/60 bg-midnight-950 py-10 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500 font-mono">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-serif font-bold tracking-widest text-zinc-200">NOCTURNE</span>
          <span>•</span>
          <span>Phase 1 Design & Prototype Specification</span>
        </div>

        <div className="flex items-center gap-6">
          <span>Obsidian #0B0A10</span>
          <span>Electric Lavender #B99AFF</span>
          <span>Warm Coral #FF806B</span>
        </div>
      </div>
    </footer>
  );
};

import React from 'react';
import { ShieldCheck, Sparkles, Sliders, Waves, Users2, Zap } from 'lucide-react';

export const PhilosophySection: React.FC = () => {
  const pillars = [
    {
      icon: Sparkles,
      title: 'Art-Directed, Never AI-Slop',
      description:
        'Engineered with curated editorial typography, bespoke palette tokens (#0B0A10 obsidian and electric lavender), and purposeful surfaces. No generic purple SaaS cards.',
    },
    {
      icon: Waves,
      title: 'Acoustic Visual Breathing',
      description:
        'When music plays, album sleeves oscillate with delicate harmonic waveforms and subtle rim glow, synchronizing visual atmosphere with sound vibrations.',
    },
    {
      icon: Zap,
      title: 'Sub-30ms Drift Correction',
      description:
        'Continuous room synchronization ensures friends in Tokyo, Berlin, and San Francisco hear the exact same snare hit and transition together.',
    },
    {
      icon: Sliders,
      title: 'Three-Tier Performance Engine',
      description:
        'Cinematic High (full canvas visualizer), Balanced Low (static glow), or Reduced Motion Off to unconditionally honor system preferences.',
    },
  ];

  return (
    <section className="py-20 border-t border-plum-800/60 bg-midnight-900/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <span className="text-[11px] font-mono uppercase tracking-widest text-lavender-400">
            Craft & Philosophy
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-100 mt-2">
            Built for Listening, Not Scrolling.
          </h2>
          <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
            Every interaction in NOCTURNE is calibrated like high-end audio hardware: tactile, focused, and acoustically responsive.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={i}
                className="rounded-2xl bg-midnight-950/80 border border-plum-700/50 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-plum-800/80 border border-lavender-400/20 flex items-center justify-center text-lavender-300 mb-5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-zinc-100">
                    {p.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

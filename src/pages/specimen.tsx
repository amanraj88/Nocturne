import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Radio, Play, Pause, Volume2, ShieldCheck } from 'lucide-react';

export default function TypographySpecimen() {
  const [fontStatus, setFontStatus] = useState<{
    syne: boolean;
    inter: boolean;
    jetbrains: boolean;
  }>({ syne: false, inter: false, jetbrains: false });

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        setFontStatus({
          syne: document.fonts.check('700 16px Syne'),
          inter: document.fonts.check('400 16px Inter'),
          jetbrains: document.fonts.check('400 16px "JetBrains Mono"'),
        });
      });
    }
  }, []);

  return (
    <>
      <Head>
        <title>NOCTURNE: Typography Specimen (Creative Direction v1.0)</title>
        <meta name="description" content="Dedicated typography specimen demonstrating Syne, Inter and JetBrains Mono." />
      </Head>

      <div className="min-h-screen bg-deep-ink text-warm-bone py-12 px-6 sm:px-10 lg:px-16 max-w-6xl mx-auto space-y-16">
        {/* Navigation & Header */}
        <header className="border-b border-graphite pb-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-sans font-medium text-ash hover:text-mineral transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Prototype</span>
            </Link>

            <span className="text-xs text-ash bg-carbon px-3 py-1 rounded-full border border-graphite">
              Specimen v1.0: Mineral and Oxide system
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-warm-bone tracking-tight leading-none">
                Typography Specimen
              </h1>
              <p className="font-sans text-sm text-ash mt-3 max-w-2xl leading-relaxed">
                Self-hosted font verification for Syne, Inter, and JetBrains Mono.
              </p>
            </div>

            {/* Live Browser Font Engine Verification */}
            <div className="bg-carbon border border-graphite rounded-xl p-4 shrink-0 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-mineral text-xs font-medium border-b border-graphite pb-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-mineral" />
                <span>Zero external Google requests</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-ash">Syne variable (weights 400 to 800)</span>
                <span className={`font-mono text-xs px-2 py-0.5 rounded ${fontStatus.syne ? 'bg-mineral/15 text-mineral border border-mineral/30' : 'bg-oxide/15 text-oxide'}`}>
                  {fontStatus.syne ? 'Active' : 'Verifying'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-ash">Inter variable (weights 300 to 700)</span>
                <span className={`font-mono text-xs px-2 py-0.5 rounded ${fontStatus.inter ? 'bg-mineral/15 text-mineral border border-mineral/30' : 'bg-oxide/15 text-oxide'}`}>
                  {fontStatus.inter ? 'Active' : 'Verifying'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-ash">JetBrains Mono (weights 400 to 600)</span>
                <span className={`font-mono text-xs px-2 py-0.5 rounded ${fontStatus.jetbrains ? 'bg-mineral/15 text-mineral border border-mineral/30' : 'bg-oxide/15 text-oxide'}`}>
                  {fontStatus.jetbrains ? 'Active' : 'Verifying'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* SECTION 1: SYNE (DISPLAY) */}
        <section className="space-y-8">
          <div className="border-b border-graphite pb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-mineral">
              01: Expressive display typography (Syne)
            </h2>
            <span className="text-xs text-ash">
              Variable font: weights 400, 700 and 800
            </span>
          </div>

          {/* Major Editorial Tagline Comparison */}
          <div className="space-y-6 bg-carbon/50 border border-graphite rounded-2xl p-6 sm:p-8">
            <div>
              <div className="flex items-center justify-between text-xs text-ash mb-2">
                <span>Weight 800 (ExtraBold), 56px, tracking tight, leading 1.02</span>
                <span className="text-mineral font-medium">Primary tagline</span>
              </div>
              <p className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.02] tracking-tight text-warm-bone">
                Music hits different together.
              </p>
            </div>

            <div className="pt-6 border-t border-graphite">
              <div className="flex items-center justify-between text-xs text-ash mb-2">
                <span>Weight 700 (Bold), 40px, leading 1.06</span>
                <span className="text-ash">Lounge title</span>
              </div>
              <p className="font-display font-bold text-3xl sm:text-4xl lg:text-[2.5rem] leading-[1.06] tracking-tight text-warm-bone">
                After-hours listening, curated in lockstep.
              </p>
            </div>
          </div>

          {/* Size Scale Hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-carbon border border-graphite space-y-2">
              <span className="text-xs text-ash block">Display L: 32px, weight 800</span>
              <p className="font-display font-extrabold text-2xl text-warm-bone leading-tight">
                Shibuya Midnight Reverie
              </p>
              <p className="font-sans text-xs text-ash">Sculptural, deliberate, architectural.</p>
            </div>

            <div className="p-5 rounded-xl bg-carbon border border-graphite space-y-2">
              <span className="text-xs text-ash block">Display M: 24px, weight 700</span>
              <p className="font-display font-bold text-xl text-warm-bone leading-snug">
                Kreuzberg Concrete Velvet
              </p>
              <p className="font-sans text-xs text-ash">Industrial, grounded, confident.</p>
            </div>
          </div>
        </section>

        {/* SECTION 2: INTER (INTERFACE SANS) */}
        <section className="space-y-8">
          <div className="border-b border-graphite pb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-mineral">
              02: Interface typography (Inter)
            </h2>
            <span className="text-xs text-ash">
              Variable font: weights 400, 500 and 600
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weight 400: Body / Lede */}
            <div className="p-6 rounded-2xl bg-carbon border border-graphite space-y-3">
              <div className="flex items-center justify-between text-xs text-ash border-b border-graphite pb-2">
                <span>Inter 400 (Regular)</span>
                <span>14px</span>
              </div>
              <p className="font-sans text-sm text-ash leading-relaxed">
                A digital space where sound becomes visual culture and listening becomes a shared experience. No algorithm feeds; tracks are curated exclusively by the listeners present in the room.
              </p>
              <span className="text-xs text-ash block pt-2">Purpose: Editorial ledes and descriptions</span>
            </div>

            {/* Weight 500: Navigation & Context */}
            <div className="p-6 rounded-2xl bg-carbon border border-graphite space-y-3">
              <div className="flex items-center justify-between text-xs text-ash border-b border-graphite pb-2">
                <span>Inter 500 (Medium)</span>
                <span>13px</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-sans font-medium text-warm-bone">
                  <span>Julian Vance (Host)</span>
                  <span className="text-mineral">Listening</span>
                </div>
                <div className="flex items-center justify-between text-xs font-sans font-medium text-warm-bone">
                  <span>Elena Rostova</span>
                  <span className="text-ash">Collaborator</span>
                </div>
                <div className="flex items-center justify-between text-xs font-sans font-medium text-warm-bone">
                  <span>Kai Takahashi</span>
                  <span className="text-ash">Queue active</span>
                </div>
              </div>
              <span className="text-xs text-ash block pt-2">Purpose: User handles and metadata lists</span>
            </div>

            {/* Weight 600: Controls & Actions */}
            <div className="p-6 rounded-2xl bg-carbon border border-graphite space-y-3">
              <div className="flex items-center justify-between text-xs text-ash border-b border-graphite pb-2">
                <span>Inter 600 (SemiBold)</span>
                <span>12px</span>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full py-2.5 rounded-full bg-mineral text-deep-ink font-sans font-semibold text-xs transition-colors hover:bg-mineral/90"
                >
                  Enter Listening Lounge
                </button>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-full bg-deep-ink border border-graphite text-warm-bone font-sans font-semibold text-xs hover:border-mineral/40 transition-colors"
                >
                  Queue Track Proposal
                </button>
              </div>
              <span className="text-xs text-ash block pt-2">Purpose: Buttons and prominent CTAs</span>
            </div>
          </div>
        </section>

        {/* SECTION 3: JETBRAINS MONO (TECHNICAL TELEMETRY) */}
        <section className="space-y-8">
          <div className="border-b border-graphite pb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-mineral">
              03: Technical and tabular monospace (JetBrains Mono)
            </h2>
            <span className="text-xs text-ash">
              Variable font: weights 400 and 500 (tabular figures)
            </span>
          </div>

          <div className="bg-carbon border border-graphite rounded-2xl p-6 sm:p-8 space-y-6">
            <p className="font-sans text-xs text-ash max-w-xl">
              True tabular figures ensure that timecode scrubbers, stream rates, and catalogue identifiers do not cause visual horizontal jitter during live playback.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-deep-ink border border-graphite">
                <span className="text-xs text-ash block">Tabular duration</span>
                <span className="font-mono font-normal text-lg text-warm-bone tracking-tight mt-1 block">
                  03:48 / 04:44
                </span>
                <span className="text-xs text-mineral mt-1 block">0ms drift</span>
              </div>

              <div className="p-4 rounded-xl bg-deep-ink border border-graphite">
                <span className="text-xs text-ash block">Catalogue index</span>
                <span className="font-mono font-medium text-lg text-warm-bone tracking-tight mt-1 block">
                  NOC-01
                </span>
                <span className="text-xs text-ash mt-1 block">48kHz matrix</span>
              </div>

              <div className="p-4 rounded-xl bg-deep-ink border border-graphite">
                <span className="text-xs text-ash block">Activity timestamp</span>
                <span className="font-mono font-normal text-lg text-warm-bone tracking-tight mt-1 block">
                  10:14:22 PM
                </span>
                <span className="text-xs text-ash mt-1 block">Joined room</span>
              </div>

              <div className="p-4 rounded-xl bg-deep-ink border border-graphite">
                <span className="text-xs text-ash block">Room state</span>
                <span className="font-sans font-medium text-lg text-mineral tracking-tight mt-1 block">
                  Synchronized
                </span>
                <span className="text-xs text-ash mt-1 block">14 listeners</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: REALISTIC NOCTURNE COMPOSITION */}
        <section className="space-y-8">
          <div className="border-b border-graphite pb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-mineral">
              04: Complete realistic composition
            </h2>
            <span className="text-xs text-ash">
              Syne, Inter and JetBrains Mono in context
            </span>
          </div>

          {/* Integrated Listening Lounge Preview Card */}
          <div className="rounded-2xl bg-carbon border border-graphite overflow-hidden p-6 sm:p-10 space-y-8">
            {/* Lounge Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-graphite pb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-mineral bg-deep-ink px-2 py-0.5 rounded border border-graphite">
                    NOC-01
                  </span>
                  <span className="text-xs text-ash">
                    Shibuya After-Hours Lounge
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-3xl sm:text-4xl text-warm-bone tracking-tight">
                  Shibuya Midnight Reverie
                </h3>
                <p className="font-sans text-xs text-ash mt-2 max-w-lg leading-relaxed">
                  Curated by <span className="text-warm-bone font-medium">Julian Vance</span>. Deep IDM, tape saturation, and minimal synthesizer textures for after-hours listening.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start">
                <span className="inline-flex items-center gap-1.5 text-xs text-mineral bg-deep-ink px-3 py-1.5 rounded-full border border-graphite">
                  <Radio className="w-3 h-3 text-mineral" />
                  <span>Synchronized</span>
                </span>
              </div>
            </div>

            {/* Realistic Tracklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-ash px-3">
                <span>Track and artist</span>
                <span>Contributor and duration</span>
              </div>

              {/* Track 1: Now Playing */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-deep-ink border border-mineral/30 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-mono text-xs text-mineral font-medium">01</span>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-warm-bone truncate">
                      LesAlpx
                    </p>
                    <p className="font-sans text-xs text-ash truncate">
                      Floating Points
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  <span className="font-sans text-ash hidden sm:inline">via Julian</span>
                  <span className="font-mono text-mineral font-medium">04:44</span>
                </div>
              </div>

              {/* Track 2 */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-deep-ink/50 border border-graphite transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-mono text-xs text-ash font-medium">02</span>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-warm-bone truncate">
                      Awake
                    </p>
                    <p className="font-sans text-xs text-ash truncate">
                      Tycho
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  <span className="font-sans text-ash hidden sm:inline">via Elena</span>
                  <span className="font-mono text-ash">04:39</span>
                </div>
              </div>

              {/* Track 3 */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-deep-ink/50 border border-graphite transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-mono text-xs text-ash font-medium">03</span>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-warm-bone truncate">
                      Circling
                    </p>
                    <p className="font-sans text-xs text-ash truncate">
                      Bonobo
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  <span className="font-sans text-ash hidden sm:inline">via Kai</span>
                  <span className="font-mono text-ash">05:48</span>
                </div>
              </div>
            </div>

            {/* Playback Transport Dock */}
            <div className="pt-6 border-t border-graphite flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full bg-mineral text-deep-ink flex items-center justify-center hover:bg-mineral/90 transition-transform active:scale-95"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <div>
                  <p className="font-display font-bold text-xs text-warm-bone">
                    LesAlpx (Floating Points)
                  </p>
                  <p className="font-mono text-xs text-ash">
                    01:14 / 04:44
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-full sm:w-48 h-1 bg-graphite rounded-full overflow-hidden">
                  <div className="w-[28%] h-full bg-mineral rounded-full" />
                </div>
                <Volume2 className="w-4 h-4 text-ash shrink-0" />
              </div>
            </div>
          </div>
        </section>

        {/* Specimen Footer */}
        <footer className="border-t border-graphite pt-6 text-xs text-ash flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>NOCTURNE Typography Engine: Version 1.0</span>
          <span>Syne 400 to 800, Inter 300 to 700, JetBrains Mono 400 to 600</span>
        </footer>
      </div>
    </>
  );
}

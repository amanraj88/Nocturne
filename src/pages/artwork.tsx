import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Disc3, ShieldCheck, Sparkles } from 'lucide-react';
import { Noc01Shibuya, Noc02Reykjavik, Noc03Kreuzberg } from '@/components/artwork';

export default function ArtworkPreview() {
  return (
    <>
      <Head>
        <title>NOCTURNE: Abstract Artwork Prototypes (Refined Edition)</title>
        <meta
          name="description"
          content="Refined experimental electronic music release covers for NOCTURNE: Shibuya, Reykjavik, and Kreuzberg."
        />
      </Head>

      <div className="min-h-screen bg-deep-ink text-warm-bone py-12 px-6 sm:px-10 lg:px-16 max-w-6xl mx-auto space-y-16">
        {/* Navigation & Header */}
        <header className="border-b border-graphite pb-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-sans font-medium text-ash hover:text-mineral transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Prototype</span>
              </Link>
              <Link
                href="/specimen"
                className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-ash hover:text-mineral transition-colors"
              >
                <span>Typography Specimen</span>
              </Link>
            </div>

            <span className="text-xs text-ash bg-carbon px-3 py-1 rounded-full border border-graphite">
              Artwork prototypes: Refinement pass
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-mineral text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Curated Experimental Electronic Music Covers</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-warm-bone tracking-tight leading-none">
                Artwork Prototypes
              </h1>
              <p className="font-sans text-sm text-ash mt-3 max-w-2xl leading-relaxed">
                Three art-directed release covers inspired by vinyl culture, optical physics, and brutalism.
              </p>
            </div>

            {/* Zero Dependency Badge */}
            <div className="bg-carbon border border-graphite rounded-xl p-4 shrink-0 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-mineral text-xs font-medium border-b border-graphite pb-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-mineral" />
                <span>Zero external network dependencies</span>
              </div>
              <p className="text-ash text-xs">
                Self-contained vector compositions: pure SVG geometry, infinite crispness, zero 404 risk.
              </p>
            </div>
          </div>
        </header>

        {/* SECTION 1: LARGE GALLERY EXHIBITION */}
        <section className="space-y-10">
          <div className="border-b border-graphite pb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-mineral">
              01: Exhibition gallery scale (600 × 600)
            </h2>
            <span className="text-xs text-ash">
              Full 1:1 vinyl cover master view
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* NOC-01: Shibuya */}
            <article className="flex flex-col rounded-2xl bg-carbon border border-graphite overflow-hidden">
              <div className="p-6 border-b border-graphite">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-mineral bg-deep-ink px-2 py-0.5 rounded border border-graphite">
                    NOC-01
                  </span>
                  <span className="text-xs text-ash">
                    Shibuya After-Hours
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-warm-bone leading-tight">
                  Shibuya Midnight Reverie
                </h3>
                <p className="font-sans text-xs text-ash mt-1">
                  Deep IDM, minimal modular synth and syncopated drift
                </p>
              </div>

              {/* Artwork Frame */}
              <div className="relative aspect-square w-full bg-deep-ink p-4 flex items-center justify-center">
                <div className="w-full h-full rounded-xl overflow-hidden border border-graphite">
                  <Noc01Shibuya />
                </div>
              </div>

              {/* Curatorial Breakdown */}
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <span className="text-ash font-medium block mb-1">Visual refinement:</span>
                  <p className="text-ash leading-relaxed">
                    Replaced repetitive horizontal lines with a commanding central focal aperture. Organic undulating frequency ribbons converge into a high-energy moiré interference diamond, flanked by two sharp architectural tape-shear displacements.
                  </p>
                </div>

                <div>
                  <span className="text-ash font-medium block mb-1">Color balance:</span>
                  <div className="flex items-center gap-2 text-[11px] text-ash">
                    <span className="w-2.5 h-2.5 rounded-full bg-deep-ink border border-graphite" title="Deep Ink" />
                    <span>Deep Ink</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-mineral" title="Mineral" />
                    <span>Mineral</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-warm-bone" title="Warm Bone" />
                    <span>Warm Bone</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-graphite flex items-center justify-between text-ash text-[11px]">
                  <span>Focal core: Central moiré aperture</span>
                  <span>Art direction: Optical tape synthesis</span>
                </div>
              </div>
            </article>

            {/* NOC-02: Reykjavik */}
            <article className="flex flex-col rounded-2xl bg-carbon border border-graphite overflow-hidden">
              <div className="p-6 border-b border-graphite">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-warm-bone bg-deep-ink px-2 py-0.5 rounded border border-graphite">
                    NOC-02
                  </span>
                  <span className="text-xs text-ash">
                    Reykjavik Solitude
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-warm-bone leading-tight">
                  Reykjavik Obsidian Echoes
                </h3>
                <p className="font-sans text-xs text-ash mt-1">
                  Neoclassical drones, felted piano dampening and arctic air
                </p>
              </div>

              {/* Artwork Frame */}
              <div className="relative aspect-square w-full bg-deep-ink p-4 flex items-center justify-center">
                <div className="w-full h-full rounded-xl overflow-hidden border border-graphite">
                  <Noc02Reykjavik />
                </div>
              </div>

              {/* Curatorial Breakdown */}
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <span className="text-ash font-medium block mb-1">Visual refinement:</span>
                  <p className="text-ash leading-relaxed">
                    Elevated the topographic contours with a luminous Warm Bone sculptural ridge (3.5px line weight) and high-contrast Ash terraces. Deep carbon shading anchors the landmass against 50% expansive negative space void, guaranteeing high visibility even at small scales.
                  </p>
                </div>

                <div>
                  <span className="text-ash font-medium block mb-1">Color balance:</span>
                  <div className="flex items-center gap-2 text-[11px] text-ash">
                    <span className="w-2.5 h-2.5 rounded-full bg-deep-ink border border-graphite" title="Deep Ink" />
                    <span>Deep Ink</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-warm-bone" title="Warm Bone" />
                    <span>Warm Bone</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-ash" title="Ash" />
                    <span>Ash</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-graphite flex items-center justify-between text-ash text-[11px]">
                  <span>Focal core: Diagonal glacial crest</span>
                  <span>Art direction: Arctic escarpment</span>
                </div>
              </div>
            </article>

            {/* NOC-03: Kreuzberg */}
            <article className="flex flex-col rounded-2xl bg-carbon border border-graphite overflow-hidden">
              <div className="p-6 border-b border-graphite">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-oxide bg-deep-ink px-2 py-0.5 rounded border border-graphite">
                    NOC-03
                  </span>
                  <span className="text-xs text-ash">
                    Berlin Basement
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-warm-bone leading-tight">
                  Kreuzberg Concrete Velvet
                </h3>
                <p className="font-sans text-xs text-ash mt-1">
                  Dub techno, warehouse warmth and modular tape saturation
                </p>
              </div>

              {/* Artwork Frame */}
              <div className="relative aspect-square w-full bg-deep-ink p-4 flex items-center justify-center">
                <div className="w-full h-full rounded-xl overflow-hidden border border-graphite">
                  <Noc03Kreuzberg />
                </div>
              </div>

              {/* Curatorial Breakdown */}
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <span className="text-ash font-medium block mb-1">Visual refinement:</span>
                  <p className="text-ash leading-relaxed">
                    Integrated the Oxide beam (#A65D45) as an interlocking tectonic architectural monolith that physically locks into the board-formed concrete pylon and spans across an authentic screenprinted risograph halftone matrix.
                  </p>
                </div>

                <div>
                  <span className="text-ash font-medium block mb-1">Color balance:</span>
                  <div className="flex items-center gap-2 text-[11px] text-ash">
                    <span className="w-2.5 h-2.5 rounded-full bg-deep-ink border border-graphite" title="Deep Ink" />
                    <span>Deep Ink</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-oxide" title="Oxide" />
                    <span>Oxide</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-graphite" title="Graphite" />
                    <span>Graphite</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-graphite flex items-center justify-between text-ash text-[11px]">
                  <span>Focal core: Interlocking oxide monolith</span>
                  <span>Art direction: Industrial constructivism</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* SECTION 2: THUMBNAIL SCALE VERIFICATION */}
        <section className="space-y-8">
          <div className="border-b border-graphite pb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-mineral">
              02: Thumbnail and responsive scale verification
            </h2>
            <span className="text-xs text-ash">
              Testing readability at 128px, 80px and 48px
            </span>
          </div>

          <div className="p-8 rounded-2xl bg-carbon border border-graphite space-y-8">
            <p className="text-xs text-ash max-w-xl leading-relaxed">
              Artwork must remain visually distinctive, identifiable and graphically intact whether displayed in a massive hero header or compressed into a mobile tracklist thumbnail. Notice how each piece maintains an unmistakable silhouette even at 48px.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Scale Group 1: 128px Catalogue Tile */}
              <div className="space-y-3">
                <span className="text-xs font-medium text-ash block">Catalogue card size: 128px</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-32 rounded-xl overflow-hidden border border-graphite shrink-0">
                    <Noc01Shibuya />
                  </div>
                  <div className="w-32 h-32 rounded-xl overflow-hidden border border-graphite shrink-0">
                    <Noc02Reykjavik />
                  </div>
                  <div className="w-32 h-32 rounded-xl overflow-hidden border border-graphite shrink-0">
                    <Noc03Kreuzberg />
                  </div>
                </div>
              </div>

              {/* Scale Group 2: 80px Compact Dock Tile */}
              <div className="space-y-3">
                <span className="text-xs font-medium text-ash block">Dock thumbnail size: 80px</span>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-graphite shrink-0">
                    <Noc01Shibuya />
                  </div>
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-graphite shrink-0">
                    <Noc02Reykjavik />
                  </div>
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-graphite shrink-0">
                    <Noc03Kreuzberg />
                  </div>
                </div>
              </div>

              {/* Scale Group 3: 48px Queue Row Tile */}
              <div className="space-y-3">
                <span className="text-xs font-medium text-ash block">Queue row size: 48px</span>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md overflow-hidden border border-graphite shrink-0">
                    <Noc01Shibuya />
                  </div>
                  <div className="w-12 h-12 rounded-md overflow-hidden border border-graphite shrink-0">
                    <Noc02Reykjavik />
                  </div>
                  <div className="w-12 h-12 rounded-md overflow-hidden border border-graphite shrink-0">
                    <Noc03Kreuzberg />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: TACTILE VINYL SLEEVE INTEGRATION SIMULATION */}
        <section className="space-y-8">
          <div className="border-b border-graphite pb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-mineral">
              03: Tactile physical vinyl sleeve simulation
            </h2>
            <span className="text-xs text-ash">
              Sleeve depth, record vinyl groove and ambient response
            </span>
          </div>

          <div className="p-8 sm:p-12 rounded-2xl bg-carbon border border-graphite">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Sleeve 1 */}
              <div className="flex flex-col items-center">
                <div className="relative w-64 aspect-square mb-6">
                  {/* Peeking Vinyl Record */}
                  <div className="absolute top-1 -right-6 w-[92%] h-[92%] rounded-full bg-deep-ink border border-graphite flex items-center justify-center">
                    <div className="w-[80%] h-[80%] rounded-full border border-graphite/60 flex items-center justify-center">
                      <div className="w-[40%] h-[40%] rounded-full bg-carbon border border-mineral/40 flex items-center justify-center">
                        <Disc3 className="w-4 h-4 text-mineral opacity-80" />
                      </div>
                    </div>
                  </div>

                  {/* Physical Sleeve Outer */}
                  <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden border border-graphite bg-deep-ink">
                    <Noc01Shibuya />
                  </div>
                </div>

                <div className="text-center">
                  <p className="font-display font-bold text-sm text-warm-bone">
                    NOC-01: Shibuya Reverie
                  </p>
                  <p className="text-xs text-ash mt-0.5">
                    12 inch 180g vinyl master
                  </p>
                </div>
              </div>

              {/* Sleeve 2 */}
              <div className="flex flex-col items-center">
                <div className="relative w-64 aspect-square mb-6">
                  {/* Peeking Vinyl Record */}
                  <div className="absolute top-1 -right-6 w-[92%] h-[92%] rounded-full bg-deep-ink border border-graphite flex items-center justify-center">
                    <div className="w-[80%] h-[80%] rounded-full border border-graphite/60 flex items-center justify-center">
                      <div className="w-[40%] h-[40%] rounded-full bg-carbon border border-warm-bone/40 flex items-center justify-center">
                        <Disc3 className="w-4 h-4 text-warm-bone opacity-80" />
                      </div>
                    </div>
                  </div>

                  {/* Physical Sleeve Outer */}
                  <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden border border-graphite bg-deep-ink">
                    <Noc02Reykjavik />
                  </div>
                </div>

                <div className="text-center">
                  <p className="font-display font-bold text-sm text-warm-bone">
                    NOC-02: Reykjavik Echoes
                  </p>
                  <p className="text-xs text-ash mt-0.5">
                    12 inch heavy card matte sleeve
                  </p>
                </div>
              </div>

              {/* Sleeve 3 */}
              <div className="flex flex-col items-center">
                <div className="relative w-64 aspect-square mb-6">
                  {/* Peeking Vinyl Record */}
                  <div className="absolute top-1 -right-6 w-[92%] h-[92%] rounded-full bg-deep-ink border border-graphite flex items-center justify-center">
                    <div className="w-[80%] h-[80%] rounded-full border border-graphite/60 flex items-center justify-center">
                      <div className="w-[40%] h-[40%] rounded-full bg-carbon border border-oxide/40 flex items-center justify-center">
                        <Disc3 className="w-4 h-4 text-oxide opacity-80" />
                      </div>
                    </div>
                  </div>

                  {/* Physical Sleeve Outer */}
                  <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden border border-graphite bg-deep-ink">
                    <Noc03Kreuzberg />
                  </div>
                </div>

                <div className="text-center">
                  <p className="font-display font-bold text-sm text-warm-bone">
                    NOC-03: Kreuzberg Velvet
                  </p>
                  <p className="text-xs text-ash mt-0.5">
                    12 inch risograph print edition
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Prototype Footer */}
        <footer className="border-t border-graphite pt-6 text-xs text-ash flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>NOCTURNE Catalogue Artwork Engine: Refined Edition v1.1</span>
          <span>NOC-01 Shibuya, NOC-02 Reykjavik, NOC-03 Kreuzberg</span>
        </footer>
      </div>
    </>
  );
}

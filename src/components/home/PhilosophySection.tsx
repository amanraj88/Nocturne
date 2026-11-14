import React from 'react';
import {
  Radio,
  Disc3,
  Users,
  Sparkles,
  Zap,
  Vote,
  Clock,
  Music2,
  Headphones,
  CheckCircle2,
  Heart,
  Volume2,
} from 'lucide-react';

export const PhilosophySection: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 border-t border-[#EDEAF5] dark:border-[#2D2945] bg-[#F8F7FC] dark:bg-[#0F0E17]/40 relative overflow-hidden transition-colors">
      {/* Background ambient lighting glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#8B5CF6]/10 via-[#FF5C8A]/10 to-transparent blur-[120px] pointer-events-none rounded-full" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Editorial Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#F3F0FA] dark:bg-[#8B5CF6]/15 border border-[#DDD6FE] dark:border-[#8B5CF6]/30 text-[#6D28D9] dark:text-[#DDD6FE] mb-4">
            <Radio className="w-3.5 h-3.5 text-[#F43F5E] dark:text-[#FF5C8A] animate-pulse" />
            <span className="tracking-wider uppercase">COMMUNAL SOUND SYSTEM</span>
          </div>

          <h2 className="font-headline font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#12101F] dark:text-white tracking-tight leading-[1.15]">
            Music was never meant to be heard <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F43F5E] dark:from-[#8B5CF6] dark:via-[#EC4899] dark:to-[#FF5C8A] bg-clip-text text-transparent">
              in algorithmic isolation.
            </span>
          </h2>

          <p className="mt-5 text-base sm:text-lg text-[#5E5873] dark:text-[#A19EB5] leading-relaxed">
            No recommendation rabbit holes, no synthetic discovery feeds, and no fake follower metrics.
            NOCTURNE returns listening to intimate, synchronous human rooms where music is chosen and felt together.
          </p>
        </div>

        {/* Editorial Asymmetric Storytelling Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* ============================================================== */}
          {/* Card 1: Authoritative Sound Stage (lg:col-span-7)              */}
          {/* ============================================================== */}
          <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] p-7 sm:p-9 flex flex-col justify-between shadow-sm dark:shadow-2xl relative overflow-hidden group hover:border-[#7C3AED]/50 dark:hover:border-[#8B5CF6]/50 transition-all duration-300">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-4 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F0FA] dark:bg-[#8B5CF6]/15 text-[#6D28D9] dark:text-[#DDD6FE] text-xs font-mono font-semibold">
                  <Zap className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#8B5CF6]" />
                  <span>AUTHORITATIVE AUDIO SYNC</span>
                </span>
                <span className="text-xs font-mono text-[#16A34A] dark:text-[#4ADE80] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] dark:bg-[#4ADE80] animate-pulse" />
                  <span>&lt; 120ms Latency</span>
                </span>
              </div>

              <h3 className="font-headline font-bold text-2xl sm:text-3xl text-[#12101F] dark:text-white tracking-tight">
                One needle on the record. Everyone follows.
              </h3>

              <p className="mt-3 text-sm sm:text-base text-[#5E5873] dark:text-[#A19EB5] leading-relaxed">
                When the host drops the needle, scrubs forward to a drop, or pauses the groove, every connected browser across the globe adjusts instantaneously. Dual-engine architecture synchronizes YouTube streams and uploaded lossless stems seamlessly.
              </p>
            </div>

            {/* Simulated Live Stage Visualizer Interface */}
            <div className="mt-8 rounded-2xl bg-[#F8F7FC] dark:bg-[#12101F] border border-[#EDEAF5] dark:border-[#2D2945] p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-[#5E5873] dark:text-[#A19EB5] mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#F43F5E] dark:bg-[#FF5C8A] animate-ping" />
                  <span className="font-mono text-[#12101F] dark:text-white text-[11px]">LIVE BROADCAST • NOCTURNE-CORE</span>
                </div>
                <span className="font-mono text-[11px] text-[#7C3AED] dark:text-[#8B5CF6]">PostgreSQL Realtime</span>
              </div>

              {/* Waveform graphic & track mockup */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#F43F5E] dark:from-[#8B5CF6] dark:to-[#FF5C8A] p-[1.5px] shrink-0">
                  <div className="w-full h-full bg-white dark:bg-[#1A1829] rounded-[10px] flex items-center justify-center text-[#7C3AED] dark:text-white">
                    <Disc3 className="w-6 h-6 animate-spin text-[#7C3AED] dark:text-[#8B5CF6]" style={{ animationDuration: '6s' }} />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#12101F] dark:text-white truncate">Modular Resonances in D Minor</p>
                  <p className="text-xs text-[#5E5873] dark:text-[#A19EB5] truncate">Kiasmos • Queued via YouTube</p>
                  <div className="mt-2 w-full h-1.5 bg-[#EDEAF5] dark:bg-[#242138] rounded-full overflow-hidden">
                    <div className="w-[62%] h-full bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F43F5E] dark:from-[#8B5CF6] dark:via-[#EC4899] dark:to-[#FF5C8A]" />
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1 h-8 shrink-0">
                  <span className="w-1 bg-[#16A34A] dark:bg-[#4ADE80] rounded-full eq-1" />
                  <span className="w-1 bg-[#16A34A] dark:bg-[#4ADE80] rounded-full eq-2" />
                  <span className="w-1 bg-[#16A34A] dark:bg-[#4ADE80] rounded-full eq-3" />
                  <span className="w-1 bg-[#16A34A] dark:bg-[#4ADE80] rounded-full eq-4" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EDEAF5] dark:border-[#2D2945]/70 flex flex-wrap items-center justify-between gap-3 text-xs text-[#5E5873] dark:text-[#A19EB5]">
              <span className="flex items-center gap-1.5 text-[#12101F] dark:text-white font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
                Zero Audio Desynchronization
              </span>
              <span>Web Audio API + IFrame State Protocol</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* Card 2: Democratic Living Queue (lg:col-span-5)                */}
          {/* ============================================================== */}
          <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] p-7 sm:p-9 flex flex-col justify-between shadow-sm dark:shadow-2xl relative overflow-hidden group hover:border-[#7C3AED]/50 dark:hover:border-[#8B5CF6]/50 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between gap-4 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1F2] dark:bg-[#FF5C8A]/15 text-[#E11D48] dark:text-[#FF5C8A] text-xs font-mono font-semibold">
                  <Vote className="w-3.5 h-3.5" />
                  <span>CONSENSUS CURATION</span>
                </span>
                <span className="text-xs text-[#5E5873] dark:text-[#A19EB5]">Shared Control</span>
              </div>

              <h3 className="font-headline font-bold text-2xl sm:text-3xl text-[#12101F] dark:text-white tracking-tight">
                A shared turntable, not a solo playlist.
              </h3>

              <p className="mt-3 text-sm text-[#5E5873] dark:text-[#A19EB5] leading-relaxed">
                Anyone in the room can paste a YouTube link or drop an audio stem to queue up next. When a track does not fit the vibe, democratic vote-skip thresholds pass playback forward smoothly.
              </p>

              {/* Simulated Queue items stack */}
              <div className="mt-6 space-y-2">
                <div className="p-3 rounded-xl bg-[#F8F7FC] dark:bg-[#242138]/60 border border-[#EDEAF5] dark:border-[#2D2945] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-[10px] font-mono font-bold text-[#16A34A] dark:text-[#4ADE80] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-[#4ADE80]/15 border border-emerald-200 dark:border-[#4ADE80]/30">NEXT</span>
                    <span className="font-semibold text-[#12101F] dark:text-white truncate">Floating Points — Vocoder</span>
                  </div>
                  <span className="font-mono text-[#5E5873] dark:text-[#A19EB5] shrink-0">3:42</span>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F7FC]/70 dark:bg-[#242138]/30 border border-[#EDEAF5]/70 dark:border-[#2D2945]/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-[10px] font-mono text-[#5E5873] dark:text-[#A19EB5] w-5 text-center">02</span>
                    <span className="text-[#5E5873] dark:text-[#A19EB5] truncate">Four Tet — Two Thousand and Seventeen</span>
                  </div>
                  <span className="font-mono text-[#8E88A8] dark:text-[#6B6785] shrink-0">4:12</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EDEAF5] dark:border-[#2D2945]/70 flex items-center justify-between text-xs text-[#5E5873] dark:text-[#A19EB5]">
              <span className="flex items-center gap-1.5 text-[#12101F] dark:text-white font-medium">
                <Music2 className="w-4 h-4 text-[#7C3AED] dark:text-[#8B5CF6]" />
                Collaborative Queue Reordering
              </span>
              <span>Vote-Skip Enabled</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* Card 3: Transient Presence & Honest Lifecycles (lg:col-span-12)*/}
          {/* ============================================================== */}
          <div className="lg:col-span-12 rounded-3xl bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] p-7 sm:p-10 shadow-sm dark:shadow-2xl relative overflow-hidden group hover:border-[#7C3AED]/50 dark:hover:border-[#8B5CF6]/50 transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#4ADE80]/15 border border-emerald-200 dark:border-[#4ADE80]/30 text-[#16A34A] dark:text-[#4ADE80] text-xs font-mono font-semibold mb-4">
                  <Clock className="w-3.5 h-3.5" />
                  <span>TRANSIENT ROOM LIFECYCLES</span>
                </div>

                <h3 className="font-headline font-bold text-2xl sm:text-3xl text-[#12101F] dark:text-white tracking-tight">
                  Real humans present now. Gone when the music stops.
                </h3>

                <p className="mt-3 text-sm sm:text-base text-[#5E5873] dark:text-[#A19EB5] leading-relaxed max-w-2xl">
                  Rooms on NOCTURNE are living gatherings, not static zombie web pages. Listener presence is tracked honestly with active heartbeats. When everyone leaves, a 5-minute grace period allows seamless reconnection — after which the room gently closes, preserving bandwidth and privacy.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-[#6D28D9] dark:text-[#DDD6FE]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#7C3AED] dark:text-[#8B5CF6]" />
                    <span>Honest distinct presence counts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#F43F5E] dark:text-[#FF5C8A]" />
                    <span>Real-time emoji reaction bursts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
                    <span>5-min reconnection grace window</span>
                  </div>
                </div>
              </div>

              {/* Editorial Quote & Manifesto Card */}
              <div className="lg:col-span-5 rounded-2xl bg-[#F8F7FC] dark:bg-[#12101F] border border-[#EDEAF5] dark:border-[#2D2945] p-6 text-left">
                <span className="text-3xl font-serif text-[#7C3AED] dark:text-[#8B5CF6] leading-none">“</span>
                <p className="font-headline text-sm sm:text-base italic text-[#12101F]/90 dark:text-white/90 leading-relaxed -mt-2">
                  Like leaning over the counter at a late-night Tokyo listening bar, sharing headphones with strangers who speak the exact same musical dialect.
                </p>
                <div className="mt-4 pt-3 border-t border-[#EDEAF5] dark:border-[#2D2945] flex items-center justify-between text-xs text-[#5E5873] dark:text-[#A19EB5]">
                  <span className="font-semibold text-[#6D28D9] dark:text-[#DDD6FE]">NOCTURNE Philosophy</span>
                  <span>Pure Listening • ₹0 Infra Cost</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

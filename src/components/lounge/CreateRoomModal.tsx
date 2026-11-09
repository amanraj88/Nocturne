import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { X, Sparkles, Users, Lock, Radio, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

export const CreateRoomModal: React.FC = () => {
  const router = useRouter();
  const { isCreateRoomOpen, setIsCreateRoomOpen } = useLounge();
  const [title, setTitle] = useState('');
  const [vibe, setVibe] = useState('Deep IDM & Minimal Synth');
  const [mode, setMode] = useState<'collaborative' | 'host-curated'>('collaborative');
  const [isPrivate, setIsPrivate] = useState(false);

  const vibePresets = [
    'Deep IDM & Minimal Synth',
    'Midnight Lo-Fi & Tape Drones',
    'Neoclassical Glitch & Felted Piano',
    '4AM Warehouse Dub Techno',
    'Nordic Ambient Echoes',
  ];

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCreateRoomOpen(false);
    };
    if (isCreateRoomOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateRoomOpen, setIsCreateRoomOpen]);

  if (!isCreateRoomOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = (title.trim() || 'midnight-lounge')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    setIsCreateRoomOpen(false);
    router.push(`/room/${slug}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-lounge-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-950/85 backdrop-blur-md"
    >
      <div
        className="fixed inset-0"
        onClick={() => setIsCreateRoomOpen(false)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-lg rounded-2xl bg-midnight-950 border border-plum-700/80 shadow-2xl p-6 overflow-hidden"
      >
        <div className="flex items-center justify-between pb-3 border-b border-plum-800">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-lavender-400" />
            <h3 id="create-lounge-title" className="font-serif text-base font-bold tracking-wider text-zinc-100 uppercase">
              Curate a New Lounge
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateRoomOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-plum-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Lounge Name */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Lounge Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kyoto Sunset Reverie"
              className="w-full rounded-xl bg-plum-900/60 border border-plum-700/80 px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-lavender-400/80 focus:ring-1 focus:ring-lavender-400/30"
            />
          </div>

          {/* Vibe Selection */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Sonic Motif & Vibe
            </label>
            <div className="flex flex-wrap gap-1.5">
              {vibePresets.map((vp) => (
                <button
                  key={vp}
                  type="button"
                  onClick={() => setVibe(vp)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    vibe === vp
                      ? 'bg-lavender-500/20 text-lavender-300 border border-lavender-400/40 font-medium'
                      : 'bg-plum-900/40 text-zinc-400 border border-plum-800 hover:text-zinc-200 hover:border-plum-700'
                  }`}
                >
                  {vp}
                </button>
              ))}
            </div>
          </div>

          {/* Room Permissions */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Listening Dynamics
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('collaborative')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'collaborative'
                    ? 'bg-lavender-500/15 border-lavender-400/40 text-zinc-100'
                    : 'bg-plum-900/40 border-plum-800 text-zinc-400 hover:border-plum-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-lavender-300">
                  <Users className="w-3.5 h-3.5" />
                  <span>Democracy</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                  Anyone can queue, vote to skip, and trigger vibe bursts.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('host-curated')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'host-curated'
                    ? 'bg-lavender-500/15 border-lavender-400/40 text-zinc-100'
                    : 'bg-plum-900/40 border-plum-800 text-zinc-400 hover:border-plum-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-lavender-300">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Host Dictation</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                  Only the host controls play/pause and queue order.
                </p>
              </button>
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-plum-900/40 border border-plum-800">
            <div>
              <span className="text-xs font-medium text-zinc-200">Private Lounge</span>
              <p className="text-[10px] text-zinc-400">Only accessible with direct secret invite link</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                isPrivate ? 'bg-lavender-500' : 'bg-plum-700'
              }`}
              aria-label="Toggle private lounge"
            >
              <div
                className={`w-4 h-4 rounded-full bg-midnight-950 transition-transform ${
                  isPrivate ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateRoomOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-lavender-500 hover:bg-lavender-400 text-midnight-950 shadow-glow-lavender transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Open Lounge
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

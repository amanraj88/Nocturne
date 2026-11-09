import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { X, Users, Lock, Radio } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md"
    >
      <div
        className="fixed inset-0"
        onClick={() => setIsCreateRoomOpen(false)}
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-plum-surface border border-plum-subtle p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-plum-subtle">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-lavender" />
            <h3 id="create-lounge-title" className="font-serif text-base font-bold text-ivory">
              Curate a new lounge
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateRoomOpen(false)}
            className="p-1.5 rounded-lg text-warm-dim hover:text-ivory hover:bg-plum-subtle transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs text-warm-dim mb-1.5">
              Lounge title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kyoto Sunset Reverie"
              className="w-full rounded-xl bg-plum-base border border-plum-subtle px-3.5 py-2.5 text-xs text-ivory placeholder:text-warm-dim focus:outline-none focus:border-lavender"
            />
          </div>

          <div>
            <label className="block text-xs text-warm-dim mb-1.5">
              Sonic motif
            </label>
            <div className="flex flex-wrap gap-1.5">
              {vibePresets.map((vp) => (
                <button
                  key={vp}
                  type="button"
                  onClick={() => setVibe(vp)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    vibe === vp
                      ? 'bg-lavender-subtle text-lavender border border-lavender/40 font-medium'
                      : 'bg-plum-base text-warm-grey border border-plum-subtle hover:text-ivory'
                  }`}
                >
                  {vp}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-warm-dim mb-1.5">
              Listening dynamics
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('collaborative')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  mode === 'collaborative'
                    ? 'bg-lavender-subtle border-lavender/40 text-ivory'
                    : 'bg-plum-base border-plum-subtle text-warm-dim hover:border-plum-subtle/80'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-lavender whitespace-nowrap">
                  <Users className="w-3.5 h-3.5" />
                  <span>Democracy</span>
                </div>
                <p className="text-[11px] text-warm-dim mt-1 leading-tight">
                  Anyone can queue tracks.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('host-curated')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  mode === 'host-curated'
                    ? 'bg-lavender-subtle border-lavender/40 text-ivory'
                    : 'bg-plum-base border-plum-subtle text-warm-dim hover:border-plum-subtle/80'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-lavender whitespace-nowrap">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Host dictation</span>
                </div>
                <p className="text-[11px] text-warm-dim mt-1 leading-tight">
                  Only host controls transport.
                </p>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-plum-base border border-plum-subtle">
            <div>
              <span className="text-xs font-medium text-ivory">Private lounge</span>
              <p className="text-[11px] text-warm-dim">Only accessible with direct secret invite link</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                isPrivate ? 'bg-lavender' : 'bg-plum-subtle'
              }`}
              aria-label="Toggle private lounge"
            >
              <div
                className={`w-4 h-4 rounded-full bg-obsidian transition-transform ${
                  isPrivate ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateRoomOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-warm-dim hover:text-ivory transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-lavender hover:bg-lavender-400 text-obsidian shadow-glow-lavender transition-transform active:scale-[0.98]"
            >
              Open lounge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

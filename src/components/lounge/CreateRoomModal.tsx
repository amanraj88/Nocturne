import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { Radio, X, Users, Lock, Sparkles } from 'lucide-react';

export const CreateRoomModal: React.FC = () => {
  const router = useRouter();
  const { isCreateRoomOpen, setIsCreateRoomOpen, switchRoom } = useLounge();
  const [title, setTitle] = useState('');
  const [vibeTag, setVibeTag] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'collaborative' | 'host-curated'>('collaborative');
  const [isPrivate, setIsPrivate] = useState(false);

  if (!isCreateRoomOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const slug = title
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/85 backdrop-blur-md"
    >
      <div
        className="fixed inset-0"
        onClick={() => setIsCreateRoomOpen(false)}
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-carbon border border-graphite p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-graphite">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-mineral" />
            <h3 id="create-lounge-title" className="font-display text-base font-bold text-warm-bone">
              Curate a new lounge
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateRoomOpen(false)}
            className="p-1.5 rounded-lg text-ash hover:text-warm-bone hover:bg-graphite transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="lounge-title" className="block text-xs font-medium text-ash mb-1.5">
              Lounge Title
            </label>
            <input
              id="lounge-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kyoto Midnight Synthesizers"
              required
              className="w-full rounded-xl bg-deep-ink border border-graphite px-3.5 py-2.5 text-xs text-warm-bone placeholder:text-ash/60 focus:outline-none focus:border-mineral"
            />
          </div>

          <div>
            <label htmlFor="vibe-tag" className="block text-xs font-medium text-ash mb-1.5">
              Sonic Tag
            </label>
            <input
              id="vibe-tag"
              type="text"
              value={vibeTag}
              onChange={(e) => setVibeTag(e.target.value)}
              placeholder="e.g. Ambient Glitch & Modular"
              className="w-full rounded-xl bg-deep-ink border border-graphite px-3.5 py-2.5 text-xs text-warm-bone placeholder:text-ash/60 focus:outline-none focus:border-mineral"
            />
          </div>

          <div>
            <label htmlFor="lounge-desc" className="block text-xs font-medium text-ash mb-1.5">
              Lounge Atmosphere
            </label>
            <textarea
              id="lounge-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the sonic aesthetic and listening mood..."
              className="w-full rounded-xl bg-deep-ink border border-graphite px-3.5 py-2.5 text-xs text-warm-bone placeholder:text-ash/60 focus:outline-none focus:border-mineral resize-none"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-ash mb-1.5">
              Listening Dynamics
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('collaborative')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  mode === 'collaborative'
                    ? 'bg-deep-ink border-mineral text-warm-bone'
                    : 'bg-deep-ink/60 border-graphite text-ash hover:border-graphite'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-mineral">
                  <Users className="w-3.5 h-3.5" />
                  <span>Democracy</span>
                </div>
                <p className="text-[11px] text-ash mt-1 leading-tight">
                  Open community queue
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('host-curated')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  mode === 'host-curated'
                    ? 'bg-deep-ink border-mineral text-warm-bone'
                    : 'bg-deep-ink/60 border-graphite text-ash hover:border-graphite'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-mineral">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Host curation</span>
                </div>
                <p className="text-[11px] text-ash mt-1 leading-tight">
                  Host-managed queue
                </p>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-deep-ink border border-graphite">
            <div>
              <p className="text-xs font-medium text-warm-bone">Private Lounge</p>
              <p className="text-[11px] text-ash">Access strictly by direct link</p>
            </div>
            <input
              type="checkbox"
              id="is-private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 rounded bg-carbon border-graphite text-mineral accent-mineral"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateRoomOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-ash hover:text-warm-bone transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-mineral hover:bg-mineral/90 text-deep-ink text-xs font-semibold transition-transform active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Lounge</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

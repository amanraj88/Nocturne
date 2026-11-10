import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { Radio, X } from 'lucide-react';

export const CreateRoomModal: React.FC = () => {
  const router = useRouter();
  const { isCreateRoomOpen, setIsCreateRoomOpen, createRoom } = useLounge();
  const [title, setTitle] = useState('');
  const [vibeTag, setVibeTag] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const newRoom = await createRoom({ title, vibeTag, description, mode: 'collaborative' });
      setIsCreateRoomOpen(false);
      setTitle('');
      setVibeTag('');
      setDescription('');
      router.push(`/room/${newRoom.slug}`);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Could not create this room. Try again.');
    } finally {
      setCreating(false);
    }
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
        onClick={() => { if (!creating) setIsCreateRoomOpen(false); }}
      />

      <div className="relative z-10 w-full max-w-lg rounded-[4px] bg-carbon border border-graphite shadow-md overflow-hidden">
        {/* Editorial Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-graphite bg-deep-ink">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-mineral" />
            <h3 id="create-lounge-title" className="font-display text-sm font-bold tracking-tight text-warm-bone">
              Curate a new lounge
            </h3>
          </div>
          <button
            type="button"
            disabled={creating}
            onClick={() => setIsCreateRoomOpen(false)}
            className="p-1.5 rounded-[2px] text-ash hover:text-warm-bone hover:bg-carbon border border-transparent hover:border-graphite transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="lounge-title" className="block text-xs font-medium text-ash mb-1.5">
              Lounge Title
            </label>
            <input
              id="lounge-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={2}
              maxLength={60}
              placeholder="e.g. Kyoto Midnight Synthesizers"
              required
              className="w-full rounded-[2px] bg-deep-ink border border-graphite px-3 py-2 text-xs text-warm-bone placeholder:text-ash/50 focus:outline-none focus:border-mineral focus:ring-1 focus:ring-mineral font-sans transition-colors"
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
              maxLength={80}
              placeholder="e.g. Ambient Glitch & Modular"
              className="w-full rounded-[2px] bg-deep-ink border border-graphite px-3 py-2 text-xs text-warm-bone placeholder:text-ash/50 focus:outline-none focus:border-mineral focus:ring-1 focus:ring-mineral font-sans transition-colors"
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
              maxLength={500}
              placeholder="Describe the sonic aesthetic and listening mood..."
              className="w-full rounded-[2px] bg-deep-ink border border-graphite px-3 py-2 text-xs text-warm-bone placeholder:text-ash/50 focus:outline-none focus:border-mineral focus:ring-1 focus:ring-mineral font-sans resize-none transition-colors"
            />
          </div>

          <div className="p-3 rounded-[2px] bg-deep-ink border border-graphite">
            <p className="text-xs font-medium text-warm-bone">Collaborative room</p>
            <p className="text-[11px] text-ash mt-1">Anyone with the room link can join, add to the shared queue, and control playback. Sign-in and invite-only access are not available yet.</p>
          </div>

          {createError && <p role="alert" className="text-xs text-oxide" aria-live="polite">{createError}</p>}

          <div className="pt-3 border-t border-graphite flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={creating}
              onClick={() => setIsCreateRoomOpen(false)}
              className="px-4 py-2 rounded-[2px] text-xs font-medium text-ash hover:text-warm-bone hover:bg-deep-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-1.5 px-5 py-2 rounded-[2px] bg-mineral hover:bg-mineral/90 text-deep-ink text-xs font-semibold shadow-sm transition-transform active:scale-[0.98]"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{creating ? 'Opening…' : 'Open Lounge'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

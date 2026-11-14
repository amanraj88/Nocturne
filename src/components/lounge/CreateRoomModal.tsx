import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { Radio, X, Plus, Sparkles, Loader2 } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F0E17]/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!creating) setIsCreateRoomOpen(false);
        }}
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDEAF5] dark:border-[#2D2945] bg-[#F8F7FC] dark:bg-[#12101F]/80">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#F43F5E] flex items-center justify-center text-white shadow-md">
              <Radio className="w-4 h-4" />
            </span>
            <div>
              <h3 id="create-lounge-title" className="font-headline text-base font-bold text-[#12101F] dark:text-white tracking-tight">
                Create a Listening Room
              </h3>
              <p className="text-[11px] text-[#5E5873] dark:text-[#A19EB5]">Collaborative session with shared queue</p>
            </div>
          </div>
          <button
            type="button"
            disabled={creating}
            onClick={() => setIsCreateRoomOpen(false)}
            className="p-1.5 rounded-full text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white hover:bg-[#F3F0FA] dark:hover:bg-[#242138] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="lounge-title" className="block text-xs font-semibold text-[#7C3AED] dark:text-[#DDD6FE] mb-1.5">
              Room Title *
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
              className="w-full rounded-xl bg-white dark:bg-[#242138] border border-[#EDEAF5] dark:border-[#2D2945] px-3.5 py-2.5 text-xs sm:text-sm text-[#12101F] dark:text-white placeholder-[#8E88A8] dark:placeholder-[#6B6785] focus:outline-none focus:border-[#7C3AED] dark:focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#7C3AED] dark:focus:ring-[#8B5CF6] transition-colors shadow-xs"
            />
          </div>

          <div>
            <label htmlFor="vibe-tag" className="block text-xs font-semibold text-[#7C3AED] dark:text-[#DDD6FE] mb-1.5">
              Sonic Tag / Vibe
            </label>
            <input
              id="vibe-tag"
              type="text"
              value={vibeTag}
              onChange={(e) => setVibeTag(e.target.value)}
              maxLength={80}
              placeholder="e.g. Ambient Glitch &amp; Modular"
              className="w-full rounded-xl bg-white dark:bg-[#242138] border border-[#EDEAF5] dark:border-[#2D2945] px-3.5 py-2.5 text-xs sm:text-sm text-[#12101F] dark:text-white placeholder-[#8E88A8] dark:placeholder-[#6B6785] focus:outline-none focus:border-[#7C3AED] dark:focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#7C3AED] dark:focus:ring-[#8B5CF6] transition-colors shadow-xs"
            />
          </div>

          <div>
            <label htmlFor="lounge-desc" className="block text-xs font-semibold text-[#7C3AED] dark:text-[#DDD6FE] mb-1.5">
              Room Description
            </label>
            <textarea
              id="lounge-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder="Tell listeners what music or experience to expect in this space..."
              className="w-full rounded-xl bg-white dark:bg-[#242138] border border-[#EDEAF5] dark:border-[#2D2945] px-3.5 py-2.5 text-xs sm:text-sm text-[#12101F] dark:text-white placeholder-[#8E88A8] dark:placeholder-[#6B6785] focus:outline-none focus:border-[#7C3AED] dark:focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#7C3AED] dark:focus:ring-[#8B5CF6] transition-colors resize-none shadow-xs"
            />
          </div>

          {createError && (
            <div className="p-3 rounded-xl bg-[#F43F5E]/15 border border-[#F43F5E]/40 text-[#F43F5E] text-xs">
              {createError}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={creating}
              onClick={() => setIsCreateRoomOpen(false)}
              className="px-4 py-2 rounded-full border border-[#EDEAF5] dark:border-[#2D2945] text-xs font-medium text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white hover:bg-[#F3F0FA] dark:hover:bg-[#242138] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F43F5E] hover:bg-[#e11d48] dark:bg-[#FF5C8A] dark:hover:bg-[#ff477b] text-white text-xs font-semibold shadow-lg shadow-pink-500/25 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {creating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating…</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Create Room</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

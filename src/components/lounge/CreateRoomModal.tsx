import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLounge } from '@/context/LoungeContext';
import { Disc, X, Plus, Loader2 } from 'lucide-react';

const PRESET_TITLES = [
  'Midnight Frequencies',
  'After Hours Vinyl',
  'Late Night Coding',
];

const MOOD_OPTIONS = ['Late Night', 'Deep Focus', 'Electronic', 'Ambient'] as const;

export const CreateRoomModal: React.FC = () => {
  const router = useRouter();
  const { isCreateRoomOpen, setIsCreateRoomOpen, createRoom, addTrackToQueue } = useLounge();
  const [title, setTitle] = useState('');
  const [selectedMood, setSelectedMood] = useState<typeof MOOD_OPTIONS[number]>('Late Night');
  const [starterYoutubeUrl, setStarterYoutubeUrl] = useState('');
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
      const artworkId =
        selectedMood === 'Electronic' ? 'noc-03' : selectedMood === 'Late Night' ? 'noc-01' : 'noc-02';

      const newRoom = await createRoom({
        title: title.trim(),
        vibeTag: selectedMood,
        mode: 'collaborative',
        artworkId,
      });

      // If optional starter YouTube URL was provided, enqueue it immediately
      if (starterYoutubeUrl.trim()) {
        const url = starterYoutubeUrl.trim();
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        const videoId = match && match[2].length === 11 ? match[2] : null;

        if (videoId) {
          await addTrackToQueue({
            title: title.trim() + ' — Opening Track',
            artist: 'YouTube',
            youtubeId: videoId,
            durationSeconds: 180,
            albumArt: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            artworkId,
            sourceType: 'youtube',
          });
        }
      }

      setIsCreateRoomOpen(false);
      setTitle('');
      setStarterYoutubeUrl('');
      void router.push(`/room/${newRoom.slug}`);
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
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!creating) setIsCreateRoomOpen(false);
        }}
      />

      <div className="relative z-10 w-full max-w-[460px] rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-[var(--bg-recessed)] border border-[var(--border-subtle)] flex items-center justify-center text-[#8B5CF6] shrink-0">
              <Disc className="w-[18px] h-[18px]" />
            </span>
            <div>
              <h3 id="create-lounge-title" className="font-syne text-base font-bold text-[var(--text-primary)] tracking-tight">
                Start a Listening Room
              </h3>
              <p className="text-xs text-[var(--text-muted)]">Synced playback · Shared FIFO queue</p>
            </div>
          </div>
          <button
            type="button"
            disabled={creating}
            onClick={() => setIsCreateRoomOpen(false)}
            className="w-8 h-8 rounded-lg bg-[var(--bg-recessed)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {/* Field 1: Room Title */}
            <div>
              <label htmlFor="room-title-input" className="text-xs font-medium text-[var(--text-primary)] mb-1.5 block">
                Room Title *
              </label>
              <input
                id="room-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                minLength={2}
                maxLength={60}
                placeholder="e.g. Midnight Frequencies"
                required
                className="w-full h-10 px-3.5 rounded-lg bg-[var(--bg-recessed)] border border-[var(--border-subtle)] focus:border-[#8B5CF6]/60 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-colors"
              />
              {/* Quick-fill preset chips */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESET_TITLES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTitle(preset)}
                    className="px-2 py-0.5 rounded-md bg-[var(--bg-recessed)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 2: Select Mood (Interactive 4-Chip Selector) */}
            <div>
              <label className="text-xs font-medium text-[var(--text-primary)] mb-1.5 block">
                Room Mood
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MOOD_OPTIONS.map((mood) => {
                  const isActive = selectedMood === mood;
                  return (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setSelectedMood(mood)}
                      className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors text-center truncate ${
                        isActive
                          ? 'bg-[var(--bg-thumb)] border border-[#8B5CF6]/50 text-[var(--text-primary)]'
                          : 'bg-[var(--bg-recessed)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {mood}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field 3: Optional Starter YouTube URL */}
            <div>
              <label htmlFor="starter-youtube-url" className="text-xs font-medium text-[var(--text-primary)] mb-1.5 block">
                Starter YouTube URL (optional)
              </label>
              <input
                id="starter-youtube-url"
                type="url"
                value={starterYoutubeUrl}
                onChange={(e) => setStarterYoutubeUrl(e.target.value)}
                placeholder="Paste a YouTube link to play first..."
                className="w-full h-10 px-3.5 rounded-lg bg-[var(--bg-recessed)] border border-[var(--border-subtle)] focus:border-[#8B5CF6]/60 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-colors"
              />
            </div>

            {createError && (
              <div className="p-3 rounded-lg bg-[#F43F5E]/15 border border-[#F43F5E]/40 text-[#F43F5E] text-xs">
                {createError}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-recessed)]/40 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={creating}
              onClick={() => setIsCreateRoomOpen(false)}
              className="h-9 px-4 rounded-lg bg-[var(--bg-recessed)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="h-9 px-4 rounded-lg bg-[#F43F5E] hover:bg-[#E11D48] disabled:opacity-40 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-none"
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

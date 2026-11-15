import React, { useState, useRef, useEffect } from 'react';
import { useLounge } from '@/context/LoungeContext';
import {
  Send,
  Smile,
  Music,
  MessageSquare,
} from 'lucide-react';

const getUserAvatarColor = (name: string): string => {
  const gradients = [
    'from-[#8B5CF6] to-[#7C3AED]',
    'from-[#EC4899] to-[#FF5C8A]',
    'from-[#06B6D4] to-[#38BDF8]',
    'from-[#10B981] to-[#34D399]',
    'from-[#F59E0B] to-[#FBBF24]',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export const SocialDock: React.FC = () => {
  const {
    currentRoom,
    chatMessages,
    sendChatMessage,
    clientName,
    setClientName,
  } = useLounge();

  const [chatInput, setChatInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    sendChatMessage(text);
    setChatInput('');
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editNameInput.trim();
    if (trimmed) {
      setClientName(trimmed);
      setIsEditingName(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--bg-panel)] overflow-hidden">
      {/* ================================================================== */}
      {/* 1. SCROLLABLE MESSAGE STREAM (Borderless participant rows)          */}
      {/* ================================================================== */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 custom-scrollbar">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-10 px-4 text-center">
            <MessageSquare className="w-8 h-8 text-[var(--text-muted)]/50 mx-auto mb-2" />
            <p className="text-xs font-semibold text-[var(--text-primary)]">Room chat is live</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-[200px]">
              Say hi or drop a reaction to the current soundscape.
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const userName = msg.user?.name || (msg as any).userName || 'Listener';
            const isHost = (msg.user?.role || (msg as any).userRole) === 'host' || msg.user?.id === currentRoom.host?.id;
            const isSystemMessage = msg.isSystem || msg.text.startsWith('🎵') || msg.text.includes('added') || msg.text.includes('felt:') || msg.text.startsWith('Queued YouTube stream');

            // Understated Inline System / Queue Activity Row
            if (isSystemMessage) {
              const cleanText = msg.text.replace(/^🎵\s*/, '');
              return (
                <div key={msg.id} className="flex justify-center my-1.5">
                  <div className="px-2.5 py-1 rounded-md bg-[var(--bg-recessed)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 max-w-fit shadow-xs font-mono">
                    <Music className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
                    <span className="truncate">{cleanText}</span>
                  </div>
                </div>
              );
            }

            // Standard Participant Message: Clean borderless layout
            const avatarGrad = getUserAvatarColor(userName);
            const initial = userName.trim().charAt(0).toUpperCase() || 'L';

            return (
              <div key={msg.id} className="flex items-start gap-2.5 group">
                {/* 24x24 Avatar Circle */}
                <div
                  className={`w-6 h-6 rounded-full bg-gradient-to-tr ${avatarGrad} flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-semibold font-mono shadow-sm`}
                >
                  {initial}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {userName}
                    </span>

                    {/* Amber HOST Badge */}
                    {isHost && (
                      <span className="rounded-md px-1.5 py-0.5 text-[9px] bg-amber-500/15 text-amber-400 font-mono font-semibold tracking-wide">
                        HOST
                      </span>
                    )}

                    {/* Tabular Right Timestamp */}
                    <span className="text-[10px] font-mono text-[var(--text-muted)] ml-auto shrink-0 tabular-nums">
                      {msg.timestamp || 'now'}
                    </span>
                  </div>

                  {/* Clean Borderless Message Body */}
                  <p className="text-[13px] leading-relaxed text-[var(--text-primary)]/90 break-words mt-1">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ================================================================== */}
      {/* 2. PINNED BOTTOM CHAT COMPOSER                                     */}
      {/* ================================================================== */}
      <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] shrink-0">
        {/* Identity Helper Line with Inline Rename */}
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-1.5 w-full">
              <span className="shrink-0">Chat as:</span>
              <input
                type="text"
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                maxLength={24}
                className="flex-1 bg-[var(--bg-recessed)] border border-[var(--border-subtle)] px-2 py-0.5 rounded text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
                autoFocus
              />
              <button
                type="submit"
                className="text-xs text-[#8B5CF6] font-semibold hover:underline shrink-0"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
              >
                Cancel
              </button>
            </form>
          ) : (
            <>
              <span className="truncate">
                Chatting as{' '}
                <strong className="font-mono font-medium text-[var(--text-primary)]">
                  {clientName}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditNameInput(clientName);
                  setIsEditingName(true);
                }}
                className="text-[#8B5CF6] hover:underline font-medium ml-2 shrink-0"
              >
                Change
              </button>
            </>
          )}
        </div>

        {/* Recessed Message Input Capsule */}
        <form onSubmit={handleSend} className="w-full">
          <div className="h-10 rounded-lg bg-[var(--bg-recessed)] border border-[var(--border-subtle)] focus-within:border-[#8B5CF6]/50 px-3 flex items-center gap-2 transition-colors shadow-inner">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Message room..."
              className="flex-1 bg-transparent border-none p-0 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-0 focus:outline-none min-w-0"
            />
            <button
              type="button"
              onClick={() => setChatInput((prev) => prev + ' ✨')}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-0.5 shrink-0"
              title="Add sparkle"
            >
              <Smile className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="w-7 h-7 rounded-md bg-[#F43F5E] hover:bg-[#E11D48] text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors shadow-none active:translate-y-px"
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

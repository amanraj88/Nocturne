import React, { useState } from 'react';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { Users, MessageSquare, Crown, Send } from 'lucide-react';

export const SocialDock: React.FC = () => {
  const { members, chatMessages, sendChatMessage } = useLounge();
  const [activeTab, setActiveTab] = useState<'listeners' | 'chat'>('listeners');
  const [chatInput, setChatInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  return (
    <div className="flex flex-col h-full bg-carbon/40 border-l border-graphite">
      {/* Tab Switcher */}
      <div className="flex items-center border-b border-graphite p-2.5 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('listeners')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'listeners'
              ? 'bg-deep-ink text-warm-bone border border-graphite'
              : 'text-ash hover:text-warm-bone'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-mineral" />
          <span>People</span>
          <span className="rounded bg-carbon px-1.5 py-0.2 text-[10px] text-ash font-mono border border-graphite/60">
            {members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'chat'
              ? 'bg-deep-ink text-warm-bone border border-graphite'
              : 'text-ash hover:text-warm-bone'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-mineral" />
          <span>Chat</span>
          <span className="rounded bg-carbon px-1.5 py-0.2 text-[10px] text-ash font-mono border border-graphite/60">
            {chatMessages.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'listeners' ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-ash mb-3 flex items-center justify-between">
              <span>Present in lounge</span>
              <span className="font-sans text-[11px] font-medium text-mineral">Live</span>
            </div>
            {members.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-carbon/60 transition-colors border border-transparent hover:border-graphite/40"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-graphite">
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-warm-bone">
                        {user.name}
                      </span>
                      {user.role === 'host' && (
                        <Crown className="w-3 h-3 text-mineral" />
                      )}
                    </div>
                    <span className="text-[11px] text-ash capitalize">
                      {user.role} · Joined {user.joinedAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-deep-ink px-2 py-0.5 rounded-full border border-graphite text-[11px] font-sans font-medium text-mineral">
                  <span className="w-1.5 h-1.5 rounded-full bg-mineral animate-pulse" />
                  <span>Sync</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-full justify-between">
            {/* Messages Stream */}
            <div className="space-y-2.5 overflow-y-auto pr-1">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-xl bg-deep-ink/60 p-3 border border-graphite/60 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-mineral">
                      {msg.user.name}
                    </span>
                    <span className="text-[10px] text-ash font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-warm-bone/90 leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="mt-3 flex items-center gap-2 pt-2 border-t border-graphite">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Share a note with the room..."
                className="flex-1 rounded-lg bg-deep-ink border border-graphite px-3 py-2 text-xs text-warm-bone placeholder:text-ash/60 focus:outline-none focus:border-mineral"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-mineral hover:bg-mineral/90 text-deep-ink transition-transform active:scale-95"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

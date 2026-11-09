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
    <div className="flex flex-col h-full bg-plum-base/40 border-l border-plum-subtle">
      {/* Tab Switcher */}
      <div className="flex items-center border-b border-plum-subtle p-2 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('listeners')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'listeners'
              ? 'bg-plum-surface text-ivory border border-plum-subtle'
              : 'text-warm-dim hover:text-warm-grey'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>People</span>
          <span className="rounded-full bg-plum-subtle px-1.5 py-0.2 text-[10px] text-warm-grey font-mono">
            {members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'chat'
              ? 'bg-plum-surface text-ivory border border-plum-subtle'
              : 'text-warm-dim hover:text-warm-grey'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
          <span className="rounded-full bg-plum-subtle px-1.5 py-0.2 text-[10px] text-warm-grey font-mono">
            {chatMessages.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'listeners' ? (
          <div className="space-y-2.5">
            <div className="text-xs text-warm-dim mb-2">
              In this lounge
            </div>
            {members.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-xl bg-plum-surface/40 p-2.5 border border-plum-subtle/50"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-plum-subtle">
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-ivory">
                        {user.name}
                      </span>
                      {user.role === 'host' && (
                        <Crown className="w-3 h-3 text-lavender" />
                      )}
                    </div>
                    <span className="text-[11px] text-warm-dim capitalize">
                      {user.role} · Joined {user.joinedAt}
                    </span>
                  </div>
                </div>

                <span className="text-xs text-green bg-green/10 px-2 py-0.5 rounded-full border border-green/20">
                  Listening
                </span>
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
                  className="rounded-xl bg-plum-surface/50 p-3 border border-plum-subtle/60 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-lavender">
                      {msg.user.name}
                    </span>
                    <span className="text-[10px] text-warm-dim font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-warm-grey leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="mt-3 flex items-center gap-2 pt-2 border-t border-plum-subtle">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Share a note with the room..."
                className="flex-1 rounded-lg bg-plum-surface border border-plum-subtle px-3 py-2 text-xs text-ivory placeholder:text-warm-dim focus:outline-none focus:border-lavender"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-lavender hover:bg-lavender-400 text-obsidian transition-transform active:scale-95"
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

import React, { useState } from 'react';
import Image from 'next/image';
import { useLounge } from '@/context/LoungeContext';
import { Users, MessageSquare, Crown, Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="flex flex-col h-full bg-plum-900/30 border-l border-plum-700/50 backdrop-blur-md">
      {/* Tab Switcher */}
      <div className="flex items-center border-b border-plum-700/50 p-2 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('listeners')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'listeners'
              ? 'bg-plum-800 text-zinc-100 shadow-sm border border-plum-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>People</span>
          <span className="rounded-full bg-plum-700 px-1.5 py-0.2 text-[10px] font-mono text-zinc-300">
            {members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-plum-800 text-zinc-100 shadow-sm border border-plum-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
          <span className="rounded-full bg-plum-700 px-1.5 py-0.2 text-[10px] font-mono text-zinc-300">
            {chatMessages.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'listeners' ? (
          <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
              Currently in the room
            </div>
            {members.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-xl bg-plum-900/30 p-2.5 border border-plum-700/30 hover:border-plum-600/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-lavender-400/30">
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      fill
                      className="object-cover"
                    />
                    {user.isListening && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-lime-400 border border-midnight-950" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-zinc-200">
                        {user.name}
                      </span>
                      {user.role === 'host' && (
                        <Crown className="w-3 h-3 text-lavender-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono capitalize">
                      {user.role} • Joined {user.joinedAt}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-lime-400/80 bg-lime-500/10 px-2 py-0.5 rounded-full border border-lime-400/20">
                  Listening
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-full justify-between">
            {/* Messages Stream */}
            <div className="space-y-3 overflow-y-auto pr-1">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-xl bg-plum-900/40 p-2.5 border border-plum-700/40 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-lavender-300">
                      {msg.user.name}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="mt-3 flex items-center gap-2 pt-2 border-t border-plum-700/50">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Drop a note into the lounge..."
                className="flex-1 rounded-lg bg-plum-800/80 border border-plum-700/60 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-lavender-400/60"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-lavender-500 hover:bg-lavender-400 text-midnight-950 transition-transform active:scale-95"
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

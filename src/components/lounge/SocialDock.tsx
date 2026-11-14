import React, { useState, useRef, useEffect } from 'react';
import { useLounge } from '@/context/LoungeContext';
import {
  Users,
  MessageSquare,
  Crown,
  Send,
  Smile,
  Sparkles,
  Flame,
  Moon,
  Activity,
  Heart,
} from 'lucide-react';

const getUserColor = (name: string): string => {
  const colors = [
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
  return colors[Math.abs(hash) % colors.length];
};

export const SocialDock: React.FC = () => {
  const { currentRoom, members, chatMessages, sendChatMessage } = useLounge();
  const [activeTab, setActiveTab] = useState<'chat' | 'people'>('chat');
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const handleReaction = (reaction: string) => {
    sendChatMessage(`felt: ${reaction}`);
  };

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-[#1A1829] border border-[#EDEAF5] dark:border-[#2D2945] rounded-xl shadow-sm dark:shadow-xl overflow-hidden transition-colors">
      {/* Header Tabs (Stitch Direction B v3) */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#EDEAF5] dark:border-[#2D2945] bg-white dark:bg-[#1A1829]">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`text-sm font-semibold pb-1.5 transition-colors flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'text-[#F43F5E] dark:text-white border-b-2 border-[#F43F5E] dark:border-[#FF5C8A]'
                : 'text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white'
            }`}
          >
            <span>Chat</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F3F0FA] dark:bg-[#242138] text-[#F43F5E] dark:text-[#DDD6FE] font-mono">
              {chatMessages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('people')}
            className={`text-sm font-medium pb-1.5 transition-colors flex items-center gap-1.5 ${
              activeTab === 'people'
                ? 'text-[#F43F5E] dark:text-white border-b-2 border-[#F43F5E] dark:border-[#FF5C8A]'
                : 'text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white'
            }`}
          >
            <span>People</span>
            <span className="text-xs text-[#8E88A8] dark:text-[#6B6785] font-mono">({members.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#10B981] dark:text-[#4ADE80]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] dark:bg-[#4ADE80] animate-pulse" />
          <span className="text-[11px] font-medium hidden sm:inline">Live Room</span>
        </div>
      </div>

      {/* Tab 1: Live Chat Feed */}
      {activeTab === 'chat' ? (
        <div className="flex flex-col h-full justify-between overflow-hidden">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
            {chatMessages.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <MessageSquare className="w-8 h-8 text-[#7C3AED]/40 dark:text-[#8B5CF6]/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#12101F] dark:text-white">No messages yet</p>
                <p className="text-xs text-[#5E5873] dark:text-[#A19EB5] mt-1">
                  Say hi or share what you think of this track!
                </p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const userName = msg.user?.name || (msg as any).userName || 'Listener';
                const isHost = (msg.user?.role || (msg as any).userRole) === 'host';
                const avatarGradient = getUserColor(userName);

                return (
                  <div key={msg.id} className="flex items-start gap-2.5">
                    {/* Persistent Color Initials Avatar */}
                    <div
                      className={`w-7 h-7 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-white text-[11px] font-bold`}
                    >
                      {userName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-semibold text-[#12101F] dark:text-white text-xs">{userName}</span>

                        {/* Host Badge */}
                        {isHost && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#FBBF24]/20 border border-[#FBBF24]/40 text-[#D97706] dark:text-[#FBBF24] text-[10px] font-bold tracking-wide">
                            <Crown className="w-3 h-3 text-[#D97706] dark:text-[#FBBF24] fill-current" />
                            <span>HOST</span>
                          </span>
                        )}

                        <span className="text-[10px] text-[#8E88A8] dark:text-[#6B6785] font-mono">{msg.timestamp}</span>
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`mt-1 px-3 py-2 rounded-xl text-xs leading-relaxed inline-block max-w-[95%] break-words ${
                          isHost
                            ? 'bg-[#FBBF24]/15 border border-[#FBBF24]/30 text-[#12101F] dark:text-white'
                            : msg.isSystem
                            ? 'bg-[#F3F0FA] dark:bg-[#242138]/60 text-[#5E5873] dark:text-[#A19EB5] border border-[#EDEAF5] dark:border-[#2D2945] italic'
                            : 'bg-[#F3F0FA] dark:bg-[#242138] text-[#12101F] dark:text-[#DDD6FE]'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reaction Pills */}
          <div className="px-3 py-2 border-t border-[#EDEAF5] dark:border-[#2D2945] flex items-center gap-1.5 overflow-x-auto custom-scrollbar bg-[#F8F7FC] dark:bg-[#12101F]/60">
            <button
              type="button"
              onClick={() => handleReaction('Late night')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-[#242138] hover:bg-[#F3F0FA] dark:hover:bg-[#2D2945] text-xs text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white border border-[#EDEAF5] dark:border-transparent flex items-center gap-1 whitespace-nowrap transition-colors shadow-xs"
            >
              <Moon className="w-3 h-3 text-[#7C3AED] dark:text-[#8B5CF6]" />
              <span>Late night</span>
            </button>
            <button
              type="button"
              onClick={() => handleReaction('Deep focus')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-[#242138] hover:bg-[#F3F0FA] dark:hover:bg-[#2D2945] text-xs text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white border border-[#EDEAF5] dark:border-transparent flex items-center gap-1 whitespace-nowrap transition-colors shadow-xs"
            >
              <Activity className="w-3 h-3 text-[#0284C7] dark:text-[#38BDF8]" />
              <span>Deep focus</span>
            </button>
            <button
              type="button"
              onClick={() => handleReaction('Warmth')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-[#242138] hover:bg-[#F3F0FA] dark:hover:bg-[#2D2945] text-xs text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white border border-[#EDEAF5] dark:border-transparent flex items-center gap-1 whitespace-nowrap transition-colors shadow-xs"
            >
              <Flame className="w-3 h-3 text-[#F43F5E] dark:text-[#FF5C8A]" />
              <span>Warmth</span>
            </button>
            <button
              type="button"
              onClick={() => handleReaction('Vibe')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-[#242138] hover:bg-[#F3F0FA] dark:hover:bg-[#2D2945] text-xs text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white border border-[#EDEAF5] dark:border-transparent flex items-center gap-1 whitespace-nowrap transition-colors shadow-xs"
            >
              <Sparkles className="w-3 h-3 text-[#FBBF24]" />
              <span>Vibe</span>
            </button>
          </div>

          {/* Bottom Chat Input Form (Stitch Direction B v3) */}
          <div className="p-3 border-t border-[#EDEAF5] dark:border-[#2D2945] bg-white dark:bg-[#1A1829]">
            <form onSubmit={handleSend} className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Message in ${currentRoom.title}...`}
                  className="w-full pl-3.5 pr-8 py-2 rounded-full bg-[#F8F7FC] dark:bg-[#242138] border border-[#EDEAF5] dark:border-[#2D2945] focus:border-[#7C3AED] dark:focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#7C3AED] dark:focus:ring-[#8B5CF6] text-xs text-[#12101F] dark:text-white placeholder-[#8E88A8] dark:placeholder-[#6B6785] transition-colors outline-none shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setChatInput((prev) => prev + ' ✨')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5E5873] dark:text-[#A19EB5] hover:text-[#12101F] dark:hover:text-white"
                  title="Add sparkle"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>

              {/* Coral Send Button */}
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="w-8 h-8 rounded-full bg-[#F43F5E] hover:bg-[#e11d48] dark:bg-[#FF5C8A] dark:hover:bg-[#ff477b] disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-md shadow-pink-500/25 transition-transform active:scale-95"
                title="Send Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Tab 2: Real Active Participants / Listeners */
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          <div className="text-xs font-semibold text-[#5E5873] dark:text-[#A19EB5] mb-3 flex items-center justify-between">
            <span>Listeners in this lounge</span>
            <span className="text-[11px] text-[#16A34A] dark:text-[#4ADE80] font-mono">
              {members.length} active
            </span>
          </div>

          {members.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#5E5873] dark:text-[#A19EB5]">
              No other listeners are currently in this room.
            </p>
          ) : (
            members.map((user) => {
              const avatarGradient = getUserColor(user.name);
              const isHost = user.role === 'host';

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F3F0FA] dark:hover:bg-[#242138]/60 transition-colors border border-transparent hover:border-[#EDEAF5] dark:hover:border-[#2D2945]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#12101F] dark:text-white truncate">
                          {user.name}
                        </span>
                        {isHost && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-[#FBBF24]/20 text-[#D97706] dark:text-[#FBBF24] text-[9px] font-bold">
                            <Crown className="w-2.5 h-2.5 fill-current" />
                            <span>HOST</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#5E5873] dark:text-[#A19EB5] mt-0.5">
                        Joined {user.joinedAt || 'just now'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-[#16A34A] dark:text-[#4ADE80]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] dark:bg-[#4ADE80] animate-pulse" />
                    <span>Listening</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

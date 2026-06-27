import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { socketService } from '../../services/socketService';
import { QUICK_CHAT_MESSAGES } from '../../utils/constants';

interface ChatPanelProps {
  roomId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ roomId }) => {
  const { chatMessages, playerInfo } = useGameStore();
  const [message, setMessage] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    socketService.sendMessage({ message: message.trim(), roomId });
    setMessage('');
  };

  const handleQuickMessage = (msg: string) => {
    socketService.sendMessage({ message: msg, roomId });
    setShowQuick(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="glass-subtle flex flex-col h-80 lg:h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/5 shrink-0">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Chat
        </h3>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        <AnimatePresence initial={false}>
          {chatMessages.map((msg) => {
            const isSelf = msg.playerId === playerInfo?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${isSelf ? 'flex-row-reverse' : ''}`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                  {msg.playerName.charAt(0).toUpperCase()}
                </div>
                <div
                  className={`max-w-[75%] ${
                    isSelf ? 'text-right' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`text-[10px] font-semibold ${
                        isSelf ? 'text-purple-300' : 'text-slate-300'
                      }`}
                    >
                      {msg.playerName}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`inline-block px-2.5 py-1.5 rounded-xl text-xs ${
                      msg.isSystem
                        ? 'bg-white/5 text-slate-400 italic'
                        : isSelf
                        ? 'bg-purple-600/30 text-purple-100'
                        : 'bg-white/5 text-slate-200'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Quick Messages */}
      <AnimatePresence>
        {showQuick && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-2 flex flex-wrap gap-1">
              {QUICK_CHAT_MESSAGES.map((msg) => (
                <button
                  key={msg}
                  onClick={() => handleQuickMessage(msg)}
                  className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-slate-300
                             hover:bg-purple-500/20 hover:text-purple-200 transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-2 border-t border-white/5 shrink-0">
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowQuick(!showQuick)}
            className={`px-2 rounded-lg text-sm transition-colors ${
              showQuick
                ? 'bg-purple-500/20 text-purple-300'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            ⚡
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={200}
            className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white
                       placeholder:text-slate-500 focus:outline-none focus:border-purple-500/30 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300
                       rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

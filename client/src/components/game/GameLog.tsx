import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameLogEntry, LogType } from '../../types';
import { LOG_TYPE_COLORS } from '../../utils/constants';

interface GameLogProps {
  entries: GameLogEntry[];
  collapsed?: boolean;
  onToggle?: () => void;
}

const logIcons: Record<LogType, string> = {
  [LogType.Action]: '⚡',
  [LogType.Challenge]: '❓',
  [LogType.Block]: '🛡️',
  [LogType.Reveal]: '👁️',
  [LogType.Elimination]: '💀',
  [LogType.CoinChange]: '💰',
  [LogType.System]: '⚙️',
  [LogType.GameOver]: '🏆',
};

export const GameLog: React.FC<GameLogProps> = ({
  entries,
  collapsed = false,
  onToggle,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div className="glass-subtle h-full flex flex-col overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between px-3 py-2 border-b border-white/5 shrink-0"
      >
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Game Log
        </h3>
        <span className="text-slate-500 text-xs">
          {collapsed ? '◀' : '▼'}
        </span>
      </button>

      {!collapsed && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-2 space-y-1"
        >
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-1.5 py-1 px-1.5 rounded text-xs hover:bg-white/5 transition-colors"
              >
                <span className="shrink-0 mt-0.5">
                  {logIcons[entry.type]}
                </span>
                <p
                  className="leading-relaxed"
                  style={{ color: LOG_TYPE_COLORS[entry.type] || '#94a3b8' }}
                >
                  {entry.message}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>

          {entries.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-4">
              Game events will appear here...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

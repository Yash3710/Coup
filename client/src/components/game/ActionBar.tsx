import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Action,
  ACTION_DEFINITIONS,
  GameStateView,
  GamePhase,
  PlayerView,
} from '../../types';
import { socketService } from '../../services/socketService';
import { soundManager } from '../../utils/sounds';
import { ACTION_ICONS } from '../../utils/constants';
import { Tooltip } from '../ui/Tooltip';

interface ActionBarProps {
  gameState: GameStateView;
}

export const ActionBar: React.FC<ActionBarProps> = ({ gameState }) => {
  const [targetMode, setTargetMode] = useState<Action | null>(null);

  const myPlayer = gameState.players.find(
    (p) => p.id === gameState.myPlayerId
  );
  const isMyTurn =
    gameState.players[gameState.currentPlayerIndex]?.id ===
    gameState.myPlayerId;
  const isActionPhase = gameState.phase === GamePhase.ActionPhase;

  if (!myPlayer || !myPlayer.alive || !isMyTurn || !isActionPhase) {
    return null;
  }

  const mustCoup = myPlayer.coins >= 10;

  const getDisabledReason = (action: Action): string | null => {
    const def = ACTION_DEFINITIONS[action];
    if (mustCoup && action !== Action.Coup) {
      return '10+ coins: must Coup';
    }
    if (def.cost > myPlayer.coins) {
      return `Need ${def.cost} coins (have ${myPlayer.coins})`;
    }
    if (
      def.requiresTarget &&
      gameState.players.filter((p) => p.alive && p.id !== myPlayer.id)
        .length === 0
    ) {
      return 'No valid targets';
    }
    return null;
  };

  const handleAction = (action: Action) => {
    const def = ACTION_DEFINITIONS[action];
    if (def.requiresTarget) {
      setTargetMode(action);
      return;
    }
    soundManager.click();
    socketService.performAction({ action });
  };

  const handleSelectTarget = (targetId: string) => {
    if (!targetMode) return;
    soundManager.click();
    socketService.performAction({ action: targetMode, targetId });
    setTargetMode(null);
  };

  const targets = gameState.players.filter(
    (p) => p.alive && p.id !== gameState.myPlayerId
  );

  const actions = Object.values(Action);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {targetMode ? (
          <motion.div
            key="target-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-300">
                Select target for{' '}
                <span className="text-purple-300 font-semibold">
                  {ACTION_DEFINITIONS[targetMode].label}
                </span>
              </p>
              <button
                onClick={() => setTargetMode(null)}
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                ✕ Cancel
              </button>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {targets.map((p) => (
                <TargetButton
                  key={p.id}
                  player={p}
                  onClick={() => handleSelectTarget(p.id)}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="action-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass p-3 md:p-4"
          >
            <p className="text-xs text-slate-400 mb-3 text-center">
              Your Turn — Choose an Action
            </p>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {actions.map((action) => {
                const def = ACTION_DEFINITIONS[action];
                const disabledReason = getDisabledReason(action);
                const disabled = !!disabledReason;

                return (
                  <Tooltip
                    key={action}
                    content={disabledReason || def.description}
                    position="top"
                  >
                    <motion.button
                      whileHover={disabled ? {} : { scale: 1.08, y: -2 }}
                      whileTap={disabled ? {} : { scale: 0.95 }}
                      onClick={() => !disabled && handleAction(action)}
                      disabled={disabled}
                      className={`relative flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl
                                  transition-all border w-full
                                  ${
                                    disabled
                                      ? 'opacity-40 cursor-not-allowed border-white/5 bg-white/[0.02]'
                                      : 'cursor-pointer border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/30'
                                  }`}
                    >
                      <span className="text-xl md:text-2xl">
                        {ACTION_ICONS[action]}
                      </span>
                      <span className="text-[10px] md:text-xs font-medium text-white/80">
                        {def.label}
                      </span>
                      {def.cost > 0 && (
                        <span
                          className={`absolute -top-1 -right-1 text-[10px] font-bold rounded-full w-5 h-5
                                      flex items-center justify-center
                                      ${
                                        disabled
                                          ? 'bg-slate-700 text-slate-400'
                                          : 'bg-yellow-500/80 text-yellow-900'
                                      }`}
                        >
                          {def.cost}
                        </span>
                      )}
                    </motion.button>
                  </Tooltip>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Target selection button ---
const TargetButton: React.FC<{
  player: PlayerView;
  onClick: () => void;
}> = ({ player, onClick }) => {
  const initial = player.name.charAt(0).toUpperCase();

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-3 rounded-xl
                 bg-white/5 border border-white/10 hover:border-red-500/40
                 hover:bg-red-500/10 transition-all cursor-pointer min-w-[80px]"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
        {initial}
      </div>
      <span className="text-xs font-medium text-white">{player.name}</span>
      <span className="text-[10px] text-yellow-400">💰 {player.coins}</span>
    </motion.button>
  );
};

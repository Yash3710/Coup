import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameStateView, GamePhase } from '../../types';
import { socketService } from '../../services/socketService';
import { soundManager } from '../../utils/sounds';
import { Button } from '../ui/Button';

interface ChallengeModalProps {
  gameState: GameStateView;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({ gameState }) => {
  const { pendingAction, myPlayerId, phase } = gameState;

  const isVisible =
    phase === GamePhase.ChallengePhase &&
    pendingAction &&
    pendingAction.playerId !== myPlayerId &&
    !pendingAction.respondedPlayers.includes(myPlayerId);

  // Also check that the current player is alive
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
  const canAct = isVisible && myPlayer?.alive;

  if (!canAct || !pendingAction) return null;

  const actingPlayer = gameState.players.find(
    (p) => p.id === pendingAction.playerId
  );
  const targetPlayer = pendingAction.targetId
    ? gameState.players.find((p) => p.id === pendingAction.targetId)
    : null;

  const handleChallenge = () => {
    soundManager.challenge();
    socketService.challenge();
  };

  const handlePass = () => {
    soundManager.click();
    socketService.passChallenge();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
      >
        <div className="dashboard-panel p-5 border-l-4 border-orange-500">
          {/* Header */}
          <div className="text-center mb-4">
            <p className="text-sm text-slate-400 mb-1">Challenge?</p>
            <p className="text-base font-semibold text-slate-200">
              <span className="text-blue-400">
                {actingPlayer?.name || 'Player'}
              </span>{' '}
              claims{' '}
              <span className="text-yellow-300">
                {pendingAction.claimedCharacter}
              </span>{' '}
              to{' '}
              <span className="text-orange-300">
                {pendingAction.action}
              </span>
              {targetPlayer && (
                <>
                  {' '}on{' '}
                  <span className="text-red-300">{targetPlayer.name}</span>
                </>
              )}
            </p>
          </div>

          {/* Timer bar */}
          {gameState.turnTimerEnd && (
            <div className="w-full h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{
                  duration: Math.max(
                    0,
                    (gameState.turnTimerEnd - Date.now()) / 1000
                  ),
                  ease: 'linear',
                }}
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 relative z-10">
            <button
              onClick={handleChallenge}
              className="flex-1 btn-danger py-3 font-bold uppercase tracking-wider"
            >
              Challenge
            </button>
            <button
              onClick={handlePass}
              className="flex-1 btn-secondary py-3 font-bold uppercase tracking-wider"
            >
              Pass
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

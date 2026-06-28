import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GameStateView,
  GamePhase,
  Action,
  Character,
  ACTION_DEFINITIONS,
} from '../../types';
import { socketService } from '../../services/socketService';
import { soundManager } from '../../utils/sounds';
import { Button } from '../ui/Button';
import { CHARACTER_EMOJIS } from '../../utils/constants';

interface BlockModalProps {
  gameState: GameStateView;
}

export const BlockModal: React.FC<BlockModalProps> = ({ gameState }) => {
  const { pendingAction, pendingBlock, myPlayerId, phase } = gameState;

  // Block Phase: when an action can be blocked
  const isBlockPhase = phase === GamePhase.BlockPhase && pendingAction;

  // BlockChallenge Phase: when someone blocked and others can challenge it
  const isBlockChallengePhase =
    phase === GamePhase.BlockChallengePhase && pendingBlock;

  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
  if (!myPlayer?.alive) return null;

  // --- Block Phase: can I block? ---
  if (isBlockPhase && pendingAction) {
    const actingPlayer = gameState.players.find(
      (p) => p.id === pendingAction.playerId
    );
    const def = ACTION_DEFINITIONS[pendingAction.action];

    // I can block if:
    // 1. I'm the target of the action, OR
    // 2. The action can be blocked by anyone (e.g., Duke blocks ForeignAid from anyone)
    const isTarget = pendingAction.targetId === myPlayerId;
    const isDukeBlockingFA =
      pendingAction.action === Action.ForeignAid; // Anyone can claim Duke to block

    if (
      pendingAction.playerId === myPlayerId ||
      pendingAction.respondedPlayers.includes(`block_pass_${myPlayerId}`)
    ) {
      return null;
    }

    if (!isTarget && !isDukeBlockingFA) return null;

    const blockOptions = def.blockedBy;
    if (blockOptions.length === 0) return null;

    const handleBlock = (character: Character) => {
      soundManager.block();
      socketService.block({ claimedCharacter: character });
    };

    const handlePass = () => {
      soundManager.click();
      socketService.passBlock();
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
          <div className="dashboard-panel p-5 border-l-4 border-green-500">
            <div className="text-center mb-4">
              <p className="text-sm text-slate-400 mb-1">Block?</p>
              <p className="text-base font-semibold text-slate-200">
                <span className="text-blue-400">
                  {actingPlayer?.name}
                </span>{' '}
                is using{' '}
                <span className="text-white font-bold bg-slate-800 px-2 py-1 rounded">
                  {pendingAction.action}
                </span>
              </p>
            </div>

            {gameState.turnTimerEnd && (
              <div className="w-full h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
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

            <div className="flex flex-col gap-2 relative z-10">
              {blockOptions.map((char) => (
                <button
                  key={char}
                  onClick={() => handleBlock(char)}
                  className="w-full btn-primary py-3 font-bold uppercase tracking-wider"
                >
                  Block as {char} {CHARACTER_EMOJIS[char]}
                </button>
              ))}
              <button
                onClick={handlePass}
                className="w-full btn-secondary py-3 font-bold uppercase tracking-wider"
              >
                Allow
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // --- Block Challenge Phase: someone blocked, can I challenge the block? ---
  if (isBlockChallengePhase && pendingBlock) {
    if (
      pendingBlock.blockerId === myPlayerId ||
      pendingBlock.respondedPlayers.includes(myPlayerId)
    ) {
      return null;
    }

    const blocker = gameState.players.find(
      (p) => p.id === pendingBlock.blockerId
    );

    const handleChallengeBlock = () => {
      soundManager.challenge();
      socketService.challengeBlock();
    };

    const handlePassBlockChallenge = () => {
      soundManager.click();
      socketService.passBlockChallenge();
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md"
        >
          <div className="glass-strong p-5 border border-yellow-500/20">
            <div className="text-center mb-4">
              <p className="text-sm text-slate-400 mb-1">
                Challenge the Block?
              </p>
              <p className="text-base font-semibold text-white">
                <span className="text-green-300">
                  {blocker?.name}
                </span>{' '}
                claims{' '}
                <span className="text-yellow-300">
                  {pendingBlock.claimedCharacter}
                </span>{' '}
                to block{' '}
                <span className="text-orange-300">
                  {pendingBlock.originalAction}
                </span>
              </p>
            </div>

            {gameState.turnTimerEnd && (
              <div className="w-full h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
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

            <div className="flex gap-3">
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleChallengeBlock}
              >
                ❓ Challenge Block
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={handlePassBlockChallenge}
              >
                Pass
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};

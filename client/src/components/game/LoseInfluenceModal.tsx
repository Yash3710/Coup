import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameStateView, GamePhase } from '../../types';
import { socketService } from '../../services/socketService';
import { soundManager } from '../../utils/sounds';
import { Button } from '../ui/Button';
import { InfluenceCard } from './InfluenceCard';

interface LoseInfluenceModalProps {
  gameState: GameStateView;
}

export const LoseInfluenceModal: React.FC<LoseInfluenceModalProps> = ({
  gameState,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { pendingLoseInfluence, myPlayerId, phase } = gameState;

  const isVisible =
    phase === GamePhase.ResolveLoseInfluence &&
    pendingLoseInfluence &&
    pendingLoseInfluence.playerId === myPlayerId;

  if (!isVisible || !pendingLoseInfluence) return null;

  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
  if (!myPlayer) return null;

  const unrevealed = myPlayer.cards.filter((c) => !c.revealed);

  // If only one card, auto-select it
  if (unrevealed.length === 1 && !selectedId) {
    const cardId = unrevealed[0].id;
    setTimeout(() => {
      soundManager.reveal();
      socketService.chooseLoseInfluence({ cardId });
    }, 500);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative dashboard-panel p-6 text-center"
        >
          <p className="text-red-400 text-lg">Losing influence...</p>
        </motion.div>
      </div>
    );
  }

  const handleConfirm = () => {
    if (!selectedId) return;
    soundManager.reveal();
    socketService.chooseLoseInfluence({ cardId: selectedId });
    setSelectedId(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative dashboard-panel p-6 max-w-md w-full border-l-4 border-l-red-500"
        >
          <h3 className="text-xl font-bold text-red-400 text-center mb-2">
            💀 Lose Influence
          </h3>
          <p className="text-sm text-slate-400 text-center mb-2">
            {pendingLoseInfluence.reason}
          </p>
          <p className="text-sm text-red-300 text-center mb-6">
            Choose a card to reveal
          </p>

          {/* Cards */}
          <div className="flex justify-center gap-4 mb-6">
            {unrevealed.map((card, i) => (
              <div key={card.id} className="relative">
                <InfluenceCard
                  card={card}
                  isOwn
                  onClick={() => {
                    soundManager.cardFlip();
                    setSelectedId(card.id);
                  }}
                  selected={selectedId === card.id}
                  index={i}
                />
                {selectedId === card.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full
                               flex items-center justify-center text-xs text-white shadow-lg"
                  >
                    ✕
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className={`w-full py-3 font-bold uppercase tracking-wider ${!selectedId ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-danger'}`}
          >
            Reveal Card
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameStateView, GamePhase, Card } from '../../types';
import { socketService } from '../../services/socketService';
import { soundManager } from '../../utils/sounds';
import { Button } from '../ui/Button';
import { InfluenceCard } from './InfluenceCard';

interface ExchangeModalProps {
  gameState: GameStateView;
}

export const ExchangeModal: React.FC<ExchangeModalProps> = ({ gameState }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { pendingExchange, myPlayerId, phase } = gameState;

  const isVisible =
    phase === GamePhase.ExchangePhase &&
    pendingExchange &&
    pendingExchange.playerId === myPlayerId;

  if (!isVisible || !pendingExchange) return null;

  const availableCards: Card[] = pendingExchange.availableCards || [];
  const keepCount = pendingExchange.keepCount || 2;

  const toggleCard = (cardId: string) => {
    soundManager.cardFlip();
    setSelectedIds((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : prev.length < keepCount
        ? [...prev, cardId]
        : prev
    );
  };

  const handleConfirm = () => {
    if (selectedIds.length !== keepCount) return;
    soundManager.click();
    socketService.chooseExchangeCards({ keepCardIds: selectedIds });
    setSelectedIds([]);
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
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative dashboard-panel p-6 max-w-lg w-full"
        >
          <h3 className="text-xl font-bold text-white text-center mb-2 uppercase tracking-widest">
            Exchange Cards
          </h3>
          <p className="text-sm text-slate-400 text-center mb-6">
            Select <span className="text-blue-400 font-bold">{keepCount}</span>{' '}
            card{keepCount !== 1 ? 's' : ''} to keep
          </p>

          {/* Cards */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {availableCards.map((card, i) => (
              <div key={card.id} className="relative">
                <InfluenceCard
                  card={{ id: card.id, character: card.character, revealed: false }}
                  isOwn
                  onClick={() => toggleCard(card.id)}
                  selected={selectedIds.includes(card.id)}
                  index={i}
                />
                {selectedIds.includes(card.id) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full
                               flex items-center justify-center text-xs font-bold text-yellow-900 shadow-lg"
                  >
                    ✓
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Selection count */}
          <p className="text-center text-sm text-slate-400 mb-4">
            Selected:{' '}
            <span
              className={`font-bold ${
                selectedIds.length === keepCount
                  ? 'text-green-400'
                  : 'text-yellow-400'
              }`}
            >
              {selectedIds.length}
            </span>
            /{keepCount}
          </p>

          <button
            onClick={handleConfirm}
            disabled={selectedIds.length !== keepCount}
            className={`w-full py-3 font-bold uppercase tracking-wider ${selectedIds.length !== keepCount ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'}`}
          >
            Confirm Selection
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

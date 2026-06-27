import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GameStateView } from '../../types';
import { soundManager } from '../../utils/sounds';
import { socketService } from '../../services/socketService';
import { Button } from '../ui/Button';
import { DEFAULT_AVATARS } from '../../utils/constants';

interface VictoryScreenProps {
  gameState: GameStateView;
}

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ gameState }) => {
  const navigate = useNavigate();
  const winner = gameState.players.find((p) => p.id === gameState.winner);
  const isWinner = gameState.winner === gameState.myPlayerId;

  useEffect(() => {
    if (isWinner) {
      soundManager.victory();
    } else {
      soundManager.defeat();
    }
  }, [isWinner]);

  const confetti = useMemo<ConfettiPiece[]>(() => {
    const colors = ['#a855f7', '#fbbf24', '#ef4444', '#22c55e', '#60a5fa', '#ec4899'];
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 8,
      rotation: Math.random() * 720 - 360,
    }));
  }, []);

  const getAvatarDisplay = (avatarUrl: string, name: string) => {
    if (avatarUrl.startsWith('default:')) {
      const id = avatarUrl.replace('default:', '');
      const def = DEFAULT_AVATARS.find((a) => a.id === id);
      if (def) {
        return (
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-3xl"
            style={{ background: def.color }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        );
      }
    }
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-full h-full rounded-full object-cover"
      />
    );
  };

  const gameDuration = gameState.winner
    ? Math.floor((Date.now() - (gameState.startedAt || 0)) / 1000)
    : 0;
  const minutes = Math.floor(gameDuration / 60);
  const seconds = gameDuration % 60;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Confetti */}
      {isWinner &&
        confetti.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${piece.x}%`,
              width: piece.size,
              height: piece.size * 1.5,
              backgroundColor: piece.color,
            }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
              y: '110vh',
              opacity: [1, 1, 0],
              rotate: piece.rotation,
            }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: 'easeIn',
              repeat: Infinity,
            }}
          />
        ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        className="relative glass-strong p-8 max-w-md w-full text-center"
      >
        {/* Crown */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="text-5xl mb-4"
        >
          {isWinner ? '👑' : '💀'}
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`text-3xl font-black mb-6 ${
            isWinner ? 'gradient-text' : 'text-slate-400'
          }`}
        >
          {isWinner ? 'VICTORY!' : 'DEFEAT'}
        </motion.h2>

        {/* Winner */}
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col items-center mb-6"
          >
            <div
              className={`w-20 h-20 rounded-full overflow-hidden border-4 mb-2 ${
                isWinner
                  ? 'border-yellow-400 animate-pulse-glow-gold'
                  : 'border-purple-500'
              }`}
            >
              {getAvatarDisplay(winner.avatarUrl, winner.name)}
            </div>
            <p className="text-lg font-bold text-white">{winner.name}</p>
            <p className="text-sm text-slate-400">Winner</p>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="glass-subtle p-4 mb-6"
        >
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center">
              <p className="text-slate-400">Turns</p>
              <p className="text-white font-bold text-lg">
                {gameState.turnNumber}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Duration</p>
              <p className="text-white font-bold text-lg">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Players</p>
              <p className="text-white font-bold text-lg">
                {gameState.players.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Events</p>
              <p className="text-white font-bold text-lg">
                {gameState.gameLog.length}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => {
              socketService.leaveRoom();
              navigate('/coup/lobby');
            }}
          >
            Back to Lobby
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => {
              socketService.leaveRoom();
              navigate('/coup/lobby');
            }}
          >
            Play Again
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

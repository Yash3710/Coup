import React, { useEffect, useState } from 'react';
import { PlayerView, CHARACTER_DEFINITIONS } from '../../types';
import { motion } from 'framer-motion';

interface PlayerCardProps {
  player: PlayerView;
  isCurrentTurn: boolean;
  isSelf: boolean;
  turnTimerEnd?: number | null;
  selectable?: boolean;
  onClick?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentTurn,
  isSelf,
  turnTimerEnd,
  selectable,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={selectable ? { scale: 1.02 } : {}}
      whileTap={selectable ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`dashboard-panel p-3 flex items-center justify-between transition-all w-full
        ${isCurrentTurn ? 'turn-active bg-[#1e293b]' : 'bg-[#0f172a]'}
        ${!player.alive ? 'opacity-40 grayscale' : ''}
        ${selectable ? 'cursor-pointer hover:border-blue-400' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt={player.name}
              className={`w-10 h-10 rounded-full object-cover border-2 
                ${isCurrentTurn ? 'border-blue-500' : 'border-slate-700'}`}
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                ${isCurrentTurn ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              {player.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          {!player.connected && player.alive && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
          {!player.alive && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-sm">☠️</span>
            </div>
          )}
        </div>

        {/* Name and Status */}
        <div className="flex flex-col">
          <span className={`font-semibold text-sm truncate max-w-[120px] ${isSelf ? 'text-blue-400' : 'text-slate-200'}`}>
            {player.name} {isSelf && '(You)'}
          </span>
          <span className="text-xs text-slate-500">
            {player.alive ? (isCurrentTurn ? 'Active Turn' : 'Waiting') : 'Eliminated'}
          </span>
          {isCurrentTurn && turnTimerEnd && <TurnTimer endTime={turnTimerEnd} />}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        {/* Cards */}
        <div className="flex gap-1" title="Influence Cards">
          {player.cards.map((card, i) => {
            const isUnrevealedSelf = isSelf && !card.revealed && card.character;
            const isUnrevealedOpponent = !isSelf && !card.revealed;
            const def = isUnrevealedSelf ? CHARACTER_DEFINITIONS[card.character!] : null;
            
            return (
              <div
                key={card.id || i}
                className={`w-6 h-8 rounded shadow-sm border flex items-center justify-center overflow-hidden relative
                  ${card.revealed ? 'bg-slate-800 border-red-900/50' : 'bg-slate-700 border-slate-500'}`}
              >
                {card.revealed && <span className="text-[10px] z-10">☠️</span>}
                
                {isUnrevealedSelf && def?.cardImageUrl ? (
                  <img src={def.cardImageUrl} alt={def.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : isUnrevealedSelf ? (
                  <span className="text-[8px] font-bold text-white uppercase truncate px-0.5 z-10">
                    {card.character?.substring(0, 3)}
                  </span>
                ) : null}

                {isUnrevealedOpponent && (
                  <span className="text-[6px] font-bold text-slate-400 tracking-tighter transform -rotate-45 z-10">
                    COUP
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Coins */}
        <div className="flex flex-col items-center bg-slate-800 rounded px-2 py-1 min-w-[40px]">
          <span className="text-yellow-400 text-[10px] font-bold leading-none mb-1">COINS</span>
          <span className="text-white text-sm font-bold leading-none">{player.coins}</span>
        </div>
      </div>
    </motion.div>
  );
};

const TurnTimer: React.FC<{ endTime: number }> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
    }, 100);
    return () => clearInterval(interval);
  }, [endTime]);

  const urgent = timeLeft <= 5;
  return (
    <span className={`text-xs font-bold mt-1 ${urgent ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
      ⏱ {timeLeft}s left
    </span>
  );
};

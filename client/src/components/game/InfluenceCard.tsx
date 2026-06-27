import React from 'react';
import { motion } from 'framer-motion';
import { CardView, Character } from '../../types';
import { CHARACTER_DEFINITIONS } from '../../types';

interface InfluenceCardProps {
  card: CardView;
  isOwn?: boolean;
  onClick?: () => void;
  selected?: boolean;
  index?: number;
  small?: boolean;
}

const characterColors: Record<Character, string> = {
  [Character.Duke]: 'bg-purple-900 border-purple-500 text-purple-200',
  [Character.Assassin]: 'bg-slate-900 border-slate-500 text-slate-200',
  [Character.Captain]: 'bg-blue-900 border-blue-500 text-blue-200',
  [Character.Ambassador]: 'bg-green-900 border-green-500 text-green-200',
  [Character.Contessa]: 'bg-red-900 border-red-500 text-red-200',
};

export const InfluenceCard: React.FC<InfluenceCardProps> = ({
  card,
  isOwn = false,
  onClick,
  selected = false,
  index = 0,
  small = false,
}) => {
  const showFace = card.revealed || (isOwn && card.character);
  const w = small ? 'w-20 h-32' : 'w-32 h-48 md:w-40 md:h-60';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={isOwn && !card.revealed ? { y: -5 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      onClick={onClick}
      className={`relative ${w} rounded-lg cursor-${onClick ? 'pointer' : 'default'} transition-all
                  ${selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}
                  ${card.revealed && !isOwn ? 'opacity-50 grayscale' : ''}`}
    >
      {showFace && card.character ? (
        /* Face up - Clean Dashboard Style */
        <div
          className={`absolute inset-0 rounded-lg border-2 ${characterColors[card.character]} flex flex-col items-center justify-center shadow-lg overflow-hidden`}
        >
          {CHARACTER_DEFINITIONS[card.character]?.cardImageUrl ? (
            <img 
              src={CHARACTER_DEFINITIONS[card.character].cardImageUrl} 
              alt={card.character}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-bold uppercase tracking-wider text-center break-words text-sm md:text-base p-3">
              {card.character}
            </span>
          )}

          {card.revealed && (
            <div className="absolute inset-0 bg-red-900/80 rounded-lg flex items-center justify-center backdrop-blur-sm z-20">
              <span className="text-xl md:text-2xl text-white font-black uppercase tracking-widest border-2 border-white px-2 py-1">
                Dead
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Face down - Clean Slate Back */
        <div className="absolute inset-0 rounded-lg border-2 border-slate-600 bg-slate-800 flex items-center justify-center shadow-lg">
           <div className="w-[80%] h-[85%] border border-slate-600 rounded flex items-center justify-center">
             <span className="text-slate-500 font-bold tracking-widest uppercase text-sm">
               COUP
             </span>
           </div>
        </div>
      )}
    </motion.div>
  );
};

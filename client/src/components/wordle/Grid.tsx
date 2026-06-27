import React from 'react';
import { motion } from 'framer-motion';
import { LetterStatus } from './wordleStore';

interface TileProps {
  letter: string;
  status: LetterStatus;
  animate: boolean;
  index: number;
}

const statusColors: Record<LetterStatus, string> = {
  correct: 'bg-green-500 border-green-500 text-white',
  present: 'bg-yellow-500 border-yellow-500 text-white',
  absent: 'bg-slate-700 border-slate-700 text-slate-300',
  empty: 'bg-transparent border-slate-600 text-white',
};

const Tile: React.FC<TileProps> = ({ letter, status, animate, index }) => {
  // animate is isSubmitted here
  return (
    <motion.div
      initial={animate ? { rotateX: 90, opacity: 0 } : { scale: letter ? 0.8 : 1 }}
      animate={animate ? { rotateX: 0, opacity: 1 } : { scale: 1 }}
      transition={
        animate 
          ? { delay: index * 0.15, duration: 0.4, type: 'spring', bounce: 0.3 }
          : { type: 'spring', stiffness: 400, damping: 25 }
      }
      className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-2xl md:text-3xl font-bold uppercase
        ${status === 'empty' ? 'border-2 border-slate-600 bg-transparent text-white' : statusColors[status]}
        ${letter && status === 'empty' ? 'border-slate-400' : ''}
      `}
    >
      {letter}
    </motion.div>
  );
};

interface RowProps {
  guess: string;
  targetWord: string;
  isCurrent: boolean;
  isSubmitted: boolean;
  hasError?: boolean;
}

const Row: React.FC<RowProps> = ({ guess, targetWord, isCurrent, isSubmitted, hasError }) => {
  const tiles = Array(5).fill('');
  
  // Calculate statuses for submitted rows
  const statuses: LetterStatus[] = Array(5).fill('empty');
  
  if (isSubmitted) {
    // Exact logic for Wordle colored tiles (handling duplicate letters properly)
    const targetLetters = targetWord.split('');
    const guessLetters = guess.split('');
    
    // First pass: find exact matches (green)
    guessLetters.forEach((letter, i) => {
      if (letter === targetLetters[i]) {
        statuses[i] = 'correct';
        targetLetters[i] = null as any; // consume this letter
      }
    });
    
    // Second pass: find present matches (yellow)
    guessLetters.forEach((letter, i) => {
      if (statuses[i] !== 'correct') {
        const targetIndex = targetLetters.indexOf(letter);
        if (targetIndex !== -1) {
          statuses[i] = 'present';
          targetLetters[targetIndex] = null as any; // consume
        } else {
          statuses[i] = 'absent';
        }
      }
    });
  }

  // Fill in the letters
  for (let i = 0; i < guess.length; i++) {
    tiles[i] = guess[i];
  }

  return (
    <motion.div 
      className="flex gap-2 mb-2"
      animate={hasError ? { x: [-10, 10, -10, 10, 0] } : false}
      transition={{ duration: 0.4 }}
    >
      {tiles.map((letter, i) => (
        <Tile 
          key={i} 
          letter={letter} 
          status={isSubmitted ? statuses[i] : (letter ? 'empty' : 'empty')} 
          animate={isSubmitted} 
          index={i}
        />
      ))}
    </motion.div>
  );
};

interface GridProps {
  guesses: string[];
  currentGuess: string;
  targetWord: string;
  errorMessage?: string | null;
}

export const Grid: React.FC<GridProps> = ({ guesses, currentGuess, targetWord, errorMessage }) => {
  const empties = guesses.length < 6 ? Array(5 - guesses.length).fill('') : [];

  return (
    <div className="flex flex-col items-center mb-8">
      {guesses.map((guess, i) => (
        <Row key={i} guess={guess} targetWord={targetWord} isCurrent={false} isSubmitted={true} />
      ))}
      
      {guesses.length < 6 && (
        <Row guess={currentGuess} targetWord={targetWord} isCurrent={true} isSubmitted={false} hasError={!!errorMessage} />
      )}
      
      {empties.map((_, i) => (
        <Row key={`empty-${i}`} guess="" targetWord={targetWord} isCurrent={false} isSubmitted={false} />
      ))}
    </div>
  );
};

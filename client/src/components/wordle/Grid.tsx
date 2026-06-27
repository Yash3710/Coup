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
  return (
    <motion.div
      initial={animate ? { rotateX: -90, opacity: 0 } : false}
      animate={animate ? { rotateX: 0, opacity: 1 } : false}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`w-12 h-12 md:w-16 md:h-16 border-2 flex items-center justify-center text-2xl md:text-3xl font-bold uppercase ${statusColors[status]}`}
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
}

const Row: React.FC<RowProps> = ({ guess, targetWord, isCurrent, isSubmitted }) => {
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
    <div className="flex gap-2 mb-2">
      {tiles.map((letter, i) => (
        <Tile 
          key={i} 
          letter={letter} 
          status={isSubmitted ? statuses[i] : (letter ? 'empty' : 'empty')} 
          animate={isSubmitted} 
          index={i}
        />
      ))}
    </div>
  );
};

interface GridProps {
  guesses: string[];
  currentGuess: string;
  targetWord: string;
}

export const Grid: React.FC<GridProps> = ({ guesses, currentGuess, targetWord }) => {
  const empties = guesses.length < 6 ? Array(5 - guesses.length).fill('') : [];

  return (
    <div className="flex flex-col items-center mb-8">
      {guesses.map((guess, i) => (
        <Row key={i} guess={guess} targetWord={targetWord} isCurrent={false} isSubmitted={true} />
      ))}
      
      {guesses.length < 6 && (
        <Row guess={currentGuess} targetWord={targetWord} isCurrent={true} isSubmitted={false} />
      )}
      
      {empties.map((_, i) => (
        <Row key={`empty-${i}`} guess="" targetWord={targetWord} isCurrent={false} isSubmitted={false} />
      ))}
    </div>
  );
};

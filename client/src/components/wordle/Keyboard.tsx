import React, { useEffect } from 'react';
import { LetterStatus, useWordleStore } from './wordleStore';

const KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

interface KeyboardProps {
  guesses: string[];
  targetWord: string;
}

export const Keyboard: React.FC<KeyboardProps> = ({ guesses, targetWord }) => {
  const { addLetter, removeLetter, submitGuess } = useWordleStore();
  
  // Calculate key statuses
  const keyStatuses: Record<string, LetterStatus> = {};
  
  guesses.forEach((guess) => {
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i];
      const targetChar = targetWord[i];
      
      if (letter === targetChar) {
        keyStatuses[letter] = 'correct';
      } else if (targetWord.includes(letter) && keyStatuses[letter] !== 'correct') {
        keyStatuses[letter] = 'present';
      } else if (!targetWord.includes(letter)) {
        keyStatuses[letter] = 'absent';
      }
    }
  });

  const getKeyClass = (key: string) => {
    const status = keyStatuses[key];
    if (status === 'correct') return 'bg-green-500 text-white border-green-600';
    if (status === 'present') return 'bg-yellow-500 text-white border-yellow-600';
    if (status === 'absent') return 'bg-slate-700 text-slate-400 border-slate-800 opacity-50';
    return 'bg-slate-500 text-white hover:bg-slate-400 border-slate-600';
  };

  const handleClick = (key: string) => {
    if (key === 'ENTER') submitGuess();
    else if (key === '⌫') removeLetter();
    else addLetter(key);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') submitGuess();
      else if (e.key === 'Backspace') removeLetter();
      else if (/^[A-Za-z]$/.test(e.key)) addLetter(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addLetter, removeLetter, submitGuess]);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-2 p-2">
      {KEYS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 md:gap-2">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => handleClick(key)}
              className={`${
                key === 'ENTER' || key === '⌫' ? 'px-3 md:px-5 text-xs md:text-sm' : 'w-8 md:w-12 text-sm md:text-lg'
              } h-12 md:h-14 rounded font-bold uppercase transition-colors border-b-4 active:border-b-0 active:translate-y-1 ${getKeyClass(key)}`}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

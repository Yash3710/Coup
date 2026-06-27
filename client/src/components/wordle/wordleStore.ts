import { create } from 'zustand';
import { getDailyWord, getRandomWord, isValidWord } from './words';

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';
export type GameStatus = 'playing' | 'won' | 'lost';
export type GameMode = 'daily' | 'infinite';

interface WordleState {
  targetWord: string;
  guesses: string[];
  currentGuess: string;
  gameStatus: GameStatus;
  mode: GameMode;

  errorMessage: string | null;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => boolean;
  resetGame: (mode: GameMode) => void;
  setErrorMessage: (msg: string | null) => void;
}

export const useWordleStore = create<WordleState>((set, get) => ({
  targetWord: getDailyWord(),
  guesses: [],
  currentGuess: '',
  gameStatus: 'playing',
  mode: 'daily',
  errorMessage: null,
  setErrorMessage: (msg: string | null) => set({ errorMessage: msg }),

  addLetter: (letter: string) => {
    const { currentGuess, gameStatus } = get();
    if (gameStatus !== 'playing') return;
    if (currentGuess.length < 5) {
      set({ currentGuess: currentGuess + letter.toUpperCase() });
    }
  },

  removeLetter: () => {
    const { currentGuess, gameStatus } = get();
    if (gameStatus !== 'playing') return;
    if (currentGuess.length > 0) {
      set({ currentGuess: currentGuess.slice(0, -1) });
    }
  },

  submitGuess: () => {
    const { currentGuess, guesses, targetWord, gameStatus } = get();
    if (gameStatus !== 'playing') return false;
    if (currentGuess.length !== 5) return false;

    if (!isValidWord(currentGuess)) {
      const store = get();
      store.setErrorMessage('Not in word list');
      setTimeout(() => {
        if (useWordleStore.getState().errorMessage === 'Not in word list') {
          useWordleStore.getState().setErrorMessage(null);
        }
      }, 2000);
      return false;
    }

    const newGuesses = [...guesses, currentGuess];
    let newStatus: GameStatus = 'playing';

    if (currentGuess === targetWord) {
      newStatus = 'won';
    } else if (newGuesses.length >= 6) {
      newStatus = 'lost';
    }

    set({
      guesses: newGuesses,
      currentGuess: '',
      gameStatus: newStatus,
    });
    return true;
  },

  resetGame: (mode: GameMode) => {
    set({
      targetWord: mode === 'daily' ? getDailyWord() : getRandomWord(),
      guesses: [],
      currentGuess: '',
      gameStatus: 'playing',
      mode,
    });
  },
}));

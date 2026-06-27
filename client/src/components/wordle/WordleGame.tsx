import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useWordleStore } from './wordleStore';
import { Grid } from './Grid';
import { Keyboard } from './Keyboard';

export const WordleGame: React.FC = () => {
  const { 
    guesses, 
    currentGuess, 
    targetWord, 
    gameStatus, 
    mode, 
    resetGame,
    errorMessage 
  } = useWordleStore();

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center py-8 px-4 text-white relative">
      {/* Toast Notification */}
      {errorMessage && (
        <div className="absolute top-20 z-50 animate-bounce">
          <div className="bg-red-500 text-white px-4 py-2 rounded shadow-lg font-bold">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="w-full max-w-lg flex justify-between items-center mb-8 pb-4 border-b border-white/10">
        <Link 
          to="/" 
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm uppercase tracking-widest font-bold"
        >
          ← Hub
        </Link>
        <h1 className="text-3xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          WORDLE
        </h1>
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">
          {mode === 'daily' ? 'Daily' : 'Infinite'}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 w-full max-w-lg flex flex-col items-center justify-center">
        <Grid guesses={guesses} currentGuess={currentGuess} targetWord={targetWord} />
        
        {/* Game Over Overlay */}
        {gameStatus !== 'playing' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute z-10 dashboard-panel p-8 text-center max-w-sm mx-auto shadow-2xl border-t border-white/20"
          >
            <h2 className={`text-3xl font-black mb-2 uppercase ${gameStatus === 'won' ? 'text-green-400' : 'text-red-400'}`}>
              {gameStatus === 'won' ? 'Magnificent!' : 'Game Over'}
            </h2>
            <p className="text-slate-300 mb-6 text-lg">
              The word was <span className="font-bold text-white tracking-widest">{targetWord}</span>
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => resetGame('infinite')}
                className="btn-primary py-3 px-6 w-full font-bold text-lg"
              >
                Play Random Word
              </button>
              {mode === 'infinite' && (
                <button
                  onClick={() => resetGame('daily')}
                  className="btn-secondary py-3 px-6 w-full text-sm font-bold"
                >
                  Back to Daily
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Keyboard */}
      <div className="w-full mt-auto pt-8">
        <Keyboard guesses={guesses} targetWord={targetWord} />
      </div>
    </div>
  );
};

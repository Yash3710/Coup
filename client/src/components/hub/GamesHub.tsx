import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const GamesHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6 md:p-12 font-sans flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl text-center mb-16 mt-8"
      >
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
          TERRIT
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Play classic tabletop games in your browser. Clean, fast, and competitive.
        </p>
      </motion.div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* COUP CARD (Playable) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5 }}
          className="dashboard-panel group overflow-hidden flex flex-col cursor-pointer border border-slate-700 hover:border-blue-500 transition-colors"
          onClick={() => navigate('/coup')}
        >
          <div className="h-56 bg-cover bg-center relative p-6 flex items-end" style={{ backgroundImage: "url('/images/coup.png')" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent"></div>
            <h2 className="text-3xl font-black text-white tracking-widest relative z-10 drop-shadow-lg">COUP</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <p className="text-slate-400 text-sm mb-6 flex-1">
              A game of deduction and deception. Bluff your way to power in this dystopian universe.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">2-6 Players</span>
              <button className="btn-primary text-sm font-bold px-6">
                Play Now
              </button>
            </div>
          </div>
        </motion.div>

        {/* WORDLE CARD (Playable) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5 }}
          className="dashboard-panel group overflow-hidden flex flex-col cursor-pointer border border-slate-700 hover:border-blue-500 transition-colors"
          onClick={() => navigate('/wordle')}
        >
          <div className="h-56 bg-cover bg-center relative p-6 flex items-end" style={{ backgroundImage: "url('/images/wordle.png')" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent"></div>
            <h2 className="text-3xl font-black text-white tracking-widest relative z-10 drop-shadow-lg">WORDLE</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <p className="text-slate-400 text-sm mb-6 flex-1">
              Guess the 5-letter word in 6 tries. Play the Daily challenge or Infinite random words.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">1 Player</span>
              <button className="btn-primary text-sm font-bold px-6">
                Play Now
              </button>
            </div>
          </div>
        </motion.div>

        {/* CODENAMES CARD (Coming Soon) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="dashboard-panel opacity-60 flex flex-col border border-slate-800 relative"
        >
          {/* Coming Soon Overlay */}
          <div className="absolute top-4 right-4 bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1 rounded-full border border-orange-500/30">
            COMING SOON
          </div>
          
          <div className="h-56 bg-cover bg-center relative p-6 flex items-end grayscale opacity-80" style={{ backgroundImage: "url('/images/codenames.png')" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-[#0f172a]/30"></div>
            <h2 className="text-3xl font-black text-white tracking-widest relative z-10 drop-shadow-lg">CODENAMES</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <p className="text-slate-500 text-sm mb-6 flex-1">
              The ultimate word association game. Guide your spies to the correct words while avoiding the assassin.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase">4-8 Players</span>
              <button disabled className="bg-slate-800 text-slate-500 px-6 py-2 rounded-lg text-sm font-bold cursor-not-allowed">
                In Development
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheatSheet: React.FC<CheatSheetProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="casino-panel max-w-2xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl gold-text uppercase tracking-widest font-black">
                Rules & Characters
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-[var(--gold-primary)] transition-colors text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 text-sm md:text-base text-slate-200 sans">
              {/* Core Rules */}
              <section className="bg-black/40 p-4 rounded-xl border border-[var(--gold-dark)]">
                <h3 className="gold-text font-bold text-lg mb-2 uppercase">Core Actions</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong className="text-white">Income:</strong> Take 1 coin from the treasury.</li>
                  <li><strong className="text-white">Foreign Aid:</strong> Take 2 coins. (Can be blocked by Duke)</li>
                  <li><strong className="text-white">Coup:</strong> Pay 7 coins to force a player to lose influence. (Must Coup if you have 10+ coins).</li>
                </ul>
              </section>

              {/* Characters */}
              <section className="space-y-4">
                <h3 className="gold-text font-bold text-lg mb-2 uppercase">Characters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Duke */}
                  <div className="bg-gradient-to-r from-[#4a154b] to-black p-3 rounded-lg border-l-4 border-l-[#d4af37]">
                    <h4 className="font-bold text-white uppercase flex justify-between">
                      <span>👑 Duke</span>
                    </h4>
                    <p className="text-xs mt-1"><strong className="text-[var(--gold-primary)]">Action:</strong> Tax (Take 3 coins)</p>
                    <p className="text-xs"><strong className="text-[#4ade80]">Blocks:</strong> Foreign Aid</p>
                  </div>

                  {/* Assassin */}
                  <div className="bg-gradient-to-r from-[#1a1a24] to-black p-3 rounded-lg border-l-4 border-l-slate-400">
                    <h4 className="font-bold text-white uppercase flex justify-between">
                      <span>🗡️ Assassin</span>
                    </h4>
                    <p className="text-xs mt-1"><strong className="text-[var(--gold-primary)]">Action:</strong> Assassinate (Pay 3 coins, target loses influence)</p>
                  </div>

                  {/* Captain */}
                  <div className="bg-gradient-to-r from-[#0b2b40] to-black p-3 rounded-lg border-l-4 border-l-blue-400">
                    <h4 className="font-bold text-white uppercase flex justify-between">
                      <span>⚓ Captain</span>
                    </h4>
                    <p className="text-xs mt-1"><strong className="text-[var(--gold-primary)]">Action:</strong> Steal (Take 2 coins from target)</p>
                    <p className="text-xs"><strong className="text-[#4ade80]">Blocks:</strong> Steal</p>
                  </div>

                  {/* Ambassador */}
                  <div className="bg-gradient-to-r from-[#0f3818] to-black p-3 rounded-lg border-l-4 border-l-green-400">
                    <h4 className="font-bold text-white uppercase flex justify-between">
                      <span>🕊️ Ambassador</span>
                    </h4>
                    <p className="text-xs mt-1"><strong className="text-[var(--gold-primary)]">Action:</strong> Exchange (Draw 2 cards, keep any 2 from your new total)</p>
                    <p className="text-xs"><strong className="text-[#4ade80]">Blocks:</strong> Steal</p>
                  </div>

                  {/* Contessa */}
                  <div className="bg-gradient-to-r from-[#541212] to-black p-3 rounded-lg border-l-4 border-l-red-400 md:col-span-2">
                    <h4 className="font-bold text-white uppercase flex justify-between">
                      <span>💃 Contessa</span>
                    </h4>
                    <p className="text-xs mt-1"><strong className="text-[#4ade80]">Blocks:</strong> Assassination</p>
                  </div>
                </div>
              </section>

              <div className="text-center mt-8">
                <button
                  onClick={onClose}
                  className="btn-gold px-8 py-3 rounded-full shadow-xl"
                >
                  Return to Game
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

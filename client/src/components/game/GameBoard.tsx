import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { PlayerCard } from './PlayerCard';
import { InfluenceCard } from './InfluenceCard';
import { ActionBar } from './ActionBar';
import { GameLog } from './GameLog';
import { motion, AnimatePresence } from 'framer-motion';
import { GamePhase } from '../../types';
import { ExchangeModal } from './ExchangeModal';
import { LoseInfluenceModal } from './LoseInfluenceModal';
import { VictoryScreen } from './VictoryScreen';
import { ChallengeModal } from './ChallengeModal';
import { BlockModal } from './BlockModal';
import { CheatSheet } from './CheatSheet';

export const GameBoard: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { gameState, currentRoom, playerInfo } = useGameStore();
  const [activeRightTab, setActiveRightTab] = useState<'log' | 'rules'>('log');

  useEffect(() => {
    if (!gameState && !currentRoom) {
      navigate('/coup/lobby');
    }
  }, [gameState, currentRoom, navigate]);

  if (!gameState || !playerInfo || !gameState.players) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-slate-300">Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  const myPlayer = gameState.players.find(
    (p) => p.id === gameState.myPlayerId
  );
  
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === gameState.myPlayerId;
  const opponents = gameState.players.filter(p => p.id !== gameState.myPlayerId);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans flex flex-col md:flex-row md:h-screen md:overflow-hidden overflow-x-hidden">
      
      {/* LEFT COLUMN: ROSTER */}
      <div className="w-full md:w-64 lg:w-80 bg-[#1e293b] md:border-r border-b md:border-b-0 border-slate-700 flex flex-col shrink-0 md:h-full max-h-[45vh] md:max-h-none">
        <div className="p-4 border-b border-slate-700 bg-[#0f172a]">
          <h2 className="font-bold text-slate-300 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Room: {currentRoom?.name || roomId}
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Players</h3>
          
          {/* Opponents List */}
          {opponents.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentTurn={gameState.players[gameState.currentPlayerIndex]?.id === player.id}
              isSelf={false}
              turnTimerEnd={
                gameState.players[gameState.currentPlayerIndex]?.id === player.id
                  ? gameState.turnTimerEnd
                  : null
              }
            />
          ))}

          {/* Self List Item */}
          {myPlayer && (
            <div className="mt-8">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">You</h3>
              <PlayerCard
                player={myPlayer}
                isCurrentTurn={isMyTurn}
                isSelf={true}
                turnTimerEnd={isMyTurn ? gameState.turnTimerEnd : null}
              />
            </div>
          )}
        </div>
      </div>

      {/* CENTER COLUMN: ACTION HUB */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a] min-h-[50vh] md:min-h-0">
        
        {/* Top Banner: Status */}
        <div className="h-24 border-b border-slate-800 bg-[#1e293b]/50 flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            {gameState.pendingAction ? (
              <motion.div
                key="action"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-center"
              >
                <p className="text-lg md:text-xl font-medium">
                  <span className="text-blue-400 font-bold">
                    {gameState.players.find(p => p.id === gameState.pendingAction?.playerId)?.name}
                  </span>{' '}
                  is attempting to{' '}
                  <span className="text-white font-bold bg-slate-800 px-2 py-1 rounded">
                    {gameState.pendingAction.action}
                  </span>
                  {gameState.pendingAction.targetId && (
                    <>
                      {' '}on{' '}
                      <span className="text-blue-400 font-bold">
                        {gameState.players.find(p => p.id === gameState.pendingAction?.targetId)?.name}
                      </span>
                    </>
                  )}
                </p>
              </motion.div>
            ) : gameState.pendingBlock ? (
              <motion.div
                key="block"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-center"
              >
                <p className="text-lg md:text-xl font-medium text-green-400">
                  <span className="font-bold">
                    {gameState.players.find(p => p.id === gameState.pendingBlock?.blockerId)?.name}
                  </span>{' '}
                  blocks as {gameState.pendingBlock.claimedCharacter}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="turn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <p className="text-slate-400 text-sm uppercase tracking-widest mb-1">Current Phase</p>
                <p className="text-xl font-bold text-white uppercase tracking-wider">
                  {gameState.phase.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center: My Cards Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          
          {/* Deck Indicator (Subtle) */}
          <div className="absolute top-8 left-8 flex items-center gap-3 text-slate-500">
            <div className="w-16 h-24 rounded-lg border-2 border-slate-600 bg-slate-800 flex items-center justify-center shadow-lg transform -rotate-6">
              <div className="w-[80%] h-[85%] border border-slate-600 rounded flex items-center justify-center">
                <span className="text-slate-500 font-bold tracking-widest uppercase text-xs transform -rotate-45">
                  COUP
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 text-center">
            <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-6">Your Influence</h3>
          </div>
          
          <div className="flex gap-4 md:gap-8 justify-center">
            {myPlayer?.cards.map((card, i) => (
              <InfluenceCard
                key={card.id}
                card={card}
                isOwn={true}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* Bottom: Action Toolbar */}
        <div className="h-auto min-h-[120px] bg-[#1e293b] border-t border-slate-700 p-4">
          {myPlayer && isMyTurn && gameState.phase === GamePhase.ActionPhase ? (
            <ActionBar gameState={gameState} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <span className="text-2xl mb-2">⏳</span>
              <p className="font-medium text-sm">
                Waiting for {gameState.players[gameState.currentPlayerIndex]?.name} to act...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: LOG & RULES */}
      <div className="w-full md:w-80 bg-[#1e293b] md:border-l border-t md:border-t-0 border-slate-700 flex flex-col shrink-0 h-[50vh] md:h-full">
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveRightTab('log')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors
              ${activeRightTab === 'log' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Game Log
          </button>
          <button
            onClick={() => setActiveRightTab('rules')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors
              ${activeRightTab === 'rules' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Cheat Sheet
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {activeRightTab === 'log' ? (
            <GameLog entries={gameState.gameLog} />
          ) : (
            <div className="absolute inset-0 overflow-y-auto p-4 space-y-6">
              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">Core Actions</h4>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="bg-slate-800 p-2 rounded border border-slate-700"><span className="text-blue-400 font-bold">Income</span>: Take 1 coin</li>
                  <li className="bg-slate-800 p-2 rounded border border-slate-700"><span className="text-blue-400 font-bold">Foreign Aid</span>: Take 2 coins (Blocked by Duke)</li>
                  <li className="bg-slate-800 p-2 rounded border border-slate-700"><span className="text-blue-400 font-bold">Coup</span>: Pay 7 coins, target loses influence</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">Characters</h4>
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-800 p-2 rounded border-l-2 border-purple-500">
                    <span className="font-bold text-white block mb-1">Duke</span>
                    Action: Tax (3 coins)<br/>Blocks: Foreign Aid
                  </div>
                  <div className="bg-slate-800 p-2 rounded border-l-2 border-slate-400">
                    <span className="font-bold text-white block mb-1">Assassin</span>
                    Action: Assassinate (Pay 3)
                  </div>
                  <div className="bg-slate-800 p-2 rounded border-l-2 border-blue-500">
                    <span className="font-bold text-white block mb-1">Captain</span>
                    Action: Steal (2 coins)<br/>Blocks: Steal
                  </div>
                  <div className="bg-slate-800 p-2 rounded border-l-2 border-green-500">
                    <span className="font-bold text-white block mb-1">Ambassador</span>
                    Action: Exchange cards<br/>Blocks: Steal
                  </div>
                  <div className="bg-slate-800 p-2 rounded border-l-2 border-red-500">
                    <span className="font-bold text-white block mb-1">Contessa</span>
                    Blocks: Assassinate
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <ChallengeModal gameState={gameState} />
      <BlockModal gameState={gameState} />
      <ExchangeModal gameState={gameState} />
      <LoseInfluenceModal gameState={gameState} />
      {gameState.phase === GamePhase.GameOver && <VictoryScreen gameState={gameState} />}
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { socketService } from '../../services/socketService';
import { ChatPanel } from '../game/ChatPanel';
import { BotDifficulty } from '../../types';
import { DEFAULT_AVATARS } from '../../utils/constants';

export const RoomSetup: React.FC = () => {
  const navigate = useNavigate();
  const { currentRoom, playerInfo, gameState } = useGameStore();
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>(BotDifficulty.Medium);
  const [copied, setCopied] = useState(false);

  // If game started, navigate to game
  React.useEffect(() => {
    if (gameState && currentRoom) {
      navigate(`/coup/game/${currentRoom.id}`);
    }
  }, [gameState, currentRoom, navigate]);

  if (gameState && currentRoom) return null;
  if (!currentRoom || !playerInfo) return null;

  const localPlayer = currentRoom.players?.find(p => p.name === playerInfo.name);
  const isHost = localPlayer ? currentRoom.hostId === localPlayer.id : false;
  const canStart = (currentRoom.players?.length ?? 0) >= 2;

  const handleLeave = () => {
    socketService.leaveRoom();
  };

  const handleStart = () => {
    socketService.startGame();
  };

  const handleAddBot = () => {
    socketService.addBot(botDifficulty);
  };

  const handleRemoveBot = (botId: string) => {
    socketService.removeBot(botId);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoom.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAvatarDisplay = (avatarUrl: string, name: string) => {
    if (avatarUrl.startsWith('default:')) {
      const id = avatarUrl.replace('default:', '');
      const def = DEFAULT_AVATARS.find((a) => a.id === id);
      if (def) {
        return (
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner border-2 border-white/20"
            style={{ background: def.color }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        );
      }
    }
    return (
      <img src={avatarUrl} alt={name} className="w-full h-full rounded-full object-cover shadow-inner border-2 border-white/20" />
    );
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col font-sans"
      style={{
        backgroundColor: '#1a1a1a',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.03) 1px, rgba(255,255,255,0.03) 2px)'
      }}
    >
      {/* Top Nav */}
      <div className="flex justify-end items-center w-full px-6 py-4 gap-3">
        <button 
          onClick={handleLeave} 
          className="px-4 py-1.5 rounded-full border-2 border-white/80 bg-black/50 text-white font-medium hover:bg-white hover:text-black transition-colors text-sm flex items-center gap-2 shadow-lg"
        >
          Leave Room
        </button>
        <button className="px-4 py-1.5 rounded-full border-2 border-white/80 bg-black/50 text-white font-medium hover:bg-white hover:text-black transition-colors text-sm flex items-center gap-2 shadow-lg">
          <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">New</span> News
        </button>
        <button className="px-4 py-1.5 rounded-full border-2 border-white/80 bg-black/50 text-white font-medium hover:bg-white hover:text-black transition-colors text-sm flex items-center gap-2 shadow-lg">
          🔖 Rules
        </button>
        <button className="px-4 py-1.5 rounded-full border-2 border-white/80 bg-black/50 text-white font-medium hover:bg-white hover:text-black transition-colors text-sm flex items-center gap-2 shadow-lg">
          ⚙️ Settings
        </button>
      </div>

      {/* Title */}
      <div className="flex items-center justify-center gap-3 mb-6 mt-2">
        <span className="text-white font-black text-2xl tracking-wide">{currentRoom.name}</span>
        <span className="text-white/60">👁️</span>
        <button className="px-4 py-1 rounded-full border border-white/40 text-white text-sm hover:bg-white/10 bg-black/40 transition-colors">
          Join Spectators
        </button>
      </div>

      {/* Main Grid */}
      <div className="flex-1 flex flex-col xl:flex-row items-stretch justify-center gap-6 w-full max-w-[1500px] mx-auto px-6 pb-12">
        
        {/* LEFT PANEL: THE COURT (Blue) */}
        <div className="w-full xl:w-[320px] shrink-0 flex flex-col gap-3">
          <div className="bg-gradient-to-b from-[#3a3a3a] to-[#222222] rounded-full border-2 border-[#555] py-2 text-center font-bold text-white shadow-xl tracking-wider text-sm">
            THE COURT
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 bg-gradient-to-b from-[#3eb1ff] to-[#0b64e1] rounded-3xl border-4 border-white/95 p-3 shadow-2xl flex flex-col relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
            <div className="bg-[#1281fb]/50 rounded-t-2xl border border-white/20 text-center py-1.5 font-bold text-white text-sm mb-4 uppercase tracking-wider shadow-inner">
              Players
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 relative z-10 px-2">
              {(currentRoom.players || []).map((player, i) => (
                <motion.div 
                  key={player.id} 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 * i, type: 'spring' }}
                  className="flex flex-col items-center gap-1 group relative"
                >
                  <div className="w-20 h-20 rounded-full border-4 border-white/90 shadow-[0_4px_10px_rgba(0,0,0,0.3)] bg-[#0b64e1] flex items-center justify-center overflow-hidden">
                    {getAvatarDisplay(player.avatarUrl, player.name)}
                  </div>
                  
                  {/* Name Pill */}
                  <div className="bg-[#0b48a3] border-2 border-white/80 rounded-full px-3 py-0.5 shadow-md -mt-3 z-10 relative">
                    <span className="text-white font-bold text-sm truncate max-w-[80px] block text-center">
                      {player.name}
                    </span>
                  </div>

                  {player.id === currentRoom.hostId && (
                    <span className="absolute -top-2 -left-2 text-xl drop-shadow-md z-20" title="Host">👑</span>
                  )}
                  
                  {/* Remove bot button for host */}
                  {isHost && player.isBot && (
                    <button 
                      onClick={() => handleRemoveBot(player.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full font-bold text-xs border-2 border-white shadow-md hover:bg-red-600 z-20"
                      title="Remove Bot"
                    >
                      ×
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Empty slots remaining */}
            <div className="mt-4 text-center relative z-10">
               <p className="text-white/70 font-medium text-sm">
                 {currentRoom.maxPlayers - (currentRoom.players?.length ?? 0)} slots remaining
               </p>
            </div>
            
            {/* Join Team Button (Just visual match to screenshot) */}
            <div className="mt-auto pt-6 pb-2 relative z-10">
              <button 
                className="w-full py-3 rounded-full border-2 border-white/40 bg-white/10 hover:bg-white/20 text-white font-bold tracking-widest uppercase transition-all shadow-inner text-sm"
              >
                Waiting For Players
              </button>
            </div>
          </motion.div>
        </div>

        {/* CENTER PANEL: GAME SETTINGS (Dark Gray) */}
        <div className="flex-1 min-w-[320px] max-w-[850px] bg-[#3a3a3a] rounded-[32px] border-[5px] border-[#222] shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-8 flex flex-col items-center relative overflow-hidden">
          
          <h2 className="text-white font-bold text-xl mb-8 relative z-10 tracking-widest uppercase">GAME SETTINGS</h2>
          
          <div className="w-full max-w-[650px] space-y-5 relative z-10">
            
            {/* Invite Code Row */}
            <div className="w-full flex h-16 shadow-[0_4px_10px_rgba(0,0,0,0.3)] rounded-xl overflow-hidden">
              <div className="bg-[#d2b694] w-28 flex flex-col items-center justify-center font-black text-[#4a3b2b] text-[10px] tracking-widest border-r border-black/20">
                <span>INVITE</span>
                <span>CODE</span>
              </div>
              <div className="flex-1 bg-black/40 p-4 flex items-center justify-between">
                <span className="text-2xl font-mono text-white font-bold tracking-widest">{currentRoom.inviteCode}</span>
                <button 
                  onClick={handleCopyCode} 
                  className="text-sm font-bold text-white/80 hover:text-white px-4 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors uppercase"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Bots Row */}
            <div className="w-full flex h-20 shadow-[0_4px_10px_rgba(0,0,0,0.3)] rounded-xl overflow-hidden bg-black/40 items-center justify-between p-5 border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-[#555] flex items-center justify-center text-2xl bg-[#333]">🤖</div>
                <div>
                  <div className="font-bold text-white tracking-widest">AI BOTS</div>
                  <div className="text-xs text-white/50 uppercase mt-0.5">Fill empty slots with bots</div>
                </div>
              </div>
              {isHost ? (
                <div className="flex items-center gap-3">
                  <select 
                    value={botDifficulty} 
                    onChange={(e) => setBotDifficulty(e.target.value as BotDifficulty)} 
                    className="bg-black/60 text-white font-medium rounded-lg px-3 py-2 outline-none border border-white/10 hover:border-white/30 transition-colors cursor-pointer"
                  >
                    {Object.values(BotDifficulty).map((d) => (
                      <option key={d} value={d} className="bg-[#222]">{d}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleAddBot} 
                    disabled={(currentRoom.players?.length ?? 0) >= currentRoom.maxPlayers}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold tracking-wider transition-colors border border-white/10"
                  >
                    ADD
                  </button>
                </div>
              ) : (
                <div className="text-sm font-medium text-white/40 bg-black/30 px-4 py-2 rounded-lg">Host Only</div>
              )}
            </div>

            {/* General Info Row */}
            <div className="w-full flex h-20 shadow-[0_4px_10px_rgba(0,0,0,0.3)] rounded-xl overflow-hidden bg-black/40 items-center gap-4 p-5 border border-white/5">
              <div className="w-12 h-12 rounded-full border-2 border-[#555] flex items-center justify-center text-2xl bg-[#333]">⏱️</div>
              <div>
                <div className="font-bold text-white tracking-widest">TURN TIMER</div>
                <div className="text-xs text-white/50 uppercase mt-0.5">120 SECONDS</div>
              </div>
              
              <div className="w-px h-10 bg-white/10 mx-4"></div>
              
              <div className="w-12 h-12 rounded-full border-2 border-[#555] flex items-center justify-center text-2xl bg-[#333]">👥</div>
              <div>
                <div className="font-bold text-white tracking-widest">MAX PLAYERS</div>
                <div className="text-xs text-white/50 uppercase mt-0.5">{currentRoom.maxPlayers} PLAYERS</div>
              </div>
            </div>

          </div>

          {/* Start Buttons */}
          <div className="mt-auto pt-8 flex gap-4 relative z-10 w-full max-w-[650px] justify-center">
            <button className="px-6 py-3 rounded-full border-2 border-white/20 text-white/60 font-bold hover:bg-white/5 transition-colors uppercase text-sm tracking-widest">
              Game Rules
            </button>
            {isHost && (
              <button 
                onClick={handleStart} 
                disabled={!canStart} 
                className={`px-10 py-3 rounded-full font-black text-lg tracking-widest uppercase transition-all shadow-[0_4px_0_rgb(0,0,0,0.5)] border-2 border-white/20
                  ${canStart 
                    ? 'bg-gradient-to-b from-[#22c55e] to-[#15803d] text-white hover:from-[#16a34a] hover:to-[#166534] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none' 
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-80 shadow-none'}`}
              >
                {canStart ? 'START GAME' : 'WAITING...'}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: CHAT (Red) */}
        <div className="w-full xl:w-[320px] shrink-0 flex flex-col gap-3">
          <div className="bg-gradient-to-b from-[#3a3a3a] to-[#222222] rounded-full border-2 border-[#555] py-2 text-center font-bold text-white shadow-xl tracking-wider text-sm uppercase">
            COMMUNICATION
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 bg-gradient-to-b from-[#ff6b3d] to-[#d61e1e] rounded-3xl border-4 border-white/95 p-3 shadow-2xl flex flex-col relative overflow-hidden min-h-[400px]"
          >
            <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
            <div className="bg-[#ff4921]/50 rounded-t-2xl border border-white/20 text-center py-1.5 font-bold text-white text-sm mb-2 uppercase tracking-wider shadow-inner">
              Lobby Chat
            </div>
            
            {/* The actual chat panel container */}
            <div className="flex-1 bg-black/30 rounded-xl overflow-hidden flex flex-col relative z-10 border border-white/10">
               <ChatPanel roomId={currentRoom.id} />
            </div>

            {/* Bottom button just for visual balance */}
            <div className="mt-4 pb-2 relative z-10">
              <button className="w-full py-3 rounded-full border-2 border-white/40 bg-[#d61e1e] hover:bg-[#b91818] text-white font-bold tracking-widest uppercase transition-all shadow-inner text-sm">
                JOIN VOICE (SOON)
              </button>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { socketService } from '../../services/socketService';
import { Button } from '../ui/Button';
import { ChatPanel } from '../game/ChatPanel';
import { BotDifficulty } from '../../types';
import { DEFAULT_AVATARS } from '../../utils/constants';

export const RoomSetup: React.FC = () => {
  const navigate = useNavigate();
  const { currentRoom, playerInfo, gameState } = useGameStore();
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>(BotDifficulty.Medium);
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(false);

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
            className="w-full h-full rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: def.color }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        );
      }
    }
    return (
      <img src={avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" />
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl flex items-center justify-between mb-8"
      >
        <Button variant="ghost" size="sm" onClick={handleLeave}>
          ← Leave Room
        </Button>
        <h2 className="text-xl font-bold text-white">{currentRoom.name}</h2>
        <Button variant="ghost" size="sm" onClick={() => setShowChat(!showChat)}>
          💬 Chat
        </Button>
      </motion.div>

      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Invite Code */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-subtle p-4 mb-6 flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-slate-400 mb-1">Invite Code</p>
              <p className="text-2xl font-mono font-bold tracking-widest text-purple-300">
                {currentRoom.inviteCode}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCopyCode}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </Button>
          </motion.div>

          {/* Players Circle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass p-8 mb-6"
          >
            <h3 className="text-sm font-medium text-slate-400 mb-6 text-center">
              Players ({currentRoom.players?.length ?? 0}/{currentRoom.maxPlayers})
            </h3>

            <div className="flex flex-wrap justify-center gap-6">
              {(currentRoom.players || []).map((player, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i, type: 'spring' }}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className={`w-16 h-16 rounded-full overflow-hidden border-2 ${
                      player.id === currentRoom.hostId
                        ? 'border-gold-400 ring-2 ring-yellow-400/30'
                        : 'border-purple-500/30'
                    }`}
                    style={
                      player.id === currentRoom.hostId
                        ? { borderColor: '#fbbf24' }
                        : {}
                    }
                  >
                    {getAvatarDisplay(player.avatarUrl, player.name)}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">
                      {player.name}
                    </p>
                    <div className="flex items-center gap-1 justify-center">
                      {player.id === currentRoom.hostId && (
                        <span className="text-xs text-yellow-400">👑 Host</span>
                      )}
                      {player.isBot && (
                        <span className="text-xs text-blue-400">🤖 Bot</span>
                      )}
                    </div>
                  </div>
                  {isHost && player.isBot && (
                    <button
                      onClick={() => handleRemoveBot(player.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </motion.div>
              ))}

              {/* Empty slots */}
              {Array.from({
                length: currentRoom.maxPlayers - (currentRoom.players?.length ?? 0),
              }).map((_, i) => (
                <div key={`empty-${i}`} className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                    <span className="text-slate-600 text-2xl">+</span>
                  </div>
                  <p className="text-sm text-slate-600">Waiting...</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Host Controls */}
          {isHost && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              {/* Add Bot */}
              {(currentRoom.players?.length ?? 0) < currentRoom.maxPlayers && (
                <div className="glass-subtle p-4 flex items-center gap-3">
                  <select
                    value={botDifficulty}
                    onChange={(e) =>
                      setBotDifficulty(e.target.value as BotDifficulty)
                    }
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                               focus:outline-none appearance-none flex-1"
                  >
                    {Object.values(BotDifficulty).map((d) => (
                      <option key={d} value={d} className="bg-slate-800">
                        🤖 {d} Bot
                      </option>
                    ))}
                  </select>
                  <Button variant="secondary" size="sm" onClick={handleAddBot}>
                    Add Bot
                  </Button>
                </div>
              )}

              {/* Start Game */}
              <Button
                variant="primary"
                size="lg"
                className={`w-full ${canStart ? 'animate-pulse-glow' : ''}`}
                disabled={!canStart}
                onClick={handleStart}
              >
                {canStart ? '🎮 Start Game' : `Need ${2 - (currentRoom.players?.length ?? 0)} more players`}
              </Button>
            </motion.div>
          )}

          {!isHost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass-subtle p-6 text-center"
            >
              <p className="text-slate-300">
                Waiting for the host to start the game...
              </p>
              <div className="flex justify-center mt-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-purple-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Room Settings */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 glass-subtle p-4"
          >
            <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
              Room Settings
            </h4>
            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
              <span>👥 Max {currentRoom.maxPlayers} players</span>
              <span>⏱️ {currentRoom.settings?.turnTimer ?? 30}s timer</span>
              <span>
                {currentRoom.isPrivate ? '🔒 Private' : '🌐 Public'}
              </span>
            </div>
          </motion.div>

          {/* Spectators */}
          {(currentRoom.spectators?.length ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 glass-subtle p-4"
            >
              <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                Spectators ({currentRoom.spectators?.length ?? 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {(currentRoom.spectators || []).map((spec) => (
                  <span
                    key={spec.id}
                    className="text-sm text-slate-400 bg-white/5 px-2 py-1 rounded-lg"
                  >
                    👁️ {spec.name}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-80"
          >
            <ChatPanel roomId={currentRoom.id} />
          </motion.div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { socketService } from '../../services/socketService';
import { Button } from '../ui/Button';
import { RoomSetup } from './RoomSetup';
import { RoomListItem, RoomSettings } from '../../types';

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { playerInfo, availableRooms, currentRoom, connected } = useGameStore();
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [turnTimer, setTurnTimer] = useState(30);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showJoinCode, setShowJoinCode] = useState(false);

  useEffect(() => {
    if (!playerInfo) {
      navigate('/coup');
      return;
    }
    if (connected) {
      socketService.joinLobby(playerInfo.name, playerInfo.avatarUrl);
    }
  }, [playerInfo, connected, navigate]);

  // If we're in a room, show room setup
  if (currentRoom) {
    return <RoomSetup />;
  }

  const handleCreate = () => {
    if (!playerInfo || !roomName.trim()) return;
    const settings: RoomSettings = {
      maxPlayers,
      turnTimer,
      isPrivate,
      password: isPrivate ? password : undefined,
    };
    socketService.createRoom({
      playerName: playerInfo.name,
      avatarUrl: playerInfo.avatarUrl,
      roomName: roomName.trim(),
      settings,
    });
    setShowCreate(false);
  };

  const handleJoin = (room: RoomListItem) => {
    if (!playerInfo) return;
    socketService.joinRoom({
      playerName: playerInfo.name,
      avatarUrl: playerInfo.avatarUrl,
      roomId: room.id,
    });
  };

  const handleJoinByCode = () => {
    if (!playerInfo || !joinCode.trim()) return;
    socketService.joinRoomByCode({
      playerName: playerInfo.name,
      avatarUrl: playerInfo.avatarUrl,
      inviteCode: joinCode.trim(),
    });
    setShowJoinCode(false);
    setJoinCode('');
  };

  const handleQuickPlay = () => {
    if (!playerInfo) return;
    
    // Always create a bot game for Quick Play
    const settings: RoomSettings = {
      maxPlayers: 4,
      turnTimer: 30,
      isPrivate: false,
    };
    socketService.quickPlayWithBots({
      playerName: playerInfo.name,
      avatarUrl: playerInfo.avatarUrl,
      roomName: `${playerInfo.name}'s Bot Game`,
      settings,
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4 mb-8"
      >
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-bold gradient-text cursor-pointer"
            onClick={() => navigate('/')}
          >
            COUP
          </h1>
          <div className="flex items-center gap-2 glass-subtle px-3 py-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <span className="text-sm text-slate-300">{playerInfo?.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowJoinCode(true)}
          >
            Join by Code
          </Button>
          <Button variant="primary" size="sm" onClick={handleQuickPlay}>
            ⚡ Quick Play
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        {/* Room List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Available Rooms
            </h2>
            <span className="text-sm text-slate-500">
              {availableRooms.length} room
              {availableRooms.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {availableRooms.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-subtle p-8 text-center"
                >
                  <p className="text-slate-400 text-lg mb-2">No rooms yet</p>
                  <p className="text-slate-500 text-sm">
                    Create a room or use Quick Play to get started!
                  </p>
                </motion.div>
              )}

              {availableRooms.map((room) => (
                <motion.div
                  key={room.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-subtle p-4 flex items-center justify-between
                             hover:border-purple-500/30 transition-all group cursor-pointer"
                  onClick={() => !room.gameStarted && handleJoin(room)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                        {room.name}
                      </span>
                      {room.isPrivate && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                          🔒 Private
                        </span>
                      )}
                      {room.gameStarted && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                          In Game
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      Host: {room.hostName} · {room.playerCount}/
                      {room.maxPlayers} players
                    </p>
                  </div>

                  {!room.gameStarted &&
                    room.playerCount < room.maxPlayers && (
                      <Button variant="primary" size="sm">
                        Join
                      </Button>
                    )}
                  {room.gameStarted && (
                    <Button variant="ghost" size="sm">
                      👁️ Watch
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Create Room Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full lg:w-96"
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            Create Room
          </h2>

          <div className="glass p-6 space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="My Awesome Game"
                maxLength={30}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50
                           focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  Max Players
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white
                             focus:outline-none focus:border-purple-500/50 transition-all appearance-none"
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n} className="bg-slate-800">
                      {n} players
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">
                  Turn Timer
                </label>
                <select
                  value={turnTimer}
                  onChange={(e) => setTurnTimer(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white
                             focus:outline-none focus:border-purple-500/50 transition-all appearance-none"
                >
                  {[15, 30, 45, 60, 90].map((n) => (
                    <option key={n} value={n} className="bg-slate-800">
                      {n}s
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isPrivate ? 'bg-purple-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    isPrivate ? 'translate-x-5' : ''
                  }`}
                />
              </button>
              <span className="text-sm text-slate-300">Private Room</span>
            </div>

            <AnimatePresence>
              {isPrivate && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-sm text-slate-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Room password"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white
                               placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50
                               focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleCreate}
              disabled={!roomName.trim()}
            >
              Create Room
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Join by Code Modal */}
      <AnimatePresence>
        {showJoinCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowJoinCode(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative glass-strong p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-bold text-white mb-4">
                Join by Invite Code
              </h3>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter code..."
                maxLength={8}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           text-center text-xl tracking-widest font-mono
                           placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50
                           transition-all mb-4"
              />
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowJoinCode(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleJoinByCode}
                  disabled={!joinCode.trim()}
                >
                  Join
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

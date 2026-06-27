import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { socketService } from '../../services/socketService';
import { Button } from '../ui/Button';
import { DEFAULT_AVATARS } from '../../utils/constants';

interface UploadedAvatar {
  id: string;
  url: string;
  name: string;
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { playerInfo, setPlayerInfo } = useGameStore();
  const [name, setName] = useState(playerInfo?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(playerInfo?.avatarUrl || '');
  const [uploadedAvatars, setUploadedAvatars] = useState<UploadedAvatar[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/avatars')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setUploadedAvatars(data))
      .catch(() => setUploadedAvatars([]));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    const avatar = selectedAvatar || `default:${DEFAULT_AVATARS[0].id}`;
    const info = {
      id: socketService.getSocketId() || crypto.randomUUID(),
      name: name.trim(),
      avatarUrl: avatar,
    };
    setPlayerInfo(info);
    socketService.joinLobby(info.name, info.avatarUrl);
    setTimeout(() => navigate('/coup/lobby'), 300);
  };

  const getAvatarDisplay = (avatarUrl: string) => {
    if (avatarUrl.startsWith('default:')) {
      const id = avatarUrl.replace('default:', '');
      const def = DEFAULT_AVATARS.find((a) => a.id === id);
      if (def) {
        return (
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: def.color }}
          >
            {def.initials}
          </div>
        );
      }
    }
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        className="w-full h-full rounded-full object-cover"
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Floating card silhouettes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-16 h-24 rounded-lg border border-purple-500/10 bg-purple-500/5"
            style={{
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [-5 + i * 3, 5 - i * 2, -5 + i * 3],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 5 + i * 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center mb-10"
      >
        <h1 className="text-7xl md:text-9xl font-black tracking-wider gradient-text mb-4 select-none">
          COUP
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg md:text-xl text-slate-400 font-light tracking-wide"
        >
          Master the art of deception
        </motion.p>
      </motion.div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        onSubmit={handleSubmit}
        className="w-full max-w-md glass p-8 space-y-6"
      >
        {/* Name Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={20}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                       placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50
                       focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>

        {/* Avatar Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Choose Avatar
          </label>

          {/* Uploaded avatars */}
          {uploadedAvatars.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 mb-2">Custom Avatars</p>
              <div className="grid grid-cols-6 gap-2">
                {uploadedAvatars.map((av) => (
                  <motion.button
                    key={av.id}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedAvatar(av.url)}
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all
                      ${selectedAvatar === av.url
                        ? 'border-purple-400 ring-2 ring-purple-400/30'
                        : 'border-white/10 hover:border-white/30'
                      }`}
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Default avatars */}
          <div>
            {uploadedAvatars.length > 0 && (
              <p className="text-xs text-slate-500 mb-2">Default Avatars</p>
            )}
            <div className="grid grid-cols-6 gap-2">
              {DEFAULT_AVATARS.map((av) => {
                const avatarUrl = `default:${av.id}`;
                return (
                  <motion.button
                    key={av.id}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedAvatar(avatarUrl)}
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all
                      ${selectedAvatar === avatarUrl
                        ? 'border-purple-400 ring-2 ring-purple-400/30'
                        : 'border-white/10 hover:border-white/30'
                      }`}
                  >
                    {getAvatarDisplay(avatarUrl)}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          disabled={!name.trim()}
          className="w-full animate-pulse-glow"
        >
          Enter Lobby
        </Button>
      </motion.form>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8"
      >
        <button 
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors"
        >
          ← Back to Hub
        </button>
      </motion.div>
    </div>
  );
};

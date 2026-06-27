import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface DashboardStats {
  activeGames: number;
  playersOnline: number;
  totalGamesPlayed: number;
}

interface AdminDashboardProps {
  token: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token }) => {
  const [stats, setStats] = useState<DashboardStats>({
    activeGames: 0,
    playersOnline: 0,
    totalGamesPlayed: 0,
  });
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('offline');

  const fetchStats = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_SERVER_URL || '') + '/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const statCards = [
    {
      label: 'Active Games',
      value: stats.activeGames,
      icon: '🎮',
      color: 'from-purple-500/20 to-purple-600/10',
    },
    {
      label: 'Players Online',
      value: stats.playersOnline,
      icon: '👥',
      color: 'from-blue-500/20 to-blue-600/10',
    },
    {
      label: 'Total Games Played',
      value: stats.totalGamesPlayed,
      icon: '📊',
      color: 'from-green-500/20 to-green-600/10',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              serverStatus === 'online'
                ? 'bg-green-400 animate-pulse'
                : 'bg-red-400'
            }`}
          />
          <span className="text-sm text-slate-400">
            Server {serverStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`dashboard-panel p-6 bg-gradient-to-br ${stat.color}`}
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <p className="text-3xl font-bold text-white mb-1">
              {stat.value}
            </p>
            <p className="text-sm text-slate-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-panel p-4">
        <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">
          Server Info
        </h3>
        <div className="space-y-2 text-sm text-slate-300">
          <p>
            Status:{' '}
            <span
              className={
                serverStatus === 'online' ? 'text-green-400' : 'text-red-400'
              }
            >
              {serverStatus}
            </span>
          </p>
          <p>Refresh interval: 10s</p>
        </div>
      </div>
    </div>
  );
};

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
  const [rooms, setRooms] = useState<any[]>([]);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('offline');

  const fetchData = async () => {
    try {
      const statsRes = await fetch('https://coup-backend-lywm.onrender.com' + '/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const roomsRes = await fetch('https://coup-backend-lywm.onrender.com' + '/api/admin/rooms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (statsRes.ok && roomsRes.ok) {
        const statsData = await statsRes.json();
        const roomsData = await roomsRes.json();
        setStats(statsData);
        setRooms(roomsData);
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      const res = await fetch(`https://coup-backend-lywm.onrender.com/api/admin/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete room');
      }
    } catch (err: any) {
      alert('Error deleting room: ' + err.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
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

      <div className="dashboard-panel p-4 mb-8">
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

      <div className="dashboard-panel overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            Active Rooms ({rooms.length})
          </h3>
          <button 
            onClick={fetchData}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Refresh
          </button>
        </div>
        
        {rooms.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No active rooms.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Room Name</th>
                  <th className="px-4 py-3">Host</th>
                  <th className="px-4 py-3">Players</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{room.name}</td>
                    <td className="px-4 py-3">{room.hostName}</td>
                    <td className="px-4 py-3">
                      {room.playersOnline} online / {room.playerCount} total
                      <br/>
                      <span className="text-xs text-slate-500">(Max {room.maxPlayers})</span>
                    </td>
                    <td className="px-4 py-3">
                      {room.gameStarted ? (
                        <span className="text-green-400">In Game</span>
                      ) : (
                        <span className="text-yellow-400">Waiting</span>
                      )}
                      {room.isPrivate && <span className="ml-2 text-slate-400">🔒</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleDeleteRoom(room.id)}
                        className="text-red-400 hover:text-red-300 px-3 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

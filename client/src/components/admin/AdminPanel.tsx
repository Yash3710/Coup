import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { CharacterEditor } from './CharacterEditor';
import { AvatarManager } from './AvatarManager';
import { CardArtManager } from './CardArtManager';

type AdminTab = 'dashboard' | 'characters' | 'avatars' | 'cardart';

export const AdminPanel: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  if (!token) {
    return <AdminLogin onLogin={(t) => setToken(t)} />;
  }

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'characters', label: 'Characters', icon: '🎭' },
    { id: 'avatars', label: 'Avatars', icon: '🖼️' },
    { id: 'cardart', label: 'Card Art', icon: '🎨' },
  ];

  const handleLogout = () => {
    setToken(null);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-56 bg-[#1e293b] border-r border-slate-700 p-4 flex flex-col"
      >
        <h1 className="text-lg font-bold text-white mb-6 tracking-widest">
          TERRIT ADMIN
        </h1>

        <nav className="space-y-1 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all
                ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400 font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 mt-4"
        >
          <span>🚪</span> Logout
        </button>
      </motion.div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && <AdminDashboard token={token} />}
          {activeTab === 'characters' && <CharacterEditor token={token} />}
          {activeTab === 'avatars' && <AvatarManager token={token} />}
          {activeTab === 'cardart' && <CardArtManager token={token} />}
        </motion.div>
      </div>
    </div>
  );
};

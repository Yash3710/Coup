import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';

interface AdminLoginProps {
  onLogin: (token: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('https://coup-backend-lywm.onrender.com' + '/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const data = await res.json();
        onLogin(data.token);
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="dashboard-panel p-8 w-full max-w-sm"
      >
        <h2 className="text-xl font-bold text-white text-center mb-6">
          🔐 Admin Login
        </h2>

        <div className="mb-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded text-white
                       placeholder:text-slate-500 focus:outline-none focus:border-blue-500
                       focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm mt-2"
            >
              {error}
            </motion.p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full btn-primary py-3 font-bold uppercase tracking-wider"
        >
          {loading ? 'Authenticating...' : 'Enter'}
        </button>
      </motion.form>
    </div>
  );
};

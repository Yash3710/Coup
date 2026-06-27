import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Character, CHARACTER_DEFINITIONS, AdminCharacterConfig } from '../../types';
import { CHARACTER_EMOJIS } from '../../utils/constants';
import { Button } from '../ui/Button';

interface CharacterEditorProps {
  token: string;
}

export const CharacterEditor: React.FC<CharacterEditorProps> = ({ token }) => {
  const [characters, setCharacters] = useState<AdminCharacterConfig[]>(
    Object.values(CHARACTER_DEFINITIONS).map((cd) => ({
      character: cd.character,
      name: cd.name,
      description: cd.description,
      activeAbility: cd.activeAbility,
      blockAbility: cd.blockAbility,
    }))
  );
  const [saving, setSaving] = useState<Character | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/characters', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data)) {
          setCharacters(data);
        }
      })
      .catch(() => {});
  }, [token]);

  const updateField = (
    char: Character,
    field: keyof AdminCharacterConfig,
    value: string
  ) => {
    setCharacters((prev) =>
      prev.map((c) =>
        c.character === char ? { ...c, [field]: value } : c
      )
    );
  };

  const handleSave = async (char: AdminCharacterConfig) => {
    setSaving(char.character);
    setMessage('');

    try {
      const res = await fetch(`/api/admin/characters/${char.character}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(char),
      });

      if (res.ok) {
        setMessage(`${char.name} saved!`);
      } else {
        setMessage('Failed to save');
      }
    } catch {
      setMessage('Connection error');
    } finally {
      setSaving(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">
        Character Editor
      </h2>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-panel-subtle p-3 mb-4 text-sm text-green-300 border border-green-500/20"
        >
          {message}
        </motion.div>
      )}

      <div className="space-y-4">
        {characters.map((char, i) => (
          <motion.div
            key={char.character}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="dashboard-panel p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">
                {CHARACTER_EMOJIS[char.character]}
              </span>
              <h3 className="text-lg font-bold text-white">{char.name}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={char.name}
                  onChange={(e) =>
                    updateField(char.character, 'name', e.target.value)
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded text-white text-sm
                             focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={char.description}
                  onChange={(e) =>
                    updateField(
                      char.character,
                      'description',
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded text-white text-sm
                             focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Active Ability
                </label>
                <input
                  type="text"
                  value={char.activeAbility}
                  onChange={(e) =>
                    updateField(
                      char.character,
                      'activeAbility',
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded text-white text-sm
                             focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Block Ability
                </label>
                <input
                  type="text"
                  value={char.blockAbility}
                  onChange={(e) =>
                    updateField(
                      char.character,
                      'blockAbility',
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded text-white text-sm
                             focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              className="btn-primary text-sm px-4 py-2"
              disabled={saving === char.character}
              onClick={() => handleSave(char)}
            >
              {saving === char.character ? 'Saving...' : `💾 Save ${char.name}`}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

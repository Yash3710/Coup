import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Character, CHARACTER_DEFINITIONS } from '../../types';
import { CHARACTER_EMOJIS, CHARACTER_COLORS } from '../../utils/constants';
import { Button } from '../ui/Button';

interface CardArt {
  character: Character;
  imageUrl: string | null;
}

interface CardArtManagerProps {
  token: string;
}

export const CardArtManager: React.FC<CardArtManagerProps> = ({ token }) => {
  const [cardArts, setCardArts] = useState<CardArt[]>(
    Object.values(Character).map((c) => ({ character: c, imageUrl: null }))
  );
  const [uploading, setUploading] = useState<Character | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch('https://coup-backend-lywm.onrender.com' + '/api/admin/characters', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setCardArts(data.map((c: any) => ({
            character: c.character,
            imageUrl: c.cardImageUrl || null
          })));
        }
      })
      .catch(() => {});
  }, [token]);

  const handleFileSelect = (character: Character, file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews((prev) => ({
        ...prev,
        [character]: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (character: Character) => {
    const input = fileRefs.current[character];
    const file = input?.files?.[0];
    if (!file) return;

    setUploading(character);
    try {
      const formData = new FormData();
      formData.append('card', file); // changed 'image' to 'card'
      formData.append('character', character);

      const res = await fetch('https://coup-backend-lywm.onrender.com' + '/api/admin/upload/card', { // changed endpoint
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const imageUrl = data.url;

        // Now save this to the character config
        await fetch('https://coup-backend-lywm.onrender.com' + '/api/admin/characters', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify([{ character, cardImageUrl: imageUrl }]),
        });

        setCardArts((prev) =>
          prev.map((c) =>
            c.character === character
              ? { ...c, imageUrl }
              : c
          )
        );
        setPreviews((prev) => {
          const next = { ...prev };
          delete next[character];
          return next;
        });
      } else {
        const errorData = await res.json();
        alert('Upload failed: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error: any) {
      alert('Upload request failed: ' + error.message);
    }
    setUploading(null);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Card Art Manager</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cardArts.map((art, i) => {
          const def = CHARACTER_DEFINITIONS[art.character];
          const previewUrl = previews[art.character];

          return (
            <motion.div
              key={art.character}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="dashboard-panel p-4"
            >
              {/* Character header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">
                  {CHARACTER_EMOJIS[art.character]}
                </span>
                <h3 className="font-bold text-white">{def.name}</h3>
                <div
                  className="w-3 h-3 rounded-full ml-auto"
                  style={{
                    background: CHARACTER_COLORS[art.character],
                  }}
                />
              </div>

              {/* Card art preview */}
              <div
                className="w-full aspect-[2/3] rounded-lg mb-3 overflow-hidden border border-white/10
                           flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${CHARACTER_COLORS[art.character]}40, ${CHARACTER_COLORS[art.character]}10)`,
                }}
              >
                {previewUrl || art.imageUrl ? (
                  <img
                    src={previewUrl || art.imageUrl || ''}
                    alt={def.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <span className="text-4xl block mb-2">
                      {CHARACTER_EMOJIS[art.character]}
                    </span>
                    <p className="text-xs text-slate-500">No custom art</p>
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="flex gap-2">
                <input
                  ref={(el) => {
                    fileRefs.current[art.character] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleFileSelect(art.character, e.target.files[0])
                  }
                />
                <button
                  className="flex-1 btn-secondary text-sm py-2"
                  onClick={() =>
                    fileRefs.current[art.character]?.click()
                  }
                >
                  Choose Image
                </button>
                {previewUrl && (
                  <button
                    className="flex-1 btn-primary text-sm py-2"
                    disabled={uploading === art.character}
                    onClick={() => handleUpload(art.character)}
                  >
                    {uploading === art.character ? '...' : 'Upload'}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

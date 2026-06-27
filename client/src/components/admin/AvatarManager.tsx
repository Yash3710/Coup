import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarConfig } from '../../types';
import { Button } from '../ui/Button';

interface AvatarManagerProps {
  token: string;
}

export const AvatarManager: React.FC<AvatarManagerProps> = ({ token }) => {
  const [avatars, setAvatars] = useState<AvatarConfig[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchAvatars = async () => {
    try {
      const res = await fetch('/api/avatars');
      if (res.ok) {
        const data = await res.json();
        setAvatars(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchAvatars();
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const res = await fetch('/api/admin/upload/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        setPreview(null);
        setSelectedFile(null);
        fetchAvatars();
      }
    } catch {}
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/avatars/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAvatars((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {}
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Avatar Manager</h2>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`dashboard-panel-subtle p-8 mb-6 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'hover:border-slate-500'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            e.target.files?.[0] && handleFileSelect(e.target.files[0])
          }
        />

        {preview ? (
          <div className="flex flex-col items-center gap-4">
            <img
              src={preview}
              alt="Preview"
              className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
            />
            <div className="flex gap-3">
              <button
                className="btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                  setSelectedFile(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-3">📁</div>
            <p className="text-slate-300 mb-1">
              Drop an image or click to upload
            </p>
            <p className="text-xs text-slate-500">PNG, JPG, GIF up to 2MB</p>
          </>
        )}
      </div>

      {/* Avatar Grid */}
      <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">
        Uploaded Avatars ({avatars.length})
      </h3>

      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        <AnimatePresence>
          {avatars.map((av) => (
            <motion.div
              key={av.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group"
            >
              <img
                src={av.url}
                alt={av.name}
                className="w-full aspect-square rounded-xl object-cover border border-white/10"
              />
              <button
                onClick={() => handleDelete(av.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 text-white rounded-full
                           text-xs flex items-center justify-center opacity-0 group-hover:opacity-100
                           transition-opacity hover:bg-red-500"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {avatars.length === 0 && (
          <p className="col-span-full text-sm text-slate-500 text-center py-8">
            No avatars uploaded yet
          </p>
        )}
      </div>
    </div>
  );
};

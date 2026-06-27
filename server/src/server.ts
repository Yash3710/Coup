import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { Server as SocketIOServer } from 'socket.io';
import { RoomManager } from './rooms/RoomManager';
import { createAdminRouter, createPublicRouter } from './admin/adminRoutes';
import { setupSocketHandlers } from './socket/SocketHandler';

const PORT = parseInt(process.env.PORT || '3001', 10);

// ─── Express App Setup ──────────────────────────────────────────

const app = express();
const httpServer = http.createServer(app);

// CORS — allow all origins for dev
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files ────────────────────────────────────────────────

const uploadsDir = path.resolve(__dirname, '../uploads');

// Ensure uploads directories exist
fs.mkdirSync(path.join(uploadsDir, 'avatars'), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, 'cards'), { recursive: true });

app.use('/uploads', express.static(uploadsDir));

// ─── Room Manager ────────────────────────────────────────────────

const roomManager = new RoomManager();

// ─── Routes ──────────────────────────────────────────────────────

// Admin routes
app.use('/api/admin', createAdminRouter(roomManager));

// Public API routes
app.use('/api', createPublicRouter());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ─── Socket.IO ───────────────────────────────────────────────────

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Setup all socket event handlers
setupSocketHandlers(io, roomManager);

// ─── Serve Frontend in Production ──────────────────────────────

if (process.env.NODE_ENV === 'production') {
  const clientDistDir = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDistDir));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });
}

// ─── Start Server ────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log('');
  console.log('══════════════════════════════════════════════════');
  console.log('  ⚔️  COUP Game Server');
  console.log('══════════════════════════════════════════════════');
  console.log(`  🌐 HTTP:      http://localhost:${PORT}`);
  console.log(`  🔌 Socket.IO: ws://localhost:${PORT}`);
  console.log(`  📁 Uploads:   ${uploadsDir}`);
  console.log(`  🛡️  Admin:     http://localhost:${PORT}/api/admin`);
  console.log(`  ❤️  Health:    http://localhost:${PORT}/health`);
  console.log('══════════════════════════════════════════════════');
  console.log('');
});

export { app, httpServer, io };

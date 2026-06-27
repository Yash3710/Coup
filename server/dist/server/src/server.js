"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const socket_io_1 = require("socket.io");
const RoomManager_1 = require("./rooms/RoomManager");
const adminRoutes_1 = require("./admin/adminRoutes");
const SocketHandler_1 = require("./socket/SocketHandler");
const PORT = parseInt(process.env.PORT || '3001', 10);
// ─── Express App Setup ──────────────────────────────────────────
const app = (0, express_1.default)();
exports.app = app;
const httpServer = http_1.default.createServer(app);
exports.httpServer = httpServer;
// CORS — allow all origins for dev
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Static Files ────────────────────────────────────────────────
const uploadsDir = path_1.default.resolve(__dirname, '../uploads');
// Ensure uploads directories exist
fs_1.default.mkdirSync(path_1.default.join(uploadsDir, 'avatars'), { recursive: true });
fs_1.default.mkdirSync(path_1.default.join(uploadsDir, 'cards'), { recursive: true });
app.use('/uploads', express_1.default.static(uploadsDir));
// ─── Room Manager ────────────────────────────────────────────────
const roomManager = new RoomManager_1.RoomManager();
// ─── Routes ──────────────────────────────────────────────────────
// Admin routes
app.use('/api/admin', (0, adminRoutes_1.createAdminRouter)(roomManager));
// Public API routes
app.use('/api', (0, adminRoutes_1.createPublicRouter)());
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});
// ─── Socket.IO ───────────────────────────────────────────────────
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingTimeout: 30000,
    pingInterval: 10000,
});
exports.io = io;
// Setup all socket event handlers
(0, SocketHandler_1.setupSocketHandlers)(io, roomManager);
// ─── Serve Frontend in Production ──────────────────────────────
if (process.env.NODE_ENV === 'production') {
    const clientDistDir = path_1.default.resolve(__dirname, '../../client/dist');
    app.use(express_1.default.static(clientDistDir));
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(clientDistDir, 'index.html'));
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
//# sourceMappingURL=server.js.map
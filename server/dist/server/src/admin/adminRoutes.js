"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.characterConfigs = void 0;
exports.createAdminRouter = createAdminRouter;
exports.createPublicRouter = createPublicRouter;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const types_1 = require("@shared/types");
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const useCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'yashis2op';
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'coup-admin-secret-token-2026';
// Simple token: just the secret string (for dev). In production use JWT.
function generateAdminToken() {
    return Buffer.from(`${ADMIN_TOKEN_SECRET}:${Date.now()}`).toString('base64');
}
function verifyAdminToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized — missing token.' });
        return;
    }
    const token = authHeader.slice(7);
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        if (!decoded.startsWith(ADMIN_TOKEN_SECRET + ':')) {
            res.status(401).json({ error: 'Unauthorized — invalid token.' });
            return;
        }
        next();
    }
    catch {
        res.status(401).json({ error: 'Unauthorized — invalid token.' });
    }
}
// ─── Multer Setup ────────────────────────────────────────────────
const uploadsDir = path_1.default.resolve(__dirname, '../../uploads');
const avatarStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path_1.default.join(uploadsDir, 'avatars');
        fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    },
});
const cardStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path_1.default.join(uploadsDir, 'cards');
        fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed.'));
    }
};
const uploadAvatar = (0, multer_1.default)({ storage: avatarStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadCard = (0, multer_1.default)({ storage: cardStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
// ─── In-memory character config store ────────────────────────────
exports.characterConfigs = {
    [types_1.Character.Duke]: {
        character: types_1.Character.Duke,
        name: types_1.CHARACTER_DEFINITIONS[types_1.Character.Duke].name,
        description: types_1.CHARACTER_DEFINITIONS[types_1.Character.Duke].description,
        activeAbility: types_1.CHARACTER_DEFINITIONS[types_1.Character.Duke].activeAbility,
        blockAbility: types_1.CHARACTER_DEFINITIONS[types_1.Character.Duke].blockAbility,
    },
    [types_1.Character.Assassin]: {
        character: types_1.Character.Assassin,
        name: types_1.CHARACTER_DEFINITIONS[types_1.Character.Assassin].name,
        description: types_1.CHARACTER_DEFINITIONS[types_1.Character.Assassin].description,
        activeAbility: types_1.CHARACTER_DEFINITIONS[types_1.Character.Assassin].activeAbility,
        blockAbility: types_1.CHARACTER_DEFINITIONS[types_1.Character.Assassin].blockAbility,
    },
    [types_1.Character.Captain]: {
        character: types_1.Character.Captain,
        name: types_1.CHARACTER_DEFINITIONS[types_1.Character.Captain].name,
        description: types_1.CHARACTER_DEFINITIONS[types_1.Character.Captain].description,
        activeAbility: types_1.CHARACTER_DEFINITIONS[types_1.Character.Captain].activeAbility,
        blockAbility: types_1.CHARACTER_DEFINITIONS[types_1.Character.Captain].blockAbility,
    },
    [types_1.Character.Ambassador]: {
        character: types_1.Character.Ambassador,
        name: types_1.CHARACTER_DEFINITIONS[types_1.Character.Ambassador].name,
        description: types_1.CHARACTER_DEFINITIONS[types_1.Character.Ambassador].description,
        activeAbility: types_1.CHARACTER_DEFINITIONS[types_1.Character.Ambassador].activeAbility,
        blockAbility: types_1.CHARACTER_DEFINITIONS[types_1.Character.Ambassador].blockAbility,
    },
    [types_1.Character.Contessa]: {
        character: types_1.Character.Contessa,
        name: types_1.CHARACTER_DEFINITIONS[types_1.Character.Contessa].name,
        description: types_1.CHARACTER_DEFINITIONS[types_1.Character.Contessa].description,
        activeAbility: types_1.CHARACTER_DEFINITIONS[types_1.Character.Contessa].activeAbility,
        blockAbility: types_1.CHARACTER_DEFINITIONS[types_1.Character.Contessa].blockAbility,
    },
};
// ─── Create Router ───────────────────────────────────────────────
function createAdminRouter(roomManager) {
    const router = (0, express_1.Router)();
    // ── Login ──────────────────────────────────────────────────────
    router.post('/login', (req, res) => {
        const { password } = req.body;
        if (password !== ADMIN_PASSWORD) {
            res.status(401).json({ error: 'Invalid password.' });
            return;
        }
        const token = generateAdminToken();
        res.json({ token });
    });
    // ── Protected routes (require admin token) ─────────────────────
    router.get('/characters', verifyAdminToken, (_req, res) => {
        res.json(Object.values(exports.characterConfigs));
    });
    router.put('/characters', verifyAdminToken, (req, res) => {
        const updates = req.body;
        if (!Array.isArray(updates)) {
            res.status(400).json({ error: 'Body must be an array of character configs.' });
            return;
        }
        for (const update of updates) {
            if (!update.character || !exports.characterConfigs[update.character]) {
                continue;
            }
            const existing = exports.characterConfigs[update.character];
            if (update.name !== undefined)
                existing.name = update.name;
            if (update.description !== undefined)
                existing.description = update.description;
            if (update.activeAbility !== undefined)
                existing.activeAbility = update.activeAbility;
            if (update.blockAbility !== undefined)
                existing.blockAbility = update.blockAbility;
            if (update.cardImageUrl !== undefined)
                existing.cardImageUrl = update.cardImageUrl;
        }
        res.json({ message: 'Characters updated.', characters: Object.values(exports.characterConfigs) });
    });
    router.post('/upload/avatar', verifyAdminToken, uploadAvatar.single('avatar'), async (req, res) => {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded.' });
            return;
        }
        try {
            if (useCloudinary) {
                const result = await cloudinary_1.v2.uploader.upload(req.file.path, {
                    folder: 'coup/avatars',
                });
                fs_1.default.unlinkSync(req.file.path); // remove temp file
                res.json({ url: result.secure_url, filename: result.public_id });
            }
            else {
                const url = `/uploads/avatars/${req.file.filename}`;
                res.json({ url, filename: req.file.filename });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Upload failed.' });
        }
    });
    router.post('/upload/card', verifyAdminToken, uploadCard.single('card'), async (req, res) => {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded.' });
            return;
        }
        try {
            if (useCloudinary) {
                const result = await cloudinary_1.v2.uploader.upload(req.file.path, {
                    folder: 'coup/cards',
                });
                fs_1.default.unlinkSync(req.file.path);
                res.json({ url: result.secure_url, filename: result.public_id });
            }
            else {
                const url = `/uploads/cards/${req.file.filename}`;
                res.json({ url, filename: req.file.filename });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Upload failed.' });
        }
    });
    router.get('/avatars', verifyAdminToken, async (_req, res) => {
        try {
            if (useCloudinary) {
                const result = await cloudinary_1.v2.search
                    .expression('folder:coup/avatars')
                    .sort_by('created_at', 'desc')
                    .max_results(50)
                    .execute();
                const avatars = result.resources.map((r) => ({
                    id: r.public_id,
                    url: r.secure_url,
                    name: r.public_id.split('/').pop() || 'Avatar',
                }));
                res.json(avatars);
            }
            else {
                const avatarsDir = path_1.default.join(uploadsDir, 'avatars');
                if (!fs_1.default.existsSync(avatarsDir)) {
                    res.json([]);
                    return;
                }
                const files = fs_1.default.readdirSync(avatarsDir).filter((f) => !f.startsWith('.'));
                const avatars = files.map((filename) => ({
                    id: filename,
                    url: `/uploads/avatars/${filename}`,
                    name: path_1.default.parse(filename).name,
                }));
                res.json(avatars);
            }
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed to list avatars.' });
        }
    });
    router.delete('/avatars/:id(*)', verifyAdminToken, async (req, res) => {
        try {
            const id = req.params.id; // Could be a filename OR a Cloudinary public_id like 'coup/avatars/xyz'
            if (useCloudinary && id.startsWith('coup/')) {
                await cloudinary_1.v2.uploader.destroy(id);
                res.json({ message: 'Avatar deleted from Cloudinary.' });
                return;
            }
            // Local deletion
            const filePath = path_1.default.join(uploadsDir, 'avatars', id);
            // Security: prevent path traversal
            const resolved = path_1.default.resolve(filePath);
            if (!resolved.startsWith(path_1.default.resolve(path_1.default.join(uploadsDir, 'avatars')))) {
                res.status(400).json({ error: 'Invalid filename.' });
                return;
            }
            if (!fs_1.default.existsSync(filePath)) {
                res.status(404).json({ error: 'Avatar not found.' });
                return;
            }
            fs_1.default.unlinkSync(filePath);
            res.json({ message: 'Avatar deleted.' });
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Failed to delete.' });
        }
    });
    router.get('/stats', verifyAdminToken, (_req, res) => {
        const stats = roomManager.getStats();
        res.json(stats);
    });
    return router;
}
// ─── Public Routes (no auth required) ────────────────────────────
function createPublicRouter() {
    const router = (0, express_1.Router)();
    router.get('/avatars', (_req, res) => {
        try {
            const avatarsDir = path_1.default.join(uploadsDir, 'avatars');
            if (!fs_1.default.existsSync(avatarsDir)) {
                res.json([]);
                return;
            }
            const files = fs_1.default.readdirSync(avatarsDir).filter((f) => !f.startsWith('.'));
            const avatars = files.map((filename) => ({
                id: filename,
                url: `/uploads/avatars/${filename}`,
                name: path_1.default.parse(filename).name,
            }));
            res.json(avatars);
        }
        catch (err) {
            res.status(500).json({ error: err.message || 'Failed to list avatars.' });
        }
    });
    router.get('/characters', (_req, res) => {
        res.json(exports.characterConfigs);
    });
    return router;
}
//# sourceMappingURL=adminRoutes.js.map
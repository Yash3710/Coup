import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
  AdminCharacterConfig,
  AvatarConfig,
  Character,
  CHARACTER_DEFINITIONS,
  CharacterDefinition,
} from '@shared/types';
import { RoomManager } from '../rooms/RoomManager';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const useCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'yashis2op';
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'coup-admin-secret-token-2026';

// Simple token: just the secret string (for dev). In production use JWT.
function generateAdminToken(): string {
  return Buffer.from(`${ADMIN_TOKEN_SECRET}:${Date.now()}`).toString('base64');
}

function verifyAdminToken(req: Request, res: Response, next: NextFunction): void {
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
  } catch {
    res.status(401).json({ error: 'Unauthorized — invalid token.' });
  }
}

// ─── Multer Setup ────────────────────────────────────────────────

const uploadsDir = path.resolve(__dirname, '../../uploads');

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(uploadsDir, 'avatars');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const cardStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(uploadsDir, 'cards');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed.'));
  }
};

const uploadAvatar = multer({ storage: avatarStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadCard = multer({ storage: cardStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── In-memory character config store ────────────────────────────

export const characterConfigs: Record<Character, AdminCharacterConfig> = {
  [Character.Duke]: {
    character: Character.Duke,
    name: CHARACTER_DEFINITIONS[Character.Duke].name,
    description: CHARACTER_DEFINITIONS[Character.Duke].description,
    activeAbility: CHARACTER_DEFINITIONS[Character.Duke].activeAbility,
    blockAbility: CHARACTER_DEFINITIONS[Character.Duke].blockAbility,
  },
  [Character.Assassin]: {
    character: Character.Assassin,
    name: CHARACTER_DEFINITIONS[Character.Assassin].name,
    description: CHARACTER_DEFINITIONS[Character.Assassin].description,
    activeAbility: CHARACTER_DEFINITIONS[Character.Assassin].activeAbility,
    blockAbility: CHARACTER_DEFINITIONS[Character.Assassin].blockAbility,
  },
  [Character.Captain]: {
    character: Character.Captain,
    name: CHARACTER_DEFINITIONS[Character.Captain].name,
    description: CHARACTER_DEFINITIONS[Character.Captain].description,
    activeAbility: CHARACTER_DEFINITIONS[Character.Captain].activeAbility,
    blockAbility: CHARACTER_DEFINITIONS[Character.Captain].blockAbility,
  },
  [Character.Ambassador]: {
    character: Character.Ambassador,
    name: CHARACTER_DEFINITIONS[Character.Ambassador].name,
    description: CHARACTER_DEFINITIONS[Character.Ambassador].description,
    activeAbility: CHARACTER_DEFINITIONS[Character.Ambassador].activeAbility,
    blockAbility: CHARACTER_DEFINITIONS[Character.Ambassador].blockAbility,
  },
  [Character.Contessa]: {
    character: Character.Contessa,
    name: CHARACTER_DEFINITIONS[Character.Contessa].name,
    description: CHARACTER_DEFINITIONS[Character.Contessa].description,
    activeAbility: CHARACTER_DEFINITIONS[Character.Contessa].activeAbility,
    blockAbility: CHARACTER_DEFINITIONS[Character.Contessa].blockAbility,
  },
};

// ─── Create Router ───────────────────────────────────────────────

export function createAdminRouter(roomManager: RoomManager): Router {
  const router = Router();

  // ── Login ──────────────────────────────────────────────────────

  router.post('/login', (req: Request, res: Response) => {
    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Invalid password.' });
      return;
    }

    const token = generateAdminToken();
    res.json({ token });
  });

  // ── Protected routes (require admin token) ─────────────────────

  router.get('/characters', verifyAdminToken, (_req: Request, res: Response) => {
    res.json(Object.values(characterConfigs));
  });

  router.put('/characters', verifyAdminToken, (req: Request, res: Response) => {
    const updates: AdminCharacterConfig[] = req.body;

    if (!Array.isArray(updates)) {
      res.status(400).json({ error: 'Body must be an array of character configs.' });
      return;
    }

    for (const update of updates) {
      if (!update.character || !characterConfigs[update.character]) {
        continue;
      }

      const existing = characterConfigs[update.character];
      if (update.name !== undefined) existing.name = update.name;
      if (update.description !== undefined) existing.description = update.description;
      if (update.activeAbility !== undefined) existing.activeAbility = update.activeAbility;
      if (update.blockAbility !== undefined) existing.blockAbility = update.blockAbility;
      if (update.cardImageUrl !== undefined) existing.cardImageUrl = update.cardImageUrl;
    }

    res.json({ message: 'Characters updated.', characters: Object.values(characterConfigs) });
  });

  router.post('/upload/avatar', verifyAdminToken, uploadAvatar.single('avatar'), async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    try {
      if (useCloudinary) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'coup/avatars',
        });
        fs.unlinkSync(req.file.path); // remove temp file
        res.json({ url: result.secure_url, filename: result.public_id });
      } else {
        const url = `/uploads/avatars/${req.file.filename}`;
        res.json({ url, filename: req.file.filename });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Upload failed.' });
    }
  });

  router.post('/upload/card', verifyAdminToken, uploadCard.single('card'), async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    try {
      if (useCloudinary) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'coup/cards',
        });
        fs.unlinkSync(req.file.path);
        res.json({ url: result.secure_url, filename: result.public_id });
      } else {
        const url = `/uploads/cards/${req.file.filename}`;
        res.json({ url, filename: req.file.filename });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Upload failed.' });
    }
  });

  router.get('/avatars', verifyAdminToken, async (_req: Request, res: Response) => {
    try {
      if (useCloudinary) {
        const result = await cloudinary.search
          .expression('folder:coup/avatars')
          .sort_by('created_at', 'desc')
          .max_results(50)
          .execute();
          
        const avatars: AvatarConfig[] = result.resources.map((r: any) => ({
          id: r.public_id,
          url: r.secure_url,
          name: r.public_id.split('/').pop() || 'Avatar',
        }));
        res.json(avatars);
      } else {
        const avatarsDir = path.join(uploadsDir, 'avatars');
        if (!fs.existsSync(avatarsDir)) {
          res.json([]);
          return;
        }

        const files = fs.readdirSync(avatarsDir).filter((f) => !f.startsWith('.'));
        const avatars: AvatarConfig[] = files.map((filename) => ({
          id: filename,
          url: `/uploads/avatars/${filename}`,
          name: path.parse(filename).name,
        }));

        res.json(avatars);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list avatars.' });
    }
  });

  router.delete('/avatars/:id(*)', verifyAdminToken, async (req: Request, res: Response) => {
    try {
      const id = req.params.id; // Could be a filename OR a Cloudinary public_id like 'coup/avatars/xyz'
      
      if (useCloudinary && id.startsWith('coup/')) {
        await cloudinary.uploader.destroy(id);
        res.json({ message: 'Avatar deleted from Cloudinary.' });
        return;
      }

      // Local deletion
      const filePath = path.join(uploadsDir, 'avatars', id);

      // Security: prevent path traversal
      const resolved = path.resolve(filePath);
      if (!resolved.startsWith(path.resolve(path.join(uploadsDir, 'avatars')))) {
        res.status(400).json({ error: 'Invalid filename.' });
        return;
      }

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'Avatar not found.' });
        return;
      }

      fs.unlinkSync(filePath);
      res.json({ message: 'Avatar deleted.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete.' });
    }
  });

  router.get('/stats', verifyAdminToken, (_req: Request, res: Response) => {
    const stats = roomManager.getStats();
    res.json(stats);
  });

  return router;
}

// ─── Public Routes (no auth required) ────────────────────────────

export function createPublicRouter(): Router {
  const router = Router();

  router.get('/avatars', (_req: Request, res: Response) => {
    try {
      const avatarsDir = path.join(uploadsDir, 'avatars');
      if (!fs.existsSync(avatarsDir)) {
        res.json([]);
        return;
      }

      const files = fs.readdirSync(avatarsDir).filter((f) => !f.startsWith('.'));
      const avatars: AvatarConfig[] = files.map((filename) => ({
        id: filename,
        url: `/uploads/avatars/${filename}`,
        name: path.parse(filename).name,
      }));

      res.json(avatars);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list avatars.' });
    }
  });

  router.get('/characters', (_req: Request, res: Response) => {
    res.json(characterConfigs);
  });

  return router;
}

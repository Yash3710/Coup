import { Router } from 'express';
import { AdminCharacterConfig, Character } from '../../../shared/types';
import { RoomManager } from '../rooms/RoomManager';
export declare const characterConfigs: Record<Character, AdminCharacterConfig>;
export declare function createAdminRouter(roomManager: RoomManager): Router;
export declare function createPublicRouter(): Router;
//# sourceMappingURL=adminRoutes.d.ts.map
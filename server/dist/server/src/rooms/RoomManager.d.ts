import { BotDifficulty, PlayerView, Room, RoomListItem, RoomSettings } from '@shared/types';
import { GameEngine } from '../engine/GameEngine';
export interface ManagedRoom {
    room: Room;
    engine: GameEngine | null;
    /** Internal store of full Player objects (with real cards) for room setup before game starts */
    playerData: Array<{
        id: string;
        name: string;
        avatarUrl: string;
        isBot: boolean;
        botDifficulty?: BotDifficulty;
    }>;
    disconnectedPlayers: Map<string, {
        playerId: string;
        disconnectedAt: number;
    }>;
}
export declare class RoomManager {
    private rooms;
    private inviteCodeMap;
    private totalGamesPlayed;
    /**
     * Create a new room.
     */
    createRoom(hostId: string, hostName: string, avatarUrl: string, roomName: string, settings: RoomSettings): ManagedRoom;
    /**
     * Join an existing room.
     */
    joinRoom(roomId: string, playerId: string, name: string, avatarUrl: string, password?: string): {
        success: boolean;
        error?: string;
        managedRoom?: ManagedRoom;
    };
    /**
     * Join a room by invite code.
     */
    joinRoomByCode(inviteCode: string, playerId: string, name: string, avatarUrl: string, password?: string): {
        success: boolean;
        error?: string;
        managedRoom?: ManagedRoom;
        roomId?: string;
    };
    /**
     * Leave a room. Handle host transfer if host leaves.
     */
    leaveRoom(roomId: string, playerId: string): {
        success: boolean;
        error?: string;
        roomDestroyed: boolean;
        newHostId?: string;
    };
    /**
     * Add a bot player to the room.
     */
    addBot(roomId: string, difficulty: BotDifficulty): {
        success: boolean;
        error?: string;
        botPlayer?: PlayerView;
    };
    /**
     * Remove a bot player from the room.
     */
    removeBot(roomId: string, botId: string): {
        success: boolean;
        error?: string;
    };
    /**
     * Start the game in a room. Initializes the GameEngine.
     */
    startGame(roomId: string, hostId: string): {
        success: boolean;
        error?: string;
        engine?: GameEngine;
    };
    /**
     * Update room settings (before game starts).
     */
    updateSettings(roomId: string, playerId: string, settings: Partial<RoomSettings>): {
        success: boolean;
        error?: string;
    };
    /**
     * Add a spectator to a room.
     */
    addSpectator(roomId: string, spectatorId: string, name: string): {
        success: boolean;
        error?: string;
    };
    /**
     * Remove a spectator from a room.
     */
    removeSpectator(roomId: string, spectatorId: string): void;
    /**
     * Get list of public, non-started rooms.
     */
    getPublicRooms(): RoomListItem[];
    /**
     * Get a managed room by ID.
     */
    getRoom(roomId: string): ManagedRoom | undefined;
    /**
     * Get a room ID by invite code.
     */
    getRoomIdByInviteCode(inviteCode: string): string | undefined;
    /**
     * Destroy a room and clean up.
     */
    destroyRoom(roomId: string): void;
    /**
     * Track a player disconnection for reconnection.
     */
    trackDisconnection(roomId: string, playerId: string, socketId: string): void;
    /**
     * Clean up stale disconnections (older than 60 seconds).
     */
    cleanupDisconnections(roomId: string): void;
    /**
     * Get stats for admin dashboard.
     */
    getStats(): {
        activeGames: number;
        playersOnline: number;
        totalGamesPlayed: number;
    };
    /**
     * Generate a unique 6-character alphanumeric invite code.
     */
    private generateInviteCode;
}
//# sourceMappingURL=RoomManager.d.ts.map
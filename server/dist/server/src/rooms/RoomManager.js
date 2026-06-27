"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const uuid_1 = require("uuid");
const GameEngine_1 = require("../engine/GameEngine");
class RoomManager {
    rooms = new Map();
    inviteCodeMap = new Map(); // inviteCode -> roomId
    totalGamesPlayed = 0;
    /**
     * Create a new room.
     */
    createRoom(hostId, hostName, avatarUrl, roomName, settings) {
        const roomId = (0, uuid_1.v4)();
        const inviteCode = this.generateInviteCode();
        const hostPlayerView = {
            id: hostId,
            name: hostName,
            avatarUrl,
            coins: 0,
            cards: [],
            alive: true,
            connected: true,
            isBot: false,
        };
        const room = {
            id: roomId,
            name: roomName,
            hostId,
            players: [hostPlayerView],
            maxPlayers: settings.maxPlayers,
            isPrivate: settings.isPrivate,
            password: settings.password,
            inviteCode,
            spectators: [],
            settings,
            gameStarted: false,
        };
        const managed = {
            room,
            engine: null,
            playerData: [
                {
                    id: hostId,
                    name: hostName,
                    avatarUrl,
                    isBot: false,
                },
            ],
            disconnectedPlayers: new Map(),
        };
        this.rooms.set(roomId, managed);
        this.inviteCodeMap.set(inviteCode, roomId);
        return managed;
    }
    /**
     * Join an existing room.
     */
    joinRoom(roomId, playerId, name, avatarUrl, password) {
        const managed = this.rooms.get(roomId);
        if (!managed) {
            return { success: false, error: 'Room not found.' };
        }
        const room = managed.room;
        if (room.gameStarted) {
            return { success: false, error: 'Game already in progress.' };
        }
        if (room.players.length >= room.maxPlayers) {
            return { success: false, error: 'Room is full.' };
        }
        if (room.isPrivate && room.password && password !== room.password) {
            return { success: false, error: 'Incorrect password.' };
        }
        // Check if player is already in the room
        if (room.players.some((p) => p.id === playerId)) {
            return { success: false, error: 'Already in this room.' };
        }
        // Check if avatar is already taken by another human player
        if (room.players.some((p) => !p.isBot && p.avatarUrl === avatarUrl)) {
            return { success: false, error: 'That avatar is already taken by someone in this room.' };
        }
        const playerView = {
            id: playerId,
            name,
            avatarUrl,
            coins: 0,
            cards: [],
            alive: true,
            connected: true,
            isBot: false,
        };
        room.players.push(playerView);
        managed.playerData.push({ id: playerId, name, avatarUrl, isBot: false });
        return { success: true, managedRoom: managed };
    }
    /**
     * Join a room by invite code.
     */
    joinRoomByCode(inviteCode, playerId, name, avatarUrl, password) {
        const roomId = this.inviteCodeMap.get(inviteCode.toUpperCase());
        if (!roomId) {
            return { success: false, error: 'Invalid invite code.' };
        }
        const result = this.joinRoom(roomId, playerId, name, avatarUrl, password);
        return { ...result, roomId };
    }
    /**
     * Leave a room. Handle host transfer if host leaves.
     */
    leaveRoom(roomId, playerId) {
        const managed = this.rooms.get(roomId);
        if (!managed) {
            return { success: false, error: 'Room not found.', roomDestroyed: false };
        }
        const room = managed.room;
        const playerIndex = room.players.findIndex((p) => p.id === playerId);
        if (playerIndex === -1) {
            return { success: false, error: 'Player not in this room.', roomDestroyed: false };
        }
        room.players.splice(playerIndex, 1);
        managed.playerData = managed.playerData.filter((p) => p.id !== playerId);
        // If the game is in progress and a player leaves, mark them disconnected in the engine
        if (managed.engine) {
            managed.engine.setPlayerConnected(playerId, false);
        }
        // If no human players left, destroy the room
        const humanPlayers = room.players.filter((p) => !p.isBot);
        if (humanPlayers.length === 0) {
            this.destroyRoom(roomId);
            return { success: true, roomDestroyed: true };
        }
        // Host transfer if host left
        let newHostId;
        if (room.hostId === playerId) {
            const newHost = humanPlayers[0];
            room.hostId = newHost.id;
            newHostId = newHost.id;
        }
        return { success: true, roomDestroyed: false, newHostId };
    }
    /**
     * Add a bot player to the room.
     */
    addBot(roomId, difficulty) {
        const managed = this.rooms.get(roomId);
        if (!managed) {
            return { success: false, error: 'Room not found.' };
        }
        const room = managed.room;
        if (room.gameStarted) {
            return { success: false, error: 'Game already in progress.' };
        }
        if (room.players.length >= room.maxPlayers) {
            return { success: false, error: 'Room is full.' };
        }
        const botId = `bot_${(0, uuid_1.v4)().slice(0, 8)}`;
        const botNames = ['Aria', 'Magnus', 'Lyra', 'Orion', 'Nova', 'Cassius', 'Thea', 'Rex', 'Ivy', 'Zephyr'];
        const existingNames = room.players.map((p) => p.name);
        let botName = botNames.find((n) => !existingNames.includes(n)) || `Bot-${botId.slice(4, 8)}`;
        botName = `${botName} (${difficulty})`;
        const botPlayerView = {
            id: botId,
            name: botName,
            avatarUrl: `/api/avatars/bot_${difficulty.toLowerCase()}.png`,
            coins: 0,
            cards: [],
            alive: true,
            connected: true,
            isBot: true,
        };
        room.players.push(botPlayerView);
        managed.playerData.push({
            id: botId,
            name: botName,
            avatarUrl: botPlayerView.avatarUrl,
            isBot: true,
            botDifficulty: difficulty,
        });
        return { success: true, botPlayer: botPlayerView };
    }
    /**
     * Remove a bot player from the room.
     */
    removeBot(roomId, botId) {
        const managed = this.rooms.get(roomId);
        if (!managed) {
            return { success: false, error: 'Room not found.' };
        }
        const room = managed.room;
        if (room.gameStarted) {
            return { success: false, error: 'Cannot remove bot during game.' };
        }
        const botIndex = room.players.findIndex((p) => p.id === botId && p.isBot);
        if (botIndex === -1) {
            return { success: false, error: 'Bot not found.' };
        }
        room.players.splice(botIndex, 1);
        managed.playerData = managed.playerData.filter((p) => p.id !== botId);
        return { success: true };
    }
    /**
     * Start the game in a room. Initializes the GameEngine.
     */
    startGame(roomId, hostId) {
        const managed = this.rooms.get(roomId);
        if (!managed) {
            return { success: false, error: 'Room not found.' };
        }
        const room = managed.room;
        if (room.hostId !== hostId) {
            return { success: false, error: 'Only the host can start the game.' };
        }
        if (room.gameStarted) {
            return { success: false, error: 'Game already started.' };
        }
        if (room.players.length < 2) {
            return { success: false, error: 'Need at least 2 players to start.' };
        }
        const engine = new GameEngine_1.GameEngine(roomId, managed.playerData, room.settings.turnTimer);
        managed.engine = engine;
        room.gameStarted = true;
        this.totalGamesPlayed++;
        return { success: true, engine };
    }
    /**
     * Update room settings (before game starts).
     */
    updateSettings(roomId, playerId, settings) {
        const managed = this.rooms.get(roomId);
        if (!managed) {
            return { success: false, error: 'Room not found.' };
        }
        if (managed.room.hostId !== playerId) {
            return { success: false, error: 'Only the host can update settings.' };
        }
        if (managed.room.gameStarted) {
            return { success: false, error: 'Cannot change settings during game.' };
        }
        if (settings.maxPlayers !== undefined) {
            managed.room.settings.maxPlayers = settings.maxPlayers;
            managed.room.maxPlayers = settings.maxPlayers;
        }
        if (settings.turnTimer !== undefined) {
            managed.room.settings.turnTimer = settings.turnTimer;
        }
        if (settings.isPrivate !== undefined) {
            managed.room.settings.isPrivate = settings.isPrivate;
            managed.room.isPrivate = settings.isPrivate;
        }
        if (settings.password !== undefined) {
            managed.room.settings.password = settings.password;
            managed.room.password = settings.password;
        }
        return { success: true };
    }
    /**
     * Add a spectator to a room.
     */
    addSpectator(roomId, spectatorId, name) {
        const managed = this.rooms.get(roomId);
        if (!managed) {
            return { success: false, error: 'Room not found.' };
        }
        if (managed.room.spectators.some((s) => s.id === spectatorId)) {
            return { success: false, error: 'Already spectating.' };
        }
        managed.room.spectators.push({ id: spectatorId, name });
        return { success: true };
    }
    /**
     * Remove a spectator from a room.
     */
    removeSpectator(roomId, spectatorId) {
        const managed = this.rooms.get(roomId);
        if (!managed)
            return;
        managed.room.spectators = managed.room.spectators.filter((s) => s.id !== spectatorId);
    }
    /**
     * Get list of public, non-started rooms.
     */
    getPublicRooms() {
        const result = [];
        for (const managed of this.rooms.values()) {
            const room = managed.room;
            if (!room.isPrivate && !room.gameStarted) {
                const hostPlayer = room.players.find((p) => p.id === room.hostId);
                result.push({
                    id: room.id,
                    name: room.name,
                    hostName: hostPlayer?.name || 'Unknown',
                    playerCount: room.players.length,
                    maxPlayers: room.maxPlayers,
                    isPrivate: room.isPrivate,
                    gameStarted: room.gameStarted,
                });
            }
        }
        return result;
    }
    /**
     * Get a managed room by ID.
     */
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    /**
     * Get a room ID by invite code.
     */
    getRoomIdByInviteCode(inviteCode) {
        return this.inviteCodeMap.get(inviteCode.toUpperCase());
    }
    /**
     * Destroy a room and clean up.
     */
    destroyRoom(roomId) {
        const managed = this.rooms.get(roomId);
        if (!managed)
            return;
        if (managed.engine) {
            managed.engine.destroy();
        }
        this.inviteCodeMap.delete(managed.room.inviteCode);
        this.rooms.delete(roomId);
    }
    /**
     * Track a player disconnection for reconnection.
     */
    trackDisconnection(roomId, playerId, socketId) {
        const managed = this.rooms.get(roomId);
        if (!managed)
            return;
        managed.disconnectedPlayers.set(socketId, {
            playerId,
            disconnectedAt: Date.now(),
        });
    }
    /**
     * Clean up stale disconnections (older than 60 seconds).
     */
    cleanupDisconnections(roomId) {
        const managed = this.rooms.get(roomId);
        if (!managed)
            return;
        const now = Date.now();
        for (const [socketId, info] of managed.disconnectedPlayers.entries()) {
            if (now - info.disconnectedAt > 60000) {
                managed.disconnectedPlayers.delete(socketId);
            }
        }
    }
    /**
     * Get stats for admin dashboard.
     */
    getStats() {
        let activeGames = 0;
        let playersOnline = 0;
        for (const managed of this.rooms.values()) {
            if (managed.room.gameStarted)
                activeGames++;
            playersOnline += managed.room.players.filter((p) => p.connected && !p.isBot).length;
        }
        return {
            activeGames,
            playersOnline,
            totalGamesPlayed: this.totalGamesPlayed,
        };
    }
    /**
     * Generate a unique 6-character alphanumeric invite code.
     */
    generateInviteCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, O, 0, 1 for readability
        let code;
        do {
            code = '';
            for (let i = 0; i < 6; i++) {
                code += chars[Math.floor(Math.random() * chars.length)];
            }
        } while (this.inviteCodeMap.has(code));
        return code;
    }
}
exports.RoomManager = RoomManager;
//# sourceMappingURL=RoomManager.js.map
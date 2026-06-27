import { v4 as uuidv4 } from 'uuid';
import {
  BotDifficulty,
  CardView,
  Player,
  PlayerView,
  Room,
  RoomListItem,
  RoomSettings,
  Spectator,
} from '@shared/types';
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
  disconnectedPlayers: Map<string, { playerId: string; disconnectedAt: number }>;
}

export class RoomManager {
  private rooms: Map<string, ManagedRoom> = new Map();
  private inviteCodeMap: Map<string, string> = new Map(); // inviteCode -> roomId
  private totalGamesPlayed: number = 0;

  /**
   * Create a new room.
   */
  createRoom(
    hostId: string,
    hostName: string,
    avatarUrl: string,
    roomName: string,
    settings: RoomSettings
  ): ManagedRoom {
    const roomId = uuidv4();
    const inviteCode = this.generateInviteCode();

    const hostPlayerView: PlayerView = {
      id: hostId,
      name: hostName,
      avatarUrl,
      coins: 0,
      cards: [],
      alive: true,
      connected: true,
      isBot: false,
    };

    const room: Room = {
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

    const managed: ManagedRoom = {
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
  joinRoom(
    roomId: string,
    playerId: string,
    name: string,
    avatarUrl: string,
    password?: string
  ): { success: boolean; error?: string; managedRoom?: ManagedRoom } {
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

    const playerView: PlayerView = {
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
  joinRoomByCode(
    inviteCode: string,
    playerId: string,
    name: string,
    avatarUrl: string,
    password?: string
  ): { success: boolean; error?: string; managedRoom?: ManagedRoom; roomId?: string } {
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
  leaveRoom(
    roomId: string,
    playerId: string
  ): { success: boolean; error?: string; roomDestroyed: boolean; newHostId?: string } {
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
    let newHostId: string | undefined;
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
  addBot(
    roomId: string,
    difficulty: BotDifficulty
  ): { success: boolean; error?: string; botPlayer?: PlayerView } {
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

    const botId = `bot_${uuidv4().slice(0, 8)}`;
    const botNames = ['Aria', 'Magnus', 'Lyra', 'Orion', 'Nova', 'Cassius', 'Thea', 'Rex', 'Ivy', 'Zephyr'];
    const existingNames = room.players.map((p) => p.name);
    let botName = botNames.find((n) => !existingNames.includes(n)) || `Bot-${botId.slice(4, 8)}`;
    botName = `${botName} (${difficulty})`;

    const botPlayerView: PlayerView = {
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
  removeBot(
    roomId: string,
    botId: string
  ): { success: boolean; error?: string } {
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
  startGame(
    roomId: string,
    hostId: string
  ): { success: boolean; error?: string; engine?: GameEngine } {
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

    const engine = new GameEngine(
      roomId,
      managed.playerData,
      room.settings.turnTimer
    );

    managed.engine = engine;
    room.gameStarted = true;
    this.totalGamesPlayed++;

    return { success: true, engine };
  }

  /**
   * Update room settings (before game starts).
   */
  updateSettings(
    roomId: string,
    playerId: string,
    settings: Partial<RoomSettings>
  ): { success: boolean; error?: string } {
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
  addSpectator(
    roomId: string,
    spectatorId: string,
    name: string
  ): { success: boolean; error?: string } {
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
  removeSpectator(roomId: string, spectatorId: string): void {
    const managed = this.rooms.get(roomId);
    if (!managed) return;
    managed.room.spectators = managed.room.spectators.filter((s) => s.id !== spectatorId);
  }

  /**
   * Get list of public, non-started rooms.
   */
  getPublicRooms(): RoomListItem[] {
    const result: RoomListItem[] = [];
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
  getRoom(roomId: string): ManagedRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Get a room ID by invite code.
   */
  getRoomIdByInviteCode(inviteCode: string): string | undefined {
    return this.inviteCodeMap.get(inviteCode.toUpperCase());
  }

  /**
   * Destroy a room and clean up.
   */
  destroyRoom(roomId: string): void {
    const managed = this.rooms.get(roomId);
    if (!managed) return;

    if (managed.engine) {
      managed.engine.destroy();
    }

    this.inviteCodeMap.delete(managed.room.inviteCode);
    this.rooms.delete(roomId);
  }

  /**
   * Track a player disconnection for reconnection.
   */
  trackDisconnection(roomId: string, playerId: string, socketId: string): void {
    const managed = this.rooms.get(roomId);
    if (!managed) return;
    managed.disconnectedPlayers.set(socketId, {
      playerId,
      disconnectedAt: Date.now(),
    });
  }

  /**
   * Clean up stale disconnections (older than 60 seconds).
   */
  cleanupDisconnections(roomId: string): void {
    const managed = this.rooms.get(roomId);
    if (!managed) return;

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
  getStats(): { activeGames: number; playersOnline: number; totalGamesPlayed: number } {
    let activeGames = 0;
    let playersOnline = 0;

    for (const managed of this.rooms.values()) {
      if (managed.room.gameStarted) activeGames++;
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
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, O, 0, 1 for readability
    let code: string;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (this.inviteCodeMap.has(code));
    return code;
  }
}

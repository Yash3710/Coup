import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import {
  ClientEvent,
  ServerEvent,
  CreateRoomPayload,
  JoinRoomPayload,
  JoinRoomByCodePayload,
  PerformActionPayload,
  BlockPayload,
  ChooseLoseInfluencePayload,
  ChooseExchangePayload,
  ChatMessagePayload,
  AddBotPayload,
  RoomSettings,
  BotDifficulty,
} from '../types';
import type { ChatMessage } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private _connected = false;

  get connected() {
    return this._connected;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._connected = false;
      useGameStore.getState().setConnected(false);
    }
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }

  private setupListeners() {
    if (!this.socket) return;
    const s = this.socket;
    const store = useGameStore.getState;

    s.on('connect', () => {
      this._connected = true;
      useGameStore.getState().setConnected(true);
      // Re-join lobby on reconnect
      const info = useGameStore.getState().playerInfo;
      if (info) {
        this.joinLobby(info.name, info.avatarUrl);
      }
    });

    s.on('disconnect', () => {
      this._connected = false;
      useGameStore.getState().setConnected(false);
    });

    s.on('connect_error', () => {
      this._connected = false;
      useGameStore.getState().setConnected(false);
    });

    // Lobby events
    s.on(ServerEvent.RoomList, (rooms) => {
      store().setAvailableRooms(rooms);
    });

    s.on(ServerEvent.LobbyUpdate, (rooms) => {
      store().setAvailableRooms(rooms);
    });

    s.on(ServerEvent.RoomCreated, (room) => {
      store().setRoom(room);
    });

    s.on(ServerEvent.RoomJoined, (room) => {
      store().setRoom(room);
    });

    s.on(ServerEvent.RoomUpdated, (room) => {
      store().setRoom(room);
    });

    s.on(ServerEvent.RoomLeft, () => {
      store().setRoom(null);
      store().setGameState(null);
      store().clearChat();
    });

    s.on(ServerEvent.RoomError, (data: { message: string }) => {
      console.error('Room error:', data.message);
      alert(data.message);
    });

    // Game events
    s.on(ServerEvent.GameStarted, (data) => {
      console.log('Game started in room:', data.roomId);
    });

    s.on(ServerEvent.GameStateUpdate, (gameState) => {
      store().setGameState(gameState);
    });

    s.on(ServerEvent.GameOver, (data) => {
      console.log('Game Over!', data);
    });

    // Chat events
    s.on(ServerEvent.ChatMessage, (msg: ChatMessage) => {
      store().addChatMessage(msg);
    });

    // Player connection events
    s.on(ServerEvent.PlayerReconnected, (data: { playerId: string }) => {
      const gs = store().gameState;
      if (gs) {
        const updated = {
          ...gs,
          players: gs.players.map((p) =>
            p.id === data.playerId ? { ...p, connected: true } : p
          ),
        };
        store().setGameState(updated);
      }
    });

    s.on(ServerEvent.PlayerDisconnected, (data: { playerId: string }) => {
      const gs = store().gameState;
      if (gs) {
        const updated = {
          ...gs,
          players: gs.players.map((p) =>
            p.id === data.playerId ? { ...p, connected: false } : p
          ),
        };
        store().setGameState(updated);
      }
    });

    s.on(ServerEvent.Error, (data: { message: string }) => {
      console.error('Server error:', data.message);
    });
  }

  // --- Lobby Actions ---
  joinLobby(name: string, avatarUrl: string) {
    this.socket?.emit(ClientEvent.JoinLobby, { playerName: name, avatarUrl });
  }

  createRoom(payload: CreateRoomPayload) {
    this.socket?.emit(ClientEvent.CreateRoom, payload);
  }

  quickPlayWithBots(payload: CreateRoomPayload) {
    if (!this.socket) return;
    
    // Listen for room creation, then add bots and start
    const onRoomCreated = () => {
      this.socket?.off(ServerEvent.RoomCreated, onRoomCreated);
      
      // Add 3 bots of varying difficulty
      this.addBot(BotDifficulty.Medium);
      this.addBot(BotDifficulty.Easy);
      this.addBot(BotDifficulty.Hard);
      
      // Small delay to ensure bots are processed
      setTimeout(() => {
        this.startGame();
      }, 500);
    };
    
    this.socket.on(ServerEvent.RoomCreated, onRoomCreated);
    this.socket.emit(ClientEvent.CreateRoom, payload);
  }

  joinRoom(payload: JoinRoomPayload) {
    this.socket?.emit(ClientEvent.JoinRoom, payload);
  }

  joinRoomByCode(payload: JoinRoomByCodePayload) {
    this.socket?.emit(ClientEvent.JoinRoomByCode, payload);
  }

  leaveRoom() {
    this.socket?.emit(ClientEvent.LeaveRoom);
  }

  updateSettings(settings: RoomSettings) {
    this.socket?.emit(ClientEvent.UpdateSettings, settings);
  }

  addBot(difficulty: BotDifficulty) {
    const payload: AddBotPayload = { difficulty };
    this.socket?.emit(ClientEvent.AddBot, payload);
  }

  removeBot(botId: string) {
    this.socket?.emit(ClientEvent.RemoveBot, { botId });
  }

  startGame() {
    this.socket?.emit(ClientEvent.StartGame);
  }

  joinAsSpectator(roomId: string) {
    this.socket?.emit(ClientEvent.JoinAsSpectator, { roomId });
  }

  // --- Game Actions ---
  performAction(payload: PerformActionPayload) {
    this.socket?.emit(ClientEvent.PerformAction, payload);
  }

  challenge() {
    this.socket?.emit(ClientEvent.Challenge);
  }

  passChallenge() {
    this.socket?.emit(ClientEvent.PassChallenge);
  }

  block(payload: BlockPayload) {
    this.socket?.emit(ClientEvent.Block, payload);
  }

  passBlock() {
    this.socket?.emit(ClientEvent.PassBlock);
  }

  challengeBlock() {
    this.socket?.emit(ClientEvent.ChallengeBlock);
  }

  passBlockChallenge() {
    this.socket?.emit(ClientEvent.PassBlockChallenge);
  }

  chooseLoseInfluence(payload: ChooseLoseInfluencePayload) {
    this.socket?.emit(ClientEvent.ChooseLoseInfluence, payload);
  }

  chooseExchangeCards(payload: ChooseExchangePayload) {
    this.socket?.emit(ClientEvent.ChooseExchangeCards, payload);
  }

  // --- Chat ---
  sendMessage(payload: ChatMessagePayload) {
    this.socket?.emit(ClientEvent.SendMessage, payload);
  }

  sendReaction(roomId: string, reaction: string) {
    this.socket?.emit(ClientEvent.SendReaction, { roomId, reaction });
  }

  // --- System ---
  reconnect(playerId: string, roomId: string) {
    this.socket?.emit(ClientEvent.Reconnect, { playerId, roomId });
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();

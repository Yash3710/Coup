import { Server, Socket } from 'socket.io';
import {
  Action,
  ACTION_DEFINITIONS,
  AddBotPayload,
  BlockPayload,
  BotDifficulty,
  ChatMessagePayload,
  ChooseExchangePayload,
  ChooseLoseInfluencePayload,
  ClientEvent,
  CreateRoomPayload,
  GamePhase,
  JoinRoomByCodePayload,
  JoinRoomPayload,
  PerformActionPayload,
  RoomSettings,
  ServerEvent,
} from '@shared/types';
import { RoomManager, ManagedRoom } from '../rooms/RoomManager';
import { BotEngine } from '../bots/BotEngine';
import { GameEngine } from '../engine/GameEngine';

interface SocketMeta {
  playerId: string;
  playerName: string;
  roomId: string | null;
}

const RECONNECT_WINDOW_MS = 60000; // 60 seconds

export function setupSocketHandlers(io: Server, roomManager: RoomManager): void {
  const botEngine = new BotEngine();

  // Map socket.id → metadata
  const socketMeta: Map<string, SocketMeta> = new Map();
  // Map playerId → socket.id (for reconnection)
  const playerSocketMap: Map<string, string> = new Map();
  // Disconnection tracking: playerId → { roomId, disconnectedAt }
  const disconnectedPlayers: Map<string, { roomId: string; disconnectedAt: number }> = new Map();

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ─── LOBBY ───────────────────────────────────────────────────

    socket.on(ClientEvent.JoinLobby, (data: { playerName: string }) => {
      const playerId = socket.id;
      socketMeta.set(socket.id, {
        playerId,
        playerName: data.playerName || 'Anonymous',
        roomId: null,
      });
      playerSocketMap.set(playerId, socket.id);

      // Send room list
      socket.emit(ServerEvent.RoomList, roomManager.getPublicRooms());
    });

    socket.on(ClientEvent.CreateRoom, (data: CreateRoomPayload) => {
      try {
        const meta = getOrCreateMeta(socket, data.playerName);
        const managed = roomManager.createRoom(
          meta.playerId,
          data.playerName,
          data.avatarUrl,
          data.roomName,
          data.settings
        );

        meta.roomId = managed.room.id;
        socket.join(managed.room.id);

        socket.emit(ServerEvent.RoomCreated, {
          roomId: managed.room.id,
          inviteCode: managed.room.inviteCode,
        });
        socket.emit(ServerEvent.RoomUpdated, managed.room);

        // Update lobby for everyone
        io.emit(ServerEvent.RoomList, roomManager.getPublicRooms());
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Failed to create room.' });
      }
    });

    socket.on(ClientEvent.JoinRoom, (data: JoinRoomPayload) => {
      try {
        const meta = getOrCreateMeta(socket, data.playerName);
        const result = roomManager.joinRoom(
          data.roomId,
          meta.playerId,
          data.playerName,
          data.avatarUrl,
          data.password
        );

        if (!result.success) {
          socket.emit(ServerEvent.RoomError, { message: result.error });
          return;
        }

        meta.roomId = data.roomId;
        socket.join(data.roomId);

        socket.emit(ServerEvent.RoomJoined, result.managedRoom!.room);
        io.to(data.roomId).emit(ServerEvent.RoomUpdated, result.managedRoom!.room);
        io.emit(ServerEvent.RoomList, roomManager.getPublicRooms());
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Failed to join room.' });
      }
    });

    socket.on(ClientEvent.JoinRoomByCode, (data: JoinRoomByCodePayload) => {
      try {
        const meta = getOrCreateMeta(socket, data.playerName);
        const result = roomManager.joinRoomByCode(
          data.inviteCode,
          meta.playerId,
          data.playerName,
          data.avatarUrl,
          data.password
        );

        if (!result.success) {
          socket.emit(ServerEvent.RoomError, { message: result.error });
          return;
        }

        meta.roomId = result.roomId!;
        socket.join(result.roomId!);

        socket.emit(ServerEvent.RoomJoined, result.managedRoom!.room);
        io.to(result.roomId!).emit(ServerEvent.RoomUpdated, result.managedRoom!.room);
        io.emit(ServerEvent.RoomList, roomManager.getPublicRooms());
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Failed to join room.' });
      }
    });

    socket.on(ClientEvent.LeaveRoom, () => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.roomId) return;

        const roomId = meta.roomId;
        const result = roomManager.leaveRoom(roomId, meta.playerId);

        socket.leave(roomId);
        meta.roomId = null;

        socket.emit(ServerEvent.RoomLeft, { roomId });

        if (!result.roomDestroyed) {
          const managed = roomManager.getRoom(roomId);
          if (managed) {
            io.to(roomId).emit(ServerEvent.RoomUpdated, managed.room);
          }
        }

        io.emit(ServerEvent.RoomList, roomManager.getPublicRooms());
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Failed to leave room.' });
      }
    });

    socket.on(ClientEvent.UpdateSettings, (data: { settings: Partial<RoomSettings> }) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.roomId) return;

        const result = roomManager.updateSettings(meta.roomId, meta.playerId, data.settings);
        if (!result.success) {
          socket.emit(ServerEvent.RoomError, { message: result.error });
          return;
        }

        const managed = roomManager.getRoom(meta.roomId);
        if (managed) {
          io.to(meta.roomId).emit(ServerEvent.RoomUpdated, managed.room);
        }
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Failed to update settings.' });
      }
    });

    socket.on(ClientEvent.AddBot, (data: AddBotPayload) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.roomId) return;

        const result = roomManager.addBot(meta.roomId, data.difficulty);
        if (!result.success) {
          socket.emit(ServerEvent.RoomError, { message: result.error });
          return;
        }

        const managed = roomManager.getRoom(meta.roomId);
        if (managed) {
          io.to(meta.roomId).emit(ServerEvent.RoomUpdated, managed.room);
        }
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Failed to add bot.' });
      }
    });

    socket.on(ClientEvent.RemoveBot, (data: { botId: string }) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.roomId) return;

        const result = roomManager.removeBot(meta.roomId, data.botId);
        if (!result.success) {
          socket.emit(ServerEvent.RoomError, { message: result.error });
          return;
        }

        const managed = roomManager.getRoom(meta.roomId);
        if (managed) {
          io.to(meta.roomId).emit(ServerEvent.RoomUpdated, managed.room);
        }
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Failed to remove bot.' });
      }
    });

    socket.on(ClientEvent.JoinAsSpectator, (data: { roomId: string; playerName: string }) => {
      try {
        const meta = getOrCreateMeta(socket, data.playerName);
        const result = roomManager.addSpectator(data.roomId, meta.playerId, data.playerName);

        if (!result.success) {
          socket.emit(ServerEvent.RoomError, { message: result.error });
          return;
        }

        meta.roomId = data.roomId;
        socket.join(data.roomId);

        const managed = roomManager.getRoom(data.roomId);
        if (managed) {
          socket.emit(ServerEvent.RoomUpdated, managed.room);
          if (managed.engine) {
            socket.emit(ServerEvent.GameStateUpdate, managed.engine.getStateForSpectator());
          }
        }
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Failed to join as spectator.' });
      }
    });

    // ─── START GAME ──────────────────────────────────────────────

    socket.on(ClientEvent.StartGame, () => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.roomId) return;

        const result = roomManager.startGame(meta.roomId, meta.playerId);
        if (!result.success) {
          socket.emit(ServerEvent.RoomError, { message: result.error });
          return;
        }

        const engine = result.engine!;
        const managed = roomManager.getRoom(meta.roomId)!;

        // Wire up engine callbacks
        setupEngineCallbacks(managed, io);

        io.to(meta.roomId).emit(ServerEvent.GameStarted, { roomId: meta.roomId });

        // Send personalized game state to each player
        broadcastGameState(managed, io);

        // Check if first player is a bot
        const gameState = engine.getGameState();
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer.isBot && currentPlayer.alive) {
          scheduleBotAction(managed, currentPlayer.id, botEngine, io);
        }

        io.emit(ServerEvent.RoomList, roomManager.getPublicRooms());
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Failed to start game.' });
      }
    });

    // ─── GAME ACTIONS ────────────────────────────────────────────

    socket.on(ClientEvent.PerformAction, (data: PerformActionPayload) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.roomId) return;

        const managed = roomManager.getRoom(meta.roomId);
        if (!managed || !managed.engine) {
          socket.emit(ServerEvent.Error, { message: 'No active game.' });
          return;
        }

        const result = managed.engine.performAction(meta.playerId, data.action, data.targetId);
        if (!result.success) {
          socket.emit(ServerEvent.Error, { message: result.error });
          return;
        }

        broadcastGameState(managed, io);
        checkAndScheduleBots(managed, botEngine, io);
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Action failed.' });
      }
    });

    socket.on(ClientEvent.Challenge, () => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.roomId) return;

        const managed = roomManager.getRoom(meta.roomId);
        if (!managed || !managed.engine) return;

        const result = managed.engine.handleChallenge(meta.playerId);
        if (!result.success) {
          socket.emit(ServerEvent.Error, { message: result.error });
          return;
        }

        broadcastGameState(managed, io);
        checkAndScheduleBots(managed, botEngine, io);
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Challenge failed.' });
      }
    });

    socket.on(ClientEvent.PassChallenge, () => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.roomId) return;

        const managed = roomManager.getRoom(meta.roomId);
        if (!managed || !managed.engine) return;

        const result = managed.engine.handlePassChallenge(meta.playerId);
        if (!result.success) {
          socket.emit(ServerEvent.Error, { message: result.error });
          return;
        }

        broadcastGameState(managed, io);
        checkAndScheduleBots(managed, botEngine, io);
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Pass challenge failed.' });
      }
    });

    socket.on(ClientEvent.Block, (data: BlockPayload) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.roomId) return;

        const managed = roomManager.getRoom(meta.roomId);
        if (!managed || !managed.engine) return;

        const result = managed.engine.handleBlock(meta.playerId, data.claimedCharacter);
        if (!result.success) {
          socket.emit(ServerEvent.Error, { message: result.error });
          return;
        }

        broadcastGameState(managed, io);
        checkAndScheduleBots(managed, botEngine, io);
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Block failed.' });
      }
    });

    socket.on(ClientEvent.PassBlock, () => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.roomId) return;

        const managed = roomManager.getRoom(meta.roomId);
        if (!managed || !managed.engine) return;

        const result = managed.engine.handlePassBlock(meta.playerId);
        if (!result.success) {
          socket.emit(ServerEvent.Error, { message: result.error });
          return;
        }

        broadcastGameState(managed, io);
        checkAndScheduleBots(managed, botEngine, io);
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Pass block failed.' });
      }
    });

    socket.on(ClientEvent.ChallengeBlock, () => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.roomId) return;

        const managed = roomManager.getRoom(meta.roomId);
        if (!managed || !managed.engine) return;

        const result = managed.engine.handleChallengeBlock(meta.playerId);
        if (!result.success) {
          socket.emit(ServerEvent.Error, { message: result.error });
          return;
        }

        broadcastGameState(managed, io);
        checkAndScheduleBots(managed, botEngine, io);
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Challenge block failed.' });
      }
    });

    socket.on(ClientEvent.PassBlockChallenge, () => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.roomId) return;

        const managed = roomManager.getRoom(meta.roomId);
        if (!managed || !managed.engine) return;

        const result = managed.engine.handlePassBlockChallenge(meta.playerId);
        if (!result.success) {
          socket.emit(ServerEvent.Error, { message: result.error });
          return;
        }

        broadcastGameState(managed, io);
        checkAndScheduleBots(managed, botEngine, io);
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Pass block challenge failed.' });
      }
    });

    socket.on(ClientEvent.ChooseLoseInfluence, (data: ChooseLoseInfluencePayload) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.roomId) return;

        const managed = roomManager.getRoom(meta.roomId);
        if (!managed || !managed.engine) return;

        const result = managed.engine.handleLoseInfluence(meta.playerId, data.cardId);
        if (!result.success) {
          socket.emit(ServerEvent.Error, { message: result.error });
          return;
        }

        broadcastGameState(managed, io);
        checkAndScheduleBots(managed, botEngine, io);
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Choose influence failed.' });
      }
    });

    socket.on(ClientEvent.ChooseExchangeCards, (data: ChooseExchangePayload) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta || !meta.roomId) return;

        const managed = roomManager.getRoom(meta.roomId);
        if (!managed || !managed.engine) return;

        const result = managed.engine.handleExchangeChoice(meta.playerId, data.keepCardIds);
        if (!result.success) {
          socket.emit(ServerEvent.Error, { message: result.error });
          return;
        }

        broadcastGameState(managed, io);
        checkAndScheduleBots(managed, botEngine, io);
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Exchange failed.' });
      }
    });

    // ─── CHAT ────────────────────────────────────────────────────

    socket.on(ClientEvent.SendMessage, (data: ChatMessagePayload) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta) return;

        io.to(data.roomId).emit(ServerEvent.ChatMessage, {
          playerId: meta.playerId,
          playerName: meta.playerName,
          message: data.message,
          timestamp: Date.now(),
        });
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: 'Chat failed.' });
      }
    });

    socket.on(ClientEvent.SendReaction, (data: { roomId: string; reaction: string }) => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta) return;

        io.to(data.roomId).emit(ServerEvent.Reaction, {
          playerId: meta.playerId,
          playerName: meta.playerName,
          reaction: data.reaction,
          timestamp: Date.now(),
        });
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: 'Reaction failed.' });
      }
    });

    // ─── RECONNECT ───────────────────────────────────────────────

    socket.on(ClientEvent.Reconnect, (data: { playerId: string; roomId: string }) => {
      try {
        const disconnectInfo = disconnectedPlayers.get(data.playerId);
        if (!disconnectInfo) {
          socket.emit(ServerEvent.Error, { message: 'No reconnection session found.' });
          return;
        }

        if (Date.now() - disconnectInfo.disconnectedAt > RECONNECT_WINDOW_MS) {
          disconnectedPlayers.delete(data.playerId);
          socket.emit(ServerEvent.Error, { message: 'Reconnection window expired.' });
          return;
        }

        const managed = roomManager.getRoom(data.roomId);
        if (!managed) {
          socket.emit(ServerEvent.Error, { message: 'Room no longer exists.' });
          return;
        }

        // Restore socket mapping
        socketMeta.set(socket.id, {
          playerId: data.playerId,
          playerName: disconnectInfo.roomId, // we'll fix this below
          roomId: data.roomId,
        });
        playerSocketMap.set(data.playerId, socket.id);
        disconnectedPlayers.delete(data.playerId);

        // Fix player name from room data
        const playerData = managed.playerData.find((p) => p.id === data.playerId);
        if (playerData) {
          socketMeta.get(socket.id)!.playerName = playerData.name;
        }

        // Update connected status
        const playerView = managed.room.players.find((p) => p.id === data.playerId);
        if (playerView) {
          playerView.connected = true;
        }

        if (managed.engine) {
          managed.engine.setPlayerConnected(data.playerId, true);
        }

        socket.join(data.roomId);

        io.to(data.roomId).emit(ServerEvent.PlayerReconnected, { playerId: data.playerId });

        // Send current state
        socket.emit(ServerEvent.RoomUpdated, managed.room);
        if (managed.engine) {
          socket.emit(ServerEvent.GameStateUpdate, managed.engine.getStateForPlayer(data.playerId));
        }
      } catch (err: any) {
        socket.emit(ServerEvent.Error, { message: err.message || 'Reconnection failed.' });
      }
    });

    // ─── DISCONNECT ──────────────────────────────────────────────

    socket.on('disconnect', () => {
      try {
        const meta = socketMeta.get(socket.id);
        if (!meta) return;

        console.log(`[Socket] Disconnected: ${socket.id} (player: ${meta.playerId})`);

        if (meta.roomId) {
          const managed = roomManager.getRoom(meta.roomId);
          if (managed) {
            // Mark as disconnected, allow 60-second reconnection window
            const playerView = managed.room.players.find((p) => p.id === meta.playerId);
            if (playerView && !playerView.isBot) {
              playerView.connected = false;

              if (managed.engine) {
                managed.engine.setPlayerConnected(meta.playerId, false);
              }

              disconnectedPlayers.set(meta.playerId, {
                roomId: meta.roomId,
                disconnectedAt: Date.now(),
              });

              io.to(meta.roomId).emit(ServerEvent.PlayerDisconnected, {
                playerId: meta.playerId,
              });

              // If game hasn't started, remove the player after a short delay
              if (!managed.room.gameStarted) {
                setTimeout(() => {
                  const stillDisconnected = disconnectedPlayers.get(meta.playerId);
                  if (stillDisconnected) {
                    disconnectedPlayers.delete(meta.playerId);
                    roomManager.leaveRoom(meta.roomId!, meta.playerId);
                    const updatedManaged = roomManager.getRoom(meta.roomId!);
                    if (updatedManaged) {
                      io.to(meta.roomId!).emit(ServerEvent.RoomUpdated, updatedManaged.room);
                    }
                    io.emit(ServerEvent.RoomList, roomManager.getPublicRooms());
                  }
                }, RECONNECT_WINDOW_MS);
              }
            }

            // Remove spectator if applicable
            roomManager.removeSpectator(meta.roomId, meta.playerId);
          }
        }

        socketMeta.delete(socket.id);
        playerSocketMap.delete(meta.playerId);
      } catch (err: any) {
        console.error('[Socket] Disconnect error:', err);
      }
    });
  });

  // ─── Helper Functions ────────────────────────────────────────────

  function getOrCreateMeta(socket: Socket, playerName: string): SocketMeta {
    let meta = socketMeta.get(socket.id);
    if (!meta) {
      meta = {
        playerId: socket.id,
        playerName: playerName || 'Anonymous',
        roomId: null,
      };
      socketMeta.set(socket.id, meta);
      playerSocketMap.set(meta.playerId, socket.id);
    }
    return meta;
  }

  function setupEngineCallbacks(managed: ManagedRoom, io: Server): void {
    if (!managed.engine) return;

    managed.engine.onStateChange = () => {
      broadcastGameState(managed, io);
    };

    managed.engine.onBotTurn = (botPlayerId: string) => {
      scheduleBotAction(managed, botPlayerId, botEngine, io);
    };
  }

  function broadcastGameState(managed: ManagedRoom, io: Server): void {
    if (!managed.engine) return;

    const roomId = managed.room.id;

    // Send personalized state to each player
    for (const playerData of managed.playerData) {
      if (playerData.isBot) continue;

      const socketId = playerSocketMap.get(playerData.id);
      if (socketId) {
        const playerSocket = io.sockets.sockets.get(socketId);
        if (playerSocket) {
          playerSocket.emit(
            ServerEvent.GameStateUpdate,
            managed.engine.getStateForPlayer(playerData.id)
          );
        }
      }
    }

    // Send spectator view to spectators
    for (const spectator of managed.room.spectators) {
      const socketId = playerSocketMap.get(spectator.id);
      if (socketId) {
        const spectatorSocket = io.sockets.sockets.get(socketId);
        if (spectatorSocket) {
          spectatorSocket.emit(
            ServerEvent.GameStateUpdate,
            managed.engine.getStateForSpectator()
          );
        }
      }
    }

    // Check for game over
    if (managed.engine.isGameOver()) {
      const gameState = managed.engine.getGameState();
      io.to(roomId).emit(ServerEvent.GameOver, {
        winnerId: gameState.winner,
        winnerName: gameState.players.find((p) => p.id === gameState.winner)?.name || 'Unknown',
      });
    }
  }

  function scheduleBotAction(
    managed: ManagedRoom,
    botPlayerId: string,
    botEngine: BotEngine,
    io: Server
  ): void {
    if (!managed.engine) return;

    const gameState = managed.engine.getGameState();
    const botPlayer = gameState.players.find((p) => p.id === botPlayerId);
    if (!botPlayer || !botPlayer.alive || !botPlayer.isBot) return;

    const difficulty = botPlayer.botDifficulty || BotDifficulty.Easy;
    const delay = botEngine.getDelay(difficulty);

    setTimeout(() => {
      if (!managed.engine || managed.engine.isGameOver()) return;

      const currentState = managed.engine.getGameState();
      const currentBot = currentState.players.find((p) => p.id === botPlayerId);
      if (!currentBot || !currentBot.alive) return;

      try {
        switch (currentState.phase) {
          case GamePhase.ActionPhase: {
            const currentPlayer = currentState.players[currentState.currentPlayerIndex];
            if (currentPlayer.id !== botPlayerId) return;

            const decision = botEngine.decideBotAction(currentState, currentBot, difficulty);
            managed.engine!.performAction(botPlayerId, decision.action, decision.targetId);
            broadcastGameState(managed, io);
            checkAndScheduleBots(managed, botEngine, io);
            break;
          }

          case GamePhase.ExchangePhase: {
            if (!currentState.pendingExchange || currentState.pendingExchange.playerId !== botPlayerId) return;

            const exchange = currentState.pendingExchange;
            const allCards = [...exchange.playerCards.filter(c => !c.revealed), ...exchange.drawnCards];
            const keepCount = exchange.playerCards.filter(c => !c.revealed).length;
            const keepIds = botEngine.decideBotExchange(allCards, keepCount, difficulty);

            managed.engine!.handleExchangeChoice(botPlayerId, keepIds);
            broadcastGameState(managed, io);
            checkAndScheduleBots(managed, botEngine, io);
            break;
          }

          case GamePhase.ResolveLoseInfluence: {
            if (!currentState.pendingLoseInfluence || currentState.pendingLoseInfluence.playerId !== botPlayerId) return;

            const cardId = botEngine.decideBotLoseInfluence(currentBot);
            managed.engine!.handleLoseInfluence(botPlayerId, cardId);
            broadcastGameState(managed, io);
            checkAndScheduleBots(managed, botEngine, io);
            break;
          }

          default:
            break;
        }
      } catch (err: any) {
        console.error(`[Bot] Error for bot ${botPlayerId}:`, err.message);
      }
    }, delay);
  }

  function checkAndScheduleBots(
    managed: ManagedRoom,
    botEngine: BotEngine,
    io: Server
  ): void {
    if (!managed.engine || managed.engine.isGameOver()) return;

    const gameState = managed.engine.getGameState();
    const phase = gameState.phase;

    switch (phase) {
      case GamePhase.ActionPhase: {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer.isBot && currentPlayer.alive) {
          scheduleBotAction(managed, currentPlayer.id, botEngine, io);
        }
        break;
      }

      case GamePhase.ChallengePhase: {
        // Check if any bots need to respond to challenge phase
        if (!gameState.pendingAction) break;
        const actingPlayerId = gameState.pendingAction.playerId;
        const respondedSet = new Set(gameState.pendingAction.respondedPlayers);

        for (const player of gameState.players) {
          if (
            player.isBot &&
            player.alive &&
            player.id !== actingPlayerId &&
            !respondedSet.has(player.id)
          ) {
            scheduleBotChallengeResponse(managed, player.id, botEngine, io);
          }
        }
        break;
      }

      case GamePhase.BlockPhase: {
        // Check if any bots need to respond to block phase
        if (!gameState.pendingAction) break;
        scheduleBotBlockResponses(managed, botEngine, io);
        break;
      }

      case GamePhase.BlockChallengePhase: {
        // Check if any bots need to respond to block challenge
        if (!gameState.pendingBlock) break;
        const blockerId = gameState.pendingBlock.blockerId;
        const respondedSet = new Set(gameState.pendingBlock.respondedPlayers);

        for (const player of gameState.players) {
          if (
            player.isBot &&
            player.alive &&
            player.id !== blockerId &&
            !respondedSet.has(player.id)
          ) {
            scheduleBotBlockChallengeResponse(managed, player.id, botEngine, io);
          }
        }
        break;
      }

      case GamePhase.ResolveLoseInfluence: {
        if (!gameState.pendingLoseInfluence) break;
        const loserId = gameState.pendingLoseInfluence.playerId;
        const loser = gameState.players.find((p) => p.id === loserId);
        if (loser && loser.isBot && loser.alive) {
          scheduleBotAction(managed, loser.id, botEngine, io);
        }
        break;
      }

      case GamePhase.ExchangePhase: {
        if (!gameState.pendingExchange) break;
        const exchangePlayer = gameState.players.find((p) => p.id === gameState.pendingExchange!.playerId);
        if (exchangePlayer && exchangePlayer.isBot) {
          scheduleBotAction(managed, exchangePlayer.id, botEngine, io);
        }
        break;
      }
    }
  }

  function scheduleBotChallengeResponse(
    managed: ManagedRoom,
    botPlayerId: string,
    botEngine: BotEngine,
    io: Server
  ): void {
    if (!managed.engine) return;

    const gameState = managed.engine.getGameState();
    const botPlayer = gameState.players.find((p) => p.id === botPlayerId);
    if (!botPlayer || !botPlayer.alive || !botPlayer.isBot) return;

    const difficulty = botPlayer.botDifficulty || BotDifficulty.Easy;
    const delay = botEngine.getDelay(difficulty);

    setTimeout(() => {
      if (!managed.engine || managed.engine.isGameOver()) return;
      const currentState = managed.engine.getGameState();
      if (currentState.phase !== GamePhase.ChallengePhase || !currentState.pendingAction) return;

      const currentBot = currentState.players.find((p) => p.id === botPlayerId);
      if (!currentBot || !currentBot.alive) return;

      if (currentState.pendingAction.respondedPlayers.includes(botPlayerId)) return;

      try {
        const shouldChallenge = botEngine.decideBotChallenge(
          currentState,
          currentBot,
          currentState.pendingAction,
          difficulty
        );

        if (shouldChallenge) {
          managed.engine!.handleChallenge(botPlayerId);
        } else {
          managed.engine!.handlePassChallenge(botPlayerId);
        }

        broadcastGameState(managed, io);
        checkAndScheduleBots(managed, botEngine, io);
      } catch (err: any) {
        console.error(`[Bot] Challenge response error for ${botPlayerId}:`, err.message);
      }
    }, delay);
  }

  function scheduleBotBlockResponses(
    managed: ManagedRoom,
    botEngine: BotEngine,
    io: Server
  ): void {
    if (!managed.engine) return;

    const gameState = managed.engine.getGameState();
    if (!gameState.pendingAction) return;

    const pendingAction = gameState.pendingAction;
    const actionDef = ACTION_DEFINITIONS[pendingAction.action];

    // Determine eligible blockers
    let eligibleBots: string[];
    if (actionDef.requiresTarget && pendingAction.targetId) {
      const target = gameState.players.find((p) => p.id === pendingAction.targetId);
      eligibleBots = target && target.isBot && target.alive ? [target.id] : [];
    } else {
      eligibleBots = gameState.players
        .filter((p) => p.isBot && p.alive && p.id !== pendingAction.playerId)
        .map((p) => p.id);
    }

    for (const botId of eligibleBots) {
      const botPlayer = gameState.players.find((p) => p.id === botId);
      if (!botPlayer) continue;

      const difficulty = botPlayer.botDifficulty || BotDifficulty.Easy;
      const delay = botEngine.getDelay(difficulty);

      setTimeout(() => {
        if (!managed.engine || managed.engine.isGameOver()) return;
        const currentState = managed.engine.getGameState();
        if (currentState.phase !== GamePhase.BlockPhase || !currentState.pendingAction) return;

        const currentBot = currentState.players.find((p) => p.id === botId);
        if (!currentBot || !currentBot.alive) return;

        try {
          const blockChar = botEngine.decideBotBlock(
            currentState,
            currentBot,
            currentState.pendingAction!,
            difficulty
          );

          if (blockChar) {
            managed.engine!.handleBlock(botId, blockChar);
          } else {
            managed.engine!.handlePassBlock(botId);
          }

          broadcastGameState(managed, io);
          checkAndScheduleBots(managed, botEngine, io);
        } catch (err: any) {
          console.error(`[Bot] Block response error for ${botId}:`, err.message);
        }
      }, delay);
    }
  }

  function scheduleBotBlockChallengeResponse(
    managed: ManagedRoom,
    botPlayerId: string,
    botEngine: BotEngine,
    io: Server
  ): void {
    if (!managed.engine) return;

    const gameState = managed.engine.getGameState();
    const botPlayer = gameState.players.find((p) => p.id === botPlayerId);
    if (!botPlayer || !botPlayer.alive || !botPlayer.isBot) return;

    const difficulty = botPlayer.botDifficulty || BotDifficulty.Easy;
    const delay = botEngine.getDelay(difficulty);

    setTimeout(() => {
      if (!managed.engine || managed.engine.isGameOver()) return;
      const currentState = managed.engine.getGameState();
      if (currentState.phase !== GamePhase.BlockChallengePhase || !currentState.pendingBlock) return;

      const currentBot = currentState.players.find((p) => p.id === botPlayerId);
      if (!currentBot || !currentBot.alive) return;

      if (currentState.pendingBlock.respondedPlayers.includes(botPlayerId)) return;

      try {
        const shouldChallenge = botEngine.decideBotBlockChallenge(
          currentState,
          currentBot,
          currentState.pendingBlock,
          difficulty
        );

        if (shouldChallenge) {
          managed.engine!.handleChallengeBlock(botPlayerId);
        } else {
          managed.engine!.handlePassBlockChallenge(botPlayerId);
        }

        broadcastGameState(managed, io);
        checkAndScheduleBots(managed, botEngine, io);
      } catch (err: any) {
        console.error(`[Bot] Block challenge response error for ${botPlayerId}:`, err.message);
      }
    }, delay);
  }
}

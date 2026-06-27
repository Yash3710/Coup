// ============================================================
// COUP — Shared Types (Client + Server)
// ============================================================

// --- Characters ---
export enum Character {
  Duke = 'Duke',
  Assassin = 'Assassin',
  Captain = 'Captain',
  Ambassador = 'Ambassador',
  Contessa = 'Contessa',
}

// --- Actions ---
export enum Action {
  Income = 'Income',
  ForeignAid = 'ForeignAid',
  Tax = 'Tax',
  Coup = 'Coup',
  Assassinate = 'Assassinate',
  Steal = 'Steal',
  Exchange = 'Exchange',
}

// --- Game Phases ---
export enum GamePhase {
  Waiting = 'Waiting',
  Dealing = 'Dealing',
  ActionPhase = 'ActionPhase',
  ChallengePhase = 'ChallengePhase',
  BlockPhase = 'BlockPhase',
  BlockChallengePhase = 'BlockChallengePhase',
  ResolveLoseInfluence = 'ResolveLoseInfluence',
  ExchangePhase = 'ExchangePhase',
  GameOver = 'GameOver',
}

// --- Card ---
export interface Card {
  id: string;
  character: Character;
  revealed: boolean;
}

// --- Player ---
export interface Player {
  id: string;
  name: string;
  avatarUrl: string;
  coins: number;
  cards: Card[];
  alive: boolean;
  connected: boolean;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
}

// Client-side player view (cards hidden for opponents)
export interface PlayerView {
  id: string;
  name: string;
  avatarUrl: string;
  coins: number;
  cards: CardView[];
  alive: boolean;
  connected: boolean;
  isBot: boolean;
}

export interface CardView {
  id: string;
  character?: Character; // Only visible if revealed or own card
  revealed: boolean;
}

// --- Bot ---
export enum BotDifficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
  Expert = 'Expert',
}

// --- Room ---
export interface Room {
  id: string;
  name: string;
  hostId: string;
  players: PlayerView[];
  maxPlayers: number;
  isPrivate: boolean;
  password?: string;
  inviteCode: string;
  spectators: Spectator[];
  settings: RoomSettings;
  gameStarted: boolean;
}

export interface RoomSettings {
  maxPlayers: number;
  turnTimer: number; // seconds
  isPrivate: boolean;
  password?: string;
}

export interface Spectator {
  id: string;
  name: string;
}

export interface RoomListItem {
  id: string;
  name: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  isPrivate: boolean;
  gameStarted: boolean;
}

// --- Game State (Server-side, full) ---
export interface GameState {
  roomId: string;
  players: Player[];
  deck: Card[];
  currentPlayerIndex: number;
  phase: GamePhase;
  turnNumber: number;
  pendingAction: PendingAction | null;
  pendingBlock: PendingBlock | null;
  pendingChallenge: PendingChallenge | null;
  pendingLoseInfluence: PendingLoseInfluence | null;
  pendingExchange: PendingExchange | null;
  gameLog: GameLogEntry[];
  winner: string | null;
  turnTimerEnd: number | null;
  startedAt: number;
}

// Client-side game state view
export interface GameStateView {
  roomId: string;
  players: PlayerView[];
  currentPlayerIndex: number;
  phase: GamePhase;
  turnNumber: number;
  pendingAction: PendingAction | null;
  pendingBlock: PendingBlock | null;
  pendingChallenge: PendingChallenge | null;
  pendingLoseInfluence: PendingLoseInfluenceView | null;
  pendingExchange: PendingExchangeView | null;
  gameLog: GameLogEntry[];
  winner: string | null;
  turnTimerEnd: number | null;
  startedAt: number;
  myPlayerId: string;
}

// --- Pending Actions ---
export interface PendingAction {
  playerId: string;
  action: Action;
  targetId?: string;
  claimedCharacter?: Character;
  respondedPlayers: string[]; // Players who passed on challenging
}

export interface PendingBlock {
  blockerId: string;
  claimedCharacter: Character;
  originalAction: Action;
  originalPlayerId: string;
  targetId?: string;
  respondedPlayers: string[]; // Players who passed on challenging the block
}

export interface PendingChallenge {
  challengerId: string;
  challengedPlayerId: string;
  claimedCharacter: Character;
  isBlockChallenge: boolean;
}

export interface PendingLoseInfluence {
  playerId: string;
  reason: string;
  // After choosing, continue with original action?
  continueAction: boolean;
  originalAction?: PendingAction;
}

export interface PendingLoseInfluenceView {
  playerId: string;
  reason: string;
}

export interface PendingExchange {
  playerId: string;
  drawnCards: Card[]; // The 2 cards drawn from deck
  playerCards: Card[]; // The player's current cards
  // Player must choose which cards to keep (same count as alive cards)
}

export interface PendingExchangeView {
  playerId: string;
  // Only the exchanging player sees the cards
  availableCards?: Card[];
  keepCount?: number;
}

// --- Game Log ---
export interface GameLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: LogType;
  playerId?: string;
  targetId?: string;
}

export enum LogType {
  Action = 'Action',
  Challenge = 'Challenge',
  Block = 'Block',
  Reveal = 'Reveal',
  Elimination = 'Elimination',
  CoinChange = 'CoinChange',
  System = 'System',
  GameOver = 'GameOver',
}

// --- Action Definitions ---
export interface ActionDefinition {
  action: Action;
  label: string;
  description: string;
  cost: number;
  requiresTarget: boolean;
  requiredCharacter?: Character;
  canBeBlocked: boolean;
  blockedBy: Character[];
  canBeChallenged: boolean;
}

export const ACTION_DEFINITIONS: Record<Action, ActionDefinition> = {
  [Action.Income]: {
    action: Action.Income,
    label: 'Income',
    description: 'Take 1 coin. Cannot be blocked or challenged.',
    cost: 0,
    requiresTarget: false,
    canBeBlocked: false,
    blockedBy: [],
    canBeChallenged: false,
  },
  [Action.ForeignAid]: {
    action: Action.ForeignAid,
    label: 'Foreign Aid',
    description: 'Take 2 coins. Can be blocked by Duke.',
    cost: 0,
    requiresTarget: false,
    canBeBlocked: true,
    blockedBy: [Character.Duke],
    canBeChallenged: false,
  },
  [Action.Tax]: {
    action: Action.Tax,
    label: 'Tax',
    description: 'Claim Duke. Take 3 coins.',
    cost: 0,
    requiresTarget: false,
    requiredCharacter: Character.Duke,
    canBeBlocked: false,
    blockedBy: [],
    canBeChallenged: true,
  },
  [Action.Coup]: {
    action: Action.Coup,
    label: 'Coup',
    description: 'Pay 7 coins. Target loses one influence. Cannot be blocked or challenged.',
    cost: 7,
    requiresTarget: true,
    canBeBlocked: false,
    blockedBy: [],
    canBeChallenged: false,
  },
  [Action.Assassinate]: {
    action: Action.Assassinate,
    label: 'Assassinate',
    description: 'Claim Assassin. Pay 3 coins. Target loses one influence.',
    cost: 3,
    requiresTarget: true,
    requiredCharacter: Character.Assassin,
    canBeBlocked: true,
    blockedBy: [Character.Contessa],
    canBeChallenged: true,
  },
  [Action.Steal]: {
    action: Action.Steal,
    label: 'Steal',
    description: 'Claim Captain. Take 2 coins from target.',
    cost: 0,
    requiresTarget: true,
    requiredCharacter: Character.Captain,
    canBeBlocked: true,
    blockedBy: [Character.Captain, Character.Ambassador],
    canBeChallenged: true,
  },
  [Action.Exchange]: {
    action: Action.Exchange,
    label: 'Exchange',
    description: 'Claim Ambassador. Draw 2 cards, choose which to keep.',
    cost: 0,
    requiresTarget: false,
    requiredCharacter: Character.Ambassador,
    canBeBlocked: false,
    blockedBy: [],
    canBeChallenged: true,
  },
};

// --- Character Definitions ---
export interface CharacterDefinition {
  character: Character;
  name: string;
  description: string;
  activeAbility: string;
  blockAbility: string;
  color: string; // Theme color for the character
  cardImageUrl?: string;
}

export const CHARACTER_DEFINITIONS: Record<Character, CharacterDefinition> = {
  [Character.Duke]: {
    character: Character.Duke,
    name: 'Duke',
    description: 'A powerful noble who controls the treasury.',
    activeAbility: 'Tax: Take 3 coins from the treasury.',
    blockAbility: 'Blocks Foreign Aid.',
    color: '#9333ea', // Purple
  },
  [Character.Assassin]: {
    character: Character.Assassin,
    name: 'Assassin',
    description: 'A deadly hired killer.',
    activeAbility: 'Assassinate: Pay 3 coins to make a player lose influence.',
    blockAbility: 'None.',
    color: '#1e293b', // Dark slate
  },
  [Character.Captain]: {
    character: Character.Captain,
    name: 'Captain',
    description: 'A military officer who steals from others.',
    activeAbility: 'Steal: Take 2 coins from another player.',
    blockAbility: 'Blocks Steal.',
    color: '#2563eb', // Blue
  },
  [Character.Ambassador]: {
    character: Character.Ambassador,
    name: 'Ambassador',
    description: 'A diplomat with access to new influences.',
    activeAbility: 'Exchange: Draw 2 cards, choose which to keep.',
    blockAbility: 'Blocks Steal.',
    color: '#16a34a', // Green
  },
  [Character.Contessa]: {
    character: Character.Contessa,
    name: 'Contessa',
    description: 'A powerful countess with protective influence.',
    activeAbility: 'None.',
    blockAbility: 'Blocks Assassination.',
    color: '#dc2626', // Red
  },
};

// --- Socket Events ---
export enum ClientEvent {
  // Lobby
  JoinLobby = 'join_lobby',
  CreateRoom = 'create_room',
  JoinRoom = 'join_room',
  JoinRoomByCode = 'join_room_by_code',
  LeaveRoom = 'leave_room',
  UpdateSettings = 'update_settings',
  AddBot = 'add_bot',
  RemoveBot = 'remove_bot',
  StartGame = 'start_game',
  JoinAsSpectator = 'join_as_spectator',

  // Game Actions
  PerformAction = 'perform_action',
  Challenge = 'challenge',
  PassChallenge = 'pass_challenge',
  Block = 'block',
  PassBlock = 'pass_block',
  ChallengeBlock = 'challenge_block',
  PassBlockChallenge = 'pass_block_challenge',
  ChooseLoseInfluence = 'choose_lose_influence',
  ChooseExchangeCards = 'choose_exchange_cards',

  // Chat
  SendMessage = 'send_message',
  SendReaction = 'send_reaction',

  // System
  Reconnect = 'reconnect',
  Disconnect = 'disconnect',
}

export enum ServerEvent {
  // Lobby
  LobbyUpdate = 'lobby_update',
  RoomCreated = 'room_created',
  RoomUpdated = 'room_updated',
  RoomJoined = 'room_joined',
  RoomLeft = 'room_left',
  RoomError = 'room_error',
  RoomList = 'room_list',

  // Game
  GameStarted = 'game_started',
  GameStateUpdate = 'game_state_update',
  ActionAnnounced = 'action_announced',
  ChallengeResult = 'challenge_result',
  BlockAnnounced = 'block_announced',
  InfluenceLost = 'influence_lost',
  PlayerEliminated = 'player_eliminated',
  GameOver = 'game_over',
  TurnTimeout = 'turn_timeout',
  ExchangeCards = 'exchange_cards',

  // Chat
  ChatMessage = 'chat_message',
  Reaction = 'reaction',

  // System
  PlayerReconnected = 'player_reconnected',
  PlayerDisconnected = 'player_disconnected',
  Error = 'error',
}

// --- Socket Payloads ---
export interface CreateRoomPayload {
  playerName: string;
  avatarUrl: string;
  roomName: string;
  settings: RoomSettings;
}

export interface JoinRoomPayload {
  playerName: string;
  avatarUrl: string;
  roomId: string;
  password?: string;
}

export interface JoinRoomByCodePayload {
  playerName: string;
  avatarUrl: string;
  inviteCode: string;
  password?: string;
}

export interface PerformActionPayload {
  action: Action;
  targetId?: string;
}

export interface BlockPayload {
  claimedCharacter: Character;
}

export interface ChooseLoseInfluencePayload {
  cardId: string;
}

export interface ChooseExchangePayload {
  keepCardIds: string[];
}

export interface ChatMessagePayload {
  message: string;
  roomId: string;
}

export interface AddBotPayload {
  difficulty: BotDifficulty;
}

// --- Admin Types ---
export interface AdminCharacterConfig {
  character: Character;
  name: string;
  description: string;
  activeAbility: string;
  blockAbility: string;
  cardImageUrl?: string;
}

export interface AvatarConfig {
  id: string;
  url: string;
  name: string;
}

// --- Statistics ---
export interface GameStats {
  turns: number;
  coinsEarned: number;
  successfulBluffs: number;
  challengesWon: number;
  challengesLost: number;
  cardsRevealed: number;
  duration: number; // seconds
}

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  averagePlacement: number;
  favoriteCharacter: Character;
  biggestCoinCount: number;
  successfulBluffs: number;
  failedBluffs: number;
  challengeAccuracy: number;
  blockAccuracy: number;
  longestStreak: number;
  averageGameLength: number;
}

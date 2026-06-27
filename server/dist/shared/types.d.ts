export declare enum Character {
    Duke = "Duke",
    Assassin = "Assassin",
    Captain = "Captain",
    Ambassador = "Ambassador",
    Contessa = "Contessa"
}
export declare enum Action {
    Income = "Income",
    ForeignAid = "ForeignAid",
    Tax = "Tax",
    Coup = "Coup",
    Assassinate = "Assassinate",
    Steal = "Steal",
    Exchange = "Exchange"
}
export declare enum GamePhase {
    Waiting = "Waiting",
    Dealing = "Dealing",
    ActionPhase = "ActionPhase",
    ChallengePhase = "ChallengePhase",
    BlockPhase = "BlockPhase",
    BlockChallengePhase = "BlockChallengePhase",
    ResolveLoseInfluence = "ResolveLoseInfluence",
    ExchangePhase = "ExchangePhase",
    GameOver = "GameOver"
}
export interface Card {
    id: string;
    character: Character;
    revealed: boolean;
}
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
    character?: Character;
    revealed: boolean;
}
export declare enum BotDifficulty {
    Easy = "Easy",
    Medium = "Medium",
    Hard = "Hard",
    Expert = "Expert"
}
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
    turnTimer: number;
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
export interface PendingAction {
    playerId: string;
    action: Action;
    targetId?: string;
    claimedCharacter?: Character;
    respondedPlayers: string[];
}
export interface PendingBlock {
    blockerId: string;
    claimedCharacter: Character;
    originalAction: Action;
    originalPlayerId: string;
    targetId?: string;
    respondedPlayers: string[];
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
    continueAction: boolean;
    originalAction?: PendingAction;
}
export interface PendingLoseInfluenceView {
    playerId: string;
    reason: string;
}
export interface PendingExchange {
    playerId: string;
    drawnCards: Card[];
    playerCards: Card[];
}
export interface PendingExchangeView {
    playerId: string;
    availableCards?: Card[];
    keepCount?: number;
}
export interface GameLogEntry {
    id: string;
    timestamp: number;
    message: string;
    type: LogType;
    playerId?: string;
    targetId?: string;
}
export declare enum LogType {
    Action = "Action",
    Challenge = "Challenge",
    Block = "Block",
    Reveal = "Reveal",
    Elimination = "Elimination",
    CoinChange = "CoinChange",
    System = "System",
    GameOver = "GameOver"
}
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
export declare const ACTION_DEFINITIONS: Record<Action, ActionDefinition>;
export interface CharacterDefinition {
    character: Character;
    name: string;
    description: string;
    activeAbility: string;
    blockAbility: string;
    color: string;
    cardImageUrl?: string;
}
export declare const CHARACTER_DEFINITIONS: Record<Character, CharacterDefinition>;
export declare enum ClientEvent {
    JoinLobby = "join_lobby",
    CreateRoom = "create_room",
    JoinRoom = "join_room",
    JoinRoomByCode = "join_room_by_code",
    LeaveRoom = "leave_room",
    UpdateSettings = "update_settings",
    AddBot = "add_bot",
    RemoveBot = "remove_bot",
    StartGame = "start_game",
    JoinAsSpectator = "join_as_spectator",
    PerformAction = "perform_action",
    Challenge = "challenge",
    PassChallenge = "pass_challenge",
    Block = "block",
    PassBlock = "pass_block",
    ChallengeBlock = "challenge_block",
    PassBlockChallenge = "pass_block_challenge",
    ChooseLoseInfluence = "choose_lose_influence",
    ChooseExchangeCards = "choose_exchange_cards",
    SendMessage = "send_message",
    SendReaction = "send_reaction",
    Reconnect = "reconnect",
    Disconnect = "disconnect"
}
export declare enum ServerEvent {
    LobbyUpdate = "lobby_update",
    RoomCreated = "room_created",
    RoomUpdated = "room_updated",
    RoomJoined = "room_joined",
    RoomLeft = "room_left",
    RoomError = "room_error",
    RoomList = "room_list",
    GameStarted = "game_started",
    GameStateUpdate = "game_state_update",
    ActionAnnounced = "action_announced",
    ChallengeResult = "challenge_result",
    BlockAnnounced = "block_announced",
    InfluenceLost = "influence_lost",
    PlayerEliminated = "player_eliminated",
    GameOver = "game_over",
    TurnTimeout = "turn_timeout",
    ExchangeCards = "exchange_cards",
    ChatMessage = "chat_message",
    Reaction = "reaction",
    PlayerReconnected = "player_reconnected",
    PlayerDisconnected = "player_disconnected",
    Error = "error"
}
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
export interface GameStats {
    turns: number;
    coinsEarned: number;
    successfulBluffs: number;
    challengesWon: number;
    challengesLost: number;
    cardsRevealed: number;
    duration: number;
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
//# sourceMappingURL=types.d.ts.map
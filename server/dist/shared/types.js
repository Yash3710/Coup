"use strict";
// ============================================================
// COUP — Shared Types (Client + Server)
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerEvent = exports.ClientEvent = exports.CHARACTER_DEFINITIONS = exports.ACTION_DEFINITIONS = exports.LogType = exports.BotDifficulty = exports.GamePhase = exports.Action = exports.Character = void 0;
// --- Characters ---
var Character;
(function (Character) {
    Character["Duke"] = "Duke";
    Character["Assassin"] = "Assassin";
    Character["Captain"] = "Captain";
    Character["Ambassador"] = "Ambassador";
    Character["Contessa"] = "Contessa";
})(Character || (exports.Character = Character = {}));
// --- Actions ---
var Action;
(function (Action) {
    Action["Income"] = "Income";
    Action["ForeignAid"] = "ForeignAid";
    Action["Tax"] = "Tax";
    Action["Coup"] = "Coup";
    Action["Assassinate"] = "Assassinate";
    Action["Steal"] = "Steal";
    Action["Exchange"] = "Exchange";
})(Action || (exports.Action = Action = {}));
// --- Game Phases ---
var GamePhase;
(function (GamePhase) {
    GamePhase["Waiting"] = "Waiting";
    GamePhase["Dealing"] = "Dealing";
    GamePhase["ActionPhase"] = "ActionPhase";
    GamePhase["ChallengePhase"] = "ChallengePhase";
    GamePhase["BlockPhase"] = "BlockPhase";
    GamePhase["BlockChallengePhase"] = "BlockChallengePhase";
    GamePhase["ResolveLoseInfluence"] = "ResolveLoseInfluence";
    GamePhase["ExchangePhase"] = "ExchangePhase";
    GamePhase["GameOver"] = "GameOver";
})(GamePhase || (exports.GamePhase = GamePhase = {}));
// --- Bot ---
var BotDifficulty;
(function (BotDifficulty) {
    BotDifficulty["Easy"] = "Easy";
    BotDifficulty["Medium"] = "Medium";
    BotDifficulty["Hard"] = "Hard";
    BotDifficulty["Expert"] = "Expert";
})(BotDifficulty || (exports.BotDifficulty = BotDifficulty = {}));
var LogType;
(function (LogType) {
    LogType["Action"] = "Action";
    LogType["Challenge"] = "Challenge";
    LogType["Block"] = "Block";
    LogType["Reveal"] = "Reveal";
    LogType["Elimination"] = "Elimination";
    LogType["CoinChange"] = "CoinChange";
    LogType["System"] = "System";
    LogType["GameOver"] = "GameOver";
})(LogType || (exports.LogType = LogType = {}));
exports.ACTION_DEFINITIONS = {
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
exports.CHARACTER_DEFINITIONS = {
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
var ClientEvent;
(function (ClientEvent) {
    // Lobby
    ClientEvent["JoinLobby"] = "join_lobby";
    ClientEvent["CreateRoom"] = "create_room";
    ClientEvent["JoinRoom"] = "join_room";
    ClientEvent["JoinRoomByCode"] = "join_room_by_code";
    ClientEvent["LeaveRoom"] = "leave_room";
    ClientEvent["UpdateSettings"] = "update_settings";
    ClientEvent["AddBot"] = "add_bot";
    ClientEvent["RemoveBot"] = "remove_bot";
    ClientEvent["StartGame"] = "start_game";
    ClientEvent["JoinAsSpectator"] = "join_as_spectator";
    // Game Actions
    ClientEvent["PerformAction"] = "perform_action";
    ClientEvent["Challenge"] = "challenge";
    ClientEvent["PassChallenge"] = "pass_challenge";
    ClientEvent["Block"] = "block";
    ClientEvent["PassBlock"] = "pass_block";
    ClientEvent["ChallengeBlock"] = "challenge_block";
    ClientEvent["PassBlockChallenge"] = "pass_block_challenge";
    ClientEvent["ChooseLoseInfluence"] = "choose_lose_influence";
    ClientEvent["ChooseExchangeCards"] = "choose_exchange_cards";
    // Chat
    ClientEvent["SendMessage"] = "send_message";
    ClientEvent["SendReaction"] = "send_reaction";
    // System
    ClientEvent["Reconnect"] = "reconnect";
    ClientEvent["Disconnect"] = "disconnect";
})(ClientEvent || (exports.ClientEvent = ClientEvent = {}));
var ServerEvent;
(function (ServerEvent) {
    // Lobby
    ServerEvent["LobbyUpdate"] = "lobby_update";
    ServerEvent["RoomCreated"] = "room_created";
    ServerEvent["RoomUpdated"] = "room_updated";
    ServerEvent["RoomJoined"] = "room_joined";
    ServerEvent["RoomLeft"] = "room_left";
    ServerEvent["RoomError"] = "room_error";
    ServerEvent["RoomList"] = "room_list";
    // Game
    ServerEvent["GameStarted"] = "game_started";
    ServerEvent["GameStateUpdate"] = "game_state_update";
    ServerEvent["ActionAnnounced"] = "action_announced";
    ServerEvent["ChallengeResult"] = "challenge_result";
    ServerEvent["BlockAnnounced"] = "block_announced";
    ServerEvent["InfluenceLost"] = "influence_lost";
    ServerEvent["PlayerEliminated"] = "player_eliminated";
    ServerEvent["GameOver"] = "game_over";
    ServerEvent["TurnTimeout"] = "turn_timeout";
    ServerEvent["ExchangeCards"] = "exchange_cards";
    // Chat
    ServerEvent["ChatMessage"] = "chat_message";
    ServerEvent["Reaction"] = "reaction";
    // System
    ServerEvent["PlayerReconnected"] = "player_reconnected";
    ServerEvent["PlayerDisconnected"] = "player_disconnected";
    ServerEvent["Error"] = "error";
})(ServerEvent || (exports.ServerEvent = ServerEvent = {}));
//# sourceMappingURL=types.js.map
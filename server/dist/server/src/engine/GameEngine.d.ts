import { Action, Character, GamePhase, GameState, GameStateView } from '../../../shared/types';
export declare class GameEngine {
    private state;
    private deck;
    private turnTimer;
    private turnTimerDuration;
    onStateChange?: () => void;
    onBotTurn?: (playerId: string) => void;
    constructor(roomId: string, players: Array<{
        id: string;
        name: string;
        avatarUrl: string;
        isBot: boolean;
        botDifficulty?: string;
    }>, turnTimerSeconds?: number);
    private addLog;
    private syncDeck;
    private getAlivePlayerIds;
    private getAlivePlayers;
    private getPlayerById;
    private checkWinCondition;
    private advanceTurn;
    private startTurnTimer;
    private clearTurnTimer;
    private emitStateChange;
    /**
     * Eliminate a player (both cards revealed). Remove from active play.
     */
    private eliminatePlayer;
    /**
     * Make a player lose an influence (reveal a specific card).
     * Returns true if the player is now eliminated.
     */
    private revealCard;
    /**
     * Get the players who still need to respond in a challenge/block phase.
     * "Eligible responders" are alive players excluding the acting player (and target, depending on context).
     */
    private getEligibleChallengers;
    /**
     * Get players eligible to block: for targeted actions, only the target; for ForeignAid, any other alive player.
     */
    private getEligibleBlockers;
    /**
     * A player performs an action on their turn.
     */
    performAction(playerId: string, action: Action, targetId?: string): {
        success: boolean;
        error?: string;
    };
    /**
     * A player challenges the pending action's character claim.
     */
    handleChallenge(challengerId: string): {
        success: boolean;
        error?: string;
    };
    /**
     * A player passes on challenging the pending action.
     */
    handlePassChallenge(playerId: string): {
        success: boolean;
        error?: string;
    };
    /**
     * A player blocks the pending action.
     */
    handleBlock(blockerId: string, claimedCharacter: Character): {
        success: boolean;
        error?: string;
    };
    /**
     * A player passes on blocking the pending action.
     */
    handlePassBlock(playerId: string): {
        success: boolean;
        error?: string;
    };
    /**
     * A player challenges the pending block's character claim.
     */
    handleChallengeBlock(challengerId: string): {
        success: boolean;
        error?: string;
    };
    /**
     * A player passes on challenging the pending block.
     */
    handlePassBlockChallenge(playerId: string): {
        success: boolean;
        error?: string;
    };
    /**
     * A player chooses which card to lose when they must lose influence.
     */
    handleLoseInfluence(playerId: string, cardId: string): {
        success: boolean;
        error?: string;
    };
    /**
     * A player chooses which cards to keep during an Exchange.
     */
    handleExchangeChoice(playerId: string, keepCardIds: string[]): {
        success: boolean;
        error?: string;
    };
    /**
     * Resolve the current pending action (after challenge/block windows have passed).
     */
    private resolveAction;
    /**
     * If a player only has one unrevealed card, automatically reveal it.
     */
    private autoRevealIfOneCard;
    /**
     * Build a GameStateView for a specific player (shows own cards, hides opponents').
     */
    getStateForPlayer(playerId: string): GameStateView;
    /**
     * Build a GameStateView for a spectator (all cards hidden unless revealed).
     */
    getStateForSpectator(): GameStateView;
    private toPlayerView;
    private toCardView;
    private toPendingLoseInfluenceView;
    private toPendingExchangeView;
    getGameState(): GameState;
    getPhase(): GamePhase;
    getCurrentPlayerId(): string;
    isGameOver(): boolean;
    setPlayerConnected(playerId: string, connected: boolean): void;
    getAvailableActions(playerId: string): Action[];
    destroy(): void;
}
//# sourceMappingURL=GameEngine.d.ts.map
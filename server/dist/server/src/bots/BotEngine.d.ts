import { Action, BotDifficulty, Card, Character, GameState, PendingAction, PendingBlock, Player } from '@shared/types';
/**
 * AI Bot engine that decides actions based on difficulty level.
 *
 * Easy:   Random valid moves, never bluffs, never challenges.
 * Medium: Prefers honest actions, 30% bluff rate, challenges obvious lies.
 * Hard:   Tracks revealed cards, probability-based decisions, 50% bluff when advantageous.
 * Expert: Full probability tracking, Bayesian-ish reasoning, targets leaders, optimal play.
 */
export declare class BotEngine {
    /**
     * Get human-like delay in ms depending on difficulty.
     */
    getDelay(difficulty: BotDifficulty): number;
    /**
     * Decide which action the bot should perform on its turn.
     */
    decideBotAction(gameState: GameState, botPlayer: Player, difficulty: BotDifficulty): {
        action: Action;
        targetId?: string;
    };
    /**
     * Decide whether the bot should challenge a pending action.
     */
    decideBotChallenge(gameState: GameState, botPlayer: Player, pendingAction: PendingAction, difficulty: BotDifficulty): boolean;
    /**
     * Decide whether the bot should block a pending action, and with which character.
     */
    decideBotBlock(gameState: GameState, botPlayer: Player, pendingAction: PendingAction, difficulty: BotDifficulty): Character | null;
    /**
     * Decide whether the bot should challenge a pending block.
     */
    decideBotBlockChallenge(gameState: GameState, botPlayer: Player, pendingBlock: PendingBlock, difficulty: BotDifficulty): boolean;
    /**
     * Decide which card to reveal when losing influence.
     * Always reveal the least valuable card.
     */
    decideBotLoseInfluence(botPlayer: Player): string;
    /**
     * Decide which cards to keep during an Exchange.
     */
    decideBotExchange(availableCards: Card[], keepCount: number, difficulty: BotDifficulty): string[];
    private getAvailableActionsForBot;
    private getAliveTargets;
    private pickTarget;
    private easyAction;
    private mediumAction;
    private hardAction;
    private expertAction;
    /**
     * Estimate the probability that a player is bluffing about having a character.
     * Based on revealed cards and bot's own cards.
     */
    private estimateBluffProbability;
}
//# sourceMappingURL=BotEngine.d.ts.map
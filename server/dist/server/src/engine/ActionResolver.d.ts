import { Action, GameState } from '../../../shared/types';
export interface ValidationResult {
    valid: boolean;
    error?: string;
}
/**
 * Validate whether a player can perform a given action in the current game state.
 */
export declare function validateAction(gameState: GameState, playerId: string, action: Action, targetId?: string): ValidationResult;
/**
 * Get the list of actions available to a player given the current game state.
 */
export declare function getAvailableActions(gameState: GameState, playerId: string): Action[];
//# sourceMappingURL=ActionResolver.d.ts.map
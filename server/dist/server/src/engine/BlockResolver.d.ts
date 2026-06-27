import { Action, Character, Player } from '../../../shared/types';
/**
 * Returns the list of characters that can block the given action, or empty array if unblockable.
 */
export declare function getBlockingCharacters(action: Action): Character[];
/**
 * Returns whether the given action can be blocked at all.
 */
export declare function canBeBlocked(action: Action): boolean;
export interface BlockValidation {
    valid: boolean;
    error?: string;
}
/**
 * Validate whether a player can block the pending action with the claimed character.
 *
 * Rules:
 * - Duke blocks Foreign Aid (any player can block Foreign Aid)
 * - Contessa blocks Assassinate (only the target can block)
 * - Captain blocks Steal (only the target can block)
 * - Ambassador blocks Steal (only the target can block)
 */
export declare function validateBlock(players: Player[], blockerId: string, action: Action, targetId: string | undefined, claimedCharacter: Character): BlockValidation;
//# sourceMappingURL=BlockResolver.d.ts.map
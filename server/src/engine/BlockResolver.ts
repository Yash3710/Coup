import {
  Action,
  ACTION_DEFINITIONS,
  Character,
  GameState,
  Player,
} from '@shared/types';

/**
 * Returns the list of characters that can block the given action, or empty array if unblockable.
 */
export function getBlockingCharacters(action: Action): Character[] {
  return ACTION_DEFINITIONS[action].blockedBy;
}

/**
 * Returns whether the given action can be blocked at all.
 */
export function canBeBlocked(action: Action): boolean {
  return ACTION_DEFINITIONS[action].canBeBlocked;
}

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
export function validateBlock(
  players: Player[],
  blockerId: string,
  action: Action,
  targetId: string | undefined,
  claimedCharacter: Character
): BlockValidation {
  const blocker = players.find((p) => p.id === blockerId);
  if (!blocker) {
    return { valid: false, error: 'Blocker not found.' };
  }

  if (!blocker.alive) {
    return { valid: false, error: 'Dead players cannot block.' };
  }

  const actionDef = ACTION_DEFINITIONS[action];

  if (!actionDef.canBeBlocked) {
    return { valid: false, error: `${action} cannot be blocked.` };
  }

  // Check the claimed character is actually one that can block this action
  if (!actionDef.blockedBy.includes(claimedCharacter)) {
    return { valid: false, error: `${claimedCharacter} cannot block ${action}.` };
  }

  // For targeted actions (Assassinate, Steal), only the target can block.
  // For non-targeted blockable actions (Foreign Aid), anyone alive can block.
  if (actionDef.requiresTarget && targetId) {
    if (blockerId !== targetId) {
      return { valid: false, error: 'Only the target of this action can block it.' };
    }
  }

  return { valid: true };
}

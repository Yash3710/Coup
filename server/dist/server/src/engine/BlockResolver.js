"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlockingCharacters = getBlockingCharacters;
exports.canBeBlocked = canBeBlocked;
exports.validateBlock = validateBlock;
const types_1 = require("../../../shared/types");
/**
 * Returns the list of characters that can block the given action, or empty array if unblockable.
 */
function getBlockingCharacters(action) {
    return types_1.ACTION_DEFINITIONS[action].blockedBy;
}
/**
 * Returns whether the given action can be blocked at all.
 */
function canBeBlocked(action) {
    return types_1.ACTION_DEFINITIONS[action].canBeBlocked;
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
function validateBlock(players, blockerId, action, targetId, claimedCharacter) {
    const blocker = players.find((p) => p.id === blockerId);
    if (!blocker) {
        return { valid: false, error: 'Blocker not found.' };
    }
    if (!blocker.alive) {
        return { valid: false, error: 'Dead players cannot block.' };
    }
    const actionDef = types_1.ACTION_DEFINITIONS[action];
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
//# sourceMappingURL=BlockResolver.js.map
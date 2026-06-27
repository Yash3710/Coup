"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAction = validateAction;
exports.getAvailableActions = getAvailableActions;
const types_1 = require("../../../shared/types");
/**
 * Validate whether a player can perform a given action in the current game state.
 */
function validateAction(gameState, playerId, action, targetId) {
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player) {
        return { valid: false, error: 'Player not found.' };
    }
    if (!player.alive) {
        return { valid: false, error: 'Dead players cannot take actions.' };
    }
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
        return { valid: false, error: 'It is not your turn.' };
    }
    const actionDef = types_1.ACTION_DEFINITIONS[action];
    // Forced coup at 10+ coins
    if (player.coins >= 10 && action !== types_1.Action.Coup) {
        return { valid: false, error: 'You must Coup when you have 10 or more coins.' };
    }
    // Check cost
    if (player.coins < actionDef.cost) {
        return { valid: false, error: `Not enough coins. ${action} costs ${actionDef.cost}, you have ${player.coins}.` };
    }
    // Check target
    if (actionDef.requiresTarget) {
        if (!targetId) {
            return { valid: false, error: `${action} requires a target.` };
        }
        const target = gameState.players.find((p) => p.id === targetId);
        if (!target) {
            return { valid: false, error: 'Target player not found.' };
        }
        if (!target.alive) {
            return { valid: false, error: 'Cannot target an eliminated player.' };
        }
        if (targetId === playerId) {
            return { valid: false, error: 'Cannot target yourself.' };
        }
        // Steal from a player with 0 coins is allowed in standard rules (they just get 0)
    }
    if (!actionDef.requiresTarget && targetId) {
        return { valid: false, error: `${action} does not take a target.` };
    }
    return { valid: true };
}
/**
 * Get the list of actions available to a player given the current game state.
 */
function getAvailableActions(gameState, playerId) {
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player || !player.alive)
        return [];
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId)
        return [];
    const available = [];
    // Forced coup
    if (player.coins >= 10) {
        available.push(types_1.Action.Coup);
        return available;
    }
    for (const action of Object.values(types_1.Action)) {
        const def = types_1.ACTION_DEFINITIONS[action];
        // Skip if not enough coins
        if (player.coins < def.cost)
            continue;
        // If requires target, check there's at least one valid target
        if (def.requiresTarget) {
            const hasTarget = gameState.players.some((p) => p.id !== playerId && p.alive);
            if (!hasTarget)
                continue;
        }
        available.push(action);
    }
    return available;
}
//# sourceMappingURL=ActionResolver.js.map
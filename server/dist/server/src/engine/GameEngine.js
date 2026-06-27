"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
const uuid_1 = require("uuid");
const types_1 = require("../../../shared/types");
const Deck_1 = require("./Deck");
const ActionResolver_1 = require("./ActionResolver");
const ChallengeResolver_1 = require("./ChallengeResolver");
const BlockResolver_1 = require("./BlockResolver");
class GameEngine {
    state;
    deck;
    turnTimer = null;
    turnTimerDuration; // seconds
    onStateChange;
    onBotTurn;
    constructor(roomId, players, turnTimerSeconds = 120) {
        this.deck = new Deck_1.Deck();
        this.turnTimerDuration = turnTimerSeconds;
        // Create player objects
        const gamePlayers = players.map((p) => ({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatarUrl,
            coins: 2,
            cards: [],
            alive: true,
            connected: !p.isBot,
            isBot: p.isBot,
            botDifficulty: p.botDifficulty,
        }));
        // Deal 2 cards to each player
        for (const player of gamePlayers) {
            player.cards = this.deck.draw(2);
        }
        this.state = {
            roomId,
            players: gamePlayers,
            deck: this.deck.getCards(),
            currentPlayerIndex: 0,
            phase: types_1.GamePhase.ActionPhase,
            turnNumber: 1,
            pendingAction: null,
            pendingBlock: null,
            pendingChallenge: null,
            pendingLoseInfluence: null,
            pendingExchange: null,
            gameLog: [],
            winner: null,
            turnTimerEnd: null,
            startedAt: Date.now(),
        };
        this.addLog('Game started!', types_1.LogType.System);
        for (const player of gamePlayers) {
            this.addLog(`${player.name} joins with 2 coins.`, types_1.LogType.System, player.id);
        }
        this.startTurnTimer();
    }
    // ─── Helpers ───────────────────────────────────────────────────
    addLog(message, type, playerId, targetId) {
        this.state.gameLog.push({
            id: (0, uuid_1.v4)(),
            timestamp: Date.now(),
            message,
            type,
            playerId,
            targetId,
        });
    }
    syncDeck() {
        this.state.deck = this.deck.getCards();
    }
    getAlivePlayerIds() {
        return this.state.players.filter((p) => p.alive).map((p) => p.id);
    }
    getAlivePlayers() {
        return this.state.players.filter((p) => p.alive);
    }
    getPlayerById(id) {
        return this.state.players.find((p) => p.id === id);
    }
    checkWinCondition() {
        const alivePlayers = this.getAlivePlayers();
        if (alivePlayers.length === 1) {
            this.state.winner = alivePlayers[0].id;
            this.state.phase = types_1.GamePhase.GameOver;
            this.addLog(`${alivePlayers[0].name} wins the game!`, types_1.LogType.GameOver, alivePlayers[0].id);
            this.clearTurnTimer();
            return true;
        }
        return false;
    }
    advanceTurn() {
        if (this.checkWinCondition())
            return;
        // Move to next alive player
        let next = (this.state.currentPlayerIndex + 1) % this.state.players.length;
        while (!this.state.players[next].alive) {
            next = (next + 1) % this.state.players.length;
        }
        this.state.currentPlayerIndex = next;
        this.state.turnNumber++;
        this.state.phase = types_1.GamePhase.ActionPhase;
        this.state.pendingAction = null;
        this.state.pendingBlock = null;
        this.state.pendingChallenge = null;
        this.state.pendingLoseInfluence = null;
        this.state.pendingExchange = null;
        this.syncDeck();
        this.startTurnTimer();
        this.emitStateChange();
        // Check if it's a bot's turn
        const currentPlayer = this.state.players[this.state.currentPlayerIndex];
        if (currentPlayer.isBot && currentPlayer.alive) {
            this.onBotTurn?.(currentPlayer.id);
        }
    }
    startTurnTimer() {
        this.clearTurnTimer();
        if (this.turnTimerDuration <= 0)
            return;
        this.state.turnTimerEnd = Date.now() + this.turnTimerDuration * 1000;
        this.turnTimer = setTimeout(() => {
            // Auto-income on timeout
            const current = this.state.players[this.state.currentPlayerIndex];
            if (current.alive && this.state.phase === types_1.GamePhase.ActionPhase) {
                this.addLog(`${current.name} timed out — auto Income.`, types_1.LogType.System, current.id);
                current.coins += 1;
                this.addLog(`${current.name} takes Income (+1 coin, total ${current.coins}).`, types_1.LogType.Action, current.id);
                this.advanceTurn();
            }
        }, this.turnTimerDuration * 1000);
    }
    clearTurnTimer() {
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
            this.turnTimer = null;
        }
        this.state.turnTimerEnd = null;
    }
    emitStateChange() {
        this.onStateChange?.();
    }
    /**
     * Eliminate a player (both cards revealed). Remove from active play.
     */
    eliminatePlayer(player) {
        player.alive = false;
        this.addLog(`${player.name} has been eliminated!`, types_1.LogType.Elimination, player.id);
    }
    /**
     * Make a player lose an influence (reveal a specific card).
     * Returns true if the player is now eliminated.
     */
    revealCard(player, cardId) {
        const card = player.cards.find((c) => c.id === cardId && !c.revealed);
        if (!card) {
            throw new Error(`Card ${cardId} not found or already revealed for player ${player.name}`);
        }
        card.revealed = true;
        this.addLog(`${player.name} reveals ${card.character}.`, types_1.LogType.Reveal, player.id);
        // Check if all cards are revealed
        const aliveCards = player.cards.filter((c) => !c.revealed);
        if (aliveCards.length === 0) {
            this.eliminatePlayer(player);
            return true;
        }
        return false;
    }
    /**
     * Get the players who still need to respond in a challenge/block phase.
     * "Eligible responders" are alive players excluding the acting player (and target, depending on context).
     */
    getEligibleChallengers(excludeId) {
        return this.state.players
            .filter((p) => p.alive && p.id !== excludeId)
            .map((p) => p.id);
    }
    /**
     * Get players eligible to block: for targeted actions, only the target; for ForeignAid, any other alive player.
     */
    getEligibleBlockers(action, actingPlayerId, targetId) {
        if (!(0, BlockResolver_1.canBeBlocked)(action))
            return [];
        const actionDef = types_1.ACTION_DEFINITIONS[action];
        if (actionDef.requiresTarget && targetId) {
            // Only the target can block targeted blockable actions (Assassinate, Steal)
            const target = this.getPlayerById(targetId);
            if (target && target.alive)
                return [targetId];
            return [];
        }
        // For Foreign Aid, any alive player except the actor can block
        return this.state.players
            .filter((p) => p.alive && p.id !== actingPlayerId)
            .map((p) => p.id);
    }
    // ─── Public API: Game Actions ──────────────────────────────────
    /**
     * A player performs an action on their turn.
     */
    performAction(playerId, action, targetId) {
        if (this.state.phase !== types_1.GamePhase.ActionPhase) {
            return { success: false, error: 'Not in action phase.' };
        }
        const validation = (0, ActionResolver_1.validateAction)(this.state, playerId, action, targetId);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        const player = this.getPlayerById(playerId);
        const actionDef = types_1.ACTION_DEFINITIONS[action];
        // Deduct costs immediately (Coup and Assassinate costs are paid upfront)
        if (actionDef.cost > 0) {
            player.coins -= actionDef.cost;
            this.addLog(`${player.name} pays ${actionDef.cost} coins.`, types_1.LogType.CoinChange, playerId);
        }
        const targetName = targetId ? this.getPlayerById(targetId)?.name : undefined;
        // Log the action
        if (targetName) {
            this.addLog(`${player.name} uses ${action} on ${targetName}.`, types_1.LogType.Action, playerId, targetId);
        }
        else {
            this.addLog(`${player.name} uses ${action}.`, types_1.LogType.Action, playerId);
        }
        // Determine the claimed character for challengeable actions
        const claimedCharacter = actionDef.requiredCharacter;
        // Set pending action
        this.state.pendingAction = {
            playerId,
            action,
            targetId,
            claimedCharacter,
            respondedPlayers: [],
        };
        this.clearTurnTimer();
        // Route based on whether action can be challenged
        if (actionDef.canBeChallenged) {
            // Go to challenge phase first
            this.state.phase = types_1.GamePhase.ChallengePhase;
            this.syncDeck();
            this.emitStateChange();
        }
        else if (actionDef.canBeBlocked) {
            // e.g. Foreign Aid — cannot be challenged but can be blocked
            this.state.phase = types_1.GamePhase.BlockPhase;
            this.syncDeck();
            this.emitStateChange();
        }
        else {
            // Income and Coup — resolve immediately
            this.resolveAction();
        }
        return { success: true };
    }
    /**
     * A player challenges the pending action's character claim.
     */
    handleChallenge(challengerId) {
        if (this.state.phase !== types_1.GamePhase.ChallengePhase) {
            return { success: false, error: 'Not in challenge phase.' };
        }
        const pendingAction = this.state.pendingAction;
        if (!pendingAction) {
            return { success: false, error: 'No pending action to challenge.' };
        }
        const challenger = this.getPlayerById(challengerId);
        if (!challenger || !challenger.alive) {
            return { success: false, error: 'You cannot challenge.' };
        }
        if (challengerId === pendingAction.playerId) {
            return { success: false, error: 'Cannot challenge your own action.' };
        }
        if (!pendingAction.claimedCharacter) {
            return { success: false, error: 'This action cannot be challenged.' };
        }
        this.addLog(`${challenger.name} challenges ${this.getPlayerById(pendingAction.playerId).name}'s claim of ${pendingAction.claimedCharacter}.`, types_1.LogType.Challenge, challengerId, pendingAction.playerId);
        // Resolve the challenge
        const result = (0, ChallengeResolver_1.resolveChallenge)(this.state.players, this.deck, challengerId, pendingAction.playerId, pendingAction.claimedCharacter);
        this.addLog(result.message, types_1.LogType.Challenge);
        this.syncDeck();
        if (result.challengeSucceeded) {
            // The acting player was bluffing — they must lose influence, action is cancelled
            this.state.pendingChallenge = null;
            this.state.pendingLoseInfluence = {
                playerId: pendingAction.playerId,
                reason: `Lost challenge — did not have ${pendingAction.claimedCharacter}`,
                continueAction: false, // Action cancelled
            };
            this.state.phase = types_1.GamePhase.ResolveLoseInfluence;
            // Check if the bluffer has only 1 unrevealed card, auto-reveal
            this.autoRevealIfOneCard(pendingAction.playerId);
        }
        else {
            // Challenge failed — challenger must lose influence, then action continues
            this.state.pendingChallenge = null;
            this.state.pendingLoseInfluence = {
                playerId: challengerId,
                reason: `Lost challenge — ${this.getPlayerById(pendingAction.playerId).name} had ${pendingAction.claimedCharacter}`,
                continueAction: true,
                originalAction: { ...pendingAction },
            };
            this.state.phase = types_1.GamePhase.ResolveLoseInfluence;
            this.autoRevealIfOneCard(challengerId);
        }
        this.emitStateChange();
        return { success: true };
    }
    /**
     * A player passes on challenging the pending action.
     */
    handlePassChallenge(playerId) {
        if (this.state.phase !== types_1.GamePhase.ChallengePhase) {
            return { success: false, error: 'Not in challenge phase.' };
        }
        const pendingAction = this.state.pendingAction;
        if (!pendingAction) {
            return { success: false, error: 'No pending action.' };
        }
        const player = this.getPlayerById(playerId);
        if (!player || !player.alive) {
            return { success: false, error: 'You cannot pass.' };
        }
        if (playerId === pendingAction.playerId) {
            return { success: false, error: 'You cannot pass on your own action.' };
        }
        if (pendingAction.respondedPlayers.includes(playerId)) {
            return { success: false, error: 'You have already responded.' };
        }
        pendingAction.respondedPlayers.push(playerId);
        // Check if all eligible players have passed
        const eligible = this.getEligibleChallengers(pendingAction.playerId);
        const allPassed = eligible.every((id) => pendingAction.respondedPlayers.includes(id));
        if (allPassed) {
            // Challenge phase complete — move to block phase or resolve
            const actionDef = types_1.ACTION_DEFINITIONS[pendingAction.action];
            if (actionDef.canBeBlocked) {
                this.state.phase = types_1.GamePhase.BlockPhase;
                // Reset responded players for block phase
                // (respondedPlayers on pendingAction is for challenge; block has its own tracking below)
            }
            else {
                // Resolve the action
                this.resolveAction();
                return { success: true };
            }
        }
        this.emitStateChange();
        return { success: true };
    }
    /**
     * A player blocks the pending action.
     */
    handleBlock(blockerId, claimedCharacter) {
        if (this.state.phase !== types_1.GamePhase.BlockPhase) {
            return { success: false, error: 'Not in block phase.' };
        }
        const pendingAction = this.state.pendingAction;
        if (!pendingAction) {
            return { success: false, error: 'No pending action to block.' };
        }
        const blockValidation = (0, BlockResolver_1.validateBlock)(this.state.players, blockerId, pendingAction.action, pendingAction.targetId, claimedCharacter);
        if (!blockValidation.valid) {
            return { success: false, error: blockValidation.error };
        }
        const blocker = this.getPlayerById(blockerId);
        this.addLog(`${blocker.name} blocks with ${claimedCharacter}.`, types_1.LogType.Block, blockerId, pendingAction.playerId);
        this.state.pendingBlock = {
            blockerId,
            claimedCharacter,
            originalAction: pendingAction.action,
            originalPlayerId: pendingAction.playerId,
            targetId: pendingAction.targetId,
            respondedPlayers: [],
        };
        this.state.phase = types_1.GamePhase.BlockChallengePhase;
        this.emitStateChange();
        return { success: true };
    }
    /**
     * A player passes on blocking the pending action.
     */
    handlePassBlock(playerId) {
        if (this.state.phase !== types_1.GamePhase.BlockPhase) {
            return { success: false, error: 'Not in block phase.' };
        }
        const pendingAction = this.state.pendingAction;
        if (!pendingAction) {
            return { success: false, error: 'No pending action.' };
        }
        const player = this.getPlayerById(playerId);
        if (!player || !player.alive) {
            return { success: false, error: 'You cannot pass.' };
        }
        // The acting player should not need to pass on their own block window
        // But we track it so they don't hold things up
        const eligible = this.getEligibleBlockers(pendingAction.action, pendingAction.playerId, pendingAction.targetId);
        if (!eligible.includes(playerId)) {
            // Player isn't eligible to block, but still allow pass (for UI flow — or just ignore)
            return { success: false, error: 'You are not eligible to block this action.' };
        }
        if (!pendingAction.respondedPlayers.includes(playerId)) {
            // Re-use respondedPlayers for block tracking
            // But we need separate tracking — use a separate field
            // Actually, let's track block passes differently
        }
        // We'll use the pendingAction.respondedPlayers array which was reset implicitly
        // Actually we haven't reset it. Let's use a different approach:
        // Track block passes in a local set approach. Since we can't add fields to the type,
        // reuse respondedPlayers — but it already has challenge passes.
        // Solution: when we transition to BlockPhase, we clear respondedPlayers.
        // Let's do that fix in the pass_challenge all-passed block above.
        // For now, let's use a different tracking mechanism.
        // We need to track who has passed on blocking. The simplest approach:
        // Clear respondedPlayers when entering block phase.
        // We did NOT clear it above, so let's handle it here carefully.
        // Actually, let me just track it: if all eligible blockers have passed, resolve.
        // We need a clean list. Let's make the respondedPlayers tracking work:
        if (pendingAction.respondedPlayers.includes(`block_pass_${playerId}`)) {
            return { success: false, error: 'You have already passed on blocking.' };
        }
        pendingAction.respondedPlayers.push(`block_pass_${playerId}`);
        const allBlockersPassed = eligible.every((id) => pendingAction.respondedPlayers.includes(`block_pass_${id}`));
        if (allBlockersPassed) {
            // No one blocked — resolve the action
            this.resolveAction();
            return { success: true };
        }
        this.emitStateChange();
        return { success: true };
    }
    /**
     * A player challenges the pending block's character claim.
     */
    handleChallengeBlock(challengerId) {
        if (this.state.phase !== types_1.GamePhase.BlockChallengePhase) {
            return { success: false, error: 'Not in block challenge phase.' };
        }
        const pendingBlock = this.state.pendingBlock;
        if (!pendingBlock) {
            return { success: false, error: 'No pending block to challenge.' };
        }
        const challenger = this.getPlayerById(challengerId);
        if (!challenger || !challenger.alive) {
            return { success: false, error: 'You cannot challenge.' };
        }
        if (challengerId === pendingBlock.blockerId) {
            return { success: false, error: 'Cannot challenge your own block.' };
        }
        this.addLog(`${challenger.name} challenges ${this.getPlayerById(pendingBlock.blockerId).name}'s block with ${pendingBlock.claimedCharacter}.`, types_1.LogType.Challenge, challengerId, pendingBlock.blockerId);
        const result = (0, ChallengeResolver_1.resolveChallenge)(this.state.players, this.deck, challengerId, pendingBlock.blockerId, pendingBlock.claimedCharacter);
        this.addLog(result.message, types_1.LogType.Challenge);
        this.syncDeck();
        if (result.challengeSucceeded) {
            // Blocker was bluffing — blocker loses influence, original action proceeds
            this.state.pendingChallenge = null;
            this.state.pendingLoseInfluence = {
                playerId: pendingBlock.blockerId,
                reason: `Lost block challenge — did not have ${pendingBlock.claimedCharacter}`,
                continueAction: true,
                originalAction: {
                    playerId: pendingBlock.originalPlayerId,
                    action: pendingBlock.originalAction,
                    targetId: pendingBlock.targetId,
                    claimedCharacter: types_1.ACTION_DEFINITIONS[pendingBlock.originalAction].requiredCharacter,
                    respondedPlayers: [],
                },
            };
            this.state.phase = types_1.GamePhase.ResolveLoseInfluence;
            this.autoRevealIfOneCard(pendingBlock.blockerId);
        }
        else {
            // Block challenge failed — challenger loses influence, block stands (action cancelled)
            this.state.pendingChallenge = null;
            this.state.pendingLoseInfluence = {
                playerId: challengerId,
                reason: `Lost block challenge — ${this.getPlayerById(pendingBlock.blockerId).name} had ${pendingBlock.claimedCharacter}`,
                continueAction: false, // Block succeeded, action is cancelled
            };
            this.state.phase = types_1.GamePhase.ResolveLoseInfluence;
            this.autoRevealIfOneCard(challengerId);
        }
        this.emitStateChange();
        return { success: true };
    }
    /**
     * A player passes on challenging the pending block.
     */
    handlePassBlockChallenge(playerId) {
        if (this.state.phase !== types_1.GamePhase.BlockChallengePhase) {
            return { success: false, error: 'Not in block challenge phase.' };
        }
        const pendingBlock = this.state.pendingBlock;
        if (!pendingBlock) {
            return { success: false, error: 'No pending block.' };
        }
        const player = this.getPlayerById(playerId);
        if (!player || !player.alive) {
            return { success: false, error: 'You cannot pass.' };
        }
        if (playerId === pendingBlock.blockerId) {
            return { success: false, error: 'You cannot pass on your own block.' };
        }
        if (pendingBlock.respondedPlayers.includes(playerId)) {
            return { success: false, error: 'You have already responded.' };
        }
        pendingBlock.respondedPlayers.push(playerId);
        // Check if all eligible players have passed on challenging the block
        const eligible = this.getEligibleChallengers(pendingBlock.blockerId);
        const allPassed = eligible.every((id) => pendingBlock.respondedPlayers.includes(id));
        if (allPassed) {
            // Block succeeds — action is cancelled, advance turn
            this.addLog(`Block by ${this.getPlayerById(pendingBlock.blockerId).name} succeeds. Action cancelled.`, types_1.LogType.Block, pendingBlock.blockerId);
            this.state.pendingBlock = null;
            this.state.pendingAction = null;
            this.advanceTurn();
            return { success: true };
        }
        this.emitStateChange();
        return { success: true };
    }
    /**
     * A player chooses which card to lose when they must lose influence.
     */
    handleLoseInfluence(playerId, cardId) {
        if (this.state.phase !== types_1.GamePhase.ResolveLoseInfluence) {
            return { success: false, error: 'Not in lose influence phase.' };
        }
        const pending = this.state.pendingLoseInfluence;
        if (!pending) {
            return { success: false, error: 'No pending influence loss.' };
        }
        if (pending.playerId !== playerId) {
            return { success: false, error: 'It is not your turn to lose influence.' };
        }
        const player = this.getPlayerById(playerId);
        const card = player.cards.find((c) => c.id === cardId && !c.revealed);
        if (!card) {
            return { success: false, error: 'Invalid card selection.' };
        }
        const eliminated = this.revealCard(player, cardId);
        this.syncDeck();
        if (pending.continueAction && pending.originalAction) {
            // Continue with the original action (after failed challenge of action, or failed block challenge where action proceeds)
            const originalAction = pending.originalAction;
            this.state.pendingLoseInfluence = null;
            this.state.pendingAction = originalAction;
            // Check if we need to go to block phase for this action
            const actionDef = types_1.ACTION_DEFINITIONS[originalAction.action];
            // If the original action can be blocked and we haven't been through block phase yet,
            // go to block phase. But if we just came from a block challenge, resolve the action.
            if (this.state.pendingBlock) {
                // We came from a block challenge — the block failed, resolve the action
                this.state.pendingBlock = null;
                this.resolveAction();
            }
            else if (actionDef.canBeBlocked) {
                // Check if the target is still alive for blocking
                const target = originalAction.targetId ? this.getPlayerById(originalAction.targetId) : null;
                if (target && !target.alive) {
                    // Target eliminated during challenge resolution, advance turn
                    this.state.pendingAction = null;
                    this.advanceTurn();
                }
                else {
                    this.state.phase = types_1.GamePhase.BlockPhase;
                    this.emitStateChange();
                }
            }
            else {
                this.resolveAction();
            }
        }
        else {
            // Action was cancelled (bluffer lost or block succeeded)
            this.state.pendingLoseInfluence = null;
            this.state.pendingAction = null;
            this.state.pendingBlock = null;
            if (this.checkWinCondition()) {
                this.emitStateChange();
                return { success: true };
            }
            this.advanceTurn();
        }
        return { success: true };
    }
    /**
     * A player chooses which cards to keep during an Exchange.
     */
    handleExchangeChoice(playerId, keepCardIds) {
        if (this.state.phase !== types_1.GamePhase.ExchangePhase) {
            return { success: false, error: 'Not in exchange phase.' };
        }
        const pending = this.state.pendingExchange;
        if (!pending) {
            return { success: false, error: 'No pending exchange.' };
        }
        if (pending.playerId !== playerId) {
            return { success: false, error: 'It is not your exchange.' };
        }
        const player = this.getPlayerById(playerId);
        const aliveCardCount = player.cards.filter((c) => !c.revealed).length;
        if (keepCardIds.length !== aliveCardCount) {
            return { success: false, error: `You must keep exactly ${aliveCardCount} cards.` };
        }
        // Build the combined pool (player's alive cards + drawn cards)
        const allAvailable = [...pending.playerCards.filter(c => !c.revealed), ...pending.drawnCards];
        const allIds = allAvailable.map((c) => c.id);
        // Validate all keep card IDs are from the pool
        for (const kid of keepCardIds) {
            if (!allIds.includes(kid)) {
                return { success: false, error: `Card ${kid} is not in the exchange pool.` };
            }
        }
        // Check for duplicates
        if (new Set(keepCardIds).size !== keepCardIds.length) {
            return { success: false, error: 'Duplicate card selections.' };
        }
        // Keep the selected cards, return the rest to deck
        const keptCards = keepCardIds.map((id) => allAvailable.find((c) => c.id === id));
        const returnedCards = allAvailable.filter((c) => !keepCardIds.includes(c.id));
        // Update player's cards: keep revealed cards + new kept cards
        const revealedCards = player.cards.filter((c) => c.revealed);
        player.cards = [...revealedCards, ...keptCards];
        // Return unkept cards to deck
        this.deck.returnCards(returnedCards);
        this.syncDeck();
        this.addLog(`${player.name} completes exchange.`, types_1.LogType.Action, playerId);
        this.state.pendingExchange = null;
        this.advanceTurn();
        return { success: true };
    }
    // ─── Action Resolution ─────────────────────────────────────────
    /**
     * Resolve the current pending action (after challenge/block windows have passed).
     */
    resolveAction() {
        const pending = this.state.pendingAction;
        if (!pending)
            return;
        const player = this.getPlayerById(pending.playerId);
        if (!player || !player.alive) {
            // Acting player died during challenge resolution
            this.state.pendingAction = null;
            this.advanceTurn();
            return;
        }
        const target = pending.targetId ? this.getPlayerById(pending.targetId) : undefined;
        switch (pending.action) {
            case types_1.Action.Income:
                player.coins += 1;
                this.addLog(`${player.name} takes Income (+1 coin, total ${player.coins}).`, types_1.LogType.CoinChange, player.id);
                this.state.pendingAction = null;
                this.advanceTurn();
                break;
            case types_1.Action.ForeignAid:
                player.coins += 2;
                this.addLog(`${player.name} takes Foreign Aid (+2 coins, total ${player.coins}).`, types_1.LogType.CoinChange, player.id);
                this.state.pendingAction = null;
                this.advanceTurn();
                break;
            case types_1.Action.Tax:
                player.coins += 3;
                this.addLog(`${player.name} collects Tax (+3 coins, total ${player.coins}).`, types_1.LogType.CoinChange, player.id);
                this.state.pendingAction = null;
                this.advanceTurn();
                break;
            case types_1.Action.Coup:
                if (target && target.alive) {
                    this.addLog(`${player.name} launches a Coup against ${target.name}!`, types_1.LogType.Action, player.id, target.id);
                    // Target must lose influence
                    this.state.pendingAction = null;
                    this.state.pendingLoseInfluence = {
                        playerId: target.id,
                        reason: `Coup by ${player.name}`,
                        continueAction: false,
                    };
                    this.state.phase = types_1.GamePhase.ResolveLoseInfluence;
                    this.autoRevealIfOneCard(target.id);
                    this.emitStateChange();
                }
                else {
                    this.state.pendingAction = null;
                    this.advanceTurn();
                }
                break;
            case types_1.Action.Assassinate:
                if (target && target.alive) {
                    this.addLog(`${player.name} assassinates ${target.name}!`, types_1.LogType.Action, player.id, target.id);
                    this.state.pendingAction = null;
                    this.state.pendingLoseInfluence = {
                        playerId: target.id,
                        reason: `Assassination by ${player.name}`,
                        continueAction: false,
                    };
                    this.state.phase = types_1.GamePhase.ResolveLoseInfluence;
                    this.autoRevealIfOneCard(target.id);
                    this.emitStateChange();
                }
                else {
                    this.state.pendingAction = null;
                    this.advanceTurn();
                }
                break;
            case types_1.Action.Steal:
                if (target && target.alive) {
                    const stolen = Math.min(2, target.coins);
                    target.coins -= stolen;
                    player.coins += stolen;
                    this.addLog(`${player.name} steals ${stolen} coins from ${target.name}. (${player.name}: ${player.coins}, ${target.name}: ${target.coins})`, types_1.LogType.CoinChange, player.id, target.id);
                    this.state.pendingAction = null;
                    this.advanceTurn();
                }
                else {
                    this.state.pendingAction = null;
                    this.advanceTurn();
                }
                break;
            case types_1.Action.Exchange: {
                // Draw 2 cards from deck
                const drawnCards = this.deck.draw(2);
                this.syncDeck();
                this.state.pendingExchange = {
                    playerId: player.id,
                    drawnCards,
                    playerCards: player.cards.map((c) => ({ ...c })),
                };
                this.state.pendingAction = null;
                this.state.phase = types_1.GamePhase.ExchangePhase;
                this.addLog(`${player.name} exchanges cards.`, types_1.LogType.Action, player.id);
                this.emitStateChange();
                // If it's a bot, trigger bot exchange
                if (player.isBot) {
                    this.onBotTurn?.(player.id);
                }
                break;
            }
        }
    }
    /**
     * If a player only has one unrevealed card, automatically reveal it.
     */
    autoRevealIfOneCard(playerId) {
        const player = this.getPlayerById(playerId);
        if (!player)
            return;
        const unrevealed = player.cards.filter((c) => !c.revealed);
        if (unrevealed.length === 1) {
            // Auto-reveal
            const card = unrevealed[0];
            this.revealCard(player, card.id);
            this.syncDeck();
            // Since we auto-revealed, check if the pending lose influence is for this player
            if (this.state.pendingLoseInfluence &&
                this.state.pendingLoseInfluence.playerId === playerId) {
                // Already handled in revealCard/eliminatePlayer
                const pending = this.state.pendingLoseInfluence;
                if (pending.continueAction && pending.originalAction) {
                    const originalAction = pending.originalAction;
                    this.state.pendingLoseInfluence = null;
                    this.state.pendingAction = originalAction;
                    const actionDef = types_1.ACTION_DEFINITIONS[originalAction.action];
                    if (this.state.pendingBlock) {
                        this.state.pendingBlock = null;
                        this.resolveAction();
                    }
                    else if (actionDef.canBeBlocked) {
                        const target = originalAction.targetId ? this.getPlayerById(originalAction.targetId) : null;
                        if (target && !target.alive) {
                            this.state.pendingAction = null;
                            this.advanceTurn();
                        }
                        else {
                            this.state.phase = types_1.GamePhase.BlockPhase;
                            this.emitStateChange();
                        }
                    }
                    else {
                        this.resolveAction();
                    }
                }
                else {
                    this.state.pendingLoseInfluence = null;
                    this.state.pendingAction = null;
                    this.state.pendingBlock = null;
                    if (!this.checkWinCondition()) {
                        this.advanceTurn();
                    }
                    else {
                        this.emitStateChange();
                    }
                }
            }
        }
    }
    // ─── State Views ───────────────────────────────────────────────
    /**
     * Build a GameStateView for a specific player (shows own cards, hides opponents').
     */
    getStateForPlayer(playerId) {
        return {
            roomId: this.state.roomId,
            players: this.state.players.map((p) => this.toPlayerView(p, playerId)),
            currentPlayerIndex: this.state.currentPlayerIndex,
            phase: this.state.phase,
            turnNumber: this.state.turnNumber,
            pendingAction: this.state.pendingAction,
            pendingBlock: this.state.pendingBlock,
            pendingChallenge: this.state.pendingChallenge,
            pendingLoseInfluence: this.state.pendingLoseInfluence
                ? this.toPendingLoseInfluenceView(this.state.pendingLoseInfluence)
                : null,
            pendingExchange: this.state.pendingExchange
                ? this.toPendingExchangeView(this.state.pendingExchange, playerId)
                : null,
            gameLog: this.state.gameLog,
            winner: this.state.winner,
            turnTimerEnd: this.state.turnTimerEnd,
            startedAt: this.state.startedAt,
            myPlayerId: playerId,
        };
    }
    /**
     * Build a GameStateView for a spectator (all cards hidden unless revealed).
     */
    getStateForSpectator() {
        return {
            roomId: this.state.roomId,
            players: this.state.players.map((p) => this.toPlayerView(p, '__spectator__')),
            currentPlayerIndex: this.state.currentPlayerIndex,
            phase: this.state.phase,
            turnNumber: this.state.turnNumber,
            pendingAction: this.state.pendingAction,
            pendingBlock: this.state.pendingBlock,
            pendingChallenge: this.state.pendingChallenge,
            pendingLoseInfluence: this.state.pendingLoseInfluence
                ? this.toPendingLoseInfluenceView(this.state.pendingLoseInfluence)
                : null,
            pendingExchange: null, // Spectators don't see exchange cards
            gameLog: this.state.gameLog,
            winner: this.state.winner,
            turnTimerEnd: this.state.turnTimerEnd,
            startedAt: this.state.startedAt,
            myPlayerId: '__spectator__',
        };
    }
    toPlayerView(player, viewingPlayerId) {
        const isOwn = player.id === viewingPlayerId;
        return {
            id: player.id,
            name: player.name,
            avatarUrl: player.avatarUrl,
            coins: player.coins,
            cards: player.cards.map((c) => this.toCardView(c, isOwn)),
            alive: player.alive,
            connected: player.connected,
            isBot: player.isBot,
        };
    }
    toCardView(card, isOwn) {
        if (isOwn || card.revealed) {
            return {
                id: card.id,
                character: card.character,
                revealed: card.revealed,
            };
        }
        return {
            id: card.id,
            revealed: false,
        };
    }
    toPendingLoseInfluenceView(pending) {
        return {
            playerId: pending.playerId,
            reason: pending.reason,
        };
    }
    toPendingExchangeView(pending, viewingPlayerId) {
        if (viewingPlayerId === pending.playerId) {
            // The exchanging player sees their available cards
            const allCards = [...pending.playerCards.filter(c => !c.revealed), ...pending.drawnCards];
            const keepCount = pending.playerCards.filter(c => !c.revealed).length;
            return {
                playerId: pending.playerId,
                availableCards: allCards,
                keepCount,
            };
        }
        return {
            playerId: pending.playerId,
        };
    }
    // ─── Utility ───────────────────────────────────────────────────
    getGameState() {
        return this.state;
    }
    getPhase() {
        return this.state.phase;
    }
    getCurrentPlayerId() {
        return this.state.players[this.state.currentPlayerIndex].id;
    }
    isGameOver() {
        return this.state.phase === types_1.GamePhase.GameOver;
    }
    setPlayerConnected(playerId, connected) {
        const player = this.getPlayerById(playerId);
        if (player) {
            player.connected = connected;
        }
    }
    getAvailableActions(playerId) {
        return (0, ActionResolver_1.getAvailableActions)(this.state, playerId);
    }
    destroy() {
        this.clearTurnTimer();
    }
}
exports.GameEngine = GameEngine;
//# sourceMappingURL=GameEngine.js.map
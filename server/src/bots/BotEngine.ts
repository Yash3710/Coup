import {
  Action,
  ACTION_DEFINITIONS,
  BotDifficulty,
  Card,
  Character,
  GamePhase,
  GameState,
  GameStateView,
  PendingAction,
  PendingBlock,
  Player,
  PlayerView,
} from '@shared/types';

/**
 * AI Bot engine that decides actions based on difficulty level.
 *
 * Easy:   Random valid moves, never bluffs, never challenges.
 * Medium: Prefers honest actions, 30% bluff rate, challenges obvious lies.
 * Hard:   Tracks revealed cards, probability-based decisions, 50% bluff when advantageous.
 * Expert: Full probability tracking, Bayesian-ish reasoning, targets leaders, optimal play.
 */
export class BotEngine {
  /**
   * Get human-like delay in ms depending on difficulty.
   */
  getDelay(difficulty: BotDifficulty): number {
    switch (difficulty) {
      case BotDifficulty.Easy:
        return 400 + Math.random() * 200;    // 400-600ms
      case BotDifficulty.Medium:
        return 300 + Math.random() * 200;    // 300-500ms
      case BotDifficulty.Hard:
        return 200 + Math.random() * 200;     // 200-400ms
      case BotDifficulty.Expert:
        return 150 + Math.random() * 150;    // 150-300ms
      default:
        return 300;
    }
  }

  /**
   * Decide which action the bot should perform on its turn.
   */
  decideBotAction(
    gameState: GameState,
    botPlayer: Player,
    difficulty: BotDifficulty
  ): { action: Action; targetId?: string } {
    const availableActions = this.getAvailableActionsForBot(gameState, botPlayer);

    // Forced coup
    if (botPlayer.coins >= 10) {
      const targets = this.getAliveTargets(gameState, botPlayer.id);
      const target = this.pickTarget(targets, gameState, difficulty);
      return { action: Action.Coup, targetId: target };
    }

    switch (difficulty) {
      case BotDifficulty.Easy:
        return this.easyAction(gameState, botPlayer, availableActions);
      case BotDifficulty.Medium:
        return this.mediumAction(gameState, botPlayer, availableActions);
      case BotDifficulty.Hard:
        return this.hardAction(gameState, botPlayer, availableActions);
      case BotDifficulty.Expert:
        return this.expertAction(gameState, botPlayer, availableActions);
      default:
        return this.easyAction(gameState, botPlayer, availableActions);
    }
  }

  /**
   * Decide whether the bot should challenge a pending action.
   */
  decideBotChallenge(
    gameState: GameState,
    botPlayer: Player,
    pendingAction: PendingAction,
    difficulty: BotDifficulty
  ): boolean {
    if (!pendingAction.claimedCharacter) return false;

    switch (difficulty) {
      case BotDifficulty.Easy:
        return false; // Easy bots never challenge

      case BotDifficulty.Medium: {
        // Challenge if bot has both remaining copies of the claimed character
        const botHas = botPlayer.cards.filter(
          (c) => !c.revealed && c.character === pendingAction.claimedCharacter
        ).length;
        // If bot holds 2 of the 3, there's a higher chance of bluff
        if (botHas >= 2) return Math.random() < 0.7;
        return Math.random() < 0.1; // 10% random challenge
      }

      case BotDifficulty.Hard: {
        const prob = this.estimateBluffProbability(
          gameState,
          botPlayer,
          pendingAction.playerId,
          pendingAction.claimedCharacter!
        );
        return Math.random() < prob * 0.8;
      }

      case BotDifficulty.Expert: {
        const prob = this.estimateBluffProbability(
          gameState,
          botPlayer,
          pendingAction.playerId,
          pendingAction.claimedCharacter!
        );
        // Factor in risk vs reward
        const botCards = botPlayer.cards.filter((c) => !c.revealed).length;
        if (botCards <= 1) {
          // High risk — only challenge if very confident
          return prob > 0.7;
        }
        return prob > 0.45;
      }

      default:
        return false;
    }
  }

  /**
   * Decide whether the bot should block a pending action, and with which character.
   */
  decideBotBlock(
    gameState: GameState,
    botPlayer: Player,
    pendingAction: PendingAction,
    difficulty: BotDifficulty
  ): Character | null {
    const actionDef = ACTION_DEFINITIONS[pendingAction.action];
    if (!actionDef.canBeBlocked) return null;

    // Check if bot is eligible to block
    if (actionDef.requiresTarget && pendingAction.targetId !== botPlayer.id) return null;

    const blockingChars = actionDef.blockedBy;
    if (blockingChars.length === 0) return null;

    // Check which blocking characters the bot actually has
    const botChars = botPlayer.cards.filter((c) => !c.revealed).map((c) => c.character);
    const honestBlocks = blockingChars.filter((ch) => botChars.includes(ch));

    switch (difficulty) {
      case BotDifficulty.Easy:
        // Only block honestly
        if (honestBlocks.length > 0) return honestBlocks[0];
        return null;

      case BotDifficulty.Medium:
        // Block honestly, or bluff 30% of the time
        if (honestBlocks.length > 0) return honestBlocks[0];
        if (Math.random() < 0.3) return blockingChars[0];
        return null;

      case BotDifficulty.Hard:
        // Block honestly, or bluff ~50% of the time if it's high-stakes
        if (honestBlocks.length > 0) return honestBlocks[0];
        if (pendingAction.action === Action.Assassinate) {
          // Always try to block assassination, even as bluff
          return blockingChars[0];
        }
        if (Math.random() < 0.5) return blockingChars[0];
        return null;

      case BotDifficulty.Expert:
        // Always block assassination
        if (honestBlocks.length > 0) return honestBlocks[0];
        if (pendingAction.action === Action.Assassinate) return blockingChars[0];
        // Bluff block steal if targeted
        if (pendingAction.action === Action.Steal && Math.random() < 0.6) {
          return blockingChars[Math.floor(Math.random() * blockingChars.length)];
        }
        // Bluff block foreign aid if advantageous
        if (pendingAction.action === Action.ForeignAid && Math.random() < 0.3) {
          return Character.Duke;
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * Decide whether the bot should challenge a pending block.
   */
  decideBotBlockChallenge(
    gameState: GameState,
    botPlayer: Player,
    pendingBlock: PendingBlock,
    difficulty: BotDifficulty
  ): boolean {
    switch (difficulty) {
      case BotDifficulty.Easy:
        return false;

      case BotDifficulty.Medium:
        return Math.random() < 0.15;

      case BotDifficulty.Hard: {
        const prob = this.estimateBluffProbability(
          gameState,
          botPlayer,
          pendingBlock.blockerId,
          pendingBlock.claimedCharacter
        );
        return Math.random() < prob * 0.6;
      }

      case BotDifficulty.Expert: {
        const prob = this.estimateBluffProbability(
          gameState,
          botPlayer,
          pendingBlock.blockerId,
          pendingBlock.claimedCharacter
        );
        return prob > 0.5;
      }

      default:
        return false;
    }
  }

  /**
   * Decide which card to reveal when losing influence.
   * Always reveal the least valuable card.
   */
  decideBotLoseInfluence(botPlayer: Player): string {
    const unrevealed = botPlayer.cards.filter((c) => !c.revealed);
    if (unrevealed.length === 0) {
      throw new Error('Bot has no unrevealed cards');
    }
    if (unrevealed.length === 1) return unrevealed[0].id;

    // Priority: lose the least useful character
    // Contessa < Ambassador < Captain < Assassin < Duke (Duke is most valuable)
    const priority: Record<Character, number> = {
      [Character.Contessa]: 1,
      [Character.Ambassador]: 2,
      [Character.Captain]: 3,
      [Character.Assassin]: 4,
      [Character.Duke]: 5,
    };

    unrevealed.sort((a, b) => priority[a.character] - priority[b.character]);
    return unrevealed[0].id; // Reveal least valuable
  }

  /**
   * Decide which cards to keep during an Exchange.
   */
  decideBotExchange(
    availableCards: Card[],
    keepCount: number,
    difficulty: BotDifficulty
  ): string[] {
    if (availableCards.length <= keepCount) {
      return availableCards.map((c) => c.id);
    }

    switch (difficulty) {
      case BotDifficulty.Easy: {
        // Random selection
        const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, keepCount).map((c) => c.id);
      }

      default: {
        // Prefer high-value characters
        const priority: Record<Character, number> = {
          [Character.Duke]: 5,
          [Character.Assassin]: 4,
          [Character.Captain]: 3,
          [Character.Ambassador]: 2,
          [Character.Contessa]: 1,
        };

        // Expert/Hard: prefer diversity (different characters)
        if (difficulty === BotDifficulty.Expert || difficulty === BotDifficulty.Hard) {
          // Sort by value, but prefer unique characters
          const sorted = [...availableCards].sort(
            (a, b) => priority[b.character] - priority[a.character]
          );

          const kept: Card[] = [];
          const usedChars = new Set<Character>();

          // First pass: pick unique high-value characters
          for (const card of sorted) {
            if (kept.length >= keepCount) break;
            if (!usedChars.has(card.character)) {
              kept.push(card);
              usedChars.add(card.character);
            }
          }

          // Fill remaining if needed
          for (const card of sorted) {
            if (kept.length >= keepCount) break;
            if (!kept.includes(card)) {
              kept.push(card);
            }
          }

          return kept.map((c) => c.id);
        }

        // Medium: just pick highest value
        const sorted = [...availableCards].sort(
          (a, b) => priority[b.character] - priority[a.character]
        );
        return sorted.slice(0, keepCount).map((c) => c.id);
      }
    }
  }

  // ─── Private Helpers ───────────────────────────────────────────

  private getAvailableActionsForBot(gameState: GameState, botPlayer: Player): Action[] {
    if (botPlayer.coins >= 10) return [Action.Coup];

    const actions: Action[] = [];
    for (const action of Object.values(Action)) {
      const def = ACTION_DEFINITIONS[action];
      if (botPlayer.coins < def.cost) continue;
      if (def.requiresTarget) {
        const hasTarget = gameState.players.some((p) => p.id !== botPlayer.id && p.alive);
        if (!hasTarget) continue;
      }
      actions.push(action);
    }
    return actions;
  }

  private getAliveTargets(gameState: GameState, excludeId: string): string[] {
    return gameState.players.filter((p) => p.alive && p.id !== excludeId).map((p) => p.id);
  }

  private pickTarget(targetIds: string[], gameState: GameState, difficulty: BotDifficulty): string {
    if (targetIds.length === 0) throw new Error('No valid targets');

    if (difficulty === BotDifficulty.Expert || difficulty === BotDifficulty.Hard) {
      // Target the leader (most coins or most influence)
      const players = targetIds
        .map((id) => gameState.players.find((p) => p.id === id)!)
        .sort((a, b) => {
          const aInfluence = a.cards.filter((c) => !c.revealed).length;
          const bInfluence = b.cards.filter((c) => !c.revealed).length;
          // Sort by coins desc, then influence desc
          if (b.coins !== a.coins) return b.coins - a.coins;
          return bInfluence - aInfluence;
        });
      return players[0].id;
    }

    // Random target for Easy/Medium
    return targetIds[Math.floor(Math.random() * targetIds.length)];
  }

  private easyAction(
    gameState: GameState,
    botPlayer: Player,
    available: Action[]
  ): { action: Action; targetId?: string } {
    // Easy: Only uses honest actions (Income, ForeignAid, or actions matching cards it has)
    const botChars = botPlayer.cards.filter((c) => !c.revealed).map((c) => c.character);

    const honest = available.filter((action) => {
      const def = ACTION_DEFINITIONS[action];
      if (!def.requiredCharacter) return true; // Income, ForeignAid, Coup
      return botChars.includes(def.requiredCharacter);
    });

    const actions = honest.length > 0 ? honest : [Action.Income];
    const chosen = actions[Math.floor(Math.random() * actions.length)];

    const def = ACTION_DEFINITIONS[chosen];
    let targetId: string | undefined;
    if (def.requiresTarget) {
      const targets = this.getAliveTargets(gameState, botPlayer.id);
      targetId = this.pickTarget(targets, gameState, BotDifficulty.Easy);
    }

    return { action: chosen, targetId };
  }

  private mediumAction(
    gameState: GameState,
    botPlayer: Player,
    available: Action[]
  ): { action: Action; targetId?: string } {
    const botChars = botPlayer.cards.filter((c) => !c.revealed).map((c) => c.character);

    // Prefer honest character actions, but 30% chance of bluffing
    let chosen: Action;

    // Prioritize: Coup if affordable, then Tax (if has Duke), then Steal (if has Captain), then Assassinate
    if (available.includes(Action.Coup) && botPlayer.coins >= 7) {
      chosen = Action.Coup;
    } else if (available.includes(Action.Tax) && botChars.includes(Character.Duke)) {
      chosen = Action.Tax;
    } else if (available.includes(Action.Steal) && botChars.includes(Character.Captain)) {
      chosen = Action.Steal;
    } else if (available.includes(Action.Assassinate) && botChars.includes(Character.Assassin) && botPlayer.coins >= 3) {
      chosen = Action.Assassinate;
    } else if (available.includes(Action.Exchange) && botChars.includes(Character.Ambassador)) {
      chosen = Action.Exchange;
    } else if (Math.random() < 0.3 && available.length > 2) {
      // Bluff: pick a random character action
      const bluffable = available.filter((a) => ACTION_DEFINITIONS[a].requiredCharacter);
      if (bluffable.length > 0) {
        chosen = bluffable[Math.floor(Math.random() * bluffable.length)];
      } else {
        chosen = available.includes(Action.ForeignAid) ? Action.ForeignAid : Action.Income;
      }
    } else {
      chosen = available.includes(Action.ForeignAid) ? Action.ForeignAid : Action.Income;
    }

    const def = ACTION_DEFINITIONS[chosen];
    let targetId: string | undefined;
    if (def.requiresTarget) {
      const targets = this.getAliveTargets(gameState, botPlayer.id);
      targetId = this.pickTarget(targets, gameState, BotDifficulty.Medium);
    }

    return { action: chosen, targetId };
  }

  private hardAction(
    gameState: GameState,
    botPlayer: Player,
    available: Action[]
  ): { action: Action; targetId?: string } {
    const botChars = botPlayer.cards.filter((c) => !c.revealed).map((c) => c.character);
    const targets = this.getAliveTargets(gameState, botPlayer.id);

    // Hard: strategic play with card tracking
    // If enough coins, coup the leader
    if (botPlayer.coins >= 7 && available.includes(Action.Coup)) {
      return { action: Action.Coup, targetId: this.pickTarget(targets, gameState, BotDifficulty.Hard) };
    }

    // If has Assassin and 3+ coins, assassinate the leader
    if (botChars.includes(Character.Assassin) && botPlayer.coins >= 3 && available.includes(Action.Assassinate)) {
      return { action: Action.Assassinate, targetId: this.pickTarget(targets, gameState, BotDifficulty.Hard) };
    }

    // If has Duke, tax
    if (botChars.includes(Character.Duke) && available.includes(Action.Tax)) {
      return { action: Action.Tax };
    }

    // If has Captain and someone has coins, steal
    if (botChars.includes(Character.Captain) && available.includes(Action.Steal)) {
      const richTarget = this.getAliveTargets(gameState, botPlayer.id)
        .map((id) => gameState.players.find((p) => p.id === id)!)
        .filter((p) => p.coins > 0)
        .sort((a, b) => b.coins - a.coins);
      if (richTarget.length > 0) {
        return { action: Action.Steal, targetId: richTarget[0].id };
      }
    }

    // 50% bluff Tax (Duke) to build coins
    if (Math.random() < 0.5 && available.includes(Action.Tax)) {
      return { action: Action.Tax };
    }

    // Exchange if has Ambassador
    if (botChars.includes(Character.Ambassador) && available.includes(Action.Exchange)) {
      return { action: Action.Exchange };
    }

    // Fallback
    if (available.includes(Action.ForeignAid)) return { action: Action.ForeignAid };
    return { action: Action.Income };
  }

  private expertAction(
    gameState: GameState,
    botPlayer: Player,
    available: Action[]
  ): { action: Action; targetId?: string } {
    const botChars = botPlayer.cards.filter((c) => !c.revealed).map((c) => c.character);
    const targets = this.getAliveTargets(gameState, botPlayer.id);
    const alivePlayers = gameState.players.filter((p) => p.alive);

    // Expert: Full strategic optimization

    // Identify the biggest threat
    const threat = targets
      .map((id) => gameState.players.find((p) => p.id === id)!)
      .sort((a, b) => {
        const aScore = a.coins * 2 + a.cards.filter((c) => !c.revealed).length * 3;
        const bScore = b.coins * 2 + b.cards.filter((c) => !c.revealed).length * 3;
        return bScore - aScore;
      })[0];

    // Coup if we can eliminate the threat
    if (botPlayer.coins >= 7 && available.includes(Action.Coup) && threat) {
      return { action: Action.Coup, targetId: threat.id };
    }

    // If threat is close to 7 coins, assassinate them
    if (
      threat &&
      threat.coins >= 5 &&
      botPlayer.coins >= 3 &&
      available.includes(Action.Assassinate)
    ) {
      return { action: Action.Assassinate, targetId: threat.id };
    }

    // Build economy: prefer Tax (honest or bluff)
    if (available.includes(Action.Tax) && botPlayer.coins < 7) {
      return { action: Action.Tax };
    }

    // Steal from rich targets
    if (available.includes(Action.Steal) && threat && threat.coins >= 2) {
      return { action: Action.Steal, targetId: threat.id };
    }

    // Assassinate if we have coins
    if (botPlayer.coins >= 3 && available.includes(Action.Assassinate) && threat) {
      return { action: Action.Assassinate, targetId: threat.id };
    }

    // Exchange to improve hand
    if (available.includes(Action.Exchange) && alivePlayers.length <= 3) {
      return { action: Action.Exchange };
    }

    if (available.includes(Action.ForeignAid)) return { action: Action.ForeignAid };
    return { action: Action.Income };
  }

  /**
   * Estimate the probability that a player is bluffing about having a character.
   * Based on revealed cards and bot's own cards.
   */
  private estimateBluffProbability(
    gameState: GameState,
    botPlayer: Player,
    claimingPlayerId: string,
    claimedCharacter: Character
  ): number {
    // Total copies of each character in the game: 3
    const totalCopies = 3;

    // Count how many copies are accounted for (revealed on the table + in bot's hand)
    let knownCopies = 0;

    // Cards the bot holds
    knownCopies += botPlayer.cards.filter(
      (c) => !c.revealed && c.character === claimedCharacter
    ).length;

    // All revealed cards across all players
    for (const player of gameState.players) {
      knownCopies += player.cards.filter(
        (c) => c.revealed && c.character === claimedCharacter
      ).length;
    }

    // Remaining unknown copies that could be in someone's hand or deck
    const unknownCopies = totalCopies - knownCopies;

    if (unknownCopies <= 0) {
      // All copies are accounted for and the claimer doesn't have one — 100% bluff
      return 1.0;
    }

    // Count unknown cards in other players' hands (excluding the claimer)
    const claimingPlayer = gameState.players.find((p) => p.id === claimingPlayerId);
    if (!claimingPlayer) return 0.5;

    const claimerHiddenCards = claimingPlayer.cards.filter((c) => !c.revealed).length;
    if (claimerHiddenCards === 0) return 1.0;

    // Total hidden cards across ALL players (excluding bot's own known cards)
    let totalHiddenCards = 0;
    for (const player of gameState.players) {
      if (player.id === botPlayer.id) continue;
      totalHiddenCards += player.cards.filter((c) => !c.revealed).length;
    }
    // Add remaining deck cards
    totalHiddenCards += gameState.deck.length;

    if (totalHiddenCards <= 0) return 0.5;

    // Probability the claimer has at least one copy:
    // P(has at least one) ≈ 1 - P(has none)
    // P(has none) ≈ C(totalHidden - unknown, claimerHidden) / C(totalHidden, claimerHidden)
    // Simplified: P(has at least one) ≈ 1 - ((totalHidden - unknown) / totalHidden) ^ claimerHidden

    const pNone = Math.pow(
      Math.max(0, totalHiddenCards - unknownCopies) / totalHiddenCards,
      claimerHiddenCards
    );

    const pHas = 1 - pNone;
    const pBluff = 1 - pHas;

    return Math.max(0, Math.min(1, pBluff));
  }
}

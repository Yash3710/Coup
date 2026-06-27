"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveChallenge = resolveChallenge;
/**
 * Resolves a challenge against a player who claimed to have a specific character.
 *
 * If the challenged player DOES have the card:
 *   - The card is revealed, shuffled back into the deck, and a new card is drawn.
 *   - The challenger must lose an influence.
 *   - Returns challengeSucceeded = false.
 *
 * If the challenged player does NOT have the card:
 *   - The challenged player must lose an influence.
 *   - The action is cancelled.
 *   - Returns challengeSucceeded = true.
 */
function resolveChallenge(players, deck, challengerId, challengedId, claimedCharacter) {
    const challenged = players.find((p) => p.id === challengedId);
    const challenger = players.find((p) => p.id === challengerId);
    if (!challenged || !challenger) {
        throw new Error('Challenge resolver: player not found');
    }
    // Check if the challenged player actually has the claimed character (unrevealed)
    const matchingCard = challenged.cards.find((c) => c.character === claimedCharacter && !c.revealed);
    if (matchingCard) {
        // Challenge FAILED — challenged player had the card
        // 1. Remove the matching card from the player's hand
        const cardIndex = challenged.cards.indexOf(matchingCard);
        challenged.cards.splice(cardIndex, 1);
        // 2. Return the card to the deck and shuffle
        deck.returnCards([matchingCard]);
        // 3. Draw a new card for the challenged player
        const [newCard] = deck.draw(1);
        challenged.cards.push(newCard);
        return {
            challengeSucceeded: false,
            loserId: challengerId,
            revealedCard: { ...matchingCard, revealed: true },
            message: `${challenged.name} revealed ${claimedCharacter}! ${challenger.name} lost the challenge.`,
        };
    }
    else {
        // Challenge SUCCEEDED — challenged player was bluffing
        return {
            challengeSucceeded: true,
            loserId: challengedId,
            message: `${challenged.name} did not have ${claimedCharacter}! ${challenger.name} won the challenge.`,
        };
    }
}
//# sourceMappingURL=ChallengeResolver.js.map
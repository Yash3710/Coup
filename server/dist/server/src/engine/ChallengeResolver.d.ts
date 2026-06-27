import { Card, Character, Player } from '@shared/types';
import { Deck } from './Deck';
export interface ChallengeResult {
    challengeSucceeded: boolean;
    loserId: string;
    revealedCard?: Card;
    message: string;
}
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
export declare function resolveChallenge(players: Player[], deck: Deck, challengerId: string, challengedId: string, claimedCharacter: Character): ChallengeResult;
//# sourceMappingURL=ChallengeResolver.d.ts.map
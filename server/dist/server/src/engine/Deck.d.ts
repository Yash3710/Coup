import { Card } from '../../../shared/types';
export declare class Deck {
    private cards;
    constructor();
    private initializeDeck;
    /** Fisher-Yates (Knuth) in-place shuffle */
    shuffle(): void;
    /** Draw n cards from the top of the deck */
    draw(n: number): Card[];
    /** Return cards to the deck and reshuffle */
    returnCards(cards: Card[]): void;
    /** Peek at the top n cards without removing them */
    peek(n: number): Card[];
    /** Get the number of remaining cards */
    get remaining(): number;
    /** Get a snapshot of all card objects (for serialization into GameState.deck) */
    getCards(): Card[];
}
//# sourceMappingURL=Deck.d.ts.map
import { v4 as uuidv4 } from 'uuid';
import { Card, Character } from '@shared/types';

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.initializeDeck();
    this.shuffle();
  }

  private initializeDeck(): void {
    const characters = [
      Character.Duke,
      Character.Assassin,
      Character.Captain,
      Character.Ambassador,
      Character.Contessa,
    ];

    this.cards = [];
    for (const character of characters) {
      for (let i = 0; i < 3; i++) {
        this.cards.push({
          id: uuidv4(),
          character,
          revealed: false,
        });
      }
    }
  }

  /** Fisher-Yates (Knuth) in-place shuffle */
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /** Draw n cards from the top of the deck */
  draw(n: number): Card[] {
    if (n > this.cards.length) {
      throw new Error(`Cannot draw ${n} cards, only ${this.cards.length} remaining`);
    }
    const drawn = this.cards.splice(0, n);
    // Return fresh copies with revealed = false
    return drawn.map((c) => ({ ...c, revealed: false }));
  }

  /** Return cards to the deck and reshuffle */
  returnCards(cards: Card[]): void {
    for (const card of cards) {
      this.cards.push({ id: uuidv4(), character: card.character, revealed: false });
    }
    this.shuffle();
  }

  /** Peek at the top n cards without removing them */
  peek(n: number): Card[] {
    return this.cards.slice(0, n).map((c) => ({ ...c }));
  }

  /** Get the number of remaining cards */
  get remaining(): number {
    return this.cards.length;
  }

  /** Get a snapshot of all card objects (for serialization into GameState.deck) */
  getCards(): Card[] {
    return this.cards.map((c) => ({ ...c }));
  }
}

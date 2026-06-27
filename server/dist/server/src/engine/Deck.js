"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deck = void 0;
const uuid_1 = require("uuid");
const types_1 = require("../../../shared/types");
class Deck {
    cards = [];
    constructor() {
        this.initializeDeck();
        this.shuffle();
    }
    initializeDeck() {
        const characters = [
            types_1.Character.Duke,
            types_1.Character.Assassin,
            types_1.Character.Captain,
            types_1.Character.Ambassador,
            types_1.Character.Contessa,
        ];
        this.cards = [];
        for (const character of characters) {
            for (let i = 0; i < 3; i++) {
                this.cards.push({
                    id: (0, uuid_1.v4)(),
                    character,
                    revealed: false,
                });
            }
        }
    }
    /** Fisher-Yates (Knuth) in-place shuffle */
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    /** Draw n cards from the top of the deck */
    draw(n) {
        if (n > this.cards.length) {
            throw new Error(`Cannot draw ${n} cards, only ${this.cards.length} remaining`);
        }
        const drawn = this.cards.splice(0, n);
        // Return fresh copies with revealed = false
        return drawn.map((c) => ({ ...c, revealed: false }));
    }
    /** Return cards to the deck and reshuffle */
    returnCards(cards) {
        for (const card of cards) {
            this.cards.push({ id: (0, uuid_1.v4)(), character: card.character, revealed: false });
        }
        this.shuffle();
    }
    /** Peek at the top n cards without removing them */
    peek(n) {
        return this.cards.slice(0, n).map((c) => ({ ...c }));
    }
    /** Get the number of remaining cards */
    get remaining() {
        return this.cards.length;
    }
    /** Get a snapshot of all card objects (for serialization into GameState.deck) */
    getCards() {
        return this.cards.map((c) => ({ ...c }));
    }
}
exports.Deck = Deck;
//# sourceMappingURL=Deck.js.map
import { VALID_WORDS } from './validWords';

export const WORDS = [
  'APPLE', 'BRAVE', 'CRANE', 'DANCE', 'EAGLE', 'FLAME', 'GRAPE', 'HEART', 'IMAGE', 'JUICE',
  'KNIFE', 'LEMON', 'MAGIC', 'NIGHT', 'OCEAN', 'PIZZA', 'QUEEN', 'RIVER', 'SMILE', 'TRAIN',
  'UNCLE', 'VOICE', 'WATER', 'YOUTH', 'ZEBRA', 'ALIEN', 'BEACH', 'CHAIR', 'DREAM', 'EARTH',
  'FROST', 'GHOST', 'HOUSE', 'IGLOO', 'JOKER', 'KOALA', 'LIGHT', 'MONEY', 'NURSE', 'ONION',
  'PLANT', 'QUICK', 'ROBOT', 'SNAKE', 'TIGER', 'UMBRA', 'VIRUS', 'WITCH', 'YATCH', 'ZESTY',
  'BREAD', 'CLOUD', 'DRIVE', 'EMPTY', 'FRESH', 'GIANT', 'HEAVY', 'INDEX', 'JOINT', 'KNOCK',
  'LARGE', 'MOUTH', 'NOISE', 'OPERA', 'PAINT', 'QUIET', 'ROUND', 'SHARK', 'THICK', 'UNDER',
  'VALVE', 'WHEEL', 'YIELD', 'ABUSE', 'BLAME', 'CATCH', 'DIRTY', 'ERROR', 'FAULT', 'GUILT',
  'HOTEL', 'IDEAL', 'JUDGE', 'KINGS', 'LABEL', 'MARCH', 'NASTY', 'OTHER', 'PANEL', 'QUOTE',
  'REACH', 'SHEET', 'TRUST', 'UNION', 'VITAL', 'WHILE', 'YACHT', 'ALARM', 'BLIND', 'CRAZY'
];

export function getDailyWord(): string {
  const epoch = new Date('2026-01-01T00:00:00').valueOf();
  const today = new Date().setHours(0, 0, 0, 0);
  const msInDay = 86400000;
  const index = Math.floor((today - epoch) / msInDay);
  return WORDS[index % WORDS.length];
}

export function getRandomWord(): string {
  const index = Math.floor(Math.random() * WORDS.length);
  return WORDS[index];
}

export function isValidWord(word: string): boolean {
  return word.length === 5 && VALID_WORDS.has(word.toUpperCase());
}

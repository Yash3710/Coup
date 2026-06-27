import { Character, Action } from '../types';

export const CHARACTER_COLORS: Record<Character, string> = {
  [Character.Duke]: '#9333ea',
  [Character.Assassin]: '#475569',
  [Character.Captain]: '#2563eb',
  [Character.Ambassador]: '#16a34a',
  [Character.Contessa]: '#dc2626',
};

export const CHARACTER_EMOJIS: Record<Character, string> = {
  [Character.Duke]: '👑',
  [Character.Assassin]: '🗡️',
  [Character.Captain]: '⚓',
  [Character.Ambassador]: '🕊️',
  [Character.Contessa]: '👸',
};

export const CHARACTER_BG_CLASSES: Record<Character, string> = {
  [Character.Duke]: 'from-purple-900 to-purple-700',
  [Character.Assassin]: 'from-slate-900 to-slate-700',
  [Character.Captain]: 'from-blue-900 to-blue-700',
  [Character.Ambassador]: 'from-green-900 to-green-700',
  [Character.Contessa]: 'from-red-900 to-red-700',
};

export const ACTION_ICONS: Record<Action, string> = {
  [Action.Income]: '💰',
  [Action.ForeignAid]: '🤝',
  [Action.Tax]: '💎',
  [Action.Coup]: '⚔️',
  [Action.Assassinate]: '🗡️',
  [Action.Steal]: '🏴‍☠️',
  [Action.Exchange]: '🔄',
};

export const ACTION_COSTS: Record<Action, number> = {
  [Action.Income]: 0,
  [Action.ForeignAid]: 0,
  [Action.Tax]: 0,
  [Action.Coup]: 7,
  [Action.Assassinate]: 3,
  [Action.Steal]: 0,
  [Action.Exchange]: 0,
};

export const QUICK_CHAT_MESSAGES = [
  'Good luck! 🍀',
  'Nice bluff! 😏',
  'Oops! 😅',
  'GG! 🎉',
  'Well played! 👏',
  'Thinking... 🤔',
  'No way! 😱',
  'I don\'t believe you! 🧐',
  'Bold move! 💪',
  'Mercy! 🙏',
];

export const DEFAULT_AVATARS = [
  { id: 'av1', color: '#9333ea', initials: 'A' },
  { id: 'av2', color: '#2563eb', initials: 'B' },
  { id: 'av3', color: '#dc2626', initials: 'C' },
  { id: 'av4', color: '#16a34a', initials: 'D' },
  { id: 'av5', color: '#f59e0b', initials: 'E' },
  { id: 'av6', color: '#ec4899', initials: 'F' },
  { id: 'av7', color: '#06b6d4', initials: 'G' },
  { id: 'av8', color: '#8b5cf6', initials: 'H' },
  { id: 'av9', color: '#ef4444', initials: 'I' },
  { id: 'av10', color: '#10b981', initials: 'J' },
  { id: 'av11', color: '#f97316', initials: 'K' },
  { id: 'av12', color: '#6366f1', initials: 'L' },
];

export const LOG_TYPE_COLORS: Record<string, string> = {
  Action: '#60a5fa',
  Challenge: '#f97316',
  Block: '#22c55e',
  Reveal: '#f59e0b',
  Elimination: '#ef4444',
  CoinChange: '#fbbf24',
  System: '#94a3b8',
  GameOver: '#a855f7',
};

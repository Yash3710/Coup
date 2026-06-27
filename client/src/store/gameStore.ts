import { create } from 'zustand';
import {
  GameStateView,
  Room,
  RoomListItem,
} from '../types';
import type { ChatMessage, ClientSettings, PlayerInfo } from '../types';

interface GameStore {
  // Connection
  connected: boolean;
  setConnected: (connected: boolean) => void;

  // Player info
  playerInfo: PlayerInfo | null;
  setPlayerInfo: (info: PlayerInfo | null) => void;

  // Current room
  currentRoom: Room | null;
  setRoom: (room: Room | null) => void;

  // Game state
  gameState: GameStateView | null;
  setGameState: (state: GameStateView | null) => void;

  // Room list
  availableRooms: RoomListItem[];
  setAvailableRooms: (rooms: RoomListItem[]) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;

  // Settings
  settings: ClientSettings;
  updateSettings: (partial: Partial<ClientSettings>) => void;

  // Reset
  reset: () => void;
}

const defaultSettings: ClientSettings = {
  volume: 0.5,
  muted: false,
  theme: 'dark',
  animations: true,
  showTimerWarnings: true,
};

// Load saved data
const loadPlayerInfo = (): PlayerInfo | null => {
  try {
    const saved = localStorage.getItem('coup_player_info');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const loadSettings = (): ClientSettings => {
  try {
    const saved = localStorage.getItem('coup_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const useGameStore = create<GameStore>((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),

  playerInfo: loadPlayerInfo(),
  setPlayerInfo: (info) => {
    if (info) {
      localStorage.setItem('coup_player_info', JSON.stringify(info));
    } else {
      localStorage.removeItem('coup_player_info');
    }
    set({ playerInfo: info });
  },

  currentRoom: null,
  setRoom: (room) => set({ currentRoom: room }),

  gameState: null,
  setGameState: (state) => set({ gameState: state }),

  availableRooms: [],
  setAvailableRooms: (rooms) => set({ availableRooms: rooms }),

  chatMessages: [],
  addChatMessage: (msg) =>
    set((s) => ({
      chatMessages: [...s.chatMessages.slice(-200), msg],
    })),
  clearChat: () => set({ chatMessages: [] }),

  settings: loadSettings(),
  updateSettings: (partial) =>
    set((s) => {
      const updated = { ...s.settings, ...partial };
      localStorage.setItem('coup_settings', JSON.stringify(updated));
      return { settings: updated };
    }),

  reset: () =>
    set({
      currentRoom: null,
      gameState: null,
      chatMessages: [],
    }),
}));

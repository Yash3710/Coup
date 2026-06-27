// Re-export all shared types
export * from '@shared/types';

// --- Client-only types ---

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  avatarUrl: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface ClientSettings {
  volume: number;
  muted: boolean;
  theme: 'dark' | 'light';
  animations: boolean;
  showTimerWarnings: boolean;
}

export interface PlayerInfo {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface DefaultAvatar {
  id: string;
  color: string;
  initials: string;
}

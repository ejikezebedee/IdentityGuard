
export enum AppView {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  GENERATE = 'GENERATE',
  VAULT = 'VAULT',
  AI_TOOLS = 'AI_TOOLS',
  SETTINGS = 'SETTINGS'
}

export interface Alias {
  id: string;
  hash: string;
  context: string;
  timestamp: number;
  tags: string[];
  isRevoked: boolean;
  notes?: string;
  expiresAt?: number;
}

export interface EncryptionStatus {
  isActive: boolean;
  level: 'AES-256' | 'SHA-3' | 'CHACHA20';
  strength: 'High' | 'Medium' | 'Low';
}

export interface UserState {
  isLocked: boolean;
  hasHardwareKey: boolean;
  aliasHistory: Alias[];
}

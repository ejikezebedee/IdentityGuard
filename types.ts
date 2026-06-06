
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
  fingerprint: string;
  tags: string[];
  isRevoked: boolean;
  notes?: string;
  expiresAt?: number;
}

export interface IdentityData {
  fullName: string;
  dob: string;
  address: string;
  context: string;
}

export interface UserState {
  isLocked: boolean;
  vaultReady: boolean;
  aliasHistory: Alias[];
}

export interface VaultSession {
  key: CryptoKey;
  createdAt: number;
}

export interface RiskFinding {
  label: string;
  level: 'Low' | 'Medium' | 'High';
  detail: string;
}

export interface RiskReport {
  summary: string;
  score: number;
  findings: RiskFinding[];
  recommendations: string[];
}

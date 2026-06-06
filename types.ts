
export enum AppView {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  GENERATE = 'GENERATE',
  VAULT = 'VAULT',
  AI_TOOLS = 'AI_TOOLS',
  ACCOUNT = 'ACCOUNT',
  SYNC = 'SYNC',
  BILLING = 'BILLING',
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
  customer: CustomerProfile | null;
  syncState: SyncState;
  auditEvents: AuditEvent[];
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

export type SubscriptionPlan = 'Free' | 'Pro' | 'Team';

export interface CustomerProfile {
  email: string;
  displayName: string;
  plan: SubscriptionPlan;
  emailVerified: boolean;
  createdAt: number;
}

export interface SyncState {
  enabled: boolean;
  endpoint: string;
  lastSyncAt?: number;
  pendingItems: number;
  status: 'Local only' | 'Ready' | 'Syncing' | 'Error';
  message: string;
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  action: string;
  detail: string;
  severity: 'Info' | 'Warning' | 'Critical';
}

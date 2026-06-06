import { Alias, SyncState } from '../types';

const SYNC_KEY = 'identityguard.syncState.v1';

const defaultSyncState: SyncState = {
  enabled: false,
  endpoint: '',
  pendingItems: 0,
  status: 'Local only',
  message: 'Encrypted cloud sync is disabled. Vault data stays on this device.',
};

const readSyncState = (): SyncState => {
  const stored = localStorage.getItem(SYNC_KEY);
  if (!stored) return defaultSyncState;

  try {
    return { ...defaultSyncState, ...JSON.parse(stored) };
  } catch {
    return defaultSyncState;
  }
};

const saveSyncState = (state: SyncState): SyncState => {
  localStorage.setItem(SYNC_KEY, JSON.stringify(state));
  return state;
};

export const syncService = {
  load(): SyncState {
    return readSyncState();
  },

  configure(endpoint: string): SyncState {
    const trimmedEndpoint = endpoint.trim();
    if (!trimmedEndpoint) return saveSyncState(defaultSyncState);

    return saveSyncState({
      enabled: true,
      endpoint: trimmedEndpoint,
      pendingItems: 0,
      status: 'Ready',
      message: 'Private sync endpoint configured. Vault payloads should remain encrypted before upload.',
    });
  },

  markPending(aliases: Alias[]): SyncState {
    const current = readSyncState();
    if (!current.enabled) return current;

    return saveSyncState({
      ...current,
      pendingItems: aliases.length,
      status: 'Ready',
      message: `${aliases.length} encrypted vault record${aliases.length === 1 ? '' : 's'} ready for sync.`,
    });
  },

  completeSync(): SyncState {
    const current = readSyncState();
    if (!current.enabled) return current;

    return saveSyncState({
      ...current,
      lastSyncAt: Date.now(),
      pendingItems: 0,
      status: 'Ready',
      message: 'Demo sync check completed. Connect the backend API before real cloud storage.',
    });
  },
};

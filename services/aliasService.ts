import { Alias } from '../types';

export const createAliasRecord = (context: string, hash: string, fingerprint: string): Alias => {
  const normalizedContext = context.trim();

  return {
    id: crypto.randomUUID(),
    hash,
    fingerprint,
    context: normalizedContext,
    timestamp: Date.now(),
    tags: normalizedContext.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 4),
    isRevoked: false,
  };
};

export const revokeAliasById = (aliases: Alias[], aliasId: string): Alias[] => {
  return aliases.map((alias) => (alias.id === aliasId ? { ...alias, isRevoked: true } : alias));
};

import { describe, expect, it, vi } from 'vitest';
import { createAliasRecord, revokeAliasById } from '../services/aliasService';
import { accountService } from '../services/accountService';
import { cryptoService } from '../services/cryptoService';
import { geminiService } from '../services/geminiService';
import { vaultService } from '../services/vaultService';
import { Alias } from '../types';

const sampleAlias = (id = 'alias-1'): Alias => ({
  id,
  hash: 'idg_testAliasValue',
  context: 'Business banking',
  timestamp: 1710000000000,
  fingerprint: 'abc123',
  tags: ['business', 'banking'],
  isRevoked: false,
});

describe('vault hardening', () => {
  it('rejects weak passphrases and saves/loads encrypted aliases with a valid passphrase', async () => {
    await expect(vaultService.unlock('short')).rejects.toThrow('Use at least 12 characters');

    const session = await vaultService.unlock('correct horse battery staple 2026!');
    const aliases = [sampleAlias()];

    await vaultService.save(session, aliases);

    expect(localStorage.getItem('identityguard.encryptedVault.v1')).not.toContain('Business banking');
    await expect(vaultService.load(session)).resolves.toEqual(aliases);
  });
});

describe('alias workflow', () => {
  it('generates an alias record with tags and revokes it without mutating the source alias', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000000');

    const generated = await cryptoService.generateAlias({
      fullName: 'Ada Lovelace',
      dob: '1815-12-10',
      address: '1 Analytical Engine Way',
      context: 'Crypto exchange onboarding',
    });
    const alias = createAliasRecord('Crypto exchange onboarding', generated.alias, generated.fingerprint);
    const [revoked] = revokeAliasById([alias], alias.id);

    expect(alias.hash).toMatch(/^idg_/);
    expect(alias.tags).toEqual(['crypto', 'exchange', 'onboarding']);
    expect(revoked.isRevoked).toBe(true);
    expect(alias.isRevoked).toBe(false);
  });
});

describe('risk and audit behavior', () => {
  it('falls back to local risk analysis and records audit events', async () => {
    const report = await geminiService.fastAnalysis('bank wallet exchange');
    const events = accountService.recordAudit({
      action: 'Alias generated',
      detail: 'Created a defensive alias for Business banking.',
      severity: 'Info',
    });

    expect(report.score).toBeGreaterThanOrEqual(70);
    expect(report.findings[0]?.label).toBe('Context exposure');
    expect(events[0]?.action).toBe('Alias generated');
    expect(events[0]?.id).toBeTruthy();
  });
});

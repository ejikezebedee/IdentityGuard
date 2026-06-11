import { Alias, VaultSession } from '../types';

const STORAGE_KEY = 'identityguard.encryptedVault.v1';
const SALT_KEY = 'identityguard.vaultSalt.v1';
export const MIN_PASSPHRASE_LENGTH = 12;
export const PASSPHRASE_GUIDANCE =
  'Use at least 12 characters. Prefer a long memorable phrase with uncommon words, numbers, and punctuation. Weak passphrases reduce vault safety.';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const base64ToBytes = (value: string): Uint8Array => {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const getSalt = (): Uint8Array => {
  const existing = localStorage.getItem(SALT_KEY);
  if (existing) return base64ToBytes(existing);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_KEY, bytesToBase64(salt));
  return salt;
};

export const vaultService = {
  async unlock(passphrase: string): Promise<VaultSession> {
    if (passphrase.trim().length < MIN_PASSPHRASE_LENGTH) {
      throw new Error(`Use at least ${MIN_PASSPHRASE_LENGTH} characters for the vault passphrase.`);
    }

    const baseKey = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, [
      'deriveKey',
    ]);

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: getSalt(),
        iterations: 210000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return { key, createdAt: Date.now() };
  },

  async load(session: VaultSession): Promise<Alias[]> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const payload = JSON.parse(stored) as { iv: string; data: string };
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(payload.iv) },
      session.key,
      base64ToBytes(payload.data)
    );

    return JSON.parse(decoder.decode(decrypted)) as Alias[];
  },

  async save(session: VaultSession, aliases: Alias[]): Promise<void> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      session.key,
      encoder.encode(JSON.stringify(aliases))
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        iv: bytesToBase64(iv),
        data: bytesToBase64(new Uint8Array(encrypted)),
      })
    );
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};

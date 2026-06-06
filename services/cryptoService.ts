
import { IdentityData } from '../types';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export const toHex = (buffer: ArrayBuffer, length = 16): string => {
  return Array.from(new Uint8Array(buffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
};

export const base58Encode = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let digits = [0];

  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  for (const byte of bytes) {
    if (byte === 0) digits.push(0);
    else break;
  }

  return digits.reverse().map(digit => BASE58_ALPHABET[digit]).join('');
};

const normalizeIdentity = (identity: IdentityData): string => {
  return [
    identity.fullName.trim().replace(/\s+/g, ' ').toLocaleLowerCase(),
    identity.dob.trim(),
    identity.address.trim().replace(/\s+/g, ' ').toLocaleLowerCase(),
    identity.context.trim().replace(/\s+/g, ' ').toLocaleLowerCase(),
  ].join('|');
};

export const cryptoService = {
  async digestIdentity(identity: IdentityData, nonce: Uint8Array): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const normalized = normalizeIdentity(identity);
    const payload = new Uint8Array(encoder.encode(normalized).length + nonce.length);
    payload.set(encoder.encode(normalized), 0);
    payload.set(nonce, encoder.encode(normalized).length);
    return crypto.subtle.digest('SHA-256', payload);
  },

  async generateAlias(identity: IdentityData): Promise<{ alias: string; fingerprint: string }> {
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const hashBuffer = await this.digestIdentity(identity, nonce);
    const encoded = base58Encode(hashBuffer).slice(0, 28);

    return {
      alias: `idg_${encoded}`,
      fingerprint: toHex(hashBuffer, 20),
    };
  },

  getNextRotationDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString();
  }
};

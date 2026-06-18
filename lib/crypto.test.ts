import { describe, it, expect, beforeEach } from 'vitest';
import { encryptToken, decryptToken } from './crypto';

const VALID_KEY = 'this-is-a-32-char-secret-key-1234!!';

describe('crypto', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
  });

  it('round-trips a plaintext string', () => {
    const plain = 'ghp_abc123def456';
    const encrypted = encryptToken(plain);
    expect(encrypted).not.toBe(plain);
    expect(decryptToken(encrypted)).toBe(plain);
  });

  it('produces different ciphertexts for the same input (random IV)', () => {
    const plain = 'same-value';
    const a = encryptToken(plain);
    const b = encryptToken(plain);
    expect(a).not.toBe(b);
  });

  it('rejects tampered ciphertext', () => {
    const encrypted = encryptToken('secret-token');
    const parts = encrypted.split('.');
    // Flip one byte in the ciphertext portion
    const corrupted = Buffer.from(parts[2], 'base64');
    corrupted[0] ^= 0xff;
    parts[2] = Buffer.from(corrupted).toString('base64');
    const tampered = parts.join('.');
    expect(() => decryptToken(tampered)).toThrow();
  });

  it('rejects an invalid payload format', () => {
    expect(() => decryptToken('not-a-valid-format')).toThrow();
  });

  it('round-trips an empty string', () => {
    const encrypted = encryptToken('');
    expect(decryptToken(encrypted)).toBe('');
  });

  it('throws when ENCRYPTION_KEY is missing', () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encryptToken('test')).toThrow('ENCRYPTION_KEY');
  });

  it('throws when ENCRYPTION_KEY is too short', () => {
    process.env.ENCRYPTION_KEY = 'short';
    expect(() => encryptToken('test')).toThrow('ENCRYPTION_KEY');
  });

  it('handles special characters in plaintext', () => {
    const plain = '!@#$%^&*()_+={}[]|\\:;"\'<>,.?/~`\n\t';
    const encrypted = encryptToken(plain);
    expect(decryptToken(encrypted)).toBe(plain);
  });
});

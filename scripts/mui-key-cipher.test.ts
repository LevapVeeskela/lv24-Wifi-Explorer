import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { decodeLicenseKey, encodeLicenseKey, licenseKeyDecoderSource } from './mui-key-cipher';

const PAD = Uint8Array.from({ length: 16 }, (_, index) => (index * 37 + 11) & 0xff);

describe('MUI license key codec', () => {
  it('round-trips an ASCII key', () => {
    const key = 'eyJhbGciOiJIUzI1NiJ9.MUI-X-PRO.abc123+/=';
    expect(decodeLicenseKey(encodeLicenseKey(key, PAD))).toBe(key);
  });

  it('round-trips non-ASCII input', () => {
    const key = 'ключ-лицензии-テスト';
    expect(decodeLicenseKey(encodeLicenseKey(key, PAD))).toBe(key);
  });

  it('injects a decoder that rebuilds the key without the plaintext', () => {
    const key = 'LICENSE-KEY-0123456789';
    const source = licenseKeyDecoderSource(encodeLicenseKey(key, PAD));
    expect(source).not.toContain(key);
    expect(runInNewContext(source, { TextDecoder })).toBe(key);
  });

  it('rejects an empty pad', () => {
    expect(() => encodeLicenseKey('x', new Uint8Array())).toThrow(/pad/);
  });
});

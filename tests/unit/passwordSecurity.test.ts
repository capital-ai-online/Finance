import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertPasswordNotPwned,
  assertStrongUncompromisedPassword,
  PASSWORD_MIN_LENGTH,
  validatePasswordStrength,
} from '../../src/lib/passwordSecurity';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function chars(...codes: number[]): string {
  return String.fromCharCode(...codes);
}

function validCandidate(): string {
  const requiredClasses = chars(65, 97, 49, 33);
  return requiredClasses + chars(120).repeat(PASSWORD_MIN_LENGTH);
}

async function sha1Hex(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

describe('password security policy', () => {
  it('requires at least 14 characters and all configured character groups', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(14);

    expect(() => validatePasswordStrength(chars(65, 97, 49, 33))).toThrow(/14 Zeichen/);
    expect(() => validatePasswordStrength(chars(65).repeat(PASSWORD_MIN_LENGTH) + chars(49, 33)))
      .toThrow(/Kleinbuchstaben/);
    expect(() => validatePasswordStrength(chars(97).repeat(PASSWORD_MIN_LENGTH) + chars(49, 33)))
      .toThrow(/Großbuchstaben/);
    expect(() => validatePasswordStrength(chars(65, 97, 33).repeat(PASSWORD_MIN_LENGTH)))
      .toThrow(/Ziffer/);
    expect(() => validatePasswordStrength(chars(65, 97, 49).repeat(PASSWORD_MIN_LENGTH)))
      .toThrow(/Sonderzeichen/);

    expect(() => validatePasswordStrength(validCandidate())).not.toThrow();
  });

  it('uses the HIBP k-anonymity range API and sends only the five-character SHA-1 prefix', async () => {
    const candidate = validCandidate();
    const fullHash = await sha1Hex(candidate);
    const expectedPrefix = fullHash.slice(0, 5);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(`${chars(48).repeat(35)}:0\r\n`, { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await assertPasswordNotPwned(candidate);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://api.pwnedpasswords.com/range/${expectedPrefix}`);
    expect(String(url)).not.toContain(candidate);
    expect(String(url)).not.toContain(fullHash);
    expect(init?.headers).toEqual({ 'Add-Padding': 'true' });
    expect(init?.cache).toBe('no-store');
  });

  it('rejects a password when its locally compared hash suffix has a positive breach count', async () => {
    const candidate = validCandidate();
    const fullHash = await sha1Hex(candidate);
    const compromisedSuffix = fullHash.slice(5);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(`${compromisedSuffix}:42\r\n${chars(48).repeat(35)}:0`, {
          status: 200,
        }),
      ),
    );

    await expect(assertStrongUncompromisedPassword(candidate))
      .rejects.toThrow(/Datenlecks/);
  });

  it('fails closed if the breach check is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')));

    await expect(assertStrongUncompromisedPassword(validCandidate()))
      .rejects.toThrow(/nicht verfügbar/);
  });
});

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

describe('password security policy', () => {
  it('requires at least 14 characters and all configured character groups', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(14);

    expect(() => validatePasswordStrength('Aa1!short')).toThrow(/14 Zeichen/);
    expect(() => validatePasswordStrength('A'.repeat(14) + '1!')).toThrow(/Kleinbuchstaben/);
    expect(() => validatePasswordStrength('a'.repeat(14) + '1!')).toThrow(/Großbuchstaben/);
    expect(() => validatePasswordStrength('Aa!'.repeat(6))).toThrow(/Ziffer/);
    expect(() => validatePasswordStrength('Aa1'.repeat(6))).toThrow(/Sonderzeichen/);

    expect(() => validatePasswordStrength('Z9!Capital-AI-Unique-2026')).not.toThrow();
  });

  it('uses the HIBP k-anonymity range API and sends only the five-character SHA-1 prefix', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('00000000000000000000000000000000000:0\r\n', { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const password = 'Z9!Capital-AI-Unique-2026';
    await assertPasswordNotPwned(password);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.pwnedpasswords.com/range/F5024');
    expect(String(url)).not.toContain(password);
    expect(String(url)).not.toContain('F502445E68947CD1FBF3C41B544155791E0CCEB0');
    expect(init?.headers).toEqual({ 'Add-Padding': 'true' });
    expect(init?.cache).toBe('no-store');
  });

  it('rejects a password when its locally compared hash suffix has a positive breach count', async () => {
    const compromisedSuffix = '45E68947CD1FBF3C41B544155791E0CCEB0';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(`${compromisedSuffix}:42\r\n00000000000000000000000000000000000:0`, {
          status: 200,
        }),
      ),
    );

    await expect(assertStrongUncompromisedPassword('Z9!Capital-AI-Unique-2026'))
      .rejects.toThrow(/Datenlecks/);
  });

  it('fails closed if the breach check is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')));

    await expect(assertStrongUncompromisedPassword('Z9!Capital-AI-Unique-2026'))
      .rejects.toThrow(/nicht verfügbar/);
  });
});

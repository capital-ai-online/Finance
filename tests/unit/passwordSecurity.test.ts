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

  it('sends screening only to the first-party backend boundary', async () => {
    const candidate = validCandidate();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await assertPasswordNotPwned(candidate);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/password-security/check');
    expect(String(url)).not.toContain('pwnedpasswords.com');
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('same-origin');
    expect(init?.cache).toBe('no-store');
    expect(JSON.parse(String(init?.body))).toEqual({ password: candidate });
  });

  it('surfaces backend rejection for a compromised password', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'Dieses Passwort ist aus bekannten Datenlecks bekannt. Bitte verwenden Sie ein neues, einzigartiges Passwort.',
          }),
          { status: 422, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    await expect(assertStrongUncompromisedPassword(validCandidate()))
      .rejects.toThrow(/Datenlecks/);
  });

  it('fails closed if the backend screening boundary is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')));

    await expect(assertStrongUncompromisedPassword(validCandidate()))
      .rejects.toThrow(/nicht verfügbar/);
  });
});

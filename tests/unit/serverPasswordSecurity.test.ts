import crypto from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PASSWORD_MIN_LENGTH } from '../../src/lib/passwordSecurity';
import {
  assertServerPasswordSafe,
  getPwnedPasswordCount,
} from '../../server/security/passwordSecurity';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function validCandidate(): string {
  return 'Aa1!' + 'x'.repeat(PASSWORD_MIN_LENGTH);
}

function sha1Hex(value: string): string {
  return crypto.createHash('sha1').update(value, 'utf8').digest('hex').toUpperCase();
}

describe('server password compromise screening', () => {
  it('sends only the five-character SHA-1 prefix to HIBP with response padding', async () => {
    const candidate = validCandidate();
    const fullHash = sha1Hex(candidate);
    const prefix = fullHash.slice(0, 5);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(`${'0'.repeat(35)}:0\r\n`, { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getPwnedPasswordCount(candidate)).resolves.toBe(0);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://api.pwnedpasswords.com/range/${prefix}`);
    expect(String(url)).not.toContain(candidate);
    expect(String(url)).not.toContain(fullHash);
    expect(init?.headers).toEqual({
      'User-Agent': 'CAPITAL-AI/0.6.0 password-security',
      'Add-Padding': 'true',
    });
    expect(init?.cache).toBe('no-store');
  });

  it('rejects a hash suffix with a positive breach count', async () => {
    const candidate = validCandidate();
    const suffix = sha1Hex(candidate).slice(5);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(`${suffix}:42\r\n`, { status: 200 })),
    );

    await expect(assertServerPasswordSafe(candidate)).rejects.toMatchObject({
      name: 'ServerPasswordSecurityError',
      statusCode: 422,
    });
  });

  it('fails closed when HIBP is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')));

    await expect(assertServerPasswordSafe(validCandidate())).rejects.toMatchObject({
      name: 'ServerPasswordSecurityError',
      statusCode: 503,
    });
  });
});

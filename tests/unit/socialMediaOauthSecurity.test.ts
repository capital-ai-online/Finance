import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { deriveCodeChallenge, generateCodeVerifier } from '../../server/socialMedia/pkce';
import {
  SOCIAL_MEDIA_OAUTH_CALLBACK_PATH,
  assertSafeOAuthRedirectUri,
} from '../../server/socialMedia/oauthSecurity';

const root = process.cwd();
const source = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('social media OAuth redirect binding', () => {
  it('accepts only canonical CAPITAL-AI HTTPS callback origins in production', () => {
    expect(
      assertSafeOAuthRedirectUri(`https://capital-ai.online${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}`, 'production')
    ).toBe(`https://capital-ai.online${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}`);
    expect(
      assertSafeOAuthRedirectUri(`https://www.capital-ai.online${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}`, 'production')
    ).toBe(`https://www.capital-ai.online${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}`);

    expect(() =>
      assertSafeOAuthRedirectUri(`https://attacker.example${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}`, 'production')
    ).toThrow(/not allowed/i);
    expect(() =>
      assertSafeOAuthRedirectUri(`http://capital-ai.online${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}`, 'production')
    ).toThrow(/not allowed/i);
  });

  it('accepts loopback callbacks only outside production', () => {
    expect(
      assertSafeOAuthRedirectUri(`http://localhost:3000${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}`, 'development')
    ).toBe(`http://localhost:3000${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}`);
    expect(
      assertSafeOAuthRedirectUri(`http://127.0.0.1:3000${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}`, 'test')
    ).toBe(`http://127.0.0.1:3000${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}`);

    expect(() =>
      assertSafeOAuthRedirectUri(`http://localhost:3000${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}`, 'production')
    ).toThrow(/not allowed/i);
  });

  it('rejects callback path, query, fragment and userinfo manipulation', () => {
    expect(() => assertSafeOAuthRedirectUri('https://capital-ai.online/callback', 'production')).toThrow(/callback path/i);
    expect(() =>
      assertSafeOAuthRedirectUri(`https://capital-ai.online${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}?next=https://attacker.example`, 'production')
    ).toThrow(/query/i);
    expect(() =>
      assertSafeOAuthRedirectUri(`https://capital-ai.online${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}#token`, 'production')
    ).toThrow(/fragments/i);
    expect(() =>
      assertSafeOAuthRedirectUri(`https://user@capital-ai.online${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}`, 'production')
    ).toThrow(/userinfo/i);
  });
});

describe('social media OAuth PKCE', () => {
  it('uses a 256-bit random verifier encoded as RFC 7636 base64url', () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(verifier, 'base64url')).toHaveLength(32);
  });

  it('derives the S256 challenge deterministically', () => {
    const verifier = '0123456789012345678901234567890123456789012';
    const expected = crypto.createHash('sha256').update(verifier).digest('base64url');
    expect(deriveCodeChallenge(verifier)).toBe(expected);
  });
});

describe('social media OAuth source security regressions', () => {
  it('keeps state one-time, expiring and bound to the canonicalized redirect URI', () => {
    const code = source('server/socialMedia/oauthExchange.ts');
    expect(code).toContain(".is('used_at', null)");
    expect(code).toContain(".gt('expires_at'");
    expect(code).toContain('assertSafeOAuthRedirectUri');
    expect(code).toContain('redirect_uri: safeRedirectUri');
  });

  it('does not put Meta resource access tokens into URLs or expose raw provider JSON in errors', () => {
    const code = source('server/socialMedia/oauthExchange.ts');
    expect(code).not.toMatch(/me\/accounts\?access_token=/);
    expect(code).not.toMatch(/fields=[^`\n]*&access_token=/);
    expect(code).not.toContain('JSON.stringify(json)');
    expect(code).not.toContain('JSON.stringify(shortJson)');
  });

  it('uses the current social-media ADR numbers in active OAuth implementation files', () => {
    for (const relativePath of [
      'server/socialMedia/oauthExchange.ts',
      'server/socialMedia/oauthProviders.ts',
      'server/socialMedia/pkce.ts',
    ]) {
      const code = source(relativePath);
      expect(code).toContain('ADR-0026');
      expect(code).not.toContain('ADR-0020');
      expect(code).not.toContain('ADR-0021');
    }
    expect(source('server/socialMedia/oauthExchange.ts')).toContain('ADR-0027');
  });
});

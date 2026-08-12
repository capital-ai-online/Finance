import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateKeyPairSync, sign, type JsonWebKey, type KeyObject } from 'node:crypto';
import {
  SYSTEMADMIN_GITHUB_OIDC_AUDIENCE,
  SYSTEMADMIN_GITHUB_OIDC_ISSUER,
  SYSTEMADMIN_GITHUB_OWNER_ID,
  SYSTEMADMIN_GITHUB_REPOSITORY_ID,
  SYSTEMADMIN_GITHUB_WORKFLOW_REF,
  resetGitHubActionsOidcCacheForTests,
  verifyGitHubActionsOidcToken,
} from '../../server/systemadmin/githubActionsOidc';

const NOW = new Date('2026-08-12T06:00:00.000Z');
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function createJwt(
  privateKey: KeyObject,
  kid: string,
  overrides: Record<string, unknown> = {},
): string {
  const header = encode({ alg: 'RS256', kid, typ: 'JWT' });
  const payload = encode({
    iss: SYSTEMADMIN_GITHUB_OIDC_ISSUER,
    aud: SYSTEMADMIN_GITHUB_OIDC_AUDIENCE,
    sub: 'repo:SvenKulessa/Finance:ref:refs/heads/main',
    exp: NOW_SECONDS + 300,
    nbf: NOW_SECONDS - 5,
    iat: NOW_SECONDS - 5,
    actor: 'SvenKulessa',
    actor_id: SYSTEMADMIN_GITHUB_OWNER_ID,
    repository: 'SvenKulessa/Finance',
    repository_id: SYSTEMADMIN_GITHUB_REPOSITORY_ID,
    repository_owner_id: SYSTEMADMIN_GITHUB_OWNER_ID,
    event_name: 'issues',
    ref: 'refs/heads/main',
    sha: '0123456789abcdef0123456789abcdef01234567',
    workflow: 'Systemadmin Roadmap Execution Host',
    workflow_ref: SYSTEMADMIN_GITHUB_WORKFLOW_REF,
    workflow_sha: '89abcdef0123456789abcdef0123456789abcdef',
    run_id: '31570000000',
    run_number: '1',
    run_attempt: '1',
    ...overrides,
  });
  const signature = sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), privateKey).toString('base64url');
  return `${header}.${payload}.${signature}`;
}

function responseJson(value: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => value,
  } as Response;
}

describe('SA3B GitHub Actions OIDC verifier', () => {
  let privateKey: KeyObject;
  let publicJwk: JsonWebKey;
  const kid = 'sa3b-test-kid';

  beforeEach(() => {
    resetGitHubActionsOidcCacheForTests();
    const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
    privateKey = keys.privateKey;
    publicJwk = keys.publicKey.export({ format: 'jwk' }) as JsonWebKey;

    vi.stubGlobal('fetch', vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.endsWith('/.well-known/openid-configuration')) {
        return responseJson({
          issuer: SYSTEMADMIN_GITHUB_OIDC_ISSUER,
          jwks_uri: `${SYSTEMADMIN_GITHUB_OIDC_ISSUER}/.well-known/jwks`,
        });
      }
      if (href.endsWith('/.well-known/jwks')) {
        return responseJson({ keys: [{ ...publicJwk, kid, alg: 'RS256', use: 'sig' }] });
      }
      throw new Error(`unexpected URL: ${href}`);
    }));
  });

  it('accepts a correctly signed token bound to the exact Finance issue workflow', async () => {
    const identity = await verifyGitHubActionsOidcToken(createJwt(privateKey, kid), NOW);
    expect(identity).toMatchObject({
      actor: 'SvenKulessa',
      repository: 'SvenKulessa/Finance',
      repositoryId: SYSTEMADMIN_GITHUB_REPOSITORY_ID,
      eventName: 'issues',
      ref: 'refs/heads/main',
      workflowRef: SYSTEMADMIN_GITHUB_WORKFLOW_REF,
      runId: '31570000000',
    });
  });

  it('also accepts the immutable-ID subject form while keeping exact claim checks', async () => {
    const token = createJwt(privateKey, kid, {
      sub: `repo:SvenKulessa@${SYSTEMADMIN_GITHUB_OWNER_ID}/Finance@${SYSTEMADMIN_GITHUB_REPOSITORY_ID}:ref:refs/heads/main`,
    });
    await expect(verifyGitHubActionsOidcToken(token, NOW)).resolves.toMatchObject({
      repositoryId: SYSTEMADMIN_GITHUB_REPOSITORY_ID,
    });
  });

  it.each([
    ['wrong audience', { aud: 'other-audience' }],
    ['wrong actor', { actor: 'attacker' }],
    ['wrong actor id', { actor_id: '999' }],
    ['wrong repository id', { repository_id: '999' }],
    ['wrong owner id', { repository_owner_id: '999' }],
    ['wrong event', { event_name: 'workflow_dispatch' }],
    ['wrong ref', { ref: 'refs/heads/feature' }],
    ['wrong workflow', { workflow_ref: 'SvenKulessa/Finance/.github/workflows/ci.yml@refs/heads/main' }],
    ['expired', { exp: NOW_SECONDS - 120 }],
  ])('fails closed for %s', async (_label, overrides) => {
    await expect(verifyGitHubActionsOidcToken(createJwt(privateKey, kid, overrides), NOW))
      .rejects.toThrow('[SystemadminOIDC][SECURITY]');
  });

  it('rejects a token with a signature from another key', async () => {
    const attacker = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const token = createJwt(attacker.privateKey, kid);
    await expect(verifyGitHubActionsOidcToken(token, NOW))
      .rejects.toThrow('JWT-Signatur ist ungültig');
  });

  it('rejects a subject outside Finance even when other claims look valid', async () => {
    await expect(verifyGitHubActionsOidcToken(createJwt(privateKey, kid, {
      sub: 'repo:Other/Repo:ref:refs/heads/main',
    }), NOW)).rejects.toThrow('subject liegt außerhalb');
  });
});

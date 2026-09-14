import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateKeyPairSync, sign, type JsonWebKey, type KeyObject } from 'node:crypto';
import {
  SYSTEMADMIN_GITHUB_ACTOR,
  SYSTEMADMIN_GITHUB_ACTOR_ID,
  SYSTEMADMIN_GITHUB_OIDC_AUDIENCE,
  SYSTEMADMIN_GITHUB_OIDC_ISSUER,
  SYSTEMADMIN_GITHUB_REPOSITORY,
  SYSTEMADMIN_GITHUB_REPOSITORY_ID,
  SYSTEMADMIN_GITHUB_REPOSITORY_OWNER,
  SYSTEMADMIN_GITHUB_REPOSITORY_OWNER_ID,
  SYSTEMADMIN_GITHUB_SA3B_WORKFLOW_REF,
  SYSTEMADMIN_GITHUB_SA4_WORKFLOW_REF,
  SYSTEMADMIN_GITHUB_WORK_PACKAGE_RUNNER_WORKFLOW_REF,
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
    sub: `repo:${SYSTEMADMIN_GITHUB_REPOSITORY}:ref:refs/heads/main`,
    exp: NOW_SECONDS + 300,
    nbf: NOW_SECONDS - 5,
    iat: NOW_SECONDS - 5,
    actor: SYSTEMADMIN_GITHUB_ACTOR,
    actor_id: SYSTEMADMIN_GITHUB_ACTOR_ID,
    repository: SYSTEMADMIN_GITHUB_REPOSITORY,
    repository_id: SYSTEMADMIN_GITHUB_REPOSITORY_ID,
    repository_owner_id: SYSTEMADMIN_GITHUB_REPOSITORY_OWNER_ID,
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

describe('Systemadmin GitHub Actions OIDC verifier', () => {
  let privateKey: KeyObject;
  let publicJwk: JsonWebKey;
  const kid = 'systemadmin-test-kid';

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

  it('accepts a correctly signed token bound to the exact SA3B Finance issue workflow', async () => {
    const identity = await verifyGitHubActionsOidcToken(createJwt(privateKey, kid), NOW);
    expect(identity).toMatchObject({
      actor: SYSTEMADMIN_GITHUB_ACTOR,
      actorId: SYSTEMADMIN_GITHUB_ACTOR_ID,
      repository: SYSTEMADMIN_GITHUB_REPOSITORY,
      repositoryId: SYSTEMADMIN_GITHUB_REPOSITORY_ID,
      repositoryOwnerId: SYSTEMADMIN_GITHUB_REPOSITORY_OWNER_ID,
      eventName: 'issues',
      ref: 'refs/heads/main',
      workflowRef: SYSTEMADMIN_GITHUB_SA3B_WORKFLOW_REF,
      runId: '31570000000',
    });
    expect(SYSTEMADMIN_GITHUB_REPOSITORY).toBe('capital-ai-online/Finance');
    expect(SYSTEMADMIN_GITHUB_REPOSITORY_OWNER).toBe('capital-ai-online');
    expect(SYSTEMADMIN_GITHUB_ACTOR).toBe('SvenKulessa');
  });

  it('accepts only the explicitly allowlisted SA4 workflow as the second host', async () => {
    const token = createJwt(privateKey, kid, {
      workflow: 'Systemadmin SA4 Bounded Pilot',
      workflow_ref: SYSTEMADMIN_GITHUB_SA4_WORKFLOW_REF,
    });
    await expect(verifyGitHubActionsOidcToken(token, NOW)).resolves.toMatchObject({
      workflowRef: SYSTEMADMIN_GITHUB_SA4_WORKFLOW_REF,
      repositoryId: SYSTEMADMIN_GITHUB_REPOSITORY_ID,
    });
  });

  it('accepts only the explicitly allowlisted generalized work-package runner as the third host', async () => {
    const token = createJwt(privateKey, kid, {
      workflow: 'Systemadmin Work-Package Runner',
      workflow_ref: SYSTEMADMIN_GITHUB_WORK_PACKAGE_RUNNER_WORKFLOW_REF,
    });
    await expect(verifyGitHubActionsOidcToken(token, NOW)).resolves.toMatchObject({
      workflowRef: SYSTEMADMIN_GITHUB_WORK_PACKAGE_RUNNER_WORKFLOW_REF,
      repositoryId: SYSTEMADMIN_GITHUB_REPOSITORY_ID,
    });
  });

  it('also accepts the immutable-ID subject form while keeping exact claim checks', async () => {
    const token = createJwt(privateKey, kid, {
      sub: `repo:${SYSTEMADMIN_GITHUB_REPOSITORY_OWNER}@${SYSTEMADMIN_GITHUB_REPOSITORY_OWNER_ID}/Finance@${SYSTEMADMIN_GITHUB_REPOSITORY_ID}:ref:refs/heads/main`,
    });
    await expect(verifyGitHubActionsOidcToken(token, NOW)).resolves.toMatchObject({
      repositoryId: SYSTEMADMIN_GITHUB_REPOSITORY_ID,
      repositoryOwnerId: SYSTEMADMIN_GITHUB_REPOSITORY_OWNER_ID,
    });
  });

  it.each([
    ['wrong audience', { aud: 'other-audience' }],
    ['wrong actor', { actor: 'attacker' }],
    ['wrong actor id', { actor_id: '999' }],
    ['legacy personal repository identity', { repository: 'SvenKulessa/Finance', sub: 'repo:SvenKulessa/Finance:ref:refs/heads/main' }],
    ['wrong repository id', { repository_id: '999' }],
    ['legacy personal repository owner id', { repository_owner_id: SYSTEMADMIN_GITHUB_ACTOR_ID }],
    ['wrong repository owner id', { repository_owner_id: '999' }],
    ['wrong event', { event_name: 'workflow_dispatch' }],
    ['wrong ref', { ref: 'refs/heads/feature' }],
    ['unlisted workflow', { workflow_ref: 'capital-ai-online/Finance/.github/workflows/ci.yml@refs/heads/main' }],
    ['legacy personal workflow ref', { workflow_ref: 'SvenKulessa/Finance/.github/workflows/systemadmin-roadmap-executor.yml@refs/heads/main' }],
    ['expired', { exp: NOW_SECONDS - 120 }],
    ['legacy personal immutable subject', {
      sub: `repo:SvenKulessa@${SYSTEMADMIN_GITHUB_ACTOR_ID}/Finance@${SYSTEMADMIN_GITHUB_REPOSITORY_ID}:ref:refs/heads/main`,
    }],
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

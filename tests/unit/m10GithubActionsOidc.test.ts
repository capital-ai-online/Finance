import { generateKeyPairSync, sign as signJwt } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  GITHUB_ACTIONS_OIDC_ISSUER,
  M10_WORKFLOW_GATE_AUDIENCE,
  verifyGithubActionsOidcToken,
} from '../../server/m10/githubActionsOidc';

const NOW_MS = Date.UTC(2026, 7, 19, 6, 0, 0);
const NOW_SECONDS = Math.floor(NOW_MS / 1000);
const REPOSITORY = 'SvenKulessa/Finance';
const REF = 'refs/heads/agent/post-cutover-probe';
const HEAD_SHA = 'a'.repeat(40);
const RUN_ID = '32220000000';
const WORKFLOW_FILE = '.github/workflows/ci.yml';
const WORKFLOW_NAME = 'CI';

const primary = generateKeyPairSync('rsa', { modulusLength: 2048 });
const secondary = generateKeyPairSync('rsa', { modulusLength: 2048 });
const primaryJwk = primary.publicKey.export({ format: 'jwk' }) as Record<string, unknown>;
const KID = 'm10-test-key';

function baseClaims() {
  return {
    iss: GITHUB_ACTIONS_OIDC_ISSUER,
    aud: M10_WORKFLOW_GATE_AUDIENCE,
    sub: `repo:${REPOSITORY}:ref:${REF}`,
    exp: NOW_SECONDS + 300,
    iat: NOW_SECONDS - 5,
    nbf: NOW_SECONDS - 10,
    jti: 'oidc-jti-1',
    repository: REPOSITORY,
    repository_id: '123456789',
    actor: 'SvenKulessa',
    actor_id: '84307769',
    event_name: 'workflow_dispatch',
    ref: REF,
    ref_type: 'branch',
    sha: HEAD_SHA,
    run_id: RUN_ID,
    run_attempt: '1',
    workflow: WORKFLOW_NAME,
    workflow_ref: `${REPOSITORY}/${WORKFLOW_FILE}@${REF}`,
    workflow_sha: HEAD_SHA,
    runner_environment: 'github-hosted',
  };
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function token(
  claimOverrides: Record<string, unknown> = {},
  privateKey = primary.privateKey,
  headerOverrides: Record<string, unknown> = {},
): string {
  const header = encodeJson({ alg: 'RS256', typ: 'JWT', kid: KID, ...headerOverrides });
  const payload = encodeJson({ ...baseClaims(), ...claimOverrides });
  const signingInput = `${header}.${payload}`;
  const signature = signJwt('RSA-SHA256', Buffer.from(signingInput, 'utf8'), privateKey).toString('base64url');
  return `${signingInput}.${signature}`;
}

function jwksFetch() {
  return (async () => new Response(JSON.stringify({
    keys: [{ ...primaryJwk, kid: KID, alg: 'RS256', use: 'sig' }],
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })) as typeof fetch;
}

function expectations(oidcToken: string) {
  return {
    token: oidcToken,
    repository: REPOSITORY,
    runId: RUN_ID,
    ref: REF,
    headSha: HEAD_SHA,
    workflowFile: WORKFLOW_FILE,
    workflowName: WORKFLOW_NAME,
  };
}

describe('verifyGithubActionsOidcToken', () => {
  it('verifies a fresh RS256 token bound to the exact repository/ref/head/run/workflow context', async () => {
    const result = await verifyGithubActionsOidcToken(expectations(token()), {
      nowMs: NOW_MS,
      fetchImpl: jwksFetch(),
    });

    expect(result.verdict).toBe('VERIFIED');
    if (result.verdict !== 'VERIFIED') return;
    expect(result.identity).toMatchObject({
      jti: 'oidc-jti-1',
      actor: 'SvenKulessa',
      actorId: '84307769',
      runId: RUN_ID,
      repository: REPOSITORY,
      ref: REF,
      headSha: HEAD_SHA,
      workflowRef: `${REPOSITORY}/${WORKFLOW_FILE}@${REF}`,
    });
  });

  it('denies a token with the wrong audience even when all GitHub workload claims otherwise match', async () => {
    const result = await verifyGithubActionsOidcToken(expectations(token({ aud: 'https://example.invalid' })), {
      nowMs: NOW_MS,
      fetchImpl: jwksFetch(),
    });
    expect(result.verdict).toBe('DENY');
  });

  it('denies stale or wrong repository/ref/head/run/workflow identity claims', async () => {
    for (const overrides of [
      { repository: 'other/repo' },
      { ref: 'refs/heads/main' },
      { sha: 'b'.repeat(40) },
      { run_id: 'different-run' },
      { event_name: 'push' },
      { workflow_ref: `${REPOSITORY}/${WORKFLOW_FILE}@refs/heads/main` },
    ]) {
      const result = await verifyGithubActionsOidcToken(expectations(token(overrides)), {
        nowMs: NOW_MS,
        fetchImpl: jwksFetch(),
      });
      expect(result.verdict).toBe('DENY');
    }
  });

  it('denies an expired token before accepting workload identity', async () => {
    const result = await verifyGithubActionsOidcToken(expectations(token({
      iat: NOW_SECONDS - 700,
      nbf: NOW_SECONDS - 700,
      exp: NOW_SECONDS - 400,
    })), {
      nowMs: NOW_MS,
      fetchImpl: jwksFetch(),
    });
    expect(result.verdict).toBe('DENY');
  });

  it('denies a forged signature even when kid and claims match', async () => {
    const result = await verifyGithubActionsOidcToken(expectations(token({}, secondary.privateKey)), {
      nowMs: NOW_MS,
      fetchImpl: jwksFetch(),
    });
    expect(result.verdict).toBe('DENY');
  });

  it('denies non-RS256 JOSE headers before workload claims are trusted', async () => {
    const result = await verifyGithubActionsOidcToken(expectations(token({}, primary.privateKey, { alg: 'none' })), {
      nowMs: NOW_MS,
      fetchImpl: jwksFetch(),
    });
    expect(result.verdict).toBe('DENY');
  });
});

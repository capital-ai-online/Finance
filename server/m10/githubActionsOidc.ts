// M10 Controlled Cutover — GitHub Actions OIDC workload identity verification.
//
// The workflow-dispatch consumptionId is a one-time authorization capability, but workflow_dispatch
// inputs are GitHub event inputs and therefore must not be the only proof that the caller is the
// intended GitHub-hosted workload. This verifier adds short-lived, signed GitHub Actions OIDC
// identity without introducing another repository dependency or long-lived shared secret.
import { createPublicKey, verify as verifySignature } from 'node:crypto';

export const GITHUB_ACTIONS_OIDC_ISSUER = 'https://token.actions.githubusercontent.com';
export const GITHUB_ACTIONS_OIDC_JWKS_URI = 'https://token.actions.githubusercontent.com/.well-known/jwks';
export const M10_WORKFLOW_GATE_AUDIENCE = 'https://capital-ai.online/m10-workflow-gate';

interface GithubOidcHeader {
  alg?: unknown;
  kid?: unknown;
  typ?: unknown;
}

interface GithubOidcClaims {
  iss?: unknown;
  aud?: unknown;
  sub?: unknown;
  exp?: unknown;
  iat?: unknown;
  nbf?: unknown;
  jti?: unknown;
  repository?: unknown;
  repository_id?: unknown;
  actor?: unknown;
  actor_id?: unknown;
  event_name?: unknown;
  ref?: unknown;
  ref_type?: unknown;
  sha?: unknown;
  run_id?: unknown;
  run_attempt?: unknown;
  workflow?: unknown;
  workflow_ref?: unknown;
  workflow_sha?: unknown;
  runner_environment?: unknown;
}

interface GithubOidcJwk extends Record<string, unknown> {
  kid?: unknown;
  kty?: unknown;
  alg?: unknown;
  use?: unknown;
}

export interface GithubActionsOidcExpectations {
  token: string;
  repository: string;
  runId: string;
  ref: string;
  headSha: string;
  workflowFile: string;
  workflowName: string;
}

export type GithubActionsOidcVerificationResult =
  | {
      verdict: 'VERIFIED';
      identity: Readonly<{
        jti: string;
        actor: string | null;
        actorId: string | null;
        runId: string;
        runAttempt: string | null;
        repository: string;
        ref: string;
        headSha: string;
        workflowRef: string;
        runnerEnvironment: string | null;
      }>;
    }
  | { verdict: 'DENY'; reason: string };

export interface GithubActionsOidcVerifyDeps {
  fetchImpl?: typeof fetch;
  nowMs?: number;
}

let cachedJwks: { keys: GithubOidcJwk[]; expiresAtMs: number } | null = null;

function decodeJsonSegment<T>(segment: string): T | null {
  try {
    const decoded = Buffer.from(segment, 'base64url').toString('utf8');
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function audienceContains(aud: unknown, expected: string): boolean {
  if (aud === expected) return true;
  return Array.isArray(aud) && aud.some(value => value === expected);
}

async function loadJwks(
  fetchImpl: typeof fetch,
  nowMs: number,
  allowCache: boolean,
  forceRefresh = false,
): Promise<GithubOidcJwk[]> {
  if (allowCache && !forceRefresh && cachedJwks && cachedJwks.expiresAtMs > nowMs) {
    return cachedJwks.keys;
  }

  const response = await fetchImpl(GITHUB_ACTIONS_OIDC_JWKS_URI, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    redirect: 'error',
  });
  if (response.status !== 200) throw new Error(`GitHub OIDC JWKS returned HTTP ${response.status}.`);

  const body = await response.json() as { keys?: unknown };
  if (!Array.isArray(body.keys) || body.keys.length === 0) {
    throw new Error('GitHub OIDC JWKS response contains no signing keys.');
  }

  const keys = body.keys.filter(key => key && typeof key === 'object') as GithubOidcJwk[];
  if (allowCache) cachedJwks = { keys, expiresAtMs: nowMs + 5 * 60_000 };
  return keys;
}

async function findSigningKey(
  kid: string,
  fetchImpl: typeof fetch,
  nowMs: number,
  allowCache: boolean,
): Promise<GithubOidcJwk | null> {
  let keys = await loadJwks(fetchImpl, nowMs, allowCache);
  let key = keys.find(candidate => candidate.kid === kid) ?? null;
  if (!key && allowCache) {
    keys = await loadJwks(fetchImpl, nowMs, allowCache, true);
    key = keys.find(candidate => candidate.kid === kid) ?? null;
  }
  return key;
}

/**
 * Verifies the GitHub-hosted workflow identity before M10 touches the one-time DB consumption.
 * Expected context is supplied by the request + trusted M10 server state, never by JWT claims alone.
 */
export async function verifyGithubActionsOidcToken(
  expected: Readonly<GithubActionsOidcExpectations>,
  deps: Readonly<GithubActionsOidcVerifyDeps> = {},
): Promise<GithubActionsOidcVerificationResult> {
  const token = expected.token.trim();
  if (!token || token.length > 20_000) return { verdict: 'DENY', reason: 'Missing or oversized GitHub Actions OIDC token.' };

  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(part => part.length === 0)) {
    return { verdict: 'DENY', reason: 'Malformed GitHub Actions OIDC token.' };
  }

  const header = decodeJsonSegment<GithubOidcHeader>(parts[0]);
  if (!header || header.alg !== 'RS256' || header.typ !== 'JWT' || !nonEmptyString(header.kid)) {
    return { verdict: 'DENY', reason: 'Unsupported GitHub Actions OIDC JOSE header.' };
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const nowMs = deps.nowMs ?? Date.now();
  const allowCache = deps.fetchImpl === undefined;

  let key: GithubOidcJwk | null;
  try {
    key = await findSigningKey(header.kid, fetchImpl, nowMs, allowCache);
  } catch (err: any) {
    return { verdict: 'DENY', reason: `GitHub Actions OIDC signing keys unavailable: ${err?.message || String(err)}` };
  }
  if (!key || key.kty !== 'RSA' || (key.alg !== undefined && key.alg !== 'RS256') || (key.use !== undefined && key.use !== 'sig')) {
    return { verdict: 'DENY', reason: 'GitHub Actions OIDC signing key is unknown or incompatible.' };
  }

  let publicKey;
  try {
    publicKey = createPublicKey({ key: key as any, format: 'jwk' });
  } catch {
    return { verdict: 'DENY', reason: 'GitHub Actions OIDC signing key could not be imported.' };
  }

  const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`, 'utf8');
  const signature = Buffer.from(parts[2], 'base64url');
  if (!verifySignature('RSA-SHA256', signingInput, publicKey, signature)) {
    return { verdict: 'DENY', reason: 'GitHub Actions OIDC signature verification failed.' };
  }

  const claims = decodeJsonSegment<GithubOidcClaims>(parts[1]);
  if (!claims) return { verdict: 'DENY', reason: 'GitHub Actions OIDC claims are malformed.' };

  const nowSeconds = Math.floor(nowMs / 1000);
  const skewSeconds = 30;
  if (
    typeof claims.exp !== 'number' || typeof claims.iat !== 'number' || typeof claims.nbf !== 'number'
    || claims.exp <= nowSeconds - skewSeconds
    || claims.nbf > nowSeconds + skewSeconds
    || claims.iat > nowSeconds + skewSeconds
    || claims.iat < nowSeconds - 15 * 60
    || claims.exp - claims.iat > 15 * 60
  ) {
    return { verdict: 'DENY', reason: 'GitHub Actions OIDC token is expired or outside the allowed freshness window.' };
  }

  if (claims.iss !== GITHUB_ACTIONS_OIDC_ISSUER || !audienceContains(claims.aud, M10_WORKFLOW_GATE_AUDIENCE)) {
    return { verdict: 'DENY', reason: 'GitHub Actions OIDC issuer/audience mismatch.' };
  }

  const runId = asString(claims.run_id);
  const runAttempt = asString(claims.run_attempt);
  const actorId = asString(claims.actor_id);
  const expectedWorkflowRef = `${expected.repository}/${expected.workflowFile}@${expected.ref}`;
  if (
    claims.repository !== expected.repository
    || claims.event_name !== 'workflow_dispatch'
    || claims.ref_type !== 'branch'
    || claims.ref !== expected.ref
    || claims.sha !== expected.headSha
    || runId !== expected.runId
    || claims.workflow !== expected.workflowName
    || claims.workflow_ref !== expectedWorkflowRef
    || !nonEmptyString(claims.jti)
  ) {
    return { verdict: 'DENY', reason: 'GitHub Actions OIDC workload claims do not match the exact M10 workflow context.' };
  }

  return {
    verdict: 'VERIFIED',
    identity: {
      jti: claims.jti,
      actor: nonEmptyString(claims.actor) ? claims.actor : null,
      actorId,
      runId,
      runAttempt,
      repository: expected.repository,
      ref: expected.ref,
      headSha: expected.headSha,
      workflowRef: expectedWorkflowRef,
      runnerEnvironment: nonEmptyString(claims.runner_environment) ? claims.runner_environment : null,
    },
  };
}

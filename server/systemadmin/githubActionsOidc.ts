import { createPublicKey, verify as verifySignature, type JsonWebKey } from 'node:crypto';

export const SYSTEMADMIN_GITHUB_OIDC_ISSUER = 'https://token.actions.githubusercontent.com';
export const SYSTEMADMIN_GITHUB_OIDC_AUDIENCE = 'capital-ai-systemadmin-execution';
export const SYSTEMADMIN_GITHUB_REPOSITORY = 'SvenKulessa/Finance';
export const SYSTEMADMIN_GITHUB_REPOSITORY_ID = '1284319285';
export const SYSTEMADMIN_GITHUB_OWNER = 'SvenKulessa';
export const SYSTEMADMIN_GITHUB_OWNER_ID = '84307769';
export const SYSTEMADMIN_GITHUB_SA3B_WORKFLOW_REF =
  'SvenKulessa/Finance/.github/workflows/systemadmin-roadmap-executor.yml@refs/heads/main';
export const SYSTEMADMIN_GITHUB_SA4_WORKFLOW_REF =
  'SvenKulessa/Finance/.github/workflows/systemadmin-sa4-pilot.yml@refs/heads/main';
/** @deprecated Use the explicit stage-specific workflow ref. */
export const SYSTEMADMIN_GITHUB_WORKFLOW_REF = SYSTEMADMIN_GITHUB_SA3B_WORKFLOW_REF;
export const SYSTEMADMIN_GITHUB_ALLOWED_WORKFLOW_REFS = Object.freeze([
  SYSTEMADMIN_GITHUB_SA3B_WORKFLOW_REF,
  SYSTEMADMIN_GITHUB_SA4_WORKFLOW_REF,
] as const);

const ALLOWED_WORKFLOW_REF_SET = new Set<string>(SYSTEMADMIN_GITHUB_ALLOWED_WORKFLOW_REFS);
const CLOCK_SKEW_SECONDS = 60;
const CACHE_TTL_MS = 5 * 60_000;

interface OidcDiscovery {
  issuer: string;
  jwks_uri: string;
}

interface JwksDocument {
  keys: Array<JsonWebKey & { kid?: string; alg?: string; use?: string }>;
}

interface JwtHeader {
  alg?: string;
  kid?: string;
  typ?: string;
}

export interface VerifiedGitHubActionsIdentity {
  issuer: string;
  audience: string;
  subject: string;
  actor: string;
  actorId?: string;
  repository: string;
  repositoryId: string;
  repositoryOwnerId: string;
  eventName: string;
  ref: string;
  sha: string;
  workflow: string;
  workflowRef: string;
  workflowSha: string;
  runId: string;
  runNumber?: string;
  runAttempt?: string;
  issuedAt: number;
  expiresAt: number;
}

interface RawClaims extends Record<string, unknown> {
  iss?: string;
  aud?: string | string[];
  sub?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
  actor?: string;
  actor_id?: string;
  repository?: string;
  repository_id?: string;
  repository_owner_id?: string;
  event_name?: string;
  ref?: string;
  sha?: string;
  workflow?: string;
  workflow_ref?: string;
  workflow_sha?: string;
  run_id?: string;
  run_number?: string;
  run_attempt?: string;
}

let cachedDiscovery: { value: OidcDiscovery; expiresAt: number } | null = null;
let cachedJwks: { uri: string; value: JwksDocument; expiresAt: number } | null = null;

function fail(message: string): never {
  throw new Error(`[SystemadminOIDC][SECURITY] ${message}`);
}

function decodeBase64UrlJson<T>(value: string, label: string): T {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
  } catch {
    return fail(`${label} ist kein gültiges base64url-JSON.`);
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) fail(`OIDC-Metadaten konnten nicht geladen werden (${response.status}).`);
  return response.json() as Promise<T>;
}

async function getDiscovery(nowMs: number): Promise<OidcDiscovery> {
  if (cachedDiscovery && cachedDiscovery.expiresAt > nowMs) return cachedDiscovery.value;
  const value = await fetchJson<OidcDiscovery>(
    `${SYSTEMADMIN_GITHUB_OIDC_ISSUER}/.well-known/openid-configuration`,
  );
  if (value.issuer !== SYSTEMADMIN_GITHUB_OIDC_ISSUER || !value.jwks_uri?.startsWith('https://')) {
    fail('OIDC-Discovery entspricht nicht dem erwarteten GitHub-Issuer.');
  }
  cachedDiscovery = { value, expiresAt: nowMs + CACHE_TTL_MS };
  return value;
}

async function getJwks(uri: string, nowMs: number, force = false): Promise<JwksDocument> {
  if (!force && cachedJwks && cachedJwks.uri === uri && cachedJwks.expiresAt > nowMs) {
    return cachedJwks.value;
  }
  const value = await fetchJson<JwksDocument>(uri);
  if (!Array.isArray(value.keys) || value.keys.length === 0) fail('GitHub JWKS enthält keine Schlüssel.');
  cachedJwks = { uri, value, expiresAt: nowMs + CACHE_TTL_MS };
  return value;
}

function audienceContains(aud: string | string[] | undefined, expected: string): boolean {
  return typeof aud === 'string' ? aud === expected : Array.isArray(aud) && aud.includes(expected);
}

function requireString(claims: RawClaims, key: keyof RawClaims): string {
  const value = claims[key];
  if (typeof value !== 'string' || !value.trim()) fail(`OIDC-Claim ${String(key)} fehlt.`);
  return value;
}

function subjectMatchesRepository(subject: string): boolean {
  return subject.startsWith(`repo:${SYSTEMADMIN_GITHUB_REPOSITORY}:`)
    || subject.startsWith(
      `repo:${SYSTEMADMIN_GITHUB_OWNER}@${SYSTEMADMIN_GITHUB_OWNER_ID}/Finance@${SYSTEMADMIN_GITHUB_REPOSITORY_ID}:`,
    );
}

function validateClaims(claims: RawClaims, nowSeconds: number): VerifiedGitHubActionsIdentity {
  if (claims.iss !== SYSTEMADMIN_GITHUB_OIDC_ISSUER) fail('OIDC issuer ist nicht GitHub Actions.');
  if (!audienceContains(claims.aud, SYSTEMADMIN_GITHUB_OIDC_AUDIENCE)) fail('OIDC audience ist nicht freigegeben.');

  if (typeof claims.exp !== 'number' || claims.exp < nowSeconds - CLOCK_SKEW_SECONDS) {
    fail('OIDC token ist abgelaufen.');
  }
  if (typeof claims.iat !== 'number' || claims.iat > nowSeconds + CLOCK_SKEW_SECONDS) {
    fail('OIDC iat ist ungültig.');
  }
  if (typeof claims.nbf === 'number' && claims.nbf > nowSeconds + CLOCK_SKEW_SECONDS) {
    fail('OIDC token ist noch nicht gültig.');
  }

  const subject = requireString(claims, 'sub');
  if (!subjectMatchesRepository(subject)) fail('OIDC subject liegt außerhalb des Finance-Repositories.');

  const actor = requireString(claims, 'actor');
  const repository = requireString(claims, 'repository');
  const repositoryId = requireString(claims, 'repository_id');
  const repositoryOwnerId = requireString(claims, 'repository_owner_id');
  const eventName = requireString(claims, 'event_name');
  const ref = requireString(claims, 'ref');
  const sha = requireString(claims, 'sha');
  const workflow = requireString(claims, 'workflow');
  const workflowRef = requireString(claims, 'workflow_ref');
  const workflowSha = requireString(claims, 'workflow_sha');
  const runId = requireString(claims, 'run_id');

  if (actor !== SYSTEMADMIN_GITHUB_OWNER) fail('OIDC actor ist nicht der kanonische Owner.');
  if (claims.actor_id && claims.actor_id !== SYSTEMADMIN_GITHUB_OWNER_ID) fail('OIDC actor_id ist nicht der kanonische Owner.');
  if (repository !== SYSTEMADMIN_GITHUB_REPOSITORY) fail('OIDC repository ist nicht Finance.');
  if (repositoryId !== SYSTEMADMIN_GITHUB_REPOSITORY_ID) fail('OIDC repository_id ist nicht Finance.');
  if (repositoryOwnerId !== SYSTEMADMIN_GITHUB_OWNER_ID) fail('OIDC repository_owner_id ist nicht der kanonische Owner.');
  if (eventName !== 'issues') fail('Nur ein issues-Execution-Host darf den Broker aufrufen.');
  if (ref !== 'refs/heads/main') fail('Execution Host muss aus main laufen.');
  if (!ALLOWED_WORKFLOW_REF_SET.has(workflowRef)) {
    fail('OIDC workflow_ref ist kein freigegebener Systemadmin Execution Host.');
  }

  return Object.freeze({
    issuer: claims.iss,
    audience: SYSTEMADMIN_GITHUB_OIDC_AUDIENCE,
    subject,
    actor,
    ...(claims.actor_id ? { actorId: claims.actor_id } : {}),
    repository,
    repositoryId,
    repositoryOwnerId,
    eventName,
    ref,
    sha,
    workflow,
    workflowRef,
    workflowSha,
    runId,
    ...(claims.run_number ? { runNumber: claims.run_number } : {}),
    ...(claims.run_attempt ? { runAttempt: claims.run_attempt } : {}),
    issuedAt: claims.iat,
    expiresAt: claims.exp,
  });
}

async function findSigningKey(kid: string, uri: string, nowMs: number): Promise<JsonWebKey> {
  let jwks = await getJwks(uri, nowMs);
  let key = jwks.keys.find(candidate => candidate.kid === kid && (!candidate.alg || candidate.alg === 'RS256'));
  if (!key) {
    jwks = await getJwks(uri, nowMs, true);
    key = jwks.keys.find(candidate => candidate.kid === kid && (!candidate.alg || candidate.alg === 'RS256'));
  }
  if (!key) fail('OIDC signing key ist unbekannt.');
  return key;
}

export async function verifyGitHubActionsOidcToken(
  token: string,
  now: Date = new Date(),
): Promise<VerifiedGitHubActionsIdentity> {
  const clean = token?.trim();
  if (!clean) fail('Bearer OIDC token fehlt.');
  const segments = clean.split('.');
  if (segments.length !== 3) fail('OIDC token hat kein JWT-Format.');

  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  const header = decodeBase64UrlJson<JwtHeader>(encodedHeader!, 'JWT header');
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    fail('Nur GitHub RS256 JWTs mit kid sind zulässig.');
  }

  const nowMs = now.getTime();
  const discovery = await getDiscovery(nowMs);
  const jwk = await findSigningKey(header.kid, discovery.jwks_uri, nowMs);
  let key;
  try {
    key = createPublicKey({ key: jwk, format: 'jwk' });
  } catch {
    return fail('OIDC signing key konnte nicht importiert werden.');
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = Buffer.from(encodedSignature!, 'base64url');
  if (!verifySignature('RSA-SHA256', Buffer.from(signingInput), key, signature)) {
    fail('OIDC JWT-Signatur ist ungültig.');
  }

  const claims = decodeBase64UrlJson<RawClaims>(encodedPayload!, 'JWT payload');
  return validateClaims(claims, Math.floor(nowMs / 1000));
}

export function resetGitHubActionsOidcCacheForTests(): void {
  cachedDiscovery = null;
  cachedJwks = null;
}

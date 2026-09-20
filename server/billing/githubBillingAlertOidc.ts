import { createPublicKey, verify as verifySignature, type JsonWebKey } from 'node:crypto';
import {
  SYSTEMADMIN_GITHUB_OIDC_ISSUER,
  SYSTEMADMIN_GITHUB_REPOSITORY,
  SYSTEMADMIN_GITHUB_REPOSITORY_ID,
  SYSTEMADMIN_GITHUB_REPOSITORY_OWNER,
  SYSTEMADMIN_GITHUB_REPOSITORY_OWNER_ID,
  SYSTEMADMIN_GITHUB_ACTOR,
  SYSTEMADMIN_GITHUB_ACTOR_ID,
} from '../systemadmin/githubActionsOidc';

export const GITHUB_BILLING_ALERT_OIDC_AUDIENCE = 'capital-ai-github-billing-alert';
export const GITHUB_BILLING_ALERT_WORKFLOW_REF =
  'capital-ai-online/Finance/.github/workflows/github-cost-watch.yml@refs/heads/main';

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
  workflow_ref?: string;
  workflow_sha?: string;
  run_id?: string;
}

export interface VerifiedGitHubBillingAlertIdentity {
  actor: string;
  eventName: 'schedule' | 'workflow_dispatch';
  repository: string;
  sha: string;
  workflowRef: string;
  workflowSha: string;
  runId: string;
}

let cachedDiscovery: { value: OidcDiscovery; expiresAt: number } | null = null;
let cachedJwks: { uri: string; value: JwksDocument; expiresAt: number } | null = null;

function fail(message: string): never {
  throw new Error(`[GitHubBillingAlertOIDC][SECURITY] ${message}`);
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

export function githubBillingAlertSubjectMatchesCanonicalRepository(subject: string): boolean {
  return subject.startsWith(`repo:${SYSTEMADMIN_GITHUB_REPOSITORY}:`)
    || subject.startsWith(
      `repo:${SYSTEMADMIN_GITHUB_REPOSITORY_OWNER}@${SYSTEMADMIN_GITHUB_REPOSITORY_OWNER_ID}/Finance@${SYSTEMADMIN_GITHUB_REPOSITORY_ID}:`,
    );
}

function validateClaims(claims: RawClaims, nowSeconds: number): VerifiedGitHubBillingAlertIdentity {
  if (claims.iss !== SYSTEMADMIN_GITHUB_OIDC_ISSUER) fail('OIDC issuer ist nicht GitHub Actions.');
  if (!audienceContains(claims.aud, GITHUB_BILLING_ALERT_OIDC_AUDIENCE)) fail('OIDC audience ist nicht freigegeben.');
  if (typeof claims.exp !== 'number' || claims.exp < nowSeconds - CLOCK_SKEW_SECONDS) fail('OIDC token ist abgelaufen.');
  if (typeof claims.iat !== 'number' || claims.iat > nowSeconds + CLOCK_SKEW_SECONDS) fail('OIDC iat ist ungültig.');
  if (typeof claims.nbf === 'number' && claims.nbf > nowSeconds + CLOCK_SKEW_SECONDS) fail('OIDC token ist noch nicht gültig.');

  const subject = requireString(claims, 'sub');
  const repository = requireString(claims, 'repository');
  const repositoryId = requireString(claims, 'repository_id');
  const repositoryOwnerId = requireString(claims, 'repository_owner_id');
  const actor = requireString(claims, 'actor');
  const eventName = requireString(claims, 'event_name');
  const ref = requireString(claims, 'ref');
  const sha = requireString(claims, 'sha');
  const workflowRef = requireString(claims, 'workflow_ref');
  const workflowSha = requireString(claims, 'workflow_sha');
  const runId = requireString(claims, 'run_id');

  if (!githubBillingAlertSubjectMatchesCanonicalRepository(subject)) fail('OIDC subject liegt außerhalb von Finance.');
  if (repository !== SYSTEMADMIN_GITHUB_REPOSITORY) fail('OIDC repository ist nicht Finance.');
  if (repositoryId !== SYSTEMADMIN_GITHUB_REPOSITORY_ID) fail('OIDC repository_id ist nicht Finance.');
  if (repositoryOwnerId !== SYSTEMADMIN_GITHUB_REPOSITORY_OWNER_ID) fail('OIDC repository_owner_id ist nicht kanonisch.');
  if (ref !== 'refs/heads/main') fail('Billing Cost Watch muss aus main laufen.');
  if (workflowRef !== GITHUB_BILLING_ALERT_WORKFLOW_REF) fail('OIDC workflow_ref ist nicht der Billing Cost Watch.');
  if (eventName !== 'schedule' && eventName !== 'workflow_dispatch') fail('OIDC event_name ist nicht zugelassen.');

  if (eventName === 'workflow_dispatch') {
    if (actor !== SYSTEMADMIN_GITHUB_ACTOR) fail('Manueller Billing-Test wurde nicht vom Owner gestartet.');
    if (claims.actor_id && claims.actor_id !== SYSTEMADMIN_GITHUB_ACTOR_ID) fail('OIDC actor_id ist nicht der Owner.');
  }

  return Object.freeze({
    actor,
    eventName,
    repository,
    sha,
    workflowRef,
    workflowSha,
    runId,
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

export async function verifyGitHubBillingAlertOidcToken(
  token: string,
  now: Date = new Date(),
): Promise<VerifiedGitHubBillingAlertIdentity> {
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

export function resetGitHubBillingAlertOidcCacheForTests(): void {
  cachedDiscovery = null;
  cachedJwks = null;
}

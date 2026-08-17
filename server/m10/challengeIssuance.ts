// M10 (ADR-0066, ESS-0022) Phase 2 — Challenge Issuance.
//
// Server creates a cryptographically random, short-lived, single-use WebAuthn challenge bound to
// the exact authorization context that Phase 1 (server/m10/githubPrStateResolver.ts) resolved.
// This module never accepts a PR-state context from its caller - it always calls
// resolveTrustedPrState() itself, so a challenge can only ever be issued against a freshly
// re-verified GitHub state, never a caller-fabricated one.
//
// Scope of this module (matching the runbook's phased sequencing): challenge creation and its
// persisted-state contract only. It does not verify a WebAuthn assertion (Phase 4) and does not
// consume a challenge for CI (Phase 5) - `markConsumed`/`revoke` exist on the store interface
// because the runbook requires the persisted metadata to already support "unused/consumed/revoked
// state", not because this module drives those transitions itself. Not wired into any HTTP route.
import { generateOpaqueToken, hashOpaqueToken } from '../../src/platform/Security/secretCrypto';
import { resolveTrustedPrState, type GithubApiFetch } from './githubPrStateResolver';

/**
 * Short-lived by design: a WebAuthn ceremony is a few seconds of user interaction with an already
 * physically present authenticator, unlike the 5-minute TOTP step-up window (src/platform/Security/
 * authMiddleware.ts) which allows time to read and type a rotating code. A shorter window narrows
 * the replay/interception surface for a challenge that is, by protocol design, sent to the browser.
 */
export const M10_CHALLENGE_TTL_MS = 2 * 60 * 1000;

export interface M10ChallengeContext {
  ownerId: string;
  repository: string;
  prNumber: number;
  baseBranch: string;
  baseSha: string;
  headSha: string;
  canonicalChangedFileSetHash: string;
  canonicalDiffReviewDigest: string;
  action: 'AUTHORIZE_PR_CI';
}

export interface M10Challenge {
  challengeId: string;
  /**
   * The raw WebAuthn challenge bytes (base64url), passed to navigator.credentials.get() in the
   * browser. Unlike a step-up token, this is not a bearer secret - WebAuthn's security rests on
   * the authenticator's private key, not on challenge confidentiality, so storing it in clear
   * server-side (as every WebAuthn library does) is correct, not an oversight.
   */
  challenge: string;
  context: Readonly<M10ChallengeContext>;
  issuedAt: string;
  expiresAt: string;
}

export type M10ChallengeState = 'UNUSED' | 'CONSUMED' | 'REVOKED';

export interface StoredM10ChallengeRecord {
  challenge: Readonly<M10Challenge>;
  state: M10ChallengeState;
}

/**
 * Persistence is deliberately abstracted behind this interface rather than committed to a specific
 * backend in this phase - matching the Break-Glass precedent (docs/evidence/m9/
 * M9_BREAK_GLASS_LIVE_WIRING_2026-08-16.md §2) of not making a production schema decision inside a
 * logic-only implementation step. `markConsumed`/`revoke` MUST be atomic (single winner) once a
 * real backend is chosen, exactly like requireStepUp()'s `UPDATE ... WHERE used_at IS NULL` pattern.
 */
export interface M10ChallengeStore {
  save(record: Readonly<StoredM10ChallengeRecord>): Promise<void>;
  get(challengeId: string): Promise<Readonly<StoredM10ChallengeRecord> | null>;
  /** Atomically transitions UNUSED -> CONSUMED. Returns false if not found or not UNUSED. */
  markConsumed(challengeId: string): Promise<boolean>;
  /** Atomically transitions UNUSED -> REVOKED. Returns false if not found or not UNUSED. */
  revoke(challengeId: string): Promise<boolean>;
}

export type ChallengeIssuanceResult =
  | { verdict: 'ISSUED'; challenge: Readonly<M10Challenge> }
  | { verdict: 'DENY'; reason: string };

function nowMs(value: string | number | Date | undefined): number {
  if (value === undefined) return Date.now();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return Date.parse(value);
}

export interface IssueM10ChallengeDeps {
  githubApiFetch: GithubApiFetch;
  store: M10ChallengeStore;
  now?: string | number | Date;
}

/**
 * Resolves the exact current PR state (Phase 1) and, only if that succeeds, mints a fresh
 * cryptographically random challenge bound to it. DENY (never throws) propagates verbatim from
 * Phase 1 on any GitHub anomaly - a challenge is never issued against unresolved/stale state.
 */
export async function issueM10Challenge(
  request: Readonly<{ repository: string; prNumber: number }>,
  deps: Readonly<IssueM10ChallengeDeps>,
): Promise<ChallengeIssuanceResult> {
  const resolved = await resolveTrustedPrState(request, { githubApiFetch: deps.githubApiFetch });
  if (resolved.verdict === 'DENY') return { verdict: 'DENY', reason: resolved.reason };

  const issuedAtMs = nowMs(deps.now);
  if (!Number.isFinite(issuedAtMs)) return { verdict: 'DENY', reason: 'Ungültiger Ausstellungszeitpunkt.' };
  const expiresAtMs = issuedAtMs + M10_CHALLENGE_TTL_MS;

  const challenge: M10Challenge = {
    challengeId: generateOpaqueToken(16),
    challenge: generateOpaqueToken(32),
    context: {
      ownerId: resolved.state.ownerId,
      repository: resolved.state.repository,
      prNumber: resolved.state.prNumber,
      baseBranch: resolved.state.baseBranch,
      baseSha: resolved.state.baseSha,
      headSha: resolved.state.headSha,
      canonicalChangedFileSetHash: resolved.state.canonicalChangedFileSetHash,
      canonicalDiffReviewDigest: resolved.state.canonicalDiffReviewDigest,
      action: resolved.state.action,
    },
    issuedAt: new Date(issuedAtMs).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
  };

  await deps.store.save({ challenge, state: 'UNUSED' });

  return { verdict: 'ISSUED', challenge };
}

/**
 * Pure validity check - active strictly within [issuedAt, expiresAt) and only while UNUSED. Mirrors
 * isBreakGlassMandateActive()'s shape (src/platform/Security/breakGlass.ts) for the same reason:
 * revocation/consumption always wins over an otherwise-unexpired window.
 */
export function isM10ChallengeValidForUse(
  record: Readonly<Pick<StoredM10ChallengeRecord, 'state'> & { challenge: Readonly<Pick<M10Challenge, 'issuedAt' | 'expiresAt'>> }>,
  now?: string | number | Date,
): boolean {
  if (record.state !== 'UNUSED') return false;
  const currentMs = nowMs(now);
  if (!Number.isFinite(currentMs)) return false;
  return currentMs >= Date.parse(record.challenge.issuedAt) && currentMs < Date.parse(record.challenge.expiresAt);
}

/**
 * ADR-0066 §3's recommended canonical digest:
 * SHA-256(repo || prNumber || baseSha || headSha || changedFileSetHash || diffDigest || action || challengeId).
 * This is authorization context for audit/verification (Phase 4), not a replacement for the
 * WebAuthn challenge itself - exposed here because Phase 2 is where the inputs it binds first come
 * together, but it has no consumer within this module.
 */
export function computeCanonicalAuthorizationDigest(challenge: Readonly<M10Challenge>): string {
  const { context } = challenge;
  const parts = [
    context.repository,
    String(context.prNumber),
    context.baseSha,
    context.headSha,
    context.canonicalChangedFileSetHash,
    context.canonicalDiffReviewDigest,
    context.action,
    challenge.challengeId,
  ];
  return hashOpaqueToken(parts.join('|'));
}

/**
 * Reference in-memory M10ChallengeStore - single-instance-appropriate (this Render deployment is
 * documented elsewhere, src/platform/Security/rateLimiter.ts, as single-instance) and intentionally
 * not a production persistence decision. Exists so Phase 2 is independently testable and so a
 * future live-wiring step has a working default to reach for, exactly mirroring
 * server/systemadmin/breakGlassRouter.ts's `activeMandates` Map. NOT exported from any route.
 */
export function createInMemoryM10ChallengeStore(): M10ChallengeStore {
  const records = new Map<string, StoredM10ChallengeRecord>();
  return {
    async save(record) {
      records.set(record.challenge.challengeId, record);
    },
    async get(challengeId) {
      return records.get(challengeId) ?? null;
    },
    async markConsumed(challengeId) {
      const existing = records.get(challengeId);
      if (!existing || existing.state !== 'UNUSED') return false;
      records.set(challengeId, { ...existing, state: 'CONSUMED' });
      return true;
    },
    async revoke(challengeId) {
      const existing = records.get(challengeId);
      if (!existing || existing.state !== 'UNUSED') return false;
      records.set(challengeId, { ...existing, state: 'REVOKED' });
      return true;
    },
  };
}

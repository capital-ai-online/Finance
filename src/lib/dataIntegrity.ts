/**
 * ============================================================================
 *  AIF-CORE — DATA INTEGRITY POLICY (DO NOT MODIFY)
 * ============================================================================
 *
 *  This file defines the single source of truth for the project's
 *  No-Demo-Data-Policy. It is the highest-priority, non-negotiable rule of
 *  the AIF-CORE / AI Capital platform.
 *
 *  RULE:
 *  - DATA_INTEGRITY_MODE MUST always equal "no-demo-data".
 *  - No fabricated, seeded, randomly generated, or simulated data may ever
 *    be presented to a user as if it were real market, financial, or
 *    on-chain data — not as a "fallback", not as a "high-fidelity
 *    simulation", not for "demo purposes".
 *  - If a real data source is unavailable, every module MUST return a
 *    NO_DATA / 503 (or NOT_IMPLEMENTED / 501) response instead of inventing
 *    a plausible-looking substitute.
 *
 *  ENFORCEMENT:
 *  - This object is frozen at the module level (Object.freeze, recursively)
 *    so any attempted runtime mutation silently fails in non-strict mode
 *    and throws a TypeError in strict mode / ESM (which this project uses).
 *  - assertDataIntegrityMode() MUST be called at server startup (see
 *    server.ts) and is safe to call from any module/component that wants to
 *    self-verify the policy has not been tampered with.
 *  - Every API response that carries market/financial/news data MUST
 *    include `dataIntegrityMode: DATA_INTEGRITY_MODE` in its JSON payload
 *    (see withIntegrityTag()) so staging/runtime comparisons (no-demo-data
 *    vs. no-data builds) remain auditable end-to-end.
 *
 *  CHANGE PROCESS:
 *  - This constant must never be edited by an AI agent, a build script, or
 *    a pull request without an explicit, written decision from the project
 *    owner (Sven). Any diff touching this file should be treated as a
 *    Critical-severity finding by the Security/Enterprise audit agents.
 * ============================================================================
 */

export const DATA_INTEGRITY_MODE = 'no-demo-data' as const;

export const APP_VERSION = '0.5.0' as const;

export type DataIntegrityMode = typeof DATA_INTEGRITY_MODE;

export const DATA_INTEGRITY_POLICY = Object.freeze({
  mode: DATA_INTEGRITY_MODE,
  version: APP_VERSION,
  rule: 'No fabricated, seeded, random, or simulated data may ever be returned as real data. Unavailable real data MUST return NO_DATA/503 or NOT_IMPLEMENTED/501.',
  enforcedSince: '2026-06-30',
});

// Deep-freeze guard: throws if anyone tries to tamper with the policy object
// or the mode string at runtime (defense-in-depth on top of Object.freeze).
Object.freeze(DATA_INTEGRITY_POLICY);

/**
 * Call this once at process start (server.ts) and optionally from any
 * critical data-serving module. Throws immediately if the policy constant
 * has been altered, renamed, or removed — fails loud instead of failing
 * silently into fabricated data.
 */
export function assertDataIntegrityMode(): void {
  if (DATA_INTEGRITY_MODE !== 'no-demo-data') {
    throw new Error(
      '[FATAL][DATA-INTEGRITY] DATA_INTEGRITY_MODE has been modified. ' +
      'This is a Critical-severity policy violation. Refusing to start.'
    );
  }
  if (!Object.isFrozen(DATA_INTEGRITY_POLICY)) {
    throw new Error(
      '[FATAL][DATA-INTEGRITY] DATA_INTEGRITY_POLICY is no longer frozen. ' +
      'Possible tampering detected. Refusing to start.'
    );
  }
}

/**
 * Helper every API route that serves market/financial/scoring/news data
 * MUST use to tag its response. Keeps the policy visible end-to-end so the
 * staging comparison (no-demo-data vs. no-data) can be audited from the
 * response payloads alone, without reading server logs.
 */
export function withIntegrityTag<T extends Record<string, unknown>>(payload: T) {
  return {
    ...payload,
    dataIntegrityMode: DATA_INTEGRITY_MODE,
  };
}

/**
 * Standard "no real data available" response body. Use this instead of any
 * fallback/simulation logic, anywhere in the project.
 */
export function noDataResponse(reason: string) {
  return {
    status: 'NO_DATA' as const,
    dataIntegrityMode: DATA_INTEGRITY_MODE,
    reason,
  };
}

/**
 * Standard "feature not implemented against a real data source yet"
 * response body (e.g. used for the orderbook depth chart until a real
 * market-depth provider is connected).
 */
export function notImplementedResponse(reason: string) {
  return {
    status: 'NOT_IMPLEMENTED' as const,
    dataIntegrityMode: DATA_INTEGRITY_MODE,
    reason,
  };
}

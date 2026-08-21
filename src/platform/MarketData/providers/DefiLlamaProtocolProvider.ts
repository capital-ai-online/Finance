/**
 * ADR-0100 — DeFiLlama free-tier DeFi protocol evidence provider.
 *
 * Not a `MarketDataProvider`: DeFiLlama's TVL/fees/revenue are protocol-keyed, not the
 * per-symbol spot-price snapshot shape `MarketDataGateway` routes. This class instead reuses
 * the same SC-4 primitives (`CircuitBreaker`, `RateLimitBudget`) directly, keyed by the
 * `defillama` `ProviderMatrix` entry, plus an endpoint-specific TTL cache in the same style as
 * the legacy non-gateway providers (e.g. `server/fmpIndices.ts`).
 *
 * Free tier only: `https://api.llama.fi`, no API key, ever. Pro (`pro-api.llama.fi`) is out of
 * scope until a separately approved secret-management concept exists (ADR-0100 §Pro-Upgrade).
 *
 * Zero-interpolation: missing/invalid/negative/non-finite values are never coerced to zero or a
 * cached "fresh" value past the staleness ceiling. They stay `null` with an explicit reason.
 */

import { CircuitBreaker } from '../CircuitBreaker';
import { RateLimitBudget } from '../RateLimitBudget';
import { getProviderMatrixEntry } from '../ProviderMatrix';
import { recordProviderHealth } from '../../Supervisor/providerHealth';

export const DEFILLAMA_PROVIDER_ID = 'defillama' as const;
export const DEFILLAMA_FREE_BASE_URL = 'https://api.llama.fi' as const;
export const DEFILLAMA_EVIDENCE_CONTRACT_VERSION = 'defillama-protocol-evidence/1.0.0' as const;

const PROTOCOL_TVL_CACHE_TTL_MS = 5 * 60_000;
const FEES_OVERVIEW_CACHE_TTL_MS = 15 * 60_000;
/** Hard ceiling for serving a last-known-good cache entry past its TTL. Beyond this, NOT_AVAILABLE. */
const MAX_STALE_SERVE_MS = 6 * 60 * 60_000;

export type DefiLlamaEvidenceStatus = 'VERIFIED' | 'STALE' | 'NOT_AVAILABLE' | 'INVALID';
export type DefiLlamaCacheMode = 'fresh' | 'cache-hit' | 'last-known-good';

export interface DefiLlamaProtocolTvlResult {
  contractVersion: typeof DEFILLAMA_EVIDENCE_CONTRACT_VERSION;
  status: DefiLlamaEvidenceStatus;
  slug: string;
  tvlUsd: number | null;
  observedAt: string | null;
  retrievedAt: string;
  evidenceId: string | null;
  cacheMode: DefiLlamaCacheMode;
  reason?: string;
}

export interface DefiLlamaFeesResult {
  contractVersion: typeof DEFILLAMA_EVIDENCE_CONTRACT_VERSION;
  status: DefiLlamaEvidenceStatus;
  slug: string;
  feesUsd24h: number | null;
  revenueUsd24h: number | null;
  observedAt: string | null;
  retrievedAt: string;
  evidenceId: string | null;
  cacheMode: DefiLlamaCacheMode;
  reason?: string;
}

export interface DefiLlamaProtocolProviderOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  nowMs?: () => number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  maxAttempts?: number;
  baseUrl?: string;
}

interface CacheEntry {
  data: unknown;
  expiresAtMs: number;
  cachedAtMs: number;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function finiteNonNegative(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

/** Reads the P0-10 kill switch. Unset/empty defaults to enabled; only the literal string 'false' disables it. */
export function isDefiLlamaProviderEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.DEFILLAMA_PROVIDER_ENABLED !== 'false';
}

export class DefiLlamaProtocolProvider {
  readonly id = DEFILLAMA_PROVIDER_ID;

  private readonly baseUrl: string;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly circuitBreaker: CircuitBreaker;
  private readonly rateLimitBudget: RateLimitBudget;
  private readonly nowMsFn: () => number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly random: () => number;
  private readonly maxAttempts: number;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: DefiLlamaProtocolProviderOptions = {}) {
    const matrixEntry = getProviderMatrixEntry(DEFILLAMA_PROVIDER_ID);
    this.baseUrl = options.baseUrl ?? DEFILLAMA_FREE_BASE_URL;
    this.nowMsFn = options.nowMs ?? Date.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.random = options.random ?? Math.random;
    this.maxAttempts = Math.max(1, options.maxAttempts ?? 2);
    this.timeoutMs = options.timeoutMs ?? 8_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: matrixEntry?.circuitBreaker.failureThreshold ?? 3,
      cooldownMs: matrixEntry?.circuitBreaker.cooldownMs ?? 60_000,
      nowMs: this.nowMsFn,
    });
    this.rateLimitBudget = new RateLimitBudget({
      capacity: matrixEntry?.rateLimit.capacity ?? 30,
      windowMs: matrixEntry?.rateLimit.windowMs ?? 60_000,
      nowMs: this.nowMsFn,
    });
  }

  async getProtocolTvl(slug: string): Promise<DefiLlamaProtocolTvlResult> {
    const retrievedAt = new Date(this.nowMsFn()).toISOString();
    const base = {
      contractVersion: DEFILLAMA_EVIDENCE_CONTRACT_VERSION as typeof DEFILLAMA_EVIDENCE_CONTRACT_VERSION,
      slug,
      retrievedAt,
    };

    if (!slug) {
      return { ...base, status: 'NOT_AVAILABLE', tvlUsd: null, observedAt: null, evidenceId: null, cacheMode: 'fresh', reason: 'No DeFiLlama slug supplied.' };
    }

    const fetched = await this.requestJson(`/protocol/${encodeURIComponent(slug)}`, `protocol-tvl:${slug}`, PROTOCOL_TVL_CACHE_TTL_MS);

    if (fetched.data === null) {
      return { ...base, status: 'NOT_AVAILABLE', tvlUsd: null, observedAt: null, evidenceId: null, cacheMode: fetched.cacheMode, reason: fetched.reason };
    }

    const payload = fetched.data as Record<string, unknown>;
    const tvlSeries = Array.isArray(payload.tvl) ? payload.tvl : null;
    if (!tvlSeries || tvlSeries.length === 0) {
      return { ...base, status: 'INVALID', tvlUsd: null, observedAt: null, evidenceId: null, cacheMode: fetched.cacheMode, reason: 'DeFiLlama protocol response has no tvl series.' };
    }

    const latest = tvlSeries[tvlSeries.length - 1] as Record<string, unknown>;
    const tvlUsd = finiteNonNegative(latest?.totalLiquidityUSD);
    const dateSeconds = typeof latest?.date === 'number' && Number.isFinite(latest.date) ? latest.date : null;
    if (tvlUsd === null || dateSeconds === null) {
      return { ...base, status: 'INVALID', tvlUsd: null, observedAt: null, evidenceId: null, cacheMode: fetched.cacheMode, reason: 'DeFiLlama protocol response has a non-finite or negative TVL/date value.' };
    }

    const observedAt = new Date(dateSeconds * 1000).toISOString();
    return {
      ...base,
      status: fetched.cacheMode === 'last-known-good' ? 'STALE' : 'VERIFIED',
      tvlUsd,
      observedAt,
      evidenceId: `defillama:protocol-tvl:${slug}:${observedAt}`,
      cacheMode: fetched.cacheMode,
    };
  }

  async getFeesAndRevenue(slug: string): Promise<DefiLlamaFeesResult> {
    const retrievedAt = new Date(this.nowMsFn()).toISOString();
    const base = {
      contractVersion: DEFILLAMA_EVIDENCE_CONTRACT_VERSION as typeof DEFILLAMA_EVIDENCE_CONTRACT_VERSION,
      slug,
      retrievedAt,
    };

    if (!slug) {
      return { ...base, status: 'NOT_AVAILABLE', feesUsd24h: null, revenueUsd24h: null, observedAt: null, evidenceId: null, cacheMode: 'fresh', reason: 'No DeFiLlama slug supplied.' };
    }

    const fetched = await this.requestJson('/overview/fees', 'overview-fees', FEES_OVERVIEW_CACHE_TTL_MS);

    if (fetched.data === null) {
      return { ...base, status: 'NOT_AVAILABLE', feesUsd24h: null, revenueUsd24h: null, observedAt: null, evidenceId: null, cacheMode: fetched.cacheMode, reason: fetched.reason };
    }

    const payload = fetched.data as Record<string, unknown>;
    const protocols = Array.isArray(payload.protocols) ? (payload.protocols as Record<string, unknown>[]) : [];
    // Deterministic exact-slug match only (P1-08); no fuzzy/heuristic name matching.
    const matches = protocols.filter((entry) => String(entry?.slug ?? '').toLowerCase() === slug.toLowerCase());
    if (matches.length !== 1) {
      return {
        ...base,
        status: 'NOT_AVAILABLE',
        feesUsd24h: null,
        revenueUsd24h: null,
        observedAt: null,
        evidenceId: null,
        cacheMode: fetched.cacheMode,
        reason: matches.length === 0
          ? `No DeFiLlama fees/revenue entry for protocol slug ${slug}.`
          : `Ambiguous DeFiLlama fees/revenue match for protocol slug ${slug} (${matches.length} entries).`,
      };
    }

    const entry = matches[0];
    const feesUsd24h = finiteNonNegative(entry.total24h);
    const revenueUsd24h = finiteNonNegative(entry.dailyRevenue);
    if (feesUsd24h === null && revenueUsd24h === null) {
      return { ...base, status: 'INVALID', feesUsd24h: null, revenueUsd24h: null, observedAt: null, evidenceId: null, cacheMode: fetched.cacheMode, reason: `DeFiLlama fees overview has no finite fee/revenue value for ${slug}.` };
    }

    return {
      ...base,
      status: fetched.cacheMode === 'last-known-good' ? 'STALE' : 'VERIFIED',
      feesUsd24h,
      revenueUsd24h,
      observedAt: retrievedAt,
      evidenceId: `defillama:overview-fees:${slug}:${retrievedAt}`,
      cacheMode: fetched.cacheMode,
    };
  }

  private async requestJson(
    path: string,
    cacheKey: string,
    cacheTtlMs: number,
  ): Promise<{ data: unknown; cacheMode: DefiLlamaCacheMode; reason?: string }> {
    if (!isDefiLlamaProviderEnabled()) {
      return { data: null, cacheMode: 'fresh', reason: 'DeFiLlama provider disabled via DEFILLAMA_PROVIDER_ENABLED=false.' };
    }

    const now = this.nowMsFn();
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAtMs > now) {
      return { data: cached.data, cacheMode: 'cache-hit' };
    }

    if (!this.circuitBreaker.allow(DEFILLAMA_PROVIDER_ID)) {
      const reason = `DeFiLlama circuit open (cooldown until ${this.circuitBreaker.openedUntilIso(DEFILLAMA_PROVIDER_ID)}).`;
      recordProviderHealth({ provider: 'DeFiLlama', capability: 'defi-evidence', state: 'unavailable', message: reason, circuitOpenUntil: this.circuitBreaker.openedUntilIso(DEFILLAMA_PROVIDER_ID) });
      return this.lastKnownGoodOrUnavailable(cached, now, reason);
    }

    const rateLimit = this.rateLimitBudget.tryConsume(DEFILLAMA_PROVIDER_ID, 'fundamentals');
    if (!rateLimit.allowed) {
      const reason = `DeFiLlama rate limit exhausted (resets at ${new Date(rateLimit.resetAtMs).toISOString()}).`;
      recordProviderHealth({ provider: 'DeFiLlama', capability: 'defi-evidence', state: 'degraded', message: reason });
      return this.lastKnownGoodOrUnavailable(cached, now, reason);
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!response.ok) {
          if (response.status === 429) throw new Error(`DeFiLlama rate limited (HTTP 429) for ${path}.`);
          throw new Error(`DeFiLlama HTTP ${response.status} for ${path}.`);
        }
        let data: unknown;
        try {
          data = await response.json();
        } catch {
          throw new Error(`DeFiLlama returned invalid JSON for ${path}.`);
        }
        if (!data || typeof data !== 'object') {
          throw new Error(`DeFiLlama returned a non-object payload for ${path}.`);
        }

        this.circuitBreaker.success(DEFILLAMA_PROVIDER_ID);
        this.cache.set(cacheKey, { data, expiresAtMs: this.nowMsFn() + cacheTtlMs, cachedAtMs: this.nowMsFn() });
        recordProviderHealth({ provider: 'DeFiLlama', capability: 'defi-evidence', state: 'healthy', cacheMode: 'provider', message: `DeFiLlama ${path} received.` });
        return { data, cacheMode: 'fresh' };
      } catch (error) {
        lastError = error;
        if (attempt < this.maxAttempts) {
          const exponential = 200 * 2 ** (attempt - 1);
          const jitter = Math.floor(this.random() * 100);
          await this.sleep(exponential + jitter);
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    this.circuitBreaker.failure(DEFILLAMA_PROVIDER_ID);
    const reason = lastError instanceof Error ? lastError.message : String(lastError);
    recordProviderHealth({
      provider: 'DeFiLlama',
      capability: 'defi-evidence',
      state: 'unavailable',
      message: reason,
      circuitOpenUntil: this.circuitBreaker.openedUntilIso(DEFILLAMA_PROVIDER_ID),
    });
    return this.lastKnownGoodOrUnavailable(cached, now, reason);
  }

  private lastKnownGoodOrUnavailable(
    cached: CacheEntry | undefined,
    nowMs: number,
    reason: string,
  ): { data: unknown; cacheMode: DefiLlamaCacheMode; reason?: string } {
    if (cached && nowMs - cached.cachedAtMs <= MAX_STALE_SERVE_MS) {
      return { data: cached.data, cacheMode: 'last-known-good', reason };
    }
    return { data: null, cacheMode: 'fresh', reason };
  }
}

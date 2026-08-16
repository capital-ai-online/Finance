import { assessMarketDataSnapshot, withAssessedQuality } from './DataQualityService';
import { CircuitBreaker } from './CircuitBreaker';
import { MarketDataCache, marketDataRequestKey } from './MarketDataCache';
import { ProviderRegistry } from './ProviderRegistry';
import { ProviderRouter, type ProviderSkip } from './ProviderRouter';
import { RateLimitBudget } from './RateLimitBudget';
import { RequestCoalescer } from './RequestCoalescer';
import { rateLimitOverridesFromMatrix } from './ProviderMatrix';
import {
  MARKET_DATA_CONTRACT_VERSION,
  type CanonicalMarketDataSnapshot,
  type SnapshotRequest,
} from './contracts';
import { recordProviderHealth } from '../Supervisor/providerHealth';

export type MarketDataGatewaySource = 'provider' | 'cache';
export type MarketDataGatewayEvent =
  | 'request'
  | 'cache_hit'
  | 'coalesced'
  | 'provider_attempt'
  | 'provider_failure'
  | 'provider_success'
  | 'unavailable';

export interface MarketDataGatewayTelemetry {
  record(event: MarketDataGatewayEvent, attributes: Record<string, string | number | boolean>): void;
}

export interface MarketDataGatewayResult {
  snapshot: CanonicalMarketDataSnapshot;
  attemptedProviders: string[];
  skippedProviders: ProviderSkip[];
  source: MarketDataGatewaySource;
}

export interface MarketDataGatewayOptions {
  cache?: MarketDataCache;
  coalescer?: RequestCoalescer;
  rateLimitBudget?: RateLimitBudget;
  circuitBreaker?: CircuitBreaker;
  telemetry?: MarketDataGatewayTelemetry;
  cacheTtlMs?: number;
  nowMs?: () => number;
  /** When false, skip Supervisor health writes (tests). Default true. */
  recordHealth?: boolean;
}

const NOOP_TELEMETRY: MarketDataGatewayTelemetry = { record: () => undefined };

function forCorrelation(result: MarketDataGatewayResult, correlationId: string): MarketDataGatewayResult {
  return { ...result, snapshot: { ...result.snapshot, correlationId } };
}

function unavailable(
  request: SnapshotRequest,
  attemptedProviders: string[],
  skippedProviders: ProviderSkip[],
  reason: string,
  nowMs: number,
): MarketDataGatewayResult {
  const now = new Date(nowMs).toISOString();
  return {
    attemptedProviders,
    skippedProviders,
    source: 'provider',
    snapshot: {
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: attemptedProviders.at(-1) ?? 'none',
      providerFeed: null,
      symbol: request.symbol.toUpperCase().trim(),
      assetClass: request.assetClass,
      currency: null,
      sourceTimestamp: null,
      ingestedAt: now,
      receivedAt: now,
      freshnessMs: null,
      qualityState: 'UNAVAILABLE',
      isRealtime: false,
      isDelayed: false,
      correlationId: request.correlationId,
      price: null,
      evidenceId: null,
      reason,
    },
  };
}

export class MarketDataGateway {
  private readonly cache: MarketDataCache;
  private readonly coalescer: RequestCoalescer;
  private readonly router: ProviderRouter;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly telemetry: MarketDataGatewayTelemetry;
  private readonly cacheTtlMs: number;
  private readonly nowMs: () => number;
  private readonly recordHealth: boolean;

  constructor(private readonly registry: ProviderRegistry, options: MarketDataGatewayOptions = {}) {
    this.nowMs = options.nowMs ?? Date.now;
    this.cache = options.cache ?? new MarketDataCache({ nowMs: this.nowMs });
    this.coalescer = options.coalescer ?? new RequestCoalescer();
    this.circuitBreaker = options.circuitBreaker ?? new CircuitBreaker({ nowMs: this.nowMs });
    const rateLimitBudget =
      options.rateLimitBudget ??
      new RateLimitBudget({
        nowMs: this.nowMs,
        perProvider: rateLimitOverridesFromMatrix(),
      });
    this.router = new ProviderRouter(registry, rateLimitBudget, this.circuitBreaker);
    this.telemetry = options.telemetry ?? NOOP_TELEMETRY;
    this.cacheTtlMs = Math.max(0, options.cacheTtlMs ?? 30_000);
    this.recordHealth = options.recordHealth !== false;
  }

  async getSnapshot(request: SnapshotRequest): Promise<MarketDataGatewayResult> {
    this.telemetry.record('request', { assetClass: request.assetClass, capability: 'snapshot' });
    if (!request.symbol.trim() || !request.correlationId.trim()) {
      const result = unavailable(request, [], [], 'symbol and correlationId are required', this.nowMs());
      this.telemetry.record('unavailable', { reason: 'invalid_request' });
      return result;
    }

    const key = marketDataRequestKey(request);
    const cached = this.cache.get(key);
    if (cached) {
      const snapshot = this.assess(cached, request);
      const assessment = assessMarketDataSnapshot(snapshot, this.qualityOptions(request));
      if (assessment.accepted) {
        this.telemetry.record('cache_hit', { provider: snapshot.provider, qualityState: snapshot.qualityState });
        return { snapshot: { ...snapshot, correlationId: request.correlationId }, attemptedProviders: [], skippedProviders: [], source: 'cache' };
      }
      this.cache.delete(key);
    }

    const existing = this.coalescer.has(key);
    const result = await this.coalescer.run(key, () => this.fetchFromProviders(request, key));
    if (existing) this.telemetry.record('coalesced', { assetClass: request.assetClass, capability: 'snapshot' });
    return forCorrelation(result, request.correlationId);
  }

  private async fetchFromProviders(request: SnapshotRequest, key: string): Promise<MarketDataGatewayResult> {
    const candidates = this.router.candidates(request);
    if (candidates.length === 0) {
      const result = unavailable(request, [], [], 'No approved provider supports this request.', this.nowMs());
      this.telemetry.record('unavailable', { reason: 'no_approved_provider' });
      return result;
    }

    const attemptedProviders: string[] = [];
    const skippedProviders: ProviderSkip[] = [];
    for (const provider of candidates) {
      const providerId = provider.descriptor.id;
      const skipReason = this.router.tryAcquire(providerId);
      if (skipReason) {
        skippedProviders.push({ providerId, reason: skipReason });
        this.writeSkipHealth(providerId, skipReason);
        continue;
      }
      attemptedProviders.push(providerId);
      this.telemetry.record('provider_attempt', { provider: providerId, capability: 'snapshot' });
      try {
        const snapshot = this.assess(await provider.getSnapshot(request), request);
        const assessment = assessMarketDataSnapshot(snapshot, this.qualityOptions(request));
        if (assessment.accepted) {
          this.router.recordSuccess(providerId);
          this.cache.set(key, snapshot, this.cacheTtlMs);
          this.telemetry.record('provider_success', { provider: providerId, qualityState: snapshot.qualityState });
          this.writeOutcomeHealth(providerId, 'healthy', snapshot.qualityState);
          return { snapshot, attemptedProviders, skippedProviders, source: 'provider' };
        }
        this.router.recordFailure(providerId);
        this.telemetry.record('provider_failure', { provider: providerId, reason: assessment.state });
        this.writeOutcomeHealth(providerId, assessment.state === 'STALE' ? 'degraded' : 'unavailable', assessment.state);
      } catch {
        this.router.recordFailure(providerId);
        this.telemetry.record('provider_failure', { provider: providerId, reason: 'exception' });
        this.writeOutcomeHealth(providerId, 'unavailable', 'exception');
      }
    }

    const result = unavailable(
      request,
      attemptedProviders,
      skippedProviders,
      'All approved providers were unavailable or failed data-quality validation.',
      this.nowMs(),
    );
    this.telemetry.record('unavailable', { reason: 'all_providers_failed' });
    return result;
  }

  private writeSkipHealth(providerId: string, reason: ProviderSkip['reason']): void {
    if (!this.recordHealth) return;
    if (reason === 'rate_limit_budget_exhausted') {
      recordProviderHealth({
        provider: providerId,
        capability: 'snapshot',
        state: 'degraded',
        diagnosticCode: 'rate_limited',
        message: 'Rate-limit budget exhausted for provider (SC-4 matrix).',
      });
      return;
    }
    recordProviderHealth({
      provider: providerId,
      capability: 'snapshot',
      state: 'degraded',
      diagnosticCode: 'provider_error',
      circuitOpenUntil: this.circuitBreaker.openedUntilIso(providerId) ?? undefined,
      message: 'Circuit breaker open for provider (SC-4).',
    });
  }

  private writeOutcomeHealth(
    providerId: string,
    state: 'healthy' | 'degraded' | 'unavailable',
    detail: string,
  ): void {
    if (!this.recordHealth) return;
    recordProviderHealth({
      provider: providerId,
      capability: 'snapshot',
      state,
      diagnosticCode: state === 'healthy' ? 'healthy' : detail === 'STALE' ? 'stale' : 'provider_error',
      payloadUsable: state === 'healthy',
      circuitOpenUntil: this.circuitBreaker.openedUntilIso(providerId) ?? undefined,
      message: `MarketDataGateway snapshot outcome: ${detail}`,
    });
  }

  private assess(snapshot: CanonicalMarketDataSnapshot, request: SnapshotRequest): CanonicalMarketDataSnapshot {
    return withAssessedQuality(snapshot, this.qualityOptions(request));
  }

  private qualityOptions(request: SnapshotRequest): { nowMs: number; maxAgeMs?: number; allowStale?: boolean } {
    return { nowMs: this.nowMs(), maxAgeMs: request.maxAgeMs, allowStale: request.allowStale };
  }
}

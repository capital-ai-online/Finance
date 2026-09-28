import {
  dispatchCanonicalScore,
  type CryptoCanonicalScoringDispatchRequest,
  type CryptoCanonicalScoringDispatchResult,
} from '../../src/platform/Scoring';
import {
  MARKET_LIVE_CLIENT_CONTRACT_VERSION,
  isCanonicalMarketLiveScore,
  isVerifiedMarketLiveQuote,
  marketLiveClientTopic,
  type MarketLiveCanonicalScoreEvent,
  type MarketLiveVerifiedQuoteEvent,
} from '../../src/platform/MarketData/LiveClientFeedContract';
import {
  isMarketDataFanoutTick,
  type MarketDataFanoutTick,
} from '../../src/platform/MarketData/Fanout/contracts';
import type { MarketDataFanoutHub } from '../../src/platform/MarketData/Fanout/MarketDataFanoutHub';
import type { MarketDataAssetClass } from '../../src/platform/MarketData/contracts';
import {
  getCryptoSpotConsensus,
  type CryptoSpotConsensusOptions,
  type CryptoSpotConsensusResult,
} from '../../src/services/cryptoSpotConsensus';
import {
  fetchVerifiedTraditionalQuote,
  type TraditionalQuoteAssetClass,
  type VerifiedTraditionalQuote,
} from '../../src/services/traditionalQuoteEvidence';

export const LIVE_TIER4_PROJECTION_RUNTIME_VERSION = 'live-tier4-projection/1.0.0' as const;
export const DEFAULT_LIVE_QUOTE_MIN_INTERVAL_MS = 5_000 as const;
export const DEFAULT_LIVE_SCORE_MIN_INTERVAL_MS = 15_000 as const;

type CryptoConsensusReader = (
  symbol: string,
  options?: CryptoSpotConsensusOptions,
) => Promise<CryptoSpotConsensusResult>;

type TraditionalQuoteReader = (
  symbol: string,
  assetClass: TraditionalQuoteAssetClass,
) => Promise<VerifiedTraditionalQuote>;

type CryptoScoreDispatcher = (
  input: CryptoCanonicalScoringDispatchRequest,
) => Promise<CryptoCanonicalScoringDispatchResult>;

export type LiveTier4ProjectionKind = 'verified-quote' | 'canonical-score';
export type LiveTier4ProjectionStatus =
  | 'PROJECTED'
  | 'COALESCED'
  | 'DISABLED'
  | 'ENTITLEMENT_REQUIRED'
  | 'NOT_ELIGIBLE'
  | 'UNSUPPORTED'
  | 'FAILED';

export interface LiveTier4ProjectionOutcome {
  readonly kind: LiveTier4ProjectionKind;
  readonly status: LiveTier4ProjectionStatus;
  readonly assetId: string;
  readonly correlationId: string;
  readonly reason?: string;
  readonly latencyMs?: number;
}

export interface LiveTier4ProjectionMeasurement {
  readonly kind: LiveTier4ProjectionKind;
  readonly assetId: string;
  readonly correlationId: string;
  readonly status: LiveTier4ProjectionStatus;
  readonly latencyMs: number;
}

export interface LiveTier4ProjectionSignal {
  readonly symbol: string;
  readonly assetClass: MarketDataAssetClass;
  readonly correlationId: string;
}

export interface LiveTier4ProjectionRuntimeOptions {
  readonly fanoutHub: MarketDataFanoutHub;
  readonly enabled: boolean;
  readonly entitlementAttested: boolean;
  readonly nowMs?: () => number;
  readonly quoteMinIntervalMs?: number;
  readonly scoreMinIntervalMs?: number;
  readonly cryptoConsensusReader?: CryptoConsensusReader;
  readonly traditionalQuoteReader?: TraditionalQuoteReader;
  readonly cryptoScoreDispatcher?: CryptoScoreDispatcher;
  readonly onError?: (kind: LiveTier4ProjectionKind, error: unknown, signal: LiveTier4ProjectionSignal) => void;
  readonly onMeasurement?: (measurement: LiveTier4ProjectionMeasurement) => void;
}

function normalizedSymbol(value: string): string {
  return value.toUpperCase().trim();
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function positive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validTimestamp(value: unknown): value is string {
  return nonEmpty(value) && Number.isFinite(Date.parse(value));
}

function uniqueNonEmpty(values: readonly string[]): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}

function latestObservedAt(values: readonly string[]): string | null {
  const valid = values.filter(validTimestamp);
  if (valid.length === 0) return null;
  return [...valid].sort((left, right) => Date.parse(left) - Date.parse(right)).at(-1) ?? null;
}

function projectionAssetId(signal: LiveTier4ProjectionSignal): string {
  return `${signal.assetClass}:${normalizedSymbol(signal.symbol)}`;
}

function safeInterval(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && Number(value) >= 0 ? Math.floor(Number(value)) : fallback;
}

function eventIdentity(parts: readonly string[]): string {
  return parts.map(value => encodeURIComponent(value)).join('|');
}

function canonicalScoreHasRequiredLineage(
  dispatch: CryptoCanonicalScoringDispatchResult,
  assetId: string,
): boolean {
  if (dispatch.status !== 'DISPATCHED' || dispatch.canonical.status !== 'READY') return false;
  const integrity = dispatch.canonical.integrity;
  return integrity.status === 'READY'
    && integrity.assetId === assetId
    && integrity.providers.length > 0
    && integrity.evidence.length > 0
    && validTimestamp(integrity.retrievedAt)
    && nonEmpty(integrity.featureVersion)
    && nonEmpty(integrity.scoringVersion)
    && nonEmpty(integrity.dispatcherVersion)
    && nonEmpty(integrity.modelRegistryVersion)
    && nonEmpty(integrity.modelId)
    && nonEmpty(integrity.modelVersion)
    && nonEmpty(integrity.executorKey)
    && nonEmpty(integrity.resultContractVersion);
}

/**
 * FIN-TIER4 live projection runtime.
 *
 * Raw Tier-3 ticks are scheduling signals only. Their price/evidence payload is never copied into
 * a verified quote or scoring input. Quote truth is independently re-read from the existing quote/
 * consensus authorities, and score truth is independently recomputed through ScoringDispatcher.
 */
export class LiveTier4ProjectionRuntime {
  private readonly fanoutHub: MarketDataFanoutHub;
  private readonly enabled: boolean;
  private readonly entitlementAttested: boolean;
  private readonly nowMs: () => number;
  private readonly quoteMinIntervalMs: number;
  private readonly scoreMinIntervalMs: number;
  private readonly cryptoConsensusReader: CryptoConsensusReader;
  private readonly traditionalQuoteReader: TraditionalQuoteReader;
  private readonly cryptoScoreDispatcher: CryptoScoreDispatcher;
  private readonly onError?: LiveTier4ProjectionRuntimeOptions['onError'];
  private readonly onMeasurement?: LiveTier4ProjectionRuntimeOptions['onMeasurement'];
  private readonly quoteInFlight = new Map<string, Promise<LiveTier4ProjectionOutcome>>();
  private readonly scoreInFlight = new Map<string, Promise<LiveTier4ProjectionOutcome>>();
  private readonly quoteLastStartedAt = new Map<string, number>();
  private readonly scoreLastStartedAt = new Map<string, number>();

  constructor(options: LiveTier4ProjectionRuntimeOptions) {
    this.fanoutHub = options.fanoutHub;
    this.enabled = options.enabled;
    this.entitlementAttested = options.entitlementAttested;
    this.nowMs = options.nowMs ?? Date.now;
    this.quoteMinIntervalMs = safeInterval(options.quoteMinIntervalMs, DEFAULT_LIVE_QUOTE_MIN_INTERVAL_MS);
    this.scoreMinIntervalMs = safeInterval(options.scoreMinIntervalMs, DEFAULT_LIVE_SCORE_MIN_INTERVAL_MS);
    this.cryptoConsensusReader = options.cryptoConsensusReader ?? getCryptoSpotConsensus;
    this.traditionalQuoteReader = options.traditionalQuoteReader ?? fetchVerifiedTraditionalQuote;
    this.cryptoScoreDispatcher = options.cryptoScoreDispatcher
      ?? (input => dispatchCanonicalScore(input));
    this.onError = options.onError;
    this.onMeasurement = options.onMeasurement;
  }

  active(): boolean {
    return this.enabled && this.entitlementAttested;
  }

  private gate(kind: LiveTier4ProjectionKind, signal: LiveTier4ProjectionSignal): LiveTier4ProjectionOutcome | null {
    const assetId = projectionAssetId(signal);
    if (!this.enabled) {
      return { kind, status: 'DISABLED', assetId, correlationId: signal.correlationId };
    }
    if (!this.entitlementAttested) {
      return {
        kind,
        status: 'ENTITLEMENT_REQUIRED',
        assetId,
        correlationId: signal.correlationId,
        reason: 'MARKET_DATA_LIVE_ENTITLEMENT_ATTESTED_REQUIRED',
      };
    }
    return null;
  }

  private runCoalesced(
    kind: LiveTier4ProjectionKind,
    signal: LiveTier4ProjectionSignal,
    minIntervalMs: number,
    inFlight: Map<string, Promise<LiveTier4ProjectionOutcome>>,
    lastStartedAt: Map<string, number>,
    operation: () => Promise<LiveTier4ProjectionOutcome>,
  ): Promise<LiveTier4ProjectionOutcome> {
    const key = projectionAssetId(signal);
    const existing = inFlight.get(key);
    if (existing) {
      return Promise.resolve({
        kind,
        status: 'COALESCED',
        assetId: key,
        correlationId: signal.correlationId,
        reason: 'PROJECTION_ALREADY_IN_FLIGHT',
      });
    }

    const startedAt = this.nowMs();
    const previousStartedAt = lastStartedAt.get(key);
    if (previousStartedAt !== undefined && startedAt - previousStartedAt < minIntervalMs) {
      return Promise.resolve({
        kind,
        status: 'COALESCED',
        assetId: key,
        correlationId: signal.correlationId,
        reason: 'PROJECTION_MIN_INTERVAL',
      });
    }

    lastStartedAt.set(key, startedAt);
    const promise = operation()
      .then(outcome => {
        const latencyMs = Math.max(0, this.nowMs() - startedAt);
        const measured = { ...outcome, latencyMs };
        this.onMeasurement?.({
          kind,
          assetId: key,
          correlationId: outcome.correlationId,
          status: outcome.status,
          latencyMs,
        });
        return measured;
      })
      .catch(error => {
        this.onError?.(kind, error, signal);
        const latencyMs = Math.max(0, this.nowMs() - startedAt);
        const outcome: LiveTier4ProjectionOutcome = {
          kind,
          status: 'FAILED',
          assetId: key,
          correlationId: signal.correlationId,
          reason: error instanceof Error ? error.message : String(error),
          latencyMs,
        };
        this.onMeasurement?.({
          kind,
          assetId: key,
          correlationId: signal.correlationId,
          status: outcome.status,
          latencyMs,
        });
        return outcome;
      })
      .finally(() => {
        inFlight.delete(key);
      });

    inFlight.set(key, promise);
    return promise;
  }

  projectVerifiedQuote(signal: LiveTier4ProjectionSignal): Promise<LiveTier4ProjectionOutcome> {
    const normalizedSignal: LiveTier4ProjectionSignal = {
      ...signal,
      symbol: normalizedSymbol(signal.symbol),
      correlationId: signal.correlationId.trim(),
    };
    const gate = this.gate('verified-quote', normalizedSignal);
    if (gate) return Promise.resolve(gate);

    return this.runCoalesced(
      'verified-quote',
      normalizedSignal,
      this.quoteMinIntervalMs,
      this.quoteInFlight,
      this.quoteLastStartedAt,
      async () => {
        if (!normalizedSignal.symbol || !normalizedSignal.correlationId) {
          return {
            kind: 'verified-quote',
            status: 'NOT_ELIGIBLE',
            assetId: projectionAssetId(normalizedSignal),
            correlationId: normalizedSignal.correlationId,
            reason: 'QUOTE_SIGNAL_IDENTITY_INVALID',
          };
        }

        if (normalizedSignal.assetClass === 'crypto') {
          return this.projectCryptoConsensusQuote(
            normalizedSignal as LiveTier4ProjectionSignal & { assetClass: 'crypto' },
          );
        }
        if (
          normalizedSignal.assetClass === 'stock'
          || normalizedSignal.assetClass === 'forex'
          || normalizedSignal.assetClass === 'index'
        ) {
          return this.projectTraditionalQuote(
            normalizedSignal as LiveTier4ProjectionSignal & { assetClass: TraditionalQuoteAssetClass },
          );
        }
        return {
          kind: 'verified-quote',
          status: 'UNSUPPORTED',
          assetId: projectionAssetId(normalizedSignal),
          correlationId: normalizedSignal.correlationId,
          reason: `LIVE_VERIFIED_QUOTE_UNSUPPORTED_ASSET_CLASS:${normalizedSignal.assetClass}`,
        };
      },
    );
  }

  private async projectCryptoConsensusQuote(
    signal: LiveTier4ProjectionSignal & { assetClass: 'crypto' },
  ): Promise<LiveTier4ProjectionOutcome> {
    const consensus = await this.cryptoConsensusReader(signal.symbol, {
      correlationId: signal.correlationId,
    });
    const providers = uniqueNonEmpty(consensus.providers);
    const evidenceIds = uniqueNonEmpty(consensus.evidenceIds);
    const observedAt = latestObservedAt(consensus.observations.map(item => item.observedAt));
    const qualityState = consensus.qualityState === 'LIVE' || consensus.qualityState === 'DELAYED'
      ? consensus.qualityState
      : null;
    const eligible = consensus.status === 'CONSENSUS'
      && positive(consensus.canonicalValue)
      && providers.length >= 2
      && evidenceIds.length >= 2
      && validTimestamp(observedAt)
      && nonEmpty(consensus.correlationId)
      && qualityState !== null;

    if (!eligible || consensus.canonicalValue === null || observedAt === null || qualityState === null) {
      return {
        kind: 'verified-quote',
        status: 'NOT_ELIGIBLE',
        assetId: projectionAssetId(signal),
        correlationId: consensus.correlationId || signal.correlationId,
        reason: consensus.reason ?? `CRYPTO_CONSENSUS_${consensus.status}`,
      };
    }

    const event: MarketLiveVerifiedQuoteEvent = {
      contractVersion: MARKET_LIVE_CLIENT_CONTRACT_VERSION,
      kind: 'verified-quote',
      verification: 'VERIFIED',
      eventId: eventIdentity([
        'verified-quote',
        projectionAssetId(signal),
        consensus.correlationId,
        observedAt,
        ...evidenceIds,
      ]),
      topic: marketLiveClientTopic('crypto', signal.symbol),
      assetId: projectionAssetId(signal),
      symbol: signal.symbol,
      assetClass: 'crypto',
      emittedAt: new Date(this.nowMs()).toISOString(),
      correlationId: consensus.correlationId,
      price: consensus.canonicalValue,
      bid: null,
      ask: null,
      currency: consensus.unit,
      providers,
      evidenceIds,
      observedAt,
      qualityState,
      alertEligible: true,
    };

    if (!isVerifiedMarketLiveQuote(event) || !this.fanoutHub.publishLiveClientEvent(event)) {
      return {
        kind: 'verified-quote',
        status: 'NOT_ELIGIBLE',
        assetId: event.assetId,
        correlationId: event.correlationId,
        reason: 'VERIFIED_QUOTE_EVENT_REJECTED',
      };
    }
    return {
      kind: 'verified-quote',
      status: 'PROJECTED',
      assetId: event.assetId,
      correlationId: event.correlationId,
    };
  }

  private async projectTraditionalQuote(
    signal: LiveTier4ProjectionSignal & { assetClass: TraditionalQuoteAssetClass },
  ): Promise<LiveTier4ProjectionOutcome> {
    const quote = await this.traditionalQuoteReader(signal.symbol, signal.assetClass);
    const providers = uniqueNonEmpty(quote.providers);
    const evidenceIds = uniqueNonEmpty(quote.evidenceIds);
    const qualityState = quote.qualityState === 'LIVE' || quote.qualityState === 'DELAYED'
      ? quote.qualityState
      : null;
    const eligible = quote.status === 'READY'
      && quote.alertEligible === true
      && positive(quote.price)
      && providers.length > 0
      && evidenceIds.length > 0
      && validTimestamp(quote.observedAt)
      && nonEmpty(quote.correlationId)
      && qualityState !== null;

    if (!eligible || quote.price === null || quote.observedAt === null || !quote.correlationId || qualityState === null) {
      return {
        kind: 'verified-quote',
        status: 'NOT_ELIGIBLE',
        assetId: projectionAssetId(signal),
        correlationId: quote.correlationId || signal.correlationId,
        reason: quote.reason ?? `TRADITIONAL_QUOTE_${quote.status}`,
      };
    }

    const event: MarketLiveVerifiedQuoteEvent = {
      contractVersion: MARKET_LIVE_CLIENT_CONTRACT_VERSION,
      kind: 'verified-quote',
      verification: 'VERIFIED',
      eventId: eventIdentity([
        'verified-quote',
        projectionAssetId(signal),
        quote.correlationId,
        quote.observedAt,
        ...evidenceIds,
      ]),
      topic: marketLiveClientTopic(signal.assetClass, signal.symbol),
      assetId: projectionAssetId(signal),
      symbol: signal.symbol,
      assetClass: signal.assetClass,
      emittedAt: new Date(this.nowMs()).toISOString(),
      correlationId: quote.correlationId,
      price: quote.price,
      bid: null,
      ask: null,
      currency: quote.currency,
      providers,
      evidenceIds,
      observedAt: quote.observedAt,
      qualityState,
      alertEligible: true,
    };

    if (!isVerifiedMarketLiveQuote(event) || !this.fanoutHub.publishLiveClientEvent(event)) {
      return {
        kind: 'verified-quote',
        status: 'NOT_ELIGIBLE',
        assetId: event.assetId,
        correlationId: event.correlationId,
        reason: 'VERIFIED_QUOTE_EVENT_REJECTED',
      };
    }
    return {
      kind: 'verified-quote',
      status: 'PROJECTED',
      assetId: event.assetId,
      correlationId: event.correlationId,
    };
  }

  projectCanonicalScore(signal: LiveTier4ProjectionSignal): Promise<LiveTier4ProjectionOutcome> {
    const normalizedSignal: LiveTier4ProjectionSignal = {
      ...signal,
      symbol: normalizedSymbol(signal.symbol),
      correlationId: signal.correlationId.trim(),
    };
    const gate = this.gate('canonical-score', normalizedSignal);
    if (gate) return Promise.resolve(gate);
    if (normalizedSignal.assetClass !== 'crypto') {
      return Promise.resolve({
        kind: 'canonical-score',
        status: 'UNSUPPORTED',
        assetId: projectionAssetId(normalizedSignal),
        correlationId: normalizedSignal.correlationId,
        reason: 'LIVE_SCORING_TRIGGER_CURRENTLY_REQUIRES_CRYPTO_CANONICAL_EXECUTOR',
      });
    }

    return this.runCoalesced(
      'canonical-score',
      normalizedSignal,
      this.scoreMinIntervalMs,
      this.scoreInFlight,
      this.scoreLastStartedAt,
      async () => {
        if (!normalizedSignal.symbol || !normalizedSignal.correlationId) {
          return {
            kind: 'canonical-score',
            status: 'NOT_ELIGIBLE',
            assetId: projectionAssetId(normalizedSignal),
            correlationId: normalizedSignal.correlationId,
            reason: 'SCORING_SIGNAL_IDENTITY_INVALID',
          };
        }

        const request: CryptoCanonicalScoringDispatchRequest = {
          symbol: normalizedSignal.symbol,
          assetClass: 'crypto',
          source: 'request',
        };
        const dispatch = await this.cryptoScoreDispatcher(request);
        const assetId = projectionAssetId(normalizedSignal);
        if (!canonicalScoreHasRequiredLineage(dispatch, assetId)) {
          return {
            kind: 'canonical-score',
            status: 'NOT_ELIGIBLE',
            assetId,
            correlationId: normalizedSignal.correlationId,
            reason: dispatch.status === 'DISPATCHED'
              ? `CANONICAL_SCORE_${dispatch.canonical.status}`
              : dispatch.reason,
          };
        }

        const canonical = dispatch.canonical;
        const evidenceIds = canonical.integrity.evidence.map(evidence => evidence.id);
        const event: MarketLiveCanonicalScoreEvent = {
          contractVersion: MARKET_LIVE_CLIENT_CONTRACT_VERSION,
          kind: 'canonical-score',
          eventId: eventIdentity([
            'canonical-score',
            assetId,
            normalizedSignal.correlationId,
            canonical.integrity.scoringVersion,
            canonical.integrity.retrievedAt,
            ...evidenceIds,
          ]),
          topic: marketLiveClientTopic('crypto', normalizedSignal.symbol),
          assetId,
          symbol: normalizedSignal.symbol,
          assetClass: 'crypto',
          emittedAt: new Date(this.nowMs()).toISOString(),
          correlationId: normalizedSignal.correlationId,
          canonical,
        };

        if (!isCanonicalMarketLiveScore(event) || !this.fanoutHub.publishLiveClientEvent(event)) {
          return {
            kind: 'canonical-score',
            status: 'NOT_ELIGIBLE',
            assetId,
            correlationId: normalizedSignal.correlationId,
            reason: 'CANONICAL_SCORE_EVENT_REJECTED',
          };
        }
        return {
          kind: 'canonical-score',
          status: 'PROJECTED',
          assetId,
          correlationId: normalizedSignal.correlationId,
        };
      },
    );
  }

  async projectFromMarketTick(tick: unknown): Promise<readonly LiveTier4ProjectionOutcome[]> {
    if (!isMarketDataFanoutTick(tick)) {
      const candidate = tick && typeof tick === 'object' ? tick as Record<string, unknown> : {};
      const assetClass = typeof candidate.assetClass === 'string'
        ? candidate.assetClass as MarketDataAssetClass
        : 'crypto';
      const signal: LiveTier4ProjectionSignal = {
        symbol: String(candidate.symbol || ''),
        assetClass,
        correlationId: String(candidate.correlationId || ''),
      };
      return [{
        kind: 'verified-quote',
        status: 'NOT_ELIGIBLE',
        assetId: projectionAssetId(signal),
        correlationId: signal.correlationId,
        reason: 'INVALID_TIER3_TICK_SIGNAL',
      }];
    }

    const signal: LiveTier4ProjectionSignal = {
      symbol: tick.symbol,
      assetClass: tick.assetClass,
      correlationId: tick.correlationId,
    };
    const work: Promise<LiveTier4ProjectionOutcome>[] = [this.projectVerifiedQuote(signal)];
    if (tick.assetClass === 'crypto') work.push(this.projectCanonicalScore(signal));
    return Promise.all(work);
  }
}

export function createLiveTier4ProjectionRuntime(
  options: LiveTier4ProjectionRuntimeOptions,
): LiveTier4ProjectionRuntime {
  return new LiveTier4ProjectionRuntime(options);
}

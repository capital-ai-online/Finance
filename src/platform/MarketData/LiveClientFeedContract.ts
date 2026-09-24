import type { CanonicalScoreResult } from '../../types/scoringIntegrity';
import type { MarketDataAssetClass } from './contracts';

export const MARKET_LIVE_CLIENT_CONTRACT_VERSION = 'market-live-client/1.0.0' as const;
export const MARKET_LIVE_CLIENT_TIER3_FANOUT_VERSION = 'market-data-fanout/1.0.0' as const;
export const MARKET_LIVE_CLIENT_VIEW_BUFFER_LIMIT = 200 as const;

export type MarketLiveClientStreamState =
  | 'CONNECTING'
  | 'LIVE'
  | 'RECONNECTING'
  | 'UNAVAILABLE';

export interface MarketLiveClientEventBase {
  readonly contractVersion: typeof MARKET_LIVE_CLIENT_CONTRACT_VERSION;
  readonly eventId: string;
  readonly topic: string;
  readonly assetId: string;
  readonly symbol: string;
  readonly assetClass: MarketDataAssetClass;
  readonly emittedAt: string;
  readonly correlationId: string;
}

/**
 * Client projection of a decoded Tier-3 market-data fan-out tick.
 *
 * This event is presentation-only. A raw provider tick is deliberately not promoted
 * to an alert-eligible verified quote or to a scoring input merely because it reached
 * the low-latency fan-out path.
 */
export interface MarketLiveVisualizationTickEvent extends MarketLiveClientEventBase {
  readonly kind: 'market-tick';
  readonly sourceContractVersion: typeof MARKET_LIVE_CLIENT_TIER3_FANOUT_VERSION;
  readonly provider: string;
  readonly providerFeed: string | null;
  readonly observedAt: string;
  readonly receivedAt: string;
  readonly freshnessMs: number | null;
  readonly qualityState: 'LIVE' | 'DELAYED' | 'STALE';
  readonly evidenceId: string;
  readonly price: number;
  readonly bid: number | null;
  readonly ask: number | null;
  readonly alertEligible: false;
  readonly scoringEligible: false;
}

export interface MarketLiveVerifiedQuoteEvent extends MarketLiveClientEventBase {
  readonly kind: 'verified-quote';
  readonly verification: 'VERIFIED';
  readonly price: number;
  readonly bid: number | null;
  readonly ask: number | null;
  readonly currency: string | null;
  readonly providers: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly observedAt: string;
  readonly qualityState: 'LIVE' | 'DELAYED';
  readonly alertEligible: true;
}

export interface MarketLiveCanonicalScoreEvent extends MarketLiveClientEventBase {
  readonly kind: 'canonical-score';
  readonly canonical: CanonicalScoreResult;
}

export interface MarketLiveControlEvent extends MarketLiveClientEventBase {
  readonly kind: 'control';
  readonly control: 'HEARTBEAT' | 'REPLAY_COMPLETE' | 'STREAM_UNAVAILABLE';
  readonly reason?: string;
}

export type MarketLiveClientEvent =
  | MarketLiveVisualizationTickEvent
  | MarketLiveVerifiedQuoteEvent
  | MarketLiveCanonicalScoreEvent
  | MarketLiveControlEvent;

export type MarketLiveReplayDecision = 'ACCEPT' | 'DUPLICATE';

export interface MarketLivePriceAlertRule {
  readonly targetPrice: number;
  readonly condition: 'above' | 'below';
}

export interface MarketLiveAlertEvaluation {
  readonly eligible: boolean;
  readonly triggered: boolean;
  readonly price: number | null;
  readonly evidenceIds: readonly string[];
  readonly correlationId: string | null;
  readonly reason?: string;
}

function finitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function finiteNullable(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validIsoDate(value: unknown): value is string {
  return nonEmptyString(value) && Number.isFinite(Date.parse(value));
}

function expectedMarketTopic(assetClass: MarketDataAssetClass, symbol: string): string {
  return `market:${assetClass}:${symbol.toUpperCase().trim()}`;
}

export function isMarketLiveVisualizationTick(
  event: MarketLiveClientEvent,
): event is MarketLiveVisualizationTickEvent {
  return event.kind === 'market-tick'
    && event.sourceContractVersion === MARKET_LIVE_CLIENT_TIER3_FANOUT_VERSION
    && event.topic === expectedMarketTopic(event.assetClass, event.symbol)
    && nonEmptyString(event.eventId)
    && nonEmptyString(event.provider)
    && nonEmptyString(event.evidenceId)
    && validIsoDate(event.observedAt)
    && validIsoDate(event.receivedAt)
    && validIsoDate(event.emittedAt)
    && finitePositive(event.price)
    && finiteNullable(event.bid)
    && finiteNullable(event.ask)
    && (event.freshnessMs === null || (Number.isFinite(event.freshnessMs) && event.freshnessMs >= 0))
    && event.alertEligible === false
    && event.scoringEligible === false;
}

export function isVerifiedMarketLiveQuote(
  event: MarketLiveClientEvent,
): event is MarketLiveVerifiedQuoteEvent {
  return event.kind === 'verified-quote'
    && event.verification === 'VERIFIED'
    && event.alertEligible === true
    && finitePositive(event.price)
    && event.providers.length > 0
    && event.providers.every(nonEmptyString)
    && event.evidenceIds.length > 0
    && event.evidenceIds.every(nonEmptyString)
    && validIsoDate(event.observedAt)
    && validIsoDate(event.emittedAt)
    && nonEmptyString(event.eventId);
}

export function isCanonicalMarketLiveScore(
  event: MarketLiveClientEvent,
): event is MarketLiveCanonicalScoreEvent {
  if (event.kind !== 'canonical-score') return false;
  if (!event.canonical || !event.canonical.integrity) return false;
  if (event.canonical.integrity.assetId !== event.assetId) return false;
  if (event.canonical.status === 'READY') {
    return Number.isFinite(event.canonical.score)
      && Number.isFinite(event.canonical.final_score)
      && event.canonical.integrity.status === 'READY';
  }
  return event.canonical.score === null
    && event.canonical.final_score === null
    && event.canonical.integrity.status === event.canonical.status;
}

/**
 * Tier 3 replay is event-id based rather than dependent on a synthetic client sequence.
 * A reconnecting client can keep a bounded Set of recently observed event IDs and accept
 * replayed frames idempotently without inventing ordering guarantees absent upstream.
 */
export function decideMarketLiveReplay(
  recentEventIds: ReadonlySet<string>,
  nextEventId: string,
): MarketLiveReplayDecision {
  return recentEventIds.has(nextEventId) ? 'DUPLICATE' : 'ACCEPT';
}

export function appendMarketLiveViewTick(
  buffer: readonly MarketLiveVisualizationTickEvent[],
  event: MarketLiveVisualizationTickEvent,
  limit: number = MARKET_LIVE_CLIENT_VIEW_BUFFER_LIMIT,
): readonly MarketLiveVisualizationTickEvent[] {
  if (!isMarketLiveVisualizationTick(event)) return buffer;
  const boundedLimit = Number.isSafeInteger(limit) && limit > 0
    ? Math.min(limit, MARKET_LIVE_CLIENT_VIEW_BUFFER_LIMIT)
    : MARKET_LIVE_CLIENT_VIEW_BUFFER_LIMIT;
  const next = [...buffer, event];
  return next.length <= boundedLimit ? next : next.slice(next.length - boundedLimit);
}

export function evaluateMarketLivePriceAlert(
  rule: MarketLivePriceAlertRule,
  event: MarketLiveClientEvent,
): MarketLiveAlertEvaluation {
  if (!finitePositive(rule.targetPrice)) {
    return {
      eligible: false,
      triggered: false,
      price: null,
      evidenceIds: [],
      correlationId: null,
      reason: 'INVALID_ALERT_THRESHOLD',
    };
  }
  if (!isVerifiedMarketLiveQuote(event)) {
    return {
      eligible: false,
      triggered: false,
      price: null,
      evidenceIds: [],
      correlationId: event.correlationId || null,
      reason: 'VERIFIED_QUOTE_REQUIRED',
    };
  }

  return {
    eligible: true,
    triggered: rule.condition === 'above'
      ? event.price >= rule.targetPrice
      : event.price <= rule.targetPrice,
    price: event.price,
    evidenceIds: event.evidenceIds,
    correlationId: event.correlationId,
  };
}

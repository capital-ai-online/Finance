import type { CanonicalScoreResult } from '../../types/scoringIntegrity';
import type { MarketDataAssetClass } from './contracts';

export const MARKET_LIVE_CLIENT_CONTRACT_VERSION = 'market-live-client/1.0.0' as const;
export const MARKET_LIVE_CLIENT_VIEW_BUFFER_LIMIT = 200 as const;

export type MarketLiveClientStreamState =
  | 'CONNECTING'
  | 'LIVE'
  | 'RECONNECTING'
  | 'UNAVAILABLE';

export interface MarketLiveClientEventBase {
  readonly contractVersion: typeof MARKET_LIVE_CLIENT_CONTRACT_VERSION;
  readonly eventId: string;
  readonly sequence: number;
  readonly room: string;
  readonly assetId: string;
  readonly symbol: string;
  readonly assetClass: MarketDataAssetClass;
  readonly emittedAt: string;
  readonly correlationId: string;
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
  readonly control: 'HEARTBEAT' | 'RESYNC_REQUIRED' | 'STREAM_UNAVAILABLE';
  readonly reason?: string;
}

export type MarketLiveClientEvent =
  | MarketLiveVerifiedQuoteEvent
  | MarketLiveCanonicalScoreEvent
  | MarketLiveControlEvent;

export type MarketLiveSequenceDecision =
  | 'ACCEPT'
  | 'DUPLICATE_OR_OLD'
  | 'RESYNC_REQUIRED';

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

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validIsoDate(value: unknown): value is string {
  return nonEmptyString(value) && Number.isFinite(Date.parse(value));
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
    && Number.isSafeInteger(event.sequence)
    && event.sequence >= 0;
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

export function decideMarketLiveSequence(
  previousSequence: number | null,
  nextSequence: number,
): MarketLiveSequenceDecision {
  if (!Number.isSafeInteger(nextSequence) || nextSequence < 0) return 'RESYNC_REQUIRED';
  if (previousSequence === null) return 'ACCEPT';
  if (nextSequence <= previousSequence) return 'DUPLICATE_OR_OLD';
  if (nextSequence !== previousSequence + 1) return 'RESYNC_REQUIRED';
  return 'ACCEPT';
}

export function appendMarketLiveViewTick(
  buffer: readonly MarketLiveVerifiedQuoteEvent[],
  event: MarketLiveVerifiedQuoteEvent,
  limit: number = MARKET_LIVE_CLIENT_VIEW_BUFFER_LIMIT,
): readonly MarketLiveVerifiedQuoteEvent[] {
  if (!isVerifiedMarketLiveQuote(event)) return buffer;
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

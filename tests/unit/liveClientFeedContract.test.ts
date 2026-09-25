import { describe, expect, it } from 'vitest';
import type { CanonicalScoreResult } from '../../src/types/scoringIntegrity';
import {
  MARKET_LIVE_CLIENT_CONTRACT_VERSION,
  MARKET_LIVE_CLIENT_TIER3_FANOUT_VERSION,
  MARKET_LIVE_CLIENT_VIEW_BUFFER_LIMIT,
  appendMarketLiveViewTick,
  decideMarketLiveReplay,
  evaluateMarketLivePriceAlert,
  isCanonicalMarketLiveScore,
  isMarketLiveVisualizationTick,
  isVerifiedMarketLiveQuote,
  type MarketLiveCanonicalScoreEvent,
  type MarketLiveVerifiedQuoteEvent,
  type MarketLiveVisualizationTickEvent,
} from '../../src/platform/MarketData/LiveClientFeedContract';

function visualizationTick(index: number, price = 100): MarketLiveVisualizationTickEvent {
  return {
    contractVersion: MARKET_LIVE_CLIENT_CONTRACT_VERSION,
    sourceContractVersion: MARKET_LIVE_CLIENT_TIER3_FANOUT_VERSION,
    kind: 'market-tick',
    eventId: `tier3-${index}`,
    topic: 'asset:crypto:BTC',
    assetId: 'crypto:BTC',
    symbol: 'BTC',
    assetClass: 'crypto',
    emittedAt: '2026-09-25T00:00:00.000Z',
    correlationId: `corr-tier3-${index}`,
    provider: 'binance',
    providerFeed: 'spot',
    observedAt: '2026-09-25T00:00:00.000Z',
    receivedAt: '2026-09-25T00:00:00.001Z',
    freshnessMs: 1,
    qualityState: 'LIVE',
    evidenceId: `evidence-tier3-${index}`,
    price,
    bid: price - 1,
    ask: price + 1,
    alertEligible: false,
    scoringEligible: false,
  };
}

function verifiedQuote(index: number, price = 100): MarketLiveVerifiedQuoteEvent {
  return {
    contractVersion: MARKET_LIVE_CLIENT_CONTRACT_VERSION,
    kind: 'verified-quote',
    verification: 'VERIFIED',
    eventId: `quote-${index}`,
    topic: 'verified-quote:crypto:BTC',
    assetId: 'crypto:BTC',
    symbol: 'BTC',
    assetClass: 'crypto',
    emittedAt: '2026-09-25T00:00:00.000Z',
    correlationId: `corr-${index}`,
    price,
    bid: price - 1,
    ask: price + 1,
    currency: 'USD',
    providers: ['binance', 'secondary-provider'],
    evidenceIds: [`evidence-${index}-a`, `evidence-${index}-b`],
    observedAt: '2026-09-25T00:00:00.000Z',
    qualityState: 'LIVE',
    alertEligible: true,
  };
}

function canonical(status: CanonicalScoreResult['status'] = 'READY'): CanonicalScoreResult {
  if (status === 'READY') {
    return {
      status,
      score: 78,
      final_score: 78,
      integrity: {
        status,
        assetId: 'crypto:BTC',
        providers: ['verified-provider'],
        retrievedAt: '2026-09-25T00:00:00.000Z',
        dataQuality: 'high',
        featureVersion: 'features/1.0.0',
        scoringVersion: 'scoring/1.0.0',
        coverage: 1,
        evidence: [],
        missingFields: [],
      },
    };
  }
  return {
    status,
    score: null,
    final_score: null,
    integrity: {
      status,
      assetId: 'crypto:BTC',
      providers: [],
      retrievedAt: '2026-09-25T00:00:00.000Z',
      dataQuality: 'unknown',
      featureVersion: 'features/1.0.0',
      scoringVersion: 'scoring/1.0.0',
      coverage: 0,
      evidence: [],
      missingFields: ['price'],
    },
  };
}

describe('Tier 4 live client feed contract', () => {
  it('accepts decoded Tier-3 fan-out ticks only as presentation data', () => {
    const tick = visualizationTick(1);
    expect(isMarketLiveVisualizationTick(tick)).toBe(true);
    expect(tick.alertEligible).toBe(false);
    expect(tick.scoringEligible).toBe(false);
    expect(evaluateMarketLivePriceAlert({ targetPrice: 99, condition: 'above' }, tick)).toMatchObject({
      eligible: false,
      triggered: false,
      reason: 'VERIFIED_QUOTE_REQUIRED',
    });
  });

  it('accepts only separately verified quote events for live alerts', () => {
    expect(isVerifiedMarketLiveQuote(verifiedQuote(1))).toBe(true);

    const invalid = { ...verifiedQuote(2), evidenceIds: [] };
    expect(isVerifiedMarketLiveQuote(invalid)).toBe(false);
    expect(evaluateMarketLivePriceAlert({ targetPrice: 99, condition: 'above' }, invalid)).toMatchObject({
      eligible: false,
      triggered: false,
      reason: 'VERIFIED_QUOTE_REQUIRED',
    });
  });

  it('keeps the client visualization buffer bounded to 200 Tier-3 ticks', () => {
    let buffer: readonly MarketLiveVisualizationTickEvent[] = [];
    for (let index = 0; index < 240; index += 1) {
      buffer = appendMarketLiveViewTick(buffer, visualizationTick(index, 100 + index));
    }

    expect(buffer).toHaveLength(MARKET_LIVE_CLIENT_VIEW_BUFFER_LIMIT);
    expect(buffer[0].eventId).toBe('tier3-40');
    expect(buffer.at(-1)?.eventId).toBe('tier3-239');
  });

  it('deduplicates replay by the upstream event identity without inventing sequence guarantees', () => {
    const recent = new Set(['tier3-40', 'tier3-41']);
    expect(decideMarketLiveReplay(recent, 'tier3-42')).toBe('ACCEPT');
    expect(decideMarketLiveReplay(recent, 'tier3-41')).toBe('DUPLICATE');
  });

  it('evaluates threshold alerts in constant work only after quote verification', () => {
    expect(evaluateMarketLivePriceAlert({ targetPrice: 99, condition: 'above' }, verifiedQuote(3, 100))).toMatchObject({
      eligible: true,
      triggered: true,
      price: 100,
      evidenceIds: ['evidence-3-a', 'evidence-3-b'],
      correlationId: 'corr-3',
    });
    expect(evaluateMarketLivePriceAlert({ targetPrice: 101, condition: 'above' }, verifiedQuote(4, 100))).toMatchObject({
      eligible: true,
      triggered: false,
    });
  });

  it('carries canonical score results without creating a client-side scoring authority', () => {
    const event: MarketLiveCanonicalScoreEvent = {
      contractVersion: MARKET_LIVE_CLIENT_CONTRACT_VERSION,
      kind: 'canonical-score',
      eventId: 'score-1',
      topic: 'canonical-score:crypto:BTC',
      assetId: 'crypto:BTC',
      symbol: 'BTC',
      assetClass: 'crypto',
      emittedAt: '2026-09-25T00:00:00.000Z',
      correlationId: 'corr-score-1',
      canonical: canonical('READY'),
    };

    expect(isCanonicalMarketLiveScore(event)).toBe(true);
    expect(event.canonical.status).toBe('READY');
    expect(event.canonical.score).toBe(78);

    const ready = canonical('READY');
    const mismatched = {
      ...event,
      canonical: {
        ...ready,
        integrity: {
          ...ready.integrity,
          assetId: 'crypto:ETH',
        },
      },
    } as MarketLiveCanonicalScoreEvent;
    expect(isCanonicalMarketLiveScore(mismatched)).toBe(false);
  });
});

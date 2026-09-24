import { describe, expect, it } from 'vitest';
import type { CanonicalScoreResult } from '../../src/types/scoringIntegrity';
import {
  MARKET_LIVE_CLIENT_CONTRACT_VERSION,
  MARKET_LIVE_CLIENT_VIEW_BUFFER_LIMIT,
  appendMarketLiveViewTick,
  decideMarketLiveSequence,
  evaluateMarketLivePriceAlert,
  isCanonicalMarketLiveScore,
  isVerifiedMarketLiveQuote,
  type MarketLiveCanonicalScoreEvent,
  type MarketLiveVerifiedQuoteEvent,
} from '../../src/platform/MarketData/LiveClientFeedContract';

function quote(sequence: number, price = 100): MarketLiveVerifiedQuoteEvent {
  return {
    contractVersion: MARKET_LIVE_CLIENT_CONTRACT_VERSION,
    kind: 'verified-quote',
    verification: 'VERIFIED',
    eventId: `quote-${sequence}`,
    sequence,
    room: 'asset:crypto:BTC',
    assetId: 'crypto:BTC',
    symbol: 'BTC',
    assetClass: 'crypto',
    emittedAt: '2026-09-25T00:00:00.000Z',
    correlationId: `corr-${sequence}`,
    price,
    bid: price - 1,
    ask: price + 1,
    currency: 'USD',
    providers: ['binance'],
    evidenceIds: [`evidence-${sequence}`],
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
  it('accepts only evidence-backed quote events for live alerts', () => {
    expect(isVerifiedMarketLiveQuote(quote(1))).toBe(true);

    const invalid = { ...quote(2), evidenceIds: [] };
    expect(isVerifiedMarketLiveQuote(invalid)).toBe(false);
    expect(evaluateMarketLivePriceAlert({ targetPrice: 99, condition: 'above' }, invalid)).toMatchObject({
      eligible: false,
      triggered: false,
      reason: 'VERIFIED_QUOTE_REQUIRED',
    });
  });

  it('keeps the client visualization buffer bounded to 200 verified ticks', () => {
    let buffer: readonly MarketLiveVerifiedQuoteEvent[] = [];
    for (let sequence = 0; sequence < 240; sequence += 1) {
      buffer = appendMarketLiveViewTick(buffer, quote(sequence, 100 + sequence));
    }

    expect(buffer).toHaveLength(MARKET_LIVE_CLIENT_VIEW_BUFFER_LIMIT);
    expect(buffer[0].sequence).toBe(40);
    expect(buffer.at(-1)?.sequence).toBe(239);
  });

  it('forces resync on sequence gaps and ignores duplicate or old events', () => {
    expect(decideMarketLiveSequence(null, 1)).toBe('ACCEPT');
    expect(decideMarketLiveSequence(1, 2)).toBe('ACCEPT');
    expect(decideMarketLiveSequence(2, 2)).toBe('DUPLICATE_OR_OLD');
    expect(decideMarketLiveSequence(2, 1)).toBe('DUPLICATE_OR_OLD');
    expect(decideMarketLiveSequence(2, 4)).toBe('RESYNC_REQUIRED');
  });

  it('evaluates threshold alerts in constant work only after verification', () => {
    expect(evaluateMarketLivePriceAlert({ targetPrice: 99, condition: 'above' }, quote(3, 100))).toMatchObject({
      eligible: true,
      triggered: true,
      price: 100,
      evidenceIds: ['evidence-3'],
      correlationId: 'corr-3',
    });
    expect(evaluateMarketLivePriceAlert({ targetPrice: 101, condition: 'above' }, quote(4, 100))).toMatchObject({
      eligible: true,
      triggered: false,
    });
  });

  it('carries canonical score results without creating a client-side scoring authority', () => {
    const event: MarketLiveCanonicalScoreEvent = {
      contractVersion: MARKET_LIVE_CLIENT_CONTRACT_VERSION,
      kind: 'canonical-score',
      eventId: 'score-1',
      sequence: 5,
      room: 'asset:crypto:BTC',
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

    const mismatched = {
      ...event,
      canonical: {
        ...canonical('READY'),
        integrity: {
          ...canonical('READY').integrity,
          assetId: 'crypto:ETH',
        },
      },
    } as MarketLiveCanonicalScoreEvent;
    expect(isCanonicalMarketLiveScore(mismatched)).toBe(false);
  });
});

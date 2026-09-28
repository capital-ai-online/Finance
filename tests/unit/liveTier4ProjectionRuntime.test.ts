import { describe, expect, it, vi } from 'vitest';
import {
  MARKET_DATA_FANOUT_CONTRACT_VERSION,
  type MarketDataFanoutTick,
} from '../../src/platform/MarketData/Fanout/contracts';
import {
  MarketDataFanoutHub,
} from '../../src/platform/MarketData/Fanout/MarketDataFanoutHub';
import type { WebSocketFanoutClient } from '../../src/platform/MarketData/Fanout/MarketDataWebSocketRoomMultiplexer';
import {
  LiveTier4ProjectionRuntime,
} from '../../server/marketData/liveTier4ProjectionRuntime';

const NOW = '2026-09-28T05:00:00.000Z';
const NOW_MS = Date.parse(NOW);

function tick(price = 999_999): MarketDataFanoutTick {
  return {
    contractVersion: MARKET_DATA_FANOUT_CONTRACT_VERSION,
    topic: 'asset:crypto:BTC',
    symbol: 'BTC',
    assetClass: 'crypto',
    provider: 'binance-public',
    providerFeed: 'bookTicker',
    sourceTimestamp: '2026-09-28T04:59:59.990Z',
    receivedAt: NOW,
    freshnessMs: 10,
    qualityState: 'LIVE',
    eventKind: 'bbo',
    correlationId: 'tier3-live-btc',
    evidenceId: 'raw-binance-bbo-evidence',
    price,
    bid: price - 1,
    ask: price + 1,
    vwap: price,
  };
}

function subscribedHub(): { hub: MarketDataFanoutHub; sent: string[] } {
  const sent: string[] = [];
  const hub = new MarketDataFanoutHub();
  const client: WebSocketFanoutClient = {
    readyState: 1,
    bufferedAmount: 0,
    send: payload => sent.push(payload),
  };
  void hub.subscribeClient(client, 'asset:crypto:BTC', 0);
  sent.length = 0;
  return { hub, sent };
}

function consensus(overrides: Record<string, unknown> = {}) {
  return {
    status: 'CONSENSUS',
    canonicalValue: 100,
    observations: [
      {
        provider: 'CoinAPI',
        value: 100,
        observedAt: '2026-09-28T04:59:59.900Z',
        retrievedAt: NOW,
        unit: 'USD',
        evidenceId: 'consensus-evidence-a',
        qualityState: 'LIVE',
      },
      {
        provider: 'TwelveData',
        value: 100.1,
        observedAt: '2026-09-28T04:59:59.950Z',
        retrievedAt: NOW,
        unit: 'USD',
        evidenceId: 'consensus-evidence-b',
        qualityState: 'LIVE',
      },
    ],
    providers: ['CoinAPI', 'TwelveData'],
    evidenceIds: ['consensus-evidence-a', 'consensus-evidence-b'],
    maxDeviationBps: 5,
    correlationId: 'consensus-btc-correlation',
    qualityState: 'LIVE',
    unit: 'USD',
    ...overrides,
  } as any;
}

function readyDispatch() {
  const canonical = {
    status: 'READY',
    score: 7.4,
    final_score: 74,
    integrity: {
      status: 'READY',
      assetId: 'crypto:BTC',
      providers: ['verified-history-provider'],
      observedAt: '2026-09-28T04:59:00.000Z',
      retrievedAt: NOW,
      dataQuality: 'high',
      featureVersion: 'crypto-technical-features/0.7.0',
      scoringVersion: 'crypto-technical-provenance/0.7.0',
      coverage: 1,
      evidence: [{
        id: 'score-evidence-1',
        source: 'verified-history-provider',
        observedAt: '2026-09-28T04:59:00.000Z',
        retrievedAt: NOW,
        kind: 'market-history',
      }],
      missingFields: [],
      dispatcherVersion: 'canonical-scoring-dispatcher/1.1.0',
      modelRegistryVersion: 'scoring-model-registry/1.0.0',
      modelId: 'crypto-technical-provenance',
      modelVersion: '0.7.0',
      modelAlias: 'champion',
      modelLifecycle: 'canonical',
      executorKey: 'verifiedCryptoTechnicalScoring.evaluateVerifiedCryptoTechnicalScore',
      resultContractVersion: 'scoring-integrity/1.0.0',
    },
  } as const;
  return {
    status: 'DISPATCHED',
    dispatcherVersion: 'canonical-scoring-dispatcher/1.1.0',
    asset: { assetId: 'crypto:BTC' },
    model: {},
    canonical,
    assessment: { canonical },
  } as any;
}

function sidebandEvents(sent: readonly string[]): any[] {
  return sent
    .map(payload => JSON.parse(payload))
    .filter(frame => Array.isArray(frame) && frame[0] === 'event')
    .map(frame => frame[2]);
}

describe('Tier 4 live verified quote and canonical scoring projections', () => {
  it('keeps the runtime fail-closed without explicit entitlement attestation', async () => {
    const { hub, sent } = subscribedHub();
    const cryptoConsensusReader = vi.fn(async () => consensus());
    const cryptoScoreDispatcher = vi.fn(async () => readyDispatch());
    const runtime = new LiveTier4ProjectionRuntime({
      fanoutHub: hub,
      enabled: true,
      entitlementAttested: false,
      nowMs: () => NOW_MS,
      cryptoConsensusReader,
      cryptoScoreDispatcher,
    });

    const outcomes = await runtime.projectFromMarketTick(tick());

    expect(outcomes.every(outcome => outcome.status === 'ENTITLEMENT_REQUIRED')).toBe(true);
    expect(cryptoConsensusReader).not.toHaveBeenCalled();
    expect(cryptoScoreDispatcher).not.toHaveBeenCalled();
    expect(sidebandEvents(sent)).toEqual([]);
  });

  it('never promotes a raw Tier-3 price when independent consensus is unavailable', async () => {
    const { hub, sent } = subscribedHub();
    const cryptoConsensusReader = vi.fn(async () => consensus({
      status: 'INSUFFICIENT_SOURCES',
      canonicalValue: null,
      observations: [],
      providers: [],
      evidenceIds: [],
      qualityState: null,
      unit: null,
      reason: 'quorum unavailable',
    }));
    const cryptoScoreDispatcher = vi.fn(async () => ({
      status: 'SCORE_NOT_COMPUTABLE',
      reason: 'verified feature evidence unavailable',
      canonical: {
        status: 'SCORE_NOT_COMPUTABLE',
        score: null,
        final_score: null,
        integrity: {
          status: 'SCORE_NOT_COMPUTABLE',
          assetId: 'crypto:BTC',
          providers: [],
          retrievedAt: NOW,
          dataQuality: 'unknown',
          featureVersion: 'crypto-technical-features/0.7.0',
          scoringVersion: 'crypto-technical-provenance/0.7.0',
          coverage: 0,
          evidence: [],
          missingFields: ['scoringEvidence'],
        },
      },
    } as any));
    const runtime = new LiveTier4ProjectionRuntime({
      fanoutHub: hub,
      enabled: true,
      entitlementAttested: true,
      nowMs: () => NOW_MS,
      quoteMinIntervalMs: 0,
      scoreMinIntervalMs: 0,
      cryptoConsensusReader,
      cryptoScoreDispatcher,
    });

    const outcomes = await runtime.projectFromMarketTick(tick(999_999));

    expect(outcomes.map(outcome => outcome.status)).toEqual(['NOT_ELIGIBLE', 'NOT_ELIGIBLE']);
    expect(sidebandEvents(sent)).toEqual([]);
  });

  it('projects the existing crypto consensus value and exact evidence instead of the raw tick price', async () => {
    const { hub, sent } = subscribedHub();
    const cryptoConsensusReader = vi.fn(async () => consensus());
    const runtime = new LiveTier4ProjectionRuntime({
      fanoutHub: hub,
      enabled: true,
      entitlementAttested: true,
      nowMs: () => NOW_MS,
      quoteMinIntervalMs: 5_000,
      cryptoConsensusReader,
      cryptoScoreDispatcher: vi.fn(async () => readyDispatch()),
    });
    const signal = { symbol: 'BTC', assetClass: 'crypto' as const, correlationId: 'tier3-live-btc' };

    const [first, second] = await Promise.all([
      runtime.projectVerifiedQuote(signal),
      runtime.projectVerifiedQuote(signal),
    ]);

    expect([first.status, second.status].sort()).toEqual(['COALESCED', 'PROJECTED']);
    expect(cryptoConsensusReader).toHaveBeenCalledTimes(1);
    expect(cryptoConsensusReader).toHaveBeenCalledWith('BTC', { correlationId: 'tier3-live-btc' });

    const [event] = sidebandEvents(sent);
    expect(event).toMatchObject({
      kind: 'verified-quote',
      topic: 'asset:crypto:BTC',
      assetId: 'crypto:BTC',
      price: 100,
      providers: ['CoinAPI', 'TwelveData'],
      evidenceIds: ['consensus-evidence-a', 'consensus-evidence-b'],
      correlationId: 'consensus-btc-correlation',
      qualityState: 'LIVE',
      alertEligible: true,
    });
    expect(event.price).not.toBe(tick().price);
    expect(hub.ringBuffer.size('asset:crypto:BTC')).toBe(0);
  });

  it('coalesces score triggers and emits only the CanonicalScoreResult returned by ScoringDispatcher', async () => {
    const { hub, sent } = subscribedHub();
    const cryptoScoreDispatcher = vi.fn(async () => readyDispatch());
    const measurements: any[] = [];
    const runtime = new LiveTier4ProjectionRuntime({
      fanoutHub: hub,
      enabled: true,
      entitlementAttested: true,
      nowMs: () => NOW_MS,
      scoreMinIntervalMs: 15_000,
      cryptoConsensusReader: vi.fn(async () => consensus()),
      cryptoScoreDispatcher,
      onMeasurement: measurement => measurements.push(measurement),
    });
    const signal = { symbol: 'BTC', assetClass: 'crypto' as const, correlationId: 'tier3-live-btc' };

    const [first, second] = await Promise.all([
      runtime.projectCanonicalScore(signal),
      runtime.projectCanonicalScore(signal),
    ]);

    expect([first.status, second.status].sort()).toEqual(['COALESCED', 'PROJECTED']);
    expect(cryptoScoreDispatcher).toHaveBeenCalledTimes(1);
    expect(cryptoScoreDispatcher).toHaveBeenCalledWith({
      symbol: 'BTC',
      assetClass: 'crypto',
      source: 'request',
    });

    const [event] = sidebandEvents(sent);
    expect(event.kind).toBe('canonical-score');
    expect(event.topic).toBe('asset:crypto:BTC');
    expect(event.correlationId).toBe('tier3-live-btc');
    expect(event.canonical).toEqual(readyDispatch().canonical);
    expect(event.canonical.integrity.evidence.map((item: any) => item.id)).toEqual(['score-evidence-1']);
    expect(event.canonical.integrity.modelId).toBe('crypto-technical-provenance');
    expect(measurements).toEqual([expect.objectContaining({
      kind: 'canonical-score',
      status: 'PROJECTED',
      assetId: 'crypto:BTC',
      latencyMs: 0,
    })]);
  });

  it('projects Traditional alerts only from the existing alertEligible live quote contract', async () => {
    const sent: string[] = [];
    const hub = new MarketDataFanoutHub();
    const client: WebSocketFanoutClient = {
      readyState: 1,
      bufferedAmount: 0,
      send: payload => sent.push(payload),
    };
    await hub.subscribeClient(client, 'asset:stock:AAPL', 0);
    sent.length = 0;
    const traditionalQuoteReader = vi.fn(async () => ({
      contractVersion: 'traditional-quote/1.0.0',
      status: 'READY',
      symbol: 'AAPL',
      assetClass: 'stock',
      price: 213.42,
      currency: 'USD',
      provider: 'TwelveData',
      providers: ['TwelveData'],
      observedAt: '2026-09-28T04:59:50.000Z',
      retrievedAt: NOW,
      evidenceIds: ['quote:twelvedata:AAPL:test'],
      sourcePath: 'https://api.twelvedata.com/quote',
      alertEligible: true,
      executionPriceEligible: false,
      correlationId: 'traditional-quote:AAPL:test',
      qualityState: 'LIVE',
    } as any));
    const runtime = new LiveTier4ProjectionRuntime({
      fanoutHub: hub,
      enabled: true,
      entitlementAttested: true,
      nowMs: () => NOW_MS,
      quoteMinIntervalMs: 0,
      cryptoConsensusReader: vi.fn(async () => consensus()),
      traditionalQuoteReader,
      cryptoScoreDispatcher: vi.fn(async () => readyDispatch()),
    });

    const outcome = await runtime.projectVerifiedQuote({
      symbol: 'AAPL',
      assetClass: 'stock',
      correlationId: 'traditional-trigger',
    });

    expect(outcome.status).toBe('PROJECTED');
    const [event] = sidebandEvents(sent);
    expect(event).toMatchObject({
      kind: 'verified-quote',
      topic: 'asset:stock:AAPL',
      correlationId: 'traditional-quote:AAPL:test',
      price: 213.42,
      providers: ['TwelveData'],
      evidenceIds: ['quote:twelvedata:AAPL:test'],
      alertEligible: true,
    });
  });
});

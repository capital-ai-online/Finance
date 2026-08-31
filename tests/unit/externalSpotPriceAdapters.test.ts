import { describe, expect, it } from 'vitest';
import { marketObservationFromCanonicalSnapshot } from '../../src/services/externalSpotPriceAdapters';
import { MARKET_DATA_CONTRACT_VERSION, type CanonicalMarketDataSnapshot } from '../../src/platform/MarketData/contracts';

function snapshot(overrides: Partial<CanonicalMarketDataSnapshot> = {}): CanonicalMarketDataSnapshot {
  return {
    contractVersion: MARKET_DATA_CONTRACT_VERSION,
    provider: 'CoinAPI',
    providerFeed: 'test',
    symbol: 'BTC',
    assetClass: 'crypto',
    currency: 'USD',
    sourceTimestamp: '2026-08-31T18:00:00.000Z',
    ingestedAt: '2026-08-31T18:00:01.000Z',
    receivedAt: '2026-08-31T18:00:01.000Z',
    freshnessMs: 1_000,
    qualityState: 'LIVE',
    isRealtime: true,
    isDelayed: false,
    correlationId: 'spot-test',
    price: 65_000,
    evidenceId: 'quote:coinapi:BTC:USD:test',
    ...overrides,
  };
}

describe('gateway-governed crypto spot observation conversion', () => {
  it('converts LIVE canonical snapshots while preserving provenance', () => {
    expect(marketObservationFromCanonicalSnapshot(snapshot())).toEqual({
      provider: 'CoinAPI',
      value: 65_000,
      observedAt: '2026-08-31T18:00:00.000Z',
      retrievedAt: '2026-08-31T18:00:01.000Z',
      unit: 'USD',
      evidenceId: 'quote:coinapi:BTC:USD:test',
    });
  });

  it('accepts DELAYED evidence but rejects HISTORICAL and STALE evidence for current consensus', () => {
    expect(marketObservationFromCanonicalSnapshot(snapshot({ qualityState: 'DELAYED', isRealtime: false, isDelayed: true }))).not.toBeNull();
    expect(marketObservationFromCanonicalSnapshot(snapshot({ qualityState: 'HISTORICAL', isRealtime: false }))).toBeNull();
    expect(marketObservationFromCanonicalSnapshot(snapshot({ qualityState: 'STALE', isRealtime: false }))).toBeNull();
  });

  it('fails closed when price or provenance is missing', () => {
    expect(marketObservationFromCanonicalSnapshot(snapshot({ price: null }))).toBeNull();
    expect(marketObservationFromCanonicalSnapshot(snapshot({ evidenceId: null }))).toBeNull();
    expect(marketObservationFromCanonicalSnapshot(snapshot({ sourceTimestamp: null }))).toBeNull();
    expect(marketObservationFromCanonicalSnapshot(snapshot({ currency: null }))).toBeNull();
  });

  it('fails closed for invalid numeric values rather than coercing to zero', () => {
    expect(marketObservationFromCanonicalSnapshot(snapshot({ price: 0 }))).toBeNull();
    expect(marketObservationFromCanonicalSnapshot(snapshot({ price: Number.NaN }))).toBeNull();
    expect(marketObservationFromCanonicalSnapshot(snapshot({ price: Number.POSITIVE_INFINITY }))).toBeNull();
  });
});

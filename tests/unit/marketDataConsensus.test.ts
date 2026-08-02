import { describe, expect, it } from 'vitest';
import { evaluateMarketConsensus, type MarketObservation } from '../../src/services/marketDataConsensus';

const baseTime = '2026-08-02T08:00:00.000Z';

function observation(provider: string, value: number, offsetMs = 0): MarketObservation {
  const observedAt = new Date(Date.parse(baseTime) + offsetMs).toISOString();
  return {
    provider,
    value,
    observedAt,
    retrievedAt: new Date(Date.parse(observedAt) + 100).toISOString(),
    unit: 'USD',
    evidenceId: `evidence:${provider}:${observedAt}`,
  };
}

describe('marketDataConsensus', () => {
  it('returns consensus when independent providers agree inside tolerance', () => {
    const result = evaluateMarketConsensus([
      observation('A', 100),
      observation('B', 100.2, 500),
      observation('C', 99.9, 800),
    ], { toleranceBps: 30, minimumSources: 2 });

    expect(result.status).toBe('CONSENSUS');
    expect(result.canonicalValue).not.toBeNull();
    expect(result.providers).toHaveLength(3);
    expect(result.evidenceIds).toHaveLength(3);
  });

  it('fails closed instead of averaging conflicting prices', () => {
    const result = evaluateMarketConsensus([
      observation('A', 100),
      observation('B', 108, 500),
    ], { toleranceBps: 50, minimumSources: 2 });

    expect(result.status).toBe('SOURCE_CONFLICT');
    expect(result.canonicalValue).toBeNull();
    expect(result.maxDeviationBps).toBeGreaterThan(50);
  });

  it('requires independent provider identities', () => {
    const result = evaluateMarketConsensus([
      observation('A', 100),
      observation('A', 100.1, 100),
    ], { minimumSources: 2 });

    expect(result.status).toBe('INSUFFICIENT_SOURCES');
    expect(result.canonicalValue).toBeNull();
  });

  it('rejects observations outside the allowed timestamp skew', () => {
    const result = evaluateMarketConsensus([
      observation('A', 100),
      observation('B', 100.1, 120_000),
    ], { maxObservationSkewMs: 60_000 });

    expect(result.status).toBe('SOURCE_CONFLICT');
    expect(result.canonicalValue).toBeNull();
  });
});

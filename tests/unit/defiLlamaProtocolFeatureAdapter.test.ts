import { describe, expect, it } from 'vitest';
import {
  adaptDefiLlamaFeesToFeatureEvidence,
  adaptDefiLlamaProtocolTvlToFeatureEvidence,
} from '../../src/platform/FinTechCore/Modules/Crypto/Adapters/DefiLlamaProtocolFeatureAdapter';
import type {
  DefiLlamaFeesResult,
  DefiLlamaProtocolTvlResult,
} from '../../src/platform/MarketData/providers/DefiLlamaProtocolProvider';

function tvlResult(overrides: Partial<DefiLlamaProtocolTvlResult> = {}): DefiLlamaProtocolTvlResult {
  return {
    contractVersion: 'defillama-protocol-evidence/1.0.0',
    status: 'VERIFIED',
    slug: 'aave',
    tvlUsd: 10_800_000_000,
    observedAt: '2024-08-16T00:00:00.000Z',
    retrievedAt: '2024-08-16T00:00:05.000Z',
    evidenceId: 'defillama:protocol-tvl:aave:2024-08-16T00:00:00.000Z',
    cacheMode: 'fresh',
    ...overrides,
  };
}

function feesResult(overrides: Partial<DefiLlamaFeesResult> = {}): DefiLlamaFeesResult {
  return {
    contractVersion: 'defillama-protocol-evidence/1.0.0',
    status: 'VERIFIED',
    slug: 'aave',
    feesUsd24h: 250_000,
    revenueUsd24h: 90_000,
    observedAt: '2024-08-16T00:00:05.000Z',
    retrievedAt: '2024-08-16T00:00:05.000Z',
    evidenceId: 'defillama:overview-fees:aave:2024-08-16T00:00:05.000Z',
    cacheMode: 'fresh',
    ...overrides,
  };
}

describe('adaptDefiLlamaProtocolTvlToFeatureEvidence', () => {
  it('maps a VERIFIED result onto protocol.tvlUsd with evidence refs', () => {
    const evidence = adaptDefiLlamaProtocolTvlToFeatureEvidence(tvlResult());
    expect(evidence.key).toBe('protocol.tvlUsd');
    expect(evidence.status).toBe('VERIFIED');
    expect(evidence.value).toBe(10_800_000_000);
    expect(evidence.provider).toBe('DeFiLlama');
    expect(evidence.evidenceRefs).toEqual(['defillama:protocol-tvl:aave:2024-08-16T00:00:00.000Z']);
    expect(evidence.degraded).toBe(false);
  });

  it('maps NOT_AVAILABLE to null value, never a substitute number', () => {
    const evidence = adaptDefiLlamaProtocolTvlToFeatureEvidence(
      tvlResult({ status: 'NOT_AVAILABLE', tvlUsd: null, observedAt: null, evidenceId: null, reason: 'no data' }),
    );
    expect(evidence.status).toBe('NOT_AVAILABLE');
    expect(evidence.value).toBeNull();
    expect(evidence.provider).toBeNull();
    expect(evidence.evidenceRefs).toEqual([]);
  });

  it('marks last-known-good cache mode as degraded STALE evidence', () => {
    const evidence = adaptDefiLlamaProtocolTvlToFeatureEvidence(
      tvlResult({ status: 'STALE', cacheMode: 'last-known-good' }),
    );
    expect(evidence.status).toBe('STALE');
    expect(evidence.degraded).toBe(true);
    expect(evidence.value).toBe(10_800_000_000);
  });

  it('maps INVALID to null value with a reason, never coerced to zero', () => {
    const evidence = adaptDefiLlamaProtocolTvlToFeatureEvidence(
      tvlResult({ status: 'INVALID', tvlUsd: null, observedAt: null, evidenceId: null, reason: 'non-finite TVL' }),
    );
    expect(evidence.status).toBe('INVALID');
    expect(evidence.value).toBeNull();
    expect(evidence.reason).toBe('non-finite TVL');
  });
});

describe('adaptDefiLlamaFeesToFeatureEvidence', () => {
  it('maps VERIFIED fees/revenue onto two independent feature keys', () => {
    const [fees, revenue] = adaptDefiLlamaFeesToFeatureEvidence(feesResult());
    expect(fees.key).toBe('protocol.feesUsd');
    expect(fees.value).toBe(250_000);
    expect(revenue.key).toBe('protocol.revenueUsd');
    expect(revenue.value).toBe(90_000);
    expect(fees.provider).toBe('DeFiLlama');
    expect(revenue.provider).toBe('DeFiLlama');
  });

  it('keeps one field NOT_AVAILABLE independently when only it is missing', () => {
    const [fees, revenue] = adaptDefiLlamaFeesToFeatureEvidence(
      feesResult({ revenueUsd24h: null, status: 'INVALID' }),
    );
    expect(fees.status).toBe('INVALID');
    expect(fees.value).toBe(250_000);
    expect(revenue.status).toBe('NOT_AVAILABLE');
    expect(revenue.value).toBeNull();
  });

  it('maps a fully NOT_AVAILABLE result to two NOT_AVAILABLE evidence entries', () => {
    const [fees, revenue] = adaptDefiLlamaFeesToFeatureEvidence(
      feesResult({ status: 'NOT_AVAILABLE', feesUsd24h: null, revenueUsd24h: null, evidenceId: null, reason: 'no entry' }),
    );
    expect(fees.status).toBe('NOT_AVAILABLE');
    expect(revenue.status).toBe('NOT_AVAILABLE');
    expect(fees.evidenceRefs).toEqual([]);
    expect(revenue.evidenceRefs).toEqual([]);
  });
});

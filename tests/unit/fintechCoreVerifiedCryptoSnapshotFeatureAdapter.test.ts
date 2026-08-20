import { describe, expect, it } from 'vitest';
import type { VerifiedCryptoSnapshot } from '../../src/services/cryptoSnapshotProvider';
import { adaptVerifiedCryptoSnapshotToUniversalEvidence } from '../../src/platform/FinTechCore/Modules/Crypto/Adapters/VerifiedCryptoSnapshotFeatureAdapter';

function snapshot(overrides: Partial<VerifiedCryptoSnapshot> = {}): VerifiedCryptoSnapshot {
  const observedAt = '2026-08-20T12:00:00.000Z';
  const retrievedAt = '2026-08-20T12:00:01.000Z';
  return {
    symbol: 'BTC',
    provider: 'CoinGecko',
    observedAt,
    retrievedAt,
    priceUsd: 100_000,
    marketCapUsd: 2_000_000_000_000,
    maxSupply: null,
    provenance: {
      priceUsd: {
        field: 'priceUsd',
        provider: 'CoinGecko',
        sourcePath: 'market_data.current_price.usd',
        observedAt,
        retrievedAt,
        value: 100_000,
        unit: 'USD',
      },
      marketCapUsd: {
        field: 'marketCapUsd',
        provider: 'CoinGecko',
        sourcePath: 'market_data.market_cap.usd',
        observedAt,
        retrievedAt,
        value: 2_000_000_000_000,
        unit: 'USD',
      },
      maxSupply: {
        field: 'maxSupply',
        provider: 'CoinGecko',
        sourcePath: 'market_data.max_supply',
        observedAt,
        retrievedAt,
        value: null,
        unit: 'token',
      },
    },
    cacheMode: 'fresh',
    degraded: false,
    ...overrides,
  };
}

describe('FinTech Core verified crypto snapshot feature adapter', () => {
  it('maps only provider-provenance-backed market/supply fields into universal evidence', () => {
    const evidence = adaptVerifiedCryptoSnapshotToUniversalEvidence(snapshot());

    expect(evidence.map(item => item.key)).toEqual([
      'market.priceUsd',
      'market.marketCapUsd',
      'tokenomics.maxSupply',
    ]);
    expect(evidence.find(item => item.key === 'market.priceUsd')).toMatchObject({
      status: 'VERIFIED',
      value: 100_000,
      provider: 'CoinGecko',
    });
    expect(evidence.find(item => item.key === 'tokenomics.maxSupply')).toMatchObject({
      status: 'NOT_AVAILABLE',
      value: null,
      provider: 'CoinGecko',
    });
  });

  it('marks last-known-good/degraded snapshots stale rather than verified', () => {
    const evidence = adaptVerifiedCryptoSnapshotToUniversalEvidence(snapshot({
      cacheMode: 'last-known-good',
      degraded: true,
    }));

    expect(evidence.filter(item => item.value !== null).every(item => item.status === 'STALE')).toBe(true);
    expect(evidence.find(item => item.key === 'market.priceUsd')?.reason).toMatch(/last-known-good\/degraded/i);
  });

  it('emits deterministic evidence references for traceability', () => {
    const evidence = adaptVerifiedCryptoSnapshotToUniversalEvidence(snapshot());
    const price = evidence.find(item => item.key === 'market.priceUsd');

    expect(price?.evidenceRefs).toEqual([
      'crypto-snapshot:coingecko:BTC:priceUsd:2026-08-20T12:00:00.000Z',
    ]);
  });

  it('does not expose a score or execution-grade flag', () => {
    const evidence = adaptVerifiedCryptoSnapshotToUniversalEvidence(snapshot());
    const serialized = JSON.stringify(evidence);

    expect(serialized).not.toContain('final_score');
    expect(serialized).not.toContain('CanonicalScoreResult');
    expect(serialized).not.toContain('executionPriceEligible');
  });
});

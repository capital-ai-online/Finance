import { describe, expect, it } from 'vitest';
import {
  CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
  COMMODITY_EVIDENCE_EXECUTOR_KEY,
  LEGACY_CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
  SCORING_MODEL_REGISTRY_VERSION,
  SOVEREIGN_BENCHMARK_EXECUTOR_KEY,
  ScoringModelRegistry,
  TRADITIONAL_SCORING_EXECUTOR_KEY,
  adaptCatalogCandidateToUniversal,
  adaptRegistryAssetToUniversal,
  createUniversalAssetIdentity,
  scoringModelRegistry,
  type ScoringModelDescriptor,
} from '../../src/platform/Scoring';

describe('SC-2 Universal Asset Interface', () => {
  it('normalizes registry assets into identity-only UAI records', () => {
    const asset = adaptRegistryAssetToUniversal({
      symbol: ' btc ',
      name: 'Bitcoin',
      type: 'crypto',
      subtype: 'standard',
    });

    expect(asset.assetId).toBe('crypto:BTC');
    expect(asset.symbol).toBe('BTC');
    expect(asset.source).toBe('registry');
    expect((asset as any).price).toBeUndefined();
    expect((asset as any).score).toBeUndefined();
  });

  it('preserves catalog instrument identity without treating catalog metadata as evidence', () => {
    const asset = adaptCatalogCandidateToUniversal({
      symbol: 'GB_DE_10Y',
      name: 'Germany 10Y Government Benchmark Yield',
      type: 'bond',
      instrumentKind: 'government-benchmark-yield',
    });

    expect(asset.assetId).toBe('bond:GB_DE_10Y');
    expect(asset.instrumentKind).toBe('government-benchmark-yield');
    expect(asset.source).toBe('catalog');
    expect((asset as any).catalogSource).toBeUndefined();
    expect((asset as any).screeningContract).toBeUndefined();
  });
});

describe('SC-2 ScoringModelRegistry', () => {
  it('resolves crypto through the verified canonical champion', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'BTC', assetClass: 'crypto' });
    const resolution = scoringModelRegistry.resolve(asset);

    expect(resolution.status).toBe('RESOLVED');
    if (resolution.status !== 'RESOLVED') return;
    expect(resolution.model.modelId).toBe('crypto-technical-provenance');
    expect(resolution.model.version).toBe('0.7.0');
    expect(resolution.model.resultContractVersion).toBe(CANONICAL_SCORE_RESULT_CONTRACT_VERSION);
    expect(resolution.model.canonicalResultAdapterRequired).toBe(false);
  });

  it('routes stock/forex/index to the existing traditional model family without forcing a P0 contract migration', () => {
    for (const assetClass of ['stock', 'forex', 'index'] as const) {
      const resolution = scoringModelRegistry.resolve(
        createUniversalAssetIdentity({ symbol: 'TEST', assetClass }),
      );
      expect(resolution.status).toBe('RESOLVED');
      if (resolution.status === 'RESOLVED') {
        expect(resolution.model.modelId).toBe('traditional-scoring');
        expect(resolution.model.version).toBe('2.1.0');
        expect(resolution.model.resultContractVersion).toBe(LEGACY_CANONICAL_SCORE_RESULT_CONTRACT_VERSION);
        expect(resolution.model.executorKey).toBe(TRADITIONAL_SCORING_EXECUTOR_KEY);
        expect(resolution.model.canonicalResultAdapterRequired).toBe(false);
      }
    }
  });

  it('binds commodity and approved sovereign benchmark models to their existing dispatcher contracts', () => {
    const commodity = scoringModelRegistry.resolve(createUniversalAssetIdentity({ symbol: 'GLD', assetClass: 'commodity' }));
    expect(commodity.status).toBe('RESOLVED');
    if (commodity.status === 'RESOLVED') {
      expect(commodity.model.executorKey).toBe(COMMODITY_EVIDENCE_EXECUTOR_KEY);
      expect(commodity.model.resultContractVersion).toBe(LEGACY_CANONICAL_SCORE_RESULT_CONTRACT_VERSION);
      expect(commodity.model.canonicalResultAdapterRequired).toBe(false);
    }

    const benchmark = scoringModelRegistry.resolve(createUniversalAssetIdentity({
      symbol: 'GB_DE_10Y',
      assetClass: 'bond',
      instrumentKind: 'government-benchmark-yield',
    }));
    expect(benchmark.status).toBe('RESOLVED');
    if (benchmark.status === 'RESOLVED') {
      expect(benchmark.model.modelId).toBe('sovereign-benchmark-yield-scoring');
      expect(benchmark.model.executorKey).toBe(SOVEREIGN_BENCHMARK_EXECUTOR_KEY);
      expect(benchmark.model.resultContractVersion).toBe(LEGACY_CANONICAL_SCORE_RESULT_CONTRACT_VERSION);
      expect(benchmark.model.canonicalResultAdapterRequired).toBe(false);
    }

    const individualBond = scoringModelRegistry.resolve(createUniversalAssetIdentity({
      symbol: 'DE0001102622',
      assetClass: 'bond',
      instrumentKind: 'individual-bond',
    }));
    expect(individualBond.status).toBe('SCORE_NOT_COMPUTABLE');
  });

  it('fails closed at registration on equal-priority champion ambiguity', () => {
    const make = (modelId: string): ScoringModelDescriptor => ({
      registryVersion: SCORING_MODEL_REGISTRY_VERSION,
      modelId,
      version: '1.0.0',
      alias: 'champion',
      lifecycle: 'canonical',
      assetClasses: ['stock'],
      featureContractVersion: 'test-features/1.0.0',
      resultContractVersion: CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
      evidencePolicy: 'verified-required',
      executorKey: `test.${modelId}`,
      priority: 100,
      canonicalResultAdapterRequired: false,
    });

    expect(() => new ScoringModelRegistry([make('a'), make('b')]))
      .toThrow('SCORING_MODEL_REGISTRY_AMBIGUOUS_SCOPE:stock/*:a@1.0.0:b@1.0.0');
  });

  it('never promotes legacy models as fallback champions', () => {
    const legacy: ScoringModelDescriptor = {
      registryVersion: SCORING_MODEL_REGISTRY_VERSION,
      modelId: 'legacy-crypto-agent-score',
      version: '1.0.0',
      alias: 'legacy',
      lifecycle: 'legacy',
      assetClasses: ['crypto'],
      featureContractVersion: 'legacy/1.0.0',
      resultContractVersion: 'legacy/1.0.0',
      evidencePolicy: 'research-only',
      executorKey: 'legacy.cryptoOrchestrator',
      priority: 999,
      canonicalResultAdapterRequired: true,
    };
    const registry = new ScoringModelRegistry([legacy]);
    const resolution = registry.resolve(createUniversalAssetIdentity({ symbol: 'BTC', assetClass: 'crypto' }));

    expect(resolution.status).toBe('SCORE_NOT_COMPUTABLE');
  });
});

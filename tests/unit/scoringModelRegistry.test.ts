import { describe, expect, it } from 'vitest';
import {
  CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
  SCORING_MODEL_REGISTRY_VERSION,
  ScoringModelRegistry,
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
    expect(resolution.model.version).toBe('0.6.3');
    expect(resolution.model.resultContractVersion).toBe(CANONICAL_SCORE_RESULT_CONTRACT_VERSION);
    expect(resolution.model.canonicalResultAdapterRequired).toBe(false);
  });

  it('routes stock/forex/index to one traditional model family', () => {
    for (const assetClass of ['stock', 'forex', 'index'] as const) {
      const resolution = scoringModelRegistry.resolve(
        createUniversalAssetIdentity({ symbol: 'TEST', assetClass }),
      );
      expect(resolution.status).toBe('RESOLVED');
      if (resolution.status === 'RESOLVED') {
        expect(resolution.model.modelId).toBe('traditional-scoring');
        expect(resolution.model.version).toBe('2.1.0');
        expect(resolution.model.canonicalResultAdapterRequired).toBe(true);
      }
    }
  });

  it('resolves only approved sovereign benchmark-yield bond semantics', () => {
    const benchmark = scoringModelRegistry.resolve(createUniversalAssetIdentity({
      symbol: 'GB_DE_10Y',
      assetClass: 'bond',
      instrumentKind: 'government-benchmark-yield',
    }));
    expect(benchmark.status).toBe('RESOLVED');
    if (benchmark.status === 'RESOLVED') {
      expect(benchmark.model.modelId).toBe('sovereign-benchmark-yield-scoring');
    }

    const individualBond = scoringModelRegistry.resolve(createUniversalAssetIdentity({
      symbol: 'DE0001102622',
      assetClass: 'bond',
      instrumentKind: 'individual-bond',
    }));
    expect(individualBond.status).toBe('SCORE_NOT_COMPUTABLE');
  });

  it('fails closed on equal-priority champion ambiguity instead of choosing by iteration order', () => {
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
    const registry = new ScoringModelRegistry([make('a'), make('b')]);
    const resolution = registry.resolve(createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock' }));

    expect(resolution.status).toBe('SCORE_NOT_COMPUTABLE');
    if (resolution.status === 'SCORE_NOT_COMPUTABLE') {
      expect(resolution.reason).toContain('Ambiguous canonical scoring model routing');
    }
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

import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
  CANONICAL_SCORING_DISPATCHER_VERSION,
  SCORING_MODEL_REGISTRY_VERSION,
  ScoringModelRegistry,
  VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY,
  dispatchCanonicalScore,
  type ScoringModelDescriptor,
} from '../../src/platform/Scoring';

function cryptoModel(overrides: Partial<ScoringModelDescriptor> = {}): ScoringModelDescriptor {
  return {
    registryVersion: SCORING_MODEL_REGISTRY_VERSION,
    modelId: 'crypto-test',
    version: '1.0.0',
    alias: 'champion',
    lifecycle: 'canonical',
    assetClasses: ['crypto'],
    featureContractVersion: 'crypto-test-features/1.0.0',
    resultContractVersion: CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
    evidencePolicy: 'verified-required',
    executorKey: VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY,
    priority: 100,
    canonicalResultAdapterRequired: false,
    ...overrides,
  };
}

function assessment(symbol = 'BTC') {
  return {
    canonical: {
      status: 'READY' as const,
      score: 7.4,
      final_score: 74,
      integrity: {
        status: 'READY' as const,
        assetId: `crypto:${symbol}`,
        providers: ['test-provider'],
        retrievedAt: '2026-08-19T00:00:00.000Z',
        dataQuality: 'high' as const,
        featureVersion: 'crypto-test-features/1.0.0',
        scoringVersion: CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
        coverage: 1,
        evidence: [],
        missingFields: [],
      },
    },
    inputs: { coin: symbol } as any,
    analysis: null,
    fieldProvenance: [],
    rankingEvidenceReady: false,
    priceStats: null,
    providerState: {},
  };
}

describe('SC-2 canonical scoring dispatcher', () => {
  it('builds UAI identity, resolves the canonical champion and invokes the bound executor exactly once', async () => {
    const cryptoExecutor = vi.fn(async (symbol: string) => assessment(symbol));

    const result = await dispatchCanonicalScore(
      { symbol: ' btc ', name: 'Bitcoin', assetClass: 'crypto', source: 'request' },
      { cryptoExecutor },
    );

    expect(result.status).toBe('DISPATCHED');
    expect(result.dispatcherVersion).toBe(CANONICAL_SCORING_DISPATCHER_VERSION);
    expect(result.asset.assetId).toBe('crypto:BTC');
    expect(result.asset.source).toBe('request');
    expect(cryptoExecutor).toHaveBeenCalledTimes(1);
    expect(cryptoExecutor).toHaveBeenCalledWith('BTC');
    if (result.status === 'DISPATCHED') {
      expect(result.model.modelId).toBe('crypto-technical-provenance');
      expect(result.model.version).toBe('0.6.3');
      expect(result.canonical.status).toBe('READY');
    }
  });

  it('fails closed without invoking an executor when registry binding is incompatible', async () => {
    const registry = new ScoringModelRegistry([
      cryptoModel({ executorKey: 'legacy.cryptoOrchestrator' }),
    ]);
    const cryptoExecutor = vi.fn(async (symbol: string) => assessment(symbol));

    const result = await dispatchCanonicalScore(
      { symbol: 'ETH', assetClass: 'crypto', source: 'registry' },
      { registry, cryptoExecutor },
    );

    expect(result.status).toBe('SCORE_NOT_COMPUTABLE');
    expect(result.canonical.status).toBe('SCORE_NOT_COMPUTABLE');
    expect(result.canonical.score).toBeNull();
    expect(result.canonical.integrity.assetId).toBe('crypto:ETH');
    expect(result.canonical.integrity.missingFields).toEqual(['scoringModel']);
    expect(cryptoExecutor).not.toHaveBeenCalled();
  });

  it('fails closed for an asset class whose registered executor still requires an adapter', async () => {
    const cryptoExecutor = vi.fn(async (symbol: string) => assessment(symbol));
    const result = await dispatchCanonicalScore(
      { symbol: 'AAPL', assetClass: 'stock', source: 'registry' },
      { cryptoExecutor },
    );

    expect(result.status).toBe('SCORE_NOT_COMPUTABLE');
    expect(result.asset.assetId).toBe('stock:AAPL');
    expect(cryptoExecutor).not.toHaveBeenCalled();
  });

  it('keeps the verified domain-scorer import confined to the dispatcher boundary', () => {
    const dispatcher = readFileSync(new URL('../../src/platform/Scoring/ScoringDispatcher.ts', import.meta.url), 'utf8');
    const routes = readFileSync(new URL('../../src/routes/cryptoRoutes.ts', import.meta.url), 'utf8');
    const orchestrator = readFileSync(new URL('../../src/orchestrator/cryptoOrchestrator.ts', import.meta.url), 'utf8');
    const defiUi = readFileSync(new URL('../../src/components/DeFiOrchestration.tsx', import.meta.url), 'utf8');

    expect(dispatcher).toContain("from '../../services/verifiedCryptoTechnicalScoring'");
    expect(routes).not.toContain('verifiedCryptoTechnicalScoring');
    expect(orchestrator).not.toContain('verifiedCryptoTechnicalScoring');
    expect(defiUi).not.toContain('verifiedCryptoTechnicalScoring');
  });
});

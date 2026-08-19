import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
  SCORING_MODEL_REGISTRY_VERSION,
  ScoringModelRegistry,
  VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY,
  buildCryptoRegistryResolutionFailure,
  resolveCryptoScoreExecution,
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

describe('SC-2 crypto list/top10 registry consumers', () => {
  it('preserves registry-backed UAI identity for cataloged crypto assets', () => {
    const resolution = resolveCryptoScoreExecution({
      symbol: ' btc ',
      name: 'Bitcoin',
      subtype: 'layer-1',
      source: 'registry',
    });

    expect(resolution.status).toBe('RESOLVED');
    if (resolution.status !== 'RESOLVED') return;
    expect(resolution.asset.assetId).toBe('crypto:BTC');
    expect(resolution.asset.source).toBe('registry');
    expect(resolution.asset.subtype).toBe('layer-1');
    expect(resolution.model.modelId).toBe('crypto-technical-provenance');
    expect(resolution.model.executorKey).toBe(VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY);
  });

  it('returns a canonical SCORE_NOT_COMPUTABLE envelope when registry execution binding fails', () => {
    const registry = new ScoringModelRegistry([
      cryptoModel({ executorKey: 'legacy.cryptoOrchestrator' }),
    ]);
    const resolution = resolveCryptoScoreExecution({ symbol: 'ETH', source: 'registry' }, registry);

    expect(resolution.status).toBe('SCORE_NOT_COMPUTABLE');
    if (resolution.status !== 'SCORE_NOT_COMPUTABLE') return;

    const canonical = buildCryptoRegistryResolutionFailure(resolution);
    expect(canonical.status).toBe('SCORE_NOT_COMPUTABLE');
    expect(canonical.score).toBeNull();
    expect(canonical.final_score).toBeNull();
    expect(canonical.integrity.assetId).toBe('crypto:ETH');
    expect(canonical.integrity.providers).toEqual([]);
    expect(canonical.integrity.missingFields).toEqual(['scoringModel']);
    expect(canonical.integrity.reason).toContain('not executable by the canonical crypto score adapter');
  });

  it('wires GET /list through registry resolution before verified scoring', () => {
    const source = readFileSync(new URL('../../src/routes/cryptoRoutes.ts', import.meta.url), 'utf8');
    const listStart = source.indexOf("router.get('/list'");
    const priceStart = source.indexOf("router.get('/price-consensus/:symbol'", listStart);
    const listRoute = source.slice(listStart, priceStart);

    expect(listStart).toBeGreaterThanOrEqual(0);
    expect(priceStart).toBeGreaterThan(listStart);
    expect(listRoute).toContain('resolveCryptoScoreExecution');
    expect(listRoute).toContain("source: 'registry'");
    expect(listRoute.indexOf('resolveCryptoScoreExecution')).toBeLessThan(
      listRoute.indexOf('evaluateVerifiedCryptoTechnicalScore'),
    );
    expect(listRoute).toContain('execution.asset.assetId');
    expect(listRoute).toContain('model: registeredModel');
    expect(listRoute).toContain('modelRegistry');
    expect(listRoute).toContain('buildCryptoRegistryResolutionFailure');
  });

  it('wires GET /top10 through registry resolution before verified scoring', () => {
    const source = readFileSync(new URL('../../src/routes/cryptoRoutes.ts', import.meta.url), 'utf8');
    const top10Start = source.indexOf("router.get('/top10'");
    const routerEnd = source.indexOf('return router;', top10Start);
    const top10Route = source.slice(top10Start, routerEnd);

    expect(top10Start).toBeGreaterThanOrEqual(0);
    expect(routerEnd).toBeGreaterThan(top10Start);
    expect(top10Route).toContain('resolveCryptoScoreExecution');
    expect(top10Route).toContain("source: 'registry'");
    expect(top10Route.indexOf('resolveCryptoScoreExecution')).toBeLessThan(
      top10Route.indexOf('evaluateVerifiedCryptoTechnicalScore'),
    );
    expect(top10Route).toContain('execution.asset.assetId');
    expect(top10Route).toContain('model: registeredModel');
    expect(top10Route).toContain('modelRegistry');
    expect(top10Route).toContain("if (execution.status !== 'RESOLVED') return null;");
  });
});

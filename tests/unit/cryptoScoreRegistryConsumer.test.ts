import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
  SCORING_MODEL_REGISTRY_VERSION,
  ScoringModelRegistry,
  VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY,
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

describe('SC-2 crypto score registry consumer', () => {
  it('resolves the production crypto score request through UAI and the canonical champion', () => {
    const resolution = resolveCryptoScoreExecution({ symbol: ' btc ', name: 'Bitcoin' });

    expect(resolution.status).toBe('RESOLVED');
    if (resolution.status !== 'RESOLVED') return;
    expect(resolution.asset.assetId).toBe('crypto:BTC');
    expect(resolution.asset.source).toBe('request');
    expect(resolution.model.modelId).toBe('crypto-technical-provenance');
    expect(resolution.model.version).toBe('0.6.3');
    expect(resolution.model.executorKey).toBe(VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY);
  });

  it('fails closed when the registry points crypto at an executor not bound to this consumer', () => {
    const registry = new ScoringModelRegistry([
      cryptoModel({ executorKey: 'legacy.cryptoOrchestrator' }),
    ]);
    const resolution = resolveCryptoScoreExecution({ symbol: 'ETH' }, registry);

    expect(resolution.status).toBe('SCORE_NOT_COMPUTABLE');
    if (resolution.status === 'SCORE_NOT_COMPUTABLE') {
      expect(resolution.reason).toContain('not executable by the canonical crypto score adapter');
    }
  });

  it('fails closed when the resolved model still requires a canonical result adapter', () => {
    const registry = new ScoringModelRegistry([
      cryptoModel({ canonicalResultAdapterRequired: true }),
    ]);
    const resolution = resolveCryptoScoreExecution({ symbol: 'SOL' }, registry);

    expect(resolution.status).toBe('SCORE_NOT_COMPUTABLE');
  });

  it('wires POST /score through registry resolution before invoking verified scoring', () => {
    const source = readFileSync(new URL('../../src/routes/cryptoRoutes.ts', import.meta.url), 'utf8');
    const scoreStart = source.indexOf("router.post('/score'");
    const top10Start = source.indexOf("router.get('/top10'", scoreStart);
    const scoreRoute = source.slice(scoreStart, top10Start);

    expect(scoreStart).toBeGreaterThanOrEqual(0);
    expect(top10Start).toBeGreaterThan(scoreStart);
    expect(scoreRoute).toContain('resolveCryptoScoreExecution');
    expect(scoreRoute.indexOf('resolveCryptoScoreExecution')).toBeLessThan(
      scoreRoute.indexOf('evaluateVerifiedCryptoTechnicalScore'),
    );
    expect(scoreRoute).toContain('modelRegistry');
    expect(scoreRoute).toContain('execution.asset.assetId');
  });
});

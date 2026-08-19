import { describe, expect, it } from 'vitest';
import {
  createUniversalAssetIdentity,
  dispatchCanonicalScore,
  executeTraditionalCanonicalScore,
} from '../../src/platform/Scoring';
import type { TraditionalAssetScoringInputs } from '../../src/services/traditionalAssetScoring';

function verifiedInputs(): TraditionalAssetScoringInputs {
  return {
    symbol: 'AAPL',
    assetType: 'stock',
    trend: 0.82,
    momentum: 0.68,
    provenance: [
      {
        field: 'trend',
        provider: 'Stooq',
        sourcePath: 'test://stooq/aapl/history',
        retrievedAt: '2026-08-19T08:00:00.000Z',
        observedAt: '2026-08-19T00:00:00.000Z',
        value: 0.82,
        derivedFrom: ['close-history'],
      },
      {
        field: 'momentum',
        provider: 'Stooq',
        sourcePath: 'test://stooq/aapl/history',
        retrievedAt: '2026-08-19T08:00:00.000Z',
        observedAt: '2026-08-19T00:00:00.000Z',
        value: 0.68,
        derivedFrom: ['close-history'],
      },
    ],
  };
}

describe('SC-2 C3 canonical executor adapters', () => {
  it('normalizes the existing Traditional model into CanonicalScoreResult without changing its score math', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock', source: 'catalog' });
    const result = executeTraditionalCanonicalScore(asset, verifiedInputs());

    expect(result.usedFactors).toEqual(expect.arrayContaining(['trend', 'momentum']));
    expect(result.canonical.status).toBe('READY');
    expect(result.canonical.final_score).toBeCloseTo(result.score, 2);
    expect(result.canonical.score).toBeCloseTo(result.score / 10, 1);
    expect(result.canonical.integrity.assetId).toBe('stock:AAPL');
    expect(result.canonical.integrity.providers).toEqual(['Stooq']);
    expect(result.canonical.integrity.evidence.length).toBe(2);
  });

  it('fails closed when Traditional numeric factors have no provider provenance', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock' });
    const result = executeTraditionalCanonicalScore(asset, {
      ...verifiedInputs(),
      provenance: [],
    });

    expect(result.canonical.status).toBe('SCORE_NOT_COMPUTABLE');
    expect(result.canonical.score).toBeNull();
    expect(result.canonical.final_score).toBeNull();
  });

  it('binds dispatcher UAI and registered model traceability to Traditional results', async () => {
    const dispatch = await dispatchCanonicalScore({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      assetClass: 'stock',
      source: 'catalog',
      execution: { kind: 'traditional', inputs: verifiedInputs() },
    });

    expect(dispatch.status).toBe('DISPATCHED');
    if (dispatch.status !== 'DISPATCHED') return;
    expect(dispatch.asset.assetId).toBe('stock:AAPL');
    expect(dispatch.model.modelId).toBe('traditional-scoring');
    expect(dispatch.canonical.integrity.modelId).toBe('traditional-scoring');
    expect(dispatch.canonical.integrity.modelVersion).toBe('2.1.0');
    expect(dispatch.canonical.integrity.modelAlias).toBe('champion');
    expect(dispatch.canonical.integrity.executorKey).toBe(dispatch.model.executorKey);
  });
});

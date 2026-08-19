import { describe, expect, it } from 'vitest';
import { createUniversalAssetIdentity, scoringModelRegistry } from '../../src/platform/Scoring';
import { buildScoringLineage } from '../../src/services/scoringLineage';

describe('scoring lineage', () => {
  it('links correlation, retrieval, model selection, features, provenance and evidence ids', () => {
    const resolution = scoringModelRegistry.resolve(
      createUniversalAssetIdentity({ symbol: 'ETH', assetClass: 'crypto' }),
    );
    expect(resolution.status).toBe('RESOLVED');
    if (resolution.status !== 'RESOLVED') return;

    const lineage = buildScoringLineage({
      correlationId: 'req-123:ETH',
      assetId: 'crypto:ETH',
      model: resolution.model,
      canonical: {
        status: 'READY',
        score: 7.5,
        final_score: 75,
        integrity: {
          status: 'READY',
          assetId: 'ETH',
          providers: ['CoinGecko'],
          observedAt: '2026-08-02T06:00:00.000Z',
          retrievedAt: '2026-08-02T06:00:01.000Z',
          dataQuality: 'high',
          featureVersion: 'feature/1',
          scoringVersion: 'score/1',
          coverage: 0.8,
          evidence: [{ id: 'ev-1', source: 'CoinGecko', observedAt: '2026-08-02T06:00:00.000Z', retrievedAt: '2026-08-02T06:00:01.000Z', kind: 'market-history' }],
          missingFields: [],
        },
      },
      scoringInputs: { coin: 'ETH', trend: 0.7, momentum: 0.6 },
      fieldProvenance: [{ field: 'marketCapUsd', provider: 'CoinGecko', sourcePath: 'market_data.market_cap.usd', observedAt: '2026-08-02T06:00:00.000Z', retrievedAt: '2026-08-02T06:00:01.000Z', value: 1, unit: 'USD' }],
      providerState: { history: { cacheMode: 'fresh', degraded: false } },
    });

    expect(lineage.correlationId).toBe('req-123:ETH');
    expect(lineage.assetId).toBe('crypto:ETH');
    expect(lineage.model?.modelId).toBe('crypto-technical-provenance');
    expect(lineage.model?.version).toBe('0.6.3');
    expect(lineage.model?.alias).toBe('champion');
    expect(lineage.features).toEqual(['momentum', 'trend']);
    expect(lineage.provenanceFields).toEqual(['marketCapUsd']);
    expect(lineage.evidenceIds).toEqual(['ev-1']);
    expect(lineage.scoringVersion).toBe('score/1');
    expect(lineage.retrieval.history?.cacheMode).toBe('fresh');
  });
});

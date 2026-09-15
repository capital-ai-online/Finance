import { describe, expect, it } from 'vitest';
import {
  BACKEND_RANKING_PROJECTION_CONTRACT_VERSION,
  buildBackendRankingProjection,
} from '../../src/platform/Ranking';
import {
  CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
  SCORING_MODEL_REGISTRY_VERSION,
  type UniversalAssetClass,
} from '../../src/platform/Scoring/contracts';
import type { CanonicalScoreResult } from '../../src/types/scoringIntegrity';
import { decorateScreeningBatchWithGovernance } from '../../src/services/screeningBatchGovernance';

function canonical(
  symbol: string,
  assetClass: UniversalAssetClass,
  score: number,
  featureVersion = 'traditional-features/2.1.0',
): CanonicalScoreResult {
  const assetId = `${assetClass}:${symbol.toUpperCase()}`;
  return {
    status: 'READY',
    score,
    final_score: score,
    integrity: {
      status: 'READY',
      assetId,
      providers: ['TwelveData'],
      retrievedAt: '2026-09-15T18:00:00.000Z',
      dataQuality: 'high',
      featureVersion,
      scoringVersion: 'traditional-scoring@2.1.0',
      coverage: 1,
      evidence: [],
      missingFields: [],
      dispatcherVersion: 'canonical-scoring-dispatcher/1.1.0',
      modelRegistryVersion: SCORING_MODEL_REGISTRY_VERSION,
      modelId: 'traditional-scoring',
      modelVersion: '2.1.0',
      modelAlias: 'champion',
      modelLifecycle: 'canonical',
      executorKey: 'traditional-scoring.executor',
      resultContractVersion: CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
    },
  };
}

const healthyTelemetry = [{
  provider: 'TwelveData',
  successes: 10,
  failures: 0,
  consecutiveFailures: 0,
  cooldownUntilMs: 0,
  ewmaLatencyMs: 200,
}];

describe('FIN-17 backend ranking authority', () => {
  it('orders a comparable cohort in the backend and exposes deterministic rank metadata', () => {
    const result = buildBackendRankingProjection([
      {
        symbol: 'MSFT',
        assetClass: 'stock',
        canonical: canonical('MSFT', 'stock', 82),
        source: 'catalog',
        governance: { eligible: true, operationsState: 'HEALTHY' },
      },
      {
        symbol: 'AAPL',
        assetClass: 'stock',
        canonical: canonical('AAPL', 'stock', 87),
        source: 'catalog',
        governance: { eligible: true, operationsState: 'HEALTHY' },
      },
    ]);

    expect(result.contractVersion).toBe(BACKEND_RANKING_PROJECTION_CONTRACT_VERSION);
    expect(result.authority).toBe('CrossAssetRanking');
    expect(result.result.cohorts).toHaveLength(1);
    expect(result.result.cohorts[0].entries.map(entry => [entry.symbol, entry.rank])).toEqual([
      ['AAPL', 1],
      ['MSFT', 2],
    ]);
  });

  it('never invents cross-cohort order when intended-use contracts differ', () => {
    const result = buildBackendRankingProjection([
      {
        symbol: 'AAPL',
        assetClass: 'stock',
        canonical: canonical('AAPL', 'stock', 87),
        source: 'catalog',
        governance: { eligible: true, operationsState: 'HEALTHY' },
      },
      {
        symbol: 'TSLA',
        assetClass: 'stock',
        canonical: canonical('TSLA', 'stock', 92, 'traditional-features/3.0.0'),
        source: 'catalog',
        governance: { eligible: true, operationsState: 'HEALTHY' },
      },
    ]);

    expect(result.result.cohorts).toHaveLength(2);
    expect(result.result.cohorts.every(cohort => cohort.crossCohortOrder === false)).toBe(true);
  });

  it('attaches backend rank metadata to governed verified-score batch rows without changing scores', () => {
    const result = decorateScreeningBatchWithGovernance([
      {
        correlationId: 'root:MSFT',
        symbol: 'MSFT',
        name: 'Microsoft',
        assetType: 'stock',
        status: 'READY',
        score: 82,
        final_score: 82,
        integrity: canonical('MSFT', 'stock', 82).integrity,
        providers: ['TwelveData'],
        evidenceIds: ['ev-msft'],
        observedAt: '2026-09-15T18:00:00.000Z',
      },
      {
        correlationId: 'root:AAPL',
        symbol: 'AAPL',
        name: 'Apple',
        assetType: 'stock',
        status: 'READY',
        score: 87,
        final_score: 87,
        integrity: canonical('AAPL', 'stock', 87).integrity,
        providers: ['TwelveData'],
        evidenceIds: ['ev-aapl'],
        observedAt: '2026-09-15T18:00:00.000Z',
      },
    ], healthyTelemetry, {
      nowMs: Date.parse('2026-09-15T18:05:00.000Z'),
    });

    expect(result.results.map(item => item.score)).toEqual([82, 87]);
    expect(result.backendRankingAuthority).toBe('CrossAssetRanking');
    expect(result.results.find(item => item.symbol === 'AAPL')?.backendRanking.rank).toBe(1);
    expect(result.results.find(item => item.symbol === 'MSFT')?.backendRanking.rank).toBe(2);
    expect(result.results.every(item => item.backendRanking.crossCohortOrder === false)).toBe(true);
  });
});

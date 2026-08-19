import { describe, expect, it } from 'vitest';
import {
  CROSS_ASSET_RANKING_CONTRACT_VERSION,
  CROSS_ASSET_RANKING_IMPACT_ENABLED,
  rankCanonicalUniverse,
  type CanonicalRankingCandidate,
  type GrowthRankingEvidence,
  type ScoreComparabilityEvidence,
} from '../../src/platform/Ranking';
import {
  CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
  SCORING_MODEL_REGISTRY_VERSION,
  UNIVERSAL_ASSET_CONTRACT_VERSION,
  type UniversalAssetClass,
} from '../../src/platform/Scoring/contracts';
import { RANKING_SCORE_IMPACT_ENABLED } from '../../src/services/ranking.service';

function candidate(options: {
  symbol: string;
  assetClass: UniversalAssetClass;
  score: number;
  modelId: string;
  modelVersion: string;
  category?: string;
  tier?: 1 | 2 | 3;
  scoreComparability?: ScoreComparabilityEvidence;
  growth?: GrowthRankingEvidence;
}): CanonicalRankingCandidate {
  const assetId = `${options.assetClass}:${options.symbol.toUpperCase()}`;
  return {
    asset: {
      contractVersion: UNIVERSAL_ASSET_CONTRACT_VERSION,
      assetId,
      symbol: options.symbol.toUpperCase(),
      assetClass: options.assetClass,
      source: 'registry',
    },
    canonical: {
      status: 'READY',
      score: options.score,
      final_score: options.score,
      integrity: {
        status: 'READY',
        assetId,
        providers: ['test-provider'],
        retrievedAt: '2026-08-19T10:00:00.000Z',
        dataQuality: 'high',
        featureVersion: 'test-features/1.0.0',
        scoringVersion: `${options.modelId}@${options.modelVersion}`,
        coverage: 1,
        evidence: [],
        missingFields: [],
        dispatcherVersion: 'canonical-scoring-dispatcher/1.1.0',
        modelRegistryVersion: SCORING_MODEL_REGISTRY_VERSION,
        modelId: options.modelId,
        modelVersion: options.modelVersion,
        modelAlias: 'champion',
        modelLifecycle: 'canonical',
        executorKey: `${options.modelId}.executor`,
        resultContractVersion: CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
      },
    },
    category: options.category,
    tier: options.tier,
    scoreComparability: options.scoreComparability,
    growth: options.growth,
    governance: { eligible: true, operationsState: 'HEALTHY' },
  };
}

function comparability(
  normalizedValue: number,
  comparisonKey = 'global-calibrated-score:v1',
  methodVersion = 'cross-model-calibration/1.0.0',
): ScoreComparabilityEvidence {
  return {
    normalizedValue,
    comparisonKey,
    methodVersion,
    evidenceId: `calibration-${normalizedValue}`,
    observedAt: '2026-08-19T09:59:00.000Z',
    retrievedAt: '2026-08-19T10:00:00.000Z',
    verified: true,
  };
}

function growth(value: number, comparisonKey = 'total-return-pct:30d:v1'): GrowthRankingEvidence {
  return {
    value,
    comparisonKey,
    evidenceId: `growth-${value}`,
    observedAt: '2026-08-19T09:59:00.000Z',
    retrievedAt: '2026-08-19T10:00:00.000Z',
    verified: true,
  };
}

describe('SC-7 cross-asset ranking generalization', () => {
  it('is shadow-only and keeps both ranking impact switches disabled', () => {
    expect(CROSS_ASSET_RANKING_CONTRACT_VERSION).toBe('cross-asset-ranking/1.0.0');
    expect(CROSS_ASSET_RANKING_IMPACT_ENABLED).toBe(false);
    expect(RANKING_SCORE_IMPACT_ENABLED).toBe(false);
  });

  it('isolates default cohorts by model version AND asset class', () => {
    const result = rankCanonicalUniverse(
      [
        candidate({ symbol: 'BTC', assetClass: 'crypto', score: 9.1, modelId: 'crypto-technical-provenance', modelVersion: '0.6.3' }),
        candidate({ symbol: 'AAPL', assetClass: 'stock', score: 87, modelId: 'traditional-scoring', modelVersion: '2.1.0' }),
        candidate({ symbol: 'MSFT', assetClass: 'stock', score: 82, modelId: 'traditional-scoring', modelVersion: '2.1.0' }),
        candidate({ symbol: 'EURUSD', assetClass: 'forex', score: 91, modelId: 'traditional-scoring', modelVersion: '2.1.0' }),
      ],
      'overall',
    );

    expect(result.status).toBe('READY');
    expect(result.cohorts).toHaveLength(3);
    expect(result.cohorts.every((cohort) => cohort.crossCohortOrder === false)).toBe(true);
    expect(result.cohorts.every((cohort) => cohort.comparisonBasis === 'canonical-score-same-model-asset-class')).toBe(true);

    const stocks = result.cohorts.find((cohort) => cohort.key.includes('asset-class:stock'));
    expect(stocks?.entries.map((entry) => entry.symbol)).toEqual(['AAPL', 'MSFT']);
    expect(stocks?.entries.map((entry) => entry.rank)).toEqual([1, 2]);

    const forex = result.cohorts.find((cohort) => cohort.key.includes('asset-class:forex'));
    expect(forex?.entries.map((entry) => entry.symbol)).toEqual(['EURUSD']);
    expect(result.cohorts.some((cohort) => cohort.entries.some((entry) => entry.symbol === 'AAPL') && cohort.entries.some((entry) => entry.symbol === 'EURUSD'))).toBe(false);
  });

  it('allows cross-model and cross-asset ranking only with verified normalized evidence', () => {
    const result = rankCanonicalUniverse(
      [
        candidate({
          symbol: 'BTC', assetClass: 'crypto', score: 9.1,
          modelId: 'crypto-technical-provenance', modelVersion: '0.6.3',
          scoreComparability: comparability(91),
        }),
        candidate({
          symbol: 'AAPL', assetClass: 'stock', score: 87,
          modelId: 'traditional-scoring', modelVersion: '2.1.0',
          scoreComparability: comparability(87),
        }),
      ],
      'overall',
    );

    expect(result.cohorts).toHaveLength(1);
    expect(result.cohorts[0].entries.map((entry) => entry.symbol)).toEqual(['BTC', 'AAPL']);
    expect(result.cohorts[0].entries.map((entry) => entry.rankingValue)).toEqual([91, 87]);
    expect(result.cohorts[0].comparisonBasis).toBe('verified-normalized-score');
  });

  it('rejects asserted comparability when normalization evidence is unverified', () => {
    const item = candidate({
      symbol: 'BTC', assetClass: 'crypto', score: 9.1,
      modelId: 'crypto-technical-provenance', modelVersion: '0.6.3',
      scoreComparability: { ...comparability(91), verified: false },
    });
    const result = rankCanonicalUniverse([item], 'overall');
    expect(result.status).toBe('NO_RANKABLE_ASSETS');
    expect(result.excluded[0].reason).toBe('COMPARABILITY_EVIDENCE_UNVERIFIED');
  });

  it('keeps category and tier modes inside explicit peer cohorts', () => {
    const categoryResult = rankCanonicalUniverse(
      [
        candidate({ symbol: 'BTC', assetClass: 'crypto', score: 9, modelId: 'crypto-technical-provenance', modelVersion: '0.6.3', category: 'Layer 1', tier: 1 }),
        candidate({ symbol: 'ETH', assetClass: 'crypto', score: 8.8, modelId: 'crypto-technical-provenance', modelVersion: '0.6.3', category: 'Layer 1', tier: 1 }),
        candidate({ symbol: 'SOL', assetClass: 'crypto', score: 8.6, modelId: 'crypto-technical-provenance', modelVersion: '0.6.3', tier: 1 }),
      ],
      'category',
    );
    expect(categoryResult.status).toBe('PARTIAL');
    expect(categoryResult.cohorts[0].entries.map((entry) => entry.symbol)).toEqual(['BTC', 'ETH']);
    expect(categoryResult.excluded).toContainEqual(expect.objectContaining({ assetId: 'crypto:SOL', reason: 'CATEGORY_MISSING' }));

    const tierResult = rankCanonicalUniverse(
      [
        candidate({ symbol: 'AAPL', assetClass: 'stock', score: 85, modelId: 'traditional-scoring', modelVersion: '2.1.0', tier: 1 }),
        candidate({ symbol: 'MSFT', assetClass: 'stock', score: 81, modelId: 'traditional-scoring', modelVersion: '2.1.0' }),
      ],
      'tier',
    );
    expect(tierResult.excluded).toContainEqual(expect.objectContaining({ assetId: 'stock:MSFT', reason: 'TIER_MISSING' }));
  });

  it('growth mode ranks only verified evidence sharing an explicit comparison contract', () => {
    const valid = rankCanonicalUniverse(
      [
        candidate({ symbol: 'BTC', assetClass: 'crypto', score: 9, modelId: 'crypto-technical-provenance', modelVersion: '0.6.3', growth: growth(12.4) }),
        candidate({ symbol: 'AAPL', assetClass: 'stock', score: 85, modelId: 'traditional-scoring', modelVersion: '2.1.0', growth: growth(8.2) }),
      ],
      'growth',
    );
    expect(valid.cohorts).toHaveLength(1);
    expect(valid.cohorts[0].comparisonBasis).toBe('verified-growth-evidence');
    expect(valid.cohorts[0].entries.map((entry) => entry.symbol)).toEqual(['BTC', 'AAPL']);
    expect(valid.cohorts[0].entries.map((entry) => entry.rankingValue)).toEqual([12.4, 8.2]);

    const unverified = candidate({
      symbol: 'ETH', assetClass: 'crypto', score: 8.8,
      modelId: 'crypto-technical-provenance', modelVersion: '0.6.3',
      growth: { ...growth(4.2), verified: false },
    });
    const rejected = rankCanonicalUniverse([unverified], 'growth');
    expect(rejected.status).toBe('NO_RANKABLE_ASSETS');
    expect(rejected.excluded[0].reason).toBe('GROWTH_EVIDENCE_UNVERIFIED');
  });

  it('fails closed for governance, identity, lineage and operations defects', () => {
    const noGovernance = candidate({ symbol: 'BTC', assetClass: 'crypto', score: 9, modelId: 'crypto-technical-provenance', modelVersion: '0.6.3' });
    noGovernance.governance = null;

    const identityDrift = candidate({ symbol: 'ETH', assetClass: 'crypto', score: 8.8, modelId: 'crypto-technical-provenance', modelVersion: '0.6.3' });
    identityDrift.canonical.integrity.assetId = 'crypto:WRONG';

    const noLineage = candidate({ symbol: 'SOL', assetClass: 'crypto', score: 8.5, modelId: 'crypto-technical-provenance', modelVersion: '0.6.3' });
    delete noLineage.canonical.integrity.dispatcherVersion;

    const unavailable = candidate({ symbol: 'AAPL', assetClass: 'stock', score: 82, modelId: 'traditional-scoring', modelVersion: '2.1.0' });
    unavailable.governance = { eligible: true, operationsState: 'NO_RUNTIME_EVIDENCE' };

    const result = rankCanonicalUniverse([noGovernance, identityDrift, noLineage, unavailable], 'overall');
    expect(result.status).toBe('NO_RANKABLE_ASSETS');
    expect(result.excluded.map((item) => item.reason).sort()).toEqual([
      'GOVERNANCE_EVIDENCE_MISSING',
      'IDENTITY_MISMATCH',
      'MODEL_LINEAGE_MISSING',
      'OPERATIONS_EVIDENCE_UNAVAILABLE',
    ].sort());
  });

  it('uses assetId as the deterministic tie-breaker and rejects duplicate identities', () => {
    const a = candidate({ symbol: 'AAA', assetClass: 'stock', score: 80, modelId: 'traditional-scoring', modelVersion: '2.1.0' });
    const b = candidate({ symbol: 'BBB', assetClass: 'stock', score: 80, modelId: 'traditional-scoring', modelVersion: '2.1.0' });
    const result = rankCanonicalUniverse([b, a, { ...a }], 'overall');
    expect(result.cohorts[0].entries.map((entry) => entry.assetId)).toEqual(['stock:AAA', 'stock:BBB']);
    expect(result.cohorts[0].entries.map((entry) => entry.tieBreaker)).toEqual(['stock:AAA', 'stock:BBB']);
    expect(result.excluded).toContainEqual(expect.objectContaining({ assetId: 'stock:AAA', reason: 'DUPLICATE_ASSET' }));
  });
});

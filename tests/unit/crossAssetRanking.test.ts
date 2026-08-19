import { describe, expect, it } from 'vitest';
import {
  CROSS_ASSET_RANKING_CONTRACT_VERSION,
  CROSS_ASSET_RANKING_IMPACT_ENABLED,
  rankCanonicalUniverse,
  type CanonicalRankingCandidate,
  type GrowthRankingEvidence,
} from '../../src/platform/Ranking';
import {
  CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
  SCORING_MODEL_REGISTRY_VERSION,
  UNIVERSAL_ASSET_CONTRACT_VERSION,
  type UniversalAssetClass,
} from '../../src/platform/Scoring/contracts';

function candidate(options: {
  symbol: string;
  assetClass: UniversalAssetClass;
  score: number;
  modelId: string;
  modelVersion: string;
  category?: string;
  tier?: 1 | 2 | 3;
  scoreComparisonKey?: string;
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
    scoreComparisonKey: options.scoreComparisonKey,
    growth: options.growth,
    governance: {
      eligible: true,
      operationsState: 'HEALTHY',
    },
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
  it('is shadow-only and keeps productive ranking impact disabled', () => {
    expect(CROSS_ASSET_RANKING_CONTRACT_VERSION).toBe('cross-asset-ranking/1.0.0');
    expect(CROSS_ASSET_RANKING_IMPACT_ENABLED).toBe(false);
  });

  it('does not interleave different model families without an explicit comparability key', () => {
    const result = rankCanonicalUniverse(
      [
        candidate({
          symbol: 'BTC',
          assetClass: 'crypto',
          score: 9.1,
          modelId: 'crypto-technical-provenance',
          modelVersion: '0.6.3',
        }),
        candidate({
          symbol: 'AAPL',
          assetClass: 'stock',
          score: 8.7,
          modelId: 'traditional-scoring',
          modelVersion: '2.1.0',
        }),
        candidate({
          symbol: 'EURUSD',
          assetClass: 'forex',
          score: 8.2,
          modelId: 'traditional-scoring',
          modelVersion: '2.1.0',
        }),
      ],
      'overall',
    );

    expect(result.status).toBe('READY');
    expect(result.cohorts).toHaveLength(2);
    expect(result.cohorts.every((cohort) => cohort.crossCohortOrder === false)).toBe(true);
    const traditional = result.cohorts.find((cohort) => cohort.entries.some((entry) => entry.symbol === 'AAPL'));
    expect(traditional?.entries.map((entry) => entry.symbol)).toEqual(['AAPL', 'EURUSD']);
    expect(traditional?.entries.map((entry) => entry.rank)).toEqual([1, 2]);
  });

  it('allows cross-model ranking only when an upstream validated scoreComparisonKey is explicit', () => {
    const result = rankCanonicalUniverse(
      [
        candidate({
          symbol: 'BTC',
          assetClass: 'crypto',
          score: 9.1,
          modelId: 'crypto-technical-provenance',
          modelVersion: '0.6.3',
          scoreComparisonKey: 'calibrated-global-v1',
        }),
        candidate({
          symbol: 'AAPL',
          assetClass: 'stock',
          score: 8.7,
          modelId: 'traditional-scoring',
          modelVersion: '2.1.0',
          scoreComparisonKey: 'calibrated-global-v1',
        }),
      ],
      'overall',
    );

    expect(result.cohorts).toHaveLength(1);
    expect(result.cohorts[0].entries.map((entry) => entry.symbol)).toEqual(['BTC', 'AAPL']);
    expect(result.cohorts[0].comparisonBasis).toBe('canonical-score');
  });

  it('keeps category and tier modes inside explicit peer cohorts and fails closed on missing metadata', () => {
    const categoryResult = rankCanonicalUniverse(
      [
        candidate({
          symbol: 'BTC',
          assetClass: 'crypto',
          score: 9,
          modelId: 'crypto-technical-provenance',
          modelVersion: '0.6.3',
          category: 'Layer 1',
          tier: 1,
        }),
        candidate({
          symbol: 'ETH',
          assetClass: 'crypto',
          score: 8.8,
          modelId: 'crypto-technical-provenance',
          modelVersion: '0.6.3',
          category: 'Layer 1',
          tier: 1,
        }),
        candidate({
          symbol: 'SOL',
          assetClass: 'crypto',
          score: 8.6,
          modelId: 'crypto-technical-provenance',
          modelVersion: '0.6.3',
          tier: 1,
        }),
      ],
      'category',
    );

    expect(categoryResult.status).toBe('PARTIAL');
    expect(categoryResult.cohorts).toHaveLength(1);
    expect(categoryResult.cohorts[0].entries.map((entry) => entry.symbol)).toEqual(['BTC', 'ETH']);
    expect(categoryResult.excluded).toContainEqual(
      expect.objectContaining({ assetId: 'crypto:SOL', reason: 'CATEGORY_MISSING' }),
    );

    const tierResult = rankCanonicalUniverse(
      [
        candidate({
          symbol: 'AAPL',
          assetClass: 'stock',
          score: 8.5,
          modelId: 'traditional-scoring',
          modelVersion: '2.1.0',
          tier: 1,
        }),
        candidate({
          symbol: 'EURUSD',
          assetClass: 'forex',
          score: 8.1,
          modelId: 'traditional-scoring',
          modelVersion: '2.1.0',
        }),
      ],
      'tier',
    );

    expect(tierResult.excluded).toContainEqual(
      expect.objectContaining({ assetId: 'forex:EURUSD', reason: 'TIER_MISSING' }),
    );
  });

  it('growth mode ranks only verified evidence sharing an explicit comparison contract', () => {
    const valid = rankCanonicalUniverse(
      [
        candidate({
          symbol: 'BTC',
          assetClass: 'crypto',
          score: 9,
          modelId: 'crypto-technical-provenance',
          modelVersion: '0.6.3',
          growth: growth(12.4),
        }),
        candidate({
          symbol: 'AAPL',
          assetClass: 'stock',
          score: 8.5,
          modelId: 'traditional-scoring',
          modelVersion: '2.1.0',
          growth: growth(8.2),
        }),
      ],
      'growth',
    );

    expect(valid.cohorts).toHaveLength(1);
    expect(valid.cohorts[0].comparisonBasis).toBe('verified-growth-evidence');
    expect(valid.cohorts[0].entries.map((entry) => entry.symbol)).toEqual(['BTC', 'AAPL']);
    expect(valid.cohorts[0].entries.map((entry) => entry.rankingValue)).toEqual([12.4, 8.2]);

    const unverified = candidate({
      symbol: 'ETH',
      assetClass: 'crypto',
      score: 8.8,
      modelId: 'crypto-technical-provenance',
      modelVersion: '0.6.3',
      growth: { ...growth(4.2), verified: false },
    });
    const rejected = rankCanonicalUniverse([unverified], 'growth');
    expect(rejected.status).toBe('NO_RANKABLE_ASSETS');
    expect(rejected.excluded[0].reason).toBe('GROWTH_EVIDENCE_UNVERIFIED');
  });

  it('fails closed for missing governance, identity drift, missing model lineage and unavailable operations evidence', () => {
    const noGovernance = candidate({
      symbol: 'BTC',
      assetClass: 'crypto',
      score: 9,
      modelId: 'crypto-technical-provenance',
      modelVersion: '0.6.3',
    });
    noGovernance.governance = null;

    const identityDrift = candidate({
      symbol: 'ETH',
      assetClass: 'crypto',
      score: 8.8,
      modelId: 'crypto-technical-provenance',
      modelVersion: '0.6.3',
    });
    identityDrift.canonical.integrity.assetId = 'crypto:WRONG';

    const noLineage = candidate({
      symbol: 'SOL',
      assetClass: 'crypto',
      score: 8.5,
      modelId: 'crypto-technical-provenance',
      modelVersion: '0.6.3',
    });
    delete noLineage.canonical.integrity.dispatcherVersion;

    const unavailable = candidate({
      symbol: 'AAPL',
      assetClass: 'stock',
      score: 8.2,
      modelId: 'traditional-scoring',
      modelVersion: '2.1.0',
    });
    unavailable.governance = { eligible: true, operationsState: 'NO_RUNTIME_EVIDENCE' };

    const result = rankCanonicalUniverse([noGovernance, identityDrift, noLineage, unavailable], 'overall');
    expect(result.status).toBe('NO_RANKABLE_ASSETS');
    expect(result.excluded.map((item) => item.reason).sort()).toEqual(
      [
        'GOVERNANCE_EVIDENCE_MISSING',
        'IDENTITY_MISMATCH',
        'MODEL_LINEAGE_MISSING',
        'OPERATIONS_EVIDENCE_UNAVAILABLE',
      ].sort(),
    );
  });

  it('uses assetId as the only deterministic tie-breaker and excludes duplicate identities', () => {
    const a = candidate({
      symbol: 'AAA',
      assetClass: 'stock',
      score: 8,
      modelId: 'traditional-scoring',
      modelVersion: '2.1.0',
    });
    const b = candidate({
      symbol: 'BBB',
      assetClass: 'stock',
      score: 8,
      modelId: 'traditional-scoring',
      modelVersion: '2.1.0',
    });
    const duplicate = { ...a };

    const result = rankCanonicalUniverse([b, a, duplicate], 'overall');
    expect(result.cohorts[0].entries.map((entry) => entry.assetId)).toEqual(['stock:AAA', 'stock:BBB']);
    expect(result.cohorts[0].entries.map((entry) => entry.tieBreaker)).toEqual(['stock:AAA', 'stock:BBB']);
    expect(result.excluded).toContainEqual(
      expect.objectContaining({ assetId: 'stock:AAA', reason: 'DUPLICATE_ASSET' }),
    );
  });
});

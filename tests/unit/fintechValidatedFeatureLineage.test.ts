import { describe, expect, it } from 'vitest';
import {
  MARKET_DATA_CONTRACT_VERSION,
  type CanonicalMarketDataSnapshot,
} from '../../src/platform/MarketData/contracts';
import { buildValidatedDataInputFromSnapshot } from '../../src/platform/MarketData/ValidatedDataInput';
import { buildBackendRankingProjection } from '../../src/platform/Ranking/BackendRankingProjection';
import { CANONICAL_SCORING_DISPATCHER_VERSION } from '../../src/platform/Scoring/ScoringDispatcher';
import { scoringModelRegistry } from '../../src/platform/Scoring/ScoringModelRegistry';
import { createUniversalAssetIdentity } from '../../src/platform/Scoring/UniversalAssetAdapter';
import {
  mapValidatedDataToFinancialFeatureContract,
} from '../../src/platform/Scoring/ValidatedFinancialFeatureContract';
import { buildFintechScoringTraceLineage } from '../../src/platform/Scoring/FintechScoringTraceLineage';
import type { CanonicalScoreResult } from '../../src/types/scoringIntegrity';

const asset = createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock' });
const resolution = scoringModelRegistry.resolve(asset);
if (resolution.status !== 'RESOLVED') throw new Error(resolution.reason);
const model = resolution.model;
const EVALUATED_AT = '2026-09-16T12:00:00.000Z';
const EVIDENCE_REF = 'evd:test-live:AAPL:price';

function snapshot(
  overrides: Partial<CanonicalMarketDataSnapshot> = {},
): CanonicalMarketDataSnapshot {
  return {
    contractVersion: MARKET_DATA_CONTRACT_VERSION,
    provider: 'test-live',
    providerFeed: 'iex',
    symbol: 'AAPL',
    assetClass: 'stock',
    currency: 'USD',
    sourceTimestamp: '2026-09-16T11:59:30.000Z',
    ingestedAt: '2026-09-16T11:59:31.000Z',
    receivedAt: '2026-09-16T11:59:31.000Z',
    freshnessMs: 30_000,
    qualityState: 'LIVE',
    isRealtime: true,
    isDelayed: false,
    correlationId: 'corr-fin12-fin20-aapl',
    price: 210.25,
    evidenceId: EVIDENCE_REF,
    ...overrides,
  };
}

function mappedFeature() {
  const validated = buildValidatedDataInputFromSnapshot(
    asset,
    snapshot(),
    { maxAgeMs: 90_000, evaluatedAt: EVALUATED_AT },
  );
  const mapping = mapValidatedDataToFinancialFeatureContract(
    validated,
    model,
    [{ featureKey: 'market_price', sourceField: 'price' }],
  );
  if (mapping.status !== 'READY') throw new Error(mapping.reasons.join(','));
  return mapping.contract;
}

function canonical(overrides: Partial<CanonicalScoreResult['integrity']> = {}): CanonicalScoreResult {
  return {
    status: 'READY',
    score: 81,
    final_score: 81,
    integrity: {
      status: 'READY',
      assetId: asset.assetId,
      providers: ['test-live'],
      observedAt: '2026-09-16T11:59:30.000Z',
      retrievedAt: '2026-09-16T11:59:31.000Z',
      dataQuality: 'high',
      featureVersion: model.featureContractVersion,
      scoringVersion: `${model.modelId}/${model.version}`,
      coverage: 1,
      evidence: [{
        id: EVIDENCE_REF,
        source: 'test-live',
        observedAt: '2026-09-16T11:59:30.000Z',
        retrievedAt: '2026-09-16T11:59:31.000Z',
        kind: 'market-snapshot',
      }],
      missingFields: [],
      dispatcherVersion: CANONICAL_SCORING_DISPATCHER_VERSION,
      modelRegistryVersion: model.registryVersion,
      modelId: model.modelId,
      modelVersion: model.version,
      modelAlias: model.alias,
      modelLifecycle: model.lifecycle,
      executorKey: model.executorKey,
      resultContractVersion: model.resultContractVersion,
      ...overrides,
    },
  };
}

describe('FIN-12 validated DATA -> financial feature mapping', () => {
  it('preserves exact identity, correlation, provenance and target feature-contract version', () => {
    const feature = mappedFeature();

    expect(feature.assetId).toBe('stock:AAPL');
    expect(feature.correlationId).toBe('corr-fin12-fin20-aapl');
    expect(feature.targetFeatureContractVersion).toBe(model.featureContractVersion);
    expect(feature.evidenceRefs).toEqual([EVIDENCE_REF]);
    expect(feature.providers).toEqual(['test-live']);
    expect(feature.features).toEqual([expect.objectContaining({
      featureKey: 'market_price',
      sourceField: 'price',
      value: 210.25,
      evidenceRef: EVIDENCE_REF,
      providerId: 'test-live',
      dataStatus: 'PASS',
    })]);
  });

  it('fails closed for stale DATA and exports no feature contract', () => {
    const stale = buildValidatedDataInputFromSnapshot(
      asset,
      snapshot({
        sourceTimestamp: '2026-09-16T09:00:00.000Z',
        ingestedAt: '2026-09-16T09:00:01.000Z',
        receivedAt: '2026-09-16T09:00:01.000Z',
      }),
      { maxAgeMs: 90_000, evaluatedAt: EVALUATED_AT },
    );

    const mapping = mapValidatedDataToFinancialFeatureContract(
      stale,
      model,
      [{ featureKey: 'market_price', sourceField: 'price' }],
    );

    expect(mapping.status).toBe('FEATURE_NOT_COMPUTABLE');
    expect(mapping.contract).toBeNull();
    if (mapping.status === 'FEATURE_NOT_COMPUTABLE') {
      expect(mapping.reasons).toContain('aggregate-status:STALE');
    }
  });

  it('rejects one DATA observation being silently reused as two financial features', () => {
    const validated = buildValidatedDataInputFromSnapshot(
      asset,
      snapshot(),
      { maxAgeMs: 90_000, evaluatedAt: EVALUATED_AT },
    );
    const mapping = mapValidatedDataToFinancialFeatureContract(
      validated,
      model,
      [
        { featureKey: 'market_price', sourceField: 'price' },
        { featureKey: 'price_proxy', sourceField: 'price' },
      ],
    );

    expect(mapping.status).toBe('FEATURE_NOT_COMPUTABLE');
    if (mapping.status === 'FEATURE_NOT_COMPUTABLE') {
      expect(mapping.reasons).toContain('duplicate-source-field');
    }
  });
});

describe('FIN-20 DATA -> feature -> score -> rank -> OPS trace handoff lineage', () => {
  it('keeps DATA evidence identity and correlation through canonical score and backend rank', () => {
    const feature = mappedFeature();
    const scored = canonical();
    const ranking = buildBackendRankingProjection([{
      symbol: 'AAPL',
      assetClass: 'stock',
      canonical: scored,
      governance: { eligible: true, operationsState: 'HEALTHY' },
    }]);

    const result = buildFintechScoringTraceLineage({
      feature,
      canonical: scored,
      ranking,
      generatedAt: '2026-09-16T12:00:01.000Z',
    });

    expect(result.status).toBe('READY');
    if (result.status !== 'READY') return;
    expect(result.lineage.assetId).toBe('stock:AAPL');
    expect(result.lineage.correlationId).toBe('corr-fin12-fin20-aapl');
    expect(result.lineage.data.evidenceRefs).toEqual([EVIDENCE_REF]);
    expect(result.lineage.scoring.evidenceRefs).toEqual([EVIDENCE_REF]);
    expect(result.lineage.ranking.rank).toBe(1);
    expect(result.lineage.ranking.authority).toBe('CrossAssetRanking');
    expect(result.lineage.opsTraceHandoff).toEqual(expect.objectContaining({
      targetProject: 'CAPITAL-AI-OPS',
      targetPvc: 'PVC-18',
      semantics: 'EVIDENCE_ONLY',
      correlationId: 'corr-fin12-fin20-aapl',
      sourceEvidenceRefs: [EVIDENCE_REF],
    }));
    expect(result.lineage.opsTraceHandoff.requiredBinding).toEqual({
      mode: 'STRICT_IDENTITY_CORRELATION',
      correlationId: 'corr-fin12-fin20-aapl',
      evidenceIdentityRefs: [EVIDENCE_REF],
    });
  });

  it('fails closed when canonical scoring drops the DATA evidence identity', () => {
    const feature = mappedFeature();
    const scored = canonical({ evidence: [] });
    const ranking = buildBackendRankingProjection([{
      symbol: 'AAPL',
      assetClass: 'stock',
      canonical: scored,
      governance: { eligible: true, operationsState: 'HEALTHY' },
    }]);

    const result = buildFintechScoringTraceLineage({ feature, canonical: scored, ranking });
    expect(result.status).toBe('LINEAGE_NOT_COMPUTABLE');
    if (result.status === 'LINEAGE_NOT_COMPUTABLE') {
      expect(result.reasons).toContain(`score-evidence-lineage-missing:${EVIDENCE_REF}`);
    }
  });

  it('fails closed when no exact backend rank exists for the DATA/scoring identity', () => {
    const feature = mappedFeature();
    const scored = canonical();
    const ranking = buildBackendRankingProjection([]);

    const result = buildFintechScoringTraceLineage({ feature, canonical: scored, ranking });
    expect(result.status).toBe('LINEAGE_NOT_COMPUTABLE');
    if (result.status === 'LINEAGE_NOT_COMPUTABLE') {
      expect(result.reasons).toContain('rank-entry-missing');
    }
  });
});

import { describe, expect, it } from 'vitest';
import {
  COMMODITY_BACKTEST_CONTRACT_VERSION,
  COMMODITY_COST_ASSUMPTION_CONTRACT_VERSION,
  COMMODITY_HISTORICAL_DATASET_CONTRACT_VERSION,
  COMMODITY_POINT_IN_TIME_POLICY_VERSION,
  COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION,
  buildCommodityDriveWeightResearchPlan,
  buildCommodityOosSplitPlan,
  executeCommodityHistoricalBacktest,
  validateCommodityHistoricalDataset,
  type CommodityBacktestCostAssumptions,
  type CommodityBacktestRequest,
  type CommodityCandidateWeightProfile,
  type CommodityHistoricalDataset,
  type CommodityHistoricalObservation,
} from '../../src/platform/Scoring';

function energyProfile(): CommodityCandidateWeightProfile {
  const plan = buildCommodityDriveWeightResearchPlan('commodity-energy-hybrid');
  return {
    contractVersion: COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION,
    profileId: 'energy-research-candidate-a',
    profileVersion: 'commodity-energy-factor-weights/0.1.0-research',
    modelId: 'commodity-energy-hybrid',
    modelVersion: '0.1.0',
    status: 'research-candidate',
    executable: false,
    factorWeights: {
      marketStructure: 0.2,
      physicalBalance: 0.2,
      carryStructure: 0.2,
      positioning: 0.2,
      supplyRisk: 0.2,
    },
    factorAggregations: [
      {
        latentFactor: 'marketStructure',
        featureKeys: ['market.priceHistory'],
        renormalizationPolicy: 'WITHIN_LATENT_FACTOR_ONLY',
      },
      {
        latentFactor: 'physicalBalance',
        featureKeys: [
          'fundamentals.inventoryLevel',
          'fundamentals.production',
          'fundamentals.supplyDemandBalance',
        ],
        renormalizationPolicy: 'WITHIN_LATENT_FACTOR_ONLY',
      },
      {
        latentFactor: 'carryStructure',
        featureKeys: ['market.termStructure'],
        renormalizationPolicy: 'WITHIN_LATENT_FACTOR_ONLY',
      },
      {
        latentFactor: 'positioning',
        featureKeys: ['positioning.managedMoneyNetPctOi'],
        renormalizationPolicy: 'WITHIN_LATENT_FACTOR_ONLY',
      },
      {
        latentFactor: 'supplyRisk',
        featureKeys: ['risk.supplyConcentration'],
        renormalizationPolicy: 'WITHIN_LATENT_FACTOR_ONLY',
      },
    ],
    sourceHypothesis: plan.sourceHypothesis,
  };
}

const request: CommodityBacktestRequest = {
  contractVersion: COMMODITY_BACKTEST_CONTRACT_VERSION,
  modelId: 'commodity-energy-hybrid',
  modelVersion: '0.1.0',
  universeId: 'commodity-energy-test-universe/v1',
  assetClass: 'commodity',
  domains: ['energy'],
  startDate: '2025-01-01T00:00:00.000Z',
  endDate: '2025-04-30T00:00:00.000Z',
  rebalanceFrequency: 'weekly',
  holdingPeriodDays: 5,
  topN: 1,
  minConfidence: 0.8,
  windowMode: 'walk-forward',
  minimumTrainingObservations: 20,
  costAssumptionContractVersion: COMMODITY_COST_ASSUMPTION_CONTRACT_VERSION,
  costAssumptionId: 'commodity-validation-costs',
  costAssumptionVersion: '1.0.0',
  pointInTimePolicyVersion: COMMODITY_POINT_IN_TIME_POLICY_VERSION,
};

const costs: CommodityBacktestCostAssumptions = {
  contractVersion: COMMODITY_COST_ASSUMPTION_CONTRACT_VERSION,
  assumptionId: 'commodity-validation-costs',
  assumptionVersion: '1.0.0',
  effectiveFrom: '2024-12-01T00:00:00.000Z',
  commissionBps: 1,
  slippageBps: 2,
  spreadBps: 1,
  source: 'unit-test research assumption',
  executable: false,
};

const factorEvidence = {
  marketStructure: ['market.priceHistory'],
  physicalBalance: ['fundamentals.inventoryLevel'],
  carryStructure: ['market.termStructure'],
  positioning: ['positioning.managedMoneyNetPctOi'],
  supplyRisk: ['risk.supplyConcentration'],
} as const;

function iso(base: Date, dayOffset: number): string {
  return new Date(base.getTime() + dayOffset * 24 * 60 * 60 * 1000).toISOString();
}

function observation(period: number, asset: 'A' | 'B'): CommodityHistoricalObservation {
  const base = new Date(Date.UTC(2025, 0, 3 + period * 7));
  const decisionAt = base.toISOString();
  const availableAt = iso(base, -1);
  const observedAt = iso(base, -2);
  const assetBias = asset === 'A' ? 0.5 : -0.5;
  const factorValue = assetBias + period * (asset === 'A' ? 0.01 : -0.01);
  const feature = (featureKey: string, source: string, releaseId: string | null, revisionId: string | null) => ({
    featureKey,
    value: factorValue,
    source,
    observedAt,
    availableAt,
    retrievedAt: decisionAt,
    evidenceId: `evidence:${featureKey}:${period}:${asset}`,
    releaseId,
    revisionId,
  });

  return {
    observationId: `energy:${period}:${asset}`,
    assetId: `commodity:${asset}`,
    symbol: asset === 'A' ? 'CL' : 'NG',
    domain: 'energy',
    decisionAt,
    realizedAt: iso(base, 2),
    realizedReturn: asset === 'A' ? 0.02 + period * 0.0001 : -0.01,
    universeMembershipEvidenceId: `universe-membership:${period}:${asset}`,
    pointInTimeSnapshot: {
      policyVersion: COMMODITY_POINT_IN_TIME_POLICY_VERSION,
      assetId: `commodity:${asset}`,
      decisionAt,
      values: [
        feature('market.priceHistory', 'commodity-market-evidence/1.0.0', null, null),
        feature('fundamentals.inventoryLevel', 'eia-official-evidence', `eia-release:${period}`, `eia-revision:${period}`),
        feature('market.termStructure', 'governed-futures-curve-evidence', null, null),
        feature('positioning.managedMoneyNetPctOi', 'cftc-cot-official-evidence', `cftc-release:${period}`, null),
        feature('risk.supplyConcentration', 'governed-official-supply-evidence', null, null),
      ],
    },
    normalizedFactorValues: {
      marketStructure: factorValue,
      physicalBalance: factorValue * 0.9,
      carryStructure: factorValue * 0.8,
      positioning: factorValue * 0.7,
      supplyRisk: factorValue * 0.6,
    },
    factorEvidenceFeatureKeys: factorEvidence,
    regime: period % 2 === 0 ? 'risk-on' : 'risk-off',
  };
}

function dataset(): CommodityHistoricalDataset {
  const observations = Array.from({ length: 14 }, (_, period) => [
    observation(period, 'A'),
    observation(period, 'B'),
  ]).flat();
  const decisionTimestamps = [...new Set(observations.map(item => item.decisionAt))];
  return {
    contractVersion: COMMODITY_HISTORICAL_DATASET_CONTRACT_VERSION,
    datasetId: 'energy-historical-pit-test',
    datasetVersion: '1.0.0',
    createdAt: '2026-08-23T21:58:00.000Z',
    modelId: 'commodity-energy-hybrid',
    modelVersion: '0.1.0',
    universeId: request.universeId,
    normalizationContractVersion: 'commodity-factor-normalization/test-v1',
    observations,
    benchmarks: [
      {
        benchmarkId: 'commodity-evidence-scoring@1.0.0',
        kind: 'CURRENT_CHAMPION',
        version: '1.0.0',
        description: 'Current canonical commodity champion research benchmark.',
      },
      {
        benchmarkId: 'naive-equal-weight@1.0.0',
        kind: 'NAIVE_BASELINE',
        version: '1.0.0',
        description: 'Naive equal-weight commodity baseline.',
      },
    ],
    benchmarkReturns: decisionTimestamps.flatMap((decisionAt, period) => [
      {
        benchmarkId: 'commodity-evidence-scoring@1.0.0',
        decisionAt,
        realizedAt: iso(new Date(decisionAt), 2),
        return: 0.005 + period * 0.00005,
        evidenceId: `benchmark:champion:${period}`,
      },
      {
        benchmarkId: 'naive-equal-weight@1.0.0',
        decisionAt,
        realizedAt: iso(new Date(decisionAt), 2),
        return: 0.003,
        evidenceId: `benchmark:naive:${period}`,
      },
    ]),
    immutable: true,
    authority: 'VALIDATION_ONLY',
  };
}

describe('Commodity historical PIT walk-forward validation engine', () => {
  it('validates immutable PIT data with explicit universe and factor evidence lineage', () => {
    const validation = validateCommodityHistoricalDataset(dataset());

    expect(validation.valid).toBe(true);
    expect(validation.pointInTimeValid).toBe(true);
    expect(validation.expectedLatentFactors).toEqual([
      'carryStructure',
      'marketStructure',
      'physicalBalance',
      'positioning',
      'supplyRisk',
    ]);
    expect(validation.decisionTimestamps).toHaveLength(14);
    expect(validation.scoreEligible).toBe(false);
  });

  it('builds walk-forward splits using only outcomes already realized before the test decision', () => {
    const data = dataset();
    const plan = buildCommodityOosSplitPlan(data, request);

    expect(plan.valid).toBe(true);
    expect(plan.splits.length).toBeGreaterThanOrEqual(2);
    for (const split of plan.splits) {
      const testMs = Date.parse(split.testDecisionAt);
      for (const observationId of split.trainingObservationIds) {
        const item = data.observations.find(candidate => candidate.observationId === observationId)!;
        expect(Date.parse(item.decisionAt)).toBeLessThan(testMs);
        expect(Date.parse(item.realizedAt)).toBeLessThanOrEqual(testMs);
      }
    }
  });

  it('executes deterministic OOS research evaluation without creating scoring authority', () => {
    const input = {
      runId: 'energy-oos-run-001',
      request,
      dataset: dataset(),
      weightProfile: energyProfile(),
      costAssumptions: costs,
      correlationEvidenceId: 'correlation:energy:001',
      sensitivityEvidenceId: 'sensitivity:energy:001',
    } as const;

    const first = executeCommodityHistoricalBacktest(input);
    const second = executeCommodityHistoricalBacktest(input);

    expect(first.blockers).toEqual([]);
    expect(first.outOfSampleEvidenceId).toMatch(/^commodity-oos:[a-f0-9]{64}$/);
    expect(first.outOfSampleEvidenceId).toBe(second.outOfSampleEvidenceId);
    expect(first.periodReturns.length).toBeGreaterThanOrEqual(2);
    expect(first.result.outOfSampleValidated).toBe(true);
    expect(first.result.pointInTimeValidated).toBe(true);
    expect(first.result.costAssumptionsValidated).toBe(true);
    expect(first.result.promotionEvidenceEligible).toBe(true);
    expect(first.result.rankInformationCoefficient).toBeUndefined();
    expect(first.result.metrics.rankInformationCoefficient).toBe(1);
    expect(first.result.metrics.hitRateTopN).toBe(1);
    expect(first.benchmarkSummaries).toHaveLength(2);
    expect(first.authority).toBe('VALIDATION_ONLY');
    expect(first.canonical).toBe(false);
    expect(first.scoreEligible).toBe(false);
    expect(first.result.canonical).toBe(false);
    expect(first.result.scoreEligible).toBe(false);
  });

  it('fails closed when a feature vintage was not available at decision time', () => {
    const data = dataset();
    const target = data.observations[0];
    const invalid: CommodityHistoricalDataset = {
      ...data,
      observations: [
        {
          ...target,
          pointInTimeSnapshot: {
            ...target.pointInTimeSnapshot,
            values: target.pointInTimeSnapshot.values.map((feature, index) => index === 0 ? {
              ...feature,
              availableAt: iso(new Date(target.decisionAt), 1),
              retrievedAt: iso(new Date(target.decisionAt), 2),
            } : feature),
          },
        },
        ...data.observations.slice(1),
      ],
    };

    const validation = validateCommodityHistoricalDataset(invalid);
    expect(validation.valid).toBe(false);
    expect(validation.pointInTimeBlockers.some(item => item.includes('LOOKAHEAD_VALUE_NOT_YET_AVAILABLE'))).toBe(true);

    const execution = executeCommodityHistoricalBacktest({
      runId: 'invalid-lookahead',
      request,
      dataset: invalid,
      weightProfile: energyProfile(),
      costAssumptions: costs,
      correlationEvidenceId: 'correlation:energy:001',
      sensitivityEvidenceId: 'sensitivity:energy:001',
    });
    expect(execution.outOfSampleEvidenceId).toBeNull();
    expect(execution.result.promotionEvidenceEligible).toBe(false);
  });

  it('blocks survivorship-prone observations without historical universe membership evidence', () => {
    const data = dataset();
    const target = data.observations[0];
    const invalid: CommodityHistoricalDataset = {
      ...data,
      observations: [{ ...target, universeMembershipEvidenceId: '' }, ...data.observations.slice(1)],
    };

    const validation = validateCommodityHistoricalDataset(invalid);
    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain(`${target.observationId}:UNIVERSE_MEMBERSHIP_EVIDENCE_REQUIRED`);
  });

  it('blocks one raw evidence feature from being reused across latent factors', () => {
    const data = dataset();
    const target = data.observations[0];
    const invalid: CommodityHistoricalDataset = {
      ...data,
      observations: [
        {
          ...target,
          factorEvidenceFeatureKeys: {
            ...target.factorEvidenceFeatureKeys,
            carryStructure: ['market.priceHistory'],
          },
        },
        ...data.observations.slice(1),
      ],
    };

    const validation = validateCommodityHistoricalDataset(invalid);
    expect(validation.valid).toBe(false);
    expect(validation.blockers.some(item => item.includes('FACTOR_EVIDENCE_REUSED_CROSS_FACTOR'))).toBe(true);
  });

  it('requires both current-champion and naive baseline definitions', () => {
    const data = dataset();
    const invalid: CommodityHistoricalDataset = {
      ...data,
      benchmarks: data.benchmarks.filter(item => item.kind !== 'NAIVE_BASELINE'),
      benchmarkReturns: data.benchmarkReturns.filter(item => item.benchmarkId !== 'naive-equal-weight@1.0.0'),
    };

    const validation = validateCommodityHistoricalDataset(invalid);
    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain('NAIVE_BASELINE_REQUIRED');
  });

  it('does not admit late-realized training outcomes into an OOS split', () => {
    const data = dataset();
    const late = data.observations.slice(0, 20).map(item => ({
      ...item,
      realizedAt: '2025-05-15T00:00:00.000Z',
    }));
    const modified: CommodityHistoricalDataset = {
      ...data,
      observations: [...late, ...data.observations.slice(20)],
    };

    const plan = buildCommodityOosSplitPlan(modified, request);
    expect(plan.valid).toBe(false);
    expect(plan.blockers.some(item => item.startsWith('OOS_TEST_PERIODS_INSUFFICIENT:'))).toBe(true);
  });

  it('supports expanding-window planning while keeping all training rows strictly pre-test', () => {
    const expandingRequest: CommodityBacktestRequest = { ...request, windowMode: 'expanding-window' };
    const data = dataset();
    const plan = buildCommodityOosSplitPlan(data, expandingRequest);

    expect(plan.valid).toBe(true);
    const counts = plan.splits.map(split => split.trainingObservations);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    for (const split of plan.splits) {
      expect(split.trainingObservationIds.every(id => {
        const item = data.observations.find(candidate => candidate.observationId === id)!;
        return Date.parse(item.realizedAt) <= Date.parse(split.testDecisionAt);
      })).toBe(true);
    }
  });
});

import { describe, expect, it } from 'vitest';
import {
  COMMODITY_BACKTEST_CONTRACT_VERSION,
  COMMODITY_COST_ASSUMPTION_CONTRACT_VERSION,
  COMMODITY_ENERGY_RESEARCH_MODEL_CONTRACT,
  COMMODITY_HISTORICAL_DATASET_CONTRACT_VERSION,
  COMMODITY_P2_EVIDENCE_PIPELINE_VERSION,
  COMMODITY_POINT_IN_TIME_POLICY_VERSION,
  COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION,
  runCommodityP2EvidencePipeline,
  type CommodityCandidateWeightProfile,
  type CommodityHistoricalDataset,
} from '../../src/platform/Scoring';

function energyProfile(): CommodityCandidateWeightProfile {
  const aggregations = new Map<string, string[]>();
  for (const feature of COMMODITY_ENERGY_RESEARCH_MODEL_CONTRACT.features) {
    const keys = aggregations.get(feature.latentFactor) ?? [];
    keys.push(feature.key);
    aggregations.set(feature.latentFactor, keys);
  }
  const factors = [...aggregations.keys()].sort();
  const equalWeight = 1 / factors.length;
  return {
    contractVersion: COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION,
    profileId: 'commodity-energy-p2-evidence-candidate',
    profileVersion: '0.1.0',
    modelId: 'commodity-energy-hybrid',
    modelVersion: '0.1.0',
    status: 'research-candidate',
    executable: false,
    factorWeights: Object.fromEntries(factors.map(factor => [factor, equalWeight])),
    factorAggregations: factors.map(factor => ({
      latentFactor: factor,
      featureKeys: [...(aggregations.get(factor) ?? [])].sort(),
      renormalizationPolicy: 'WITHIN_LATENT_FACTOR_ONLY',
    })),
    sourceHypothesis: COMMODITY_ENERGY_RESEARCH_MODEL_CONTRACT.weightHypothesis,
  };
}

function correlationObservations() {
  const featureKeys = COMMODITY_ENERGY_RESEARCH_MODEL_CONTRACT.features
    .filter(feature => feature.role === 'RAW_EVIDENCE')
    .map(feature => feature.key);
  return Array.from({ length: 30 }, (_, index) => ({
    observedAt: new Date(Date.UTC(2024, 0, index + 1)).toISOString(),
    normalizedValues: Object.fromEntries(featureKeys.map((key, featureIndex) => [
      key,
      Math.sin((index + 1) * (featureIndex + 1) * 1.61803398875)
        + (0.07 * Math.cos((index + 3) * (featureIndex + 2))),
    ])),
  }));
}

function emptyPitDataset(): CommodityHistoricalDataset {
  return {
    contractVersion: COMMODITY_HISTORICAL_DATASET_CONTRACT_VERSION,
    datasetId: 'commodity-energy-pit-pending',
    datasetVersion: '0.1.0',
    createdAt: '2026-08-28T11:00:00.000Z',
    modelId: 'commodity-energy-hybrid',
    modelVersion: '0.1.0',
    universeId: 'commodity-energy-pit-universe/v1',
    normalizationContractVersion: 'commodity-normalization/0.1.0',
    observations: [],
    benchmarks: [
      {
        benchmarkId: 'commodity-evidence-scoring@1.0.0',
        kind: 'CURRENT_CHAMPION',
        version: '1.0.0',
        description: 'Current canonical commodity champion.',
      },
      {
        benchmarkId: 'naive-equal-weight@1.0.0',
        kind: 'NAIVE_BASELINE',
        version: '1.0.0',
        description: 'Naive equal-weight baseline.',
      },
    ],
    benchmarkReturns: [],
    immutable: true,
    authority: 'VALIDATION_ONLY',
  };
}

function pipelineInput() {
  const profile = energyProfile();
  const factors = Object.keys(profile.factorWeights).sort();
  const shifted = Object.fromEntries(factors.map(factor => [factor, profile.factorWeights[factor]]));
  shifted[factors[0]] += 0.02;
  shifted[factors[1]] -= 0.01;
  shifted[factors[2]] -= 0.01;

  return {
    runId: 'commodity-energy-p2-oos-001',
    modelId: 'commodity-energy-hybrid' as const,
    weightProfile: profile,
    correlation: {
      observations: correlationObservations(),
      normalizationContractVersion: 'commodity-normalization/0.1.0',
      minimumPairedObservations: 20,
      highAbsoluteCorrelation: 0.999999,
    },
    sensitivityVariants: [{ variantId: 'small-factor-shift', factorWeights: shifted }],
    dataset: emptyPitDataset(),
    backtestRequest: {
      contractVersion: COMMODITY_BACKTEST_CONTRACT_VERSION,
      modelId: 'commodity-energy-hybrid' as const,
      modelVersion: '0.1.0' as const,
      universeId: 'commodity-energy-pit-universe/v1',
      assetClass: 'commodity' as const,
      domains: ['energy'] as const,
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2025-12-31T00:00:00.000Z',
      rebalanceFrequency: 'weekly' as const,
      holdingPeriodDays: 5,
      topN: 1,
      minConfidence: 0.8,
      windowMode: 'walk-forward' as const,
      minimumTrainingObservations: 20,
      costAssumptionContractVersion: COMMODITY_COST_ASSUMPTION_CONTRACT_VERSION,
      costAssumptionId: 'commodity-validation-costs',
      costAssumptionVersion: '1.0.0',
      pointInTimePolicyVersion: COMMODITY_POINT_IN_TIME_POLICY_VERSION,
    },
    costAssumptions: {
      contractVersion: COMMODITY_COST_ASSUMPTION_CONTRACT_VERSION,
      assumptionId: 'commodity-validation-costs',
      assumptionVersion: '1.0.0',
      effectiveFrom: '2023-12-01T00:00:00.000Z',
      commissionBps: 1,
      slippageBps: 2,
      spreadBps: 1,
      source: 'reviewed research cost assumption',
      executable: false as const,
    },
    calibrationEvidenceId: 'commodity-calibration:energy:pending-real-pit-evidence',
    descriptor: {
      descriptorId: 'commodity-energy-p2-review',
      descriptorVersion: '0.1.0',
      supportedSources: ['twelvedata'] as const,
      validFrom: '2026-09-01T00:00:00.000Z',
      createdAt: '2026-08-28T11:00:00.000Z',
    },
    providerResilience: {
      windowStart: '2026-08-01T00:00:00.000Z',
      windowEnd: '2026-08-28T11:00:00.000Z',
      policy: {
        policyId: 'commodity-provider-resilience-energy',
        policyVersion: '1.0.0',
        minimumAvailabilityRate: 0.98,
        minimumFreshnessPassRate: 0.97,
        maximumErrorRate: 0.02,
        maximumCircuitOpenEvents: 1,
        maximumP95LatencyMs: 2500,
      },
      observations: [{
        providerId: 'twelvedata' as const,
        required: true,
        sampleCount: 100,
        availabilityRate: 0.995,
        freshnessPassRate: 0.99,
        errorRate: 0.005,
        circuitOpenEvents: 0,
        p95LatencyMs: 900,
        evidenceId: 'provider-resilience:twelvedata:2026-08',
      }],
    },
    stress: {
      policy: {
        policyId: 'commodity-energy-stress-policy',
        policyVersion: '1.0.0',
        requiredScenarioIds: ['energy-volatility-shock'],
        minimumRankInformationCoefficient: 0,
        maximumAbsoluteDrawdown: 0.25,
        maximumTurnover: 1,
      },
      scenarios: [{
        scenarioId: 'energy-volatility-shock',
        regime: 'volatility-shock',
        leakageFree: true,
        rankInformationCoefficient: 0.03,
        maxDrawdown: -0.18,
        turnover: 0.42,
        evidenceId: 'commodity-stress-evidence:energy:001',
      }],
    },
    promotionPackage: {
      packageId: 'commodity-energy-p2-review',
      packageVersion: '0.1.0',
      createdAt: '2026-08-28T11:05:00.000Z',
    },
  };
}

describe('Commodity P2-A -> P2-C evidence pipeline', () => {
  it('derives and binds P2-A evidence identifiers into the P2-B backtest result', () => {
    const result = runCommodityP2EvidencePipeline(pipelineInput());

    expect(result.version).toBe(COMMODITY_P2_EVIDENCE_PIPELINE_VERSION);
    expect(result.weightValidation.valid).toBe(true);
    expect(result.correlationReport.evidenceComplete).toBe(true);
    expect(result.stabilityReport.valid).toBe(true);
    expect(result.backtestExecution.result.correlationEvidenceId).toBe(result.correlationEvidenceId);
    expect(result.backtestExecution.result.sensitivityEvidenceId).toBe(result.sensitivityEvidenceId);
    expect(result.descriptor.lineage.correlationEvidenceId).toBe(result.correlationEvidenceId);
    expect(result.descriptor.lineage.sensitivityEvidenceId).toBe(result.sensitivityEvidenceId);
  });

  it('keeps P2-C fail-closed when real PIT/OOS evidence is still absent', () => {
    const result = runCommodityP2EvidencePipeline(pipelineInput());

    expect(result.datasetValidation.valid).toBe(false);
    expect(result.datasetValidation.blockers).toContain('HISTORICAL_OBSERVATIONS_REQUIRED');
    expect(result.backtestExecution.outOfSampleEvidenceId).toBeNull();
    expect(result.stressEvidence.scenarios[0].outOfSampleEvidenceId).toBe('');
    expect(result.stressEvidence.evidenceComplete).toBe(false);
    expect(result.readyForOwnerReview).toBe(false);
    expect(result.blockers).toContain('P2B_PROMOTION_EVIDENCE_INCOMPLETE');
    expect(result.authority).toBe('VALIDATION_ONLY');
    expect(result.registryMutationPerformed).toBe(false);
    expect(result.canonical).toBe(false);
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
  });
});

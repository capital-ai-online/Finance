import { describe, expect, it } from 'vitest';
import {
  COMMODITY_BACKTEST_CONTRACT_VERSION,
  COMMODITY_COST_ASSUMPTION_CONTRACT_VERSION,
  COMMODITY_CORRELATION_POLICY_VERSION,
  COMMODITY_ENERGY_RESEARCH_MODEL_CONTRACT,
  COMMODITY_MODEL_DESCRIPTOR_CONTRACT_VERSION,
  COMMODITY_OWNER_PROMOTION_DECISION_CONTRACT_VERSION,
  COMMODITY_POINT_IN_TIME_POLICY_VERSION,
  COMMODITY_PROMOTION_PACKAGE_CONTRACT_VERSION,
  COMMODITY_RESEARCH_DQ_POLICY_VERSION,
  COMMODITY_STRESS_EVIDENCE_CONTRACT_VERSION,
  COMMODITY_WEIGHT_STABILITY_VERSION,
  COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION,
  DEFAULT_SCORING_MODELS,
  RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY,
  assessCommodityOwnerPromotionDecision,
  buildCommodityImmutableModelDescriptor,
  buildCommodityPromotionReviewPackage,
  buildCommodityProviderResilienceReport,
  buildCommodityStressEvidenceReport,
  validateCommodityCandidateWeightProfile,
  validateCommodityImmutableModelDescriptor,
  type CommodityBacktestResult,
  type CommodityCandidateWeightProfile,
  type CommodityCorrelationReport,
  type CommodityWeightStabilityReport,
} from '../../src/platform/Scoring';

function energyWeightProfile(): CommodityCandidateWeightProfile {
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
    profileId: 'commodity-energy-research-candidate',
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

function completeCorrelationReport(): CommodityCorrelationReport {
  return {
    contractVersion: COMMODITY_CORRELATION_POLICY_VERSION,
    modelId: 'commodity-energy-hybrid',
    modelVersion: '0.1.0',
    method: 'pearson',
    inputSemantic: 'NORMALIZED_FEATURE_VALUE',
    normalizationContractVersion: 'commodity-normalization/0.1.0',
    minimumPairedObservations: 20,
    highAbsoluteCorrelation: 0.8,
    observations: 104,
    pairs: [],
    blockingFindings: [],
    evidenceComplete: true,
    canonical: false,
    scoreEligible: false,
  };
}

function completeStabilityReport(): CommodityWeightStabilityReport {
  return {
    contractVersion: COMMODITY_WEIGHT_STABILITY_VERSION,
    referenceProfileId: 'commodity-energy-research-candidate',
    findings: [{
      variantId: 'energy-sensitivity-small-shift',
      l1Distance: 0.1,
      maxAbsoluteDelta: 0.05,
      topFactorChanged: false,
      weightSum: 1,
      valid: true,
      blockers: [],
    }],
    valid: true,
    blockers: [],
    canonical: false,
    scoreEligible: false,
  };
}

function completeBacktestResult(): CommodityBacktestResult {
  return {
    contractVersion: COMMODITY_BACKTEST_CONTRACT_VERSION,
    runId: 'commodity-energy-oos-2026-01',
    request: {
      contractVersion: COMMODITY_BACKTEST_CONTRACT_VERSION,
      modelId: 'commodity-energy-hybrid',
      modelVersion: '0.1.0',
      universeId: 'commodity-energy-pit-universe/v1',
      assetClass: 'commodity',
      domains: ['energy'],
      startDate: '2022-01-01T00:00:00.000Z',
      endDate: '2025-12-31T00:00:00.000Z',
      rebalanceFrequency: 'weekly',
      holdingPeriodDays: 5,
      topN: 3,
      minConfidence: 0.8,
      windowMode: 'walk-forward',
      minimumTrainingObservations: 52,
      costAssumptionContractVersion: COMMODITY_COST_ASSUMPTION_CONTRACT_VERSION,
      costAssumptionId: 'commodity-liquid-futures-usd',
      costAssumptionVersion: '1.0.0',
      pointInTimePolicyVersion: COMMODITY_POINT_IN_TIME_POLICY_VERSION,
    },
    metrics: {
      rankInformationCoefficient: 0.12,
      rankMonotonicity: 0.08,
      hitRateTopN: 0.54,
      annualizedReturn: 0.07,
      annualizedVolatility: 0.11,
      maxDrawdown: -0.09,
      profitFactor: 1.18,
      turnover: 0.35,
      averageHoldingPeriodDays: 5,
    },
    equityCurve: [],
    leakageBlockers: [],
    benchmarkIds: ['commodity-evidence-scoring@1.0.0', 'naive-equal-weight@1.0.0'],
    regimeDiagnostics: { stressed: 0.04 },
    domainDiagnostics: { energy: 0.12 },
    pointInTimeValidated: true,
    costAssumptionsValidated: true,
    outOfSampleValidated: true,
    outOfSampleEvidenceId: 'commodity-oos:energy:2026-01',
    correlationEvidenceId: 'commodity-correlation:energy:2026-01',
    sensitivityEvidenceId: 'commodity-sensitivity:energy:2026-01',
    promotionEvidenceEligible: true,
    authority: 'VALIDATION_ONLY',
    canonical: false,
    scoreEligible: false,
  };
}

function descriptor() {
  const profile = energyWeightProfile();
  const validation = validateCommodityCandidateWeightProfile(profile);
  expect(validation.valid).toBe(true);
  expect(validation.factorWeightFingerprint).toMatch(/^[0-9a-f]{64}$/);
  return buildCommodityImmutableModelDescriptor({
    descriptorId: 'commodity-energy-hybrid-review',
    descriptorVersion: '0.1.0',
    modelId: 'commodity-energy-hybrid',
    weightProfile: profile,
    weightValidation: validation,
    supportedSources: ['twelvedata', 'eia', 'cftc-cot'],
    validFrom: '2026-09-01T00:00:00.000Z',
    createdAt: '2026-08-25T00:00:00.000Z',
    lineage: {
      datasetId: 'commodity-energy-pit/v1',
      datasetVersion: '1.0.0',
      datasetFingerprint: 'a'.repeat(64),
      normalizationContractVersion: 'commodity-normalization/0.1.0',
      calibrationEvidenceId: 'commodity-calibration:energy:2026-01',
      backtestRunId: 'commodity-energy-oos-2026-01',
      outOfSampleEvidenceId: 'commodity-oos:energy:2026-01',
      correlationEvidenceId: 'commodity-correlation:energy:2026-01',
      sensitivityEvidenceId: 'commodity-sensitivity:energy:2026-01',
    },
  });
}

function completeProviderResilience() {
  return buildCommodityProviderResilienceReport({
    modelId: 'commodity-energy-hybrid',
    windowStart: '2026-07-01T00:00:00.000Z',
    windowEnd: '2026-08-25T00:00:00.000Z',
    policy: {
      policyId: 'commodity-provider-resilience-energy',
      policyVersion: '1.0.0',
      minimumAvailabilityRate: 0.98,
      minimumFreshnessPassRate: 0.97,
      maximumErrorRate: 0.02,
      maximumCircuitOpenEvents: 1,
      maximumP95LatencyMs: 2500,
    },
    observations: ['twelvedata', 'eia', 'cftc-cot'].map(providerId => ({
      providerId: providerId as 'twelvedata' | 'eia' | 'cftc-cot',
      required: true,
      sampleCount: 100,
      availabilityRate: 0.995,
      freshnessPassRate: 0.99,
      errorRate: 0.005,
      circuitOpenEvents: 0,
      p95LatencyMs: 900,
      evidenceId: `provider-resilience:${providerId}:2026-08`,
    })),
  });
}

function completeStressEvidence() {
  return buildCommodityStressEvidenceReport({
    modelId: 'commodity-energy-hybrid',
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
      outOfSampleEvidenceId: 'commodity-oos:energy:stress:001',
      leakageFree: true,
      rankInformationCoefficient: 0.03,
      maxDrawdown: -0.18,
      turnover: 0.42,
      evidenceId: 'commodity-stress-evidence:energy:001',
    }],
  });
}

function completePackage() {
  const profile = energyWeightProfile();
  const weightValidation = validateCommodityCandidateWeightProfile(profile);
  return buildCommodityPromotionReviewPackage({
    packageId: 'commodity-energy-promotion-review',
    packageVersion: '0.1.0',
    createdAt: '2026-08-25T00:10:00.000Z',
    descriptor: descriptor(),
    weightValidation,
    correlationReport: completeCorrelationReport(),
    stabilityReport: completeStabilityReport(),
    backtestResult: completeBacktestResult(),
    providerResilience: completeProviderResilience(),
    stressEvidence: completeStressEvidence(),
  });
}

describe('Commodity P2-C promotion governance', () => {
  it('creates a deterministic immutable challenger descriptor without runtime authority', () => {
    const built = descriptor();
    const validation = validateCommodityImmutableModelDescriptor(built);

    expect(built.contractVersion).toBe(COMMODITY_MODEL_DESCRIPTOR_CONTRACT_VERSION);
    expect(built.descriptorFingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(built.effectiveWeightFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(built.lifecycle).toBe('challenger');
    expect(built.runtimeExecutable).toBe(false);
    expect(built.canonical).toBe(false);
    expect(built.scoreEligible).toBe(false);
    expect(validation.valid).toBe(true);
  });

  it('rejects tampered descriptor lineage or invalid validity ranges', () => {
    const built = descriptor();
    const tampered = {
      ...built,
      validUntil: '2026-08-31T00:00:00.000Z',
      lineage: { ...built.lineage, datasetFingerprint: `b${built.lineage.datasetFingerprint.slice(1)}` },
    };
    const validation = validateCommodityImmutableModelDescriptor(tampered);

    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain('MODEL_DESCRIPTOR_VALIDITY_RANGE_INVALID');
    expect(validation.blockers).toContain('MODEL_DESCRIPTOR_FINGERPRINT_MISMATCH');
  });

  it('derives provider resilience blockers instead of accepting a caller pass boolean', () => {
    const report = buildCommodityProviderResilienceReport({
      modelId: 'commodity-energy-hybrid',
      windowStart: '2026-07-01T00:00:00.000Z',
      windowEnd: '2026-08-25T00:00:00.000Z',
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
        providerId: 'eia',
        required: true,
        sampleCount: 50,
        availabilityRate: 0.9,
        freshnessPassRate: 0.95,
        errorRate: 0.08,
        circuitOpenEvents: 3,
        p95LatencyMs: 4000,
        evidenceId: 'provider-resilience:eia:bad-window',
      }],
    });

    expect(report.evidenceComplete).toBe(false);
    expect(report.blockers).toContain('PROVIDER_RESILIENCE_AVAILABILITY_BELOW_POLICY:eia');
    expect(report.blockers).toContain('PROVIDER_RESILIENCE_ERROR_ABOVE_POLICY:eia');
  });

  it('blocks stress evidence that leaks or breaches an explicit scenario policy', () => {
    const report = buildCommodityStressEvidenceReport({
      modelId: 'commodity-energy-hybrid',
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
        outOfSampleEvidenceId: 'commodity-oos:energy:stress:bad',
        leakageFree: false,
        rankInformationCoefficient: -0.1,
        maxDrawdown: -0.4,
        turnover: 1.4,
        evidenceId: 'commodity-stress-evidence:energy:bad',
      }],
    });

    expect(report.contractVersion).toBe(COMMODITY_STRESS_EVIDENCE_CONTRACT_VERSION);
    expect(report.evidenceComplete).toBe(false);
    expect(report.blockers).toContain('STRESS_LEAKAGE_BLOCKER:energy-volatility-shock');
    expect(report.blockers).toContain('STRESS_DRAWDOWN_ABOVE_POLICY:energy-volatility-shock');
  });

  it('keeps an incomplete review package fail-closed when empirical backtest evidence is absent', () => {
    const profile = energyWeightProfile();
    const packageResult = buildCommodityPromotionReviewPackage({
      packageId: 'commodity-energy-promotion-review',
      packageVersion: '0.1.0',
      createdAt: '2026-08-25T00:10:00.000Z',
      descriptor: descriptor(),
      weightValidation: validateCommodityCandidateWeightProfile(profile),
      correlationReport: completeCorrelationReport(),
      stabilityReport: completeStabilityReport(),
      backtestResult: null,
      providerResilience: completeProviderResilience(),
      stressEvidence: completeStressEvidence(),
    });

    expect(packageResult.contractVersion).toBe(COMMODITY_PROMOTION_PACKAGE_CONTRACT_VERSION);
    expect(packageResult.readyForOwnerReview).toBe(false);
    expect(packageResult.blockers).toContain('BACKTEST_RESULT_REQUIRED');
    expect(packageResult.registryMutationPerformed).toBe(false);
    expect(packageResult.scoreEligible).toBe(false);
  });

  it('can make a complete evidence package owner-reviewable but never self-promotes', () => {
    const reviewPackage = completePackage();

    expect(reviewPackage.readyForOwnerReview).toBe(true);
    expect(reviewPackage.blockers).toEqual([]);
    expect(reviewPackage.packageFingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(reviewPackage.championChallengerDiff?.currentChampion).toMatchObject({
      modelId: 'commodity-evidence-scoring',
      version: '1.0.0',
    });
    expect(reviewPackage.championChallengerDiff?.challenger.executorKey).toBe(RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY);
    expect(reviewPackage.championChallengerDiff?.rollbackTarget).toEqual({
      modelId: 'commodity-evidence-scoring',
      version: '1.0.0',
    });
    expect(reviewPackage.registryMutationPerformed).toBe(false);
    expect(reviewPackage.canonical).toBe(false);
    expect(reviewPackage.scoreEligible).toBe(false);
  });

  it('binds an explicit Human Owner decision to the exact package fingerprint without mutating registry', () => {
    const reviewPackage = completePackage();
    const decision = assessCommodityOwnerPromotionDecision(reviewPackage, {
      contractVersion: COMMODITY_OWNER_PROMOTION_DECISION_CONTRACT_VERSION,
      packageFingerprint: reviewPackage.packageFingerprint,
      decision: 'APPROVE',
      principalType: 'HUMAN_OWNER',
      principalId: 'owner-review-evidence',
      decidedAt: '2026-08-25T00:15:00.000Z',
      evidenceId: 'owner-decision:commodity-energy:001',
      explicit: true,
    });

    expect(decision.valid).toBe(true);
    expect(decision.approvedForControlledPromotion).toBe(true);
    expect(decision.registryMutationPerformed).toBe(false);

    const wrongFingerprint = assessCommodityOwnerPromotionDecision(reviewPackage, {
      contractVersion: COMMODITY_OWNER_PROMOTION_DECISION_CONTRACT_VERSION,
      packageFingerprint: 'sha256:deadbeef',
      decision: 'APPROVE',
      principalType: 'HUMAN_OWNER',
      principalId: 'owner-review-evidence',
      decidedAt: '2026-08-25T00:15:00.000Z',
      evidenceId: 'owner-decision:commodity-energy:002',
      explicit: true,
    });
    expect(wrongFingerprint.approvedForControlledPromotion).toBe(false);
    expect(wrongFingerprint.blockers).toContain('OWNER_DECISION_PACKAGE_FINGERPRINT_MISMATCH');
  });

  it('leaves the canonical registry unchanged after all P2-C review operations', () => {
    completePackage();
    const champion = DEFAULT_SCORING_MODELS.find(model => model.modelId === 'commodity-evidence-scoring');
    const challenger = DEFAULT_SCORING_MODELS.find(model => model.modelId === 'commodity-energy-hybrid');

    expect(champion?.lifecycle).toBe('canonical');
    expect(champion?.scoreEligible).toBe(true);
    expect(challenger?.lifecycle).toBe('challenger');
    expect(challenger?.scoreEligible).toBe(false);
    expect(challenger?.executorKey).toBe(RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY);
  });
});

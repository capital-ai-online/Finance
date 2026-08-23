import { describe, expect, it } from 'vitest';
import {
  COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION,
  analyzeCommodityFeatureCorrelation,
  analyzeCommodityWeightStability,
  assessCommodityWeightPromotionEvidence,
  buildCommodityDriveWeightResearchPlan,
  validateCommodityCandidateWeightProfile,
  type CommodityCandidateWeightProfile,
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

function correlationObservations() {
  return Array.from({ length: 24 }, (_, index) => ({
    observedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    values: {
      'market.priceHistory': index + 1,
      'fundamentals.inventoryLevel': (index + 1) * 2,
      'fundamentals.production': (index + 1) * 3,
      'fundamentals.supplyDemandBalance': index % 2 === 0 ? 1 : -1,
      'market.termStructure': (index + 1) * 4,
      'positioning.managedMoneyNetPctOi': (index % 5) - 2,
      'risk.supplyConcentration': 40 + (index % 3),
    },
  }));
}

describe('Commodity P2 weight and correlation validation', () => {
  it('keeps Drive weights as a non-executable research hypothesis without auto-expanding them', () => {
    const plan = buildCommodityDriveWeightResearchPlan('commodity-energy-hybrid');

    expect(plan.sourceHypothesis.weights).toEqual({
      commodityFundamentals: 35,
      technicalStructure: 20,
      macroRegime: 15,
      sentimentPositioning: 10,
      riskLiquidity: 20,
    });
    expect(plan.executable).toBe(false);
    expect(plan.requiresEmpiricalFactorAllocation).toBe(true);
    expect(plan.latentFactors.map(item => item.factor)).toContain('physicalBalance');
  });

  it('uses factor-level weights and produces deterministic effective-weight lineage', () => {
    const first = validateCommodityCandidateWeightProfile(energyProfile());
    const second = validateCommodityCandidateWeightProfile(energyProfile());

    expect(first.valid).toBe(true);
    expect(first.weightSum).toBe(1);
    expect(first.renormalizationPolicy).toBe('WITHIN_LATENT_FACTOR_ONLY');
    expect(first.factorWeightFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(first.factorWeightFingerprint).toBe(second.factorWeightFingerprint);
    expect(first.executable).toBe(false);
    expect(first.scoreEligible).toBe(false);
  });

  it('fails closed when factor aggregation could redistribute across or omit latent factors', () => {
    const profile = energyProfile();
    const invalid: CommodityCandidateWeightProfile = {
      ...profile,
      factorAggregations: profile.factorAggregations.filter(item => item.latentFactor !== 'physicalBalance'),
    };

    const validation = validateCommodityCandidateWeightProfile(invalid);
    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain('MISSING_FACTOR_AGGREGATION:physicalBalance');
    expect(validation.factorWeightFingerprint).toBeNull();
  });

  it('detects high empirical correlation across latent-factor boundaries', () => {
    const report = analyzeCommodityFeatureCorrelation({
      modelId: 'commodity-energy-hybrid',
      observations: correlationObservations(),
    });

    const physicalPair = report.pairs.find(pair => (
      pair.leftFeature === 'fundamentals.inventoryLevel'
      && pair.rightFeature === 'fundamentals.production'
    ));
    expect(physicalPair?.highCorrelation).toBe(true);
    expect(physicalPair?.crossLatentFactor).toBe(false);

    expect(report.blockingFindings.some(item => item.startsWith('HIGH_CROSS_FACTOR_CORRELATION:'))).toBe(true);
    expect(report.canonical).toBe(false);
    expect(report.scoreEligible).toBe(false);
  });

  it('records sensitivity without turning it into an automatic promotion threshold', () => {
    const profile = energyProfile();
    const report = analyzeCommodityWeightStability({
      reference: profile,
      variants: [{
        variantId: 'physical-plus-5pct',
        factorWeights: {
          marketStructure: 0.2,
          physicalBalance: 0.25,
          carryStructure: 0.15,
          positioning: 0.2,
          supplyRisk: 0.2,
        },
      }],
    });

    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].l1Distance).toBeCloseTo(0.1);
    expect(report.findings[0].weightSum).toBe(1);
    expect(report.canonical).toBe(false);
  });

  it('cannot become promotion evidence without correlation, sensitivity and PIT backtest evidence', () => {
    const assessment = assessCommodityWeightPromotionEvidence({
      weightValidation: validateCommodityCandidateWeightProfile(energyProfile()),
      correlationReport: null,
      stabilityReport: null,
      backtestRunId: null,
    });

    expect(assessment.readyForOwnerReview).toBe(false);
    expect(assessment.blockers).toContain('CORRELATION_EVIDENCE_MISSING');
    expect(assessment.blockers).toContain('SENSITIVITY_EVIDENCE_MISSING');
    expect(assessment.blockers).toContain('POINT_IN_TIME_BACKTEST_EVIDENCE_MISSING');
    expect(assessment.executable).toBe(false);
    expect(assessment.ownerPromotionRequired).toBe(true);
  });
});

import { buildEffectiveScoringFingerprintMetadata } from './scoringFingerprint';
import {
  COMMODITY_RESEARCH_DQ_POLICY_VERSION,
  COMMODITY_RESEARCH_MODEL_CONTRACTS,
  type CommodityResearchModelContract,
  type CommodityResearchModelId,
  type CommodityResearchWeightHypothesis,
} from './CommodityResearchModelContracts';

export const COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION =
  'commodity-weight-validation/1.0.0' as const;
export const COMMODITY_CORRELATION_POLICY_VERSION =
  'commodity-correlation-policy/1.0.0' as const;
export const COMMODITY_WEIGHT_STABILITY_VERSION =
  'commodity-weight-stability/1.0.0' as const;

/**
 * Research-only screening threshold. This is deliberately NOT a promotion threshold or model
 * parameter. A future promotion package must justify any changed threshold with empirical evidence.
 */
export const DEFAULT_COMMODITY_CORRELATION_POLICY = Object.freeze({
  method: 'pearson' as const,
  minimumPairedObservations: 20,
  highAbsoluteCorrelation: 0.8,
});

export type CommodityWeightRenormalizationPolicy = 'WITHIN_LATENT_FACTOR_ONLY';

export interface CommodityCorrelationObservation {
  readonly observedAt: string;
  readonly values: Readonly<Record<string, number | null | undefined>>;
}

export interface CommodityFeatureCorrelationPair {
  readonly leftFeature: string;
  readonly rightFeature: string;
  readonly leftLatentFactor: string;
  readonly rightLatentFactor: string;
  readonly leftCorrelationGroup: string;
  readonly rightCorrelationGroup: string;
  readonly pairedObservations: number;
  readonly correlation: number | null;
  readonly status: 'OK' | 'INSUFFICIENT_DATA' | 'CONSTANT_SERIES';
  readonly highCorrelation: boolean;
  readonly crossLatentFactor: boolean;
  readonly structuralSameGroup: boolean;
}

export interface CommodityCorrelationReport {
  readonly contractVersion: typeof COMMODITY_CORRELATION_POLICY_VERSION;
  readonly modelId: CommodityResearchModelId;
  readonly modelVersion: '0.1.0';
  readonly method: 'pearson';
  readonly minimumPairedObservations: number;
  readonly highAbsoluteCorrelation: number;
  readonly observations: number;
  readonly pairs: readonly CommodityFeatureCorrelationPair[];
  readonly blockingFindings: readonly string[];
  readonly canonical: false;
  readonly scoreEligible: false;
}

export interface CommodityLatentFactorAggregation {
  readonly latentFactor: string;
  readonly featureKeys: readonly string[];
  readonly renormalizationPolicy: CommodityWeightRenormalizationPolicy;
}

export interface CommodityCandidateWeightProfile {
  readonly contractVersion: typeof COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION;
  readonly profileId: string;
  readonly profileVersion: string;
  readonly modelId: CommodityResearchModelId;
  readonly modelVersion: '0.1.0';
  readonly status: 'research-candidate';
  readonly executable: false;
  readonly factorWeights: Readonly<Record<string, number>>;
  readonly factorAggregations: readonly CommodityLatentFactorAggregation[];
  readonly sourceHypothesis: CommodityResearchWeightHypothesis;
}

export interface CommodityCandidateWeightValidation {
  readonly contractVersion: typeof COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION;
  readonly valid: boolean;
  readonly blockers: readonly string[];
  readonly warnings: readonly string[];
  readonly weightSum: number;
  readonly factorWeightFingerprint: string | null;
  readonly effectiveFactors: readonly string[];
  readonly renormalizationPolicy: CommodityWeightRenormalizationPolicy;
  readonly canonical: false;
  readonly scoreEligible: false;
  readonly executable: false;
}

export interface CommodityDriveWeightResearchPlan {
  readonly contractVersion: typeof COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION;
  readonly modelId: CommodityResearchModelId;
  readonly modelVersion: '0.1.0';
  readonly sourceHypothesis: CommodityResearchWeightHypothesis;
  readonly latentFactors: readonly {
    readonly factor: string;
    readonly correlationGroups: readonly string[];
    readonly featureKeys: readonly string[];
  }[];
  readonly executable: false;
  readonly requiresEmpiricalFactorAllocation: true;
  readonly note: string;
}

export interface CommodityWeightSensitivityVariant {
  readonly variantId: string;
  readonly factorWeights: Readonly<Record<string, number>>;
}

export interface CommodityWeightSensitivityFinding {
  readonly variantId: string;
  readonly l1Distance: number;
  readonly maxAbsoluteDelta: number;
  readonly topFactorChanged: boolean;
  readonly weightSum: number;
}

export interface CommodityWeightStabilityReport {
  readonly contractVersion: typeof COMMODITY_WEIGHT_STABILITY_VERSION;
  readonly referenceProfileId: string;
  readonly findings: readonly CommodityWeightSensitivityFinding[];
  readonly canonical: false;
  readonly scoreEligible: false;
}

export interface CommodityWeightPromotionEvidenceAssessment {
  readonly contractVersion: typeof COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION;
  readonly readyForOwnerReview: boolean;
  readonly blockers: readonly string[];
  readonly executable: false;
  readonly scoreEligible: false;
  readonly ownerPromotionRequired: true;
}

function modelForId(modelId: CommodityResearchModelId): CommodityResearchModelContract {
  const model = COMMODITY_RESEARCH_MODEL_CONTRACTS.find(item => item.modelId === modelId);
  if (!model) throw new Error(`COMMODITY_RESEARCH_MODEL_NOT_FOUND:${modelId}`);
  return model;
}

function finite(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function round(value: number, digits = 12): number {
  return Number(value.toFixed(digits));
}

function pearson(left: readonly number[], right: readonly number[]): number | null {
  if (left.length !== right.length || left.length < 2) return null;
  const meanLeft = left.reduce((sum, value) => sum + value, 0) / left.length;
  const meanRight = right.reduce((sum, value) => sum + value, 0) / right.length;
  let numerator = 0;
  let leftSquared = 0;
  let rightSquared = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftDelta = left[index] - meanLeft;
    const rightDelta = right[index] - meanRight;
    numerator += leftDelta * rightDelta;
    leftSquared += leftDelta * leftDelta;
    rightSquared += rightDelta * rightDelta;
  }

  const denominator = Math.sqrt(leftSquared * rightSquared);
  return denominator > 0 ? round(numerator / denominator) : null;
}

/**
 * Pairwise research diagnostic only. It never changes model weights and never emits a score.
 * Correlation is evaluated over feature pairs from the same Commodity model contract. Highly
 * correlated pairs that cross latent-factor boundaries block promotion evidence because they can
 * create hidden double counting even when each factor looks independently reasonable.
 */
export function analyzeCommodityFeatureCorrelation(input: {
  readonly modelId: CommodityResearchModelId;
  readonly observations: readonly CommodityCorrelationObservation[];
  readonly minimumPairedObservations?: number;
  readonly highAbsoluteCorrelation?: number;
}): CommodityCorrelationReport {
  const model = modelForId(input.modelId);
  const minimumPairedObservations = input.minimumPairedObservations
    ?? DEFAULT_COMMODITY_CORRELATION_POLICY.minimumPairedObservations;
  const highAbsoluteCorrelation = input.highAbsoluteCorrelation
    ?? DEFAULT_COMMODITY_CORRELATION_POLICY.highAbsoluteCorrelation;

  if (!Number.isInteger(minimumPairedObservations) || minimumPairedObservations < 3) {
    throw new Error('COMMODITY_CORRELATION_MIN_OBSERVATIONS_INVALID');
  }
  if (!Number.isFinite(highAbsoluteCorrelation) || highAbsoluteCorrelation <= 0 || highAbsoluteCorrelation > 1) {
    throw new Error('COMMODITY_CORRELATION_THRESHOLD_INVALID');
  }

  const pairs: CommodityFeatureCorrelationPair[] = [];
  const featureDefinitions = model.features.filter(feature => feature.role === 'RAW_EVIDENCE');

  for (let leftIndex = 0; leftIndex < featureDefinitions.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < featureDefinitions.length; rightIndex += 1) {
      const leftDefinition = featureDefinitions[leftIndex];
      const rightDefinition = featureDefinitions[rightIndex];
      const leftValues: number[] = [];
      const rightValues: number[] = [];

      for (const observation of input.observations) {
        const leftValue = observation.values[leftDefinition.key];
        const rightValue = observation.values[rightDefinition.key];
        if (finite(leftValue) && finite(rightValue)) {
          leftValues.push(leftValue);
          rightValues.push(rightValue);
        }
      }

      const enough = leftValues.length >= minimumPairedObservations;
      const correlation = enough ? pearson(leftValues, rightValues) : null;
      const status: CommodityFeatureCorrelationPair['status'] = !enough
        ? 'INSUFFICIENT_DATA'
        : correlation === null
          ? 'CONSTANT_SERIES'
          : 'OK';
      const highCorrelation = correlation !== null && Math.abs(correlation) >= highAbsoluteCorrelation;

      pairs.push(Object.freeze({
        leftFeature: leftDefinition.key,
        rightFeature: rightDefinition.key,
        leftLatentFactor: leftDefinition.latentFactor,
        rightLatentFactor: rightDefinition.latentFactor,
        leftCorrelationGroup: leftDefinition.correlationGroup,
        rightCorrelationGroup: rightDefinition.correlationGroup,
        pairedObservations: leftValues.length,
        correlation,
        status,
        highCorrelation,
        crossLatentFactor: leftDefinition.latentFactor !== rightDefinition.latentFactor,
        structuralSameGroup: leftDefinition.correlationGroup === rightDefinition.correlationGroup,
      }));
    }
  }

  const blockingFindings = pairs
    .filter(pair => pair.highCorrelation && pair.crossLatentFactor)
    .map(pair => (
      `HIGH_CROSS_FACTOR_CORRELATION:${pair.leftFeature}<->${pair.rightFeature}:${String(pair.correlation)}`
    ));

  return Object.freeze({
    contractVersion: COMMODITY_CORRELATION_POLICY_VERSION,
    modelId: model.modelId,
    modelVersion: model.modelVersion,
    method: 'pearson',
    minimumPairedObservations,
    highAbsoluteCorrelation,
    observations: input.observations.length,
    pairs: Object.freeze(pairs),
    blockingFindings: Object.freeze(blockingFindings),
    canonical: false,
    scoreEligible: false,
  });
}

/**
 * Converts the Owner/Drive group percentages into a review plan only. It intentionally does not
 * guess a feature- or latent-factor allocation. That allocation must be learned/validated from
 * P2 correlation, sensitivity and point-in-time backtest evidence.
 */
export function buildCommodityDriveWeightResearchPlan(
  modelId: CommodityResearchModelId,
): CommodityDriveWeightResearchPlan {
  const model = modelForId(modelId);
  const factors = new Map<string, { featureKeys: string[]; correlationGroups: Set<string> }>();
  for (const feature of model.features) {
    const current = factors.get(feature.latentFactor) ?? { featureKeys: [], correlationGroups: new Set<string>() };
    current.featureKeys.push(feature.key);
    current.correlationGroups.add(feature.correlationGroup);
    factors.set(feature.latentFactor, current);
  }

  return Object.freeze({
    contractVersion: COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION,
    modelId: model.modelId,
    modelVersion: model.modelVersion,
    sourceHypothesis: model.weightHypothesis,
    latentFactors: Object.freeze([...factors.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([factor, definition]) => Object.freeze({
        factor,
        correlationGroups: Object.freeze([...definition.correlationGroups].sort()),
        featureKeys: Object.freeze([...definition.featureKeys].sort()),
      }))),
    executable: false,
    requiresEmpiricalFactorAllocation: true,
    note: 'Drive group weights remain research hypotheses. No broad group percentage is auto-expanded into feature weights or promoted to runtime scoring.',
  });
}

/**
 * Validates a factor-level research candidate. Features inside one factor may be renormalized only
 * inside that factor. Missing factors never donate weight to another factor, preventing hidden
 * cross-factor amplification when provider coverage changes.
 */
export function validateCommodityCandidateWeightProfile(
  profile: CommodityCandidateWeightProfile,
): CommodityCandidateWeightValidation {
  const model = modelForId(profile.modelId);
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (profile.contractVersion !== COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION) {
    blockers.push('WEIGHT_CONTRACT_VERSION_MISMATCH');
  }
  if (profile.modelVersion !== model.modelVersion) blockers.push('MODEL_VERSION_MISMATCH');
  if (profile.executable !== false || profile.status !== 'research-candidate') {
    blockers.push('WEIGHT_PROFILE_MUST_REMAIN_RESEARCH_ONLY');
  }

  const modelFactors = [...new Set(model.features.map(feature => feature.latentFactor))].sort();
  const suppliedFactors = Object.keys(profile.factorWeights).sort();
  const unknownFactors = suppliedFactors.filter(factor => !modelFactors.includes(factor));
  if (unknownFactors.length > 0) blockers.push(`UNKNOWN_LATENT_FACTORS:${unknownFactors.join(',')}`);

  for (const factor of modelFactors) {
    const weight = profile.factorWeights[factor];
    if (!finite(weight) || weight < 0 || weight > 1) {
      blockers.push(`INVALID_FACTOR_WEIGHT:${factor}`);
    }
  }

  const weightSum = round(modelFactors.reduce((sum, factor) => {
    const weight = profile.factorWeights[factor];
    return finite(weight) ? sum + weight : sum;
  }, 0), 6);
  if (Math.abs(weightSum - 1) > 1e-6) blockers.push(`FACTOR_WEIGHT_SUM_NOT_ONE:${weightSum}`);

  const aggregationByFactor = new Map(profile.factorAggregations.map(item => [item.latentFactor, item]));
  for (const factor of modelFactors) {
    const expectedKeys = model.features.filter(feature => feature.latentFactor === factor).map(feature => feature.key).sort();
    const aggregation = aggregationByFactor.get(factor);
    if (!aggregation) {
      blockers.push(`MISSING_FACTOR_AGGREGATION:${factor}`);
      continue;
    }
    if (aggregation.renormalizationPolicy !== 'WITHIN_LATENT_FACTOR_ONLY') {
      blockers.push(`CROSS_FACTOR_RENORMALIZATION_FORBIDDEN:${factor}`);
    }
    const suppliedKeys = [...aggregation.featureKeys].sort();
    if (JSON.stringify(suppliedKeys) !== JSON.stringify(expectedKeys)) {
      blockers.push(`FACTOR_FEATURE_SET_MISMATCH:${factor}`);
    }
  }

  if (profile.sourceHypothesis.executable !== false || profile.sourceHypothesis.status !== 'research-hypothesis') {
    blockers.push('SOURCE_HYPOTHESIS_MUST_REMAIN_NON_EXECUTABLE');
  }

  const validWeightShape = blockers.length === 0;
  const fingerprint = validWeightShape
    ? buildEffectiveScoringFingerprintMetadata({
        modelVersion: model.modelVersion,
        featureContractVersion: model.featureContractVersion,
        nominalWeightsVersion: profile.profileVersion,
        evidenceContractVersion: COMMODITY_RESEARCH_DQ_POLICY_VERSION,
        values: Object.fromEntries(modelFactors.map(factor => [`factor:${factor}`, 1])),
        nominalWeights: Object.fromEntries(modelFactors.map(factor => [`factor:${factor}`, profile.factorWeights[factor]])),
      })
    : null;

  const zeroWeightFactors = modelFactors.filter(factor => profile.factorWeights[factor] === 0);
  if (zeroWeightFactors.length > 0) warnings.push(`ZERO_WEIGHT_FACTORS:${zeroWeightFactors.join(',')}`);

  return Object.freeze({
    contractVersion: COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION,
    valid: blockers.length === 0,
    blockers: Object.freeze(blockers),
    warnings: Object.freeze(warnings),
    weightSum,
    factorWeightFingerprint: fingerprint?.effectiveWeightFingerprint ?? null,
    effectiveFactors: Object.freeze(modelFactors),
    renormalizationPolicy: 'WITHIN_LATENT_FACTOR_ONLY',
    canonical: false,
    scoreEligible: false,
    executable: false,
  });
}

export function analyzeCommodityWeightStability(input: {
  readonly reference: CommodityCandidateWeightProfile;
  readonly variants: readonly CommodityWeightSensitivityVariant[];
}): CommodityWeightStabilityReport {
  const factors = Object.keys(input.reference.factorWeights).sort();
  const referenceTop = [...factors].sort((left, right) => (
    input.reference.factorWeights[right] - input.reference.factorWeights[left] || left.localeCompare(right)
  ))[0] ?? null;

  const findings = input.variants.map(variant => {
    const deltas = factors.map(factor => Math.abs(
      (variant.factorWeights[factor] ?? 0) - (input.reference.factorWeights[factor] ?? 0),
    ));
    const weightSum = round(factors.reduce((sum, factor) => sum + (variant.factorWeights[factor] ?? 0), 0), 6);
    const variantTop = [...factors].sort((left, right) => (
      (variant.factorWeights[right] ?? 0) - (variant.factorWeights[left] ?? 0) || left.localeCompare(right)
    ))[0] ?? null;

    return Object.freeze({
      variantId: variant.variantId,
      l1Distance: round(deltas.reduce((sum, delta) => sum + delta, 0)),
      maxAbsoluteDelta: round(deltas.length > 0 ? Math.max(...deltas) : 0),
      topFactorChanged: referenceTop !== variantTop,
      weightSum,
    });
  });

  return Object.freeze({
    contractVersion: COMMODITY_WEIGHT_STABILITY_VERSION,
    referenceProfileId: input.reference.profileId,
    findings: Object.freeze(findings),
    canonical: false,
    scoreEligible: false,
  });
}

/**
 * This is a promotion-evidence completeness check, not a promotion action. Even a complete package
 * remains non-executable and still requires explicit Owner promotion through the existing Registry.
 */
export function assessCommodityWeightPromotionEvidence(input: {
  readonly weightValidation: CommodityCandidateWeightValidation;
  readonly correlationReport: CommodityCorrelationReport | null;
  readonly stabilityReport: CommodityWeightStabilityReport | null;
  readonly backtestRunId: string | null;
}): CommodityWeightPromotionEvidenceAssessment {
  const blockers: string[] = [];
  if (!input.weightValidation.valid) blockers.push(...input.weightValidation.blockers);
  if (!input.correlationReport) blockers.push('CORRELATION_EVIDENCE_MISSING');
  else if (input.correlationReport.blockingFindings.length > 0) blockers.push(...input.correlationReport.blockingFindings);
  if (!input.stabilityReport || input.stabilityReport.findings.length === 0) blockers.push('SENSITIVITY_EVIDENCE_MISSING');
  if (!input.backtestRunId?.trim()) blockers.push('POINT_IN_TIME_BACKTEST_EVIDENCE_MISSING');

  return Object.freeze({
    contractVersion: COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION,
    readyForOwnerReview: blockers.length === 0,
    blockers: Object.freeze(blockers),
    executable: false,
    scoreEligible: false,
    ownerPromotionRequired: true,
  });
}

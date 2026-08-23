import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  isAdmissibleMarketEvidence,
  type MarketEvidenceQualityRecord,
} from '../MarketData/evidenceQualityContracts';
import { buildEffectiveScoringFingerprintMetadata } from './scoringFingerprint';
import {
  EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  EQUITY_FACTOR_FAMILIES,
  EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION,
  EQUITY_RESEARCH_MODEL_VERSION,
  type EquityClassification,
  type EquityFactorFamily,
  type EquityPrimaryProfile,
} from './EquityModelContracts';

export const EQUITY_RESEARCH_SCORING_VERSION = 'equity-research-scoring/0.1.0' as const;
export const EQUITY_RESEARCH_WEIGHTS_VERSION = 'equity-research-weights/0.1.0' as const;
export const EQUITY_MIN_FAMILY_COUNT = 4 as const;
export const EQUITY_MIN_NOMINAL_WEIGHT_COVERAGE = 0.70 as const;

export type EquityResearchStatus = 'READY' | 'NOT_COMPUTABLE';

export interface EquityFactorFamilyInput {
  /** Pre-composed family score. Subfeatures are traceability only and are never re-added at top level. */
  readonly score: number;
  readonly componentKeys: readonly string[];
  readonly evidence: readonly MarketEvidenceQualityRecord[];
}

export interface EquityResearchScoringInput {
  readonly classification: EquityClassification;
  readonly families: Partial<Readonly<Record<EquityFactorFamily, EquityFactorFamilyInput>>>;
}

export interface EquityResearchLineage {
  readonly effectiveFeatureFingerprint: string;
  readonly effectiveWeightFingerprint: string;
  readonly effectiveWeights: Readonly<Record<string, number>>;
  readonly nominalWeightsVersion: typeof EQUITY_RESEARCH_WEIGHTS_VERSION;
  readonly evidenceContractVersion: typeof MARKET_EVIDENCE_DQ_CONTRACT_VERSION;
}

export interface EquityResearchAssessment {
  readonly scoringVersion: typeof EQUITY_RESEARCH_SCORING_VERSION;
  readonly modelId: 'equity-multifactor';
  readonly modelVersion: typeof EQUITY_RESEARCH_MODEL_VERSION;
  readonly status: EquityResearchStatus;
  readonly profile: EquityPrimaryProfile;
  readonly researchCompositeScore: number | null;
  readonly factorFamilyScores: Readonly<Partial<Record<EquityFactorFamily, number>>>;
  readonly familyCoverageCount: number;
  readonly nominalWeightCoverage: number;
  readonly missingFamilies: readonly EquityFactorFamily[];
  readonly warnings: readonly string[];
  readonly lineage: EquityResearchLineage | null;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly authority: 'RESEARCH_ONLY_SCORING_DISPATCHER_PROMOTION_REQUIRED';
}

type EquityWeights = Readonly<Record<EquityFactorFamily, number>>;

export const EQUITY_PROFILE_WEIGHTS: Readonly<Record<EquityPrimaryProfile, EquityWeights>> = Object.freeze({
  compounder: Object.freeze({ quality: 0.35, valuation: 0.15, growth: 0.20, momentum: 0.10, financialStrength: 0.10, capitalAllocation: 0.10 }),
  'quality-growth': Object.freeze({ quality: 0.25, valuation: 0.15, growth: 0.30, momentum: 0.15, financialStrength: 0.10, capitalAllocation: 0.05 }),
  value: Object.freeze({ quality: 0.15, valuation: 0.35, growth: 0.10, momentum: 0.10, financialStrength: 0.20, capitalAllocation: 0.10 }),
  'cyclical-value': Object.freeze({ quality: 0.15, valuation: 0.25, growth: 0.10, momentum: 0.15, financialStrength: 0.20, capitalAllocation: 0.15 }),
  momentum: Object.freeze({ quality: 0.20, valuation: 0.10, growth: 0.15, momentum: 0.35, financialStrength: 0.15, capitalAllocation: 0.05 }),
  income: Object.freeze({ quality: 0.25, valuation: 0.15, growth: 0.05, momentum: 0.05, financialStrength: 0.20, capitalAllocation: 0.30 }),
  'turnaround-special-situation': Object.freeze({ quality: 0.15, valuation: 0.20, growth: 0.15, momentum: 0.15, financialStrength: 0.25, capitalAllocation: 0.10 }),
  financial: Object.freeze({ quality: 0.30, valuation: 0.20, growth: 0.10, momentum: 0.10, financialStrength: 0.25, capitalAllocation: 0.05 }),
  'platform-software': Object.freeze({ quality: 0.25, valuation: 0.15, growth: 0.30, momentum: 0.15, financialStrength: 0.10, capitalAllocation: 0.05 }),
  'semiconductor-ai-infrastructure': Object.freeze({ quality: 0.20, valuation: 0.15, growth: 0.25, momentum: 0.20, financialStrength: 0.15, capitalAllocation: 0.05 }),
  'healthcare-innovator': Object.freeze({ quality: 0.15, valuation: 0.10, growth: 0.25, momentum: 0.10, financialStrength: 0.30, capitalAllocation: 0.10 }),
  'energy-commodity-producer': Object.freeze({ quality: 0.15, valuation: 0.25, growth: 0.10, momentum: 0.10, financialStrength: 0.25, capitalAllocation: 0.15 }),
});

function finiteNormalized(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function round(value: number, digits = 6): number {
  return Number(value.toFixed(digits));
}

function makeAssessment(input: Omit<EquityResearchAssessment,
  'scoringVersion' | 'modelId' | 'modelVersion' | 'scoreEligible' | 'executionEligible' | 'authority'>): EquityResearchAssessment {
  return Object.freeze({
    scoringVersion: EQUITY_RESEARCH_SCORING_VERSION,
    modelId: 'equity-multifactor' as const,
    modelVersion: EQUITY_RESEARCH_MODEL_VERSION,
    ...input,
    scoreEligible: false as const,
    executionEligible: false as const,
    authority: 'RESEARCH_ONLY_SCORING_DISPATCHER_PROMOTION_REQUIRED' as const,
  });
}

/**
 * Deterministic research-only Equity scorer. It consumes already normalized factor-family scores
 * backed by admissible Market Evidence DQ records. It has no provider I/O, route authority,
 * persistence authority, ranking impact or production score eligibility.
 */
export function evaluateEquityResearchScore(input: EquityResearchScoringInput): EquityResearchAssessment {
  const profile = input.classification.primaryProfile;
  const weights = EQUITY_PROFILE_WEIGHTS[profile];
  const warnings: string[] = [];

  if (input.classification.contractVersion !== EQUITY_CLASSIFICATION_CONTRACT_VERSION || !weights) {
    return makeAssessment({
      status: 'NOT_COMPUTABLE',
      profile,
      researchCompositeScore: null,
      factorFamilyScores: Object.freeze({}),
      familyCoverageCount: 0,
      nominalWeightCoverage: 0,
      missingFamilies: Object.freeze([...EQUITY_FACTOR_FAMILIES]),
      warnings: Object.freeze(['EQUITY_CLASSIFICATION_NOT_GOVERNED']),
      lineage: null,
    });
  }

  const values: Record<EquityFactorFamily, number | undefined> = {
    quality: undefined,
    valuation: undefined,
    growth: undefined,
    momentum: undefined,
    financialStrength: undefined,
    capitalAllocation: undefined,
  };
  const familyScores: Partial<Record<EquityFactorFamily, number>> = {};
  const missingFamilies: EquityFactorFamily[] = [];

  for (const family of EQUITY_FACTOR_FAMILIES) {
    const candidate = input.families[family];
    if (!candidate) {
      missingFamilies.push(family);
      continue;
    }
    if (!finiteNormalized(candidate.score)) {
      missingFamilies.push(family);
      warnings.push(`${family}:INVALID_NORMALIZED_SCORE`);
      continue;
    }
    if (candidate.componentKeys.length === 0 || candidate.evidence.length === 0) {
      missingFamilies.push(family);
      warnings.push(`${family}:MISSING_EVIDENCE`);
      continue;
    }
    if (!candidate.evidence.every(isAdmissibleMarketEvidence)) {
      missingFamilies.push(family);
      warnings.push(`${family}:EVIDENCE_NOT_ADMISSIBLE`);
      continue;
    }

    const score = round(candidate.score * 100, 8);
    values[family] = score;
    familyScores[family] = score;
  }

  const familyCoverageCount = EQUITY_FACTOR_FAMILIES.length - missingFamilies.length;
  const nominalWeightCoverage = round(EQUITY_FACTOR_FAMILIES.reduce(
    (sum, family) => values[family] !== undefined ? sum + weights[family] : sum,
    0,
  ));

  const fingerprints = buildEffectiveScoringFingerprintMetadata({
    modelVersion: `equity-multifactor/${EQUITY_RESEARCH_MODEL_VERSION}`,
    featureContractVersion: EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION,
    nominalWeightsVersion: `${EQUITY_RESEARCH_WEIGHTS_VERSION}:${profile}`,
    evidenceContractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    values,
    nominalWeights: weights,
  });

  const lineage: EquityResearchLineage = Object.freeze({
    effectiveFeatureFingerprint: fingerprints.effectiveFeatureFingerprint,
    effectiveWeightFingerprint: fingerprints.effectiveWeightFingerprint,
    effectiveWeights: fingerprints.effectiveWeights,
    nominalWeightsVersion: EQUITY_RESEARCH_WEIGHTS_VERSION,
    evidenceContractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  });

  if (familyCoverageCount < EQUITY_MIN_FAMILY_COUNT || nominalWeightCoverage < EQUITY_MIN_NOMINAL_WEIGHT_COVERAGE) {
    warnings.push(`INSUFFICIENT_EQUITY_FAMILY_COVERAGE:${familyCoverageCount}/${EQUITY_FACTOR_FAMILIES.length}:${nominalWeightCoverage}`);
    return makeAssessment({
      status: 'NOT_COMPUTABLE',
      profile,
      researchCompositeScore: null,
      factorFamilyScores: Object.freeze({ ...familyScores }),
      familyCoverageCount,
      nominalWeightCoverage,
      missingFamilies: Object.freeze([...missingFamilies]),
      warnings: Object.freeze([...warnings]),
      lineage,
    });
  }

  const researchCompositeScore = round(EQUITY_FACTOR_FAMILIES.reduce((sum, family) => (
    sum + ((values[family] ?? 0) * (fingerprints.effectiveWeights[family] ?? 0))
  ), 0), 2);

  return makeAssessment({
    status: 'READY',
    profile,
    researchCompositeScore,
    factorFamilyScores: Object.freeze({ ...familyScores }),
    familyCoverageCount,
    nominalWeightCoverage,
    missingFamilies: Object.freeze([...missingFamilies]),
    warnings: Object.freeze([...warnings]),
    lineage,
  });
}

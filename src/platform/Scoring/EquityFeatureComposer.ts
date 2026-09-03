import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  isAdmissibleMarketEvidence,
  type MarketEvidenceQualityRecord,
} from '../MarketData/evidenceQualityContracts';
import {
  buildFinancialEvidenceId,
  type FinancialFieldProvenance,
} from '../../types/financialProvenance';
import { buildEffectiveScoringFingerprintMetadata } from './scoringFingerprint';
import {
  EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  EQUITY_FACTOR_FAMILIES,
  EQUITY_NON_EXECUTABLE_WEIGHTS_VERSION,
  EQUITY_NON_SCORING_CONTEXT_FIELDS,
  EQUITY_RESEARCH_FEATURE_BINDINGS,
  EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION,
  EQUITY_RESEARCH_MODEL_VERSION,
  type EquityClassification,
  type EquityFactorFamily,
  type EquityResearchFeatureBinding,
} from './EquityModelContracts';

export const EQUITY_FEATURE_COMPOSER_VERSION = 'equity-feature-composer/0.2.0' as const;
export const EQUITY_FUNDAMENTAL_MAX_AGE_MS = 140 * 24 * 60 * 60 * 1000;
export const EQUITY_TECHNICAL_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type EquityFeatureStatus = 'VALID' | 'MISSING' | 'STALE' | 'INVALID';

export interface EquityFundamentalEvidenceSnapshot {
  readonly peRatio?: number;
  readonly dividendYieldPct?: number;
  readonly profitMarginPct?: number;
  readonly debtToEquity?: number;
  readonly epsTtm?: number;
  readonly freeCashFlowPerShare?: number;
  readonly provenance: readonly FinancialFieldProvenance[];
}

export interface EquityTraditionalEvidenceSnapshot {
  readonly trend?: number;
  readonly momentum?: number;
  readonly breakout_quality?: number;
  readonly volatility_quality?: number;
  readonly relative_strength?: number;
  readonly provenance?: readonly FinancialFieldProvenance[];
}

export interface EquityResearchFeatureObservation {
  readonly key: string;
  readonly family: EquityFactorFamily;
  readonly correlationGroup: string;
  readonly sourceFields: readonly string[];
  readonly rawValue: number | null;
  readonly unit: string;
  readonly status: EquityFeatureStatus;
  readonly evidence: readonly MarketEvidenceQualityRecord[];
  readonly reason?: string;
}

export interface EquityContextObservation {
  readonly field: typeof EQUITY_NON_SCORING_CONTEXT_FIELDS[number];
  readonly rawValue: number | null;
  readonly status: EquityFeatureStatus;
  readonly evidence: readonly MarketEvidenceQualityRecord[];
  readonly scoreImpact: false;
}

export interface EquityFamilyCoverage {
  readonly family: EquityFactorFamily;
  readonly valid: number;
  readonly total: number;
  readonly coverage: number;
}

export interface EquityResearchFeatureLineage {
  readonly effectiveFeatureFingerprint: string;
  readonly nonExecutableWeightFingerprint: string;
  readonly nominalWeightsVersion: typeof EQUITY_NON_EXECUTABLE_WEIGHTS_VERSION;
  readonly evidenceContractVersion: typeof MARKET_EVIDENCE_DQ_CONTRACT_VERSION;
  readonly weightFingerprintSemantic: 'NON_EXECUTABLE_ZERO_WEIGHT';
}

export interface EquityResearchFeatureSnapshot {
  readonly composerVersion: typeof EQUITY_FEATURE_COMPOSER_VERSION;
  readonly modelVersion: typeof EQUITY_RESEARCH_MODEL_VERSION;
  readonly featureContractVersion: typeof EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION;
  readonly assetId: string;
  readonly classification: EquityClassification;
  readonly capturedAt: string;
  readonly features: readonly EquityResearchFeatureObservation[];
  readonly context: readonly EquityContextObservation[];
  readonly familyCoverage: readonly EquityFamilyCoverage[];
  readonly validFeatures: readonly string[];
  readonly missingFeatures: readonly string[];
  readonly staleFeatures: readonly string[];
  readonly invalidFeatures: readonly string[];
  readonly warnings: readonly string[];
  readonly lineage: EquityResearchFeatureLineage;
  readonly researchCompositeScore: null;
  readonly canonical: false;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly promotionReady: false;
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isoTimestamp(value: string | undefined): string | null {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

function qualityRecord(input: {
  assetId: string;
  featureKey: string;
  provenance: FinancialFieldProvenance;
  evaluatedAt: string;
  maxAgeMs: number;
}): MarketEvidenceQualityRecord {
  const retrievedAt = isoTimestamp(input.provenance.retrievedAt);
  const observedAt = isoTimestamp(input.provenance.observedAt);
  const evaluatedMs = Date.parse(input.evaluatedAt);
  const observedMs = observedAt ? Date.parse(observedAt) : NaN;
  const futureObservation = observedAt !== null && observedMs > evaluatedMs;
  const ageMs = observedAt && !futureObservation ? evaluatedMs - observedMs : null;
  const qualityStatus: MarketEvidenceQualityRecord['qualityStatus'] = !retrievedAt
    ? 'INVALID'
    : futureObservation
      ? 'CONFLICTING'
      : !observedAt
        ? 'UNAVAILABLE'
        : ageMs !== null && ageMs <= input.maxAgeMs
          ? 'VERIFIED'
          : 'STALE';

  return Object.freeze({
    assetId: input.assetId,
    providerId: input.provenance.provider.toLowerCase(),
    capability: input.provenance.derivedFrom?.includes('close-history') ? 'stock-market-history' : 'stock-fundamentals',
    field: input.featureKey,
    observedAt,
    retrievedAt: retrievedAt ?? input.evaluatedAt,
    freshness: Object.freeze({
      ageMs,
      maxAgeMs: input.maxAgeMs,
      evaluatedAt: input.evaluatedAt,
    }),
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus,
    evidenceRef: qualityStatus === 'VERIFIED'
      ? buildFinancialEvidenceId(input.assetId, input.provenance)
      : null,
  });
}

function statusFromEvidence(evidence: readonly MarketEvidenceQualityRecord[]): EquityFeatureStatus {
  if (evidence.length === 0) return 'MISSING';
  if (evidence.every(isAdmissibleMarketEvidence)) return 'VALID';
  if (evidence.some(item => item.qualityStatus === 'STALE')) return 'STALE';
  if (evidence.some(item => item.qualityStatus === 'INVALID' || item.qualityStatus === 'CONFLICTING')) return 'INVALID';
  return 'MISSING';
}

function findMatchingProvenance(
  provenance: readonly FinancialFieldProvenance[],
  field: string,
  value: number,
): FinancialFieldProvenance | undefined {
  const candidates = provenance.filter(item => item.field === field && finite(item.value));
  return candidates.find(item => item.value === value && Boolean(item.observedAt))
    ?? candidates.find(item => item.value === value)
    ?? candidates.find(item => Boolean(item.observedAt))
    ?? candidates[0];
}

function missingFeature(binding: EquityResearchFeatureBinding, reason = 'RAW_VALUE_MISSING'): EquityResearchFeatureObservation {
  return Object.freeze({
    key: binding.key,
    family: binding.family,
    correlationGroup: binding.correlationGroup,
    sourceFields: binding.sourceFields,
    rawValue: null,
    unit: binding.unit,
    status: 'MISSING' as const,
    evidence: Object.freeze([]),
    reason,
  });
}

function simpleFeature(input: {
  binding: EquityResearchFeatureBinding;
  assetId: string;
  value: number | undefined;
  sourceField: string;
  provenance: readonly FinancialFieldProvenance[];
  evaluatedAt: string;
  maxAgeMs: number;
}): EquityResearchFeatureObservation {
  if (!finite(input.value)) return missingFeature(input.binding);
  const source = findMatchingProvenance(input.provenance, input.sourceField, input.value);
  if (!source) {
    return Object.freeze({
      ...missingFeature(input.binding, 'PROVENANCE_MISSING'),
      rawValue: input.value,
      status: 'INVALID' as const,
    });
  }
  const evidence = Object.freeze([qualityRecord({
    assetId: input.assetId,
    featureKey: input.binding.key,
    provenance: source,
    evaluatedAt: input.evaluatedAt,
    maxAgeMs: input.maxAgeMs,
  })]);
  const status = statusFromEvidence(evidence);
  return Object.freeze({
    key: input.binding.key,
    family: input.binding.family,
    correlationGroup: input.binding.correlationGroup,
    sourceFields: input.binding.sourceFields,
    rawValue: input.value,
    unit: input.binding.unit,
    status,
    evidence,
    reason: status === 'VALID' ? undefined : evidence[0].qualityStatus,
  });
}

function freeCashFlowConversionFeature(input: {
  binding: EquityResearchFeatureBinding;
  assetId: string;
  fundamentals: EquityFundamentalEvidenceSnapshot;
  evaluatedAt: string;
}): EquityResearchFeatureObservation {
  const eps = input.fundamentals.epsTtm;
  const fcf = input.fundamentals.freeCashFlowPerShare;
  if (!finite(eps) || !finite(fcf)) return missingFeature(input.binding);
  if (eps <= 0) {
    return Object.freeze({ ...missingFeature(input.binding, 'NON_POSITIVE_EPS'), rawValue: null, status: 'INVALID' as const });
  }

  const epsSource = findMatchingProvenance(input.fundamentals.provenance, 'epsTtm', eps);
  const fcfSource = findMatchingProvenance(input.fundamentals.provenance, 'freeCashFlowPerShare', fcf);
  if (!epsSource || !fcfSource) {
    return Object.freeze({ ...missingFeature(input.binding, 'PROVENANCE_MISSING'), rawValue: fcf / eps, status: 'INVALID' as const });
  }

  const epsObservedAt = isoTimestamp(epsSource.observedAt);
  const fcfObservedAt = isoTimestamp(fcfSource.observedAt);
  const aligned = epsSource.provider === fcfSource.provider
    && epsObservedAt !== null
    && epsObservedAt === fcfObservedAt;
  if (!aligned) {
    return Object.freeze({
      ...missingFeature(input.binding, 'FCF_EPS_PROVIDER_OR_PERIOD_MISMATCH'),
      rawValue: fcf / eps,
      status: 'INVALID' as const,
    });
  }

  const evidence = Object.freeze([epsSource, fcfSource].map(provenance => qualityRecord({
    assetId: input.assetId,
    featureKey: input.binding.key,
    provenance,
    evaluatedAt: input.evaluatedAt,
    maxAgeMs: EQUITY_FUNDAMENTAL_MAX_AGE_MS,
  })));
  const status = statusFromEvidence(evidence);
  return Object.freeze({
    key: input.binding.key,
    family: input.binding.family,
    correlationGroup: input.binding.correlationGroup,
    sourceFields: input.binding.sourceFields,
    rawValue: fcf / eps,
    unit: input.binding.unit,
    status,
    evidence,
    reason: status === 'VALID' ? undefined : 'FCF_EPS_EVIDENCE_NOT_ADMISSIBLE',
  });
}

function contextObservation(input: {
  assetId: string;
  field: typeof EQUITY_NON_SCORING_CONTEXT_FIELDS[number];
  value: number | undefined;
  provenance: readonly FinancialFieldProvenance[];
  evaluatedAt: string;
}): EquityContextObservation {
  if (!finite(input.value)) {
    return Object.freeze({ field: input.field, rawValue: null, status: 'MISSING' as const, evidence: Object.freeze([]), scoreImpact: false as const });
  }
  const source = findMatchingProvenance(input.provenance, input.field, input.value);
  const evidence: readonly MarketEvidenceQualityRecord[] = source ? Object.freeze([qualityRecord({
    assetId: input.assetId,
    featureKey: `context.${input.field}`,
    provenance: source,
    evaluatedAt: input.evaluatedAt,
    maxAgeMs: EQUITY_FUNDAMENTAL_MAX_AGE_MS,
  })]) : Object.freeze([]);
  return Object.freeze({
    field: input.field,
    rawValue: input.value,
    status: source ? statusFromEvidence(evidence) : 'INVALID',
    evidence,
    scoreImpact: false as const,
  });
}

function familyCoverage(features: readonly EquityResearchFeatureObservation[]): EquityFamilyCoverage[] {
  return EQUITY_FACTOR_FAMILIES.map(family => {
    const familyFeatures = features.filter(feature => feature.family === family);
    const valid = familyFeatures.filter(feature => feature.status === 'VALID').length;
    return Object.freeze({
      family,
      valid,
      total: familyFeatures.length,
      coverage: familyFeatures.length === 0 ? 0 : Number((valid / familyFeatures.length).toFixed(4)),
    });
  });
}

export function composeEquityResearchFeatureSnapshot(input: {
  readonly assetId: string;
  readonly classification: EquityClassification;
  readonly fundamentals?: EquityFundamentalEvidenceSnapshot;
  readonly traditional?: EquityTraditionalEvidenceSnapshot;
  readonly evaluatedAt?: string;
}): EquityResearchFeatureSnapshot {
  const assetId = input.assetId.trim().toUpperCase();
  const evaluatedAt = input.evaluatedAt ?? new Date().toISOString();
  if (!assetId) throw new Error('EQUITY_FEATURE_ASSET_ID_REQUIRED');
  if (input.classification.contractVersion !== EQUITY_CLASSIFICATION_CONTRACT_VERSION) {
    throw new Error('EQUITY_CLASSIFICATION_CONTRACT_MISMATCH');
  }
  if (!Number.isFinite(Date.parse(evaluatedAt))) throw new Error('EQUITY_FEATURE_INVALID_EVALUATED_AT');

  const fundamentals: EquityFundamentalEvidenceSnapshot = input.fundamentals ?? { provenance: [] };
  const traditional: EquityTraditionalEvidenceSnapshot = input.traditional ?? { provenance: [] };
  const bindings = new Map(EQUITY_RESEARCH_FEATURE_BINDINGS.map(item => [item.key, item]));
  const bindingFor = (key: string): EquityResearchFeatureBinding => {
    const found = bindings.get(key);
    if (!found) throw new Error(`EQUITY_FEATURE_BINDING_MISSING:${key}`);
    return found;
  };

  const features: EquityResearchFeatureObservation[] = [
    simpleFeature({ binding: bindingFor('quality.profitMarginPct'), assetId, value: fundamentals.profitMarginPct, sourceField: 'profitMarginPct', provenance: fundamentals.provenance, evaluatedAt, maxAgeMs: EQUITY_FUNDAMENTAL_MAX_AGE_MS }),
    freeCashFlowConversionFeature({ binding: bindingFor('quality.freeCashFlowConversion'), assetId, fundamentals, evaluatedAt }),
    simpleFeature({ binding: bindingFor('valuation.peRatio'), assetId, value: fundamentals.peRatio, sourceField: 'peRatio', provenance: fundamentals.provenance, evaluatedAt, maxAgeMs: EQUITY_FUNDAMENTAL_MAX_AGE_MS }),
    simpleFeature({ binding: bindingFor('momentum.trend'), assetId, value: traditional.trend, sourceField: 'trend', provenance: traditional.provenance ?? [], evaluatedAt, maxAgeMs: EQUITY_TECHNICAL_MAX_AGE_MS }),
    simpleFeature({ binding: bindingFor('momentum.momentum'), assetId, value: traditional.momentum, sourceField: 'momentum', provenance: traditional.provenance ?? [], evaluatedAt, maxAgeMs: EQUITY_TECHNICAL_MAX_AGE_MS }),
    simpleFeature({ binding: bindingFor('momentum.breakoutQuality'), assetId, value: traditional.breakout_quality, sourceField: 'breakout_quality', provenance: traditional.provenance ?? [], evaluatedAt, maxAgeMs: EQUITY_TECHNICAL_MAX_AGE_MS }),
    simpleFeature({ binding: bindingFor('momentum.volatilityQuality'), assetId, value: traditional.volatility_quality, sourceField: 'volatility_quality', provenance: traditional.provenance ?? [], evaluatedAt, maxAgeMs: EQUITY_TECHNICAL_MAX_AGE_MS }),
    simpleFeature({ binding: bindingFor('momentum.relativeStrength'), assetId, value: traditional.relative_strength, sourceField: 'relative_strength', provenance: traditional.provenance ?? [], evaluatedAt, maxAgeMs: EQUITY_TECHNICAL_MAX_AGE_MS }),
    simpleFeature({ binding: bindingFor('financialStrength.debtToEquity'), assetId, value: fundamentals.debtToEquity, sourceField: 'debtToEquity', provenance: fundamentals.provenance, evaluatedAt, maxAgeMs: EQUITY_FUNDAMENTAL_MAX_AGE_MS }),
  ];

  for (const binding of EQUITY_RESEARCH_FEATURE_BINDINGS.filter(binding => binding.phase === 'P1B')) {
    if (!features.some(feature => feature.key === binding.key)) {
      features.push(missingFeature(binding, 'P1B_FILING_EVIDENCE_NOT_ACQUIRED'));
    }
  }

  const context = EQUITY_NON_SCORING_CONTEXT_FIELDS.map(field => contextObservation({
    assetId,
    field,
    value: fundamentals[field],
    provenance: fundamentals.provenance,
    evaluatedAt,
  }));

  const presenceValues = Object.fromEntries(features.map(feature => [feature.key, feature.status === 'VALID' ? 1 : null]));
  const zeroWeights = Object.fromEntries(features.map(feature => [feature.key, 0]));
  const fingerprint = buildEffectiveScoringFingerprintMetadata({
    modelVersion: EQUITY_RESEARCH_MODEL_VERSION,
    featureContractVersion: EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION,
    nominalWeightsVersion: EQUITY_NON_EXECUTABLE_WEIGHTS_VERSION,
    evidenceContractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    values: presenceValues,
    nominalWeights: zeroWeights,
  });

  const validFeatures = features.filter(feature => feature.status === 'VALID').map(feature => feature.key);
  const missingFeatures = features.filter(feature => feature.status === 'MISSING').map(feature => feature.key);
  const staleFeatures = features.filter(feature => feature.status === 'STALE').map(feature => feature.key);
  const invalidFeatures = features.filter(feature => feature.status === 'INVALID').map(feature => feature.key);

  return Object.freeze({
    composerVersion: EQUITY_FEATURE_COMPOSER_VERSION,
    modelVersion: EQUITY_RESEARCH_MODEL_VERSION,
    featureContractVersion: EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION,
    assetId,
    classification: input.classification,
    capturedAt: evaluatedAt,
    features: Object.freeze(features),
    context: Object.freeze(context),
    familyCoverage: Object.freeze(familyCoverage(features)),
    validFeatures: Object.freeze(validFeatures),
    missingFeatures: Object.freeze(missingFeatures),
    staleFeatures: Object.freeze(staleFeatures),
    invalidFeatures: Object.freeze(invalidFeatures),
    warnings: Object.freeze([
      'EQUITY_RESEARCH_HAS_NO_COMPOSITE_SCORE_OR_EXECUTABLE_WEIGHTS',
      'P1B_FILING_FEATURES_REMAIN_MISSING_UNTIL_ADMISSIBLE_PIT_EVIDENCE_IS_AUGMENTED',
      'PEER_SECTOR_NORMALIZATION_AND_EMPIRICAL_CORRELATION_VALIDATION_REQUIRED_BEFORE_PROMOTION',
    ]),
    lineage: Object.freeze({
      effectiveFeatureFingerprint: fingerprint.effectiveFeatureFingerprint,
      nonExecutableWeightFingerprint: fingerprint.effectiveWeightFingerprint,
      nominalWeightsVersion: EQUITY_NON_EXECUTABLE_WEIGHTS_VERSION,
      evidenceContractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
      weightFingerprintSemantic: 'NON_EXECUTABLE_ZERO_WEIGHT' as const,
    }),
    researchCompositeScore: null,
    canonical: false,
    scoreEligible: false,
    executionEligible: false,
    promotionReady: false,
  });
}

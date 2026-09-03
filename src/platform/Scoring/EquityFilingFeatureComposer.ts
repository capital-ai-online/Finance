import { isAdmissibleMarketEvidence, MARKET_EVIDENCE_DQ_CONTRACT_VERSION } from '../MarketData/evidenceQualityContracts';
import { buildEffectiveScoringFingerprintMetadata } from './scoringFingerprint';
import {
  EQUITY_FACTOR_FAMILIES,
  EQUITY_NON_EXECUTABLE_WEIGHTS_VERSION,
  EQUITY_RESEARCH_FEATURE_BINDINGS,
  EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION,
  EQUITY_RESEARCH_MODEL_VERSION,
  type EquityFactorFamily,
  type EquityResearchFeatureBinding,
} from './EquityModelContracts';
import type {
  EquityFamilyCoverage,
  EquityResearchFeatureObservation,
  EquityResearchFeatureSnapshot,
} from './EquityFeatureComposer';
import type {
  EquityDerivedMetric,
  EquityFilingDerivedMetricsResult,
} from './EquityFilingDerivedMetrics';
import type {
  EquityComparableFilingMetricsResult,
  EquityComparableMetric,
} from './EquityComparableFilingMetrics';

export const EQUITY_FILING_FEATURE_COMPOSER_VERSION = 'equity-filing-feature-composer/0.2.0' as const;

export interface EquityFilingFeatureDiagnostics {
  readonly compositionVersion: typeof EQUITY_FILING_FEATURE_COMPOSER_VERSION;
  readonly addedFeatureKeys: readonly string[];
  readonly supersededFeatureKeys: readonly string[];
  readonly contextOnlyMetricIds: readonly string[];
  readonly rejectedMetricIds: readonly string[];
  readonly warnings: readonly string[];
  readonly sourcePriority: 'VERIFIED_FILING_EVIDENCE_SUPERSEDES_SAME_CORRELATION_VENDOR_PROXY';
  readonly promotionReady: false;
}

export interface EquityFilingFeatureCompositionResult {
  readonly snapshot: EquityResearchFeatureSnapshot;
  readonly diagnostics: EquityFilingFeatureDiagnostics;
}

function bindingFor(key: string): EquityResearchFeatureBinding {
  const found = EQUITY_RESEARCH_FEATURE_BINDINGS.find(binding => binding.key === key);
  if (!found) throw new Error(`EQUITY_P1B_FEATURE_BINDING_MISSING:${key}`);
  return found;
}

function familyCoverage(features: readonly EquityResearchFeatureObservation[]): EquityFamilyCoverage[] {
  const coverageKeys = new Set(EQUITY_RESEARCH_FEATURE_BINDINGS
    .filter(binding => binding.direction !== 'context-only')
    .map(binding => binding.key));
  return EQUITY_FACTOR_FAMILIES.map(family => {
    const familyFeatures = features.filter(feature => feature.family === family && coverageKeys.has(feature.key));
    const valid = familyFeatures.filter(feature => feature.status === 'VALID').length;
    return Object.freeze({
      family,
      valid,
      total: familyFeatures.length,
      coverage: familyFeatures.length === 0 ? 0 : Number((valid / familyFeatures.length).toFixed(4)),
    });
  });
}

function derivedObservation(
  key: string,
  metric: EquityDerivedMetric | undefined,
): EquityResearchFeatureObservation | null {
  if (!metric) return null;
  const binding = bindingFor(key);
  const evidence = metric.evidence;
  const valid = evidence.length > 0 && evidence.every(isAdmissibleMarketEvidence);
  return Object.freeze({
    key,
    family: binding.family,
    correlationGroup: binding.correlationGroup,
    sourceFields: Object.freeze([...metric.sourceFields]),
    rawValue: metric.value,
    unit: metric.unit,
    status: valid ? 'VALID' as const : 'INVALID' as const,
    evidence,
    reason: valid ? undefined : 'FILING_DERIVED_EVIDENCE_NOT_ADMISSIBLE',
  });
}

function comparableObservation(
  key: string,
  metric: EquityComparableMetric | undefined,
): EquityResearchFeatureObservation | null {
  if (!metric) return null;
  const binding = bindingFor(key);
  const valid = metric.evidence.length > 0 && metric.evidence.every(isAdmissibleMarketEvidence);
  return Object.freeze({
    key,
    family: binding.family,
    correlationGroup: binding.correlationGroup,
    sourceFields: binding.sourceFields,
    rawValue: metric.valuePct,
    unit: 'percent',
    status: valid ? 'VALID' as const : 'INVALID' as const,
    evidence: metric.evidence,
    reason: valid ? undefined : 'COMPARABLE_FILING_EVIDENCE_NOT_ADMISSIBLE',
  });
}

function replaceOrAppend(
  features: EquityResearchFeatureObservation[],
  observation: EquityResearchFeatureObservation | null,
  superseded: string[],
  added: string[],
): void {
  if (!observation) return;
  const index = features.findIndex(feature => feature.key === observation.key);
  if (index >= 0) {
    const prior = features[index];
    features[index] = observation;
    if (prior.status === 'MISSING') added.push(observation.key);
    else superseded.push(observation.key);
  } else {
    features.push(observation);
    added.push(observation.key);
  }
}

/**
 * P1-B augmentation keeps the Equity model non-executable. Filing facts can supersede economically
 * equivalent vendor proxies, but no family score is calculated and every effective weight remains
 * zero. Context-only filing telemetry is kept out of family coverage.
 */
export function augmentEquityResearchSnapshotWithFilingEvidence(input: {
  readonly base: EquityResearchFeatureSnapshot;
  readonly filing: EquityFilingDerivedMetricsResult;
  readonly comparable?: EquityComparableFilingMetricsResult;
}): EquityFilingFeatureCompositionResult {
  if (input.filing.assetId !== input.base.assetId || (input.comparable && input.comparable.assetId !== input.base.assetId)) {
    return Object.freeze({
      snapshot: input.base,
      diagnostics: Object.freeze({
        compositionVersion: EQUITY_FILING_FEATURE_COMPOSER_VERSION,
        addedFeatureKeys: Object.freeze([]),
        supersededFeatureKeys: Object.freeze([]),
        contextOnlyMetricIds: Object.freeze([]),
        rejectedMetricIds: Object.freeze(['ASSET_ID_MISMATCH']),
        warnings: Object.freeze(['P1B_FILING_AUGMENTATION_SKIPPED_ASSET_ID_MISMATCH']),
        sourcePriority: 'VERIFIED_FILING_EVIDENCE_SUPERSEDES_SAME_CORRELATION_VENDOR_PROXY' as const,
        promotionReady: false as const,
      }),
    });
  }

  const features = [...input.base.features];
  const added: string[] = [];
  const superseded: string[] = [];
  const contextOnlyMetricIds: string[] = [];
  const rejected: string[] = [];

  const debt = input.filing.metrics.totalLongTermDebtToEquity ?? input.filing.metrics.noncurrentLongTermDebtToEquity;
  replaceOrAppend(features, derivedObservation('financialStrength.debtToEquity', debt), superseded, added);
  replaceOrAppend(features, derivedObservation('financialStrength.currentRatio', input.filing.metrics.currentRatio), superseded, added);
  replaceOrAppend(features, derivedObservation('financialStrength.interestCoverage', input.filing.metrics.interestCoverage), superseded, added);

  const comparable = input.comparable?.metrics;
  replaceOrAppend(features, comparableObservation('growth.revenueGrowthYoYPct', comparable?.revenueGrowthYoYPct), superseded, added);
  replaceOrAppend(features, comparableObservation('growth.dilutedEpsGrowthYoYPct', comparable?.dilutedEpsGrowthYoYPct), superseded, added);
  replaceOrAppend(features, comparableObservation('growth.freeCashFlowGrowthYoYPct', comparable?.freeCashFlowGrowthYoYPct), superseded, added);
  replaceOrAppend(features, comparableObservation('capitalAllocation.shareCountChangeYoYPct', comparable?.shareCountChangeYoYPct), superseded, added);
  replaceOrAppend(features, derivedObservation('capitalAllocation.distributionCoverageYtd', input.filing.metrics.distributionCoverageYtd), superseded, added);
  if (input.filing.metrics.reinvestmentIntensityYtd) contextOnlyMetricIds.push('reinvestmentIntensityYtd');

  rejected.push(...input.filing.rejectedEvidence, ...input.filing.periodMismatches);
  if (input.comparable) rejected.push(...input.comparable.rejectedEvidence, ...input.comparable.periodMismatches);

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
  const capitalValid = features.filter(feature => feature.family === 'capitalAllocation' && feature.status === 'VALID').map(feature => feature.key);

  const warnings = [
    ...input.base.warnings.filter(warning => !warning.startsWith('P1B_FILING_FEATURES_REMAIN_MISSING_')),
    'P1B_PIT_FILING_EVIDENCE_RESEARCH_ONLY_NO_EXECUTABLE_WEIGHTS',
    'SEC_FILING_SUPERSEDES_SAME_CORRELATION_VENDOR_PROXY_WITHOUT_STACKING',
    'PEER_SECTOR_NORMALIZATION_AND_EMPIRICAL_CORRELATION_VALIDATION_REQUIRED_BEFORE_PROMOTION',
  ];
  if (contextOnlyMetricIds.length > 0) warnings.push('REINVESTMENT_INTENSITY_REMAINS_CONTEXT_ONLY_UNTIL_P1C_NORMALIZATION');
  if (!capitalValid.includes('capitalAllocation.shareCountChangeYoYPct') || !capitalValid.includes('capitalAllocation.distributionCoverageYtd')) {
    warnings.push('CAPITAL_ALLOCATION_PROMOTION_GATE_REQUIRES_SHARE_COUNT_CHANGE_AND_DISTRIBUTION_COVERAGE');
  }

  const snapshot: EquityResearchFeatureSnapshot = Object.freeze({
    ...input.base,
    modelVersion: EQUITY_RESEARCH_MODEL_VERSION,
    featureContractVersion: EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION,
    features: Object.freeze(features),
    familyCoverage: Object.freeze(familyCoverage(features)),
    validFeatures: Object.freeze(validFeatures),
    missingFeatures: Object.freeze(missingFeatures),
    staleFeatures: Object.freeze(staleFeatures),
    invalidFeatures: Object.freeze(invalidFeatures),
    warnings: Object.freeze([...new Set(warnings)]),
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

  return Object.freeze({
    snapshot,
    diagnostics: Object.freeze({
      compositionVersion: EQUITY_FILING_FEATURE_COMPOSER_VERSION,
      addedFeatureKeys: Object.freeze([...new Set(added)].sort()),
      supersededFeatureKeys: Object.freeze([...new Set(superseded)].sort()),
      contextOnlyMetricIds: Object.freeze([...new Set(contextOnlyMetricIds)].sort()),
      rejectedMetricIds: Object.freeze([...new Set(rejected)].sort()),
      warnings: snapshot.warnings,
      sourcePriority: 'VERIFIED_FILING_EVIDENCE_SUPERSEDES_SAME_CORRELATION_VENDOR_PROXY' as const,
      promotionReady: false as const,
    }),
  });
}

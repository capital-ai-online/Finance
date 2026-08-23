import {
  isAdmissibleMarketEvidence,
  type MarketEvidenceQualityRecord,
} from '../MarketData/evidenceQualityContracts';
import type { EquityFactorFamily } from './EquityModelContracts';
import type { EquityFactorFamilyInput, EquityResearchScoringInput } from './EquityResearchScoring';
import type {
  EquityDerivedMetric,
  EquityDerivedMetricId,
  EquityFilingDerivedMetricsResult,
  EquityFilingEvidenceSnapshot,
  EquityFilingFactInput,
} from './EquityFilingDerivedMetrics';
import type { EquityFeatureCompositionResult } from './EquityFeatureComposer';

export const EQUITY_FILING_FEATURE_COMPOSITION_VERSION = 'equity-filing-feature-composition/0.1.0' as const;

export interface EquityFilingFeatureDiagnostics {
  readonly compositionVersion: typeof EQUITY_FILING_FEATURE_COMPOSITION_VERSION;
  readonly usedMetricIds: readonly EquityDerivedMetricId[];
  readonly deferredMetricIds: readonly EquityDerivedMetricId[];
  readonly overriddenFamilies: readonly EquityFactorFamily[];
  readonly warnings: readonly string[];
  readonly sourcePriority: 'PRIMARY_FILING_EVIDENCE_OVER_VENDOR_DERIVED_FOR_SAME_CORRELATION_GROUP';
  readonly promotionReady: false;
}

export interface EquityFilingFeatureCompositionResult {
  readonly input: EquityResearchScoringInput;
  readonly diagnostics: EquityFilingFeatureDiagnostics;
}

interface FilingComponent {
  readonly key: string;
  readonly score: number;
  readonly evidence: readonly MarketEvidenceQualityRecord[];
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function normalizeRange(value: number, low: number, high: number): number {
  if (!Number.isFinite(value) || high <= low) return 0;
  return clamp01((value - low) / (high - low));
}

function normalizeInverseRange(value: number, best: number, worst: number): number {
  if (!Number.isFinite(value) || worst <= best) return 0;
  return clamp01((worst - value) / (worst - best));
}

function factsForMetric(
  snapshot: EquityFilingEvidenceSnapshot,
  metric: EquityDerivedMetric,
): readonly EquityFilingFactInput[] {
  const facts = metric.sourceFields
    .map((field) => snapshot.facts[field])
    .filter((fact): fact is EquityFilingFactInput => Boolean(fact));
  if (facts.length !== metric.sourceFields.length) return Object.freeze([]);
  if (facts.some((fact) => fact.evidence.assetId !== snapshot.assetId || !isAdmissibleMarketEvidence(fact.evidence))) {
    return Object.freeze([]);
  }
  return Object.freeze(facts);
}

function component(
  snapshot: EquityFilingEvidenceSnapshot,
  metric: EquityDerivedMetric | undefined,
  key: string,
  score: number | undefined,
): FilingComponent | null {
  if (!metric || score === undefined || !Number.isFinite(score)) return null;
  const facts = factsForMetric(snapshot, metric);
  if (facts.length === 0) return null;
  const evidence = [...new Map(facts.map((fact) => [
    fact.evidence.evidenceRef ?? `${fact.field}:${fact.accession}`,
    fact.evidence,
  ])).values()];
  return Object.freeze({ key, score: clamp01(score), evidence: Object.freeze(evidence) });
}

function family(components: readonly (FilingComponent | null)[], minimumComponents: number): EquityFactorFamilyInput | undefined {
  const valid = components.filter((item): item is FilingComponent => Boolean(item));
  if (valid.length < minimumComponents) return undefined;
  const evidence = [...new Map(valid.flatMap((item) => item.evidence).map((item) => [
    item.evidenceRef ?? `${item.providerId}:${item.field}:${item.observedAt ?? ''}`,
    item,
  ])).values()];
  return Object.freeze({
    score: valid.reduce((sum, item) => sum + item.score, 0) / valid.length,
    componentKeys: Object.freeze(valid.map((item) => item.key)),
    evidence: Object.freeze(evidence),
  });
}

/**
 * Adds provider-neutral filing-derived research features to the existing Equity feature composition.
 *
 * Primary filing evidence wins only inside the same economic correlation group. For example, when
 * SEC-derived debt capitalization is sufficiently evidenced, the vendor-derived debtToEquity family
 * component is replaced rather than stacked. This prevents AlphaVantage/FMP/SEC double counting.
 *
 * Capital-allocation raw metrics remain deferred until at least two independent, directionally
 * governed observations exist. Distribution coverage and reinvestment intensity are therefore kept
 * as research telemetry in 0.1.0 and do not manufacture a Capital Allocation family by themselves.
 */
export function augmentEquityResearchWithFilingEvidence(input: {
  readonly base: EquityFeatureCompositionResult;
  readonly snapshot: EquityFilingEvidenceSnapshot;
  readonly derived: EquityFilingDerivedMetricsResult;
}): EquityFilingFeatureCompositionResult {
  const warnings: string[] = [];
  const usedMetricIds: EquityDerivedMetricId[] = [];
  const deferredMetricIds: EquityDerivedMetricId[] = [];
  const overriddenFamilies: EquityFactorFamily[] = [];

  if (input.derived.assetId !== input.snapshot.assetId) {
    return Object.freeze({
      input: input.base.input,
      diagnostics: Object.freeze({
        compositionVersion: EQUITY_FILING_FEATURE_COMPOSITION_VERSION,
        usedMetricIds: Object.freeze([]),
        deferredMetricIds: Object.freeze([]),
        overriddenFamilies: Object.freeze([]),
        warnings: Object.freeze(['FILING_DERIVED_ASSET_ID_MISMATCH']),
        sourcePriority: 'PRIMARY_FILING_EVIDENCE_OVER_VENDOR_DERIVED_FOR_SAME_CORRELATION_GROUP' as const,
        promotionReady: false as const,
      }),
    });
  }

  const currentRatio = input.derived.metrics.currentRatio;
  const debtToEquity = input.derived.metrics.totalLongTermDebtToEquity
    ?? input.derived.metrics.noncurrentLongTermDebtToEquity;
  const interestCoverage = input.derived.metrics.interestCoverage;

  const financialStrength = family([
    component(
      input.snapshot,
      currentRatio,
      'financialStrength.currentRatioQuality',
      currentRatio ? normalizeRange(currentRatio.value, 0.75, 2.0) : undefined,
    ),
    component(
      input.snapshot,
      debtToEquity,
      'financialStrength.debtToEquityQuality',
      debtToEquity && debtToEquity.value >= 0 ? normalizeInverseRange(debtToEquity.value, 0, 2.5) : undefined,
    ),
    component(
      input.snapshot,
      interestCoverage,
      'financialStrength.interestCoverageQuality',
      interestCoverage ? normalizeRange(interestCoverage.value, 0, 8) : undefined,
    ),
  ], 2);

  const families: Partial<Record<EquityFactorFamily, EquityFactorFamilyInput>> = {
    ...input.base.input.families,
  };

  if (financialStrength) {
    families.financialStrength = financialStrength;
    overriddenFamilies.push('financialStrength');
    if (currentRatio) usedMetricIds.push('currentRatio');
    if (debtToEquity) usedMetricIds.push(debtToEquity.id);
    if (interestCoverage) usedMetricIds.push('interestCoverage');
    warnings.push('SEC_FILING_PRIMARY_OVERRIDE:financialStrength');
  } else if (currentRatio || debtToEquity || interestCoverage) {
    warnings.push('SEC_FILING_FINANCIAL_STRENGTH_INSUFFICIENT_COMPONENT_COVERAGE');
  }

  const distributionCoverage = input.derived.metrics.distributionCoverageYtd;
  const reinvestmentIntensity = input.derived.metrics.reinvestmentIntensityYtd;
  const freeCashFlow = input.derived.metrics.freeCashFlowYtd;
  const shareholderDistributions = input.derived.metrics.shareholderDistributionsYtd;
  for (const metric of [distributionCoverage, reinvestmentIntensity, freeCashFlow, shareholderDistributions]) {
    if (metric) deferredMetricIds.push(metric.id);
  }
  if (deferredMetricIds.length > 0) {
    warnings.push('SEC_CAPITAL_ALLOCATION_METRICS_DEFERRED_PENDING_INDEPENDENT_SHARE_COUNT_OR_PEER_NORMALIZATION');
  }

  return Object.freeze({
    input: Object.freeze({
      classification: input.base.input.classification,
      families: Object.freeze({ ...families }),
    }),
    diagnostics: Object.freeze({
      compositionVersion: EQUITY_FILING_FEATURE_COMPOSITION_VERSION,
      usedMetricIds: Object.freeze([...new Set(usedMetricIds)]),
      deferredMetricIds: Object.freeze([...new Set(deferredMetricIds)]),
      overriddenFamilies: Object.freeze([...new Set(overriddenFamilies)]),
      warnings: Object.freeze([...warnings]),
      sourcePriority: 'PRIMARY_FILING_EVIDENCE_OVER_VENDOR_DERIVED_FOR_SAME_CORRELATION_GROUP' as const,
      promotionReady: false as const,
    }),
  });
}

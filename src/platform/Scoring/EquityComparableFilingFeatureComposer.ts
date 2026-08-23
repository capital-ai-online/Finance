import {
  isAdmissibleMarketEvidence,
  type MarketEvidenceQualityRecord,
} from '../MarketData/evidenceQualityContracts';
import type {
  EquityComparableFilingMetricsResult,
  EquityComparableMetric,
  EquityComparableMetricId,
} from './EquityComparableFilingMetrics';
import type {
  EquityFilingDerivedMetricsResult,
  EquityFilingEvidenceSnapshot,
} from './EquityFilingDerivedMetrics';
import type { EquityFilingFeatureCompositionResult } from './EquityFilingFeatureComposer';
import type { EquityFactorFamily } from './EquityModelContracts';
import type { EquityFactorFamilyInput, EquityResearchScoringInput } from './EquityResearchScoring';

export const EQUITY_COMPARABLE_FILING_FEATURE_VERSION = 'equity-comparable-filing-feature/0.1.0' as const;

export interface EquityComparableFilingFeatureDiagnostics {
  readonly compositionVersion: typeof EQUITY_COMPARABLE_FILING_FEATURE_VERSION;
  readonly usedComparableMetricIds: readonly EquityComparableMetricId[];
  readonly overriddenFamilies: readonly EquityFactorFamily[];
  readonly warnings: readonly string[];
  readonly promotionReady: false;
}

export interface EquityComparableFilingFeatureResult {
  readonly input: EquityResearchScoringInput;
  readonly diagnostics: EquityComparableFilingFeatureDiagnostics;
}

interface Component {
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

function uniqueEvidence(records: readonly MarketEvidenceQualityRecord[]): readonly MarketEvidenceQualityRecord[] {
  return Object.freeze([...new Map(records.map((record) => [
    record.evidenceRef ?? `${record.providerId}:${record.field}:${record.observedAt ?? ''}`,
    record,
  ])).values()]);
}

function comparableComponent(
  metric: EquityComparableMetric | undefined,
  key: string,
  score: number | undefined,
): Component | null {
  if (!metric || score === undefined || !Number.isFinite(score)) return null;
  if (metric.evidence.length === 0 || metric.evidence.some((record) => !isAdmissibleMarketEvidence(record))) return null;
  return Object.freeze({
    key,
    score: clamp01(score),
    evidence: uniqueEvidence(metric.evidence),
  });
}

function currentFilingEvidence(
  snapshot: EquityFilingEvidenceSnapshot,
  fields: readonly string[],
): readonly MarketEvidenceQualityRecord[] {
  const records = Object.values(snapshot.facts)
    .filter((fact): fact is NonNullable<typeof fact> => Boolean(fact) && fields.includes(fact.field))
    .map((fact) => fact.evidence)
    .filter(isAdmissibleMarketEvidence);
  return uniqueEvidence(records);
}

function family(components: readonly (Component | null)[], minimumComponents: number): EquityFactorFamilyInput | undefined {
  const valid = components.filter((component): component is Component => Boolean(component));
  if (valid.length < minimumComponents) return undefined;
  return Object.freeze({
    score: valid.reduce((sum, component) => sum + component.score, 0) / valid.length,
    componentKeys: Object.freeze(valid.map((component) => component.key)),
    evidence: uniqueEvidence(valid.flatMap((component) => component.evidence)),
  });
}

/**
 * Final P1 filing-composition stage for comparable periods.
 *
 * Comparable SEC filing growth replaces same-correlation vendor quarterly growth only when at least
 * two independent growth observations are admissible. Capital Allocation requires both a verified
 * year-over-year share-count change and current-period distribution coverage; neither signal is
 * admitted alone. Reinvestment intensity remains telemetry because its direction is sector/profile
 * dependent and must not be treated as universally positive or negative.
 */
export function augmentEquityResearchWithComparableFilings(input: {
  readonly base: EquityFilingFeatureCompositionResult;
  readonly comparable: EquityComparableFilingMetricsResult;
  readonly currentFiling: EquityFilingEvidenceSnapshot;
  readonly currentDerived: EquityFilingDerivedMetricsResult;
}): EquityComparableFilingFeatureResult {
  const warnings: string[] = [];
  const usedComparableMetricIds: EquityComparableMetricId[] = [];
  const overriddenFamilies: EquityFactorFamily[] = [];
  const families: Partial<Record<EquityFactorFamily, EquityFactorFamilyInput>> = {
    ...input.base.input.families,
  };

  const revenueGrowth = input.comparable.metrics.revenueGrowthYoYPct;
  const epsGrowth = input.comparable.metrics.dilutedEpsGrowthYoYPct;
  const fcfGrowth = input.comparable.metrics.freeCashFlowGrowthYoYPct;
  const growth = family([
    comparableComponent(
      revenueGrowth,
      'growth.revenueGrowth',
      revenueGrowth ? normalizeRange(revenueGrowth.valuePct, -20, 40) : undefined,
    ),
    comparableComponent(
      epsGrowth,
      'growth.epsGrowth',
      epsGrowth ? normalizeRange(epsGrowth.valuePct, -30, 50) : undefined,
    ),
    comparableComponent(
      fcfGrowth,
      'growth.freeCashFlowGrowth',
      fcfGrowth ? normalizeRange(fcfGrowth.valuePct, -40, 60) : undefined,
    ),
  ], 2);

  if (growth) {
    families.growth = growth;
    overriddenFamilies.push('growth');
    for (const metric of [revenueGrowth, epsGrowth, fcfGrowth]) {
      if (metric) usedComparableMetricIds.push(metric.id);
    }
    warnings.push('SEC_COMPARABLE_PRIMARY_OVERRIDE:growth');
  } else if (revenueGrowth || epsGrowth || fcfGrowth) {
    warnings.push('SEC_COMPARABLE_GROWTH_INSUFFICIENT_COMPONENT_COVERAGE');
  }

  const shareCountChange = input.comparable.metrics.shareCountChangeYoYPct;
  const distributionCoverage = input.currentDerived.metrics.distributionCoverageYtd;
  const distributionEvidence = distributionCoverage
    ? currentFilingEvidence(input.currentFiling, [
      'operatingCashFlow',
      'capitalExpenditure',
      'dividendsPaid',
      'shareRepurchases',
    ])
    : Object.freeze([]);

  const capitalAllocation = family([
    comparableComponent(
      shareCountChange,
      'capitalAllocation.shareCountChangeQuality',
      shareCountChange ? normalizeInverseRange(shareCountChange.valuePct, -5, 5) : undefined,
    ),
    distributionCoverage && distributionEvidence.length >= 4
      ? Object.freeze({
        key: 'capitalAllocation.distributionCoverage',
        score: normalizeRange(distributionCoverage.value, 0, 1.5),
        evidence: distributionEvidence,
      })
      : null,
  ], 2);

  if (capitalAllocation) {
    families.capitalAllocation = capitalAllocation;
    overriddenFamilies.push('capitalAllocation');
    if (shareCountChange) usedComparableMetricIds.push('shareCountChangeYoYPct');
    warnings.push('SEC_COMPARABLE_CAPITAL_ALLOCATION_ENABLED:shareCountChange+distributionCoverage');
  } else if (shareCountChange || distributionCoverage) {
    warnings.push('SEC_COMPARABLE_CAPITAL_ALLOCATION_INSUFFICIENT_INDEPENDENT_EVIDENCE');
  }

  if (input.currentDerived.metrics.reinvestmentIntensityYtd) {
    warnings.push('REINVESTMENT_INTENSITY_REMAINS_CONTEXT_ONLY_PENDING_PEER_PROFILE_NORMALIZATION');
  }

  return Object.freeze({
    input: Object.freeze({
      classification: input.base.input.classification,
      families: Object.freeze({ ...families }),
    }),
    diagnostics: Object.freeze({
      compositionVersion: EQUITY_COMPARABLE_FILING_FEATURE_VERSION,
      usedComparableMetricIds: Object.freeze([...new Set(usedComparableMetricIds)]),
      overriddenFamilies: Object.freeze([...new Set(overriddenFamilies)]),
      warnings: Object.freeze([...warnings]),
      promotionReady: false as const,
    }),
  });
}

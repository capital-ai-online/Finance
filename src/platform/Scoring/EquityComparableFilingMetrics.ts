import {
  isAdmissibleMarketEvidence,
  type MarketEvidenceQualityRecord,
} from '../MarketData/evidenceQualityContracts';
import type {
  EquityFilingDerivedMetricsResult,
  EquityFilingEvidenceSnapshot,
  EquityFilingFactInput,
} from './EquityFilingDerivedMetrics';

export const EQUITY_COMPARABLE_FILING_METRICS_VERSION = 'equity-comparable-filing-metrics/0.2.0' as const;
export const EQUITY_COMPARABLE_PERIOD_MIN_DAYS = 330 as const;
export const EQUITY_COMPARABLE_PERIOD_MAX_DAYS = 400 as const;
export const EQUITY_COMPARABLE_DURATION_TOLERANCE_DAYS = 21 as const;

export type EquityComparableRawField = 'revenue' | 'dilutedEps' | 'sharesOutstanding';
export type EquityComparableContext = 'instant' | 'periodic';

export interface EquityComparableFactInput {
  readonly field: EquityComparableRawField;
  readonly value: number;
  readonly unit: string;
  readonly context: EquityComparableContext;
  readonly periodStart: string | null;
  readonly periodEnd: string;
  readonly filedAt: string;
  readonly accession: string;
  readonly evidence: MarketEvidenceQualityRecord;
}

export interface EquityComparableFactSnapshot {
  readonly assetId: string;
  readonly facts: Readonly<Partial<Record<EquityComparableRawField, EquityComparableFactInput>>>;
}

export type EquityComparableMetricId =
  | 'revenueGrowthYoYPct'
  | 'dilutedEpsGrowthYoYPct'
  | 'freeCashFlowGrowthYoYPct'
  | 'shareCountChangeYoYPct';

export interface EquityComparableMetric {
  readonly id: EquityComparableMetricId;
  readonly valuePct: number;
  readonly currentPeriodEnd: string;
  readonly priorPeriodEnd: string;
  readonly availableAt: string;
  readonly sourceFields: readonly string[];
  readonly evidence: readonly MarketEvidenceQualityRecord[];
  readonly correlationGroup: 'equity-growth' | 'equity-capital-allocation';
  readonly basisStatus: 'VERIFIED_COMPARABLE_PERIODS';
}

export interface EquityComparableFilingMetricsResult {
  readonly contractVersion: typeof EQUITY_COMPARABLE_FILING_METRICS_VERSION;
  readonly assetId: string;
  readonly metrics: Readonly<Partial<Record<EquityComparableMetricId, EquityComparableMetric>>>;
  readonly missingInputs: readonly string[];
  readonly rejectedEvidence: readonly string[];
  readonly periodMismatches: readonly string[];
  readonly canonical: false;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly normalizationRequired: true;
}

function daysBetween(a: string, b: string): number | null {
  const start = Date.parse(a);
  const end = Date.parse(b);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.abs(end - start) / 86_400_000;
}

function durationDays(fact: EquityComparableFactInput): number | null {
  if (!fact.periodStart) return null;
  return daysBetween(fact.periodStart, fact.periodEnd);
}

function admissibleFact(
  snapshot: EquityComparableFactSnapshot,
  field: EquityComparableRawField,
  rejectedEvidence: string[],
  missingInputs: string[],
): EquityComparableFactInput | null {
  const fact = snapshot.facts[field];
  if (!fact) {
    missingInputs.push(field);
    return null;
  }
  if (fact.evidence.assetId !== snapshot.assetId || !isAdmissibleMarketEvidence(fact.evidence)) {
    rejectedEvidence.push(field);
    return null;
  }
  return fact;
}

function comparablePeriods(current: EquityComparableFactInput, prior: EquityComparableFactInput): boolean {
  if (current.context !== prior.context || current.unit !== prior.unit) return false;
  const separation = daysBetween(current.periodEnd, prior.periodEnd);
  if (separation === null || separation < EQUITY_COMPARABLE_PERIOD_MIN_DAYS || separation > EQUITY_COMPARABLE_PERIOD_MAX_DAYS) return false;
  if (current.context === 'instant') return current.periodStart === null && prior.periodStart === null;
  const currentDuration = durationDays(current);
  const priorDuration = durationDays(prior);
  return currentDuration !== null
    && priorDuration !== null
    && Math.abs(currentDuration - priorDuration) <= EQUITY_COMPARABLE_DURATION_TOLERANCE_DAYS;
}

function uniqueEvidence(records: readonly MarketEvidenceQualityRecord[]): readonly MarketEvidenceQualityRecord[] {
  return Object.freeze([...new Map(records.map(record => [
    record.evidenceRef ?? `${record.providerId}:${record.field}:${record.observedAt ?? ''}`,
    record,
  ])).values()]);
}

function metric(
  id: EquityComparableMetricId,
  currentValue: number,
  priorValue: number,
  currentPeriodEnd: string,
  priorPeriodEnd: string,
  availableAt: string,
  sourceFields: readonly string[],
  evidence: readonly MarketEvidenceQualityRecord[],
  correlationGroup: EquityComparableMetric['correlationGroup'],
): EquityComparableMetric | null {
  if (!Number.isFinite(currentValue) || !Number.isFinite(priorValue) || priorValue === 0) return null;
  return Object.freeze({
    id,
    valuePct: Number((((currentValue / priorValue) - 1) * 100).toFixed(8)),
    currentPeriodEnd,
    priorPeriodEnd,
    availableAt,
    sourceFields: Object.freeze([...sourceFields]),
    evidence: uniqueEvidence(evidence),
    correlationGroup,
    basisStatus: 'VERIFIED_COMPARABLE_PERIODS' as const,
  });
}

function filingEvidence(snapshot: EquityFilingEvidenceSnapshot, fields: readonly string[]): readonly MarketEvidenceQualityRecord[] {
  const facts = Object.values(snapshot.facts).filter(
    (fact): fact is EquityFilingFactInput => fact !== undefined && fields.includes(fact.field),
  );
  return uniqueEvidence(facts.map(fact => fact.evidence).filter(isAdmissibleMarketEvidence));
}

export function deriveEquityComparableFilingMetrics(input: {
  readonly current: EquityComparableFactSnapshot;
  readonly prior: EquityComparableFactSnapshot;
  readonly currentFiling: EquityFilingEvidenceSnapshot;
  readonly priorFiling: EquityFilingEvidenceSnapshot;
  readonly currentDerived: EquityFilingDerivedMetricsResult;
  readonly priorDerived: EquityFilingDerivedMetricsResult;
}): EquityComparableFilingMetricsResult {
  const assetId = input.current.assetId;
  const metrics: Partial<Record<EquityComparableMetricId, EquityComparableMetric>> = {};
  const missingInputs: string[] = [];
  const rejectedEvidence: string[] = [];
  const periodMismatches: string[] = [];

  if (
    input.prior.assetId !== assetId
    || input.currentFiling.assetId !== assetId
    || input.priorFiling.assetId !== assetId
    || input.currentDerived.assetId !== assetId
    || input.priorDerived.assetId !== assetId
  ) {
    return Object.freeze({
      contractVersion: EQUITY_COMPARABLE_FILING_METRICS_VERSION,
      assetId,
      metrics: Object.freeze({}),
      missingInputs: Object.freeze([]),
      rejectedEvidence: Object.freeze(['ASSET_ID_MISMATCH']),
      periodMismatches: Object.freeze([]),
      canonical: false as const,
      scoreEligible: false as const,
      executionEligible: false as const,
      normalizationRequired: true as const,
    });
  }

  const pairs: ReadonlyArray<{
    field: EquityComparableRawField;
    id: EquityComparableMetricId;
    group: EquityComparableMetric['correlationGroup'];
  }> = [
    { field: 'revenue', id: 'revenueGrowthYoYPct', group: 'equity-growth' },
    { field: 'dilutedEps', id: 'dilutedEpsGrowthYoYPct', group: 'equity-growth' },
    { field: 'sharesOutstanding', id: 'shareCountChangeYoYPct', group: 'equity-capital-allocation' },
  ];

  for (const pair of pairs) {
    const current = admissibleFact(input.current, pair.field, rejectedEvidence, missingInputs);
    const prior = admissibleFact(input.prior, pair.field, rejectedEvidence, missingInputs);
    if (!current || !prior) continue;
    if (!comparablePeriods(current, prior)) {
      periodMismatches.push(pair.id);
      continue;
    }
    const derived = metric(
      pair.id,
      current.value,
      prior.value,
      current.periodEnd,
      prior.periodEnd,
      [current.filedAt, prior.filedAt].sort((a, b) => Date.parse(b) - Date.parse(a))[0],
      [pair.field],
      [current.evidence, prior.evidence],
      pair.group,
    );
    if (derived) metrics[pair.id] = derived;
  }

  const currentFcf = input.currentDerived.metrics.freeCashFlowYtd;
  const priorFcf = input.priorDerived.metrics.freeCashFlowYtd;
  if (!currentFcf || !priorFcf) {
    missingInputs.push('freeCashFlowYtd');
  } else {
    const separation = daysBetween(currentFcf.periodEnd, priorFcf.periodEnd);
    const currentDuration = currentFcf.periodStart ? daysBetween(currentFcf.periodStart, currentFcf.periodEnd) : null;
    const priorDuration = priorFcf.periodStart ? daysBetween(priorFcf.periodStart, priorFcf.periodEnd) : null;
    const compatible = separation !== null
      && separation >= EQUITY_COMPARABLE_PERIOD_MIN_DAYS
      && separation <= EQUITY_COMPARABLE_PERIOD_MAX_DAYS
      && currentDuration !== null
      && priorDuration !== null
      && Math.abs(currentDuration - priorDuration) <= EQUITY_COMPARABLE_DURATION_TOLERANCE_DAYS;
    if (!compatible) {
      periodMismatches.push('freeCashFlowGrowthYoYPct');
    } else {
      const evidence = [
        ...filingEvidence(input.currentFiling, ['operatingCashFlow', 'capitalExpenditure']),
        ...filingEvidence(input.priorFiling, ['operatingCashFlow', 'capitalExpenditure']),
      ];
      if (evidence.length < 4) {
        rejectedEvidence.push('freeCashFlowGrowthYoYPct');
      } else {
        const derived = metric(
          'freeCashFlowGrowthYoYPct',
          currentFcf.value,
          priorFcf.value,
          currentFcf.periodEnd,
          priorFcf.periodEnd,
          [currentFcf.availableAt, priorFcf.availableAt].sort((a, b) => Date.parse(b) - Date.parse(a))[0],
          ['operatingCashFlow', 'capitalExpenditure'],
          evidence,
          'equity-growth',
        );
        if (derived) metrics.freeCashFlowGrowthYoYPct = derived;
      }
    }
  }

  return Object.freeze({
    contractVersion: EQUITY_COMPARABLE_FILING_METRICS_VERSION,
    assetId,
    metrics: Object.freeze({ ...metrics }),
    missingInputs: Object.freeze([...new Set(missingInputs)].sort()),
    rejectedEvidence: Object.freeze([...new Set(rejectedEvidence)].sort()),
    periodMismatches: Object.freeze([...new Set(periodMismatches)].sort()),
    canonical: false as const,
    scoreEligible: false as const,
    executionEligible: false as const,
    normalizationRequired: true as const,
  });
}

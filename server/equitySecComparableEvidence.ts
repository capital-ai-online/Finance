import { isAdmissibleMarketEvidence } from '../src/platform/MarketData/evidenceQualityContracts';
import type {
  SecEdgarCompanyFactsResult,
  SecEdgarFactEvidence,
  SecEdgarRawField,
} from './secEdgarCompanyFacts';
import type { EquitySecEvidenceBridgeResult } from './equitySecEvidenceBridge';
import {
  deriveEquityComparableFilingMetrics,
  type EquityComparableFactInput,
  type EquityComparableFactSnapshot,
  type EquityComparableFilingMetricsResult,
  type EquityComparableRawField,
} from '../src/platform/Scoring/EquityComparableFilingMetrics';

export const EQUITY_SEC_COMPARABLE_EVIDENCE_VERSION = 'equity-sec-comparable-evidence/0.2.0' as const;
export const EQUITY_SEC_PRIOR_PERIOD_TOLERANCE_DAYS = 21 as const;

const COMPARABLE_FIELDS: readonly EquityComparableRawField[] = Object.freeze([
  'revenue',
  'dilutedEps',
  'sharesOutstanding',
]);
const COMPARABLE_SET = new Set<string>(COMPARABLE_FIELDS);

export interface EquitySecComparableEvidenceResult {
  readonly contractVersion: typeof EQUITY_SEC_COMPARABLE_EVIDENCE_VERSION;
  readonly current: EquityComparableFactSnapshot;
  readonly prior: EquityComparableFactSnapshot;
  readonly metrics: EquityComparableFilingMetricsResult;
  readonly priorAsOf: string | null;
  readonly targetPriorPeriodEnd: string | null;
  readonly mappedCurrentFields: readonly EquityComparableRawField[];
  readonly mappedPriorFields: readonly EquityComparableRawField[];
  readonly rejectedCurrentFields: readonly EquityComparableRawField[];
  readonly rejectedPriorFields: readonly EquityComparableRawField[];
  readonly canonical: false;
  readonly scoreEligible: false;
  readonly executionEligible: false;
}

function isComparableField(field: SecEdgarRawField): field is EquityComparableRawField {
  return COMPARABLE_SET.has(field);
}

function shiftUtcYear(value: string, years: number): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const month = parsed.getUTCMonth();
  const date = parsed.getUTCDate();
  parsed.setUTCFullYear(parsed.getUTCFullYear() + years);
  if (parsed.getUTCMonth() !== month) parsed.setUTCMonth(month + 1, 0);
  else if (parsed.getUTCDate() !== date) parsed.setUTCDate(Math.min(date, new Date(Date.UTC(parsed.getUTCFullYear(), month + 1, 0)).getUTCDate()));
  return parsed.toISOString();
}

function daysBetween(a: string, b: string): number | null {
  const left = Date.parse(a);
  const right = Date.parse(b);
  return Number.isFinite(left) && Number.isFinite(right) ? Math.abs(left - right) / 86_400_000 : null;
}

function anchorPeriodEnd(result: SecEdgarCompanyFactsResult): string | null {
  const priorities: readonly SecEdgarRawField[] = ['revenue', 'dilutedEps', 'sharesOutstanding'];
  for (const field of priorities) {
    const fact = result.facts[field];
    if (fact && isAdmissibleMarketEvidence(fact.evidence)) return fact.periodEnd;
  }
  return null;
}

/**
 * Historical comparison uses the same information-time distance: current evaluatedAt shifted one
 * calendar year backwards. This is safer than guessing a filing lag from period-end because the SEC
 * fact selector still enforces filedAt <= priorAsOf and the period-end tolerance below rejects a
 * different fiscal period.
 */
export function buildPriorComparableAsOf(current: SecEdgarCompanyFactsResult): {
  targetPriorPeriodEnd: string;
  priorAsOf: string;
} | null {
  const currentEnd = anchorPeriodEnd(current);
  if (!currentEnd) return null;
  const targetPriorPeriodEnd = shiftUtcYear(currentEnd, -1);
  const priorAsOf = shiftUtcYear(current.evaluatedAt, -1);
  return targetPriorPeriodEnd && priorAsOf ? { targetPriorPeriodEnd, priorAsOf } : null;
}

function compatibleContext(fact: SecEdgarFactEvidence): boolean {
  if (fact.context === 'instant') return fact.periodStart === null;
  if (fact.context !== 'periodic' || !fact.periodStart) return false;
  const duration = daysBetween(fact.periodStart, fact.periodEnd);
  if (duration === null) return false;
  if (fact.form === '10-Q' || fact.form === '10-Q/A') return duration >= 45 && duration <= 120;
  if (fact.form === '10-K' || fact.form === '10-K/A') return duration >= 300 && duration <= 430;
  return false;
}

function toComparableFact(field: EquityComparableRawField, fact: SecEdgarFactEvidence): EquityComparableFactInput | null {
  if (!compatibleContext(fact)) return null;
  return Object.freeze({
    field,
    value: fact.value,
    unit: fact.unit,
    context: fact.context as 'instant' | 'periodic',
    periodStart: fact.periodStart,
    periodEnd: fact.periodEnd,
    filedAt: fact.filedAt,
    accession: fact.accession,
    evidence: fact.evidence,
  });
}

function comparableSnapshot(
  sec: SecEdgarCompanyFactsResult,
  assetId: string,
  expectedPriorEnd?: string,
): {
  snapshot: EquityComparableFactSnapshot;
  mapped: EquityComparableRawField[];
  rejected: EquityComparableRawField[];
} {
  const facts: Partial<Record<EquityComparableRawField, EquityComparableFactInput>> = {};
  const mapped: EquityComparableRawField[] = [];
  const rejected: EquityComparableRawField[] = [];

  for (const [rawField, fact] of Object.entries(sec.facts) as Array<[SecEdgarRawField, SecEdgarFactEvidence | undefined]>) {
    if (!fact || !isComparableField(rawField)) continue;
    if (fact.evidence.assetId !== assetId || !isAdmissibleMarketEvidence(fact.evidence)) {
      rejected.push(rawField);
      continue;
    }
    if (expectedPriorEnd) {
      const delta = daysBetween(fact.periodEnd, expectedPriorEnd);
      if (delta === null || delta > EQUITY_SEC_PRIOR_PERIOD_TOLERANCE_DAYS) {
        rejected.push(rawField);
        continue;
      }
    }
    const projected = toComparableFact(rawField, fact);
    if (!projected) {
      rejected.push(rawField);
      continue;
    }
    facts[rawField] = projected;
    mapped.push(rawField);
  }

  return {
    snapshot: Object.freeze({ assetId, facts: Object.freeze({ ...facts }) }),
    mapped,
    rejected,
  };
}

export function bridgeSecComparableEvidence(input: {
  readonly assetId: string;
  readonly currentSec: SecEdgarCompanyFactsResult;
  readonly priorSec: SecEdgarCompanyFactsResult;
  readonly currentBridge: EquitySecEvidenceBridgeResult;
  readonly priorBridge: EquitySecEvidenceBridgeResult;
  readonly targetPriorPeriodEnd: string;
  readonly priorAsOf: string;
}): EquitySecComparableEvidenceResult {
  const current = comparableSnapshot(input.currentSec, input.assetId);
  const prior = comparableSnapshot(input.priorSec, input.assetId, input.targetPriorPeriodEnd);
  const metrics = deriveEquityComparableFilingMetrics({
    current: current.snapshot,
    prior: prior.snapshot,
    currentFiling: input.currentBridge.snapshot,
    priorFiling: input.priorBridge.snapshot,
    currentDerived: input.currentBridge.derived,
    priorDerived: input.priorBridge.derived,
  });

  return Object.freeze({
    contractVersion: EQUITY_SEC_COMPARABLE_EVIDENCE_VERSION,
    current: current.snapshot,
    prior: prior.snapshot,
    metrics,
    priorAsOf: input.priorAsOf,
    targetPriorPeriodEnd: input.targetPriorPeriodEnd,
    mappedCurrentFields: Object.freeze([...new Set(current.mapped)].sort()),
    mappedPriorFields: Object.freeze([...new Set(prior.mapped)].sort()),
    rejectedCurrentFields: Object.freeze([...new Set(current.rejected)].sort()),
    rejectedPriorFields: Object.freeze([...new Set(prior.rejected)].sort()),
    canonical: false as const,
    scoreEligible: false as const,
    executionEligible: false as const,
  });
}

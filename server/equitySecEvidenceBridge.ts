import type {
  SecEdgarCompanyFactsResult,
  SecEdgarRawField,
} from './secEdgarCompanyFacts';
import {
  deriveEquityFilingMetrics,
  type EquityFilingEvidenceSnapshot,
  type EquityFilingFactInput,
  type EquityFilingRawField,
  type EquityFilingDerivedMetricsResult,
} from '../src/platform/Scoring/EquityFilingDerivedMetrics';

export const EQUITY_SEC_EVIDENCE_BRIDGE_VERSION = 'equity-sec-evidence-bridge/0.1.0' as const;

const DERIVED_FIELDS: readonly EquityFilingRawField[] = Object.freeze([
  'operatingIncome',
  'currentAssets',
  'currentLiabilities',
  'shareholdersEquity',
  'longTermDebtCurrent',
  'longTermDebtNoncurrent',
  'interestExpense',
  'operatingCashFlow',
  'capitalExpenditure',
  'dividendsPaid',
  'shareRepurchases',
]);

const DERIVED_FIELD_SET = new Set<string>(DERIVED_FIELDS);

export interface EquitySecEvidenceBridgeResult {
  readonly bridgeVersion: typeof EQUITY_SEC_EVIDENCE_BRIDGE_VERSION;
  readonly secStatus: SecEdgarCompanyFactsResult['status'];
  readonly snapshot: EquityFilingEvidenceSnapshot;
  readonly derived: EquityFilingDerivedMetricsResult;
  readonly mappedFields: readonly EquityFilingRawField[];
  readonly ignoredFields: readonly SecEdgarRawField[];
  readonly rejectedContextFields: readonly SecEdgarRawField[];
  readonly scoreEligible: false;
  readonly executionEligible: false;
}

function isDerivedField(field: SecEdgarRawField): field is EquityFilingRawField {
  return DERIVED_FIELD_SET.has(field);
}

function durationDays(periodStart: string | null, periodEnd: string): number | null {
  if (!periodStart) return null;
  const start = Date.parse(periodStart);
  const end = Date.parse(periodEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return (end - start) / 86_400_000;
}

/**
 * Defense-in-depth context gate. CompanyFacts may expose quarterly and YTD rows for the same concept
 * and filing. Even if upstream candidate ordering changes, a duration-incompatible row must never
 * enter provider-neutral filing evidence used by the Equity challenger.
 */
function hasCompatibleContext(fact: NonNullable<SecEdgarCompanyFactsResult['facts'][SecEdgarRawField]>): boolean {
  const duration = durationDays(fact.periodStart, fact.periodEnd);
  if (fact.context === 'instant') return fact.periodStart === null;
  if (duration === null) return false;

  const annual = fact.form === '10-K' || fact.form === '10-K/A';
  if (annual) return duration >= 300 && duration <= 430;
  if (fact.form !== '10-Q' && fact.form !== '10-Q/A') return false;

  if (fact.context === 'periodic') return duration >= 45 && duration <= 120;
  return duration >= 45 && duration <= 300;
}

/**
 * Converts provider-specific SEC CompanyFacts output into the provider-neutral filing contract.
 * No SEC field receives score authority here; this bridge only preserves identity, reporting context,
 * filing availability and Market Evidence DQ records for deterministic downstream derivation.
 */
export function bridgeSecCompanyFactsToEquityFilingEvidence(
  sec: SecEdgarCompanyFactsResult,
  assetId: string,
): EquitySecEvidenceBridgeResult {
  const facts: Partial<Record<EquityFilingRawField, EquityFilingFactInput>> = {};
  const mappedFields: EquityFilingRawField[] = [];
  const ignoredFields: SecEdgarRawField[] = [];
  const rejectedContextFields: SecEdgarRawField[] = [];

  for (const [field, fact] of Object.entries(sec.facts) as Array<[SecEdgarRawField, SecEdgarCompanyFactsResult['facts'][SecEdgarRawField]]>) {
    if (!fact) continue;
    if (!isDerivedField(field)) {
      ignoredFields.push(field);
      continue;
    }
    if (fact.evidence.assetId !== assetId) continue;
    if (!hasCompatibleContext(fact)) {
      rejectedContextFields.push(field);
      continue;
    }

    facts[field] = Object.freeze({
      field,
      value: fact.value,
      unit: fact.unit,
      context: fact.context,
      periodStart: fact.periodStart,
      periodEnd: fact.periodEnd,
      filedAt: fact.filedAt,
      accession: fact.accession,
      evidence: fact.evidence,
    });
    mappedFields.push(field);
  }

  const snapshot: EquityFilingEvidenceSnapshot = Object.freeze({
    assetId,
    facts: Object.freeze({ ...facts }),
  });
  const derived = deriveEquityFilingMetrics(snapshot);

  return Object.freeze({
    bridgeVersion: EQUITY_SEC_EVIDENCE_BRIDGE_VERSION,
    secStatus: sec.status,
    snapshot,
    derived,
    mappedFields: Object.freeze([...new Set(mappedFields)].sort()),
    ignoredFields: Object.freeze([...new Set(ignoredFields)].sort()),
    rejectedContextFields: Object.freeze([...new Set(rejectedContextFields)].sort()),
    scoreEligible: false as const,
    executionEligible: false as const,
  });
}

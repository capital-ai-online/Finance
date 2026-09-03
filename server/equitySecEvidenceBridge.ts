import type {
  SecEdgarCompanyFactsResult,
  SecEdgarRawField,
} from './secEdgarCompanyFacts';
import {
  deriveEquityFilingMetrics,
  type EquityFilingDerivedMetricsResult,
  type EquityFilingEvidenceSnapshot,
  type EquityFilingFactInput,
  type EquityFilingRawField,
} from '../src/platform/Scoring/EquityFilingDerivedMetrics';

export const EQUITY_SEC_EVIDENCE_BRIDGE_VERSION = 'equity-sec-evidence-bridge/0.2.0' as const;

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
  readonly rejectedIdentityFields: readonly SecEdgarRawField[];
  readonly canonical: false;
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

function compatibleContext(fact: NonNullable<SecEdgarCompanyFactsResult['facts'][SecEdgarRawField]>): boolean {
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
 * SEC remains provider evidence only. This bridge performs no model selection and no normalization;
 * it only projects already selected CompanyFacts into the provider-neutral filing contract and
 * rejects identity/context mismatches fail-closed.
 */
export function bridgeSecCompanyFactsToEquityFilingEvidence(
  sec: SecEdgarCompanyFactsResult,
  assetId: string,
): EquitySecEvidenceBridgeResult {
  const facts: Partial<Record<EquityFilingRawField, EquityFilingFactInput>> = {};
  const mappedFields: EquityFilingRawField[] = [];
  const ignoredFields: SecEdgarRawField[] = [];
  const rejectedContextFields: SecEdgarRawField[] = [];
  const rejectedIdentityFields: SecEdgarRawField[] = [];

  for (const [field, fact] of Object.entries(sec.facts) as Array<[SecEdgarRawField, SecEdgarCompanyFactsResult['facts'][SecEdgarRawField]]>) {
    if (!fact) continue;
    if (!isDerivedField(field)) {
      ignoredFields.push(field);
      continue;
    }
    if (fact.evidence.assetId !== assetId) {
      rejectedIdentityFields.push(field);
      continue;
    }
    if (!compatibleContext(fact)) {
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
    rejectedIdentityFields: Object.freeze([...new Set(rejectedIdentityFields)].sort()),
    canonical: false as const,
    scoreEligible: false as const,
    executionEligible: false as const,
  });
}

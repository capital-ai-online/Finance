import {
  isAdmissibleMarketEvidence,
  type MarketEvidenceQualityRecord,
} from '../MarketData/evidenceQualityContracts';

export const EQUITY_FILING_DERIVED_METRICS_VERSION = 'equity-filing-derived-metrics/0.2.0' as const;

export type EquityFilingRawField =
  | 'operatingIncome'
  | 'currentAssets'
  | 'currentLiabilities'
  | 'shareholdersEquity'
  | 'longTermDebtCurrent'
  | 'longTermDebtNoncurrent'
  | 'interestExpense'
  | 'operatingCashFlow'
  | 'capitalExpenditure'
  | 'dividendsPaid'
  | 'shareRepurchases';

export type EquityFilingFactContext = 'instant' | 'periodic' | 'ytd';

export interface EquityFilingFactInput {
  readonly field: EquityFilingRawField;
  readonly value: number;
  readonly unit: string;
  readonly context: EquityFilingFactContext;
  readonly periodStart: string | null;
  readonly periodEnd: string;
  readonly filedAt: string;
  readonly accession: string;
  readonly evidence: MarketEvidenceQualityRecord;
}

export interface EquityFilingEvidenceSnapshot {
  readonly assetId: string;
  readonly facts: Readonly<Partial<Record<EquityFilingRawField, EquityFilingFactInput>>>;
}

export type EquityDerivedMetricId =
  | 'currentRatio'
  | 'noncurrentLongTermDebtToEquity'
  | 'totalLongTermDebtToEquity'
  | 'interestCoverage'
  | 'freeCashFlowYtd'
  | 'shareholderDistributionsYtd'
  | 'distributionCoverageYtd'
  | 'reinvestmentIntensityYtd';

export interface EquityDerivedMetric {
  readonly id: EquityDerivedMetricId;
  readonly value: number;
  readonly unit: 'ratio' | 'USD';
  readonly correlationGroup: 'equity-balance-sheet' | 'equity-debt-service' | 'equity-capital-allocation';
  readonly periodStart: string | null;
  readonly periodEnd: string;
  readonly availableAt: string;
  readonly sourceFields: readonly EquityFilingRawField[];
  readonly evidence: readonly MarketEvidenceQualityRecord[];
  readonly basisStatus: 'VERIFIED_INPUTS';
}

export interface EquityFilingDerivedMetricsResult {
  readonly contractVersion: typeof EQUITY_FILING_DERIVED_METRICS_VERSION;
  readonly assetId: string;
  readonly metrics: Readonly<Partial<Record<EquityDerivedMetricId, EquityDerivedMetric>>>;
  readonly missingInputs: readonly string[];
  readonly rejectedEvidence: readonly string[];
  readonly periodMismatches: readonly string[];
  readonly canonical: false;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly normalizationRequired: true;
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function laterIso(values: readonly string[]): string {
  return [...values].sort((a, b) => Date.parse(b) - Date.parse(a))[0];
}

function uniqueEvidence(facts: readonly EquityFilingFactInput[]): readonly MarketEvidenceQualityRecord[] {
  return Object.freeze([...new Map(facts.map(fact => [
    fact.evidence.evidenceRef ?? `${fact.evidence.providerId}:${fact.field}:${fact.periodEnd}`,
    fact.evidence,
  ])).values()]);
}

function compatibleInstant(facts: readonly EquityFilingFactInput[]): boolean {
  return facts.every(fact => fact.context === 'instant' && fact.periodStart === null)
    && new Set(facts.map(fact => fact.periodEnd)).size === 1;
}

function compatibleDuration(facts: readonly EquityFilingFactInput[], context: 'periodic' | 'ytd'): boolean {
  return facts.every(fact => fact.context === context && Boolean(fact.periodStart))
    && new Set(facts.map(fact => fact.periodStart)).size === 1
    && new Set(facts.map(fact => fact.periodEnd)).size === 1;
}

function metric(
  id: EquityDerivedMetricId,
  value: number,
  unit: EquityDerivedMetric['unit'],
  correlationGroup: EquityDerivedMetric['correlationGroup'],
  facts: readonly EquityFilingFactInput[],
): EquityDerivedMetric {
  return Object.freeze({
    id,
    value: Number(value.toFixed(8)),
    unit,
    correlationGroup,
    periodStart: facts[0]?.periodStart ?? null,
    periodEnd: facts[0].periodEnd,
    availableAt: laterIso(facts.map(fact => fact.filedAt)),
    sourceFields: Object.freeze(facts.map(fact => fact.field)),
    evidence: uniqueEvidence(facts),
    basisStatus: 'VERIFIED_INPUTS' as const,
  });
}

/**
 * Deterministic provider-neutral derivation over already admissible filing facts.
 * No ratio is created across incompatible reporting periods, no absent fact becomes zero and no
 * derived metric owns a scoring direction or weight.
 */
export function deriveEquityFilingMetrics(snapshot: EquityFilingEvidenceSnapshot): EquityFilingDerivedMetricsResult {
  const metrics: Partial<Record<EquityDerivedMetricId, EquityDerivedMetric>> = {};
  const missingInputs: string[] = [];
  const rejectedEvidence: string[] = [];
  const periodMismatches: string[] = [];

  const get = (field: EquityFilingRawField): EquityFilingFactInput | null => {
    const fact = snapshot.facts[field];
    if (!fact) {
      missingInputs.push(field);
      return null;
    }
    if (!finite(fact.value) || fact.evidence.assetId !== snapshot.assetId || !isAdmissibleMarketEvidence(fact.evidence)) {
      rejectedEvidence.push(field);
      return null;
    }
    return fact;
  };

  const currentAssets = get('currentAssets');
  const currentLiabilities = get('currentLiabilities');
  if (currentAssets && currentLiabilities) {
    const basis = [currentAssets, currentLiabilities];
    if (!compatibleInstant(basis)) periodMismatches.push('currentRatio');
    else if (currentLiabilities.value > 0) metrics.currentRatio = metric('currentRatio', currentAssets.value / currentLiabilities.value, 'ratio', 'equity-balance-sheet', basis);
  }

  const equity = get('shareholdersEquity');
  const debtNoncurrent = get('longTermDebtNoncurrent');
  if (equity && debtNoncurrent) {
    const basis = [debtNoncurrent, equity];
    if (!compatibleInstant(basis)) periodMismatches.push('noncurrentLongTermDebtToEquity');
    else if (equity.value > 0) metrics.noncurrentLongTermDebtToEquity = metric('noncurrentLongTermDebtToEquity', debtNoncurrent.value / equity.value, 'ratio', 'equity-balance-sheet', basis);
  }

  const debtCurrent = get('longTermDebtCurrent');
  if (equity && debtNoncurrent && debtCurrent) {
    const basis = [debtCurrent, debtNoncurrent, equity];
    if (!compatibleInstant(basis)) periodMismatches.push('totalLongTermDebtToEquity');
    else if (equity.value > 0) metrics.totalLongTermDebtToEquity = metric('totalLongTermDebtToEquity', (debtCurrent.value + debtNoncurrent.value) / equity.value, 'ratio', 'equity-balance-sheet', basis);
  }

  const operatingIncome = get('operatingIncome');
  const interestExpense = get('interestExpense');
  if (operatingIncome && interestExpense) {
    const basis = [operatingIncome, interestExpense];
    if (!compatibleDuration(basis, 'periodic')) periodMismatches.push('interestCoverage');
    else if (interestExpense.value > 0) metrics.interestCoverage = metric('interestCoverage', operatingIncome.value / interestExpense.value, 'ratio', 'equity-debt-service', basis);
  }

  const operatingCashFlow = get('operatingCashFlow');
  const capitalExpenditure = get('capitalExpenditure');
  let freeCashFlow: EquityDerivedMetric | null = null;
  if (operatingCashFlow && capitalExpenditure) {
    const basis = [operatingCashFlow, capitalExpenditure];
    if (!compatibleDuration(basis, 'ytd')) periodMismatches.push('freeCashFlowYtd');
    else {
      freeCashFlow = metric('freeCashFlowYtd', operatingCashFlow.value - capitalExpenditure.value, 'USD', 'equity-capital-allocation', basis);
      metrics.freeCashFlowYtd = freeCashFlow;
      if (operatingCashFlow.value > 0) metrics.reinvestmentIntensityYtd = metric('reinvestmentIntensityYtd', capitalExpenditure.value / operatingCashFlow.value, 'ratio', 'equity-capital-allocation', basis);
    }
  }

  const dividends = get('dividendsPaid');
  const repurchases = get('shareRepurchases');
  let distributions: EquityDerivedMetric | null = null;
  if (dividends && repurchases) {
    const basis = [dividends, repurchases];
    if (!compatibleDuration(basis, 'ytd')) periodMismatches.push('shareholderDistributionsYtd');
    else {
      distributions = metric('shareholderDistributionsYtd', dividends.value + repurchases.value, 'USD', 'equity-capital-allocation', basis);
      metrics.shareholderDistributionsYtd = distributions;
    }
  }

  if (freeCashFlow && distributions && distributions.value > 0) {
    if (freeCashFlow.periodStart !== distributions.periodStart || freeCashFlow.periodEnd !== distributions.periodEnd) periodMismatches.push('distributionCoverageYtd');
    else metrics.distributionCoverageYtd = metric('distributionCoverageYtd', freeCashFlow.value / distributions.value, 'ratio', 'equity-capital-allocation', [operatingCashFlow!, capitalExpenditure!, dividends!, repurchases!]);
  }

  return Object.freeze({
    contractVersion: EQUITY_FILING_DERIVED_METRICS_VERSION,
    assetId: snapshot.assetId,
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

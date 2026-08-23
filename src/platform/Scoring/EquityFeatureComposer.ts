import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  isAdmissibleMarketEvidence,
  type MarketEvidenceQualityRecord,
} from '../MarketData/evidenceQualityContracts';
import {
  buildFinancialEvidenceId,
  type FinancialDataProvider,
  type FinancialFieldProvenance,
} from '../../types/financialProvenance';
import type { EquityClassification, EquityFactorFamily } from './EquityModelContracts';
import type { EquityFactorFamilyInput, EquityResearchScoringInput } from './EquityResearchScoring';

export const EQUITY_FEATURE_COMPOSITION_VERSION = 'equity-feature-composition/0.1.0' as const;
export const EQUITY_RESEARCH_NORMALIZATION_POLICY = 'research-bounded-absolute/0.1.0' as const;
export const EQUITY_FUNDAMENTAL_MAX_AGE_MS = 140 * 24 * 60 * 60 * 1000;
export const EQUITY_MARKET_HISTORY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface EquityFundamentalSnapshot {
  readonly peRatio?: number;
  readonly priceToBookRatio?: number;
  readonly dividendYieldPct?: number;
  readonly profitMarginPct?: number;
  readonly operatingMarginPct?: number;
  readonly returnOnEquityPct?: number;
  readonly quarterlyRevenueGrowthPct?: number;
  readonly quarterlyEarningsGrowthPct?: number;
  readonly debtToEquity?: number;
  readonly epsTtm?: number;
  readonly freeCashFlowPerShare?: number;
  readonly provenance: readonly FinancialFieldProvenance[];
}

export interface EquityHistoryPoint {
  readonly date: string;
  readonly close: number;
}

export interface EquityHistorySnapshot {
  readonly provider: FinancialDataProvider;
  readonly sourcePath: string;
  readonly retrievedAt: string;
  readonly points: readonly EquityHistoryPoint[];
}

export interface EquityFeatureCompositionDiagnostics {
  readonly compositionVersion: typeof EQUITY_FEATURE_COMPOSITION_VERSION;
  readonly normalizationPolicy: typeof EQUITY_RESEARCH_NORMALIZATION_POLICY;
  readonly composedFamilies: readonly EquityFactorFamily[];
  readonly missingRawFields: readonly string[];
  readonly rejectedEvidenceFields: readonly string[];
  readonly warnings: readonly string[];
  readonly promotionReady: false;
}

export interface EquityFeatureCompositionResult {
  readonly input: EquityResearchScoringInput;
  readonly diagnostics: EquityFeatureCompositionDiagnostics;
}

interface Component {
  readonly key: string;
  readonly score: number;
  readonly evidence: MarketEvidenceQualityRecord;
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

function isoDate(value: string | undefined): string | null {
  return value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
}

function parseHistoryDate(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const parsed = Date.parse(value.slice(0, 10));
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
  }
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/);
  if (!match) return null;
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  const iso = `${year}-${match[2]}-${match[1]}T00:00:00.000Z`;
  return Number.isFinite(Date.parse(iso)) ? iso : null;
}

function evidenceStatus(observedAt: string | null, evaluatedAt: string, maxAgeMs: number): {
  qualityStatus: MarketEvidenceQualityRecord['qualityStatus'];
  ageMs: number | null;
} {
  if (!observedAt) return { qualityStatus: 'UNAVAILABLE', ageMs: null };
  const ageMs = Math.max(0, Date.parse(evaluatedAt) - Date.parse(observedAt));
  return {
    qualityStatus: ageMs <= maxAgeMs ? 'VERIFIED' : 'STALE',
    ageMs,
  };
}

function financialEvidence(
  assetId: string,
  item: FinancialFieldProvenance,
  evaluatedAt: string,
): MarketEvidenceQualityRecord {
  const observedAt = isoDate(item.observedAt);
  const status = evidenceStatus(observedAt, evaluatedAt, EQUITY_FUNDAMENTAL_MAX_AGE_MS);
  return {
    assetId,
    providerId: item.provider.toLowerCase(),
    capability: 'stock-fundamentals',
    field: item.field,
    observedAt,
    retrievedAt: new Date(item.retrievedAt).toISOString(),
    freshness: {
      ageMs: status.ageMs,
      maxAgeMs: EQUITY_FUNDAMENTAL_MAX_AGE_MS,
      evaluatedAt,
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: status.qualityStatus,
    evidenceRef: status.qualityStatus === 'VERIFIED' ? buildFinancialEvidenceId(assetId, item) : null,
  };
}

function historyEvidence(
  assetId: string,
  history: EquityHistorySnapshot,
  field: string,
  observedAt: string | null,
  evaluatedAt: string,
): MarketEvidenceQualityRecord {
  const status = evidenceStatus(observedAt, evaluatedAt, EQUITY_MARKET_HISTORY_MAX_AGE_MS);
  return {
    assetId,
    providerId: history.provider.toLowerCase(),
    capability: 'stock-market-history',
    field,
    observedAt,
    retrievedAt: new Date(history.retrievedAt).toISOString(),
    freshness: {
      ageMs: status.ageMs,
      maxAgeMs: EQUITY_MARKET_HISTORY_MAX_AGE_MS,
      evaluatedAt,
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: status.qualityStatus,
    evidenceRef: status.qualityStatus === 'VERIFIED'
      ? `financial:${history.provider.toLowerCase()}:${assetId.toUpperCase()}:${field}`
      : null,
  };
}

function findProvenance(snapshot: EquityFundamentalSnapshot, field: keyof EquityFundamentalSnapshot): FinancialFieldProvenance | undefined {
  const expected = snapshot[field];
  const matches = snapshot.provenance.filter((item) => item.field === field);
  return matches.find((item) => item.value === expected && Boolean(item.observedAt))
    ?? matches.find((item) => item.value === expected)
    ?? matches.find((item) => Boolean(item.observedAt))
    ?? matches[0];
}

function fundamentalComponent(
  assetId: string,
  snapshot: EquityFundamentalSnapshot,
  field: keyof EquityFundamentalSnapshot,
  key: string,
  score: number | undefined,
  evaluatedAt: string,
  missingRawFields: string[],
  rejectedEvidenceFields: string[],
): Component | null {
  const raw = snapshot[field];
  if (typeof raw !== 'number' || !Number.isFinite(raw) || score === undefined) {
    missingRawFields.push(String(field));
    return null;
  }
  const provenance = findProvenance(snapshot, field);
  if (!provenance) {
    rejectedEvidenceFields.push(`${String(field)}:NO_PROVENANCE`);
    return null;
  }
  const evidence = financialEvidence(assetId, provenance, evaluatedAt);
  if (!isAdmissibleMarketEvidence(evidence)) {
    rejectedEvidenceFields.push(`${String(field)}:${evidence.qualityStatus}`);
    return null;
  }
  return { key, score: clamp01(score), evidence };
}

function family(components: readonly (Component | null)[], minimumComponents = 1): EquityFactorFamilyInput | undefined {
  const valid = components.filter((component): component is Component => Boolean(component));
  if (valid.length < minimumComponents) return undefined;
  return Object.freeze({
    score: valid.reduce((sum, component) => sum + component.score, 0) / valid.length,
    componentKeys: Object.freeze(valid.map((component) => component.key)),
    evidence: Object.freeze(valid.map((component) => component.evidence)),
  });
}

function momentumFamily(
  assetId: string,
  history: EquityHistorySnapshot | undefined,
  evaluatedAt: string,
  warnings: string[],
  rejectedEvidenceFields: string[],
): EquityFactorFamilyInput | undefined {
  if (!history) return undefined;
  const points = history.points.filter((point) => Number.isFinite(point.close) && point.close > 0);
  if (points.length < 252) {
    warnings.push(`MOMENTUM_HISTORY_INSUFFICIENT:${points.length}/252`);
    return undefined;
  }

  const latestObservedAt = parseHistoryDate(points[points.length - 1].date);
  const endIndex = points.length - 22;
  const start12Index = points.length - 252;
  const start6Index = points.length - 126;
  if (endIndex <= start12Index || start6Index < 0) return undefined;

  const end = points[endIndex].close;
  const return12mEx1m = ((end / points[start12Index].close) - 1) * 100;
  const return6mEx1m = ((end / points[start6Index].close) - 1) * 100;
  const evidence12 = historyEvidence(assetId, history, 'momentum.return12mEx1m', latestObservedAt, evaluatedAt);
  const evidence6 = historyEvidence(assetId, history, 'momentum.return6mEx1m', latestObservedAt, evaluatedAt);
  if (!isAdmissibleMarketEvidence(evidence12) || !isAdmissibleMarketEvidence(evidence6)) {
    rejectedEvidenceFields.push(`momentum.history:${evidence12.qualityStatus}/${evidence6.qualityStatus}`);
    return undefined;
  }

  return family([
    { key: 'momentum.return12mEx1m', score: normalizeRange(return12mEx1m, -30, 60), evidence: evidence12 },
    { key: 'momentum.return6mEx1m', score: normalizeRange(return6mEx1m, -25, 45), evidence: evidence6 },
  ], 2);
}

/**
 * P1 research feature construction from already acquired provider evidence.
 *
 * The bounded absolute normalization is deliberately research-only and MUST be superseded by the
 * peer/sector-relative normalization and outlier policy before any productive model promotion.
 * No absent family is neutral-filled; capital allocation remains absent until coverage/buyback/
 * reinvestment evidence exists instead of treating dividend yield alone as sufficient evidence.
 */
export function composeEquityResearchInput(input: {
  readonly assetId: string;
  readonly classification: EquityClassification;
  readonly fundamentals: EquityFundamentalSnapshot;
  readonly history?: EquityHistorySnapshot;
  readonly evaluatedAt?: string;
}): EquityFeatureCompositionResult {
  const evaluatedAt = input.evaluatedAt ?? new Date().toISOString();
  const missingRawFields: string[] = [];
  const rejectedEvidenceFields: string[] = [];
  const warnings: string[] = ['NORMALIZATION_RESEARCH_ONLY_PEER_RELATIVE_PROMOTION_REQUIRED'];

  const quality = family([
    fundamentalComponent(input.assetId, input.fundamentals, 'profitMarginPct', 'quality.profitability',
      typeof input.fundamentals.profitMarginPct === 'number' ? normalizeRange(input.fundamentals.profitMarginPct, -10, 30) : undefined,
      evaluatedAt, missingRawFields, rejectedEvidenceFields),
    fundamentalComponent(input.assetId, input.fundamentals, 'operatingMarginPct', 'quality.profitability',
      typeof input.fundamentals.operatingMarginPct === 'number' ? normalizeRange(input.fundamentals.operatingMarginPct, -10, 30) : undefined,
      evaluatedAt, missingRawFields, rejectedEvidenceFields),
    fundamentalComponent(input.assetId, input.fundamentals, 'returnOnEquityPct', 'quality.profitability',
      typeof input.fundamentals.returnOnEquityPct === 'number' ? normalizeRange(input.fundamentals.returnOnEquityPct, -20, 40) : undefined,
      evaluatedAt, missingRawFields, rejectedEvidenceFields),
  ], 2);

  const valuation = family([
    fundamentalComponent(input.assetId, input.fundamentals, 'peRatio', 'valuation.earningsYield',
      typeof input.fundamentals.peRatio === 'number' && input.fundamentals.peRatio > 0
        ? normalizeInverseRange(input.fundamentals.peRatio, 5, 40)
        : undefined,
      evaluatedAt, missingRawFields, rejectedEvidenceFields),
    fundamentalComponent(input.assetId, input.fundamentals, 'priceToBookRatio', 'valuation.bookToPrice',
      typeof input.fundamentals.priceToBookRatio === 'number' && input.fundamentals.priceToBookRatio > 0
        ? normalizeInverseRange(input.fundamentals.priceToBookRatio, 0.5, 8)
        : undefined,
      evaluatedAt, missingRawFields, rejectedEvidenceFields),
  ]);

  const growth = family([
    fundamentalComponent(input.assetId, input.fundamentals, 'quarterlyRevenueGrowthPct', 'growth.revenueGrowth',
      typeof input.fundamentals.quarterlyRevenueGrowthPct === 'number'
        ? normalizeRange(input.fundamentals.quarterlyRevenueGrowthPct, -20, 40)
        : undefined,
      evaluatedAt, missingRawFields, rejectedEvidenceFields),
    fundamentalComponent(input.assetId, input.fundamentals, 'quarterlyEarningsGrowthPct', 'growth.epsGrowth',
      typeof input.fundamentals.quarterlyEarningsGrowthPct === 'number'
        ? normalizeRange(input.fundamentals.quarterlyEarningsGrowthPct, -30, 50)
        : undefined,
      evaluatedAt, missingRawFields, rejectedEvidenceFields),
  ]);

  const financialStrength = family([
    fundamentalComponent(input.assetId, input.fundamentals, 'debtToEquity', 'financialStrength.debtToEquityQuality',
      typeof input.fundamentals.debtToEquity === 'number' && input.fundamentals.debtToEquity >= 0
        ? normalizeInverseRange(input.fundamentals.debtToEquity, 0, 2.5)
        : undefined,
      evaluatedAt, missingRawFields, rejectedEvidenceFields),
  ]);

  const momentum = momentumFamily(input.assetId, input.history, evaluatedAt, warnings, rejectedEvidenceFields);

  const families: Partial<Record<EquityFactorFamily, EquityFactorFamilyInput>> = {};
  if (quality) families.quality = quality;
  if (valuation) families.valuation = valuation;
  if (growth) families.growth = growth;
  if (momentum) families.momentum = momentum;
  if (financialStrength) families.financialStrength = financialStrength;

  // Dividend yield by itself is not sufficient evidence for capital allocation quality. Coverage,
  // buyback/share-count and reinvestment evidence are required before this family is admitted.
  warnings.push('CAPITAL_ALLOCATION_NOT_COMPOSED_WITHOUT_COVERAGE_BUYBACK_REINVESTMENT_EVIDENCE');

  return Object.freeze({
    input: Object.freeze({
      classification: input.classification,
      families: Object.freeze({ ...families }),
    }),
    diagnostics: Object.freeze({
      compositionVersion: EQUITY_FEATURE_COMPOSITION_VERSION,
      normalizationPolicy: EQUITY_RESEARCH_NORMALIZATION_POLICY,
      composedFamilies: Object.freeze(Object.keys(families) as EquityFactorFamily[]),
      missingRawFields: Object.freeze([...new Set(missingRawFields)].sort()),
      rejectedEvidenceFields: Object.freeze([...new Set(rejectedEvidenceFields)].sort()),
      warnings: Object.freeze([...warnings]),
      promotionReady: false as const,
    }),
  });
}

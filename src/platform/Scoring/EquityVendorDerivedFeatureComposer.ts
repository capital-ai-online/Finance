import {
  isAdmissibleMarketEvidence,
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../MarketData/evidenceQualityContracts';
import {
  buildFinancialEvidenceId,
  type FinancialFieldProvenance,
} from '../../types/financialProvenance';
import {
  EQUITY_FUNDAMENTAL_MAX_AGE_MS,
  EQUITY_MARKET_HISTORY_MAX_AGE_MS,
  type EquityFeatureCompositionResult,
  type EquityFundamentalSnapshot,
  type EquityHistorySnapshot,
} from './EquityFeatureComposer';
import type { EquityFactorFamily } from './EquityModelContracts';
import type { EquityFactorFamilyInput, EquityResearchScoringInput } from './EquityResearchScoring';

export const EQUITY_VENDOR_DERIVED_FEATURE_VERSION = 'equity-vendor-derived-feature/0.1.0' as const;

export interface EquityVendorDerivedFeatureDiagnostics {
  readonly compositionVersion: typeof EQUITY_VENDOR_DERIVED_FEATURE_VERSION;
  readonly usedFeatureKeys: readonly string[];
  readonly enrichedFamilies: readonly EquityFactorFamily[];
  readonly warnings: readonly string[];
  readonly promotionReady: false;
}

export interface EquityVendorDerivedFeatureResult {
  readonly input: EquityResearchScoringInput;
  readonly diagnostics: EquityVendorDerivedFeatureDiagnostics;
}

interface DerivedComponent {
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

function uniqueEvidence(records: readonly MarketEvidenceQualityRecord[]): readonly MarketEvidenceQualityRecord[] {
  return Object.freeze([...new Map(records.map((record) => [
    record.evidenceRef ?? `${record.providerId}:${record.field}:${record.observedAt ?? ''}`,
    record,
  ])).values()]);
}

function findMatchingProvenance(
  snapshot: EquityFundamentalSnapshot,
  field: 'epsTtm' | 'freeCashFlowPerShare',
): readonly FinancialFieldProvenance[] {
  const expected = snapshot[field];
  if (typeof expected !== 'number' || !Number.isFinite(expected)) return Object.freeze([]);
  return Object.freeze(snapshot.provenance.filter((item) => item.field === field && item.value === expected));
}

function financialEvidence(
  assetId: string,
  provenance: FinancialFieldProvenance,
  evaluatedAt: string,
): MarketEvidenceQualityRecord {
  const observedAt = isoDate(provenance.observedAt);
  const evaluatedMs = Date.parse(evaluatedAt);
  const observedMs = observedAt ? Date.parse(observedAt) : Number.NaN;
  const ageMs = Number.isFinite(observedMs) ? Math.max(0, evaluatedMs - observedMs) : null;
  const verified = ageMs !== null && ageMs <= EQUITY_FUNDAMENTAL_MAX_AGE_MS;
  return Object.freeze({
    assetId,
    providerId: provenance.provider.toLowerCase(),
    capability: 'stock-fundamentals',
    field: provenance.field,
    observedAt,
    retrievedAt: new Date(provenance.retrievedAt).toISOString(),
    freshness: {
      ageMs,
      maxAgeMs: EQUITY_FUNDAMENTAL_MAX_AGE_MS,
      evaluatedAt,
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: verified ? 'VERIFIED' : observedAt ? 'STALE' : 'UNAVAILABLE',
    evidenceRef: verified ? buildFinancialEvidenceId(assetId, provenance) : null,
  });
}

function latestHistoryObservation(
  assetId: string,
  history: EquityHistorySnapshot | undefined,
  evaluatedAt: string,
): { close: number; evidence: MarketEvidenceQualityRecord } | null {
  if (!history) return null;
  const evaluatedMs = Date.parse(evaluatedAt);
  const candidates = history.points
    .map((point) => ({ ...point, observedAt: parseHistoryDate(point.date) }))
    .filter((point): point is typeof point & { observedAt: string } =>
      Boolean(point.observedAt)
      && Number.isFinite(point.close)
      && point.close > 0
      && Date.parse(point.observedAt!) <= evaluatedMs,
    )
    .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
  const latest = candidates[0];
  if (!latest) return null;
  const ageMs = Math.max(0, evaluatedMs - Date.parse(latest.observedAt));
  const qualityStatus = ageMs <= EQUITY_MARKET_HISTORY_MAX_AGE_MS ? 'VERIFIED' : 'STALE';
  const evidence: MarketEvidenceQualityRecord = Object.freeze({
    assetId,
    providerId: history.provider.toLowerCase(),
    capability: 'stock-market-history',
    field: 'valuation.latestClose',
    observedAt: latest.observedAt,
    retrievedAt: new Date(history.retrievedAt).toISOString(),
    freshness: {
      ageMs,
      maxAgeMs: EQUITY_MARKET_HISTORY_MAX_AGE_MS,
      evaluatedAt,
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus,
    evidenceRef: qualityStatus === 'VERIFIED'
      ? `financial:${history.provider.toLowerCase()}:${assetId.toUpperCase()}:valuation.latestClose`
      : null,
  });
  return isAdmissibleMarketEvidence(evidence) ? { close: latest.close, evidence } : null;
}

function fcfConversionComponent(input: {
  assetId: string;
  fundamentals: EquityFundamentalSnapshot;
  evaluatedAt: string;
}): DerivedComponent | null {
  const fcf = input.fundamentals.freeCashFlowPerShare;
  const eps = input.fundamentals.epsTtm;
  if (typeof fcf !== 'number' || !Number.isFinite(fcf) || typeof eps !== 'number' || !Number.isFinite(eps) || eps <= 0) {
    return null;
  }
  const fcfProvenance = findMatchingProvenance(input.fundamentals, 'freeCashFlowPerShare');
  const epsProvenance = findMatchingProvenance(input.fundamentals, 'epsTtm');
  const pair = fcfProvenance.flatMap((left) => epsProvenance.map((right) => ({ left, right })))
    .find(({ left, right }) =>
      left.provider === right.provider
      && Boolean(left.observedAt)
      && left.observedAt === right.observedAt,
    );
  if (!pair) return null;
  const evidence = [
    financialEvidence(input.assetId, pair.left, input.evaluatedAt),
    financialEvidence(input.assetId, pair.right, input.evaluatedAt),
  ];
  if (evidence.some((record) => !isAdmissibleMarketEvidence(record))) return null;
  const conversion = fcf / eps;
  return Object.freeze({
    key: 'quality.freeCashFlowConversion',
    score: normalizeRange(conversion, 0, 1.5),
    evidence: uniqueEvidence(evidence),
  });
}

function fcfYieldComponent(input: {
  assetId: string;
  fundamentals: EquityFundamentalSnapshot;
  history?: EquityHistorySnapshot;
  evaluatedAt: string;
}): DerivedComponent | null {
  const fcf = input.fundamentals.freeCashFlowPerShare;
  if (typeof fcf !== 'number' || !Number.isFinite(fcf)) return null;
  const provenance = findMatchingProvenance(input.fundamentals, 'freeCashFlowPerShare')
    .find((item) => Boolean(item.observedAt));
  if (!provenance) return null;
  const fcfEvidence = financialEvidence(input.assetId, provenance, input.evaluatedAt);
  const market = latestHistoryObservation(input.assetId, input.history, input.evaluatedAt);
  if (!isAdmissibleMarketEvidence(fcfEvidence) || !market) return null;
  const yieldPct = (fcf / market.close) * 100;
  return Object.freeze({
    key: 'valuation.freeCashFlowYield',
    score: normalizeRange(yieldPct, 0, 8),
    evidence: uniqueEvidence([fcfEvidence, market.evidence]),
  });
}

function enrichExistingFamily(
  base: EquityFactorFamilyInput | undefined,
  component: DerivedComponent | null,
): EquityFactorFamilyInput | undefined {
  if (!base || !component) return base;
  return Object.freeze({
    score: (base.score + component.score) / 2,
    componentKeys: Object.freeze([...new Set([...base.componentKeys, component.key])]),
    evidence: uniqueEvidence([...base.evidence, ...component.evidence]),
  });
}

/**
 * Research-only composition of two already-inventoried Equity 0.2.0 features:
 * `quality.freeCashFlowConversion` and `valuation.freeCashFlowYield`.
 *
 * FCF conversion requires same-provider/same-observation TTM FCF-per-share and EPS evidence. FCF
 * yield requires admissible FCF-per-share plus a recent provenance-aware market close. The stage only
 * enriches an already-existing Quality/Valuation family and therefore cannot manufacture family
 * coverage from a single derived signal.
 */
export function augmentEquityResearchWithVendorDerivedFeatures(input: {
  readonly base: EquityFeatureCompositionResult;
  readonly assetId: string;
  readonly fundamentals: EquityFundamentalSnapshot;
  readonly history?: EquityHistorySnapshot;
  readonly evaluatedAt: string;
}): EquityVendorDerivedFeatureResult {
  const warnings: string[] = [];
  const usedFeatureKeys: string[] = [];
  const enrichedFamilies: EquityFactorFamily[] = [];
  const families: Partial<Record<EquityFactorFamily, EquityFactorFamilyInput>> = {
    ...input.base.input.families,
  };

  const qualityComponent = fcfConversionComponent(input);
  if (qualityComponent && families.quality) {
    families.quality = enrichExistingFamily(families.quality, qualityComponent);
    usedFeatureKeys.push(qualityComponent.key);
    enrichedFamilies.push('quality');
  } else if (qualityComponent) {
    warnings.push('FCF_CONVERSION_DEFERRED_WITHOUT_BASE_QUALITY_FAMILY');
  } else {
    warnings.push('FCF_CONVERSION_NOT_COMPOSABLE_FROM_ALIGNED_VERIFIED_TTM_EVIDENCE');
  }

  const valuationComponent = fcfYieldComponent(input);
  if (valuationComponent && families.valuation) {
    families.valuation = enrichExistingFamily(families.valuation, valuationComponent);
    usedFeatureKeys.push(valuationComponent.key);
    enrichedFamilies.push('valuation');
  } else if (valuationComponent) {
    warnings.push('FCF_YIELD_DEFERRED_WITHOUT_BASE_VALUATION_FAMILY');
  } else {
    warnings.push('FCF_YIELD_NOT_COMPOSABLE_WITHOUT_VERIFIED_FCF_AND_FRESH_MARKET_CLOSE');
  }

  return Object.freeze({
    input: Object.freeze({
      classification: input.base.input.classification,
      families: Object.freeze({ ...families }),
    }),
    diagnostics: Object.freeze({
      compositionVersion: EQUITY_VENDOR_DERIVED_FEATURE_VERSION,
      usedFeatureKeys: Object.freeze([...new Set(usedFeatureKeys)]),
      enrichedFamilies: Object.freeze([...new Set(enrichedFamilies)]),
      warnings: Object.freeze(warnings),
      promotionReady: false as const,
    }),
  });
}

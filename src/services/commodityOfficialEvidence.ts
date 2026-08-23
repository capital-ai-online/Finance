import { ResearchEvidenceProviderHttp } from '../platform/MarketData/providers/ResearchEvidenceProviderHttp';
import type {
  CommodityResearchDomain,
  CommodityResearchFeatureObservation,
} from '../platform/Scoring/CommodityResearchModelContracts';

export const COMMODITY_OFFICIAL_EVIDENCE_CONTRACT_VERSION = 'commodity-official-evidence/1.0.0' as const;
export const CFTC_DISAGGREGATED_FUTURES_ONLY_DATASET = '72hh-3qpy' as const;
export const USGS_MCS_2026_DATA_RELEASE_ID = '69837e43b66b01367d7ec7c7' as const;
export const USDA_FAS_OPEN_DATA_BASE_URL = 'https://apps.fas.usda.gov/OpenData' as const;

export type CommodityOfficialEvidenceStatus =
  | 'READY'
  | 'PARTIAL'
  | 'NOT_CONFIGURED'
  | 'SOURCE_UNAVAILABLE'
  | 'INVALID'
  | 'UNSUPPORTED_ASSET';

export type CommodityOfficialProviderId =
  | 'eia'
  | 'usda-fas-psd'
  | 'cftc-cot'
  | 'usgs-mcs'
  | 'eu-crma';

export interface CommodityOfficialEvidenceBundle {
  readonly contractVersion: typeof COMMODITY_OFFICIAL_EVIDENCE_CONTRACT_VERSION;
  readonly providerId: CommodityOfficialProviderId;
  readonly status: CommodityOfficialEvidenceStatus;
  readonly assetId: string;
  readonly symbol: string;
  readonly domain: CommodityResearchDomain;
  readonly retrievedAt: string;
  readonly sourcePath: string;
  readonly observations: readonly CommodityResearchFeatureObservation[];
  readonly missingFeatures: readonly string[];
  readonly reason?: string;
  readonly canonical: false;
  readonly scoreEligible: false;
}

export interface CommodityEvidenceAdapterOptions {
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
}

function isoNow(options: CommodityEvidenceAdapterOptions): string {
  return new Date(options.nowMs?.() ?? Date.now()).toISOString();
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function rowsFrom(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object' && !Array.isArray(row)));
  }
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  for (const key of ['data', 'results', 'result', 'records', 'values']) {
    if (Array.isArray(record[key])) {
      return (record[key] as unknown[]).filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object' && !Array.isArray(row)));
    }
  }
  const response = record.response;
  if (response && typeof response === 'object') return rowsFrom(response);
  return [];
}

function normalizePeriod(value: unknown, fallbackIso: string): string {
  if (typeof value !== 'string' || !value.trim()) return fallbackIso;
  const raw = value.trim();
  if (Number.isFinite(Date.parse(raw))) return new Date(raw).toISOString();
  if (/^\d{8}$/.test(raw)) {
    const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T23:59:59.000Z`;
    return Number.isFinite(Date.parse(iso)) ? iso : fallbackIso;
  }
  if (/^\d{6}$/.test(raw)) {
    const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-01T23:59:59.000Z`;
    return Number.isFinite(Date.parse(iso)) ? iso : fallbackIso;
  }
  if (/^\d{4}$/.test(raw)) return `${raw}-12-31T23:59:59.000Z`;
  return fallbackIso;
}

function result(input: Readonly<{
  providerId: CommodityOfficialProviderId;
  status: CommodityOfficialEvidenceStatus;
  assetId: string;
  symbol: string;
  domain: CommodityResearchDomain;
  retrievedAt: string;
  sourcePath: string;
  observations?: readonly CommodityResearchFeatureObservation[];
  missingFeatures?: readonly string[];
  reason?: string;
}>): CommodityOfficialEvidenceBundle {
  return {
    contractVersion: COMMODITY_OFFICIAL_EVIDENCE_CONTRACT_VERSION,
    providerId: input.providerId,
    status: input.status,
    assetId: input.assetId,
    symbol: input.symbol.toUpperCase().trim(),
    domain: input.domain,
    retrievedAt: input.retrievedAt,
    sourcePath: input.sourcePath,
    observations: Object.freeze([...(input.observations ?? [])]),
    missingFeatures: Object.freeze([...(input.missingFeatures ?? [])]),
    reason: input.reason,
    canonical: false,
    scoreEligible: false,
  };
}

export interface EiaSeriesBinding {
  readonly featureKey: string;
  readonly seriesId: string;
  readonly unit?: string;
}

export interface EiaEnergyEvidenceRequest {
  readonly assetId: string;
  readonly symbol: string;
  readonly series: readonly EiaSeriesBinding[];
}

export interface EiaEnergyEvidenceOptions extends CommodityEvidenceAdapterOptions {
  readonly apiKey?: string;
}

/**
 * EIA API v2 adapter for explicitly governed petroleum, natural-gas, coal or STEO series.
 * Series IDs are configuration/evidence bindings; no series is inferred from the trading symbol.
 */
export async function fetchEiaEnergyEvidence(
  input: EiaEnergyEvidenceRequest,
  options: EiaEnergyEvidenceOptions = {},
): Promise<CommodityOfficialEvidenceBundle> {
  const retrievedAt = isoNow(options);
  const apiKey = options.apiKey?.trim() || process.env.EIA_API_KEY?.trim() || '';
  const sourcePath = 'https://api.eia.gov/v2/seriesid';
  if (!apiKey) {
    return result({ providerId: 'eia', status: 'NOT_CONFIGURED', assetId: input.assetId, symbol: input.symbol, domain: 'energy', retrievedAt, sourcePath, reason: 'EIA_API_KEY is not configured.' });
  }
  if (input.series.length === 0) {
    return result({ providerId: 'eia', status: 'UNSUPPORTED_ASSET', assetId: input.assetId, symbol: input.symbol, domain: 'energy', retrievedAt, sourcePath, reason: 'No governed EIA series binding is configured for this energy instrument.' });
  }

  const transport = new ResearchEvidenceProviderHttp('eia', 'commodity-fundamentals', {
    baseUrl: 'https://api.eia.gov/v2',
    apiKeyRequired: false,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    nowMs: options.nowMs,
  });
  const observations: CommodityResearchFeatureObservation[] = [];
  const missingFeatures: string[] = [];
  for (const binding of input.series) {
    const response = await transport.requestJson(`/seriesid/${encodeURIComponent(binding.seriesId)}?api_key=${encodeURIComponent(apiKey)}`);
    if (response.status !== 'READY') {
      missingFeatures.push(binding.featureKey);
      continue;
    }
    const valid = rowsFrom(response.data)
      .map(row => ({ row, value: asNumber(row.value), period: String(row.period ?? row.date ?? '') }))
      .filter(item => item.value !== null)
      .sort((a, b) => a.period.localeCompare(b.period));
    const latest = valid.at(-1);
    if (!latest || latest.value === null) {
      missingFeatures.push(binding.featureKey);
      continue;
    }
    const observedAt = normalizePeriod(latest.period, response.retrievedAt);
    const sourceUnit = String(latest.row.units ?? latest.row.unit ?? binding.unit ?? 'source-unit');
    observations.push({
      featureKey: binding.featureKey,
      rawValue: latest.value,
      unit: binding.unit ?? sourceUnit,
      source: `EIA:${binding.seriesId}`,
      observedAt,
      retrievedAt: response.retrievedAt,
      evidenceId: `eia:${binding.seriesId}:${latest.period}`,
      confidence: 1,
    });
  }

  return result({
    providerId: 'eia',
    status: observations.length === 0 ? 'SOURCE_UNAVAILABLE' : missingFeatures.length > 0 ? 'PARTIAL' : 'READY',
    assetId: input.assetId,
    symbol: input.symbol,
    domain: 'energy',
    retrievedAt,
    sourcePath,
    observations,
    missingFeatures,
    reason: observations.length === 0 ? 'No configured EIA series produced a usable observation.' : undefined,
  });
}

export interface UsdaPsdAttributeBinding {
  readonly featureKey: string;
  readonly attributeId: number | string;
  readonly unit?: string;
}

export interface UsdaAgricultureEvidenceRequest {
  readonly assetId: string;
  readonly symbol: string;
  readonly commodityCode: string;
  readonly marketYear: number;
  readonly attributes: readonly UsdaPsdAttributeBinding[];
}

export interface UsdaAgricultureEvidenceOptions extends CommodityEvidenceAdapterOptions {
  readonly apiKey?: string;
}

function releaseDateCandidates(payload: unknown): string[] {
  const direct = Array.isArray(payload)
    ? payload.filter((value): value is string => typeof value === 'string')
    : [];
  const nested = rowsFrom(payload)
    .flatMap(row => [
      row.releaseDate,
      row.release_date,
      row.date,
      row.dataReleaseDate,
      row.data_release_date,
      row.releaseDateTime,
    ])
    .filter((value): value is string => typeof value === 'string');
  return [...direct, ...nested]
    .filter(value => Number.isFinite(Date.parse(value)))
    .map(value => new Date(value).toISOString())
    .sort();
}

function latestReleaseDate(payload: unknown, fallback: string): string {
  const dates = releaseDateCandidates(payload);
  return dates.at(-1) ?? fallback;
}

/**
 * USDA FAS PSD adapter with release/revision lineage.
 * Official OpenData REST endpoints use the `API_KEY` header and explicit commodity/attribute IDs.
 */
export async function fetchUsdaAgricultureEvidence(
  input: UsdaAgricultureEvidenceRequest,
  options: UsdaAgricultureEvidenceOptions = {},
): Promise<CommodityOfficialEvidenceBundle> {
  const retrievedAt = isoNow(options);
  const sourcePath = `${USDA_FAS_OPEN_DATA_BASE_URL}/api/psd`;
  const apiKey = options.apiKey?.trim() || process.env.USDA_FAS_API_KEY?.trim() || process.env.DATA_GOV_API_KEY?.trim() || '';
  if (!apiKey) {
    return result({ providerId: 'usda-fas-psd', status: 'NOT_CONFIGURED', assetId: input.assetId, symbol: input.symbol, domain: 'agriculture', retrievedAt, sourcePath, reason: 'USDA FAS/Data.gov API key is not configured.' });
  }
  if (!input.commodityCode.trim() || input.attributes.length === 0) {
    return result({ providerId: 'usda-fas-psd', status: 'UNSUPPORTED_ASSET', assetId: input.assetId, symbol: input.symbol, domain: 'agriculture', retrievedAt, sourcePath, reason: 'Governed USDA commodity and attribute bindings are required.' });
  }
  const transport = new ResearchEvidenceProviderHttp('usda-fas-psd', 'commodity-fundamentals', {
    baseUrl: USDA_FAS_OPEN_DATA_BASE_URL,
    apiKey,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    nowMs: options.nowMs,
    authHeaders: key => ({ API_KEY: key }),
  });
  const release = await transport.requestJson(`/api/psd/commodity/${encodeURIComponent(input.commodityCode)}/dataReleaseDates`);
  const releaseAt = release.status === 'READY' ? latestReleaseDate(release.data, release.retrievedAt) : retrievedAt;
  const response = await transport.requestJson(`/api/psd/commodity/${encodeURIComponent(input.commodityCode)}/world/year/${input.marketYear}`);
  if (response.status !== 'READY') {
    return result({ providerId: 'usda-fas-psd', status: 'SOURCE_UNAVAILABLE', assetId: input.assetId, symbol: input.symbol, domain: 'agriculture', retrievedAt, sourcePath, missingFeatures: input.attributes.map(item => item.featureKey), reason: response.reason });
  }
  const rows = rowsFrom(response.data);
  const observations: CommodityResearchFeatureObservation[] = [];
  const missingFeatures: string[] = [];
  for (const binding of input.attributes) {
    const row = rows.find(item => String(item.attributeId ?? item.attribute_id ?? item.commodityAttributeId ?? '') === String(binding.attributeId));
    const value = row ? asNumber(row.value ?? row.amount ?? row.quantity) : null;
    if (!row || value === null) {
      missingFeatures.push(binding.featureKey);
      continue;
    }
    observations.push({
      featureKey: binding.featureKey,
      rawValue: value,
      unit: binding.unit ?? String(row.unitDescription ?? row.unit ?? row.unitId ?? 'source-unit'),
      source: `USDA-FAS-PSD:${input.commodityCode}`,
      observedAt: releaseAt,
      retrievedAt: response.retrievedAt,
      evidenceId: `usda-psd:${input.commodityCode}:${input.marketYear}:${String(binding.attributeId)}:${releaseAt.slice(0, 10)}`,
      revisionId: releaseAt,
      confidence: 1,
    });
  }
  return result({
    providerId: 'usda-fas-psd',
    status: observations.length === 0 ? 'SOURCE_UNAVAILABLE' : missingFeatures.length > 0 ? 'PARTIAL' : 'READY',
    assetId: input.assetId,
    symbol: input.symbol,
    domain: 'agriculture',
    retrievedAt,
    sourcePath,
    observations,
    missingFeatures,
  });
}

export interface CftcPositioningEvidenceRequest {
  readonly assetId: string;
  readonly symbol: string;
  readonly domain: CommodityResearchDomain;
  readonly marketNameContains: string;
  readonly featureKey?: string;
}

/** CFTC Disaggregated Futures Only positioning; never a trade-ready gate by itself. */
export async function fetchCftcPositioningEvidence(
  input: CftcPositioningEvidenceRequest,
  options: CommodityEvidenceAdapterOptions = {},
): Promise<CommodityOfficialEvidenceBundle> {
  const retrievedAt = isoNow(options);
  const sourcePath = `https://publicreporting.cftc.gov/resource/${CFTC_DISAGGREGATED_FUTURES_ONLY_DATASET}.json`;
  if (!input.marketNameContains.trim()) {
    return result({ providerId: 'cftc-cot', status: 'UNSUPPORTED_ASSET', assetId: input.assetId, symbol: input.symbol, domain: input.domain, retrievedAt, sourcePath, reason: 'A governed CFTC market-name binding is required.' });
  }
  const transport = new ResearchEvidenceProviderHttp('cftc-cot', 'commodity-positioning', {
    baseUrl: 'https://publicreporting.cftc.gov',
    apiKeyRequired: false,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    nowMs: options.nowMs,
  });
  const safeMarket = input.marketNameContains.toUpperCase().replace(/'/g, "''");
  const where = encodeURIComponent(`contains(upper(market_and_exchange_names),'${safeMarket}')`);
  const response = await transport.requestJson(`/resource/${CFTC_DISAGGREGATED_FUTURES_ONLY_DATASET}.json?$limit=10&$order=report_date_as_yyyy_mm_dd%20DESC&$where=${where}`);
  if (response.status !== 'READY') {
    return result({ providerId: 'cftc-cot', status: 'SOURCE_UNAVAILABLE', assetId: input.assetId, symbol: input.symbol, domain: input.domain, retrievedAt, sourcePath, missingFeatures: [input.featureKey ?? 'positioning.managedMoneyNetPctOi'], reason: response.reason });
  }
  const row = rowsFrom(response.data)[0];
  const long = row ? asNumber(row.m_money_positions_long_all ?? row.managed_money_long_all) : null;
  const short = row ? asNumber(row.m_money_positions_short_all ?? row.managed_money_short_all) : null;
  const openInterest = row ? asNumber(row.open_interest_all) : null;
  if (!row || long === null || short === null || openInterest === null || openInterest <= 0) {
    return result({ providerId: 'cftc-cot', status: 'INVALID', assetId: input.assetId, symbol: input.symbol, domain: input.domain, retrievedAt, sourcePath, missingFeatures: [input.featureKey ?? 'positioning.managedMoneyNetPctOi'], reason: 'CFTC row lacks managed-money long/short or open-interest fields.' });
  }
  const reportDate = normalizePeriod(row.report_date_as_yyyy_mm_dd ?? row.report_date, response.retrievedAt);
  const featureKey = input.featureKey ?? 'positioning.managedMoneyNetPctOi';
  return result({
    providerId: 'cftc-cot',
    status: 'READY',
    assetId: input.assetId,
    symbol: input.symbol,
    domain: input.domain,
    retrievedAt,
    sourcePath,
    observations: [{
      featureKey,
      rawValue: ((long - short) / openInterest) * 100,
      unit: 'percent-open-interest',
      source: `CFTC-COT:${String(row.market_and_exchange_names ?? input.marketNameContains)}`,
      observedAt: reportDate,
      retrievedAt: response.retrievedAt,
      evidenceId: `cftc:${CFTC_DISAGGREGATED_FUTURES_ONLY_DATASET}:${String(row.cftc_contract_market_code ?? input.marketNameContains)}:${reportDate.slice(0, 10)}`,
      confidence: 1,
    }],
  });
}

export interface UsgsMcsObservationInput {
  readonly featureKey: string;
  readonly value: number | null;
  readonly unit: string;
  readonly commodity: string;
  readonly statistic: string;
  readonly year: number;
  readonly sourcePath?: string;
}

/** Normalizes governed public-domain USGS MCS rows; no mining-project valuation is inferred. */
export function buildUsgsMineralEvidence(input: Readonly<{
  assetId: string;
  symbol: string;
  observations: readonly UsgsMcsObservationInput[];
  domain?: Extract<CommodityResearchDomain, 'industrial-metals' | 'precious-metals'>;
  retrievedAt?: string;
}>): CommodityOfficialEvidenceBundle {
  const retrievedAt = input.retrievedAt && Number.isFinite(Date.parse(input.retrievedAt)) ? input.retrievedAt : new Date().toISOString();
  const sourcePath = `https://data.usgs.gov/datacatalog/data/USGS%3A${USGS_MCS_2026_DATA_RELEASE_ID}`;
  const observations: CommodityResearchFeatureObservation[] = [];
  const missingFeatures: string[] = [];
  for (const item of input.observations) {
    if (item.value === null || !Number.isFinite(item.value) || !item.commodity.trim() || !item.statistic.trim() || !Number.isInteger(item.year)) {
      missingFeatures.push(item.featureKey);
      continue;
    }
    observations.push({
      featureKey: item.featureKey,
      rawValue: item.value,
      unit: item.unit,
      source: `USGS-MCS-2026:${item.commodity}:${item.statistic}`,
      observedAt: `${item.year}-12-31T23:59:59.000Z`,
      retrievedAt,
      evidenceId: `usgs-mcs-2026:${item.commodity.toLowerCase().replace(/[^a-z0-9]+/g, '-')}:${item.statistic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}:${item.year}`,
      revisionId: 'MCS-2026-v1.3',
      confidence: 1,
    });
  }
  return result({
    providerId: 'usgs-mcs',
    status: observations.length === 0 ? 'INVALID' : missingFeatures.length > 0 ? 'PARTIAL' : 'READY',
    assetId: input.assetId,
    symbol: input.symbol,
    domain: input.domain ?? 'industrial-metals',
    retrievedAt,
    sourcePath,
    observations,
    missingFeatures,
  });
}

export interface EuCrmaCriticalityInput {
  readonly economicImportance?: number | null;
  readonly supplyRisk?: number | null;
  readonly observedAt: string;
  readonly evidenceId: string;
}

/** Keeps CRMA Economic Importance and Supply Risk as separate context dimensions. */
export function buildEuCrmaCriticalityEvidence(input: Readonly<{
  assetId: string;
  symbol: string;
  criticality: EuCrmaCriticalityInput;
  retrievedAt?: string;
}>): CommodityOfficialEvidenceBundle {
  const retrievedAt = input.retrievedAt && Number.isFinite(Date.parse(input.retrievedAt)) ? input.retrievedAt : new Date().toISOString();
  const sourcePath = 'https://eur-lex.europa.eu/eli/reg/2024/1252/oj';
  if (!Number.isFinite(Date.parse(input.criticality.observedAt)) || !input.criticality.evidenceId.trim()) {
    return result({ providerId: 'eu-crma', status: 'INVALID', assetId: input.assetId, symbol: input.symbol, domain: 'industrial-metals', retrievedAt, sourcePath, reason: 'CRMA evidence requires a valid observation date and evidence id.' });
  }
  const observations: CommodityResearchFeatureObservation[] = [];
  const missingFeatures: string[] = [];
  if (input.criticality.economicImportance !== null && input.criticality.economicImportance !== undefined && Number.isFinite(input.criticality.economicImportance)) {
    observations.push({ featureKey: 'criticality.economicImportance', rawValue: input.criticality.economicImportance, unit: 'index', source: 'EU-CRMA:Regulation-2024/1252', observedAt: input.criticality.observedAt, retrievedAt, evidenceId: `${input.criticality.evidenceId}:economic-importance`, confidence: 1 });
  } else missingFeatures.push('criticality.economicImportance');
  if (input.criticality.supplyRisk !== null && input.criticality.supplyRisk !== undefined && Number.isFinite(input.criticality.supplyRisk)) {
    observations.push({ featureKey: 'criticality.supplyRisk', rawValue: input.criticality.supplyRisk, unit: 'index', source: 'EU-CRMA:Regulation-2024/1252', observedAt: input.criticality.observedAt, retrievedAt, evidenceId: `${input.criticality.evidenceId}:supply-risk`, confidence: 1 });
  } else missingFeatures.push('criticality.supplyRisk');
  return result({
    providerId: 'eu-crma',
    status: observations.length === 0 ? 'INVALID' : missingFeatures.length > 0 ? 'PARTIAL' : 'READY',
    assetId: input.assetId,
    symbol: input.symbol,
    domain: 'industrial-metals',
    retrievedAt,
    sourcePath,
    observations,
    missingFeatures,
  });
}

/**
 * Source-neutral futures-curve derivation. Both legs must already carry governed identity/evidence;
 * this helper only derives the backwardation/contango spread and cannot fetch or guess contracts.
 */
export function buildVerifiedTermStructureObservation(input: Readonly<{
  nearPrice: number;
  farPrice: number;
  source: string;
  observedAt: string;
  retrievedAt: string;
  nearEvidenceId: string;
  farEvidenceId: string;
}>): CommodityResearchFeatureObservation | null {
  if (!Number.isFinite(input.nearPrice) || input.nearPrice <= 0 || !Number.isFinite(input.farPrice) || input.farPrice <= 0) return null;
  if (!input.source.trim() || !input.nearEvidenceId.trim() || !input.farEvidenceId.trim()) return null;
  if (!Number.isFinite(Date.parse(input.observedAt)) || !Number.isFinite(Date.parse(input.retrievedAt))) return null;
  return {
    featureKey: 'market.termStructure',
    rawValue: ((input.nearPrice / input.farPrice) - 1) * 100,
    unit: 'percent',
    source: input.source,
    observedAt: input.observedAt,
    retrievedAt: input.retrievedAt,
    evidenceId: `derived:term-structure:${input.nearEvidenceId}:${input.farEvidenceId}`,
    confidence: 1,
  };
}

/** Joins independently sourced bundles without assigning weights or producing a score. */
export function mergeCommodityOfficialEvidence(
  bundles: readonly CommodityOfficialEvidenceBundle[],
): readonly CommodityResearchFeatureObservation[] {
  const byFeature = new Map<string, CommodityResearchFeatureObservation>();
  for (const bundle of bundles) {
    for (const observation of bundle.observations) {
      const existing = byFeature.get(observation.featureKey);
      if (!existing || Date.parse(observation.retrievedAt) >= Date.parse(existing.retrievedAt)) {
        byFeature.set(observation.featureKey, observation);
      }
    }
  }
  return Object.freeze([...byFeature.values()]);
}

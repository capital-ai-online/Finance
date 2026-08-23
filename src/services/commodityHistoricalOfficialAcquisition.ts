import { ResearchEvidenceProviderHttp } from '../platform/MarketData/providers/ResearchEvidenceProviderHttp';
import {
  buildCommodityHistoricalVintage,
  type CommodityHistoricalSourceId,
  type CommodityHistoricalVintageArtifact,
} from '../platform/Scoring/CommodityHistoricalVintage';
import type { CommodityResearchDomain } from '../platform/Scoring/CommodityResearchModelContracts';
import {
  CFTC_DISAGGREGATED_FUTURES_ONLY_DATASET,
  USDA_FAS_OPEN_DATA_BASE_URL,
  type CommodityEvidenceAdapterOptions,
  type EiaSeriesBinding,
  type UsdaPsdAttributeBinding,
  type UsgsMcsObservationInput,
} from './commodityOfficialEvidence';

export const COMMODITY_HISTORICAL_OFFICIAL_ACQUISITION_VERSION =
  'commodity-historical-official-acquisition/1.0.0' as const;

export type CommodityHistoricalAcquisitionStatus =
  | 'READY'
  | 'PARTIAL'
  | 'NOT_CONFIGURED'
  | 'SOURCE_UNAVAILABLE'
  | 'INVALID';

export interface CommodityHistoricalAcquisitionResult {
  readonly acquisitionVersion: typeof COMMODITY_HISTORICAL_OFFICIAL_ACQUISITION_VERSION;
  readonly providerId: CommodityHistoricalSourceId;
  readonly status: CommodityHistoricalAcquisitionStatus;
  readonly vintages: readonly CommodityHistoricalVintageArtifact[];
  readonly missingFeatureKeys: readonly string[];
  readonly reason?: string;
  readonly canonical: false;
  readonly scoreEligible: false;
}

export interface CommodityArchivedReleaseEvidence {
  readonly publishedAt: string;
  readonly capturedAt: string;
  readonly releaseId: string;
  readonly revisionId?: string | null;
  readonly availabilityEvidenceId: string;
  readonly sourceVersion: string;
  readonly sourcePath: string;
}

function result(input: Readonly<{
  providerId: CommodityHistoricalSourceId;
  status: CommodityHistoricalAcquisitionStatus;
  vintages?: readonly CommodityHistoricalVintageArtifact[];
  missingFeatureKeys?: readonly string[];
  reason?: string;
}>): CommodityHistoricalAcquisitionResult {
  return Object.freeze({
    acquisitionVersion: COMMODITY_HISTORICAL_OFFICIAL_ACQUISITION_VERSION,
    providerId: input.providerId,
    status: input.status,
    vintages: Object.freeze([...(input.vintages ?? [])]),
    missingFeatureKeys: Object.freeze([...(input.missingFeatureKeys ?? [])]),
    reason: input.reason,
    canonical: false,
    scoreEligible: false,
  });
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
  return response && typeof response === 'object' ? rowsFrom(response) : [];
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function validTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function normalizePeriod(value: unknown, fallbackIso: string): string {
  if (typeof value !== 'string' || !value.trim()) return fallbackIso;
  const raw = value.trim();
  if (Number.isFinite(Date.parse(raw))) return new Date(raw).toISOString();
  if (/^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T23:59:59.000Z`;
  if (/^\d{6}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-01T23:59:59.000Z`;
  if (/^\d{4}$/.test(raw)) return `${raw}-12-31T23:59:59.000Z`;
  return fallbackIso;
}

function releaseDateCandidates(payload: unknown): string[] {
  const direct = Array.isArray(payload)
    ? payload.filter((value): value is string => typeof value === 'string')
    : [];
  const nested = rowsFrom(payload)
    .flatMap(row => [row.releaseDate, row.release_date, row.date, row.dataReleaseDate, row.data_release_date, row.releaseDateTime])
    .filter((value): value is string => typeof value === 'string');
  return [...direct, ...nested]
    .filter(value => Number.isFinite(Date.parse(value)))
    .map(value => new Date(value).toISOString())
    .sort();
}

function dateOnly(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export interface EiaHistoricalRangeRequest {
  readonly assetId: string;
  readonly symbol: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly series: readonly EiaSeriesBinding[];
}

export interface EiaHistoricalRangeOptions extends CommodityEvidenceAdapterOptions {
  readonly apiKey?: string;
}

/**
 * Retrieves historical EIA values through the governed shared HTTP transport.
 * The output is deliberately CURRENT_HISTORY_ONLY: API v2 can return old periods, but a current
 * response does not prove which revision was available at a historical decision time.
 */
export async function fetchEiaCurrentHistoricalVintages(
  input: EiaHistoricalRangeRequest,
  options: EiaHistoricalRangeOptions = {},
): Promise<CommodityHistoricalAcquisitionResult> {
  const apiKey = options.apiKey?.trim() || process.env.EIA_API_KEY?.trim() || '';
  if (!apiKey) return result({ providerId: 'eia', status: 'NOT_CONFIGURED', reason: 'EIA_API_KEY is not configured.' });
  if (!validTimestamp(input.startDate) || !validTimestamp(input.endDate) || Date.parse(input.startDate) > Date.parse(input.endDate)) {
    return result({ providerId: 'eia', status: 'INVALID', reason: 'Historical EIA date range is invalid.' });
  }
  if (input.series.length === 0) return result({ providerId: 'eia', status: 'INVALID', reason: 'At least one governed EIA series binding is required.' });

  const transport = new ResearchEvidenceProviderHttp('eia', 'commodity-fundamentals', {
    baseUrl: 'https://api.eia.gov/v2',
    apiKeyRequired: false,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    nowMs: options.nowMs,
  });
  const vintages: CommodityHistoricalVintageArtifact[] = [];
  const missingFeatureKeys: string[] = [];
  for (const binding of input.series) {
    const query = `/seriesid/${encodeURIComponent(binding.seriesId)}`
      + `?api_key=${encodeURIComponent(apiKey)}`
      + `&start=${encodeURIComponent(dateOnly(input.startDate))}`
      + `&end=${encodeURIComponent(dateOnly(input.endDate))}`
      + '&length=5000&sort[0][column]=period&sort[0][direction]=asc';
    const response = await transport.requestJson(query);
    if (response.status !== 'READY') {
      missingFeatureKeys.push(binding.featureKey);
      continue;
    }
    const rows = rowsFrom(response.data);
    let featureRows = 0;
    for (const row of rows) {
      const value = asNumber(row.value);
      if (value === null) continue;
      const period = String(row.period ?? row.date ?? '');
      const observedAt = normalizePeriod(period, response.retrievedAt);
      vintages.push(buildCommodityHistoricalVintage({
        providerId: 'eia',
        assetId: input.assetId,
        symbol: input.symbol,
        domain: 'energy',
        featureKey: binding.featureKey,
        value,
        unit: binding.unit ?? String(row.units ?? row.unit ?? 'source-unit'),
        source: `eia:${binding.seriesId}`,
        sourceVersion: 'EIA-API-v2-current-history',
        sourcePath: `https://api.eia.gov/v2/seriesid/${binding.seriesId}`,
        observedAt,
        availableAt: response.retrievedAt,
        retrievedAt: response.retrievedAt,
        evidenceId: `eia-current-history:${binding.seriesId}:${period || observedAt}`,
        releaseId: null,
        revisionId: null,
        availabilityEvidenceId: null,
        acquisitionMode: 'LIVE_API_CURRENT_HISTORY',
        periodLabel: period || null,
      }));
      featureRows += 1;
    }
    if (featureRows === 0) missingFeatureKeys.push(binding.featureKey);
  }

  return result({
    providerId: 'eia',
    status: vintages.length === 0 ? 'SOURCE_UNAVAILABLE' : missingFeatureKeys.length > 0 ? 'PARTIAL' : 'READY',
    vintages,
    missingFeatureKeys,
    reason: vintages.length === 0 ? 'No EIA historical rows were returned for the governed bindings.' : undefined,
  });
}

export interface UsdaHistoricalRangeRequest {
  readonly assetId: string;
  readonly symbol: string;
  readonly commodityCode: string;
  readonly marketYears: readonly number[];
  readonly attributes: readonly UsdaPsdAttributeBinding[];
}

export interface UsdaHistoricalRangeOptions extends CommodityEvidenceAdapterOptions {
  readonly apiKey?: string;
}

/**
 * Retrieves current USDA PSD history for research/discovery. Because PSD explicitly revises values
 * across market years, rows from today's endpoint remain CURRENT_HISTORY_ONLY and cannot enter a
 * promotion-grade PIT dataset until an archived release capture is supplied.
 */
export async function fetchUsdaCurrentHistoricalVintages(
  input: UsdaHistoricalRangeRequest,
  options: UsdaHistoricalRangeOptions = {},
): Promise<CommodityHistoricalAcquisitionResult> {
  const apiKey = options.apiKey?.trim() || process.env.USDA_FAS_API_KEY?.trim() || process.env.DATA_GOV_API_KEY?.trim() || '';
  if (!apiKey) return result({ providerId: 'usda-fas-psd', status: 'NOT_CONFIGURED', reason: 'USDA FAS/Data.gov API key is not configured.' });
  if (!input.commodityCode.trim() || input.marketYears.length === 0 || input.attributes.length === 0) {
    return result({ providerId: 'usda-fas-psd', status: 'INVALID', reason: 'Commodity code, market years and attribute bindings are required.' });
  }
  if (input.marketYears.some(year => !Number.isInteger(year) || year < 1900 || year > 2200)) {
    return result({ providerId: 'usda-fas-psd', status: 'INVALID', reason: 'USDA market years are invalid.' });
  }

  const transport = new ResearchEvidenceProviderHttp('usda-fas-psd', 'commodity-fundamentals', {
    baseUrl: USDA_FAS_OPEN_DATA_BASE_URL,
    apiKey,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    nowMs: options.nowMs,
    authHeaders: key => ({ API_KEY: key }),
  });
  const releaseResponse = await transport.requestJson(`/api/psd/commodity/${encodeURIComponent(input.commodityCode)}/dataReleaseDates`);
  const releaseDates = releaseResponse.status === 'READY' ? releaseDateCandidates(releaseResponse.data) : [];
  const latestReleaseAt = releaseDates.at(-1) ?? null;
  const vintages: CommodityHistoricalVintageArtifact[] = [];
  const missingFeatureKeys: string[] = [];

  for (const marketYear of [...new Set(input.marketYears)].sort((a, b) => a - b)) {
    const response = await transport.requestJson(`/api/psd/commodity/${encodeURIComponent(input.commodityCode)}/world/year/${marketYear}`);
    if (response.status !== 'READY') {
      missingFeatureKeys.push(...input.attributes.map(binding => `${binding.featureKey}:${marketYear}`));
      continue;
    }
    const rows = rowsFrom(response.data);
    for (const binding of input.attributes) {
      const row = rows.find(item => String(item.attributeId ?? item.attribute_id ?? item.commodityAttributeId ?? '') === String(binding.attributeId));
      const value = row ? asNumber(row.value ?? row.amount ?? row.quantity) : null;
      if (!row || value === null) {
        missingFeatureKeys.push(`${binding.featureKey}:${marketYear}`);
        continue;
      }
      const currentVintageAt = latestReleaseAt ?? response.retrievedAt;
      vintages.push(buildCommodityHistoricalVintage({
        providerId: 'usda-fas-psd',
        assetId: input.assetId,
        symbol: input.symbol,
        domain: 'agriculture',
        featureKey: binding.featureKey,
        value,
        unit: binding.unit ?? String(row.unitDescription ?? row.unit ?? row.unitId ?? 'source-unit'),
        source: `usda-fas-psd:${input.commodityCode}`,
        sourceVersion: `USDA-PSD-current-history:${dateOnly(currentVintageAt)}`,
        sourcePath: `${USDA_FAS_OPEN_DATA_BASE_URL}/api/psd/commodity/${input.commodityCode}/world/year/${marketYear}`,
        observedAt: currentVintageAt,
        availableAt: currentVintageAt,
        retrievedAt: response.retrievedAt,
        evidenceId: `usda-current-history:${input.commodityCode}:${marketYear}:${String(binding.attributeId)}:${dateOnly(currentVintageAt)}`,
        releaseId: latestReleaseAt ? `usda-psd-release:${latestReleaseAt}` : null,
        revisionId: latestReleaseAt,
        availabilityEvidenceId: null,
        acquisitionMode: 'LIVE_API_CURRENT_HISTORY',
        periodLabel: String(marketYear),
      }));
    }
  }

  return result({
    providerId: 'usda-fas-psd',
    status: vintages.length === 0 ? 'SOURCE_UNAVAILABLE' : missingFeatureKeys.length > 0 ? 'PARTIAL' : 'READY',
    vintages,
    missingFeatureKeys,
    reason: vintages.length === 0 ? 'No USDA PSD current-history rows were returned.' : undefined,
  });
}

export interface CftcArchivedReportEvidence extends CommodityArchivedReleaseEvidence {
  readonly reportDate: string;
}

export interface CftcHistoricalRangeRequest {
  readonly assetId: string;
  readonly symbol: string;
  readonly domain: CommodityResearchDomain;
  readonly marketNameContains: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly featureKey?: string;
  readonly archivedReports?: readonly CftcArchivedReportEvidence[];
}

/**
 * Retrieves CFTC Disaggregated Futures Only history. Current PRE rows remain CURRENT_HISTORY_ONLY.
 * A row becomes PIT_VERIFIED only when the caller supplies evidence for the archived released report
 * artifact (publication timestamp + content/capture evidence), not merely a derived Friday rule.
 */
export async function fetchCftcHistoricalVintages(
  input: CftcHistoricalRangeRequest,
  options: CommodityEvidenceAdapterOptions = {},
): Promise<CommodityHistoricalAcquisitionResult> {
  if (!input.marketNameContains.trim() || !validTimestamp(input.startDate) || !validTimestamp(input.endDate)
    || Date.parse(input.startDate) > Date.parse(input.endDate)) {
    return result({ providerId: 'cftc-cot', status: 'INVALID', reason: 'CFTC market binding and valid historical date range are required.' });
  }
  const transport = new ResearchEvidenceProviderHttp('cftc-cot', 'commodity-positioning', {
    baseUrl: 'https://publicreporting.cftc.gov',
    apiKeyRequired: false,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    nowMs: options.nowMs,
  });
  const safeMarket = input.marketNameContains.toUpperCase().replace(/'/g, "''");
  const start = dateOnly(input.startDate);
  const end = dateOnly(input.endDate);
  const where = encodeURIComponent(
    `contains(upper(market_and_exchange_names),'${safeMarket}') AND report_date_as_yyyy_mm_dd >= '${start}T00:00:00.000' AND report_date_as_yyyy_mm_dd <= '${end}T23:59:59.999'`,
  );
  const response = await transport.requestJson(
    `/resource/${CFTC_DISAGGREGATED_FUTURES_ONLY_DATASET}.json?$limit=50000&$order=report_date_as_yyyy_mm_dd%20ASC&$where=${where}`,
  );
  if (response.status !== 'READY') {
    return result({ providerId: 'cftc-cot', status: 'SOURCE_UNAVAILABLE', reason: response.reason });
  }

  const archivedByDate = new Map((input.archivedReports ?? []).map(item => [dateOnly(item.reportDate), item]));
  const vintages: CommodityHistoricalVintageArtifact[] = [];
  const featureKey = input.featureKey ?? 'positioning.managedMoneyNetPctOi';
  for (const row of rowsFrom(response.data)) {
    const long = asNumber(row.m_money_positions_long_all ?? row.managed_money_long_all);
    const short = asNumber(row.m_money_positions_short_all ?? row.managed_money_short_all);
    const openInterest = asNumber(row.open_interest_all);
    if (long === null || short === null || openInterest === null || openInterest <= 0) continue;
    const reportDate = normalizePeriod(row.report_date_as_yyyy_mm_dd ?? row.report_date, response.retrievedAt);
    const archive = archivedByDate.get(dateOnly(reportDate));
    const value = ((long - short) / openInterest) * 100;
    vintages.push(buildCommodityHistoricalVintage({
      providerId: 'cftc-cot',
      assetId: input.assetId,
      symbol: input.symbol,
      domain: input.domain,
      featureKey,
      value,
      unit: 'percent-open-interest',
      source: `cftc-cot:${String(row.market_and_exchange_names ?? input.marketNameContains)}`,
      sourceVersion: archive?.sourceVersion ?? `CFTC-PRE-${CFTC_DISAGGREGATED_FUTURES_ONLY_DATASET}-current-history`,
      sourcePath: archive?.sourcePath ?? `https://publicreporting.cftc.gov/resource/${CFTC_DISAGGREGATED_FUTURES_ONLY_DATASET}.json`,
      observedAt: reportDate,
      availableAt: archive?.publishedAt ?? response.retrievedAt,
      retrievedAt: archive?.capturedAt ?? response.retrievedAt,
      evidenceId: `cftc:${CFTC_DISAGGREGATED_FUTURES_ONLY_DATASET}:${String(row.cftc_contract_market_code ?? input.marketNameContains)}:${dateOnly(reportDate)}`,
      releaseId: archive?.releaseId ?? null,
      revisionId: archive?.revisionId ?? null,
      availabilityEvidenceId: archive?.availabilityEvidenceId ?? null,
      acquisitionMode: archive ? 'ARCHIVED_RELEASE_CAPTURE' : 'LIVE_API_CURRENT_HISTORY',
      periodLabel: dateOnly(reportDate),
    }));
  }
  return result({
    providerId: 'cftc-cot',
    status: vintages.length > 0 ? 'READY' : 'SOURCE_UNAVAILABLE',
    vintages,
    missingFeatureKeys: vintages.length > 0 ? [] : [featureKey],
    reason: vintages.length === 0 ? 'No usable CFTC managed-money historical rows were returned.' : undefined,
  });
}

export interface ArchivedFeatureRow {
  readonly featureKey: string;
  readonly value: number;
  readonly unit: string;
  readonly observedAt: string;
  readonly evidenceId: string;
  readonly periodLabel?: string | null;
}

/**
 * Source-neutral archived capture normalizer used when an official release artifact has already
 * been preserved outside the mutable live API. This is the upgrade path for EIA/USDA/CFTC archives.
 */
export function buildArchivedOfficialHistoricalVintages(input: Readonly<{
  providerId: Extract<CommodityHistoricalSourceId, 'eia' | 'usda-fas-psd' | 'cftc-cot' | 'governed-official-supply-evidence'>;
  assetId: string;
  symbol: string;
  domain: CommodityResearchDomain;
  source: string;
  release: CommodityArchivedReleaseEvidence;
  rows: readonly ArchivedFeatureRow[];
}>): CommodityHistoricalAcquisitionResult {
  if (!validTimestamp(input.release.publishedAt) || !validTimestamp(input.release.capturedAt)) {
    return result({ providerId: input.providerId, status: 'INVALID', reason: 'Archived release timestamps are invalid.' });
  }
  const vintages = input.rows.map(row => buildCommodityHistoricalVintage({
    providerId: input.providerId,
    assetId: input.assetId,
    symbol: input.symbol,
    domain: input.domain,
    featureKey: row.featureKey,
    value: row.value,
    unit: row.unit,
    source: input.source,
    sourceVersion: input.release.sourceVersion,
    sourcePath: input.release.sourcePath,
    observedAt: row.observedAt,
    availableAt: input.release.publishedAt,
    retrievedAt: input.release.capturedAt,
    evidenceId: row.evidenceId,
    releaseId: input.release.releaseId,
    revisionId: input.release.revisionId ?? null,
    availabilityEvidenceId: input.release.availabilityEvidenceId,
    acquisitionMode: 'ARCHIVED_RELEASE_CAPTURE',
    periodLabel: row.periodLabel ?? null,
  }));
  return result({
    providerId: input.providerId,
    status: vintages.every(vintage => vintage.evidenceGrade === 'PIT_VERIFIED') ? 'READY' : 'PARTIAL',
    vintages,
    reason: vintages.some(vintage => vintage.evidenceGrade !== 'PIT_VERIFIED')
      ? 'One or more archived rows lack provider-required release/revision evidence.'
      : undefined,
  });
}

/**
 * Normalizes one versioned USGS Mineral Commodity Summaries release. Statistic year is the economic
 * observation; publication/version availability governs PIT use. A 2026 release cannot be used in a
 * 2024 decision merely because it contains a 2024 statistic.
 */
export function buildUsgsHistoricalReleaseVintages(input: Readonly<{
  assetId: string;
  symbol: string;
  domain?: Extract<CommodityResearchDomain, 'industrial-metals' | 'precious-metals'>;
  release: CommodityArchivedReleaseEvidence;
  observations: readonly UsgsMcsObservationInput[];
}>): CommodityHistoricalAcquisitionResult {
  const vintages = input.observations
    .filter(item => item.value !== null && Number.isFinite(item.value) && Number.isInteger(item.year))
    .map(item => buildCommodityHistoricalVintage({
      providerId: 'usgs-mcs',
      assetId: input.assetId,
      symbol: input.symbol,
      domain: input.domain ?? 'industrial-metals',
      featureKey: item.featureKey,
      value: item.value as number,
      unit: item.unit,
      source: `usgs-mcs:${item.commodity}:${item.statistic}`,
      sourceVersion: input.release.sourceVersion,
      sourcePath: item.sourcePath?.trim() || input.release.sourcePath,
      observedAt: `${item.year}-12-31T23:59:59.000Z`,
      availableAt: input.release.publishedAt,
      retrievedAt: input.release.capturedAt,
      evidenceId: `usgs-mcs:${input.release.releaseId}:${item.commodity}:${item.statistic}:${item.year}`,
      releaseId: input.release.releaseId,
      revisionId: input.release.revisionId ?? null,
      availabilityEvidenceId: input.release.availabilityEvidenceId,
      acquisitionMode: 'VERSIONED_ANNUAL_RELEASE',
      periodLabel: String(item.year),
    }));
  return result({
    providerId: 'usgs-mcs',
    status: vintages.length === 0 ? 'INVALID' : vintages.every(vintage => vintage.evidenceGrade === 'PIT_VERIFIED') ? 'READY' : 'PARTIAL',
    vintages,
    reason: vintages.length === 0 ? 'No valid USGS release observations were supplied.' : undefined,
  });
}

export interface EuCrmaHistoricalAssessmentInput {
  readonly economicImportance?: number | null;
  readonly supplyRisk?: number | null;
  readonly assessmentPeriodEndAt: string;
  readonly evidenceId: string;
}

/**
 * Normalizes versioned EU criticality assessment values while keeping EI and Supply Risk separate.
 * The CRMA methodology is not itself a numerical vintage; a published assessment/release artifact is required.
 */
export function buildEuCrmaHistoricalAssessmentVintages(input: Readonly<{
  assetId: string;
  symbol: string;
  release: CommodityArchivedReleaseEvidence;
  criticality: EuCrmaHistoricalAssessmentInput;
}>): CommodityHistoricalAcquisitionResult {
  if (!validTimestamp(input.criticality.assessmentPeriodEndAt) || !input.criticality.evidenceId.trim()) {
    return result({ providerId: 'eu-crma', status: 'INVALID', reason: 'CRMA assessment period and evidence id are required.' });
  }
  const vintages: CommodityHistoricalVintageArtifact[] = [];
  const values: Array<[string, number | null | undefined]> = [
    ['criticality.economicImportance', input.criticality.economicImportance],
    ['criticality.supplyRisk', input.criticality.supplyRisk],
  ];
  for (const [featureKey, value] of values) {
    if (value === null || value === undefined || !Number.isFinite(value)) continue;
    vintages.push(buildCommodityHistoricalVintage({
      providerId: 'eu-crma',
      assetId: input.assetId,
      symbol: input.symbol,
      domain: 'industrial-metals',
      featureKey,
      value,
      unit: 'index',
      source: 'eu-crma:criticality-assessment',
      sourceVersion: input.release.sourceVersion,
      sourcePath: input.release.sourcePath,
      observedAt: input.criticality.assessmentPeriodEndAt,
      availableAt: input.release.publishedAt,
      retrievedAt: input.release.capturedAt,
      evidenceId: `${input.criticality.evidenceId}:${featureKey}`,
      releaseId: input.release.releaseId,
      revisionId: input.release.revisionId ?? null,
      availabilityEvidenceId: input.release.availabilityEvidenceId,
      acquisitionMode: 'REGULATORY_ASSESSMENT_RELEASE',
      periodLabel: dateOnly(input.criticality.assessmentPeriodEndAt),
    }));
  }
  return result({
    providerId: 'eu-crma',
    status: vintages.length === 0 ? 'INVALID' : vintages.every(vintage => vintage.evidenceGrade === 'PIT_VERIFIED') ? 'READY' : 'PARTIAL',
    vintages,
    missingFeatureKeys: values.filter(([, value]) => value === null || value === undefined || !Number.isFinite(value)).map(([featureKey]) => featureKey),
    reason: vintages.length === 0 ? 'No numerical CRMA assessment values were supplied.' : undefined,
  });
}

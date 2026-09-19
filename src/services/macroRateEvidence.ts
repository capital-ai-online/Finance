import { recordProviderHealth } from '../platform/Supervisor/providerHealth';
import { recordMarketDataProviderOutcome } from './marketDataProviderRouter';

export type MacroEvidenceProvider = 'FRED' | 'ECB';

export interface MacroEvidencePoint {
  date: string;
  value: number;
}

export interface MacroEvidenceSeries {
  provider: MacroEvidenceProvider;
  seriesId: string;
  title: string;
  unit: string;
  purpose: 'macro-evidence' | 'rate-evidence' | 'reference-fx';
  executionPriceEligible: false;
  points: MacroEvidencePoint[];
  retrievedAt: string;
  sourcePath: string;
  evidenceIds: string[];
}

export interface MacroEvidenceOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  nowMs?: () => number;
  fredApiKey?: string;
}

export const APPROVED_FRED_SERIES = {
  DGS2: { title: 'Market Yield on U.S. Treasury Securities at 2-Year Constant Maturity', unit: 'Percent', purpose: 'rate-evidence' },
  DGS10: { title: 'Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity', unit: 'Percent', purpose: 'rate-evidence' },
  FEDFUNDS: { title: 'Federal Funds Effective Rate', unit: 'Percent', purpose: 'rate-evidence' },
  CPIAUCSL: { title: 'Consumer Price Index for All Urban Consumers', unit: 'Index', purpose: 'macro-evidence' },
} as const;

export type ApprovedFredSeriesId = keyof typeof APPROVED_FRED_SERIES;

const ECB_REFERENCE_CURRENCIES = new Set(['USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK', 'DKK']);

function parsePositiveOrZero(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function evidenceId(provider: MacroEvidenceProvider, seriesId: string, date: string): string {
  return `macro:${provider.toLowerCase()}:${seriesId}:${date}`;
}

async function fetchWithTimeout(fetchImpl: typeof fetch, url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchFredSeries(
  seriesId: ApprovedFredSeriesId,
  options: MacroEvidenceOptions = {},
): Promise<MacroEvidenceSeries> {
  const apiKey = options.fredApiKey ?? process.env.FRED_API_KEY;
  if (!apiKey) throw new Error('FRED_API_KEY is not configured.');
  const meta = APPROVED_FRED_SERIES[seriesId];
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 5_000;
  const startedAt = Date.now();
  const sourcePath = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&file_type=json`;
  const url = `${sourcePath}&sort_order=desc&limit=120&api_key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetchWithTimeout(fetchImpl, url, { headers: { Accept: 'application/json', 'User-Agent': 'CAPITAL-AI/0.6.3' } }, timeoutMs);
    const data: any = await response.json();
    if (!Array.isArray(data?.observations)) throw new Error('FRED returned no observations array.');
    const points = data.observations
      .map((row: any) => ({ date: String(row?.date ?? ''), value: parsePositiveOrZero(row?.value) }))
      .filter((row: { date: string; value: number | null }) => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && row.value !== null)
      .map((row: { date: string; value: number | null }) => ({ date: row.date, value: row.value as number }))
      .sort((a: MacroEvidencePoint, b: MacroEvidencePoint) => a.date.localeCompare(b.date));
    if (points.length === 0) throw new Error(`FRED ${seriesId} returned no numeric observations.`);

    const retrievedAt = new Date(options.nowMs?.() ?? Date.now()).toISOString();
    recordProviderHealth({ provider: 'FRED', capability: 'macro-series', state: 'healthy', cacheMode: 'live', message: `${seriesId}: ${points.length} observations.` });
    recordMarketDataProviderOutcome({ provider: 'FRED', success: true, latencyMs: Date.now() - startedAt });
    return {
      provider: 'FRED', seriesId, title: meta.title, unit: meta.unit,
      purpose: meta.purpose, executionPriceEligible: false, points, retrievedAt, sourcePath,
      evidenceIds: points.map((point: MacroEvidencePoint) => evidenceId('FRED', seriesId, point.date)),
    };
  } catch (error) {
    recordProviderHealth({ provider: 'FRED', capability: 'macro-series', state: 'unavailable', message: error instanceof Error ? error.message : String(error) });
    recordMarketDataProviderOutcome({ provider: 'FRED', success: false });
    throw error;
  }
}

export async function fetchEcbEurReferenceFx(
  quoteCurrency: string,
  options: MacroEvidenceOptions = {},
): Promise<MacroEvidenceSeries> {
  const currency = quoteCurrency.toUpperCase().trim();
  if (!ECB_REFERENCE_CURRENCIES.has(currency)) throw new Error(`ECB reference currency ${currency} is not approved.`);
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 5_000;
  const startedAt = Date.now();
  const seriesId = `D.${currency}.EUR.SP00.A`;
  const sourcePath = `https://data-api.ecb.europa.eu/service/data/EXR/${seriesId}`;
  const url = `${sourcePath}?format=csvdata&lastNObservations=120`;

  try {
    const response = await fetchWithTimeout(fetchImpl, url, { headers: { Accept: 'text/csv', 'User-Agent': 'CAPITAL-AI/0.6.3' } }, timeoutMs);
    const csv = await response.text();
    const lines = csv.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error('ECB returned no CSV observations.');
    const headers = lines[0].split(',');
    const dateIndex = headers.indexOf('TIME_PERIOD');
    const valueIndex = headers.indexOf('OBS_VALUE');
    if (dateIndex < 0 || valueIndex < 0) throw new Error('ECB CSV is missing TIME_PERIOD/OBS_VALUE columns.');
    const points = lines.slice(1).map(line => {
      const cols = line.split(',');
      return { date: cols[dateIndex], value: parsePositiveOrZero(cols[valueIndex]) };
    }).filter((row): row is { date: string; value: number } => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && row.value !== null)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (points.length === 0) throw new Error(`ECB ${seriesId} returned no numeric observations.`);

    const retrievedAt = new Date(options.nowMs?.() ?? Date.now()).toISOString();
    recordProviderHealth({ provider: 'ECB', capability: 'macro-series', state: 'healthy', cacheMode: 'live', message: `${seriesId}: ${points.length} reference observations.` });
    recordMarketDataProviderOutcome({ provider: 'ECB', success: true, latencyMs: Date.now() - startedAt });
    return {
      provider: 'ECB', seriesId, title: `${currency} per EUR reference exchange rate`, unit: `${currency}/EUR`,
      purpose: 'reference-fx', executionPriceEligible: false, points, retrievedAt, sourcePath,
      evidenceIds: points.map(point => evidenceId('ECB', seriesId, point.date)),
    };
  } catch (error) {
    recordProviderHealth({ provider: 'ECB', capability: 'macro-series', state: 'unavailable', message: error instanceof Error ? error.message : String(error) });
    recordMarketDataProviderOutcome({ provider: 'ECB', success: false });
    throw error;
  }
}

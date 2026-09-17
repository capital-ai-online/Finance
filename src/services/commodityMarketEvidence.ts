import { getAssetCatalogEntry } from '../lib/assetSearchCatalog';
import { recordMarketDataProviderOutcome } from './marketDataProviderRouter';
import { recordProviderHealth } from '../platform/Supervisor/providerHealth';

export const COMMODITY_MARKET_EVIDENCE_VERSION = 'commodity-market-evidence/1.0.0' as const;

export interface CommodityEvidencePoint {
  date: string;
  close: number;
}

export interface CommodityMarketEvidence {
  version: typeof COMMODITY_MARKET_EVIDENCE_VERSION;
  symbol: string;
  provider: 'TwelveData';
  providerSymbol: string;
  providerName: string;
  points: CommodityEvidencePoint[];
  observedAt: string;
  retrievedAt: string;
  sourcePath: string;
  evidenceIds: string[];
}

interface TwelveCommodityReference {
  symbol: string;
  name: string;
  category?: string;
  description?: string;
}

export interface CommodityEvidenceOptions {
  fetchImpl?: typeof fetch;
  apiKey?: string;
  timeoutMs?: number;
  nowMs?: () => number;
}

const CATALOG_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let catalogCache: { fetchedAt: number; items: TwelveCommodityReference[] } | null = null;

// Explicit mappings are limited to symbols that are documented by Twelve Data or are already
// canonical spot symbols. All other catalog entries must pass provider-catalog discovery.
const APPROVED_STATIC_COMMODITY_SYMBOLS: Record<string, string> = {
  GLD: 'XAU/USD',
  SLV: 'XAG/USD',
  CORN: 'C_1',
  CMD_CORN_CBOT: 'C_1',
  CMD_COCOA_NY: 'CC1',
};

const VENUE_TOKENS = new Set([
  'comex', 'nymex', 'lme', 'ice', 'cme', 'cbot', 'sgx', 'shfe', 'dme', 'mgex', 'euronext',
  'safex', 'ose', 'awex', 'bursa', 'malaysia', 'platts', 'argus',
]);
const NOISE_TOKENS = new Set(['u', 's', 'us', 'global', 'benchmark', 'price', 'index']);

function cleanTokens(value: string): string[] {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter(token => !VENUE_TOKENS.has(token) && !NOISE_TOKENS.has(token));
}

function similarity(targetName: string, providerName: string): number {
  const target = new Set(cleanTokens(targetName));
  const provider = new Set(cleanTokens(providerName));
  if (target.size === 0 || provider.size === 0) return 0;
  let intersection = 0;
  for (const token of target) if (provider.has(token)) intersection += 1;
  return intersection / Math.max(target.size, provider.size);
}

async function fetchJsonWithTimeout(
  url: string,
  options: CommodityEvidenceOptions,
): Promise<any> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5_000);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', Authorization: `apikey ${options.apiKey ?? process.env.TWELVEDATA_API_KEY ?? ''}` },
    });
    if (!response.ok) throw new Error(`TwelveData HTTP ${response.status}`);
    const data: any = await response.json();
    if (data?.status === 'error') throw new Error(data?.message || 'TwelveData provider error');
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function getCommodityReferenceCatalog(options: CommodityEvidenceOptions): Promise<TwelveCommodityReference[]> {
  const apiKey = options.apiKey ?? process.env.TWELVEDATA_API_KEY;
  if (!apiKey) throw new Error('TWELVEDATA_API_KEY is not configured.');
  const now = options.nowMs?.() ?? Date.now();
  if (catalogCache && now - catalogCache.fetchedAt < CATALOG_CACHE_TTL_MS) return catalogCache.items;
  const data = await fetchJsonWithTimeout('https://api.twelvedata.com/commodities?outputsize=5000', { ...options, apiKey });
  if (!Array.isArray(data?.data)) throw new Error('TwelveData commodities catalog returned no data array.');
  const items = data.data
    .map((item: any) => ({
      symbol: typeof item?.symbol === 'string' ? item.symbol.trim() : '',
      name: typeof item?.name === 'string' ? item.name.trim() : '',
      category: typeof item?.category === 'string' ? item.category : undefined,
      description: typeof item?.description === 'string' ? item.description : undefined,
    }))
    .filter((item: TwelveCommodityReference) => item.symbol && item.name);
  catalogCache = { fetchedAt: now, items };
  return items;
}

export async function resolveTwelveDataCommodityReference(
  catalogSymbolInput: string,
  options: CommodityEvidenceOptions = {},
): Promise<TwelveCommodityReference | null> {
  const catalogSymbol = catalogSymbolInput.toUpperCase().trim();
  const catalogEntry = getAssetCatalogEntry(catalogSymbol);
  if (!catalogEntry || catalogEntry.type !== 'commodity') return null;
  const references = await getCommodityReferenceCatalog(options);

  const pinnedSymbol = APPROVED_STATIC_COMMODITY_SYMBOLS[catalogSymbol];
  if (pinnedSymbol) {
    const pinned = references.find(item => item.symbol.toUpperCase() === pinnedSymbol.toUpperCase());
    if (pinned) return pinned;
  }

  const ranked = references
    .map(item => ({ item, score: similarity(catalogEntry.name, item.name) }))
    .filter(result => result.score >= 0.66)
    .sort((a, b) => b.score - a.score || a.item.symbol.localeCompare(b.item.symbol));
  if (ranked.length === 0) return null;

  const bestScore = ranked[0].score;
  const best = ranked.filter(item => Math.abs(item.score - bestScore) < 1e-9);
  if (best.length === 1) return best[0].item;

  // Multiple spot quotes often differ only by quote currency. For ambiguous commodity names we
  // accept USD as the canonical research quote; otherwise ambiguity remains fail-closed.
  const usd = best.filter(result => result.item.symbol.toUpperCase().endsWith('/USD'));
  return usd.length === 1 ? usd[0].item : null;
}

export async function getTwelveDataCommodityEvidence(
  catalogSymbolInput: string,
  days = 90,
  options: CommodityEvidenceOptions = {},
): Promise<CommodityMarketEvidence> {
  const apiKey = options.apiKey ?? process.env.TWELVEDATA_API_KEY;
  if (!apiKey) throw new Error('TWELVEDATA_API_KEY is not configured.');
  const symbol = catalogSymbolInput.toUpperCase().trim();
  const reference = await resolveTwelveDataCommodityReference(symbol, { ...options, apiKey });
  if (!reference) throw new Error(`No unambiguous approved TwelveData commodity mapping is available for ${symbol}.`);

  const boundedDays = Math.min(Math.max(days, 20), 365);
  const sourcePath = 'https://api.twelvedata.com/time_series';
  const url = `${sourcePath}?symbol=${encodeURIComponent(reference.symbol)}&interval=1day&outputsize=${boundedDays}`;
  const started = Date.now();
  try {
    const data = await fetchJsonWithTimeout(url, { ...options, apiKey });
    const returnedSymbol = typeof data?.meta?.symbol === 'string' ? data.meta.symbol.trim().toUpperCase() : '';
    if (returnedSymbol && returnedSymbol !== reference.symbol.toUpperCase()) {
      throw new Error(`TwelveData identity mismatch: expected ${reference.symbol}, received ${returnedSymbol}.`);
    }
    if (typeof data?.meta?.type === 'string' && !data.meta.type.toLowerCase().includes('commodity')) {
      throw new Error(`TwelveData returned non-commodity instrument type ${data.meta.type}.`);
    }
    if (!Array.isArray(data?.values)) throw new Error('TwelveData returned no commodity time-series values.');
    const points = data.values
      .map((row: any) => ({
        date: typeof row?.datetime === 'string' ? row.datetime.slice(0, 10) : '',
        close: Number(row?.close),
      }))
      .filter((point: CommodityEvidencePoint) => /^\d{4}-\d{2}-\d{2}$/.test(point.date) && Number.isFinite(point.close) && point.close > 0)
      .sort((a: CommodityEvidencePoint, b: CommodityEvidencePoint) => a.date.localeCompare(b.date))
      .slice(-boundedDays);
    if (points.length < 20) throw new Error(`TwelveData returned only ${points.length} valid commodity observations.`);
    const retrievedAt = new Date(options.nowMs?.() ?? Date.now()).toISOString();
    const last = points[points.length - 1];
    const observedAt = `${last.date}T23:59:59.000Z`;
    recordMarketDataProviderOutcome({ provider: 'TwelveData', success: true, latencyMs: Date.now() - started });
    recordProviderHealth({ provider: 'TwelveData', capability: 'commodity-history', state: 'healthy', cacheMode: 'live', message: `${reference.symbol}: ${points.length} commodity observations.` });
    return {
      version: COMMODITY_MARKET_EVIDENCE_VERSION,
      symbol,
      provider: 'TwelveData',
      providerSymbol: reference.symbol,
      providerName: reference.name,
      points,
      observedAt,
      retrievedAt,
      sourcePath,
      evidenceIds: points.map(point => `commodity:twelvedata:${reference.symbol}:${point.date}`),
    };
  } catch (error) {
    recordMarketDataProviderOutcome({ provider: 'TwelveData', success: false });
    recordProviderHealth({ provider: 'TwelveData', capability: 'commodity-history', state: 'unavailable', message: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export function resetCommodityReferenceCache(): void {
  catalogCache = null;
}

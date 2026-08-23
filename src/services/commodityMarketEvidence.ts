import { getAssetCatalogEntry } from '../lib/assetSearchCatalog';
import { HistoryProviderRegistry } from '../platform/MarketData/HistoryProviderRegistry';
import { MarketDataHistoryGateway } from '../platform/MarketData/MarketDataHistoryGateway';
import { ResearchEvidenceProviderHttp } from '../platform/MarketData/providers/ResearchEvidenceProviderHttp';
import { TwelveDataCommodityHistoryProvider } from '../platform/MarketData/providers/TwelveDataCommodityHistoryProvider';

export const COMMODITY_MARKET_EVIDENCE_VERSION = 'commodity-market-evidence/1.0.0' as const;

export interface CommodityEvidencePoint {
  date: string;
  close: number;
}

export interface CommodityMarketEvidence {
  version: typeof COMMODITY_MARKET_EVIDENCE_VERSION;
  symbol: string;
  /** Provider display name; intentionally provider-neutral at the contract level. */
  provider: string;
  providerId: string;
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
let productionTransport: ResearchEvidenceProviderHttp | null = null;

// Explicit mappings are identity mappings only. They are not evidence and never provide a price.
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

function commodityTransport(options: CommodityEvidenceOptions): ResearchEvidenceProviderHttp {
  const injected = Boolean(options.fetchImpl || options.apiKey !== undefined || options.timeoutMs !== undefined || options.nowMs);
  if (!injected && productionTransport) return productionTransport;
  const transport = new ResearchEvidenceProviderHttp('twelvedata', 'commodity-history', {
    baseUrl: 'https://api.twelvedata.com',
    apiKey: options.apiKey ?? process.env.TWELVEDATA_API_KEY,
    apiKeyRequired: true,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    nowMs: options.nowMs,
    authHeaders: key => ({ Authorization: `apikey ${key}` }),
  });
  if (!injected) productionTransport = transport;
  return transport;
}

async function getCommodityReferenceCatalog(
  options: CommodityEvidenceOptions,
  transport = commodityTransport(options),
): Promise<TwelveCommodityReference[]> {
  const now = options.nowMs?.() ?? Date.now();
  if (catalogCache && now - catalogCache.fetchedAt < CATALOG_CACHE_TTL_MS) return catalogCache.items;
  const response = await transport.requestJson('/commodities?outputsize=5000');
  if (response.status !== 'READY') throw new Error(response.reason ?? `TwelveData catalog status ${response.status}.`);
  const data: any = response.data;
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
  transport = commodityTransport(options),
): Promise<TwelveCommodityReference | null> {
  const catalogSymbol = catalogSymbolInput.toUpperCase().trim();
  const catalogEntry = getAssetCatalogEntry(catalogSymbol);
  if (!catalogEntry || catalogEntry.type !== 'commodity') return null;
  const references = await getCommodityReferenceCatalog(options, transport);

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

  // Multiple spot quotes can differ only by quote currency. USD is permitted only when unique;
  // otherwise identity mapping remains fail-closed.
  const usd = best.filter(result => result.item.symbol.toUpperCase().endsWith('/USD'));
  return usd.length === 1 ? usd[0].item : null;
}

export async function getTwelveDataCommodityEvidence(
  catalogSymbolInput: string,
  days = 90,
  options: CommodityEvidenceOptions = {},
): Promise<CommodityMarketEvidence> {
  const symbol = catalogSymbolInput.toUpperCase().trim();
  const transport = commodityTransport(options);
  const reference = await resolveTwelveDataCommodityReference(symbol, options, transport);
  if (!reference) throw new Error(`No unambiguous approved TwelveData commodity mapping is available for ${symbol}.`);

  const boundedDays = Math.min(Math.max(days, 20), 365);
  const registry = new HistoryProviderRegistry();
  registry.register(new TwelveDataCommodityHistoryProvider({
    providerSymbols: { [symbol]: reference.symbol },
    transport,
  }));
  const gateway = new MarketDataHistoryGateway(registry, options.nowMs ?? Date.now);
  const response = await gateway.getHistory({
    symbol,
    assetClass: 'commodity',
    correlationId: `commodity-history:${symbol}:${options.nowMs?.() ?? Date.now()}`,
    maxPoints: boundedDays,
    barInterval: '1d',
    allowedProviderIds: ['twelvedata'],
  });
  const history = response.history;
  if (history.qualityState !== 'HISTORICAL' || history.points.length < 20) {
    throw new Error(history.reason ?? `No governed commodity history is available for ${symbol}.`);
  }

  const points: CommodityEvidencePoint[] = history.points.map(point => ({
    date: point.timestamp.slice(0, 10),
    close: point.close,
  }));
  const last = points.at(-1)!;
  const observedAt = `${last.date}T23:59:59.000Z`;
  const providerId = history.provider;
  const provider = providerId === 'twelvedata' ? 'TwelveData' : providerId;
  return {
    version: COMMODITY_MARKET_EVIDENCE_VERSION,
    symbol,
    provider,
    providerId,
    providerSymbol: reference.symbol,
    providerName: reference.name,
    points,
    observedAt,
    retrievedAt: history.receivedAt,
    sourcePath: 'https://api.twelvedata.com/time_series',
    evidenceIds: points.map(point => `commodity:${providerId}:${reference.symbol}:${point.date}`),
  };
}

export function resetCommodityReferenceCache(): void {
  catalogCache = null;
  productionTransport = null;
}

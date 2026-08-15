import { recordProviderHealth } from '../platform/Supervisor/providerHealth';
import { MarketDataGateway } from '../platform/MarketData/MarketDataGateway';
import { ProviderRegistry } from '../platform/MarketData/ProviderRegistry';
import { TwelveDataMarketDataProvider } from '../platform/MarketData/providers/TwelveDataMarketDataProvider';
import { FmpIndexMarketDataProvider } from '../platform/MarketData/providers/FmpIndexMarketDataProvider';
import { recordMarketDataProviderOutcome } from './marketDataProviderRouter';
import { ensureIndexQuoteFresh, getCachedIndexQuote, INDEX_FMP_TICKERS } from '../../server/fmpIndices';
import { observeAlpacaStockQuote } from './alpacaShadowProvider';

export const TRADITIONAL_QUOTE_CONTRACT_VERSION = 'traditional-quote/1.0.0' as const;
export type TraditionalQuoteAssetClass = 'stock' | 'forex' | 'index';
const DEFAULT_MAX_QUOTE_AGE_MS = 15 * 60 * 1000;

export interface VerifiedTraditionalQuote {
  contractVersion: typeof TRADITIONAL_QUOTE_CONTRACT_VERSION;
  status: 'READY' | 'SOURCE_UNAVAILABLE' | 'STALE_EVIDENCE' | 'UNSUPPORTED_ASSET';
  symbol: string;
  assetClass: TraditionalQuoteAssetClass;
  price: number | null;
  currency: string | null;
  provider: string | null;
  providers: string[];
  observedAt: string | null;
  retrievedAt: string;
  evidenceIds: string[];
  sourcePath: string | null;
  alertEligible: boolean;
  executionPriceEligible: boolean;
  evidenceAgeMs?: number | null;
  maxAgeMs?: number;
  reason?: string;
}

interface QuoteOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  nowMs?: () => number;
  twelveDataApiKey?: string;
  maxAgeMs?: number;
}

function nowMs(options: QuoteOptions): number {
  return options.nowMs?.() ?? Date.now();
}

function nowIso(options: QuoteOptions): string {
  return new Date(nowMs(options)).toISOString();
}

function toTwelveSymbol(symbol: string, assetClass: TraditionalQuoteAssetClass): string {
  const s = symbol.toUpperCase().trim();
  if (assetClass === 'forex') {
    if (s.includes('/')) return s;
    if (s.length === 6) return `${s.slice(0, 3)}/${s.slice(3)}`;
  }
  return s;
}

let productionTraditionalQuoteGateway: MarketDataGateway | undefined;

function traditionalQuoteGateway(options: QuoteOptions): MarketDataGateway {
  const usesInjectedRuntime = Boolean(
    options.fetchImpl || options.nowMs || options.timeoutMs !== undefined || options.twelveDataApiKey !== undefined,
  );
  if (!usesInjectedRuntime && productionTraditionalQuoteGateway) return productionTraditionalQuoteGateway;

  const registry = new ProviderRegistry();
  registry.register(new TwelveDataMarketDataProvider({
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    nowMs: options.nowMs,
    apiKey: options.twelveDataApiKey,
  }));
  const gateway = new MarketDataGateway(registry, { nowMs: options.nowMs });
  if (!usesInjectedRuntime) productionTraditionalQuoteGateway = gateway;
  return gateway;
}

async function fetchGatewayTraditionalQuote(
  symbol: string,
  assetClass: 'stock' | 'forex',
  options: QuoteOptions,
): Promise<VerifiedTraditionalQuote> {
  const startedAt = Date.now();
  const result = await traditionalQuoteGateway(options).getSnapshot({
    symbol,
    assetClass,
    correlationId: `traditional-quote:${assetClass}:${symbol}:${nowMs(options)}`,
    maxAgeMs: options.maxAgeMs ?? DEFAULT_MAX_QUOTE_AGE_MS,
    allowStale: true,
  });
  const snapshot = result.snapshot;
  const stale = snapshot.qualityState === 'STALE';
  const ready = ['LIVE', 'DELAYED', 'HISTORICAL'].includes(snapshot.qualityState);
  const success = ready || stale;
  recordMarketDataProviderOutcome({ provider: 'TwelveData', success, latencyMs: Date.now() - startedAt });
  recordProviderHealth({
    provider: 'TwelveData',
    capability: 'traditional-quote',
    state: ready ? 'healthy' : stale ? 'degraded' : 'unavailable',
    cacheMode: result.source,
    message: snapshot.reason ?? (ready
      ? `Verified ${assetClass} quote received for ${symbol} through MarketDataGateway.`
      : stale
        ? `Stale ${assetClass} quote received for ${symbol} through MarketDataGateway.`
        : `No verified ${assetClass} quote available for ${symbol} through MarketDataGateway.`),
  });

  return {
    contractVersion: TRADITIONAL_QUOTE_CONTRACT_VERSION,
    status: ready ? 'READY' : stale ? 'STALE_EVIDENCE' : 'SOURCE_UNAVAILABLE',
    symbol,
    assetClass,
    price: ready ? snapshot.price : null,
    currency: snapshot.currency,
    provider: 'TwelveData',
    providers: success ? ['TwelveData'] : [],
    observedAt: snapshot.sourceTimestamp,
    retrievedAt: snapshot.receivedAt,
    evidenceIds: snapshot.evidenceId ? [snapshot.evidenceId] : [],
    sourcePath: 'https://api.twelvedata.com/quote',
    alertEligible: ready,
    executionPriceEligible: false,
    evidenceAgeMs: snapshot.freshnessMs,
    maxAgeMs: options.maxAgeMs ?? DEFAULT_MAX_QUOTE_AGE_MS,
    reason: snapshot.reason,
  };
}

let productionFmpIndexGateway: MarketDataGateway | undefined;

function fmpIndexGateway(options: QuoteOptions): MarketDataGateway {
  const usesInjectedClock = Boolean(options.nowMs);
  if (!usesInjectedClock && productionFmpIndexGateway) return productionFmpIndexGateway;
  const registry = new ProviderRegistry();
  registry.register(new FmpIndexMarketDataProvider(async symbol => {
    await ensureIndexQuoteFresh(symbol);
    return getCachedIndexQuote(symbol) ?? null;
  }, options.nowMs));
  const gateway = new MarketDataGateway(registry, { nowMs: options.nowMs });
  if (!usesInjectedClock) productionFmpIndexGateway = gateway;
  return gateway;
}

async function fetchFmpIndexQuote(symbol: string, options: QuoteOptions): Promise<VerifiedTraditionalQuote> {
  const retrievedAt = nowIso(options);
  if (!INDEX_FMP_TICKERS[symbol]) {
    return {
      contractVersion: TRADITIONAL_QUOTE_CONTRACT_VERSION,
      status: 'UNSUPPORTED_ASSET', symbol, assetClass: 'index', price: null, currency: null,
      provider: null, providers: [], observedAt: null, retrievedAt, evidenceIds: [], sourcePath: null,
      alertEligible: false, executionPriceEligible: false,
      reason: 'No approved FMP index mapping exists for this symbol.',
    };
  }

  const startedAt = Date.now();
  const result = await fmpIndexGateway(options).getSnapshot({
    symbol,
    assetClass: 'index',
    correlationId: `traditional-quote:index:${symbol}:${nowMs(options)}`,
    maxAgeMs: options.maxAgeMs ?? DEFAULT_MAX_QUOTE_AGE_MS,
    allowStale: true,
    allowedProviderIds: ['fmp-index'],
  });
  const snapshot = result.snapshot;
  const stale = snapshot.qualityState === 'STALE';
  const ready = ['LIVE', 'DELAYED', 'HISTORICAL'].includes(snapshot.qualityState);
  const success = ready || stale;
  recordMarketDataProviderOutcome({ provider: 'FMP', success, latencyMs: Date.now() - startedAt });
  recordProviderHealth({
    provider: 'FMP',
    capability: 'index-quote',
    state: ready ? 'healthy' : stale ? 'degraded' : 'unavailable',
    cacheMode: result.source,
    message: snapshot.reason ?? (ready
      ? `Verified index quote received for ${symbol} through MarketDataGateway.`
      : stale
        ? `Stale index quote received for ${symbol} through MarketDataGateway.`
        : `No verified index quote available for ${symbol} through MarketDataGateway.`),
  });

  return {
    contractVersion: TRADITIONAL_QUOTE_CONTRACT_VERSION,
    status: ready ? 'READY' : stale ? 'STALE_EVIDENCE' : 'SOURCE_UNAVAILABLE',
    symbol,
    assetClass: 'index',
    price: ready ? snapshot.price : null,
    currency: snapshot.currency,
    provider: 'FMP',
    providers: success ? ['FMP'] : [],
    observedAt: snapshot.sourceTimestamp,
    retrievedAt: snapshot.receivedAt,
    evidenceIds: snapshot.evidenceId ? [snapshot.evidenceId] : [],
    sourcePath: 'https://financialmodelingprep.com/stable/quote',
    alertEligible: ready,
    executionPriceEligible: false,
    evidenceAgeMs: snapshot.freshnessMs,
    maxAgeMs: options.maxAgeMs ?? DEFAULT_MAX_QUOTE_AGE_MS,
    reason: snapshot.reason,
  };
}

export async function fetchVerifiedTraditionalQuote(
  symbolInput: string,
  assetClass: TraditionalQuoteAssetClass,
  options: QuoteOptions = {},
): Promise<VerifiedTraditionalQuote> {
  const symbol = symbolInput.toUpperCase().trim();
  if (assetClass === 'index') return fetchFmpIndexQuote(symbol, options);
  const canonical = await fetchGatewayTraditionalQuote(symbol, assetClass, options);
  if (assetClass === 'stock') {
    // Shadow-only: Alpaca records independent freshness/deviation evidence but never
    // changes the canonical Twelve Data quote or the score in this integration phase.
    await observeAlpacaStockQuote(symbol, { price: canonical.price, provider: canonical.provider }, {
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: options.nowMs,
    });
  }
  return canonical;
}

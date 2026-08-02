import { recordProviderHealth } from '../platform/Supervisor/providerHealth';
import { recordMarketDataProviderOutcome } from './marketDataProviderRouter';
import { ensureIndexQuoteFresh, getCachedIndexQuote, INDEX_FMP_TICKERS } from '../../server/fmpIndices';

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

function freshness(observedAt: string, options: QuoteOptions): { ageMs: number; maxAgeMs: number; stale: boolean } {
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_QUOTE_AGE_MS;
  const ageMs = Math.max(0, nowMs(options) - Date.parse(observedAt));
  return { ageMs, maxAgeMs, stale: ageMs > maxAgeMs };
}

async function fetchTwelveDataQuote(symbol: string, assetClass: 'stock' | 'forex', options: QuoteOptions): Promise<VerifiedTraditionalQuote> {
  const apiKey = options.twelveDataApiKey ?? process.env.TWELVEDATA_API_KEY;
  const retrievedAt = nowIso(options);
  if (!apiKey) {
    return {
      contractVersion: TRADITIONAL_QUOTE_CONTRACT_VERSION,
      status: 'SOURCE_UNAVAILABLE', symbol, assetClass, price: null, currency: null,
      provider: 'TwelveData', providers: [], observedAt: null, retrievedAt, evidenceIds: [],
      sourcePath: null, alertEligible: false, executionPriceEligible: false,
      reason: 'TWELVEDATA_API_KEY is not configured.',
    };
  }

  const providerSymbol = toTwelveSymbol(symbol, assetClass);
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 4_000);
  try {
    const response = await (options.fetchImpl ?? fetch)(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(providerSymbol)}`,
      { headers: { Accept: 'application/json', Authorization: `apikey ${apiKey}`, 'User-Agent': 'CAPITAL-AI/0.6.3' }, signal: controller.signal },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: any = await response.json();
    if (data?.status === 'error') throw new Error(data?.message || 'Twelve Data provider error');
    const price = Number(data?.close ?? data?.price);
    if (!Number.isFinite(price) || price <= 0) throw new Error('Twelve Data returned no valid quote price.');

    const observedAt = typeof data?.datetime === 'string' && Number.isFinite(Date.parse(data.datetime))
      ? new Date(data.datetime).toISOString()
      : retrievedAt;
    const currency = typeof data?.currency === 'string' ? data.currency : assetClass === 'forex' ? providerSymbol.slice(-3) : null;
    const evidenceId = `quote:twelvedata:${providerSymbol}:${observedAt}`;
    const freshnessState = freshness(observedAt, options);
    recordMarketDataProviderOutcome({ provider: 'TwelveData', success: true, latencyMs: Date.now() - startedAt });
    recordProviderHealth({
      provider: 'TwelveData', capability: 'traditional-quote',
      state: freshnessState.stale ? 'degraded' : 'healthy',
      message: freshnessState.stale ? `Stale ${assetClass} quote received for ${symbol}.` : `Verified ${assetClass} quote received for ${symbol}.`,
    });

    return {
      contractVersion: TRADITIONAL_QUOTE_CONTRACT_VERSION,
      status: freshnessState.stale ? 'STALE_EVIDENCE' : 'READY',
      symbol, assetClass, price: freshnessState.stale ? null : price, currency,
      provider: 'TwelveData', providers: ['TwelveData'], observedAt, retrievedAt,
      evidenceIds: [evidenceId], sourcePath: 'https://api.twelvedata.com/quote',
      alertEligible: !freshnessState.stale, executionPriceEligible: false,
      evidenceAgeMs: freshnessState.ageMs, maxAgeMs: freshnessState.maxAgeMs,
      reason: freshnessState.stale ? `Quote evidence is older than ${freshnessState.maxAgeMs} ms.` : undefined,
    };
  } catch (error) {
    recordMarketDataProviderOutcome({ provider: 'TwelveData', success: false });
    recordProviderHealth({ provider: 'TwelveData', capability: 'traditional-quote', state: 'unavailable', message: error instanceof Error ? error.message : String(error) });
    return {
      contractVersion: TRADITIONAL_QUOTE_CONTRACT_VERSION,
      status: 'SOURCE_UNAVAILABLE', symbol, assetClass, price: null, currency: null,
      provider: 'TwelveData', providers: [], observedAt: null, retrievedAt, evidenceIds: [],
      sourcePath: 'https://api.twelvedata.com/quote', alertEligible: false, executionPriceEligible: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
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
  await ensureIndexQuoteFresh(symbol);
  const quote = getCachedIndexQuote(symbol);
  if (!quote) {
    recordMarketDataProviderOutcome({ provider: 'FMP', success: false });
    return {
      contractVersion: TRADITIONAL_QUOTE_CONTRACT_VERSION,
      status: 'SOURCE_UNAVAILABLE', symbol, assetClass: 'index', price: null, currency: null,
      provider: 'FMP', providers: [], observedAt: null, retrievedAt, evidenceIds: [],
      sourcePath: 'https://financialmodelingprep.com/stable/quote', alertEligible: false, executionPriceEligible: false,
      reason: 'No fresh FMP index quote is available.',
    };
  }

  const observedAt = new Date(quote.fetchedAt).toISOString();
  const freshnessState = freshness(observedAt, options);
  recordMarketDataProviderOutcome({ provider: 'FMP', success: true, latencyMs: Date.now() - startedAt });
  return {
    contractVersion: TRADITIONAL_QUOTE_CONTRACT_VERSION,
    status: freshnessState.stale ? 'STALE_EVIDENCE' : 'READY',
    symbol, assetClass: 'index', price: freshnessState.stale ? null : quote.price, currency: null,
    provider: 'FMP', providers: ['FMP'], observedAt, retrievedAt,
    evidenceIds: [`quote:fmp:${symbol}:${observedAt}`], sourcePath: 'https://financialmodelingprep.com/stable/quote',
    alertEligible: !freshnessState.stale, executionPriceEligible: false,
    evidenceAgeMs: freshnessState.ageMs, maxAgeMs: freshnessState.maxAgeMs,
    reason: freshnessState.stale ? `Quote evidence is older than ${freshnessState.maxAgeMs} ms.` : undefined,
  };
}

export async function fetchVerifiedTraditionalQuote(
  symbolInput: string,
  assetClass: TraditionalQuoteAssetClass,
  options: QuoteOptions = {},
): Promise<VerifiedTraditionalQuote> {
  const symbol = symbolInput.toUpperCase().trim();
  if (assetClass === 'index') return fetchFmpIndexQuote(symbol, options);
  return fetchTwelveDataQuote(symbol, assetClass, options);
}

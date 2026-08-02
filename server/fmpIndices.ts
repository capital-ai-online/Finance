// Real index quotes/history via Financial Modeling Prep (FMP).

import { getCleanEnv } from './env';
import { recordProviderHealth } from '../src/platform/Supervisor/providerHealth';

const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';

export const INDEX_FMP_TICKERS: Record<string, string> = {
  GSPC: '^GSPC', IXIC: '^IXIC', DJI: '^DJI', RUT: '^RUT', FTSE: '^FTSE', GDAXI: '^GDAXI',
  FCHI: '^FCHI', N225: '^N225', HSI: '^HSI', AXJO: '^AXJO', SSMI: '^SSMI', IBEX: '^IBEX',
  FTSEMIB: 'FTSEMIB.MI', BVSP: '^BVSP', MXX: '^MXX', SSEC: '000001.SS', BSESN: '^BSESN',
  JKSE: '^JKSE', KLSE: '^KLSE', STI: '^STI', KS11: '^KS11', TWII: '^TWII', TA125: '^TA125.TA',
  NZ50: '^NZ50', AORD: '^AORD', VIX: '^VIX', SDAX: '^SDAXI', MDAX: '^MDAXI', TECDAX: '^TECDAX',
  STOXX50E: '^STOXX50E',
};

export interface IndexQuote { price: number; change24h: number; fetchedAt: number; }
export interface IndexHistoryPoint { date: string; close: number; }

const QUOTE_CACHE_TTL_MS = 5 * 60 * 1000;
const HISTORY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_CALL_GAP_MS = 5 * 1000;
const quoteCache = new Map<string, IndexQuote>();
const historyCache = new Map<string, { points: IndexHistoryPoint[]; fetchedAt: number }>();
let lastCallAt = 0;

function isQuoteFresh(entry: IndexQuote | undefined): entry is IndexQuote {
  return !!entry && Date.now() - entry.fetchedAt < QUOTE_CACHE_TTL_MS;
}
function isHistoryFresh(entry: { fetchedAt: number } | undefined): boolean {
  return !!entry && Date.now() - entry.fetchedAt < HISTORY_CACHE_TTL_MS;
}
function canCallNow(): boolean { return Date.now() - lastCallAt >= MIN_CALL_GAP_MS; }

export function getCachedIndexQuote(symbol: string): IndexQuote | undefined {
  const entry = quoteCache.get(symbol.toUpperCase().trim());
  return isQuoteFresh(entry) ? entry : undefined;
}
export function getCachedIndexHistory(symbol: string): IndexHistoryPoint[] | undefined {
  return historyCache.get(symbol.toUpperCase().trim())?.points;
}

export async function ensureIndexQuoteFresh(symbol: string): Promise<void> {
  const s = symbol.toUpperCase().trim();
  const fmpTicker = INDEX_FMP_TICKERS[s];
  if (!fmpTicker || isQuoteFresh(quoteCache.get(s))) return;
  const key = getCleanEnv('FMP_API_KEY');
  if (!key) {
    recordProviderHealth({ provider: 'FMP', capability: 'index-quote', state: 'unavailable', message: 'FMP_API_KEY not configured.' });
    return;
  }
  if (!canCallNow()) return;
  lastCallAt = Date.now();

  try {
    const url = `${FMP_BASE_URL}/quote?symbol=${encodeURIComponent(fmpTicker)}&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      recordProviderHealth({ provider: 'FMP', capability: 'index-quote', state: 'degraded', message: `HTTP ${res.status} for ${s}.` });
      return;
    }
    const data: any = await res.json();
    const entry = Array.isArray(data) ? data[0] : undefined;
    if (!entry || typeof entry.price !== 'number') {
      recordProviderHealth({ provider: 'FMP', capability: 'index-quote', state: 'degraded', message: `No usable quote payload for ${s}.` });
      return;
    }
    quoteCache.set(s, {
      price: entry.price,
      change24h: typeof entry.changePercentage === 'number' ? entry.changePercentage : 0,
      fetchedAt: Date.now(),
    });
    recordProviderHealth({ provider: 'FMP', capability: 'index-quote', state: 'healthy', cacheMode: 'fresh', message: `Quote received for ${s}.` });
  } catch (err: any) {
    recordProviderHealth({ provider: 'FMP', capability: 'index-quote', state: 'unavailable', message: err?.message || String(err) });
    console.warn(`[FMPIndices] Quote-Abruf fuer ${s} (${fmpTicker}) fehlgeschlagen:`, err?.message || err);
  }
}

export async function ensureIndexHistoryFresh(symbol: string): Promise<void> {
  const s = symbol.toUpperCase().trim();
  const fmpTicker = INDEX_FMP_TICKERS[s];
  if (!fmpTicker || isHistoryFresh(historyCache.get(s))) return;
  const key = getCleanEnv('FMP_API_KEY');
  if (!key) {
    recordProviderHealth({ provider: 'FMP', capability: 'index-history', state: 'unavailable', message: 'FMP_API_KEY not configured.' });
    return;
  }
  if (!canCallNow()) return;
  lastCallAt = Date.now();

  try {
    const to = new Date();
    const from = new Date(to.getTime() - 45 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const url = `${FMP_BASE_URL}/historical-price-eod/light?symbol=${encodeURIComponent(fmpTicker)}&from=${fmt(from)}&to=${fmt(to)}&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      recordProviderHealth({ provider: 'FMP', capability: 'index-history', state: 'degraded', message: `HTTP ${res.status} for ${s}.` });
      return;
    }
    const data: any = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      recordProviderHealth({ provider: 'FMP', capability: 'index-history', state: 'degraded', message: `No usable history payload for ${s}.` });
      return;
    }
    const points: IndexHistoryPoint[] = data
      .filter((d: any) => typeof d.price === 'number' && typeof d.date === 'string')
      .map((d: any) => ({ date: d.date, close: d.price }))
      .sort((a: IndexHistoryPoint, b: IndexHistoryPoint) => a.date.localeCompare(b.date));
    if (points.length === 0) {
      recordProviderHealth({ provider: 'FMP', capability: 'index-history', state: 'degraded', message: `History payload contained no valid points for ${s}.` });
      return;
    }
    historyCache.set(s, { points, fetchedAt: Date.now() });
    recordProviderHealth({ provider: 'FMP', capability: 'index-history', state: 'healthy', cacheMode: 'fresh', message: `${points.length} history points received for ${s}.` });
  } catch (err: any) {
    recordProviderHealth({ provider: 'FMP', capability: 'index-history', state: 'unavailable', message: err?.message || String(err) });
    console.warn(`[FMPIndices] Historie-Abruf fuer ${s} (${fmpTicker}) fehlgeschlagen:`, err?.message || err);
  }
}

// Real stock fundamentals via Alpha Vantage OVERVIEW.

import { getCleanEnv } from './env';
import { recordProviderHealth } from '../src/platform/Supervisor/providerHealth';
import type { FinancialFieldProvenance } from '../src/types/financialProvenance';

export interface StockFundamentals {
  peRatio?: number;
  dividendYieldPct?: number;
  profitMarginPct?: number;
  fetchedAt: number;
  provenance: FinancialFieldProvenance[];
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_CALL_GAP_MS = 20 * 1000;
const cache = new Map<string, StockFundamentals>();
let lastCallAt = 0;

function isFresh(entry: StockFundamentals | undefined): entry is StockFundamentals {
  return !!entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

export function getCachedFundamentals(symbol: string): StockFundamentals | undefined {
  const entry = cache.get(symbol.toUpperCase().trim());
  return isFresh(entry) ? entry : undefined;
}

export async function ensureFundamentalsFresh(symbol: string): Promise<void> {
  const s = symbol.toUpperCase().trim();
  if (isFresh(cache.get(s))) return;

  const key = getCleanEnv('ALPHA_VANTAGE_KEY');
  if (!key) {
    recordProviderHealth({
      provider: 'AlphaVantage', capability: 'stock-fundamentals', state: 'unavailable',
      message: 'ALPHA_VANTAGE_KEY not configured.',
    });
    return;
  }
  if (Date.now() - lastCallAt < MIN_CALL_GAP_MS) return;
  lastCallAt = Date.now();

  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${s}&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      recordProviderHealth({
        provider: 'AlphaVantage', capability: 'stock-fundamentals', state: 'degraded',
        message: `HTTP ${res.status} for ${s}.`,
      });
      return;
    }
    const data: any = await res.json();
    if (!data || data['Note'] || data['Error Message'] || Object.keys(data).length === 0) {
      recordProviderHealth({
        provider: 'AlphaVantage', capability: 'stock-fundamentals', state: 'degraded',
        message: `Provider returned no usable OVERVIEW payload for ${s}.`,
      });
      return;
    }

    const peRatio = parseFloat(data['PERatio']);
    const dividendYieldRaw = parseFloat(data['DividendYield']);
    const profitMarginRaw = parseFloat(data['ProfitMargin']);
    const fetchedAt = Date.now();
    const retrievedAt = new Date(fetchedAt).toISOString();
    const observedAt = typeof data['LatestQuarter'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data['LatestQuarter'])
      ? `${data['LatestQuarter']}T00:00:00.000Z`
      : undefined;
    const sourcePath = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(s)}`;
    const provenance: FinancialFieldProvenance[] = [];

    const normalizedPe = Number.isFinite(peRatio) && peRatio > 0 ? peRatio : undefined;
    const normalizedDividend = Number.isFinite(dividendYieldRaw) ? dividendYieldRaw * 100 : undefined;
    const normalizedMargin = Number.isFinite(profitMarginRaw) ? profitMarginRaw * 100 : undefined;

    if (normalizedPe !== undefined) provenance.push({
      field: 'peRatio', provider: 'AlphaVantage', sourcePath, retrievedAt, observedAt,
      value: normalizedPe, unit: 'ratio',
    });
    if (normalizedDividend !== undefined) provenance.push({
      field: 'dividendYieldPct', provider: 'AlphaVantage', sourcePath, retrievedAt, observedAt,
      value: normalizedDividend, unit: 'percent',
    });
    if (normalizedMargin !== undefined) provenance.push({
      field: 'profitMarginPct', provider: 'AlphaVantage', sourcePath, retrievedAt, observedAt,
      value: normalizedMargin, unit: 'percent',
    });

    cache.set(s, {
      peRatio: normalizedPe,
      dividendYieldPct: normalizedDividend,
      profitMarginPct: normalizedMargin,
      fetchedAt,
      provenance,
    });
    recordProviderHealth({
      provider: 'AlphaVantage', capability: 'stock-fundamentals', state: 'healthy', cacheMode: 'fresh',
      message: `OVERVIEW received for ${s} with ${provenance.length} attributable fields.`,
    });
  } catch (err: any) {
    recordProviderHealth({
      provider: 'AlphaVantage', capability: 'stock-fundamentals', state: 'unavailable',
      message: err?.message || String(err),
    });
    console.warn(`[StockFundamentals] Abruf fuer ${s} fehlgeschlagen:`, err?.message || err);
  }
}

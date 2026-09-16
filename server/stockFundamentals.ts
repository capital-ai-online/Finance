// Stock fundamentals compatibility facade with provider-level provenance.
//
// Legacy consumers continue to use ensureFundamentalsFresh/getCachedFundamentals while the
// canonical DATA exit is exposed through getValidatedStockFundamentalsInput. Provider-specific
// response dialects terminate here; FINTECH must consume the validated DATA projection instead.

import { getCleanEnv } from './env';
import {
  ALPHA_VANTAGE_CREDENTIAL,
  resolveAlphaVantageCredential,
} from './marketData/alphaVantageCredential';
import { providerErrorMessage } from '../src/platform/MarketData/providerCredentialRedaction';
import { recordProviderHealth } from '../src/platform/Supervisor/providerHealth';
import { createUniversalAssetIdentity } from '../src/platform/Scoring/UniversalAssetAdapter';
import {
  buildValidatedDataInputFromFundamentals,
  type FundamentalsObservationCandidate,
  type ValidatedDataInput,
} from '../src/platform/MarketData/ValidatedDataInput';
import {
  buildFinancialEvidenceId,
  type FinancialFieldProvenance,
} from '../src/types/financialProvenance';

export interface StockFundamentals {
  peRatio?: number;
  dividendYieldPct?: number;
  profitMarginPct?: number;
  debtToEquity?: number;
  epsTtm?: number;
  freeCashFlowPerShare?: number;
  fetchedAt: number;
  provenance: FinancialFieldProvenance[];
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const ALPHA_MIN_CALL_GAP_MS = 20 * 1000;
const cache = new Map<string, StockFundamentals>();
const canonicalCandidates = new Map<string, FundamentalsObservationCandidate[]>();
let lastAlphaCallAt = 0;

function isFresh(entry: StockFundamentals | undefined): entry is StockFundamentals {
  return !!entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

function finite(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function positive(value: unknown): number | undefined {
  const parsed = finite(value);
  return parsed !== undefined && parsed > 0 ? parsed : undefined;
}

function addProvenance(
  target: FinancialFieldProvenance[],
  input: Omit<FinancialFieldProvenance, 'field'> & { field: string; value: number | undefined },
): void {
  if (input.value === undefined) return;
  target.push(input as FinancialFieldProvenance);
}

function normalizeSymbol(symbol: string): string {
  return symbol.toUpperCase().trim();
}

export function getCachedFundamentals(symbol: string): StockFundamentals | undefined {
  const entry = cache.get(normalizeSymbol(symbol));
  return isFresh(entry) ? entry : undefined;
}

async function fetchAlphaVantageFundamentals(symbol: string, key: string): Promise<StockFundamentals | null> {
  if (Date.now() - lastAlphaCallAt < ALPHA_MIN_CALL_GAP_MS) {
    recordProviderHealth({
      provider: 'AlphaVantage', capability: 'stock-fundamentals', state: 'degraded', cacheMode: 'rate-limit-guard',
      message: `Alpha Vantage cooldown active for ${symbol}; fallback provider may be used.`,
    });
    return null;
  }
  lastAlphaCallAt = Date.now();

  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${symbol}.`);
    const data: any = await res.json();
    if (!data || data['Note'] || data['Information'] || data['Error Message'] || Object.keys(data).length === 0) {
      throw new Error(`Provider returned no usable OVERVIEW payload for ${symbol}.`);
    }

    const fetchedAt = Date.now();
    const retrievedAt = new Date(fetchedAt).toISOString();
    // LatestQuarter is preserved as provider reporting/source-period evidence. It is never
    // substituted with local retrieval time when absent.
    const observedAt = typeof data['LatestQuarter'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data['LatestQuarter'])
      ? `${data['LatestQuarter']}T00:00:00.000Z`
      : undefined;
    const sourcePath = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}`;
    const provenance: FinancialFieldProvenance[] = [];

    const peRatio = positive(data['PERatio']);
    const dividendYieldRaw = finite(data['DividendYield']);
    const profitMarginRaw = finite(data['ProfitMargin']);
    const epsTtm = finite(data['EPS']);
    const dividendYieldPct = dividendYieldRaw !== undefined ? dividendYieldRaw * 100 : undefined;
    const profitMarginPct = profitMarginRaw !== undefined ? profitMarginRaw * 100 : undefined;

    addProvenance(provenance, { field: 'peRatio', provider: 'AlphaVantage', sourcePath, retrievedAt, observedAt, value: peRatio, unit: 'ratio' });
    addProvenance(provenance, { field: 'dividendYieldPct', provider: 'AlphaVantage', sourcePath, retrievedAt, observedAt, value: dividendYieldPct, unit: 'percent' });
    addProvenance(provenance, { field: 'profitMarginPct', provider: 'AlphaVantage', sourcePath, retrievedAt, observedAt, value: profitMarginPct, unit: 'percent' });
    addProvenance(provenance, { field: 'epsTtm', provider: 'AlphaVantage', sourcePath, retrievedAt, observedAt, value: epsTtm, unit: 'USD/share' });

    recordProviderHealth({
      provider: 'AlphaVantage', capability: 'stock-fundamentals', state: provenance.length > 0 ? 'healthy' : 'degraded', cacheMode: 'fresh',
      message: `OVERVIEW received for ${symbol} with ${provenance.length} attributable fields.`,
    });

    return { peRatio, dividendYieldPct, profitMarginPct, epsTtm, fetchedAt, provenance };
  } catch (err: unknown) {
    recordProviderHealth({
      provider: 'AlphaVantage', capability: 'stock-fundamentals', state: 'unavailable',
      message: providerErrorMessage(err),
    });
    return null;
  }
}

async function fetchFmpFundamentals(symbol: string, key: string): Promise<StockFundamentals | null> {
  try {
    const sourcePath = `https://financialmodelingprep.com/stable/ratios-ttm?symbol=${encodeURIComponent(symbol)}`;
    const res = await fetch(`${sourcePath}&apikey=${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error(`FMP HTTP ${res.status} for ${symbol}.`);
    const body: any = await res.json();
    const data = Array.isArray(body) ? body[0] : body;
    if (!data || typeof data !== 'object' || data['Error Message']) {
      throw new Error(`FMP returned no usable ratios-ttm payload for ${symbol}.`);
    }

    const fetchedAt = Date.now();
    const retrievedAt = new Date(fetchedAt).toISOString();
    const provenance: FinancialFieldProvenance[] = [];
    const peRatio = positive(data.priceToEarningsRatioTTM);
    const dividendYieldRaw = finite(data.dividendYieldTTM);
    const profitMarginRaw = finite(data.netProfitMarginTTM);
    const debtToEquity = finite(data.debtToEquityRatioTTM);
    const epsTtm = finite(data.netIncomePerShareTTM);
    const freeCashFlowPerShare = finite(data.freeCashFlowPerShareTTM);
    const dividendYieldPct = dividendYieldRaw !== undefined ? dividendYieldRaw * 100 : undefined;
    const profitMarginPct = profitMarginRaw !== undefined ? profitMarginRaw * 100 : undefined;

    // The current ratios-ttm payload does not expose a provider source timestamp used by this
    // compatibility module. retrievedAt is intentionally not copied into observedAt.
    addProvenance(provenance, { field: 'peRatio', provider: 'FMP', sourcePath, retrievedAt, value: peRatio, unit: 'ratio' });
    addProvenance(provenance, { field: 'dividendYieldPct', provider: 'FMP', sourcePath, retrievedAt, value: dividendYieldPct, unit: 'percent' });
    addProvenance(provenance, { field: 'profitMarginPct', provider: 'FMP', sourcePath, retrievedAt, value: profitMarginPct, unit: 'percent' });
    addProvenance(provenance, { field: 'debtToEquity', provider: 'FMP', sourcePath, retrievedAt, value: debtToEquity, unit: 'ratio' });
    addProvenance(provenance, { field: 'epsTtm', provider: 'FMP', sourcePath, retrievedAt, value: epsTtm, unit: 'USD/share' });
    addProvenance(provenance, { field: 'freeCashFlowPerShare', provider: 'FMP', sourcePath, retrievedAt, value: freeCashFlowPerShare, unit: 'USD/share' });

    recordProviderHealth({
      provider: 'FMP', capability: 'stock-fundamentals', state: provenance.length > 0 ? 'healthy' : 'degraded', cacheMode: 'fresh',
      message: `ratios-ttm received for ${symbol} with ${provenance.length} attributable fields.`,
    });

    return { peRatio, dividendYieldPct, profitMarginPct, debtToEquity, epsTtm, freeCashFlowPerShare, fetchedAt, provenance };
  } catch (err: unknown) {
    recordProviderHealth({
      provider: 'FMP', capability: 'stock-fundamentals', state: 'unavailable',
      message: providerErrorMessage(err),
    });
    return null;
  }
}

const FUNDAMENTAL_FIELDS = [
  'peRatio',
  'dividendYieldPct',
  'profitMarginPct',
  'debtToEquity',
  'epsTtm',
  'freeCashFlowPerShare',
] as const;
type FundamentalField = typeof FUNDAMENTAL_FIELDS[number];

function fieldValue(entry: StockFundamentals | null, field: FundamentalField): number | undefined {
  return entry?.[field];
}

function selectedProvenance(
  primary: StockFundamentals | null,
  fallback: StockFundamentals | null,
  field: FundamentalField,
): FinancialFieldProvenance | undefined {
  const primaryValue = fieldValue(primary, field);
  if (primaryValue !== undefined) {
    return primary?.provenance.find(item => item.field === field && item.value === primaryValue);
  }
  const fallbackValue = fieldValue(fallback, field);
  if (fallbackValue !== undefined) {
    return fallback?.provenance.find(item => item.field === field && item.value === fallbackValue);
  }
  return undefined;
}

/**
 * Legacy compatibility selection keeps AlphaVantage-first behavior but now carries only the
 * provenance of the value actually selected. All provider candidates remain separately available
 * to the canonical DATA validator for conflict detection.
 */
function mergeFundamentals(primary: StockFundamentals | null, fallback: StockFundamentals | null): StockFundamentals | null {
  if (!primary && !fallback) return null;
  const preferred = primary ?? fallback!;
  const secondary = fallback ?? primary!;
  const selected = FUNDAMENTAL_FIELDS
    .map(field => selectedProvenance(primary, fallback, field))
    .filter((item): item is FinancialFieldProvenance => Boolean(item));
  return {
    peRatio: preferred.peRatio ?? secondary.peRatio,
    dividendYieldPct: preferred.dividendYieldPct ?? secondary.dividendYieldPct,
    profitMarginPct: preferred.profitMarginPct ?? secondary.profitMarginPct,
    debtToEquity: preferred.debtToEquity ?? secondary.debtToEquity,
    epsTtm: preferred.epsTtm ?? secondary.epsTtm,
    freeCashFlowPerShare: preferred.freeCashFlowPerShare ?? secondary.freeCashFlowPerShare,
    fetchedAt: Math.max(primary?.fetchedAt ?? 0, fallback?.fetchedAt ?? 0),
    provenance: selected,
  };
}

function providerFeed(provider: FinancialFieldProvenance['provider']): string | null {
  if (provider === 'AlphaVantage') return 'OVERVIEW';
  if (provider === 'FMP') return 'ratios-ttm';
  return null;
}

function canonicalProviderId(provider: FinancialFieldProvenance['provider']): string {
  return provider;
}

function currencyFor(provenance: FinancialFieldProvenance): string | null {
  return provenance.unit?.startsWith('USD') ? 'USD' : null;
}

function toCanonicalCandidates(symbol: string, sources: readonly (StockFundamentals | null)[]): FundamentalsObservationCandidate[] {
  const asset = createUniversalAssetIdentity({ symbol, assetClass: 'stock' });
  return sources.flatMap(source => source?.provenance ?? []).map(provenance => ({
    field: provenance.field as FundamentalsObservationCandidate['field'],
    value: typeof provenance.value === 'number' && Number.isFinite(provenance.value) ? provenance.value : null,
    currency: currencyFor(provenance),
    providerId: canonicalProviderId(provenance.provider),
    providerFeed: providerFeed(provenance.provider),
    evidenceRef: buildFinancialEvidenceId(asset.assetId, provenance),
    observedAt: provenance.observedAt ?? null,
    retrievedAt: provenance.retrievedAt,
  }));
}

export async function ensureFundamentalsFresh(symbol: string): Promise<void> {
  const s = normalizeSymbol(symbol);
  if (isFresh(cache.get(s))) return;

  const alphaKey = resolveAlphaVantageCredential();
  const fmpKey = getCleanEnv('FMP_API_KEY');

  if (!alphaKey) {
    recordProviderHealth({
      provider: 'AlphaVantage', capability: 'stock-fundamentals', state: 'unavailable',
      message: `${ALPHA_VANTAGE_CREDENTIAL} is not configured.`,
    });
  }

  if (!alphaKey && !fmpKey) {
    canonicalCandidates.delete(s);
    return;
  }

  const alpha = alphaKey ? await fetchAlphaVantageFundamentals(s, alphaKey) : null;
  const fmp = fmpKey ? await fetchFmpFundamentals(s, fmpKey) : null;
  const candidates = toCanonicalCandidates(s, [alpha, fmp]);
  if (candidates.length > 0) canonicalCandidates.set(s, candidates);
  else canonicalCandidates.delete(s);

  const merged = mergeFundamentals(alpha, fmp);
  if (merged && merged.provenance.length > 0) cache.set(s, merged);
}

/**
 * Canonical DATA bridge for FIN-12. This is the only new scoring-facing surface introduced here;
 * legacy callers may continue to read StockFundamentals until their owner-correct Strangler cutover.
 */
export async function getValidatedStockFundamentalsInput(
  symbol: string,
  correlationId: string,
  options: { readonly evaluatedAt?: string } = {},
): Promise<ValidatedDataInput> {
  const s = normalizeSymbol(symbol);
  await ensureFundamentalsFresh(s);
  const asset = createUniversalAssetIdentity({ symbol: s, assetClass: 'stock' });
  return buildValidatedDataInputFromFundamentals(
    asset,
    correlationId,
    canonicalCandidates.get(s) ?? [],
    options,
  );
}

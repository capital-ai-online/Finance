import { getAssetCatalogEntry } from '../lib/assetSearchCatalog';

export const SOVEREIGN_BOND_PROVIDER_MAPPING_VERSION = 'sovereign-bond-provider-mapping/1.0.0' as const;

export interface SovereignBondProviderMapping {
  version: typeof SOVEREIGN_BOND_PROVIDER_MAPPING_VERSION;
  catalogSymbol: string;
  provider: 'EODHD';
  providerSymbol: string;
  mappingMode: 'approved-static' | 'provider-catalog-verified';
}

export interface SovereignBondMappingOptions {
  fetchImpl?: typeof fetch;
  apiKey?: string;
  timeoutMs?: number;
  nowMs?: () => number;
}

const PROVIDER_COUNTRY_CODE: Record<string, string> = {
  US: 'US', DE: 'DE', GB: 'UK', FR: 'FR', IT: 'IT', ES: 'ES', NL: 'NL', BE: 'BE', AT: 'AT', FI: 'FI',
  IE: 'IE', PT: 'PT', GR: 'GR', CH: 'SW', JP: 'JP', AU: 'AU', CA: 'CA', NZ: 'NZ', SE: 'SE', NO: 'NO',
};

/**
 * Exact provider symbols verified against EODHD's published GBOND universe. The list is
 * intentionally incomplete: missing tenor/country combinations must be verified through the
 * provider symbol-list endpoint and are never guessed into production.
 */
const APPROVED_STATIC_GBOND_SYMBOLS = new Set([
  'US10Y.GBOND', 'UK10Y.GBOND', 'NL10Y.GBOND', 'NZ10Y.GBOND', 'SE10Y.GBOND', 'NO10Y.GBOND',
  'AT2Y.GBOND', 'AT10Y.GBOND',
  'AU2Y.GBOND', 'AU5Y.GBOND', 'AU10Y.GBOND', 'AU30Y.GBOND',
  'CA2Y.GBOND', 'CA5Y.GBOND', 'CA10Y.GBOND', 'CA20Y.GBOND', 'CA30Y.GBOND',
  'DE2Y.GBOND', 'DE5Y.GBOND', 'DE10Y.GBOND', 'DE30Y.GBOND',
  'ES2Y.GBOND', 'ES5Y.GBOND', 'ES10Y.GBOND',
  'FI2Y.GBOND', 'FI10Y.GBOND',
  'FR2Y.GBOND', 'FR5Y.GBOND', 'FR10Y.GBOND',
  'GR10Y.GBOND',
  'IT2Y.GBOND', 'IT5Y.GBOND', 'IT10Y.GBOND', 'IT30Y.GBOND',
  'JP2Y.GBOND', 'JP10Y.GBOND', 'JP30Y.GBOND',
]);

const LEGACY_BENCHMARKS: Record<string, string> = {
  US10Y: 'US10Y.GBOND',
  DE10Y: 'DE10Y.GBOND',
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let providerCatalogCache: { fetchedAt: number; providerSymbols: Set<string> } | null = null;

function parseCatalogBenchmark(symbol: string): { country: string; tenor: string } | null {
  const match = /^GB_([A-Z]{2})_(2Y|5Y|10Y|20Y|30Y)$/.exec(symbol);
  if (!match) return null;
  return { country: match[1], tenor: match[2] };
}

async function fetchProviderSymbolCatalog(options: SovereignBondMappingOptions): Promise<Set<string>> {
  const apiKey = options.apiKey ?? process.env.EODHD_API_KEY;
  if (!apiKey) throw new Error('EODHD_API_KEY is not configured.');
  const now = options.nowMs?.() ?? Date.now();
  if (providerCatalogCache && now - providerCatalogCache.fetchedAt < CACHE_TTL_MS) {
    return providerCatalogCache.providerSymbols;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5_000);
  try {
    const url = `https://eodhd.com/api/exchange-symbol-list/GBOND?api_token=${encodeURIComponent(apiKey)}&fmt=json`;
    const response = await (options.fetchImpl ?? fetch)(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`EODHD symbol-list HTTP ${response.status}`);
    const rows: any = await response.json();
    if (!Array.isArray(rows)) throw new Error('EODHD GBOND symbol list returned no array.');
    const providerSymbols = new Set<string>();
    for (const row of rows) {
      const raw = String(row?.Code ?? row?.code ?? row?.Symbol ?? row?.symbol ?? '').toUpperCase().trim();
      if (!raw) continue;
      providerSymbols.add(raw.endsWith('.GBOND') ? raw : `${raw}.GBOND`);
    }
    providerCatalogCache = { fetchedAt: now, providerSymbols };
    return providerSymbols;
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveSovereignBondProviderMapping(
  catalogSymbolInput: string,
  options: SovereignBondMappingOptions = {},
): Promise<SovereignBondProviderMapping | null> {
  const catalogSymbol = catalogSymbolInput.toUpperCase().trim();
  const legacy = LEGACY_BENCHMARKS[catalogSymbol];
  if (legacy) {
    return {
      version: SOVEREIGN_BOND_PROVIDER_MAPPING_VERSION,
      catalogSymbol,
      provider: 'EODHD',
      providerSymbol: legacy,
      mappingMode: 'approved-static',
    };
  }

  const entry = getAssetCatalogEntry(catalogSymbol);
  if (!entry || entry.type !== 'bond' || entry.instrumentKind !== 'government-benchmark-yield') return null;
  const parsed = parseCatalogBenchmark(catalogSymbol);
  if (!parsed) return null;
  const providerCountry = PROVIDER_COUNTRY_CODE[parsed.country];
  if (!providerCountry) return null;
  const candidate = `${providerCountry}${parsed.tenor}.GBOND`;
  if (APPROVED_STATIC_GBOND_SYMBOLS.has(candidate)) {
    return {
      version: SOVEREIGN_BOND_PROVIDER_MAPPING_VERSION,
      catalogSymbol,
      provider: 'EODHD',
      providerSymbol: candidate,
      mappingMode: 'approved-static',
    };
  }

  try {
    const catalog = await fetchProviderSymbolCatalog(options);
    if (!catalog.has(candidate)) return null;
    return {
      version: SOVEREIGN_BOND_PROVIDER_MAPPING_VERSION,
      catalogSymbol,
      provider: 'EODHD',
      providerSymbol: candidate,
      mappingMode: 'provider-catalog-verified',
    };
  } catch {
    return null;
  }
}

export function resetSovereignBondProviderCatalogCache(): void {
  providerCatalogCache = null;
}

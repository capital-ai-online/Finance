import { INDEX_FMP_TICKERS } from '../../server/fmpIndices';
import { getAssetSearchCatalog } from '../lib/assetSearchCatalog';

export const INDEX_PROVIDER_MAPPING_VERSION = 'index-provider-mapping/1.0.0' as const;

export type ApprovedIndexProvider = 'FMP' | 'TwelveData';

export interface IndexProviderCandidate {
  provider: ApprovedIndexProvider;
  providerSymbol: string;
  priority: number;
  mappingMode: 'approved-static' | 'runtime-verified';
}

export interface IndexProviderMapping {
  version: typeof INDEX_PROVIDER_MAPPING_VERSION;
  symbol: string;
  name: string;
  candidates: IndexProviderCandidate[];
}

/**
 * Twelve Data uses its own index symbols. For symbols where an official/publicly documented
 * Twelve Data identifier is known, pin it here. Every other catalog index is treated as a
 * runtime-verified candidate: the returned provider metadata must echo the requested symbol
 * before the observation is accepted.
 */
const TWELVEDATA_INDEX_OVERRIDES: Record<string, string> = {
  GDAXI: 'DAX',
  N225: 'N225',
  KS11: 'KS11',
  STI: 'STI',
  STOXX50E: 'STOXX50E',
  EGX30: 'CASE30',
  NIFTY50: 'NIFTY',
  NDX: 'NDX',
};

function normalizeProviderSymbol(value: string): string {
  return value.toUpperCase().trim().replace(/^\^/, '');
}

function twelveDataSymbol(symbol: string, aliases: string[]): string {
  const override = TWELVEDATA_INDEX_OVERRIDES[symbol];
  if (override) return override;
  const plainAlias = aliases.find(alias => alias && !alias.includes('/') && !alias.includes(' '));
  return normalizeProviderSymbol(plainAlias ?? symbol);
}

const mappings = new Map<string, IndexProviderMapping>();
for (const entry of getAssetSearchCatalog().filter(asset => asset.type === 'index')) {
  const symbol = entry.symbol.toUpperCase();
  const candidates: IndexProviderCandidate[] = [];
  const fmp = INDEX_FMP_TICKERS[symbol];
  if (fmp) {
    candidates.push({
      provider: 'FMP',
      providerSymbol: fmp,
      priority: 1,
      mappingMode: 'approved-static',
    });
  }
  candidates.push({
    provider: 'TwelveData',
    providerSymbol: twelveDataSymbol(symbol, entry.aliases ?? []),
    priority: fmp ? 2 : 1,
    mappingMode: 'runtime-verified',
  });
  mappings.set(symbol, {
    version: INDEX_PROVIDER_MAPPING_VERSION,
    symbol,
    name: entry.name,
    candidates,
  });
}

export function getIndexProviderMapping(symbolInput: string): IndexProviderMapping | undefined {
  const symbol = symbolInput.toUpperCase().trim();
  const mapping = mappings.get(symbol);
  return mapping ? {
    ...mapping,
    candidates: mapping.candidates.map(candidate => ({ ...candidate })),
  } : undefined;
}

export function getAllIndexProviderMappings(): IndexProviderMapping[] {
  return [...mappings.values()].map(mapping => ({
    ...mapping,
    candidates: mapping.candidates.map(candidate => ({ ...candidate })),
  }));
}

export function validateTwelveDataIndexIdentity(
  mapping: IndexProviderMapping,
  metadata: Record<string, unknown> | undefined,
): boolean {
  const candidate = mapping.candidates.find(item => item.provider === 'TwelveData');
  if (!candidate || !metadata) return false;
  const returned = typeof metadata.symbol === 'string' ? normalizeProviderSymbol(metadata.symbol) : '';
  const expected = normalizeProviderSymbol(candidate.providerSymbol);
  if (!returned || returned !== expected) return false;
  if (typeof metadata.type === 'string' && metadata.type.trim()) {
    const providerType = metadata.type.toLowerCase();
    if (!providerType.includes('index')) return false;
  }
  return true;
}

import { assetRegistry } from './assetRegistry';
import {
  ASSET_CATALOG_EXPANSION,
  ASSET_CATALOG_TARGET_ADDITIONS,
  type AssetCatalogCandidate,
  type AssetCatalogType,
} from '../data/assetCatalogExpansion';
import {
  validateAssetCatalog,
  type AssetCatalogEntry,
  type AssetCatalogIntegrityResult,
} from '../services/assetCatalogIntegrity';

const TYPES: AssetCatalogType[] = ['crypto', 'stock', 'forex', 'commodity', 'index', 'bond'];

function emptyCounts(): Record<AssetCatalogType, number> {
  return { crypto: 0, stock: 0, forex: 0, commodity: 0, index: 0, bond: 0 };
}

function screeningContractFor(type: AssetCatalogType): AssetCatalogCandidate['screeningContract'] {
  if (type === 'crypto') return 'crypto-provenance';
  if (type === 'stock' || type === 'forex' || type === 'index') return 'traditional-provenance';
  return 'catalog-only';
}

function instrumentKindFor(type: AssetCatalogType): string {
  if (type === 'crypto') return 'digital-asset';
  if (type === 'stock') return 'equity';
  if (type === 'forex') return 'currency-pair';
  if (type === 'commodity') return 'commodity-benchmark';
  if (type === 'index') return 'market-index';
  return 'bond-or-rate-benchmark';
}

function normalizeCandidate(candidate: AssetCatalogCandidate, origin: AssetCatalogEntry['origin']): AssetCatalogEntry {
  const symbol = candidate.symbol.toUpperCase().trim();
  const aliases = [...new Set((candidate.aliases ?? []).map(alias => alias.toUpperCase().trim()).filter(Boolean))];
  return {
    ...candidate,
    symbol,
    name: candidate.name.trim(),
    aliases,
    origin,
  };
}

function buildCatalog(): {
  entries: AssetCatalogEntry[];
  expansionAdded: Record<AssetCatalogType, number>;
  integrity: AssetCatalogIntegrityResult;
} {
  const bySymbol = new Map<string, AssetCatalogEntry>();

  for (const asset of assetRegistry.getAssets()) {
    const type = asset.type as AssetCatalogType;
    const normalized = normalizeCandidate({
      symbol: asset.symbol,
      name: asset.name,
      type,
      subtype: asset.subtype,
      catalogSource: 'legacy AssetRegistry metadata; bootstrap market fields are not catalog evidence',
      instrumentKind: instrumentKindFor(type),
      screeningContract: screeningContractFor(type),
    }, 'legacy-registry');
    if (!bySymbol.has(normalized.symbol)) bySymbol.set(normalized.symbol, normalized);
  }

  const expansionAdded = emptyCounts();
  for (const type of TYPES) {
    const target = ASSET_CATALOG_TARGET_ADDITIONS[type];
    for (const candidate of ASSET_CATALOG_EXPANSION[type]) {
      if (expansionAdded[type] >= target) break;
      const normalized = normalizeCandidate(candidate, 'catalog-expansion');
      if (bySymbol.has(normalized.symbol)) continue;
      bySymbol.set(normalized.symbol, normalized);
      expansionAdded[type] += 1;
    }
  }

  const entries = [...bySymbol.values()].sort((a, b) => {
    const typeDelta = TYPES.indexOf(a.type) - TYPES.indexOf(b.type);
    return typeDelta !== 0 ? typeDelta : a.symbol.localeCompare(b.symbol);
  });
  const integrity = validateAssetCatalog(entries, expansionAdded, ASSET_CATALOG_TARGET_ADDITIONS);
  return { entries, expansionAdded, integrity };
}

const built = buildCatalog();
const aliasToSymbol = new Map<string, string>();
for (const entry of built.entries) {
  aliasToSymbol.set(entry.symbol, entry.symbol);
  for (const alias of entry.aliases ?? []) aliasToSymbol.set(alias.toUpperCase(), entry.symbol);
}

if (built.integrity.status !== 'READY') {
  console.warn('[AssetSearchCatalog] catalog integrity degraded:', JSON.stringify({
    shortfalls: built.integrity.shortfalls,
    duplicateSymbols: built.integrity.duplicateSymbols,
    invalidSymbols: built.integrity.invalidSymbols,
    invalidNames: built.integrity.invalidNames,
  }));
}

export function getAssetSearchCatalog(): AssetCatalogEntry[] {
  return built.entries.map(entry => ({ ...entry, aliases: [...(entry.aliases ?? [])] }));
}

export function getAssetCatalogEntry(symbolOrAlias: string): AssetCatalogEntry | undefined {
  const lookup = symbolOrAlias.toUpperCase().trim();
  const canonical = aliasToSymbol.get(lookup) ?? lookup;
  const found = built.entries.find(entry => entry.symbol === canonical);
  return found ? { ...found, aliases: [...(found.aliases ?? [])] } : undefined;
}

export function getAssetClassCounts(): Record<AssetCatalogType, number> {
  return { ...built.integrity.counts };
}

export function getAssetCatalogIntegrity(): AssetCatalogIntegrityResult {
  return {
    ...built.integrity,
    counts: { ...built.integrity.counts },
    expansionAdded: { ...built.integrity.expansionAdded },
    expansionTarget: { ...built.integrity.expansionTarget },
    shortfalls: { ...built.integrity.shortfalls },
    duplicateSymbols: [...built.integrity.duplicateSymbols],
    invalidSymbols: [...built.integrity.invalidSymbols],
    invalidNames: [...built.integrity.invalidNames],
    missingSources: [...built.integrity.missingSources],
    unsupportedTypes: [...built.integrity.unsupportedTypes],
  };
}

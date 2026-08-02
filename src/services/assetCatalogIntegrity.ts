import type { AssetCatalogCandidate, AssetCatalogType } from '../data/assetCatalogExpansion';

export const ASSET_CATALOG_INTEGRITY_VERSION = 'asset-catalog-integrity/1.1.0' as const;

export interface AssetCatalogEntry extends AssetCatalogCandidate {
  origin: 'legacy-registry' | 'catalog-expansion';
  /** Approved runtime evidence/scoring contract layered on top of catalog metadata. */
  evidenceScoringContract?: string;
  /** Versioned provider-mapping contract where provider identity requires explicit mapping/verification. */
  providerMappingContract?: string;
}

export interface AssetCatalogIntegrityResult {
  contractVersion: typeof ASSET_CATALOG_INTEGRITY_VERSION;
  status: 'READY' | 'DEGRADED';
  counts: Record<AssetCatalogType, number>;
  expansionAdded: Record<AssetCatalogType, number>;
  expansionTarget: Record<AssetCatalogType, number>;
  shortfalls: Partial<Record<AssetCatalogType, number>>;
  duplicateSymbols: string[];
  invalidSymbols: string[];
  invalidNames: string[];
  missingSources: string[];
  unsupportedTypes: string[];
  catalogOnlyCount: number;
  providerVerificationRequired: number;
  approvedEvidenceContractCount: number;
  scoreImpactEnabled: false;
  reason?: string;
}

const TYPES: AssetCatalogType[] = ['crypto', 'stock', 'forex', 'commodity', 'index', 'bond'];
const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9._=-]*$/;

function emptyCounts(): Record<AssetCatalogType, number> {
  return { crypto: 0, stock: 0, forex: 0, commodity: 0, index: 0, bond: 0 };
}

export function validateAssetCatalog(
  entries: AssetCatalogEntry[],
  expansionAdded: Record<AssetCatalogType, number>,
  expansionTarget: Record<AssetCatalogType, number>,
): AssetCatalogIntegrityResult {
  const counts = emptyCounts();
  const seen = new Set<string>();
  const duplicateSymbols: string[] = [];
  const invalidSymbols: string[] = [];
  const invalidNames: string[] = [];
  const missingSources: string[] = [];
  const unsupportedTypes: string[] = [];
  const shortfalls: Partial<Record<AssetCatalogType, number>> = {};

  for (const entry of entries) {
    const symbol = String(entry.symbol || '').toUpperCase().trim();
    if (seen.has(symbol)) duplicateSymbols.push(symbol);
    seen.add(symbol);

    if (!SYMBOL_PATTERN.test(symbol)) invalidSymbols.push(symbol || '<empty>');
    if (!entry.name || entry.name.trim().length < 2) invalidNames.push(symbol || '<empty>');
    if (!entry.catalogSource || entry.catalogSource.trim().length < 3) missingSources.push(symbol || '<empty>');
    if (!TYPES.includes(entry.type)) unsupportedTypes.push(`${symbol}:${String(entry.type)}`);
    else counts[entry.type] += 1;
  }

  for (const type of TYPES) {
    const target = expansionTarget[type];
    const added = expansionAdded[type];
    if (added < target) shortfalls[type] = target - added;
  }

  const catalogOnlyCount = entries.filter(entry => entry.screeningContract === 'catalog-only' && !entry.evidenceScoringContract).length;
  const approvedEvidenceContractCount = entries.filter(entry => Boolean(entry.evidenceScoringContract)).length;
  const providerVerificationRequired = entries.length - catalogOnlyCount;
  const issues = duplicateSymbols.length + invalidSymbols.length + invalidNames.length + missingSources.length + unsupportedTypes.length + Object.keys(shortfalls).length;

  return {
    contractVersion: ASSET_CATALOG_INTEGRITY_VERSION,
    status: issues === 0 ? 'READY' : 'DEGRADED',
    counts,
    expansionAdded: { ...expansionAdded },
    expansionTarget: { ...expansionTarget },
    shortfalls,
    duplicateSymbols: [...new Set(duplicateSymbols)].sort(),
    invalidSymbols: [...new Set(invalidSymbols)].sort(),
    invalidNames: [...new Set(invalidNames)].sort(),
    missingSources: [...new Set(missingSources)].sort(),
    unsupportedTypes: [...new Set(unsupportedTypes)].sort(),
    catalogOnlyCount,
    providerVerificationRequired,
    approvedEvidenceContractCount,
    scoreImpactEnabled: false,
    reason: issues === 0
      ? undefined
      : 'Asset catalog integrity checks detected duplicates, invalid metadata, unsupported types or an expansion shortfall.',
  };
}

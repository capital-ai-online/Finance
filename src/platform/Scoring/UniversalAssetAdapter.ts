import type { RegistryAsset } from '../../lib/assetRegistry';
import type { AssetCatalogCandidate } from '../../data/assetCatalogExpansion';
import {
  SCORABLE_ASSET_CLASSES,
  UNIVERSAL_ASSET_CONTRACT_VERSION,
  type UniversalAssetClass,
  type UniversalAssetIdentity,
  type UniversalAssetSource,
} from './contracts';
import { classifyCommodityResearchInstrumentKind } from './CommodityResearchModelContracts';

const SCORABLE_ASSET_CLASS_SET = new Set<string>(SCORABLE_ASSET_CLASSES);

export interface UniversalAssetInput {
  symbol: string;
  assetClass: UniversalAssetClass;
  name?: string;
  subtype?: string;
  instrumentKind?: string;
  source?: UniversalAssetSource;
  providerSymbols?: Readonly<Record<string, string>>;
}

export function normalizeUniversalAssetSymbol(symbol: string): string {
  return String(symbol ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

export function buildUniversalAssetId(assetClass: UniversalAssetClass, symbol: string): string {
  return `${assetClass}:${normalizeUniversalAssetSymbol(symbol)}`;
}

function resolveInstrumentKind(input: UniversalAssetInput, symbol: string): string | undefined {
  if (input.assetClass !== 'commodity') return input.instrumentKind?.trim() || undefined;
  // Resource-project identities are intentionally not coerced into benchmark domains.
  if (input.instrumentKind === 'commodity-resource-project') return input.instrumentKind;
  return classifyCommodityResearchInstrumentKind(symbol, input.name, input.instrumentKind);
}

/**
 * Single construction boundary for UAI identity. It validates only identity semantics and never
 * promotes catalog/bootstrap values into market evidence.
 */
export function createUniversalAssetIdentity(input: UniversalAssetInput): UniversalAssetIdentity {
  const symbol = normalizeUniversalAssetSymbol(input.symbol);
  if (!symbol) throw new Error('UAI_INVALID_SYMBOL');
  if (!SCORABLE_ASSET_CLASS_SET.has(input.assetClass)) throw new Error('UAI_UNSUPPORTED_ASSET_CLASS');

  return {
    contractVersion: UNIVERSAL_ASSET_CONTRACT_VERSION,
    assetId: buildUniversalAssetId(input.assetClass, symbol),
    symbol,
    assetClass: input.assetClass,
    name: input.name?.trim() || undefined,
    subtype: input.subtype?.trim() || undefined,
    instrumentKind: resolveInstrumentKind(input, symbol),
    source: input.source ?? 'request',
    providerSymbols: input.providerSymbols,
  };
}

/** Existing bootstrap RegistryAsset -> identity only. Numeric bootstrap fields are deliberately ignored. */
export function adaptRegistryAssetToUniversal(
  asset: Pick<RegistryAsset, 'symbol' | 'name' | 'type' | 'subtype'>,
): UniversalAssetIdentity {
  return createUniversalAssetIdentity({
    symbol: asset.symbol,
    name: asset.name,
    assetClass: asset.type,
    subtype: asset.subtype,
    source: 'registry',
  });
}

/** Curated catalog entry -> identity only. catalogSource/screeningContract are not scoring evidence. */
export function adaptCatalogCandidateToUniversal(
  asset: Pick<AssetCatalogCandidate, 'symbol' | 'name' | 'type' | 'subtype' | 'instrumentKind'>,
): UniversalAssetIdentity {
  return createUniversalAssetIdentity({
    symbol: asset.symbol,
    name: asset.name,
    assetClass: asset.type,
    subtype: asset.subtype,
    instrumentKind: asset.instrumentKind,
    source: 'catalog',
  });
}

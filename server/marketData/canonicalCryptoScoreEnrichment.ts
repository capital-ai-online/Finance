import type { MarketDataAsset } from './marketDataCoordinator';
import {
  dispatchCanonicalScore,
  type CanonicalScoringDispatchRequest,
  type CanonicalScoringDispatchResult,
  type UniversalAssetClass,
} from '../../src/platform/Scoring';
import { getAssetCatalogEntry } from '../../src/lib/assetSearchCatalog';
import { generateTraditionalAssetInputs } from '../../src/services/traditionalAssetScoring';
import { buildIndexScoringInputsFromEvidence, getVerifiedIndexHistory } from '../../src/services/indexMarketEvidence';
import { getTwelveDataCommodityEvidence } from '../../src/services/commodityMarketEvidence';
import { resolveSovereignBondProviderMapping } from '../../src/services/sovereignBondProviderMapping';
import { getEodhdBondEvidence } from '../../src/services/eodhdBondEvidence';
import { ensureFundamentalsFresh, getCachedFundamentals } from '../stockFundamentals';

const CANONICAL_MARKET_DATA_ASSET_CLASSES = new Set<UniversalAssetClass>([
  'crypto', 'stock', 'forex', 'commodity', 'index', 'bond',
]);

export type CanonicalScoreDispatcher = (
  input: CanonicalScoringDispatchRequest,
) => Promise<CanonicalScoringDispatchResult>;

export function isCanonicalScorableMarketDataAsset(asset: Readonly<MarketDataAsset>): boolean {
  const assetClass = String(asset.type || '').toLowerCase() as UniversalAssetClass;
  return Boolean(String(asset.symbol || '').trim()) && CANONICAL_MARKET_DATA_ASSET_CLASSES.has(assetClass);
}

/**
 * C2 compatibility alias retained so the large composition root does not need a parallel rewrite.
 * Since C3 this predicate intentionally covers every scorable asset class, including Meme-Crypto.
 */
export function isStandardCryptoMarketDataAsset(asset: Readonly<MarketDataAsset>): boolean {
  return isCanonicalScorableMarketDataAsset(asset);
}

async function dispatchMarketDataAsset(
  asset: Readonly<MarketDataAsset>,
  dispatcher: CanonicalScoreDispatcher,
): Promise<CanonicalScoringDispatchResult> {
  const symbol = String(asset.symbol || '').toUpperCase().trim();
  const name = typeof asset.name === 'string' ? asset.name : undefined;
  const subtype = typeof asset.subtype === 'string' ? asset.subtype : undefined;
  const assetClass = String(asset.type || '').toLowerCase() as UniversalAssetClass;

  if (assetClass === 'crypto') {
    return dispatcher({ symbol, name, assetClass, subtype, source: 'registry' });
  }

  if (assetClass === 'stock') {
    try {
      await ensureFundamentalsFresh(symbol);
    } catch {
      // Verified history can still support a partial Traditional score; cached fundamentals remain optional.
    }
    const inputs = await generateTraditionalAssetInputs(symbol, 'stock', getCachedFundamentals(symbol));
    return dispatcher({ symbol, name, assetClass, subtype, source: 'registry', execution: { kind: 'traditional', inputs } });
  }

  if (assetClass === 'forex') {
    const inputs = await generateTraditionalAssetInputs(symbol, 'forex');
    return dispatcher({ symbol, name, assetClass, subtype, source: 'registry', execution: { kind: 'traditional', inputs } });
  }

  if (assetClass === 'index') {
    const evidence = await getVerifiedIndexHistory(symbol, 45);
    return dispatcher({
      symbol,
      name,
      assetClass,
      subtype,
      source: 'registry',
      execution: evidence ? { kind: 'traditional', inputs: buildIndexScoringInputsFromEvidence(evidence) } : undefined,
    });
  }

  if (assetClass === 'commodity') {
    const evidence = await getTwelveDataCommodityEvidence(symbol, 90);
    return dispatcher({
      symbol,
      name,
      assetClass,
      subtype,
      source: 'registry',
      execution: { kind: 'commodity-evidence', evidence },
    });
  }

  const catalogAsset = getAssetCatalogEntry(symbol);
  const instrumentKind = catalogAsset?.type === 'bond' ? catalogAsset.instrumentKind : undefined;
  const mapping = await resolveSovereignBondProviderMapping(symbol);
  if (!mapping) {
    return dispatcher({ symbol, name, assetClass: 'bond', subtype, instrumentKind, source: 'registry' });
  }
  const evidence = await getEodhdBondEvidence(mapping.providerSymbol, 90);
  return dispatcher({
    symbol,
    name,
    assetClass: 'bond',
    subtype,
    instrumentKind,
    source: 'registry',
    execution: { kind: 'sovereign-benchmark-evidence', evidence },
  });
}

/**
 * SC-2 C3 market-data adapter.
 *
 * Acquisition remains asset-class specific, while model resolution/execution is exclusively
 * delegated to ScoringDispatcher. Missing provider evidence never reopens a heuristic fallback.
 * The legacy market-data `score` field retains its historical presentation scale: Crypto 0..10,
 * all other financial asset classes 0..100. The full CanonicalScoreResult is attached separately.
 */
export async function enrichAssetWithCanonicalScore(
  asset: Readonly<MarketDataAsset>,
  dispatcher: CanonicalScoreDispatcher = dispatchCanonicalScore,
): Promise<MarketDataAsset> {
  const symbol = String(asset.symbol || '').toUpperCase().trim();
  const assetClass = String(asset.type || '').toLowerCase() as UniversalAssetClass;

  try {
    const dispatch = await dispatchMarketDataAsset(asset, dispatcher);
    const canonical = dispatch.canonical;
    const base = {
      ...asset,
      symbol,
      scoringAuthority: dispatch.dispatcherVersion,
      canonicalScoreStatus: canonical.status,
      canonicalScoreResult: canonical,
      canonicalAssetId: dispatch.asset.assetId,
      canonicalModelId: dispatch.model?.modelId ?? null,
      canonicalModelVersion: dispatch.model?.version ?? null,
      canonicalModelAlias: dispatch.model?.alias ?? null,
    };

    if (
      dispatch.status !== 'DISPATCHED'
      || canonical.status !== 'READY'
      || !Number.isFinite(canonical.final_score)
    ) {
      return { ...base, score: null, scoreBasis: 'unavailable' };
    }

    const score = assetClass === 'crypto' ? canonical.score : canonical.final_score;
    return {
      ...base,
      score,
      scoreBasis: 'canonical-dispatcher',
    };
  } catch (error) {
    return {
      ...asset,
      symbol,
      score: null,
      scoreBasis: 'unavailable',
      canonicalScoreStatus: 'SCORE_NOT_COMPUTABLE',
      canonicalScoreResult: null,
      scoringAuthority: 'canonical-scoring-dispatcher',
      canonicalScoringReason: error instanceof Error ? error.message : String(error),
    };
  }
}

/** C2 compatibility alias; execution semantics are global since C3. */
export function enrichStandardCryptoWithCanonicalScore(
  asset: Readonly<MarketDataAsset>,
  dispatcher: CanonicalScoreDispatcher = dispatchCanonicalScore,
): Promise<MarketDataAsset> {
  return enrichAssetWithCanonicalScore(asset, dispatcher);
}

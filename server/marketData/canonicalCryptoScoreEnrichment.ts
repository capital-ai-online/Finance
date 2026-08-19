import type { MarketDataAsset } from './marketDataCoordinator';
import {
  dispatchCanonicalScore,
  type CanonicalScoringDispatchResult,
} from '../../src/platform/Scoring';

const MEME_COIN_SYMBOLS = new Set(['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'POPCAT', 'BRETT', 'MOG', 'BOME']);

export type CanonicalScoreDispatcher = (
  input: Parameters<typeof dispatchCanonicalScore>[0],
) => Promise<CanonicalScoringDispatchResult>;

export function isStandardCryptoMarketDataAsset(asset: Readonly<MarketDataAsset>): boolean {
  if (String(asset.type || '').toLowerCase() !== 'crypto') return false;
  const symbol = String(asset.symbol || '').toUpperCase().trim();
  if (!symbol) return false;
  if (String(asset.subtype || '').toLowerCase() === 'memecoin') return false;
  return !MEME_COIN_SYMBOLS.has(symbol);
}

/**
 * SC-2 Phase C2 composition-root adapter.
 *
 * Standard-Crypto market-data enrichment may expose a financial score only when the canonical
 * ScoringDispatcher authorizes the registered model and returns READY evidence. The returned
 * score remains on the legacy 1..10 display/alert scale; canonical 0..100 lineage stays attached
 * separately. Missing or denied evidence is represented by score=null so existing snapshot and
 * alert sinks fail closed via their Number.isFinite guards.
 */
export async function enrichStandardCryptoWithCanonicalScore(
  asset: Readonly<MarketDataAsset>,
  dispatcher: CanonicalScoreDispatcher = dispatchCanonicalScore,
): Promise<MarketDataAsset> {
  const symbol = String(asset.symbol || '').toUpperCase().trim();
  const dispatch = await dispatcher({
    symbol,
    name: typeof asset.name === 'string' ? asset.name : undefined,
    assetClass: 'crypto',
    subtype: typeof asset.subtype === 'string' ? asset.subtype : undefined,
    source: 'registry',
  });

  const canonical = dispatch.canonical;
  const base = {
    ...asset,
    symbol,
    scoringAuthority: 'canonical-scoring-dispatcher/1.0.0' as const,
    canonicalScoreStatus: canonical.status,
    canonicalScoreResult: canonical,
    canonicalAssetId: dispatch.asset.assetId,
    canonicalModelId: dispatch.model?.modelId ?? null,
    canonicalModelVersion: dispatch.model?.version ?? null,
  };

  if (
    dispatch.status !== 'DISPATCHED'
    || canonical.status !== 'READY'
    || !Number.isFinite(canonical.final_score)
  ) {
    return {
      ...base,
      score: null,
      scoreBasis: 'unavailable',
    };
  }

  return {
    ...base,
    score: Number((Number(canonical.final_score) / 10).toFixed(1)),
    scoreBasis: 'canonical-dispatcher',
  };
}

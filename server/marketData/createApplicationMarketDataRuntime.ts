import type { MarketDataAsset } from './marketDataCoordinator';
import type { StooqFallbackAsset } from './stooqProviderStage';
import { runMarketDataCompatibilityRefresh } from './marketDataCompatibilityFacade';
import { createMarketDataRuntimeFacade, type MarketDataRefreshTiming } from './marketDataRuntimeFacade';
import {
  enrichAssetWithCanonicalScore,
  isCanonicalScorableMarketDataAsset,
} from './canonicalCryptoScoreEnrichment';

const STOCK_TICKERS = ['AAPL.US', 'MSFT.US', 'GOOGL.US', 'AMZN.US', 'NVDA.US', 'TSLA.US', 'META.US', 'NFLX.US', 'AMD.US', 'INTC.US'];
const FOREX_TICKERS = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'AUDUSD'];
const COMMODITY_TICKERS = ['XAUUSD', 'XAGUSD', 'CL.F', 'NG.F', 'CO.F'];
export const APPLICATION_BACKGROUND_REFRESH_INTERVAL_MS = 90_000;
export const APPLICATION_ENRICHMENT_CONCURRENCY = 4;

export interface ApplicationMarketDataRuntimeOptions {
  fallbackAssets: StooqFallbackAsset[];
  registryAssets: () => MarketDataAsset[];
  enrichAsset: (asset: MarketDataAsset) => Promise<MarketDataAsset>;
  syncAsset: (asset: MarketDataAsset) => void;
  persistSnapshots?: (assets: MarketDataAsset[]) => Promise<void> | void;
  evaluateAlerts?: (assets: MarketDataAsset[]) => Promise<void> | void;
  onProviderFailure?: (stage: string, error: unknown) => void;
  onRefreshFailure?: (error: unknown) => void;
  onRefreshTiming?: (timing: MarketDataRefreshTiming) => void;
  ttlMs?: number;
}

function emitDefaultRefreshTiming(timing: MarketDataRefreshTiming): void {
  if (process.env.NODE_ENV === 'test') return;
  console.info('[MarketDataRuntime] refresh timing', {
    kind: timing.kind,
    outcome: timing.outcome,
    assetCount: timing.assetCount,
    durationMs: Number(timing.durationMs.toFixed(1)),
  });
}

/**
 * Canonical application-level composition for CAPITAL-AI market data.
 *
 * Provider ordering, cache/TTL and compatibility fallback completion stay owned by the market-data
 * architecture. Since SC-2 C3 every scorable financial asset class is intercepted before the
 * legacy composition-root enrichment callback and enters its domain evidence adapter followed by
 * UAI -> ScoringModelRegistry -> ScoringDispatcher. A missing evidence contract yields score=null;
 * no asset class may fall through to a productive heuristic model-selection path.
 *
 * Background provider refresh is throttled to a 90-second cadence at this boundary even if a
 * legacy composition-root timer invokes backgroundRefresh() more frequently. Calls inside the
 * throttle window are coalesced into the next eligible refresh instead of triggering provider I/O.
 * Evidence enrichment additionally has a four-worker provider budget to avoid CoinGecko/other
 * provider bursts and to leave capacity for unrelated HTTP traffic.
 */
export function createApplicationMarketDataRuntime(options: ApplicationMarketDataRuntimeOptions) {
  return createMarketDataRuntimeFacade({
    ttlMs: options.ttlMs,
    backgroundRefreshIntervalMs: APPLICATION_BACKGROUND_REFRESH_INTERVAL_MS,
    syncAsset: options.syncAsset,
    onRefreshFailure: options.onRefreshFailure,
    onRefreshTiming: options.onRefreshTiming ?? emitDefaultRefreshTiming,
    refresh: () => runMarketDataCompatibilityRefresh({
      fallbackAssets: options.fallbackAssets,
      stockTickers: STOCK_TICKERS,
      forexTickers: FOREX_TICKERS,
      commodityTickers: COMMODITY_TICKERS,
      registryAssets: options.registryAssets,
      enrichAsset: (asset) => isCanonicalScorableMarketDataAsset(asset)
        ? enrichAssetWithCanonicalScore(asset)
        : options.enrichAsset(asset),
      persistSnapshots: options.persistSnapshots,
      evaluateAlerts: options.evaluateAlerts,
      onProviderFailure: options.onProviderFailure,
      enrichmentConcurrency: APPLICATION_ENRICHMENT_CONCURRENCY,
    }),
  });
}
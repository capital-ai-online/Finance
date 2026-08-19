import type { MarketDataAsset } from './marketDataCoordinator';
import type { StooqFallbackAsset } from './stooqProviderStage';
import { runMarketDataCompatibilityRefresh } from './marketDataCompatibilityFacade';
import { createMarketDataRuntimeFacade } from './marketDataRuntimeFacade';
import {
  enrichAssetWithCanonicalScore,
  isCanonicalScorableMarketDataAsset,
} from './canonicalCryptoScoreEnrichment';

const STOCK_TICKERS = ['AAPL.US', 'MSFT.US', 'GOOGL.US', 'AMZN.US', 'NVDA.US', 'TSLA.US', 'META.US', 'NFLX.US', 'AMD.US', 'INTC.US'];
const FOREX_TICKERS = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'AUDUSD'];
const COMMODITY_TICKERS = ['XAUUSD', 'XAGUSD', 'CL.F', 'NG.F', 'CO.F'];

export interface ApplicationMarketDataRuntimeOptions {
  fallbackAssets: StooqFallbackAsset[];
  registryAssets: () => MarketDataAsset[];
  enrichAsset: (asset: MarketDataAsset) => Promise<MarketDataAsset>;
  syncAsset: (asset: MarketDataAsset) => void;
  persistSnapshots?: (assets: MarketDataAsset[]) => Promise<void> | void;
  evaluateAlerts?: (assets: MarketDataAsset[]) => Promise<void> | void;
  onProviderFailure?: (stage: string, error: unknown) => void;
  onRefreshFailure?: (error: unknown) => void;
  ttlMs?: number;
}

/**
 * Canonical application-level composition for CAPITAL-AI market data.
 *
 * Provider ordering, cache/TTL and compatibility fallback completion stay owned by the market-data
 * architecture. Since SC-2 C3 every scorable financial asset class is intercepted before the
 * legacy composition-root enrichment callback and enters its domain evidence adapter followed by
 * UAI -> ScoringModelRegistry -> ScoringDispatcher. A missing evidence contract yields score=null;
 * no asset class may fall through to a productive heuristic model-selection path.
 */
export function createApplicationMarketDataRuntime(options: ApplicationMarketDataRuntimeOptions) {
  return createMarketDataRuntimeFacade({
    ttlMs: options.ttlMs,
    syncAsset: options.syncAsset,
    onRefreshFailure: options.onRefreshFailure,
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
    }),
  });
}

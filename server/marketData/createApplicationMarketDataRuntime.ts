import type { MarketDataAsset } from './marketDataCoordinator';
import type { StooqFallbackAsset } from './stooqProviderStage';
import { runMarketDataCompatibilityRefresh } from './marketDataCompatibilityFacade';
import { createMarketDataRuntimeFacade } from './marketDataRuntimeFacade';
import {
  enrichStandardCryptoWithCanonicalScore,
  isStandardCryptoMarketDataAsset,
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
 * The server composition root supplies only domain callbacks (enrichment, registry sync and
 * best-effort side effects). Provider ordering, compatibility fallback completion, cache TTL
 * and request coalescing stay owned by the extracted market-data architecture.
 *
 * SC-2 Phase C2: Standard-Crypto never enters the legacy server.application.ts enrichment
 * callback. It is scored exclusively through UAI -> ScoringModelRegistry -> ScoringDispatcher.
 * Meme/Traditional/Commodity remain on their existing paths until their explicit C3 adapters.
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
      enrichAsset: (asset) => isStandardCryptoMarketDataAsset(asset)
        ? enrichStandardCryptoWithCanonicalScore(asset)
        : options.enrichAsset(asset),
      persistSnapshots: options.persistSnapshots,
      evaluateAlerts: options.evaluateAlerts,
      onProviderFailure: options.onProviderFailure,
    }),
  });
}

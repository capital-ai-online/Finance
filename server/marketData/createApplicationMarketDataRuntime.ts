import type { MarketDataAsset } from './marketDataCoordinator';
import type { StooqFallbackAsset } from './stooqProviderStage';
import { runMarketDataCompatibilityRefresh } from './marketDataCompatibilityFacade';
import { createMarketDataRuntimeFacade } from './marketDataRuntimeFacade';

const STOCK_TICKERS = ['AAPL.US', 'MSFT.US', 'GOOGL.US', 'AMZN.US', 'NVDA.US', 'TSLA.US', 'META.US', 'NFLX.US', 'AMD.US', 'INTC.US'];
const FOREX_TICKERS = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'AUDUSD'];
const COMMODITY_TICKERS = ['XAUUSD', 'XAGUSD', 'CL.F', 'NG.F', 'CO.F'];

export interface ApplicationMarketDataRuntimeOptions {
  fallbackAssets: StooqFallbackAsset[];
  registryAssets: () => MarketDataAsset[];
  enrichAsset: (asset: MarketDataAsset) => Promise<MarketDataAsset>;
  syncAsset: (asset: MarketDataAsset) => void;
  getCoinMarketCapApiKey?: () => string | undefined;
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
      getCoinMarketCapApiKey: options.getCoinMarketCapApiKey,
      registryAssets: options.registryAssets,
      enrichAsset: options.enrichAsset,
      persistSnapshots: options.persistSnapshots,
      evaluateAlerts: options.evaluateAlerts,
      onProviderFailure: options.onProviderFailure,
    }),
  });
}

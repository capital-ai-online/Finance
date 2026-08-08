import type { MarketDataAsset, MarketDataProviderStage } from './marketDataCoordinator';
import {
  INDEX_FMP_TICKERS,
  ensureIndexHistoryFresh,
  ensureIndexQuoteFresh,
  getCachedIndexQuote,
} from '../fmpIndices';

type FallbackAsset = MarketDataAsset & {
  price?: number;
  change24h?: number;
};

export interface FmpIndexStageDependencies {
  indexSymbols?: string[];
  ensureQuoteFresh?: (symbol: string) => Promise<void>;
  ensureHistoryFresh?: (symbol: string) => Promise<void>;
  getCachedQuote?: (symbol: string) => { price: number; change24h: number } | undefined;
  fallbackAssets: FallbackAsset[];
}

/**
 * FMP index provider stage.
 *
 * The underlying FMP adapter deliberately remains cache/cooldown aware. This stage never
 * blocks the full refresh waiting for every index. It triggers best-effort refreshes and
 * emits only indexes for which a usable cached quote exists. Missing indexes are completed
 * later by the coordinator's fallback-completion step.
 */
export function createFmpIndexProviderStage(
  dependencies: FmpIndexStageDependencies,
): MarketDataProviderStage {
  const indexSymbols = dependencies.indexSymbols ?? Object.keys(INDEX_FMP_TICKERS);
  const ensureQuote = dependencies.ensureQuoteFresh ?? ensureIndexQuoteFresh;
  const ensureHistory = dependencies.ensureHistoryFresh ?? ensureIndexHistoryFresh;
  const getQuote = dependencies.getCachedQuote ?? getCachedIndexQuote;

  return {
    name: 'fmp-indices',
    async load(): Promise<MarketDataAsset[]> {
      const liveAssets: MarketDataAsset[] = [];

      for (const symbol of indexSymbols) {
        // Preserve the existing non-blocking/cooldown-aware behavior: schedule refreshes,
        // then consume whatever valid cache state is already available for this cycle.
        void ensureQuote(symbol).catch(() => undefined);

        const quote = getQuote(symbol);
        if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) continue;

        const fallback = dependencies.fallbackAssets.find(
          (asset) => asset.symbol.toUpperCase() === symbol.toUpperCase(),
        );
        if (!fallback) continue;

        liveAssets.push({
          ...fallback,
          price: quote.price,
          change24h: Number.isFinite(quote.change24h) ? quote.change24h : 0,
          status: 'Verifiziert',
          dataSource: 'live',
        });

        // History population is also best-effort and must never block quote delivery.
        void ensureHistory(symbol).catch(() => undefined);
      }

      return liveAssets;
    },
  };
}

import type { MarketDataProviderStage } from './marketDataCoordinator';

export type StooqFallbackAsset = Record<string, any> & {
  symbol: string;
  type: string;
  price: number;
  change24h: number;
  volume24h?: number;
  score?: number;
};

/**
 * DATA fail-closed retirement guard.
 *
 * Stooq previously performed direct outbound HTTP outside the canonical MarketDataGateway and
 * returned compatibility fallback assets on failure. The productive network path is deliberately
 * disabled rather than hidden behind ENV/config, so importing this legacy factory cannot reactivate
 * provider egress or create live/scoring/execution evidence.
 *
 * Keep the factory temporarily as a compatibility symbol for callers/tests that may still import
 * it; it performs no I/O and returns no observations. A future Stooq reintroduction requires a
 * canonical MarketDataProvider adapter, ProviderMatrix authorization and MarketDataGateway routing.
 */
export const STOOQ_RUNTIME_ENABLED = false as const;

export function createStooqProviderStage(_options: {
  stockTickers: string[];
  forexTickers: string[];
  commodityTickers: string[];
  fallbackAssets: StooqFallbackAsset[];
  fetchImpl?: typeof fetch;
  logger?: Pick<Console, 'warn'>;
}): MarketDataProviderStage {
  return {
    name: 'stooq',
    async load() {
      return [];
    },
  };
}

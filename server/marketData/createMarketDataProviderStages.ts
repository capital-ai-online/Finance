import type { MarketDataProviderStage } from './marketDataCoordinator';
import { createCryptoMarketDataStage } from './cryptoMarketDataStage';
import type { StooqFallbackAsset } from './stooqProviderStage';
import { createFmpIndexProviderStage } from './fmpIndexProviderStage';

export function createMarketDataProviderStages(options: {
  fallbackAssets: StooqFallbackAsset[];
  stockTickers: string[];
  forexTickers: string[];
  commodityTickers: string[];
  fetchImpl?: typeof fetch;
  now?: () => number;
  logger?: Pick<Console, 'info' | 'warn'>;
  additionalStages?: MarketDataProviderStage[];
}): MarketDataProviderStage[] {
  return [
    createCryptoMarketDataStage({
      fallbackAssets: options.fallbackAssets,
      fetchImpl: options.fetchImpl,
      now: options.now,
      logger: options.logger,
    }),
    createFmpIndexProviderStage({
      fallbackAssets: options.fallbackAssets,
    }),
    ...(options.additionalStages ?? []),
  ];
}

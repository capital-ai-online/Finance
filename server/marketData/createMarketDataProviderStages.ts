import type { MarketDataProviderStage } from './marketDataCoordinator';
import { createCryptoProviderStage } from './cryptoProviderStage';
import { createStooqProviderStage, type StooqFallbackAsset } from './stooqProviderStage';

export function createMarketDataProviderStages(options: {
  fallbackAssets: StooqFallbackAsset[];
  stockTickers: string[];
  forexTickers: string[];
  commodityTickers: string[];
  fetchImpl?: typeof fetch;
  logger?: Pick<Console, 'info' | 'warn'>;
  additionalStages?: MarketDataProviderStage[];
}): MarketDataProviderStage[] {
  return [
    createCryptoProviderStage({
      fallbackAssets: options.fallbackAssets,
      fetchImpl: options.fetchImpl,
      logger: options.logger,
    }),
    createStooqProviderStage({
      stockTickers: options.stockTickers,
      forexTickers: options.forexTickers,
      commodityTickers: options.commodityTickers,
      fallbackAssets: options.fallbackAssets,
      fetchImpl: options.fetchImpl,
      logger: options.logger,
    }),
    ...(options.additionalStages ?? []),
  ];
}

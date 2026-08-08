import type { MarketDataProviderStage } from './marketDataCoordinator';
import { createCryptoPrimaryProviderStage } from './cryptoPrimaryProviderStage';
import { createCryptoProviderStage } from './cryptoProviderStage';
import type { CryptoFallbackAsset } from './cryptoProviderChain';

export function createCryptoMarketDataStage(options: {
  fallbackAssets: CryptoFallbackAsset[];
  getCoinMarketCapApiKey?: () => string | undefined;
  fetchImpl?: typeof fetch;
  now?: () => number;
  logger?: Pick<Console, 'info' | 'warn'>;
}): MarketDataProviderStage {
  const primary = createCryptoPrimaryProviderStage(options);
  const resilientFallback = createCryptoProviderStage(options);

  return {
    name: 'crypto-market-data',
    async load() {
      const primaryAssets = await primary.load();
      if (primaryAssets.length > 0) return primaryAssets;
      return resilientFallback.load();
    },
  };
}

import type { MarketDataProviderStage } from './marketDataCoordinator';
import { fetchCryptoMarketAssets, type CryptoFallbackAsset } from './cryptoProviderChain';

export function createCryptoProviderStage(options: {
  fallbackAssets: CryptoFallbackAsset[];
  fetchImpl?: typeof fetch;
  logger?: Pick<Console, 'info' | 'warn'>;
}): MarketDataProviderStage {
  return {
    name: 'crypto-live-chain',
    async load() {
      const result = await fetchCryptoMarketAssets(options);
      return result.assets as Array<Record<string, any> & { symbol: string; type: string; dataSource?: 'live' | 'fallback' }>;
    },
  };
}

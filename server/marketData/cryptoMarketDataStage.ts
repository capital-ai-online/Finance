import type { MarketDataProviderStage } from './marketDataCoordinator';
import { createCryptoProviderStage } from './cryptoProviderStage';
import type { CryptoFallbackAsset } from './cryptoProviderChain';

/**
 * Startup/background crypto enrichment intentionally excludes CoinGecko.
 * CoinGecko-specific adapters remain available to explicit on-demand evidence paths,
 * but application startup uses the resilient Binance → Kraken → Coinbase chain only.
 */
export function createCryptoMarketDataStage(options: {
  fallbackAssets: CryptoFallbackAsset[];
  fetchImpl?: typeof fetch;
  now?: () => number;
  logger?: Pick<Console, 'info' | 'warn'>;
}): MarketDataProviderStage {
  const resilientExchangeStage = createCryptoProviderStage(options);

  return {
    // Preserve the canonical coordinator contract while changing only its provider chain.
    name: 'crypto-market-data',
    load: () => resilientExchangeStage.load(),
  };
}

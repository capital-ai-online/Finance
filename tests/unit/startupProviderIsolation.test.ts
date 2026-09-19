import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

describe('startup provider isolation', () => {
  it('keeps Alpaca out of active server startup and health readiness wiring', () => {
    const application = read('../../server.application.ts');
    expect(application).not.toContain('runAlpacaShadowStartupSmoke');
    expect(application).not.toContain('isAlpacaConfigured');
    expect(application).not.toMatch(/\balpaca\s*:/);
  });

  it('keeps CoinGecko out of startup while preserving the coordinator stage identity', () => {
    const stage = read('../../server/marketData/cryptoMarketDataStage.ts');
    expect(stage).not.toContain('createCryptoPrimaryProviderStage');
    expect(stage).not.toMatch(/coingecko\.com/i);
    expect(stage).toContain("name: 'crypto-market-data'");
    expect(stage).toContain('createCryptoProviderStage');
  });

  it('preserves explicit on-demand Alpaca and CoinGecko evidence providers', () => {
    const alpaca = read('../../src/services/alpacaShadowProvider.ts');
    const coinGecko = read('../../src/platform/MarketData/providers/CoinGeckoMarketDataProvider.ts');
    const quote = read('../../src/services/cryptoQuoteEvidence.ts');

    expect(alpaca).toContain('export async function observeAlpacaStockQuote');
    expect(coinGecko).toContain('export class CoinGeckoMarketDataProvider');
    expect(quote).toContain('fetchVerifiedCryptoQuote');
    expect(quote).toContain("allowedProviderIds: ['coingecko']");
  });
});

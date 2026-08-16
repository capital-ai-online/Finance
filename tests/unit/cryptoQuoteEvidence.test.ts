import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CRYPTO_QUOTE_CONTRACT_VERSION,
  fetchVerifiedCryptoQuote,
  resetCryptoQuoteGatewayForTests,
} from '../../src/services/cryptoQuoteEvidence';
import { CoinGeckoMarketDataProvider } from '../../src/platform/MarketData/providers/CoinGeckoMarketDataProvider';
import { resetProviderHealth } from '../../src/platform/Supervisor/providerHealth';

beforeEach(() => {
  resetCryptoQuoteGatewayForTests();
  resetProviderHealth();
});

describe('SC-5 CoinGeckoMarketDataProvider', () => {
  it('returns LIVE snapshot for mapped symbol with injected fetch', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        bitcoin: { usd: 65000.5, last_updated_at: 1_724_000_000 },
      }),
    })) as unknown as typeof fetch;

    const provider = new CoinGeckoMarketDataProvider({
      fetchImpl,
      nowMs: () => 1_724_000_100_000,
    });
    const snapshot = await provider.getSnapshot({
      symbol: 'BTC',
      assetClass: 'crypto',
      correlationId: 't1',
    });
    expect(snapshot.qualityState).toBe('LIVE');
    expect(snapshot.price).toBe(65000.5);
    expect(snapshot.currency).toBe('USD');
    expect(snapshot.provider).toBe('CoinGecko');
    expect(snapshot.evidenceId).toContain('coingecko');
  });

  it('fail-closed UNAVAILABLE for unmapped symbol without network', async () => {
    const provider = new CoinGeckoMarketDataProvider({
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });
    const snapshot = await provider.getSnapshot({
      symbol: 'UNKNOWNXYZ',
      assetClass: 'crypto',
      correlationId: 't2',
    });
    expect(snapshot.qualityState).toBe('UNAVAILABLE');
    expect(snapshot.price).toBeNull();
    expect(snapshot.reason).toMatch(/No approved CoinGecko mapping/);
  });

  it('rejects non-crypto assetClass', async () => {
    const provider = new CoinGeckoMarketDataProvider();
    const snapshot = await provider.getSnapshot({
      symbol: 'BTC',
      assetClass: 'stock',
      correlationId: 't3',
    });
    expect(snapshot.qualityState).toBe('UNAVAILABLE');
    expect(snapshot.reason).toMatch(/does not support assetClass/);
  });
});

describe('SC-5 fetchVerifiedCryptoQuote', () => {
  it('returns READY through gateway for mapped symbol', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ethereum: { usd: 3200, last_updated_at: 1_724_000_000 },
      }),
    })) as unknown as typeof fetch;

    const quote = await fetchVerifiedCryptoQuote('ETH', {
      fetchImpl,
      nowMs: () => 1_724_000_050_000,
    });
    expect(quote.contractVersion).toBe(CRYPTO_QUOTE_CONTRACT_VERSION);
    expect(quote.status).toBe('READY');
    expect(quote.price).toBe(3200);
    expect(quote.provider).toBe('CoinGecko');
    expect(quote.alertEligible).toBe(true);
    expect(quote.executionPriceEligible).toBe(false);
    expect(quote.gatewaySource).toBe('provider');
  });

  it('returns UNSUPPORTED_ASSET for unmapped symbol', async () => {
    const quote = await fetchVerifiedCryptoQuote('NOTACOIN', {
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });
    expect(quote.status).toBe('UNSUPPORTED_ASSET');
    expect(quote.price).toBeNull();
    expect(quote.alertEligible).toBe(false);
  });

  it('returns SOURCE_UNAVAILABLE on upstream failure without synthetic price', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;

    const quote = await fetchVerifiedCryptoQuote('BTC', { fetchImpl });
    expect(quote.status).toBe('SOURCE_UNAVAILABLE');
    expect(quote.price).toBeNull();
    expect(quote.providers).toEqual([]);
  });
});

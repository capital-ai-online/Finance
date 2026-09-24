import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CRYPTO_QUOTE_CONTRACT_VERSION,
  fetchVerifiedCryptoQuote,
  resetCryptoQuoteGatewayForTests,
} from '../../src/services/cryptoQuoteEvidence';
import { CoinGeckoMarketDataProvider } from '../../src/platform/MarketData/providers/CoinGeckoMarketDataProvider';
import { resetProviderHealth } from '../../src/platform/Supervisor/providerHealth';

/** SC-5 Phase C — coins/{id}?market_data=true shape used by the gateway provider. */
function coinsPayload(overrides: Record<string, unknown> = {}) {
  return {
    market_data: {
      current_price: { usd: 65000.5 },
      market_cap: { usd: 1_280_000_000_000 },
      total_volume: { usd: 32_000_000_000 },
      circulating_supply: 19_700_000,
      max_supply: 21_000_000,
      total_supply: 19_700_000,
      last_updated: '2024-08-18T12:00:00.000Z',
      ...overrides,
    },
  };
}

beforeEach(() => {
  resetCryptoQuoteGatewayForTests();
  resetProviderHealth();
});

describe('SC-5 CoinGeckoMarketDataProvider', () => {
  it('returns LIVE snapshot with multi-field market data for mapped symbol', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => coinsPayload(),
    })) as unknown as typeof fetch;

    const provider = new CoinGeckoMarketDataProvider({
      fetchImpl,
      nowMs: () => Date.parse('2024-08-18T12:00:10.000Z'),
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
    expect(snapshot.providerFeed).toBe('coins/market_data');
    expect(snapshot.sourceTimestamp).toBe('2024-08-18T12:00:00.000Z');
    expect(snapshot.evidenceId).toContain('coingecko');
    expect(snapshot.marketCapUsd).toBe(1_280_000_000_000);
    expect(snapshot.volume24hUsd).toBe(32_000_000_000);
    expect(snapshot.circulatingSupply).toBe(19_700_000);
    expect(snapshot.maxSupply).toBe(21_000_000);
    expect(snapshot.totalSupply).toBe(19_700_000);
  });

  it('maps max_supply null as null (not undefined)', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () =>
        coinsPayload({
          current_price: { usd: 3200 },
          max_supply: null,
          market_cap: { usd: 400_000_000_000 },
          total_volume: { usd: 20_000_000_000 },
          circulating_supply: 120_000_000,
          total_supply: 120_000_000,
        }),
    })) as unknown as typeof fetch;

    const provider = new CoinGeckoMarketDataProvider({ fetchImpl });
    const snapshot = await provider.getSnapshot({
      symbol: 'ETH',
      assetClass: 'crypto',
      correlationId: 't1b',
    });
    expect(snapshot.qualityState).toBe('LIVE');
    expect(snapshot.maxSupply).toBeNull();
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
    expect(snapshot.marketCapUsd).toBeUndefined();
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

  it('fail-closed when market_data is missing', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    const provider = new CoinGeckoMarketDataProvider({ fetchImpl });
    const snapshot = await provider.getSnapshot({
      symbol: 'BTC',
      assetClass: 'crypto',
      correlationId: 't4',
    });
    expect(snapshot.qualityState).toBe('UNAVAILABLE');
    expect(snapshot.price).toBeNull();
    expect(snapshot.reason).toMatch(/missing market_data/);
  });

  it('erfindet bei fehlender Provider-Zeit keinen sourceTimestamp', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => coinsPayload({ last_updated: undefined }),
    })) as unknown as typeof fetch;

    const provider = new CoinGeckoMarketDataProvider({
      fetchImpl,
      nowMs: () => Date.parse('2024-08-18T12:00:10.000Z'),
    });
    const snapshot = await provider.getSnapshot({
      symbol: 'BTC',
      assetClass: 'crypto',
      correlationId: 't-missing-time',
    });
    expect(snapshot).toMatchObject({
      qualityState: 'UNAVAILABLE',
      price: null,
      sourceTimestamp: null,
      evidenceId: null,
    });
    expect(snapshot.reason).toMatch(/no valid source timestamp/);
  });
});

describe('SC-5 fetchVerifiedCryptoQuote', () => {
  it('uses Twelve Data USD quote as a gateway fallback without exposing the key', async () => {
    const urls: string[] = [];
    const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
      urls.push(input);
      if (input.includes('coingecko')) return new Response(null, { status: 429 });
      expect(init?.headers).toMatchObject({ Authorization: 'apikey test-twelve' });
      return new Response(JSON.stringify({
        close: '65000', currency: 'USD', datetime: '2026-09-24T12:00:00Z',
        exchange: 'Crypto',
      }), { status: 200 });
    }) as unknown as typeof fetch;
    const quote = await fetchVerifiedCryptoQuote('BTC', {
      fetchImpl,
      apiKey: '',
      twelveDataApiKey: 'test-twelve',
      nowMs: () => Date.parse('2026-09-24T12:00:01Z'),
    });
    expect(quote).toMatchObject({
      status: 'READY', price: 65000, currency: 'USD',
      provider: 'TwelveData', providers: ['TwelveData'], executionPriceEligible: false,
      sourcePath: 'https://api.twelvedata.com/quote',
    });
    expect(urls).toHaveLength(2);
    expect(urls[1]).toContain('timezone=UTC');
    expect(JSON.stringify(quote)).not.toContain('test-twelve');
  });
  it('returns READY through gateway for mapped symbol', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () =>
        coinsPayload({
          current_price: { usd: 3200 },
          market_cap: { usd: 400_000_000_000 },
          total_volume: { usd: 15_000_000_000 },
          circulating_supply: 120_000_000,
          max_supply: null,
          total_supply: 120_000_000,
        }),
    })) as unknown as typeof fetch;

    const quote = await fetchVerifiedCryptoQuote('ETH', {
      fetchImpl,
      nowMs: () => Date.parse('2024-08-18T12:00:05.000Z'),
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

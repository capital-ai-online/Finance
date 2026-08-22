import { describe, expect, it, vi } from 'vitest';
import { ResearchEvidenceProviderHttp } from '../../src/platform/MarketData/providers/ResearchEvidenceProviderHttp';
import { GoPlusTokenSecurityProvider } from '../../src/platform/MarketData/providers/GoPlusTokenSecurityProvider';
import { DuneQueryEvidenceProvider } from '../../src/platform/MarketData/providers/DuneQueryEvidenceProvider';
import { GdeltNewsEvidenceProvider } from '../../src/platform/MarketData/providers/GdeltNewsEvidenceProvider';
import { BinancePublicAnalyticsProvider } from '../../src/platform/MarketData/providers/BinancePublicAnalyticsProvider';
import { KrakenFuturesAnalyticsProvider } from '../../src/platform/MarketData/providers/KrakenFuturesAnalyticsProvider';
import { DexScreenerTokenEvidenceProvider } from '../../src/platform/MarketData/providers/DexScreenerTokenEvidenceProvider';
import {
  PROVIDER_MATRIX,
  getProviderMatrixEntry,
  providersBehindGateway,
  rateLimitOverridesFromMatrix,
} from '../../src/platform/MarketData/ProviderMatrix';

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('SC4 free-tier crypto evidence providers', () => {
  it('keeps every active evidence provider outside MarketDataGateway routing', () => {
    const ids = ['binance-public', 'kraken-futures-public', 'goplus', 'dexscreener', 'sourcify', 'dune', 'gdelt'];
    for (const id of ids) {
      const entry = getProviderMatrixEntry(id);
      expect(entry).toBeDefined();
      expect(entry?.enabled).toBe(true);
      expect(entry?.gatewayStatus).toBe('not_wired');
      expect(rateLimitOverridesFromMatrix()[id]).toBeUndefined();
      expect(providersBehindGateway().some(item => item.id === id)).toBe(false);
    }
    expect(getProviderMatrixEntry('binance-public')?.role).toBe('primary');
    expect(getProviderMatrixEntry('kraken-futures-public')?.role).toBe('primary');
    for (const removed of ['coinglass', 'lunarcrush', 'newsapi', 'messari']) expect(getProviderMatrixEntry(removed)).toBeUndefined();
    expect(new Set(PROVIDER_MATRIX.map(item => item.id)).size).toBe(PROVIDER_MATRIX.length);
  });

  it('fails closed before transport when a key-required provider has no key', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({ ok: true }));
    const http = new ResearchEvidenceProviderHttp('dune', 'onchain', {
      baseUrl: 'https://provider.example', apiKey: null, fetchImpl: fetchImpl as unknown as typeof fetch,
      nowMs: () => Date.parse('2026-08-22T05:00:00.000Z'),
    });
    const result = await http.requestJson('/data');
    expect(result.status).toBe('NOT_CONFIGURED');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('supports an explicitly governed keyless provider without Authorization header', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({ code: 1, result: {} }));
    const http = new ResearchEvidenceProviderHttp('goplus', 'security', {
      baseUrl: 'https://provider.example', apiKey: null, apiKeyRequired: false,
      fetchImpl: fetchImpl as unknown as typeof fetch, nowMs: () => Date.parse('2026-08-22T05:00:00.000Z'),
    });
    const result = await http.requestJson('/security');
    expect(result.status).toBe('READY');
    const headers = (fetchImpl.mock.calls[0]?.[1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('allows GoPlus public Security API operation without a configured key', async () => {
    const contractAddress = '0x1111111111111111111111111111111111111111';
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({ code: 1, result: { [contractAddress]: { is_open_source: '1', is_proxy: '0', is_mintable: '0', is_honeypot: '0', holders: [], lp_holders: [] } } }));
    const provider = new GoPlusTokenSecurityProvider({ env: {}, fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: 'https://provider.example', nowMs: () => Date.parse('2026-08-22T05:00:00.000Z') });
    const result = await provider.getTokenSecurity({ chainId: '1', contractAddress });
    expect(result.status).toBe('VERIFIED');
    expect(result.isOpenSource).toBe(true);
    expect(result.isHoneypot).toBe(false);
  });

  it('blocks Dune FREE_TIER before transport until attestation is explicit', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({ result: { rows: [{ value: 1 }] } }));
    const provider = new DuneQueryEvidenceProvider({
      apiKey: 'test-key', allowedQueryIds: [123], accessMode: 'FREE_TIER', freeTierAttested: false,
      fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: 'https://provider.example',
    });
    const result = await provider.getLatestSavedQuery(123, ['value']);
    expect(result.status).toBe('POLICY_BLOCKED');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects ungoverned Dune query IDs before any network call', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({ result: { rows: [{ value: 1 }] } }));
    const provider = new DuneQueryEvidenceProvider({
      apiKey: 'test-key', allowedQueryIds: [123], accessMode: 'FREE_TIER', freeTierAttested: true,
      fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: 'https://provider.example',
    });
    const result = await provider.getLatestSavedQuery(999, ['value']);
    expect(result.status).toBe('QUERY_NOT_GOVERNED');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('allows only an attested active Dune 14-day trial window', async () => {
    const now = Date.parse('2026-08-22T10:00:00.000Z');
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({ execution_id: 'exec-1', result: { rows: [{ value: 1 }] } }));
    const provider = new DuneQueryEvidenceProvider({
      apiKey: 'test-key', allowedQueryIds: [123], accessMode: 'TRIAL_14D', trialAttested: true,
      trialStartedAt: '2026-08-20T00:00:00.000Z', trialEndsAt: '2026-09-03T00:00:00.000Z', nowMs: () => now,
      fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: 'https://provider.example',
    });
    const result = await provider.getLatestSavedQuery(123, ['value']);
    expect(result.status).toBe('VERIFIED');
    expect(result.accessMode).toBe('TRIAL_14D');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('fails closed when the Dune trial expired or exceeds fourteen days', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({ execution_id: 'exec-1', result: { rows: [{ value: 1 }] } }));
    const expired = new DuneQueryEvidenceProvider({
      apiKey: 'test-key', allowedQueryIds: [123], accessMode: 'TRIAL_14D', trialAttested: true,
      trialStartedAt: '2026-08-01T00:00:00.000Z', trialEndsAt: '2026-08-15T00:00:00.000Z', nowMs: () => Date.parse('2026-08-22T00:00:00.000Z'),
      fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: 'https://provider.example',
    });
    expect((await expired.getLatestSavedQuery(123, ['value'])).status).toBe('POLICY_BLOCKED');

    const tooLong = new DuneQueryEvidenceProvider({
      apiKey: 'test-key', allowedQueryIds: [123], accessMode: 'TRIAL_14D', trialAttested: true,
      trialStartedAt: '2026-08-20T00:00:00.000Z', trialEndsAt: '2026-09-04T00:00:01.000Z', nowMs: () => Date.parse('2026-08-22T00:00:00.000Z'),
      fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: 'https://provider.example',
    });
    const result = await tooLong.getLatestSavedQuery(123, ['value']);
    expect(result.status).toBe('POLICY_BLOCKED');
    expect(result.reason).toMatch(/14-day/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('bounds Dune latest-result reads and fails closed on schema drift', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({ execution_id: 'exec-1', result: { rows: [{ wrong_column: 1 }] } }));
    const provider = new DuneQueryEvidenceProvider({
      apiKey: 'test-key', allowedQueryIds: [123], accessMode: 'FREE_TIER', freeTierAttested: true, maxResultRows: 25,
      fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: 'https://provider.example',
    });
    const result = await provider.getLatestSavedQuery(123, ['required_column']);
    expect(result.status).toBe('INVALID');
    expect(result.reason).toMatch(/schema drift/i);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain('limit=25');
  });

  it('projects Binance public futures analytics without an API key', async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, _init?: RequestInit) => {
      const text = String(url);
      if (text.includes('/openInterest?')) return jsonResponse({ openInterest: '10', time: 1_776_744_000_000 });
      if (text.includes('/premiumIndex?')) return jsonResponse({ lastFundingRate: '0.0001', markPrice: '50000', indexPrice: '49990', time: 1_776_744_000_000 });
      return jsonResponse({ bids: [['50000', '2'], ['49750', '1']], asks: [['50010', '2'], ['50250', '1']] });
    });
    const provider = new BinancePublicAnalyticsProvider({ fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: 'https://provider.example', nowMs: () => Date.parse('2026-08-22T05:00:00.000Z') });
    const result = await provider.getAnalytics('BTCUSDT');
    expect(result.status).toBe('VERIFIED');
    expect(result.openInterest).toBe(10);
    expect(result.fundingRate).toBe(0.0001);
    expect(result.markPrice).toBe(50000);
    expect(result.bidDepthUsd1Pct).toBeGreaterThan(0);
    const headers = (fetchImpl.mock.calls[0]?.[1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('projects GDELT article metadata without a key', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({ articles: [{ title: 'Bitcoin market update', url: 'https://publisher.example/story', domain: 'publisher.example', seendate: '20260822T050000Z', language: 'English', sourcecountry: 'United States' }] }));
    const provider = new GdeltNewsEvidenceProvider({ fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: 'https://provider.example', nowMs: () => Date.parse('2026-08-22T05:00:00.000Z') });
    const result = await provider.searchArticles('bitcoin', 10, '1d');
    expect(result.status).toBe('VERIFIED');
    expect(result.articles[0]).toMatchObject({ sourceName: 'publisher.example', title: 'Bitcoin market update' });
  });

  it('projects keyless Kraken Futures analytics conservatively', async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, _init?: RequestInit) => {
      const text = String(url);
      if (text.includes('/open-interest?')) return jsonResponse({ result: { timestamp: [1_776_744_000], data: [100, 110] } });
      if (text.includes('/funding?')) return jsonResponse({ result: { timestamp: [1_776_744_000], data: { rate: [[0, 0, 0, '0.001']] } } });
      if (text.includes('/liquidation-volume?')) return jsonResponse({ result: { timestamp: [1_776_744_000], data: [5, 6] } });
      if (text.includes('/liquidity?')) return jsonResponse({ result: { timestamp: [1_776_744_000], data: { bid: { liquidity_01: ['1000'] }, ask: { liquidity_01: ['1200'] } } } });
      return jsonResponse({ result: { timestamp: [1_776_744_000], data: { bid: { slippage_100k: ['0.002'] }, ask: { slippage_100k: ['0.003'] } } } });
    });
    const provider = new KrakenFuturesAnalyticsProvider({ fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: 'https://provider.example', nowMs: () => Date.parse('2026-08-22T05:00:00.000Z') });
    const result = await provider.getAnalytics('PI_XBTUSD');
    expect(result.status).toBe('VERIFIED');
    expect(result.openInterest).toBe(110);
    expect(result.openInterestChangePct).toBe(10);
    expect(result.fundingRate).toBe(0.001);
  });

  it('projects DEX Screener evidence only for governed token identity', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse([{ pairAddress: 'pair-1', liquidity: { usd: 250000 }, volume: { h24: 500000 }, txns: { h24: { buys: 100, sells: 80 } }, pairCreatedAt: 1_700_000_000_000 }]));
    const provider = new DexScreenerTokenEvidenceProvider({ fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: 'https://provider.example' });
    const result = await provider.getTokenPairs('solana', 'So11111111111111111111111111111111111111112');
    expect(result.status).toBe('VERIFIED');
    expect(result.bestPairLiquidityUsd).toBe(250000);
  });
});

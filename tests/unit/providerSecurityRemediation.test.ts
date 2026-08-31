import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMarketDataProviderStages } from '../../server/marketData/createMarketDataProviderStages';
import { runMarketDataCompatibilityRefresh } from '../../server/marketData/marketDataCompatibilityFacade';
import { createStooqProviderStage, STOOQ_RUNTIME_ENABLED } from '../../server/marketData/stooqProviderStage';
import { getProviderMatrixEntry, PROVIDER_MATRIX, providersLegacyOffGateway } from '../../src/platform/MarketData/ProviderMatrix';
import { redactProviderCredentialText } from '../../src/platform/MarketData/providerCredentialRedaction';
import { EODHDMarketDataProvider } from '../../src/platform/MarketData/providers/EODHDMarketDataProvider';
import { ResearchEvidenceProviderHttp } from '../../src/platform/MarketData/providers/ResearchEvidenceProviderHttp';
import { getProviderHealth, resetProviderHealth } from '../../src/platform/Supervisor/providerHealth';
import {
  getCryptoSpotConsensus,
  isCryptoSpotConsensusProviderAuthorized,
} from '../../src/services/cryptoSpotConsensus';
import { getMarketDataProviderRegistry } from '../../src/services/marketDataProviderRegistry';

const FAKE_CREDENTIAL = 'unit-test-credential-not-a-secret';

beforeEach(() => resetProviderHealth());

describe('DATA legacy provider retirement', () => {
  it('cannot perform Stooq network I/O even when the legacy factory is imported directly', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network must not be reached');
    }) as unknown as typeof fetch;
    const stage = createStooqProviderStage({
      stockTickers: ['AAPL'],
      forexTickers: ['EURUSD'],
      commodityTickers: ['GC=F'],
      fallbackAssets: [{ symbol: 'AAPL', type: 'stock', price: 100, change24h: 1 }],
      fetchImpl,
    });

    expect(STOOQ_RUNTIME_ENABLED).toBe(false);
    expect(await stage.load()).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('is absent from productive stage composition and synchronized as disabled/not_wired', () => {
    const stages = createMarketDataProviderStages({
      fallbackAssets: [], stockTickers: [], forexTickers: [], commodityTickers: [],
    });
    expect(stages.map(stage => stage.name)).not.toContain('stooq');
    expect(getProviderMatrixEntry('stooq')).toMatchObject({ enabled: false, gatewayStatus: 'not_wired' });
    expect(providersLegacyOffGateway().some(entry => entry.id === 'stooq')).toBe(false);
    expect(getMarketDataProviderRegistry().find(entry => entry.id === 'Stooq')).toMatchObject({
      enabled: false,
      activation: 'reference-only',
    });
  });

  it('does not let fallback compatibility metadata inherit score or execution authority', async () => {
    const enrichAsset = vi.fn(async (asset: any) => asset);
    const persistSnapshots = vi.fn(async () => undefined);
    const evaluateAlerts = vi.fn(async () => undefined);
    const [asset] = await runMarketDataCompatibilityRefresh({
      fallbackAssets: [],
      stockTickers: [],
      forexTickers: [],
      commodityTickers: [],
      providerStages: [],
      registryAssets: () => [{
        symbol: 'AAPL',
        type: 'stock',
        price: 100,
        change24h: 1,
        score: 88,
        scoreEligible: true,
        scoringEligible: true,
        executionEligible: true,
        executionPriceEligible: true,
      } as any],
      enrichAsset,
      persistSnapshots,
      evaluateAlerts,
    });

    expect(asset.dataSource).toBe('fallback');
    expect(asset.status).toBe('Fallback');
    expect(asset.score).toBeUndefined();
    expect((asset as any).scoreEligible).toBeUndefined();
    expect((asset as any).scoringEligible).toBeUndefined();
    expect((asset as any).executionEligible).toBeUndefined();
    expect((asset as any).executionPriceEligible).toBeUndefined();
    expect(enrichAsset).not.toHaveBeenCalled();
    expect(persistSnapshots).not.toHaveBeenCalled();
    expect(evaluateAlerts).not.toHaveBeenCalled();
  });

  it('contains no hidden ENV/config or direct host bypass in the retired Stooq stage', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'server/marketData/stooqProviderStage.ts'), 'utf8');
    expect(source).not.toContain('stooq.com');
    expect(source).not.toContain('process.env');
    expect(source).not.toMatch(/\bfetch\s*\(/);
  });
});

describe('DATA provider credential redaction', () => {
  it('redacts query credential parameters from arbitrary error text', () => {
    const input = `request failed https://provider.example/data?api_key=${FAKE_CREDENTIAL}&api_token=${FAKE_CREDENTIAL}`;
    const redacted = redactProviderCredentialText(input);
    expect(redacted).not.toContain(FAKE_CREDENTIAL);
    expect(redacted).toContain('api_key=[REDACTED]');
    expect(redacted).toContain('api_token=[REDACTED]');
  });

  it('does not expose research-provider query credentials through result or provider-health diagnostics', async () => {
    const transport = new ResearchEvidenceProviderHttp('eia', 'commodity-fundamentals', {
      baseUrl: 'https://api.eia.gov/v2',
      apiKeyRequired: false,
      fetchImpl: (async (input: RequestInfo | URL) => {
        throw new Error(`transport failure ${String(input)}`);
      }) as unknown as typeof fetch,
    });
    const result = await transport.requestJson(`/seriesid/test?api_key=${FAKE_CREDENTIAL}`);
    expect(result.reason).not.toContain(FAKE_CREDENTIAL);
    expect(JSON.stringify(getProviderHealth())).not.toContain(FAKE_CREDENTIAL);
  });

  it('does not expose EODHD query credentials through canonical unavailable evidence', async () => {
    const provider = new EODHDMarketDataProvider({
      apiKey: FAKE_CREDENTIAL,
      fetchImpl: (async (input: RequestInfo | URL) => {
        throw new Error(`transport failure ${String(input)}`);
      }) as unknown as typeof fetch,
      nowMs: () => Date.parse('2026-08-31T18:00:00.000Z'),
    });
    const result = await provider.getSnapshot({
      symbol: 'BTC', assetClass: 'crypto', correlationId: 'credential-redaction', maxAgeMs: 300_000,
    });
    expect(result.qualityState).toBe('UNAVAILABLE');
    expect(result.reason).not.toContain(FAKE_CREDENTIAL);
    expect(result.price).toBeNull();
    expect(result.evidenceId).toBeNull();
  });
});

describe('DATA gateway-governed crypto spot consensus', () => {
  it('denies unknown, disabled and shadow providers', () => {
    expect(isCryptoSpotConsensusProviderAuthorized('unknown-provider')).toBe(false);
    expect(isCryptoSpotConsensusProviderAuthorized('stooq')).toBe(false);
    expect(isCryptoSpotConsensusProviderAuthorized('alpaca')).toBe(false);
  });

  it('forms current consensus through gateway sources only and excludes historical EODHD', async () => {
    const now = Date.parse('2026-08-31T18:00:00.000Z');
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('rest.coinapi.io')) {
        return new Response(JSON.stringify({ time: '2026-08-31T17:59:50.000Z', rate: 100 }), { status: 200 });
      }
      if (url.includes('api.twelvedata.com')) {
        return new Response(JSON.stringify({ datetime: '2026-08-31T17:59:55.000Z', close: '100.50', currency: 'USD' }), { status: 200 });
      }
      if (url.includes('eodhd.com')) {
        return new Response(JSON.stringify([{ date: '2026-08-30', close: 99 }]), { status: 200 });
      }
      throw new Error('unexpected provider URL');
    }) as unknown as typeof fetch;

    const result = await getCryptoSpotConsensus('BTC', {
      fetchImpl,
      nowMs: () => now,
      apiKeys: {
        coinapi: 'unit-test-coinapi-key',
        twelvedata: 'unit-test-twelvedata-key',
        eodhd: 'unit-test-eodhd-key',
      },
    });

    expect(result.status).toBe('CONSENSUS');
    expect(result.providers).toEqual(expect.arrayContaining(['CoinAPI', 'TwelveData']));
    expect(result.providers).not.toContain('EODHD');
    expect(result.observations.every(observation => Boolean(observation.evidenceId))).toBe(true);
  });

  it('fails closed when current gateway quorum is insufficient', async () => {
    const now = Date.parse('2026-08-31T18:00:00.000Z');
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('rest.coinapi.io')) {
        return new Response(JSON.stringify({ time: '2026-08-31T17:59:50.000Z', rate: 100 }), { status: 200 });
      }
      if (url.includes('api.twelvedata.com')) {
        return new Response(JSON.stringify({ status: 'error', message: 'source unavailable' }), { status: 503 });
      }
      if (url.includes('eodhd.com')) {
        return new Response(JSON.stringify([{ date: '2026-08-30', close: 99 }]), { status: 200 });
      }
      throw new Error('unexpected provider URL');
    }) as unknown as typeof fetch;

    const result = await getCryptoSpotConsensus('BTC', {
      fetchImpl,
      nowMs: () => now,
      apiKeys: {
        coinapi: 'unit-test-coinapi-key',
        twelvedata: 'unit-test-twelvedata-key',
        eodhd: 'unit-test-eodhd-key',
      },
    });

    expect(result.status).toBe('INSUFFICIENT_SOURCES');
    expect(result.canonicalValue).toBeNull();
    expect(result.providers).toEqual(['CoinAPI']);
    expect(result.providers).not.toContain('EODHD');
  });

  it('fails closed on matrix/runtime descriptor mismatch', async () => {
    const coinapi = getProviderMatrixEntry('coinapi')!;
    const originalRole = coinapi.role;
    try {
      (coinapi as { role: typeof coinapi.role }).role = 'primary';
      await expect(getCryptoSpotConsensus('BTC', {
        fetchImpl: vi.fn() as unknown as typeof fetch,
        apiKeys: { coinapi: 'unit-test-key' },
      })).rejects.toThrow('CRYPTO_SPOT_PROVIDER_REGISTRY_MISMATCH:coinapi');
    } finally {
      (coinapi as { role: typeof coinapi.role }).role = originalRole;
    }
  });

  it('has no alternative direct-provider consumer path in the consensus adapter surface', () => {
    const consensusSource = fs.readFileSync(path.join(process.cwd(), 'src/services/cryptoSpotConsensus.ts'), 'utf8');
    const adapterSource = fs.readFileSync(path.join(process.cwd(), 'src/services/externalSpotPriceAdapters.ts'), 'utf8');
    for (const source of [consensusSource, adapterSource]) {
      expect(source).not.toContain('rest.coinapi.io');
      expect(source).not.toContain('api.twelvedata.com');
      expect(source).not.toContain('eodhd.com');
    }
    expect(adapterSource).not.toContain('process.env');
    expect(adapterSource).not.toMatch(/\bfetch\s*\(/);
    expect(consensusSource).toContain('MarketDataGateway');
    expect(consensusSource).toContain('allowedProviderIds');
  });
});

describe('DATA provider registry/runtime invariants', () => {
  it('does not retain any enabled legacy_off_gateway provider', () => {
    expect(PROVIDER_MATRIX.filter(entry => entry.enabled && entry.gatewayStatus === 'legacy_off_gateway')).toEqual([]);
  });

  it('keeps Alpha Vantage on the canonical credential identity only', () => {
    const alpha = getMarketDataProviderRegistry().find(entry => entry.id === 'AlphaVantage');
    expect(alpha).toMatchObject({
      enabled: true,
      activation: 'active',
      environmentVariable: 'ALPHA_VANTAGE_API_KEY',
    });
    expect(JSON.stringify(alpha)).not.toContain('ALPHA_VANTAGE_KEY');
  });
});

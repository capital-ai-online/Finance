import { describe, expect, it } from 'vitest';
import {
  evaluateVerifiedCryptoTechnicalScore,
  normalizeHistoryDateToIso,
} from '../../src/services/verifiedCryptoTechnicalScoring';

function makeHistory(count = 30) {
  const start = Date.UTC(2026, 6, 4);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start + index * 24 * 60 * 60 * 1000);
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const yy = String(date.getUTCFullYear()).slice(-2);
    const trend = 3000 + index * 18;
    const wave = Math.sin(index / 3) * 35;
    return { date: `${dd}.${mm}.${yy}`, close: Number((trend + wave).toFixed(2)) };
  });
}

const historyProvider = async () => ({
  provider: 'CoinGecko' as const,
  points: makeHistory(),
  retrievedAt: '2026-08-02T06:00:00.000Z',
  cacheMode: 'fresh' as const,
  degraded: false,
});

const snapshotProvider = async () => ({
  symbol: 'ETH',
  provider: 'CoinGecko' as const,
  observedAt: '2026-08-02T06:00:00.000Z',
  retrievedAt: '2026-08-02T06:00:01.000Z',
  marketCapUsd: 400_000_000_000,
  volume24hUsd: 20_000_000_000,
  circulatingSupply: 120_000_000,
  maxSupply: null,
  totalSupply: 120_000_000,
  cacheMode: 'fresh' as const,
  degraded: false,
  provenance: {
    marketCapUsd: { field: 'marketCapUsd' as const, provider: 'CoinGecko' as const, sourcePath: 'market_data.market_cap.usd', observedAt: '2026-08-02T06:00:00.000Z', retrievedAt: '2026-08-02T06:00:01.000Z', value: 400_000_000_000, unit: 'USD' as const },
    volume24hUsd: { field: 'volume24hUsd' as const, provider: 'CoinGecko' as const, sourcePath: 'market_data.total_volume.usd', observedAt: '2026-08-02T06:00:00.000Z', retrievedAt: '2026-08-02T06:00:01.000Z', value: 20_000_000_000, unit: 'USD' as const },
    circulatingSupply: { field: 'circulatingSupply' as const, provider: 'CoinGecko' as const, sourcePath: 'market_data.circulating_supply', observedAt: '2026-08-02T06:00:00.000Z', retrievedAt: '2026-08-02T06:00:01.000Z', value: 120_000_000, unit: 'token' as const },
    maxSupply: { field: 'maxSupply' as const, provider: 'CoinGecko' as const, sourcePath: 'market_data.max_supply', observedAt: '2026-08-02T06:00:00.000Z', retrievedAt: '2026-08-02T06:00:01.000Z', value: null, unit: 'token' as const },
    totalSupply: { field: 'totalSupply' as const, provider: 'CoinGecko' as const, sourcePath: 'market_data.total_supply', observedAt: '2026-08-02T06:00:00.000Z', retrievedAt: '2026-08-02T06:00:01.000Z', value: 120_000_000, unit: 'token' as const },
  },
});

describe('verified crypto technical scoring regression', () => {
  it('normalizes both repository and provider date formats', () => {
    expect(normalizeHistoryDateToIso('02.08.26')).toBe('2026-08-02T00:00:00.000Z');
    expect(normalizeHistoryDateToIso('2026-08-02')).toBe('2026-08-02T00:00:00.000Z');
  });

  it('returns READY when a real 30-day history provides sufficient evidenced factors', async () => {
    const assessment = await evaluateVerifiedCryptoTechnicalScore('ETH', {
      historyProvider,
      snapshotProvider: async () => null,
    });

    expect(assessment.canonical.status).toBe('READY');
    expect(assessment.canonical.final_score).not.toBeNull();
    expect(assessment.canonical.integrity.providers).toEqual(['CoinGecko']);
    expect(assessment.canonical.integrity.evidence).toHaveLength(1);
    expect(assessment.canonical.integrity.coverage).toBeGreaterThanOrEqual(0.5);
    expect(assessment.analysis).not.toBeNull();
    expect(assessment.inputs.trend).toBeTypeOf('number');
    expect(assessment.inputs.momentum).toBeTypeOf('number');
    expect(assessment.inputs.avg_daily_volume).toBeUndefined();
    expect(assessment.rankingEvidenceReady).toBe(false);
    expect(assessment.providerState?.history).toEqual({ cacheMode: 'fresh', degraded: false, provider: 'CoinGecko' });
  });

  it('accepts verified Binance history as evidence when CoinGecko is unavailable', async () => {
    const assessment = await evaluateVerifiedCryptoTechnicalScore('BTC', {
      historyProvider: async () => ({
        provider: 'Binance' as const,
        points: makeHistory().map((point) => ({ ...point, date: `20${point.date.slice(6)}-${point.date.slice(3, 5)}-${point.date.slice(0, 2)}` })),
        retrievedAt: '2026-08-02T06:00:00.000Z',
        cacheMode: 'fresh' as const,
        degraded: true,
      }),
      snapshotProvider: async () => null,
    });

    expect(assessment.canonical.status).toBe('READY');
    expect(assessment.canonical.integrity.providers).toEqual(['Binance']);
    expect(assessment.canonical.integrity.evidence[0]?.source).toBe('Binance');
    expect(assessment.canonical.integrity.evidence[0]?.id).toContain('binance-history:BTC:');
    expect(assessment.providerState?.history?.provider).toBe('Binance');
  });

  it('adds field-level market-cap/volume/supply provenance and ranking evidence', async () => {
    const assessment = await evaluateVerifiedCryptoTechnicalScore('ETH', {
      historyProvider,
      snapshotProvider,
    });

    expect(assessment.canonical.status).toBe('READY');
    expect(assessment.fieldProvenance.map((item) => item.field)).toEqual(expect.arrayContaining([
      'marketCapUsd', 'volume24hUsd', 'circulatingSupply', 'maxSupply', 'totalSupply',
    ]));
    expect(assessment.inputs.avg_daily_volume).toBeTypeOf('number');
    expect(assessment.rankingEvidenceReady).toBe(true);
    expect(assessment.canonical.integrity.evidence.length).toBeGreaterThanOrEqual(6);
    expect(assessment.providerState?.snapshot).toEqual({ cacheMode: 'fresh', degraded: false, provider: 'CoinGecko' });
  });

  it('remains fail-closed when no verified provider history is available', async () => {
    const assessment = await evaluateVerifiedCryptoTechnicalScore('ETH', {
      historyProvider: async () => null,
      snapshotProvider,
    });

    expect(assessment.canonical.status).toBe('INSUFFICIENT_HISTORY');
    expect(assessment.canonical.final_score).toBeNull();
    expect(assessment.analysis).toBeNull();
  });
});

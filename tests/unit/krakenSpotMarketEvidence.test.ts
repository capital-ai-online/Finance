import { describe, expect, it, vi } from 'vitest';
import { getKrakenSpotMarketEvidence } from '../../src/services/krakenSpotMarketEvidence';
import { CRYPTO_SCORING_WEIGHTS, CryptoScoringService } from '../../src/services/cryptoScoringService';

function response(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

describe('Kraken spot market evidence', () => {
  it('converts a verified Kraken ticker into exchange-local liquidity evidence', async () => {
    const fetchImpl = vi.fn(async () => response({
      error: [],
      result: {
        'BTC/USD': {
          c: ['50000.00', '0.01'],
          v: ['100.0', '200.0'],
          p: ['49500.0', '49800.0'],
          o: '48000.0',
        },
      },
    })) as unknown as typeof fetch;

    const evidence = await getKrakenSpotMarketEvidence('BTC', {
      fetchImpl,
      nowMs: () => Date.parse('2026-08-10T20:00:00Z'),
    });

    expect(evidence).not.toBeNull();
    expect(evidence).toMatchObject({
      provider: 'Kraken',
      symbol: 'BTC',
      pair: 'XBTUSD',
      priceUsd: 50000,
      baseVolume24h: 200,
      notionalVolume24hUsd: 9_960_000,
      semanticScope: 'single-exchange-spot-24h-liquidity-usd',
    });
    expect(evidence!.liquidityScore).toBeGreaterThan(0);
    expect(evidence!.liquidityScore).toBeLessThan(1);
  });

  it('fails closed when Kraken returns an API error', async () => {
    const fetchImpl = vi.fn(async () => response({ error: ['EQuery:Unknown asset pair'], result: {} })) as unknown as typeof fetch;
    const evidence = await getKrakenSpotMarketEvidence('ETH', {
      fetchImpl,
      nowMs: () => Date.parse('2026-08-10T20:02:00Z'),
    });
    expect(evidence).toBeNull();
  });
});

describe('crypto scoring provider weights', () => {
  it('keeps the scoring weights normalized after adding Kraken exchange liquidity', () => {
    const total = Object.values(CRYPTO_SCORING_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('uses exchange liquidity as a real factor without requiring a global-volume estimate', () => {
    const result = CryptoScoringService.scoreCrypto({
      coin: 'BTC',
      trend: 0.7,
      momentum: 0.7,
      exchange_liquidity: 0.9,
      data_quality_risk: 0.05,
    });

    expect(result.inputs.exchange_liquidity).toBe(0.9);
    expect(result.data_quality.missing_fields).toContain('avg_daily_volume');
    expect(result.data_quality.missing_fields).not.toContain('exchange_liquidity');
    expect(result.scores.liquidity).toBe(90);
  });
});

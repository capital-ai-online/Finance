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
  it('keeps the canonical scoring weights normalized after removing exchange-local liquidity authority', () => {
    const total = Object.values(CRYPTO_SCORING_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('keeps Kraken exchange liquidity as evidence without giving it Crypto 0.7 score authority', () => {
    const baseInput = {
      coin: 'BTC',
      trend: 0.7,
      momentum: 0.7,
      data_quality_risk: 0.05,
    } as const;
    const baseline = CryptoScoringService.scoreCrypto(baseInput);
    const withExchangeEvidence = CryptoScoringService.scoreCrypto({
      ...baseInput,
      exchange_liquidity: 0.9,
    });

    expect(withExchangeEvidence.inputs.exchange_liquidity).toBe(0.9);
    expect(withExchangeEvidence.data_quality.missing_fields).toContain('avg_daily_volume');
    expect(withExchangeEvidence.data_quality.missing_fields).not.toContain('exchange_liquidity');
    expect(withExchangeEvidence.scores.liquidity).toBe(0);
    expect(withExchangeEvidence.final_score).toBe(baseline.final_score);
  });
});

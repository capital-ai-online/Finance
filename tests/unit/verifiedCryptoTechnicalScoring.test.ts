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

describe('verified crypto technical scoring regression', () => {
  it('normalizes both repository and provider date formats', () => {
    expect(normalizeHistoryDateToIso('02.08.26')).toBe('2026-08-02T00:00:00.000Z');
    expect(normalizeHistoryDateToIso('2026-08-02')).toBe('2026-08-02T00:00:00.000Z');
  });

  it('returns READY when a real 30-day history provides sufficient evidenced factors', async () => {
    const assessment = await evaluateVerifiedCryptoTechnicalScore('ETH', {
      historyProvider: async () => ({
        provider: 'CoinGecko',
        points: makeHistory(),
        retrievedAt: '2026-08-02T06:00:00.000Z',
        cacheMode: 'fresh',
        degraded: false,
      }),
    });

    expect(assessment.canonical.status).toBe('READY');
    expect(assessment.canonical.final_score).not.toBeNull();
    expect(assessment.canonical.integrity.providers).toEqual(['CoinGecko']);
    expect(assessment.canonical.integrity.evidence).toHaveLength(1);
    expect(assessment.canonical.integrity.coverage).toBeGreaterThanOrEqual(0.5);
    expect(assessment.analysis).not.toBeNull();
    expect(assessment.inputs.trend).toBeTypeOf('number');
    expect(assessment.inputs.momentum).toBeTypeOf('number');
    expect(assessment.inputs.volatility_quality).toBeTypeOf('number');
    expect(assessment.inputs.breakout_quality).toBeTypeOf('number');
    expect(assessment.inputs.relative_strength).toBeTypeOf('number');
    expect(assessment.inputs.avg_daily_volume).toBeUndefined();
    expect(assessment.inputs.supply_dynamics).toBeUndefined();
    expect(assessment.providerState).toEqual({ cacheMode: 'fresh', degraded: false });
  });

  it('remains fail-closed when no verified provider history is available', async () => {
    const assessment = await evaluateVerifiedCryptoTechnicalScore('ETH', {
      historyProvider: async () => null,
    });

    expect(assessment.canonical.status).toBe('SOURCE_UNAVAILABLE');
    expect(assessment.canonical.final_score).toBeNull();
    expect(assessment.analysis).toBeNull();
  });
});

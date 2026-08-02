import { afterEach, describe, expect, it, vi } from 'vitest';
import { assetRegistry } from '../../src/lib/assetRegistry';
import { evaluateVerifiedCryptoTechnicalScore } from '../../src/services/verifiedCryptoTechnicalScoring';

function makeHistory(count = 30) {
  const start = Date.UTC(2026, 6, 4);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start + index * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const trend = 3000 + index * 18;
    const wave = Math.sin(index / 3) * 35;
    return { date, close: Number((trend + wave).toFixed(2)) };
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('verified crypto technical scoring regression', () => {
  it('returns READY when a real 30-day history provides sufficient evidenced factors', async () => {
    vi.spyOn(assetRegistry, 'getHistory').mockResolvedValue({
      source: 'live',
      points: makeHistory(),
    });

    const assessment = await evaluateVerifiedCryptoTechnicalScore('ETH');

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
  });

  it('remains fail-closed when only simulated/unverified history is available', async () => {
    vi.spyOn(assetRegistry, 'getHistory').mockResolvedValue({
      source: 'simulated',
      points: makeHistory(),
    });

    const assessment = await evaluateVerifiedCryptoTechnicalScore('ETH');

    expect(assessment.canonical.status).toBe('SOURCE_UNAVAILABLE');
    expect(assessment.canonical.final_score).toBeNull();
    expect(assessment.analysis).toBeNull();
  });
});

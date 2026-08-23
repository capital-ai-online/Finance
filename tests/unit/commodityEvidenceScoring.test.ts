import { describe, expect, it } from 'vitest';
import {
  COMMODITY_EVIDENCE_SCORING_CONTRACT,
  scoreCommodityMarketEvidence,
} from '../../src/services/commodityEvidenceScoring';
import type { CommodityMarketEvidence } from '../../src/services/commodityMarketEvidence';

function evidence(lastDate = '2026-08-01'): CommodityMarketEvidence {
  const last = new Date(`${lastDate}T00:00:00.000Z`);
  const points = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(last.getTime() - (29 - index) * 86_400_000).toISOString().slice(0, 10);
    return { date, close: 100 + index * 0.7 + Math.sin(index / 3) * 2 };
  });
  return {
    version: 'commodity-market-evidence/1.0.0',
    symbol: 'CMD_GOLD_COMEX',
    provider: 'TwelveData',
    providerId: 'twelvedata',
    providerSymbol: 'XAU/USD',
    providerName: 'Gold Spot',
    points,
    observedAt: `${lastDate}T23:59:59.000Z`,
    retrievedAt: `${lastDate}T23:59:59.000Z`,
    sourcePath: 'https://api.twelvedata.com/time_series',
    evidenceIds: points.map(point => `commodity:twelvedata:XAU/USD:${point.date}`),
  };
}

describe('commodity evidence scoring contract', () => {
  it('is formally approved and produces a canonical score only from complete fresh evidence', () => {
    expect(COMMODITY_EVIDENCE_SCORING_CONTRACT.status).toBe('approved');
    expect(COMMODITY_EVIDENCE_SCORING_CONTRACT.scoringEnabled).toBe(true);

    const result = scoreCommodityMarketEvidence(evidence(), Date.parse('2026-08-02T12:00:00.000Z'));
    expect(result.contractVersion).toBe('commodity-evidence-scoring/1.0.0');
    expect(result.canonical.status).toBe('READY');
    expect(result.canonical.final_score).toBeTypeOf('number');
    expect(result.providers).toEqual(['TwelveData']);
    expect(result.evidenceIds).toHaveLength(30);
    expect(result.usedFactors).toEqual(expect.arrayContaining(['trend', 'momentum', 'breakout_quality', 'volatility_quality']));
  });

  it('fails closed when evidence is stale', () => {
    const result = scoreCommodityMarketEvidence(evidence('2026-06-01'), Date.parse('2026-08-02T12:00:00.000Z'));
    expect(result.canonical.status).toBe('STALE_DATA');
    expect(result.canonical.final_score).toBeNull();
  });
});

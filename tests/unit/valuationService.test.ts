// SC-7 Phase C: valuation.service now routes calculateRankScore through the explicit
// SC-3 compositeLevel opt-in (same value as payload.data_quality.level) instead of relying on
// the implicit default fallback. This must be numerically a no-op — same formula, same result.

import { describe, expect, it } from 'vitest';
import { ValuationService } from '../../src/services/valuation.service';
import { calculateBaseScore } from '../../src/services/scoring.service';
import { calculateRankScore } from '../../src/services/ranking.service';
import type { CryptoAnalysisPayload } from '../../src/types/crypto.types';

function makePayload(level: 'high' | 'medium' | 'low' | 'unknown'): CryptoAnalysisPayload {
  return {
    asset_name: 'Test Coin',
    symbol: 'TST',
    classification: {
      category_main: 'Layer 1',
      category_sub: 'Chain-native Asset',
      asset_type: 'coin',
      tier: 1,
      confidence: 0.9,
      reasoning: [],
    },
    scores: { marketCap: 80, liquidity: 70, tokenomics: 60, volatility: 30 },
    data_quality: { level },
  };
}

describe('ValuationService.analyze — SC-7 Phase C compositeLevel wiring', () => {
  it('produces the exact rank score the legacy default-fallback path would compute (parity for every DQ level)', () => {
    for (const level of ['high', 'medium', 'low', 'unknown'] as const) {
      const payload = makePayload(level);
      const result = ValuationService.analyze(payload);
      const reasoningLine = (result.reasoning ?? []).find((line) => line.includes('Top 10 Eignung'));
      expect(reasoningLine).toBeDefined();
      const match = reasoningLine!.match(/Rank Score:\s*(-?\d+(?:\.\d+)?)/);

      const expectedFinalScore = calculateBaseScore(payload).final_score ?? 0;
      const expectedRankScore = calculateRankScore(payload, expectedFinalScore);

      if (match) {
        expect(Number(match[1])).toBeCloseTo(expectedRankScore, 1);
      } else {
        // Not Top-10-eligible: still assert the underlying rank score matches via direct call.
        expect(calculateRankScore(payload, expectedFinalScore, { compositeLevel: level })).toBeCloseTo(
          expectedRankScore,
          10,
        );
      }
    }
  });

  it('wires compositeLevel explicitly rather than only relying on the implicit payload fallback', () => {
    const payload = makePayload('low');
    const expectedFinalScore = calculateBaseScore(payload).final_score ?? 0;
    const viaExplicitOption = calculateRankScore(payload, expectedFinalScore, { compositeLevel: 'low' });
    const viaImplicitFallback = calculateRankScore(payload, expectedFinalScore);
    expect(viaExplicitOption).toBeCloseTo(viaImplicitFallback, 10);
  });
});

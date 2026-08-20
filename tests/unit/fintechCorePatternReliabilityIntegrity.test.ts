import { describe, expect, it } from 'vitest';
import {
  PATTERN_RELIABILITY_REGISTRY_VERSION,
  PatternReliabilityRegistry,
  createPatternReliabilityKey,
  type PatternReliabilityRecord,
} from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/PatternReliabilityRegistry';

describe('FinTech Core pattern reliability integrity', () => {
  it('recomputes validation state and rejects a forged VALIDATED record', () => {
    const forged: PatternReliabilityRecord = {
      registryVersion: PATTERN_RELIABILITY_REGISTRY_VERSION,
      key: createPatternReliabilityKey({
        assetId: 'crypto:BTC',
        profileId: 'layer1',
        timeframe: '4h',
        marketRegime: 'BULL',
        patternId: 'ascending-triangle',
        validationVersion: 'wf-forged',
      }),
      metrics: {
        occurrences: 5,
        winRate: 1,
        averageWinPct: 10,
        averageLossPct: 0,
        expectancy: 10,
        profitFactor: 99,
        maxDrawdownPct: 0,
        netPnlAfterCosts: 50,
        sharpe: 5,
        trainWindowDays: 10,
        validationWindowDays: 5,
        walkForward: false,
        includesFees: false,
        includesSlippage: false,
        includesFunding: false,
      },
      status: 'VALIDATED',
      reasons: [],
      evidenceRefs: ['forged:evidence'],
      validatedAt: '2026-08-20T12:00:00.000Z',
      authority: 'RESEARCH_VALIDATION_NOT_PRODUCTION_POLICY',
    };

    expect(() => new PatternReliabilityRegistry([forged]))
      .toThrow(/does not match deterministic evaluation INSUFFICIENT_DATA/i);
  });
});

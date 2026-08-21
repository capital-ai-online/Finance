import { describe, expect, it } from 'vitest';
import {
  FINTECH_CORE_CRYPTO_CONTRACT_VERSION,
  type PatternEvidence,
} from '../../src/platform/FinTechCore/CryptoModuleContracts';
import {
  PatternReliabilityRegistry,
  createPatternReliabilityKey,
  createPatternReliabilityRecord,
  type PatternReliabilityMetrics,
} from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/PatternReliabilityRegistry';
import { resolvePatternSignal } from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/PatternSignalResolver';

function evidence(overrides: Partial<PatternEvidence> = {}): PatternEvidence {
  return {
    contractVersion: FINTECH_CORE_CRYPTO_CONTRACT_VERSION,
    assetId: 'crypto:BTC',
    patternId: 'ascending-triangle',
    group: 'STRUCTURE_CONTINUATION',
    direction: 'BULLISH',
    timeframe: '4h',
    baseWeight: 0.9,
    patternQuality: 80,
    contextScore: 80,
    volumeConfirmation: 80,
    breakoutScore: 80,
    retestScore: 70,
    timeframeConfirmation: 75,
    marketRegime: 'BULL',
    marketRegimeScore: 90,
    historicalEdge: 1,
    assetReliability: 1,
    dataQuality: 0.9,
    evidenceRefs: ['ohlcv:btc:4h'],
    observedAt: '2026-08-20T12:00:00.000Z',
    validationVersion: 'wf-2026-08',
    scoreEligible: false,
    ...overrides,
  };
}

function metrics(overrides: Partial<PatternReliabilityMetrics> = {}): PatternReliabilityMetrics {
  return {
    occurrences: 150,
    winRate: 0.55,
    averageWinPct: 4,
    averageLossPct: -2,
    expectancy: 0.6,
    profitFactor: 1.3,
    maxDrawdownPct: 18,
    netPnlAfterCosts: 10,
    sharpe: 0.8,
    trainWindowDays: 730,
    validationWindowDays: 180,
    walkForward: true,
    includesFees: true,
    includesSlippage: true,
    includesFunding: true,
    ...overrides,
  };
}

function reliabilityFor(pattern: PatternEvidence, metricOverrides: Partial<PatternReliabilityMetrics> = {}) {
  return createPatternReliabilityRecord({
    key: createPatternReliabilityKey({
      assetId: pattern.assetId,
      profileId: 'layer1',
      timeframe: pattern.timeframe,
      marketRegime: pattern.marketRegime,
      patternId: pattern.patternId,
      validationVersion: pattern.validationVersion,
    }),
    metrics: metrics(metricOverrides),
    evidenceRefs: [`backtest:${pattern.patternId}:${pattern.timeframe}`],
    validatedAt: '2026-08-20T12:30:00.000Z',
  });
}

describe('FinTech Core deterministic pattern signal resolver', () => {
  it('prioritizes higher timeframe validated context over an opposing lower timeframe pattern', () => {
    const higher = evidence({ timeframe: '1d', direction: 'BULLISH' });
    const lower = evidence({
      patternId: 'bearish-engulfing',
      group: 'CANDLESTICK_REVERSAL',
      direction: 'BEARISH',
      timeframe: '4h',
      baseWeight: 0.65,
    });
    const registry = new PatternReliabilityRegistry([
      reliabilityFor(higher),
      reliabilityFor(lower),
    ]);

    const result = resolvePatternSignal({
      profileId: 'layer1',
      evidence: [lower, higher],
      reliabilityRegistry: registry,
    });

    expect(result.disposition).toBe('SUPPORTED_CONTEXT');
    expect(result.direction).toBe('BULLISH');
    expect(result.primary?.evidence.timeframe).toBe('1d');
    expect(result.suppressed.map(item => item.evidence.patternId)).toContain('bearish-engulfing');
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
  });

  it('keeps equal-precedence opposing patterns as an explicit conflict', () => {
    const bullish = evidence({ patternId: 'ascending-triangle', direction: 'BULLISH' });
    const bearish = evidence({ patternId: 'descending-triangle', direction: 'BEARISH' });
    const registry = new PatternReliabilityRegistry([
      reliabilityFor(bullish),
      reliabilityFor(bearish),
    ]);

    const result = resolvePatternSignal({
      profileId: 'layer1',
      evidence: [bullish, bearish],
      reliabilityRegistry: registry,
    });

    expect(result.disposition).toBe('CONFLICTING_EVIDENCE');
    expect(result.direction).toBeNull();
    expect(result.primary).toBeNull();
    expect(result.supporting).toHaveLength(2);
  });

  it('does not use a reliability record from another timeframe or asset as fallback', () => {
    const candidate = evidence();
    const wrongTimeframe = evidence({ timeframe: '1h' });
    const registry = new PatternReliabilityRegistry([reliabilityFor(wrongTimeframe)]);

    const result = resolvePatternSignal({
      profileId: 'layer1',
      evidence: [candidate],
      reliabilityRegistry: registry,
    });

    expect(result.disposition).toBe('NOT_COMPUTABLE');
    expect(result.rejected[0]?.reason).toMatch(/No exact asset\/profile\/timeframe\/regime/i);
  });

  it('rejects source-research data quality below 0.80 without inventing a fallback signal', () => {
    const candidate = evidence({ dataQuality: 0.79 });
    const registry = new PatternReliabilityRegistry([reliabilityFor(candidate)]);

    const result = resolvePatternSignal({
      profileId: 'layer1',
      evidence: [candidate],
      reliabilityRegistry: registry,
    });

    expect(result.disposition).toBe('NOT_COMPUTABLE');
    expect(result.rejected[0]?.reason).toMatch(/below the research minimum 0.8/i);
  });

  it('rejects exact reliability that failed the source research validation gates', () => {
    const candidate = evidence();
    const registry = new PatternReliabilityRegistry([
      reliabilityFor(candidate, { sharpe: 0.4 }),
    ]);

    const result = resolvePatternSignal({
      profileId: 'layer1',
      evidence: [candidate],
      reliabilityRegistry: registry,
    });

    expect(result.disposition).toBe('NOT_COMPUTABLE');
    expect(result.rejected[0]?.reason).toMatch(/REJECTED/i);
  });

  it('uses governed lexicographic precedence instead of synthesizing a final pattern score', () => {
    const strongBreakout = evidence({ patternId: 'ascending-triangle', breakoutScore: 90 });
    const weakerBreakout = evidence({ patternId: 'descending-triangle', direction: 'BULLISH', breakoutScore: 80 });
    const registry = new PatternReliabilityRegistry([
      reliabilityFor(strongBreakout),
      reliabilityFor(weakerBreakout),
    ]);

    const result = resolvePatternSignal({
      profileId: 'layer1',
      evidence: [weakerBreakout, strongBreakout],
      reliabilityRegistry: registry,
    });

    expect(result.primary?.evidence.patternId).toBe('ascending-triangle');
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('finalScore');
    expect(serialized).not.toContain('OrderIntent');
    expect(serialized).not.toContain('BUY');
    expect(serialized).not.toContain('SELL');
  });
});

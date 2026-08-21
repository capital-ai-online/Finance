import { describe, expect, it } from 'vitest';
import {
  PatternReliabilityRegistry,
  createPatternReliabilityKey,
  createPatternReliabilityRecord,
  evaluatePatternReliability,
  type PatternReliabilityMetrics,
} from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/PatternReliabilityRegistry';

function key(overrides: Partial<ReturnType<typeof createPatternReliabilityKey>> = {}) {
  return createPatternReliabilityKey({
    assetId: 'crypto:BTC',
    profileId: 'layer1',
    timeframe: '4h',
    marketRegime: 'BULL',
    patternId: 'ascending-triangle',
    validationVersion: 'wf-2026-08',
    ...overrides,
  });
}

function metrics(overrides: Partial<PatternReliabilityMetrics> = {}): PatternReliabilityMetrics {
  return {
    occurrences: 150,
    winRate: 0.56,
    averageWinPct: 4.2,
    averageLossPct: -2.1,
    expectancy: 0.7,
    profitFactor: 1.35,
    maxDrawdownPct: 18,
    netPnlAfterCosts: 12.5,
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

function record(
  keyOverrides: Partial<ReturnType<typeof createPatternReliabilityKey>> = {},
  metricOverrides: Partial<PatternReliabilityMetrics> = {},
) {
  return createPatternReliabilityRecord({
    key: key(keyOverrides),
    metrics: metrics(metricOverrides),
    evidenceRefs: ['backtest:btc:4h:wf-2026-08'],
    validatedAt: '2026-08-20T12:00:00.000Z',
  });
}

describe('FinTech Core pattern reliability registry', () => {
  it('validates an exact cost-aware walk-forward record that passes source research gates', () => {
    const result = record();
    expect(result.status).toBe('VALIDATED');
    expect(result.reasons).toEqual([]);
    expect(result.authority).toBe('RESEARCH_VALIDATION_NOT_PRODUCTION_POLICY');
  });

  it('returns insufficient data below source sample/window/cost requirements', () => {
    const result = evaluatePatternReliability(key(), metrics({
      occurrences: 99,
      trainWindowDays: 700,
      walkForward: false,
      includesSlippage: false,
    }));

    expect(result.status).toBe('INSUFFICIENT_DATA');
    expect(result.reasons.join(' ')).toMatch(/occurrences/i);
    expect(result.reasons.join(' ')).toMatch(/train window/i);
    expect(result.reasons.join(' ')).toMatch(/walk-forward/i);
    expect(result.reasons.join(' ')).toMatch(/slippage/i);
  });

  it('rejects statistically weak records after evidence sufficiency is satisfied', () => {
    const result = evaluatePatternReliability(key(), metrics({
      sharpe: 0.4,
      expectancy: -0.01,
      maxDrawdownPct: 26,
    }));

    expect(result.status).toBe('REJECTED');
    expect(result.reasons).toHaveLength(3);
  });

  it('does not validate UNKNOWN/STRESS via the source default regime split', () => {
    expect(evaluatePatternReliability(key({ marketRegime: 'UNKNOWN' }), metrics()).status)
      .toBe('INSUFFICIENT_DATA');
    expect(evaluatePatternReliability(key({ marketRegime: 'STRESS' }), metrics()).status)
      .toBe('INSUFFICIENT_DATA');
  });

  it('requires exact asset/profile/timeframe/regime/pattern/version resolution with no global fallback', () => {
    const registry = new PatternReliabilityRegistry([record()]);

    expect(registry.resolve(key()).status).toBe('RESOLVED');
    expect(registry.resolve(key({ assetId: 'crypto:ETH' })).status).toBe('NOT_AVAILABLE');
    expect(registry.resolve(key({ timeframe: '1h' })).status).toBe('NOT_AVAILABLE');
    expect(registry.resolve(key({ marketRegime: 'BEAR' })).status).toBe('NOT_AVAILABLE');
    expect(registry.resolve(key({ validationVersion: 'wf-next' })).status).toBe('NOT_AVAILABLE');
  });

  it('fails deterministically on duplicate exact keys', () => {
    const first = record();
    expect(() => new PatternReliabilityRegistry([first, first])).toThrow(/duplicate key/i);
  });

  it('rejects malformed metrics instead of normalizing them silently', () => {
    expect(() => evaluatePatternReliability(key(), metrics({ winRate: 1.5 }))).toThrow(/winRate/i);
    expect(() => evaluatePatternReliability(key(), metrics({ maxDrawdownPct: -1 }))).toThrow(/maxDrawdownPct/i);
  });
});

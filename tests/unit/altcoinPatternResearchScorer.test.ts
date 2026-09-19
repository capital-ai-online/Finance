import { describe, expect, it } from 'vitest';
import {
  ALTCOIN_PATTERN_CONFIRMATION_CONTRACT_VERSION,
  evaluateAltcoinPatternResearchScore,
} from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/AltcoinPatternResearchScorer';

function resolution(patternId: string, timeframe = '4h', direction: 'BULLISH' | 'BEARISH' = 'BULLISH') {
  return {
    resolverVersion: 'fintech-core.crypto/pattern-signal-resolver/0.1.0',
    disposition: 'SUPPORTED_CONTEXT',
    direction,
    primary: {
      evidence: {
        patternId,
        timeframe,
        direction,
        evidenceRefs: ['ohlcv:verified:1'],
      },
      reliability: {
        evidenceRefs: ['backtest:asset-timeframe-regime:1'],
      },
      timeframeMinutes: timeframe === '1d' ? 1440 : 240,
    },
    supporting: [],
    suppressed: [],
    rejected: [],
    reasons: [],
    scoreEligible: false,
    executionEligible: false,
    authority: 'RESEARCH_CONTEXT_ONLY',
  } as any;
}

describe('altcoin pattern reference research scorer', () => {
  it('applies only the supplied inverse-H&S reference formula and caps at 100', () => {
    const result = evaluateAltcoinPatternResearchScore({
      resolution: resolution('inverse-head-and-shoulders'),
      confirmation: {
        contractVersion: ALTCOIN_PATTERN_CONFIRMATION_CONTRACT_VERSION,
        patternId: 'inverse-head-and-shoulders',
        timeframe: '4h',
        observedAt: '2026-09-18T07:00:00.000Z',
        evidenceRefs: ['indicator:evidence:1'],
        volumeBreakoutRatio: 1.5,
        rsi14CrossAbove50: true,
        priceNearMajorSupport: true,
      },
    });

    expect(result).toMatchObject({
      status: 'READY',
      referenceBaseScore: 85,
      referenceScore: 100,
      referenceThreshold: 75,
      referenceThresholdMet: true,
      scoreEligible: false,
      executionEligible: false,
      canonicalScoreImpact: 'NONE',
      authority: 'RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE',
    });
    expect(result.evidenceRefs).toEqual([
      'ohlcv:verified:1',
      'backtest:asset-timeframe-regime:1',
      'indicator:evidence:1',
    ]);
    expect(result.contributions.map((item) => item.contribution)).toEqual([10, 8, 7]);
  });

  it('does not invent a score for catalog patterns without a complete source formula', () => {
    const result = evaluateAltcoinPatternResearchScore({
      resolution: resolution('flag'),
      confirmation: {
        contractVersion: ALTCOIN_PATTERN_CONFIRMATION_CONTRACT_VERSION,
        patternId: 'flag',
        timeframe: '4h',
        observedAt: '2026-09-18T07:00:00.000Z',
        evidenceRefs: ['indicator:evidence:2'],
      },
    });

    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.referenceScore).toBeNull();
    expect(result.reasons.join(' ')).toContain('catalog-only');
    expect(result.scoreEligible).toBe(false);
  });

  it('fails closed when confirmation evidence does not match the resolved pattern identity', () => {
    const result = evaluateAltcoinPatternResearchScore({
      resolution: resolution('double-bottom', '1d'),
      confirmation: {
        contractVersion: ALTCOIN_PATTERN_CONFIRMATION_CONTRACT_VERSION,
        patternId: 'head-and-shoulders',
        timeframe: '1d',
        observedAt: '2026-09-18T07:00:00.000Z',
        evidenceRefs: ['indicator:evidence:3'],
        macdHistogramTurnPositive: true,
      },
    });

    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.referenceScore).toBeNull();
    expect(result.reasons).toContain(
      'Confirmation evidence identity must match the resolver primary pattern and timeframe exactly.',
    );
  });

  it('keeps missing optional confirmation factors explicit instead of substituting positive evidence', () => {
    const result = evaluateAltcoinPatternResearchScore({
      resolution: resolution('head-and-shoulders', '4h', 'BEARISH'),
      confirmation: {
        contractVersion: ALTCOIN_PATTERN_CONFIRMATION_CONTRACT_VERSION,
        patternId: 'head-and-shoulders',
        timeframe: '4h',
        observedAt: '2026-09-18T07:00:00.000Z',
        evidenceRefs: ['indicator:evidence:4'],
        volumeBreakoutRatio: 1.1,
      },
    });

    expect(result.status).toBe('READY');
    expect(result.referenceScore).toBe(82);
    expect(result.missingConfirmationFields).toEqual(['rsi14CrossBelow50']);
    expect(result.contributions.map((item) => item.met)).toEqual([false, false]);
  });
});

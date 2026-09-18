import { describe, expect, it } from 'vitest';
import {
  buildCryptoPatternTrooperViewModel,
  type CryptoPatternResearchProjectionInput,
} from '../../src/features/crypto/ui/cryptoPatternTrooperViewModel';

function readyProjection(
  overrides: Partial<CryptoPatternResearchProjectionInput> = {},
): CryptoPatternResearchProjectionInput {
  return {
    status: 'READY',
    patternId: 'inverse-head-and-shoulders',
    timeframe: '4h',
    direction: 'BULLISH',
    referenceScore: 93,
    referenceThreshold: 75,
    referenceThresholdMet: true,
    contributions: [
      {
        feature: 'volumeBreakoutRatio',
        observedValue: 1.4,
        condition: '>= 1.3',
        met: true,
        contribution: 10,
      },
      {
        feature: 'rsi14CrossAbove50',
        observedValue: false,
        condition: 'true',
        met: false,
        contribution: 0,
      },
    ],
    missingConfirmationFields: [],
    evidenceRefs: ['pattern:1', 'reliability:1', 'pattern:1'],
    scoreEligible: false,
    executionEligible: false,
    canonicalScoreImpact: 'NONE',
    authority: 'RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE',
    ...overrides,
  };
}

describe('Crypto Pattern Trooper presentation projection', () => {
  it('fails closed when no FINTECH assessment is bound', () => {
    const result = buildCryptoPatternTrooperViewModel(null);

    expect(result).toMatchObject({
      status: 'NOT_COMPUTABLE',
      referenceScore: null,
      referenceThreshold: null,
      evidenceCount: 0,
      scoreEligible: false,
      executionEligible: false,
      canonicalScoreImpact: 'NONE',
      authority: 'RESEARCH',
    });
    expect(result.timeframeLanes).toEqual([
      { timeframe: '4h', state: 'REFERENCE' },
      { timeframe: '1d', state: 'REFERENCE' },
    ]);
  });

  it('projects an authorized research score without recalculating it in the browser', () => {
    const result = buildCryptoPatternTrooperViewModel(readyProjection());

    expect(result.referenceScore).toBe(93);
    expect(result.referenceThreshold).toBe(75);
    expect(result.referenceThresholdMet).toBe(true);
    expect(result.patternLabel).toBe('Inverse Head & Shoulders');
    expect(result.evidenceCount).toBe(2);
    expect(result.timeframeLanes).toEqual([
      { timeframe: '4h', state: 'ACTIVE' },
      { timeframe: '1d', state: 'REFERENCE' },
    ]);
    expect(result.confirmations).toEqual([
      {
        feature: 'volumeBreakoutRatio',
        label: 'Volume Breakout',
        observedValue: 1.4,
        condition: '>= 1.3',
        state: 'CONFIRMED',
        contribution: 10,
      },
      {
        feature: 'rsi14CrossAbove50',
        label: 'RSI 14 > 50',
        observedValue: false,
        condition: 'true',
        state: 'NOT_CONFIRMED',
        contribution: 0,
      },
    ]);
  });

  it('rejects any projection that attempts to grant scoring or execution authority', () => {
    expect(() => buildCryptoPatternTrooperViewModel({
      ...readyProjection(),
      scoreEligible: true,
    } as unknown as CryptoPatternResearchProjectionInput)).toThrow(
      'CRYPTO_PATTERN_TROOPER_AUTHORITY_MISMATCH',
    );

    expect(() => buildCryptoPatternTrooperViewModel({
      ...readyProjection(),
      executionEligible: true,
    } as unknown as CryptoPatternResearchProjectionInput)).toThrow(
      'CRYPTO_PATTERN_TROOPER_AUTHORITY_MISMATCH',
    );
  });

  it('rejects a READY state without a finite research score', () => {
    expect(() => buildCryptoPatternTrooperViewModel(
      readyProjection({ referenceScore: null }),
    )).toThrow('CRYPTO_PATTERN_TROOPER_READY_SHAPE_INVALID');
  });

  it('never accepts a numeric score in NOT_COMPUTABLE state', () => {
    expect(() => buildCryptoPatternTrooperViewModel(
      readyProjection({
        status: 'NOT_COMPUTABLE',
        referenceScore: 75,
      }),
    )).toThrow('CRYPTO_PATTERN_TROOPER_NOT_COMPUTABLE_SCORE_FORBIDDEN');
  });
});

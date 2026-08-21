import { describe, expect, it } from 'vitest';
import {
  FINTECH_CORE_CRYPTO_CONTRACT_VERSION,
  type PatternEvidence,
} from '../../src/platform/FinTechCore/CryptoModuleContracts';
import {
  PATTERN_DETECTION_CONTRACT_VERSION,
  type PatternDetectionRequest,
  type PatternDetector,
} from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/PatternDetectionContracts';
import {
  PatternReliabilityRegistry,
  createPatternReliabilityKey,
  createPatternReliabilityRecord,
  type PatternReliabilityMetrics,
} from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/PatternReliabilityRegistry';
import { PatternResearchEngine } from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/PatternResearchEngine';

function request(timeframe: string): PatternDetectionRequest {
  return {
    contractVersion: PATTERN_DETECTION_CONTRACT_VERSION,
    assetId: 'crypto:BTC',
    timeframe,
    marketRegime: 'BULL',
    dataQuality: 0.95,
    bars: [{
      observedAt: '2026-08-20T12:00:00.000Z',
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      volume: 1_000,
      evidenceRefs: [`ohlcv:${timeframe}`],
    }],
    evidenceRefs: [`series:${timeframe}`],
  };
}

function pattern(timeframe: string, direction: 'BULLISH' | 'BEARISH'): PatternEvidence {
  return {
    contractVersion: FINTECH_CORE_CRYPTO_CONTRACT_VERSION,
    assetId: 'crypto:BTC',
    patternId: direction === 'BULLISH' ? 'ascending-triangle' : 'descending-triangle',
    group: 'STRUCTURE_CONTINUATION',
    direction,
    timeframe,
    baseWeight: 0.9,
    patternQuality: 80,
    contextScore: 80,
    volumeConfirmation: 80,
    breakoutScore: 80,
    retestScore: 70,
    timeframeConfirmation: 80,
    marketRegime: 'BULL',
    marketRegimeScore: 90,
    historicalEdge: 1,
    assetReliability: 1,
    dataQuality: 0.95,
    evidenceRefs: [`pattern:${timeframe}`],
    observedAt: '2026-08-20T12:00:00.000Z',
    validationVersion: 'wf-2026-08',
    scoreEligible: false,
  };
}

function metrics(): PatternReliabilityMetrics {
  return {
    occurrences: 150,
    winRate: 0.55,
    averageWinPct: 4,
    averageLossPct: -2,
    expectancy: 0.5,
    profitFactor: 1.25,
    maxDrawdownPct: 18,
    netPnlAfterCosts: 9,
    sharpe: 0.75,
    trainWindowDays: 730,
    validationWindowDays: 180,
    walkForward: true,
    includesFees: true,
    includesSlippage: true,
    includesFunding: true,
  };
}

function reliability(item: PatternEvidence) {
  return createPatternReliabilityRecord({
    key: createPatternReliabilityKey({
      assetId: item.assetId,
      profileId: 'layer1',
      timeframe: item.timeframe,
      marketRegime: item.marketRegime,
      patternId: item.patternId,
      validationVersion: item.validationVersion,
    }),
    metrics: metrics(),
    evidenceRefs: [`backtest:${item.patternId}:${item.timeframe}`],
    validatedAt: '2026-08-20T12:30:00.000Z',
  });
}

function detector(): PatternDetector {
  return {
    descriptor: {
      detectorId: 'test-structure-detector',
      detectorVersion: '1.0.0',
      supportedPatternIds: ['ascending-triangle', 'descending-triangle'],
      researchOnly: true,
    },
    detect(input) {
      const item = input.timeframe === '1d'
        ? pattern('1d', 'BULLISH')
        : pattern(input.timeframe, 'BEARISH');
      return {
        contractVersion: PATTERN_DETECTION_CONTRACT_VERSION,
        detector: this.descriptor,
        assetId: input.assetId,
        timeframe: input.timeframe,
        marketRegime: input.marketRegime,
        patterns: [item],
        evidenceRefs: input.evidenceRefs,
        scoreEligible: false,
        executionEligible: false,
      };
    },
  };
}

describe('FinTech Core pattern research engine', () => {
  it('composes multiple detector timeframes and resolves higher-timeframe research context', () => {
    const daily = pattern('1d', 'BULLISH');
    const fourHour = pattern('4h', 'BEARISH');
    const engine = new PatternResearchEngine(
      detector(),
      new PatternReliabilityRegistry([reliability(daily), reliability(fourHour)]),
    );

    const result = engine.analyze({
      profileId: 'layer1',
      requests: [request('4h'), request('1d')],
    });

    expect(result.detections).toHaveLength(2);
    expect(result.resolution.disposition).toBe('SUPPORTED_CONTEXT');
    expect(result.resolution.direction).toBe('BULLISH');
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
  });

  it('rejects mixed-asset analysis requests', () => {
    const daily = pattern('1d', 'BULLISH');
    const engine = new PatternResearchEngine(
      detector(),
      new PatternReliabilityRegistry([reliability(daily)]),
    );

    expect(() => engine.analyze({
      profileId: 'layer1',
      requests: [request('1d'), { ...request('4h'), assetId: 'crypto:ETH' }],
    })).toThrow(/one assetId/i);
  });

  it('rejects detector results that violate request identity', () => {
    const bad: PatternDetector = {
      ...detector(),
      detect(input) {
        return {
          contractVersion: PATTERN_DETECTION_CONTRACT_VERSION,
          detector: this.descriptor,
          assetId: 'crypto:ETH',
          timeframe: input.timeframe,
          marketRegime: input.marketRegime,
          patterns: [],
          evidenceRefs: input.evidenceRefs,
          scoreEligible: false,
          executionEligible: false,
        };
      },
    };
    const engine = new PatternResearchEngine(bad, new PatternReliabilityRegistry());

    expect(() => engine.analyze({ profileId: 'layer1', requests: [request('4h')] }))
      .toThrow(/does not match request identity/i);
  });

  it('rejects detector-emitted patterns not declared by the detector descriptor', () => {
    const bad: PatternDetector = {
      descriptor: {
        detectorId: 'bad-detector',
        detectorVersion: '1.0.0',
        supportedPatternIds: ['ascending-triangle'],
        researchOnly: true,
      },
      detect(input) {
        return {
          contractVersion: PATTERN_DETECTION_CONTRACT_VERSION,
          detector: this.descriptor,
          assetId: input.assetId,
          timeframe: input.timeframe,
          marketRegime: input.marketRegime,
          patterns: [pattern(input.timeframe, 'BEARISH')],
          evidenceRefs: input.evidenceRefs,
          scoreEligible: false,
          executionEligible: false,
        };
      },
    };
    const engine = new PatternResearchEngine(bad, new PatternReliabilityRegistry());

    expect(() => engine.analyze({ profileId: 'layer1', requests: [request('4h')] }))
      .toThrow(/undeclared pattern/i);
  });
});

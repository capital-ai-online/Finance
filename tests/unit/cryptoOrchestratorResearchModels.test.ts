import { describe, expect, it } from 'vitest';
import {
  evaluateKillSwitchResearchTelemetry,
  evaluateMomentumResearch,
  evaluatePatternConfluenceResearch,
  evaluateRegimeResearch,
  evaluateSentimentResearch,
  evaluateSignalFusionResearch,
} from '../../src/platform/Scoring/CryptoOrchestratorResearchModels';

describe('Crypto orchestrator added-kit research models', () => {
  it('fails sentiment closed instead of returning a neutral 50 without evidence', () => {
    const result = evaluateSentimentResearch([]);
    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.score).toBeNull();
    expect(result.warnings.join(' ')).toContain('Neutral default 50 is forbidden');
  });

  it('combines source, recency, credibility, bot resistance and regime adjustment for sentiment', () => {
    const result = evaluateSentimentResearch([
      {
        polarity: 0.7,
        intensity: 0.9,
        novelty: 0.8,
        credibility: 0.9,
        botProbability: 0.05,
        ageHours: 1,
        sourceWeight: 0.9,
        mentionIntensity: 0.8,
        regimeAdjustment: 0.9,
        evidenceRefs: ['news:1'],
      },
      {
        polarity: -0.2,
        intensity: 0.3,
        novelty: 0.5,
        credibility: 0.7,
        botProbability: 0.2,
        ageHours: 12,
        sourceWeight: 0.7,
        mentionIntensity: 0.4,
        regimeAdjustment: 0.9,
        evidenceRefs: ['social:2'],
      },
    ]);
    expect(result.status).toBe('READY');
    expect(result.score).not.toBeNull();
    expect(result.score!).toBeGreaterThan(50);
    expect(result.scoreEligible).toBe(false);
  });

  it('renormalizes missing open-interest flow instead of treating it as zero', () => {
    const result = evaluateMomentumResearch({
      returns: { h1: 0.02, h4: 0.04, d1: 0.08 },
      volumeRatio: 1.8,
      volumeAcceleration: 0.4,
      rsi14: 62,
      trendStrength: 0.6,
      relativeStrength: 0.5,
      liquidityChange: 0.1,
      fundingRate: 0.0002,
      extendedFeatures: {
        macdHistogram: 0.4,
        adx: 31,
        trendSlope: 0.3,
        atrPercent: 0.04,
        volumeExpansion: 0.5,
      },
    });
    expect(result.status).toBe('READY');
    expect(result.effectiveFlowWeights.openInterestChange).toBe(0);
    expect((Object.values(result.effectiveFlowWeights) as number[]).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 10);
    expect(result.missingFields).toContain('openInterestChange');
    expect(result.extendedFeatureCoverage).toBe(1);
  });

  it('maps source regime phases into the existing canonical research taxonomy', () => {
    expect(evaluateRegimeResearch({
      momentumScore: 80,
      sentimentScore: 75,
      volumeRatio: 1.8,
      liquidityChange: 0.1,
      whaleExchangeFlow: -1,
      volatility: 0.04,
    })).toMatchObject({ status: 'READY', regime: 'BULL', sourcePhase: 'TREND_UP' });

    expect(evaluateRegimeResearch({
      momentumScore: 70,
      sentimentScore: 80,
      volumeRatio: 1.2,
      liquidityChange: 0.05,
      whaleExchangeFlow: 10,
      volatility: 0.04,
    })).toMatchObject({ status: 'READY', regime: 'UNKNOWN', sourcePhase: 'DISTRIBUTION', transition: true });

    expect(evaluateRegimeResearch({
      momentumScore: 25,
      sentimentScore: 30,
      volumeRatio: 0.7,
      liquidityChange: -0.2,
      whaleExchangeFlow: 5,
      volatility: 0.08,
    })).toMatchObject({ status: 'READY', regime: 'STRESS', sourcePhase: 'PANIC' });
  });

  it('requires two same-direction pattern timeframes and >=4h confirmation', () => {
    const candidate = (timeframe: string, patternQuality: number) => ({
      evidence: { direction: 'BULLISH', timeframe, patternQuality },
      reliability: {},
      timeframeMinutes: timeframe === '4h' ? 240 : 60,
    });
    const result = evaluatePatternConfluenceResearch({
      resolverVersion: 'fintech-core.crypto/pattern-signal-resolver/0.1.0',
      disposition: 'SUPPORTED_CONTEXT',
      direction: 'BULLISH',
      primary: candidate('4h', 0.9),
      supporting: [candidate('1h', 0.8)],
      suppressed: [],
      rejected: [],
      reasons: [],
      scoreEligible: false,
      executionEligible: false,
      authority: 'RESEARCH_CONTEXT_ONLY',
    } as any);
    expect(result.status).toBe('READY');
    expect(result.confluenceCount).toBe(2);
    expect(result.higherTimeframeConfirmed).toBe(true);
    expect(result.meanPatternQuality).toBeCloseTo(0.85, 10);
  });

  it('computes source signal-fusion thresholds without producing trade authorization', () => {
    const result = evaluateSignalFusionResearch({
      regimeFit: 80,
      momentumScore: 78,
      patternQuality: 82,
      sentimentScore: 75,
      executionQuality: 85,
    });
    expect(result.researchTradeScore).toBeCloseTo(79.65, 10);
    expect(result.sourceThresholdsMet).toBe(true);
    expect(result.executionEligible).toBe(false);
    expect(result.authority).toBe('RESEARCH_CONTEXT_ONLY_NOT_TRADE_AUTHORIZATION');
  });

  it('uses highest-severity kill-switch telemetry while never executing the recommendation', () => {
    const result = evaluateKillSwitchResearchTelemetry({
      slippageBps: 20,
      consecutiveLosses: 3,
      apiInstability: true,
      dataIntegrityFailure: true,
    });
    expect(result.level).toBe('L4_HARD_KILL');
    expect(result.triggers).toContain('DATA_INTEGRITY_FAILURE');
    expect(result.manualUnlockRequired).toBe(true);
    expect(result.executionEligible).toBe(false);
    expect(result.authority).toBe('RESEARCH_RISK_TELEMETRY_ONLY');
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { RawMaterialsOrchestrator } from '../../src/orchestrator/rawMaterialsOrchestrator';
import {
  getCommodityShadowObservations,
  resetCommodityShadowObservability,
} from '../../src/platform/Scoring';

const NOW = Date.parse('2026-08-26T13:45:00.000Z');

describe('RawMaterialsOrchestrator P3-A shadow runtime', () => {
  beforeEach(() => resetCommodityShadowObservability());

  it('records the governed source-backed snapshot in shadow without changing authority', () => {
    const orchestrator = new RawMaterialsOrchestrator(null);
    const context = orchestrator.composeSourceBackedResearch({
      symbol: 'CMD_NATGAS_NYMEX',
      name: 'Natural Gas',
      instrumentKind: 'commodity-energy-benchmark',
      shadowEnvironment: 'test',
      nowMs: NOW,
      additionalVerifiedObservations: [
        {
          featureKey: 'market.priceHistory',
          rawValue: 1,
          unit: 'price-series',
          source: 'twelvedata:NG',
          observedAt: '2026-08-25T23:59:59.000Z',
          retrievedAt: '2026-08-26T13:40:00.000Z',
          evidenceId: 'commodity-history:twelvedata:NG:2026-08-25',
          confidence: 1,
        },
        {
          featureKey: 'fundamentals.inventoryLevel',
          rawValue: 3200,
          unit: 'bcf',
          source: 'EIA:NG.W_EPG0_SWO_R48_BCF',
          observedAt: '2026-08-22T00:00:00.000Z',
          retrievedAt: '2026-08-26T13:41:00.000Z',
          evidenceId: 'eia:NG.W_EPG0_SWO_R48_BCF:20260822',
          confidence: 1,
        },
        {
          featureKey: 'fundamentals.production',
          rawValue: 105,
          unit: 'bcf-per-day',
          source: 'EIA:NG.N9070US2.M',
          observedAt: '2026-08-01T00:00:00.000Z',
          retrievedAt: '2026-08-26T13:41:00.000Z',
          evidenceId: 'eia:NG.N9070US2.M:202608',
          confidence: 1,
        },
      ],
    });

    expect(context.contractVersion).toBe('raw-materials-source-backed-research/1.1.0');
    expect(context.challengerEvaluation.status).toBe('RESEARCH_READY');
    expect(context.shadowObservation.evaluationStatus).toBe('RESEARCH_READY');
    expect(context.shadowObservation.modelId).toBe('commodity-energy-hybrid');
    expect(context.shadowObservation.canonical).toBe(false);
    expect(context.shadowObservation.scoreEligible).toBe(false);
    expect(context.shadowObservation.rankingEligible).toBe(false);
    expect(context.shadowObservation.executionEligible).toBe(false);
    expect(context.shadowObservation.registryMutationPerformed).toBe(false);
    expect(context.shadowObservation.challengerScoreStability.score).toBeNull();
    expect(getCommodityShadowObservations()).toHaveLength(1);
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { RawMaterialsOrchestrator } from '../../src/orchestrator/rawMaterialsOrchestrator';
import {
  getCommodityShadowObservations,
  resetCommodityShadowObservability,
  type CommodityResearchFeatureObservation,
} from '../../src/platform/Scoring';

const NOW = Date.parse('2026-08-26T13:45:00.000Z');

const VERIFIED_ENERGY_OBSERVATIONS: readonly CommodityResearchFeatureObservation[] = [
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
];

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
      additionalVerifiedObservations: VERIFIED_ENERGY_OBSERVATIONS,
    });

    expect(context.contractVersion).toBe('raw-materials-source-backed-research/1.1.0');
    expect(context.challengerEvaluation.status).toBe('RESEARCH_READY');
    expect(context.shadowRuntime.status).toBe('RECORDED');
    expect(context.shadowRuntime.code).toBeNull();
    expect(context.shadowRuntime.observation?.evaluationStatus).toBe('RESEARCH_READY');
    expect(context.shadowRuntime.observation?.modelId).toBe('commodity-energy-hybrid');
    expect(context.shadowRuntime.observation?.canonical).toBe(false);
    expect(context.shadowRuntime.observation?.scoreEligible).toBe(false);
    expect(context.shadowRuntime.observation?.rankingEligible).toBe(false);
    expect(context.shadowRuntime.observation?.executionEligible).toBe(false);
    expect(context.shadowRuntime.observation?.registryMutationPerformed).toBe(false);
    expect(context.shadowRuntime.observation?.challengerScoreStability.score).toBeNull();
    expect(getCommodityShadowObservations()).toHaveLength(1);
  });

  it('keeps source-backed research available when shadow evidence is rejected', () => {
    const orchestrator = new RawMaterialsOrchestrator(null);
    const context = orchestrator.composeSourceBackedResearch({
      symbol: 'CMD_NATGAS_NYMEX',
      name: 'Natural Gas',
      instrumentKind: 'commodity-energy-benchmark',
      shadowEnvironment: 'test',
      nowMs: NOW,
      additionalVerifiedObservations: VERIFIED_ENERGY_OBSERVATIONS,
      shadowProviderBindings: [{
        providerId: 'unregistered-provider',
        capability: 'commodity-fundamentals',
        featureKeys: ['fundamentals.inventoryLevel'],
      }],
    });

    expect(context.challengerEvaluation.status).toBe('RESEARCH_READY');
    expect(context.featureSnapshot.researchReady).toBe(true);
    expect(context.shadowRuntime.status).toBe('BLOCKED');
    expect(context.shadowRuntime.code).toBe('COMMODITY_SHADOW_PROVIDER_NOT_GOVERNED');
    expect(context.shadowRuntime.observation).toBeNull();
    expect(context.canonical).toBe(false);
    expect(context.scoreEligible).toBe(false);
    expect(context.executionEligible).toBe(false);
    expect(getCommodityShadowObservations()).toHaveLength(0);
  });
});

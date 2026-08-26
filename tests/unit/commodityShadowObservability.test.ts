import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildCommodityResearchFeatureSnapshot,
  getCommodityShadowObservations,
  getCommodityShadowTelemetry,
  recordCommodityShadowObservation,
  resetCommodityShadowObservability,
} from '../../src/platform/Scoring';
import {
  recordProviderRuntimeObservation,
  resetProviderRuntimeObservability,
} from '../../src/platform/MarketData/providerRuntimeObservability';

const NOW = Date.parse('2026-08-26T13:45:00.000Z');

function energySnapshot(includeInventory = true) {
  return buildCommodityResearchFeatureSnapshot({
    assetId: 'commodity:cmd_natgas_nymex',
    symbol: 'CMD_NATGAS_NYMEX',
    instrumentKind: 'commodity-energy-benchmark',
    nowMs: NOW,
    observations: [
      {
        featureKey: 'market.priceHistory',
        rawValue: 1,
        unit: 'price-series',
        source: 'TwelveData',
        observedAt: '2026-08-25T23:59:59.000Z',
        retrievedAt: '2026-08-26T13:40:00.000Z',
        evidenceId: 'commodity:twelvedata:NG:2026-08-25',
        confidence: 1,
      },
      ...(includeInventory ? [{
        featureKey: 'fundamentals.inventoryLevel',
        rawValue: 3200,
        unit: 'bcf',
        source: 'EIA:NG.W_EPG0_SWO_R48_BCF',
        observedAt: '2026-08-22T00:00:00.000Z',
        retrievedAt: '2026-08-26T13:41:00.000Z',
        evidenceId: 'eia:NG.W_EPG0_SWO_R48_BCF:20260822',
        confidence: 1,
      }] : []),
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
}

describe('Commodity P3-A shadow observability', () => {
  beforeEach(() => {
    resetCommodityShadowObservability();
    resetProviderRuntimeObservability();
  });

  it('records registry-bound research challenger observations without score/ranking/execution authority', () => {
    recordProviderRuntimeObservation({
      providerId: 'eia',
      capability: 'commodity-fundamentals',
      observedAt: '2026-08-26T13:41:00.000Z',
      outcome: 'READY',
      requestAttempted: true,
      durationMs: 85,
      payloadUsable: true,
      circuitState: 'CLOSED',
      httpStatus: 200,
      rateRemaining: 58,
      rateResetAt: '2026-08-26T13:42:00.000Z',
    });

    const observation = recordCommodityShadowObservation({
      snapshot: energySnapshot(),
      providerBindings: [{
        providerId: 'eia',
        capability: 'commodity-fundamentals',
        featureKeys: ['fundamentals.inventoryLevel', 'fundamentals.production'],
      }],
      champion: {
        modelId: 'commodity-evidence-scoring',
        modelVersion: '1.0.0',
        status: 'READY',
        score: 63.5,
      },
      environment: 'test',
    });

    expect(observation.evaluationStatus).toBe('RESEARCH_READY');
    expect(observation.modelId).toBe('commodity-energy-hybrid');
    expect(observation.executorKey).toBe('research-only:not-executable');
    expect(observation.challengerScoreStability).toEqual({
      status: 'NOT_APPLICABLE_UNTIL_EXECUTABLE_WEIGHTS',
      score: null,
      delta: null,
    });
    expect(observation.canonical).toBe(false);
    expect(observation.scoreEligible).toBe(false);
    expect(observation.rankingEligible).toBe(false);
    expect(observation.executionEligible).toBe(false);
    expect(observation.registryMutationPerformed).toBe(false);
    expect(observation.providers[0].runtime.sampleCount).toBe(1);
    expect(observation.providers[0].runtime.requestAttemptCount).toBe(1);
    expect(observation.providers[0].freshnessPassRate).toBe(1);
    expect(observation.evidenceFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(observation.observationId).toMatch(/^commodity-shadow:sha256:[0-9a-f]{64}$/);
  });

  it('measures feature/evidence/status and champion drift without inventing challenger score drift', () => {
    const first = recordCommodityShadowObservation({
      snapshot: energySnapshot(),
      champion: { modelId: 'commodity-evidence-scoring', modelVersion: '1.0.0', status: 'READY', score: 62 },
      environment: 'test',
    });

    const second = recordCommodityShadowObservation({
      snapshot: energySnapshot(false),
      champion: { modelId: 'commodity-evidence-scoring', modelVersion: '1.0.0', status: 'READY', score: 59.5 },
      environment: 'test',
    });

    expect(first.evaluationStatus).toBe('RESEARCH_READY');
    expect(second.evaluationStatus).toBe('BLOCKED');
    expect(second.drift.previousObservationId).toBe(first.observationId);
    expect(second.drift.statusChanged).toBe(true);
    expect(second.drift.featureStatusChanges).toBeGreaterThan(0);
    expect(second.drift.featureFingerprintChanged).toBe(true);
    expect(second.drift.evidenceFingerprintChanged).toBe(true);
    expect(second.drift.championScoreDelta).toBe(-2.5);
    expect(second.challengerScoreStability.delta).toBeNull();
    expect(getCommodityShadowObservations()).toHaveLength(2);
    expect(getCommodityShadowTelemetry()).toHaveLength(2);
    expect(getCommodityShadowTelemetry()[1].eventName).toBe('commodity.shadow.observation.completed');
  });

  it('fails closed when a caller tampers with the governed snapshot contract', () => {
    const snapshot = {
      ...energySnapshot(),
      contractVersion: 'tampered-contract',
    } as any;

    expect(() => recordCommodityShadowObservation({ snapshot, environment: 'test' }))
      .toThrow('COMMODITY_RESEARCH_CONTRACT_MISMATCH');
  });

  it('fails closed on unknown provider-to-feature shadow bindings', () => {
    expect(() => recordCommodityShadowObservation({
      snapshot: energySnapshot(),
      providerBindings: [{
        providerId: 'eia',
        capability: 'commodity-fundamentals',
        featureKeys: ['fundamentals.notGoverned'],
      }],
      environment: 'test',
    })).toThrow('COMMODITY_SHADOW_PROVIDER_FEATURE_BINDING_UNKNOWN');
  });

  it('fails closed on provider bindings outside the governed commodity provider matrix', () => {
    expect(() => recordCommodityShadowObservation({
      snapshot: energySnapshot(),
      providerBindings: [{
        providerId: 'unregistered-provider',
        capability: 'commodity-fundamentals',
        featureKeys: ['fundamentals.inventoryLevel'],
      }],
      environment: 'test',
    })).toThrow('COMMODITY_SHADOW_PROVIDER_NOT_GOVERNED');
  });

  it('fails closed when champion comparison is not bound to the registered commodity champion', () => {
    expect(() => recordCommodityShadowObservation({
      snapshot: energySnapshot(),
      champion: {
        modelId: 'commodity-energy-hybrid',
        modelVersion: '0.1.0',
        status: 'READY',
        score: 63.5,
      },
      environment: 'test',
    })).toThrow('COMMODITY_SHADOW_CHAMPION_BINDING_INVALID');
  });
});

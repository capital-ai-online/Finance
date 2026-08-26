import { beforeEach, describe, expect, it } from 'vitest';
import {
  getProviderRuntimeObservations,
  recordProviderRuntimeObservation,
  resetProviderRuntimeObservability,
  summarizeProviderRuntime,
} from '../../src/platform/MarketData/providerRuntimeObservability';

describe('P3-A provider runtime observability', () => {
  beforeEach(() => resetProviderRuntimeObservability());

  it('aggregates availability, errors, p95 latency, circuit and budget state', () => {
    for (const [outcome, durationMs, circuitState, rateRemaining] of [
      ['READY', 10, 'CLOSED', 9],
      ['READY', 20, 'CLOSED', 8],
      ['RATE_LIMITED', 30, 'CLOSED', 0],
      ['CIRCUIT_OPEN', 40, 'OPEN', null],
    ] as const) {
      recordProviderRuntimeObservation({
        providerId: 'eia',
        capability: 'commodity-fundamentals',
        observedAt: '2026-08-26T13:45:00.000Z',
        outcome,
        durationMs,
        payloadUsable: outcome === 'READY',
        circuitState,
        httpStatus: outcome === 'RATE_LIMITED' ? 429 : null,
        rateRemaining,
        rateResetAt: rateRemaining === null ? null : '2026-08-26T13:46:00.000Z',
      });
    }

    const summary = summarizeProviderRuntime('eia', 'commodity-fundamentals');
    expect(summary.sampleCount).toBe(4);
    expect(summary.availabilityRate).toBe(0.5);
    expect(summary.errorRate).toBe(0.5);
    expect(summary.p95LatencyMs).toBe(40);
    expect(summary.rateLimitedEvents).toBe(1);
    expect(summary.circuitOpenEvents).toBe(1);
    expect(summary.currentCircuitState).toBe('OPEN');
  });

  it('stores only the fixed low-cardinality observation contract', () => {
    recordProviderRuntimeObservation({
      providerId: 'usda-fas-psd',
      capability: 'commodity-fundamentals',
      observedAt: '2026-08-26T13:45:00.000Z',
      outcome: 'READY',
      durationMs: 12.5,
      payloadUsable: true,
      circuitState: 'CLOSED',
      httpStatus: 200,
      rateRemaining: 19,
      rateResetAt: '2026-08-26T13:46:00.000Z',
    });

    const [observation] = getProviderRuntimeObservations();
    expect(Object.keys(observation).sort()).toEqual([
      'capability',
      'circuitState',
      'durationMs',
      'httpStatus',
      'observedAt',
      'outcome',
      'payloadUsable',
      'providerId',
      'rateRemaining',
      'rateResetAt',
      'version',
    ].sort());
    const serialized = JSON.stringify(observation);
    expect(serialized).not.toMatch(/url|query|api.?key|secret|responsebody|requestbody/i);
    expect(serialized).toContain('payloadUsable');
  });
});

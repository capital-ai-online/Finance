import { beforeEach, describe, expect, it } from 'vitest';
import {
  getProviderRuntimeObservations,
  recordProviderRuntimeObservation,
  resetProviderRuntimeObservability,
  summarizeProviderRuntime,
} from '../../src/platform/MarketData/providerRuntimeObservability';

describe('P3-A provider runtime observability', () => {
  beforeEach(() => resetProviderRuntimeObservability());

  it('separates provider availability/error/latency from fail-closed local denials', () => {
    for (const sample of [
      { outcome: 'READY', requestAttempted: true, durationMs: 10, circuitState: 'CLOSED', rateRemaining: 9, httpStatus: 200 },
      { outcome: 'READY', requestAttempted: true, durationMs: 20, circuitState: 'CLOSED', rateRemaining: 8, httpStatus: 200 },
      { outcome: 'RATE_LIMITED', requestAttempted: true, durationMs: 30, circuitState: 'CLOSED', rateRemaining: 7, httpStatus: 429 },
      { outcome: 'CIRCUIT_OPEN', requestAttempted: false, durationMs: 0, circuitState: 'OPEN', rateRemaining: null, httpStatus: null },
    ] as const) {
      recordProviderRuntimeObservation({
        providerId: 'eia',
        capability: 'commodity-fundamentals',
        observedAt: '2026-08-26T13:45:00.000Z',
        outcome: sample.outcome,
        requestAttempted: sample.requestAttempted,
        durationMs: sample.durationMs,
        payloadUsable: sample.outcome === 'READY',
        circuitState: sample.circuitState,
        httpStatus: sample.httpStatus,
        rateRemaining: sample.rateRemaining,
        rateResetAt: sample.rateRemaining === null ? null : '2026-08-26T13:46:00.000Z',
      });
    }

    const summary = summarizeProviderRuntime('eia', 'commodity-fundamentals');
    expect(summary.sampleCount).toBe(4);
    expect(summary.requestAttemptCount).toBe(3);
    expect(summary.localDenialCount).toBe(1);
    expect(summary.availabilityRate).toBe(0.6667);
    expect(summary.errorRate).toBe(0.3333);
    expect(summary.p95LatencyMs).toBe(30);
    expect(summary.rateLimitedEvents).toBe(1);
    expect(summary.providerRateLimitedEvents).toBe(1);
    expect(summary.localRateLimitDenials).toBe(0);
    expect(summary.circuitOpenEvents).toBe(1);
    expect(summary.currentCircuitState).toBe('OPEN');
  });

  it('distinguishes local rate budget denial from provider HTTP 429', () => {
    recordProviderRuntimeObservation({
      providerId: 'eia',
      capability: 'commodity-fundamentals',
      observedAt: '2026-08-26T13:45:00.000Z',
      outcome: 'RATE_LIMITED',
      requestAttempted: false,
      durationMs: 0,
      payloadUsable: false,
      circuitState: 'CLOSED',
      httpStatus: null,
      rateRemaining: 0,
      rateResetAt: '2026-08-26T13:46:00.000Z',
    });

    const summary = summarizeProviderRuntime('eia', 'commodity-fundamentals');
    expect(summary.requestAttemptCount).toBe(0);
    expect(summary.localDenialCount).toBe(1);
    expect(summary.availabilityRate).toBe(0);
    expect(summary.errorRate).toBe(0);
    expect(summary.p95LatencyMs).toBeNull();
    expect(summary.localRateLimitDenials).toBe(1);
    expect(summary.providerRateLimitedEvents).toBe(0);
  });

  it('rejects impossible local-denial HTTP status evidence', () => {
    expect(() => recordProviderRuntimeObservation({
      providerId: 'eia',
      capability: 'commodity-fundamentals',
      observedAt: '2026-08-26T13:45:00.000Z',
      outcome: 'RATE_LIMITED',
      requestAttempted: false,
      durationMs: 0,
      payloadUsable: false,
      circuitState: 'CLOSED',
      httpStatus: 429,
      rateRemaining: 0,
      rateResetAt: '2026-08-26T13:46:00.000Z',
    })).toThrow('PROVIDER_RUNTIME_OBSERVATION_LOCAL_DENIAL_HTTP_STATUS_FORBIDDEN');
  });

  it('stores only the fixed low-cardinality observation contract', () => {
    recordProviderRuntimeObservation({
      providerId: 'usda-fas-psd',
      capability: 'commodity-fundamentals',
      observedAt: '2026-08-26T13:45:00.000Z',
      outcome: 'READY',
      requestAttempted: true,
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
      'requestAttempted',
      'version',
    ].sort());
    const serialized = JSON.stringify(observation);
    expect(serialized).not.toMatch(/url|query|api.?key|secret|responsebody|requestbody/i);
    expect(serialized).toContain('payloadUsable');
  });
});

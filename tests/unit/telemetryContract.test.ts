import { describe, expect, it } from 'vitest';
import { createTelemetryRecord, redactTelemetryAttributes, TELEMETRY_SCHEMA_VERSION } from '../../src/platform/Telemetry';

describe('Telemetry O1 baseline', () => {
  it('creates an immutable canonical telemetry record', () => {
    const record = createTelemetryRecord({
      signal: 'metric',
      severity: 'info',
      stage: 'scoring-analysis',
      eventName: 'scoring.completed',
      outcome: 'success',
      durationMs: 42,
      context: { service: 'capital-ai', environment: 'test', requestId: 'req-1' },
      attributes: { assetClass: 'crypto' },
    });

    expect(record.schemaVersion).toBe(TELEMETRY_SCHEMA_VERSION);
    expect(record.eventName).toBe('scoring.completed');
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.context)).toBe(true);
  });

  it('rejects non-canonical event names and invalid durations', () => {
    expect(() => createTelemetryRecord({
      signal: 'log', severity: 'info', stage: 'request-intake', eventName: 'BadName', outcome: 'success',
      context: { service: 'capital-ai', environment: 'test' },
    })).toThrow(/Invalid telemetry event name/);

    expect(() => createTelemetryRecord({
      signal: 'metric', severity: 'info', stage: 'market-data-provider', eventName: 'provider.request.completed', outcome: 'success',
      durationMs: -1, context: { service: 'capital-ai', environment: 'test' },
    })).toThrow(/durationMs/);
  });

  it('redacts secrets and direct PII recursively', () => {
    const result = redactTelemetryAttributes({
      authorization: 'Bearer abc',
      customer: { email: 'person@example.com', tier: 'pro' },
      nested: [{ apiKey: 'secret-value' }],
      safe: 'provider-timeout',
    });

    expect(result).toEqual({
      authorization: '[REDACTED]',
      customer: { email: '[REDACTED]', tier: 'pro' },
      nested: [{ apiKey: '[REDACTED]' }],
      safe: 'provider-timeout',
    });
  });
});

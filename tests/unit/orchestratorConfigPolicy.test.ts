import { describe, expect, it } from 'vitest';
import {
  ORCHESTRATOR_CONFIG_POLICY,
  validateOrchestratorConfigPatch,
} from '../../src/lib/orchestratorConfigPolicy';

describe('FO-03 Orchestrator config policy', () => {
  it('accepts the documented lower and upper boundaries', () => {
    expect(validateOrchestratorConfigPatch({
      concurrencyLimit: ORCHESTRATOR_CONFIG_POLICY.concurrencyLimit.min,
      maxQueueSize: ORCHESTRATOR_CONFIG_POLICY.maxQueueSize.min,
      maxRequestsPerWindow: ORCHESTRATOR_CONFIG_POLICY.maxRequestsPerWindow.min,
    })).toEqual({
      ok: true,
      value: {
        concurrencyLimit: 1,
        maxQueueSize: 2,
        maxRequestsPerWindow: 5,
      },
    });

    expect(validateOrchestratorConfigPatch({
      concurrencyLimit: ORCHESTRATOR_CONFIG_POLICY.concurrencyLimit.max,
      maxQueueSize: ORCHESTRATOR_CONFIG_POLICY.maxQueueSize.max,
      maxRequestsPerWindow: ORCHESTRATOR_CONFIG_POLICY.maxRequestsPerWindow.max,
    })).toEqual({
      ok: true,
      value: {
        concurrencyLimit: 10,
        maxQueueSize: 30,
        maxRequestsPerWindow: 100,
      },
    });
  });

  it('supports a partial patch when every supplied field is valid', () => {
    expect(validateOrchestratorConfigPatch({ concurrencyLimit: 4 })).toEqual({
      ok: true,
      value: { concurrencyLimit: 4 },
    });
  });

  it.each([
    null,
    [],
    'invalid',
    42,
  ])('rejects non-object request bodies: %j', (input) => {
    const result = validateOrchestratorConfigPatch(input);

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.code).toBe('ORCHESTRATOR_CONFIG_INVALID');
      expect(result.issues[0]?.code).toBe('INVALID_BODY');
    }
  });

  it('rejects an empty config patch', () => {
    const result = validateOrchestratorConfigPatch({});

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.issues[0]?.code).toBe('EMPTY_CONFIG');
  });

  it.each([
    ['concurrencyLimit', 0],
    ['concurrencyLimit', 11],
    ['maxQueueSize', 1],
    ['maxQueueSize', 31],
    ['maxRequestsPerWindow', 4],
    ['maxRequestsPerWindow', 101],
  ] as const)('rejects %s=%s outside the semantic range', (field, candidate) => {
    const result = validateOrchestratorConfigPatch({ [field]: candidate });

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.issues).toContainEqual(expect.objectContaining({
        field,
        code: 'OUT_OF_RANGE',
      }));
    }
  });

  it.each([
    ['concurrencyLimit', 1.5],
    ['maxQueueSize', Number.NaN],
    ['maxRequestsPerWindow', Number.POSITIVE_INFINITY],
    ['concurrencyLimit', '3'],
  ] as const)('rejects non-finite/non-integer %s=%s', (field, candidate) => {
    const result = validateOrchestratorConfigPatch({ [field]: candidate });

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.issues).toContainEqual(expect.objectContaining({
        field,
        code: 'INVALID_INTEGER',
      }));
    }
  });

  it('rejects unknown fields instead of silently ignoring them', () => {
    const result = validateOrchestratorConfigPatch({
      concurrencyLimit: 4,
      queueTimeoutMs: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.issues).toContainEqual(expect.objectContaining({
        field: 'queueTimeoutMs',
        code: 'UNKNOWN_FIELD',
      }));
    }
  });
});

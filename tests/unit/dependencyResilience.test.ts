import { describe, expect, it, vi } from 'vitest';
import {
  executeContractBoundDependencyRecovery,
  getDependencyResilienceSnapshot,
  isRetrySafeIdempotency,
  projectProviderResilience,
  retryDelayMs,
} from '../../src/platform/Supervisor/dependencyResilience';

describe('dependency resilience', () => {
  it('binds the generic retry executor to the canonical held SH-1 action', () => {
    expect(getDependencyResilienceSnapshot()).toMatchObject({
      valid: true,
      genericSafeRetryActivation: 'HELD',
      automaticGenericRetryEnabled: false,
      maxAttempts: 3,
      cooldownMs: 500,
      timeoutMs: 10_000,
    });
  });

  it('classifies only read-only and explicitly idempotent operations as retry-safe', () => {
    expect(isRetrySafeIdempotency('READ_ONLY')).toBe(true);
    expect(isRetrySafeIdempotency('IDEMPOTENT')).toBe(true);
    expect(isRetrySafeIdempotency('SIDE_EFFECTING')).toBe(false);
    expect(isRetrySafeIdempotency('PROTECTED')).toBe(false);
  });

  it('keeps retry delay bounded, exponential and jittered', () => {
    expect(retryDelayMs(500, 1, () => 0)).toBe(500);
    expect(retryDelayMs(500, 2, () => 0)).toBe(1_000);
    expect(retryDelayMs(500, 1, () => 0.999)).toBeGreaterThanOrEqual(500);
    expect(retryDelayMs(500, 1, () => 0.999)).toBeLessThan(750);
  });

  it('blocks contract-bound generic retry while SH-1 activation remains held', async () => {
    const operation = vi.fn(async () => ({ ok: true }));
    const result = await executeContractBoundDependencyRecovery(
      {
        dependencyId: 'test-read-api',
        capability: 'read',
        idempotencyClass: 'READ_ONLY',
        resilienceOwner: 'SUPERVISOR_SAFE_RETRY',
      },
      operation,
      () => ({ status: 'PASS', probe: 'dependency-operation-readback' }),
    );

    expect(result).toMatchObject({ status: 'BLOCKED', reason: 'ACTION_HELD' });
    expect(operation).not.toHaveBeenCalled();
  });

  it('blocks side-effecting operations before contract eligibility is evaluated', async () => {
    const operation = vi.fn(async () => 'should-not-run');
    const result = await executeContractBoundDependencyRecovery(
      {
        dependencyId: 'billing-writer',
        capability: 'write',
        idempotencyClass: 'SIDE_EFFECTING',
        resilienceOwner: 'SUPERVISOR_SAFE_RETRY',
      },
      operation,
      () => ({ status: 'PASS', probe: 'write-readback' }),
    );

    expect(result).toMatchObject({ status: 'BLOCKED', reason: 'UNSAFE_OPERATION_CLASS' });
    expect(operation).not.toHaveBeenCalled();
  });

  it('never nests a generic retry around a provider-native resilience owner', async () => {
    const operation = vi.fn(async () => 'should-not-run');
    const result = await executeContractBoundDependencyRecovery(
      {
        dependencyId: 'coingecko',
        capability: 'market-fields',
        idempotencyClass: 'READ_ONLY',
        resilienceOwner: 'DEPENDENCY_NATIVE',
      },
      operation,
      () => ({ status: 'PASS', probe: 'provider-health-readback' }),
    );

    expect(result).toMatchObject({
      status: 'BLOCKED',
      reason: 'DEPENDENCY_NATIVE_RESILIENCE_OWNS_RETRY',
    });
    expect(operation).not.toHaveBeenCalled();
  });

  it('projects circuit/LKG evidence without scheduling another retry', () => {
    const projection = projectProviderResilience({
      provider: 'CoinGecko',
      capability: 'market-fields',
      state: 'degraded',
      diagnosticCode: 'provider_error',
      payloadUsable: true,
      lastObservedAt: '2026-09-20T13:00:00.000Z',
      consecutiveFailures: 2,
      circuitOpenUntil: '2026-09-20T13:10:00.000Z',
      cacheMode: 'last-known-good',
    }, Date.parse('2026-09-20T13:05:00.000Z'));

    expect(projection).toMatchObject({
      findingClass: 'PROVIDER_CIRCUIT_OPEN',
      contractPreferredActionId: 'OBSERVE_ONLY',
      effectiveActionId: 'OBSERVE_ONLY',
      resilienceOwner: 'DEPENDENCY_NATIVE',
      circuitOpen: true,
      lastKnownGoodObserved: true,
      payloadUsable: true,
      evidenceState: 'DEGRADED',
    });
  });

  it('classifies transient, persistent and policy dependency findings fail-closed', () => {
    const transient = projectProviderResilience({
      provider: 'ProviderA',
      capability: 'read',
      state: 'degraded',
      diagnosticCode: 'transport_error',
      lastObservedAt: '2026-09-20T13:00:00.000Z',
      consecutiveFailures: 1,
    });
    const persistent = projectProviderResilience({
      provider: 'ProviderB',
      capability: 'read',
      state: 'unavailable',
      diagnosticCode: 'schema_error',
      lastObservedAt: '2026-09-20T13:00:00.000Z',
      consecutiveFailures: 1,
    });
    const policy = projectProviderResilience({
      provider: 'ProviderC',
      capability: 'read',
      state: 'unavailable',
      diagnosticCode: 'auth_error',
      lastObservedAt: '2026-09-20T13:00:00.000Z',
      consecutiveFailures: 1,
    });

    expect(transient.findingClass).toBe('DEPENDENCY_TRANSIENT');
    expect(transient.contractPreferredActionId).toBe('RETRY_SAFE_OPERATION');
    expect(transient.effectiveActionId).toBe('OBSERVE_ONLY');
    expect(persistent.findingClass).toBe('DEPENDENCY_PERSISTENT');
    expect(policy.findingClass).toBe('SECURITY_OR_POLICY_BLOCKED');
  });
});

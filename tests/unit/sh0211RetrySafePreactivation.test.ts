import { describe, expect, it, vi } from 'vitest';

import {
  executeContractBoundDependencyRecovery,
  getDependencyResilienceSnapshot,
  isRetrySafeIdempotency,
} from '../../src/platform/Supervisor/dependencyResilience';
import {
  getRemediationAction,
  getRemediationPolicy,
} from '../../src/platform/Supervisor/selfHealingContract';

describe('SH-02.11A RETRY_SAFE_OPERATION pre-activation', () => {
  it('keeps the candidate held with the exact bounded activation contract', () => {
    const action = getRemediationAction('RETRY_SAFE_OPERATION');
    expect(action).toMatchObject({
      tier: 'SH-1',
      activation: 'HELD',
      idempotencyClass: 'IDEMPOTENT',
      blastRadius: 'LOCAL_RUNTIME',
      requiredCapability: null,
      killSwitch: 'self-healing.safe-retry',
      verificationProbe: 'dependency-operation-readback',
      budget: {
        maxAttempts: 3,
        cooldownMs: 500,
        timeoutMs: 10_000,
      },
      exhaustionState: 'DEGRADED',
    });

    expect(getDependencyResilienceSnapshot()).toMatchObject({
      valid: true,
      genericSafeRetryActivation: 'HELD',
      automaticGenericRetryEnabled: false,
      maxAttempts: 3,
      cooldownMs: 500,
      timeoutMs: 10_000,
    });
  });

  it('admits only read-only and explicitly idempotent operation classes', () => {
    expect(isRetrySafeIdempotency('READ_ONLY')).toBe(true);
    expect(isRetrySafeIdempotency('IDEMPOTENT')).toBe(true);
    expect(isRetrySafeIdempotency('SIDE_EFFECTING')).toBe(false);
    expect(isRetrySafeIdempotency('PROTECTED')).toBe(false);
  });

  it('keeps dependency-transient routing bounded to retry-safe or observe-only', () => {
    const policy = getRemediationPolicy('DEPENDENCY_TRANSIENT');
    expect(policy.preferredActionId).toBe('RETRY_SAFE_OPERATION');
    expect(policy.allowedActionIds).toEqual(['RETRY_SAFE_OPERATION', 'OBSERVE_ONLY']);
  });

  it('blocks the generic executor while the activation candidate remains held', async () => {
    const operation = vi.fn(async () => ({ ok: true }));
    const result = await executeContractBoundDependencyRecovery(
      {
        dependencyId: 'read-api',
        capability: 'read',
        idempotencyClass: 'READ_ONLY',
        resilienceOwner: 'SUPERVISOR_SAFE_RETRY',
      },
      operation,
      () => ({ status: 'NOT_RUN', probe: 'dependency-operation-readback' }),
    );

    expect(result).toMatchObject({ status: 'BLOCKED', reason: 'ACTION_HELD' });
    expect(operation).not.toHaveBeenCalled();
  });

  it('blocks unsafe operation classes before any operation executes', async () => {
    for (const idempotencyClass of ['SIDE_EFFECTING', 'PROTECTED'] as const) {
      const operation = vi.fn(async () => 'should-not-run');
      const result = await executeContractBoundDependencyRecovery(
        {
          dependencyId: 'unsafe-operation',
          capability: 'write',
          idempotencyClass,
          resilienceOwner: 'SUPERVISOR_SAFE_RETRY',
        },
        operation,
        () => ({ status: 'NOT_RUN', probe: 'dependency-operation-readback' }),
      );

      expect(result).toMatchObject({ status: 'BLOCKED', reason: 'UNSAFE_OPERATION_CLASS' });
      expect(operation).not.toHaveBeenCalled();
    }
  });

  it('never wraps provider-native or no-automatic-retry owners', async () => {
    for (const resilienceOwner of ['DEPENDENCY_NATIVE', 'NO_AUTOMATIC_RETRY'] as const) {
      const operation = vi.fn(async () => 'should-not-run');
      const result = await executeContractBoundDependencyRecovery(
        {
          dependencyId: 'externally-owned-resilience',
          capability: 'read',
          idempotencyClass: 'READ_ONLY',
          resilienceOwner,
        },
        operation,
        () => ({ status: 'NOT_RUN', probe: 'dependency-operation-readback' }),
      );

      expect(result.status).toBe('BLOCKED');
      if (result.status !== 'BLOCKED') {
        throw new Error(`expected BLOCKED result for ${resilienceOwner}`);
      }
      expect(result.reason).toBe(
        resilienceOwner === 'DEPENDENCY_NATIVE'
          ? 'DEPENDENCY_NATIVE_RESILIENCE_OWNS_RETRY'
          : 'AUTOMATIC_RETRY_NOT_PERMITTED',
      );
      expect(operation).not.toHaveBeenCalled();
    }
  });
});

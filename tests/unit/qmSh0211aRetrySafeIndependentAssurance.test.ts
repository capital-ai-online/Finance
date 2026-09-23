import { describe, expect, it, vi } from 'vitest';

import {
  DEPENDENCY_RESILIENCE_CONTRACT_VERSION,
  executeContractBoundDependencyRecovery,
  getDependencyResilienceSnapshot,
  isRetrySafeIdempotency,
  retryDelayMs,
} from '../../src/platform/Supervisor/dependencyResilience';
import {
  SELF_HEALING_CONTRACT_VERSION,
  getRemediationAction,
  getRemediationPolicy,
  validateSelfHealingContract,
} from '../../src/platform/Supervisor/selfHealingContract';

describe('SH-02.11A independent QM assurance', () => {
  it('binds Quality assurance to exact valid contract generations', () => {
    expect(SELF_HEALING_CONTRACT_VERSION).toBe('self-healing-contract/1.2.0');
    expect(DEPENDENCY_RESILIENCE_CONTRACT_VERSION).toBe('dependency-resilience/1.0.0');
    expect(validateSelfHealingContract()).toEqual([]);

    expect(getDependencyResilienceSnapshot()).toEqual({
      version: 'dependency-resilience/1.0.0',
      valid: true,
      genericSafeRetryActivation: 'HELD',
      automaticGenericRetryEnabled: false,
      maxAttempts: 3,
      cooldownMs: 500,
      timeoutMs: 10_000,
    });
  });

  it('preserves the exact finite RETRY_SAFE_OPERATION Quality boundary', () => {
    expect(getRemediationAction('RETRY_SAFE_OPERATION')).toMatchObject({
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
  });

  it('keeps idempotency classification deterministic and fail-closed', () => {
    expect(isRetrySafeIdempotency('READ_ONLY')).toBe(true);
    expect(isRetrySafeIdempotency('IDEMPOTENT')).toBe(true);
    expect(isRetrySafeIdempotency('SIDE_EFFECTING')).toBe(false);
    expect(isRetrySafeIdempotency('PROTECTED')).toBe(false);
  });

  it('keeps finding routing bounded to transient dependency findings', () => {
    expect(getRemediationPolicy('DEPENDENCY_TRANSIENT')).toMatchObject({
      preferredActionId: 'RETRY_SAFE_OPERATION',
      allowedActionIds: ['RETRY_SAFE_OPERATION', 'OBSERVE_ONLY'],
    });

    for (const finding of [
      'DEPENDENCY_PERSISTENT',
      'PROVIDER_CIRCUIT_OPEN',
      'SECURITY_OR_POLICY_BLOCKED',
    ] as const) {
      const policy = getRemediationPolicy(finding);
      expect(policy.preferredActionId, finding).not.toBe('RETRY_SAFE_OPERATION');
      expect(policy.allowedActionIds, finding).not.toContain('RETRY_SAFE_OPERATION');
    }
  });

  it('keeps exponential cooldown finite and deterministic under bounded jitter', () => {
    expect(retryDelayMs(500, 1, () => 0)).toBe(500);
    expect(retryDelayMs(500, 2, () => 0)).toBe(1_000);
    expect(retryDelayMs(500, 3, () => 0)).toBe(2_000);

    expect(retryDelayMs(500, 1, () => 0.999999)).toBeLessThan(750);
    expect(retryDelayMs(500, 2, () => 0.999999)).toBeLessThan(1_250);
  });

  it('does not execute or verify an otherwise safe operation while HELD', async () => {
    const operation = vi.fn(async () => ({ ok: true }));
    const verify = vi.fn(() => ({ status: 'PASS' as const, probe: 'dependency-operation-readback' }));

    const result = await executeContractBoundDependencyRecovery(
      {
        dependencyId: 'qm-safe-read',
        capability: 'read',
        idempotencyClass: 'READ_ONLY',
        resilienceOwner: 'SUPERVISOR_SAFE_RETRY',
      },
      operation,
      verify,
    );

    expect(result).toMatchObject({ status: 'BLOCKED', reason: 'ACTION_HELD' });
    expect(operation).not.toHaveBeenCalled();
    expect(verify).not.toHaveBeenCalled();
  });

  it('blocks unsafe operation classes before invocation', async () => {
    for (const idempotencyClass of ['SIDE_EFFECTING', 'PROTECTED'] as const) {
      const operation = vi.fn(async () => 'must-not-run');
      const result = await executeContractBoundDependencyRecovery(
        {
          dependencyId: 'qm-unsafe-operation',
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

  it('never nests generic retry around provider-owned or disabled resilience', async () => {
    for (const resilienceOwner of ['DEPENDENCY_NATIVE', 'NO_AUTOMATIC_RETRY'] as const) {
      const operation = vi.fn(async () => 'must-not-run');
      const result = await executeContractBoundDependencyRecovery(
        {
          dependencyId: 'qm-owner-boundary',
          capability: 'read',
          idempotencyClass: 'READ_ONLY',
          resilienceOwner,
        },
        operation,
        () => ({ status: 'NOT_RUN', probe: 'dependency-operation-readback' }),
      );

      expect(result.status).toBe('BLOCKED');
      if (result.status !== 'BLOCKED') throw new Error('expected BLOCKED result');
      expect(result.reason).toBe(
        resilienceOwner === 'DEPENDENCY_NATIVE'
          ? 'DEPENDENCY_NATIVE_RESILIENCE_OWNS_RETRY'
          : 'AUTOMATIC_RETRY_NOT_PERMITTED',
      );
      expect(operation).not.toHaveBeenCalled();
    }
  });
});

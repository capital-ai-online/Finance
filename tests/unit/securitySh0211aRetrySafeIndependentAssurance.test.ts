import { describe, expect, it, vi } from 'vitest';

import {
  executeContractBoundDependencyRecovery,
  getDependencyResilienceSnapshot,
  isRetrySafeIdempotency,
  DEPENDENCY_RESILIENCE_CONTRACT_VERSION,
} from '../../src/platform/Supervisor/dependencyResilience';
import {
  SELF_HEALING_CONTRACT_VERSION,
  getRemediationAction,
  getRemediationPolicy,
} from '../../src/platform/Supervisor/selfHealingContract';

describe('SH-02.11A independent Security assurance', () => {
  it('binds to the exact contract generations and keeps automatic retry disabled', () => {
    expect(SELF_HEALING_CONTRACT_VERSION).toBe('self-healing-contract/1.2.0');
    expect(DEPENDENCY_RESILIENCE_CONTRACT_VERSION).toBe('dependency-resilience/1.0.0');

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

  it('preserves the exact bounded RETRY_SAFE_OPERATION Security contract', () => {
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

  it('admits only read-only and explicitly idempotent operation classes', () => {
    expect(isRetrySafeIdempotency('READ_ONLY')).toBe(true);
    expect(isRetrySafeIdempotency('IDEMPOTENT')).toBe(true);
    expect(isRetrySafeIdempotency('SIDE_EFFECTING')).toBe(false);
    expect(isRetrySafeIdempotency('PROTECTED')).toBe(false);
  });

  it('does not broaden retry routing to persistent, circuit-open or security-blocked findings', () => {
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

  it('fails closed for unsafe operation classes before invoking the operation', async () => {
    for (const idempotencyClass of ['SIDE_EFFECTING', 'PROTECTED'] as const) {
      const operation = vi.fn(async () => 'must-not-run');
      const result = await executeContractBoundDependencyRecovery(
        {
          dependencyId: 'security-negative-test',
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

  it('never nests generic retry around provider-native or explicitly disabled resilience', async () => {
    for (const resilienceOwner of ['DEPENDENCY_NATIVE', 'NO_AUTOMATIC_RETRY'] as const) {
      const operation = vi.fn(async () => 'must-not-run');
      const result = await executeContractBoundDependencyRecovery(
        {
          dependencyId: 'owner-boundary',
          capability: 'read',
          idempotencyClass: 'READ_ONLY',
          resilienceOwner,
        },
        operation,
        () => ({ status: 'NOT_RUN', probe: 'dependency-operation-readback' }),
      );

      expect(result.status).toBe('BLOCKED');
      if (result.status !== 'BLOCKED') {
        throw new Error(`expected BLOCKED for ${resilienceOwner}`);
      }
      expect(result.reason).toBe(
        resilienceOwner === 'DEPENDENCY_NATIVE'
          ? 'DEPENDENCY_NATIVE_RESILIENCE_OWNS_RETRY'
          : 'AUTOMATIC_RETRY_NOT_PERMITTED',
      );
      expect(operation).not.toHaveBeenCalled();
    }
  });

  it('keeps even an otherwise safe read operation non-executable while HELD', async () => {
    const operation = vi.fn(async () => ({ ok: true }));
    const result = await executeContractBoundDependencyRecovery(
      {
        dependencyId: 'safe-read',
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
});

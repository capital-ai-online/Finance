import { describe, expect, it, vi } from 'vitest';

import {
  executeContractBoundDependencyRecovery,
  getDependencyResilienceSnapshot,
} from '../../src/platform/Supervisor/dependencyResilience';
import {
  getRemediationAction,
  getSelfHealingContractSnapshot,
} from '../../src/platform/Supervisor/selfHealingContract';

describe('SH-02.11 RETRY_SAFE_OPERATION activation', () => {
  it('enables only the independently assured retry-safe SH-1 action', () => {
    expect(getRemediationAction('RETRY_SAFE_OPERATION')).toMatchObject({
      tier: 'SH-1',
      activation: 'ENABLED',
      idempotencyClass: 'IDEMPOTENT',
      blastRadius: 'LOCAL_RUNTIME',
      requiredCapability: null,
      killSwitch: 'self-healing.safe-retry',
      verificationProbe: 'dependency-operation-readback',
      budget: { maxAttempts: 3, cooldownMs: 500, timeoutMs: 10_000 },
      exhaustionState: 'DEGRADED',
    });

    expect(getDependencyResilienceSnapshot()).toMatchObject({
      valid: true,
      genericSafeRetryActivation: 'ENABLED',
      automaticGenericRetryEnabled: true,
      maxAttempts: 3,
      cooldownMs: 500,
      timeoutMs: 10_000,
    });

    const snapshot = getSelfHealingContractSnapshot();
    expect(snapshot.enabledActionIds).toContain('RETRY_SAFE_OPERATION');
    expect(snapshot.heldActionIds).toEqual(expect.arrayContaining([
      'QUARANTINE_WORK_ITEM',
      'RECONCILE_PR_GOVERNANCE_METADATA',
      'RUNTIME_PROCESS_RECYCLE',
      'REDEPLOY_EXACT_SHA',
      'PROTECTED_ROLLBACK_RESTORE',
    ]));
  });

  it('performs bounded retries for a Supervisor-owned safe read without widening convergence semantics', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('transient-1'))
      .mockRejectedValueOnce(new Error('transient-2'))
      .mockResolvedValueOnce({ ok: true });
    const sleep = vi.fn(async () => undefined);

    const result = await executeContractBoundDependencyRecovery(
      {
        dependencyId: 'activation-safe-read',
        capability: 'read',
        idempotencyClass: 'READ_ONLY',
        resilienceOwner: 'SUPERVISOR_SAFE_RETRY',
      },
      operation,
      () => ({ status: 'NOT_RUN', probe: 'dependency-operation-readback' }),
      { sleep, random: () => 0, nowMs: () => 1_000 },
    );

    expect(result).toMatchObject({ status: 'NOT_CONVERGED' });
    expect(operation).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 500);
    expect(sleep).toHaveBeenNthCalledWith(2, 1_000);
  });

  it('continues to fail closed before invocation for unsafe or foreign-owned retry classes', async () => {
    for (const input of [
      { idempotencyClass: 'SIDE_EFFECTING' as const, resilienceOwner: 'SUPERVISOR_SAFE_RETRY' as const, reason: 'UNSAFE_OPERATION_CLASS' },
      { idempotencyClass: 'PROTECTED' as const, resilienceOwner: 'SUPERVISOR_SAFE_RETRY' as const, reason: 'UNSAFE_OPERATION_CLASS' },
      { idempotencyClass: 'READ_ONLY' as const, resilienceOwner: 'DEPENDENCY_NATIVE' as const, reason: 'DEPENDENCY_NATIVE_RESILIENCE_OWNS_RETRY' },
      { idempotencyClass: 'READ_ONLY' as const, resilienceOwner: 'NO_AUTOMATIC_RETRY' as const, reason: 'AUTOMATIC_RETRY_NOT_PERMITTED' },
    ]) {
      const operation = vi.fn(async () => 'must-not-run');
      const result = await executeContractBoundDependencyRecovery(
        {
          dependencyId: 'activation-negative-boundary',
          capability: 'read',
          idempotencyClass: input.idempotencyClass,
          resilienceOwner: input.resilienceOwner,
        },
        operation,
        () => ({ status: 'NOT_RUN', probe: 'dependency-operation-readback' }),
      );
      expect(result).toMatchObject({ status: 'BLOCKED', reason: input.reason });
      expect(operation).not.toHaveBeenCalled();
    }
  });
});

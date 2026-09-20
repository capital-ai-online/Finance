import { describe, expect, it } from 'vitest';
import {
  FINDING_CLASSES,
  canTransitionRecoveryState,
  evaluateRemediationEligibility,
  getRemediationAction,
  getRemediationPolicies,
  getSelfHealingContractSnapshot,
  resolveConvergence,
  validateSelfHealingContract,
} from '../../src/platform/Supervisor/selfHealingContract';

describe('self-healing contract', () => {
  it('covers every canonical finding class with one deterministic policy', () => {
    const policies = getRemediationPolicies();
    expect(policies).toHaveLength(FINDING_CLASSES.length);
    expect(new Set(policies.map(policy => policy.findingClass))).toEqual(new Set(FINDING_CLASSES));
    expect(validateSelfHealingContract()).toEqual([]);
  });

  it('keeps SH-2 and SH-3 actions held behind external capabilities', () => {
    const snapshot = getSelfHealingContractSnapshot();
    expect(snapshot.valid).toBe(true);

    for (const actionId of snapshot.protectedActionIds) {
      const action = getRemediationAction(actionId);
      expect(action.activation).toBe('HELD');
      expect(action.requiredCapability).toBeTruthy();
      expect(action.requiredCapability).not.toBe(action.id);
    }
  });

  it('allows the already implemented frontend stale-asset recovery only once', () => {
    const first = evaluateRemediationEligibility({
      findingClass: 'FRONTEND_STALE_ASSET',
      actionId: 'FRONTEND_RELOAD_ONCE',
      attemptsUsed: 0,
      nowMs: 1_000,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(first.state).toBe('ELIGIBLE');
    if (first.state === 'ELIGIBLE') expect(first.remainingAttempts).toBe(1);

    const exhausted = evaluateRemediationEligibility({
      findingClass: 'FRONTEND_STALE_ASSET',
      actionId: 'FRONTEND_RELOAD_ONCE',
      attemptsUsed: 1,
      nowMs: 2_000,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(exhausted).toMatchObject({ state: 'BLOCKED', reason: 'BUDGET_EXHAUSTED' });
  });

  it('fails closed for held, killed, unverified and unsafe remediation', () => {
    const held = evaluateRemediationEligibility({
      findingClass: 'DEPENDENCY_TRANSIENT',
      actionId: 'RETRY_SAFE_OPERATION',
      attemptsUsed: 0,
      nowMs: 1_000,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: true,
      operationIdempotency: 'READ_ONLY',
    });
    expect(held).toMatchObject({ state: 'BLOCKED', reason: 'ACTION_HELD' });

    const killed = evaluateRemediationEligibility({
      findingClass: 'FRONTEND_STALE_ASSET',
      actionId: 'FRONTEND_RELOAD_ONCE',
      attemptsUsed: 0,
      nowMs: 1_000,
      killSwitchActive: true,
      capabilityAuthorized: false,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(killed).toMatchObject({ state: 'BLOCKED', reason: 'KILL_SWITCH_ACTIVE' });

    const unverified = evaluateRemediationEligibility({
      findingClass: 'FRONTEND_STALE_ASSET',
      actionId: 'FRONTEND_RELOAD_ONCE',
      attemptsUsed: 0,
      nowMs: 1_000,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: false,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(unverified).toMatchObject({ state: 'BLOCKED', reason: 'VERIFICATION_UNAVAILABLE' });

    const wrongFinding = evaluateRemediationEligibility({
      findingClass: 'SECURITY_OR_POLICY_BLOCKED',
      actionId: 'FRONTEND_RELOAD_ONCE',
      attemptsUsed: 0,
      nowMs: 1_000,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(wrongFinding).toMatchObject({ state: 'BLOCKED', reason: 'ACTION_NOT_ALLOWED_FOR_FINDING' });
  });

  it('declares bounded cooldowns without arbitrary polling loops', () => {
    const action = getRemediationAction('RETRY_SAFE_OPERATION');
    expect(action.budget.cooldownMs).toBeGreaterThan(0);

    // Temporarily held actions are tested at the contract level; once activated, cooldown
    // evaluation remains deterministic because callers supply both timestamps.
    const result = evaluateRemediationEligibility({
      findingClass: 'DEPENDENCY_TRANSIENT',
      actionId: 'RETRY_SAFE_OPERATION',
      attemptsUsed: 0,
      nowMs: 1_000,
      lastAttemptAtMs: 900,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: true,
      operationIdempotency: 'READ_ONLY',
    });
    expect(result).toMatchObject({ state: 'BLOCKED', reason: 'ACTION_HELD' });
  });

  it('permits only the declared recovery state machine transitions', () => {
    expect(canTransitionRecoveryState('OBSERVED', 'DIAGNOSED')).toBe(true);
    expect(canTransitionRecoveryState('DIAGNOSED', 'ELIGIBLE')).toBe(true);
    expect(canTransitionRecoveryState('DIAGNOSED', 'BLOCKED')).toBe(true);
    expect(canTransitionRecoveryState('ELIGIBLE', 'REMEDIATING')).toBe(true);
    expect(canTransitionRecoveryState('REMEDIATING', 'VERIFYING')).toBe(true);
    expect(canTransitionRecoveryState('VERIFYING', 'CONVERGED')).toBe(true);

    expect(canTransitionRecoveryState('OBSERVED', 'REMEDIATING')).toBe(false);
    expect(canTransitionRecoveryState('BLOCKED', 'REMEDIATING')).toBe(false);
    expect(canTransitionRecoveryState('CONVERGED', 'REMEDIATING')).toBe(false);
  });

  it('never treats missing or failed verification as convergence', () => {
    expect(resolveConvergence('FRONTEND_RELOAD_ONCE', {
      status: 'PASS',
      probe: 'frontend-runtime-rehydrated',
      evidenceRef: 'test:pass',
    }, 1)).toMatchObject({ state: 'CONVERGED', converged: true, reason: 'VERIFIED' });

    expect(resolveConvergence('FRONTEND_RELOAD_ONCE', {
      status: 'NOT_RUN',
      probe: 'frontend-runtime-rehydrated',
    }, 1)).toMatchObject({ state: 'ESCALATED', converged: false, reason: 'VERIFICATION_NOT_RUN' });

    expect(resolveConvergence('FRONTEND_RELOAD_ONCE', {
      status: 'FAIL',
      probe: 'frontend-runtime-rehydrated',
    }, 1)).toMatchObject({ state: 'DEGRADED', converged: false, reason: 'VERIFICATION_FAILED' });
  });
});

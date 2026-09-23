import { describe, expect, it } from 'vitest';

import {
  getRemediationAction,
  getSelfHealingContractSnapshot,
  validateSelfHealingContract,
} from '../../src/platform/Supervisor/selfHealingContract';

const EXPECTED_ENABLED = [
  'FRONTEND_RELOAD_ONCE',
  'OBSERVE_ONLY',
  'RECONCILE_PR_DECISION_EVIDENCE',
  'RECONCILE_REPOSITORY_PROJECTION',
  'VERIFY_ISSUE_PROJECT_DISPATCH',
] as const;

const EXPECTED_HELD = [
  'PROTECTED_ROLLBACK_RESTORE',
  'QUARANTINE_WORK_ITEM',
  'RECONCILE_PR_GOVERNANCE_METADATA',
  'REDEPLOY_EXACT_SHA',
  'RETRY_SAFE_OPERATION',
  'RUNTIME_PROCESS_RECYCLE',
] as const;

describe('SH-02.11 dependency readiness', () => {
  it('starts from one valid and exact enabled/held action generation', () => {
    expect(validateSelfHealingContract()).toEqual([]);

    const snapshot = getSelfHealingContractSnapshot();
    expect(snapshot.valid).toBe(true);
    expect([...snapshot.enabledActionIds].sort()).toEqual([...EXPECTED_ENABLED].sort());
    expect([...snapshot.heldActionIds].sort()).toEqual([...EXPECTED_HELD].sort());
    expect([...snapshot.protectedActionIds].sort()).toEqual([
      'PROTECTED_ROLLBACK_RESTORE',
      'REDEPLOY_EXACT_SHA',
      'RUNTIME_PROCESS_RECYCLE',
    ]);
  });

  it('keeps every currently enabled action bounded to verified SH-0/SH-1 surfaces', () => {
    const killSwitches = new Set<string>();

    for (const actionId of EXPECTED_ENABLED) {
      const action = getRemediationAction(actionId);
      expect(action.activation, actionId).toBe('ENABLED');
      expect(['SH-0', 'SH-1'], actionId).toContain(action.tier);
      expect(action.blastRadius, actionId).not.toBe('PRODUCTION_RUNTIME');
      expect(action.blastRadius, actionId).not.toBe('PROTECTED_STATE');
      expect(action.budget.maxAttempts, actionId).toBe(1);
      expect(action.budget.cooldownMs, actionId).toBeGreaterThanOrEqual(0);
      expect(action.budget.timeoutMs, actionId).toBeGreaterThan(0);
      expect(action.killSwitch.trim(), actionId).not.toBe('');
      expect(action.verificationProbe.trim(), actionId).not.toBe('');
      expect(killSwitches.has(action.killSwitch), actionId).toBe(false);
      killSwitches.add(action.killSwitch);
    }

    expect(killSwitches.size).toBe(EXPECTED_ENABLED.length);
  });

  it('does not activate any held generic, SH-2 or SH-3 action as part of readiness', () => {
    for (const actionId of EXPECTED_HELD) {
      const action = getRemediationAction(actionId);
      expect(action.activation, actionId).toBe('HELD');
      expect(action.budget.maxAttempts, actionId).toBe(1);
      expect(action.killSwitch.trim(), actionId).not.toBe('');
      expect(action.verificationProbe.trim(), actionId).not.toBe('');
    }

    for (const actionId of [
      'RUNTIME_PROCESS_RECYCLE',
      'REDEPLOY_EXACT_SHA',
      'PROTECTED_ROLLBACK_RESTORE',
    ] as const) {
      const action = getRemediationAction(actionId);
      expect(['SH-2', 'SH-3'], actionId).toContain(action.tier);
      expect(action.requiredCapability, actionId).toBeTruthy();
      expect(action.activation, actionId).toBe('HELD');
    }
  });

  it('preserves the staged rollout boundary instead of treating dependency readiness as activation', () => {
    const enabled = EXPECTED_ENABLED.map(getRemediationAction);
    const held = EXPECTED_HELD.map(getRemediationAction);

    expect(enabled.some(action => action.tier === 'SH-2' || action.tier === 'SH-3')).toBe(false);
    expect(held.some(action => action.id === 'RETRY_SAFE_OPERATION')).toBe(true);
    expect(held.some(action => action.id === 'QUARANTINE_WORK_ITEM')).toBe(true);
    expect(held.some(action => action.id === 'RUNTIME_PROCESS_RECYCLE')).toBe(true);
    expect(held.some(action => action.id === 'REDEPLOY_EXACT_SHA')).toBe(true);
    expect(held.some(action => action.id === 'PROTECTED_ROLLBACK_RESTORE')).toBe(true);
  });
});

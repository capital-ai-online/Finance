import { describe, expect, it } from 'vitest';

import {
  SELF_HEALING_CONTRACT_VERSION,
  getRemediationActions,
  getRemediationPolicy,
  getSelfHealingContractSnapshot,
  validateSelfHealingContract,
} from '../../src/platform/Supervisor/selfHealingContract';
import {
  REQUIRED_SH_02_10_SCENARIOS,
  SH_02_10_FAULT_MATRIX,
  SH_02_10_FAULT_SUITE_VERSION,
  getFaultInjectionSuiteSnapshot,
  validateFaultInjectionConvergenceSuite,
} from '../../src/platform/Supervisor/faultInjectionConvergence';

const expectedTerminalState = {
  PROCESS_FATAL: 'ESCALATED',
  PROVIDER_TRANSIENT_5XX_TIMEOUT: 'DEGRADED',
  PROVIDER_PERSISTENT_FAILURE: 'ESCALATED',
  WORKER_STALL: 'QUARANTINED',
  FRONTEND_STALE_CHUNK: 'DEGRADED',
  FRONTEND_RENDER_FAILURE: 'ESCALATED',
  FRONTEND_OPTIONAL_INIT_REJECTION: 'ESCALATED',
  STALE_TEST_EXPECTATION_AFTER_RUNTIME_CONTRACT_CHANGE: 'CONVERGED',
  PR_GOVERNANCE_V18_METADATA_OMISSION: 'CONVERGED',
  PR_GOVERNANCE_V18_HYBRID_BASELINE_SECTION: 'CONVERGED',
  API_503: 'DEGRADED',
  API_429: 'DEGRADED',
  DEPLOYMENT_IDENTITY_MISMATCH: 'ESCALATED',
  FAILED_EXACT_SHA_REDEPLOY_VERIFICATION: 'ESCALATED',
  CURRENT_STATE_PROJECTION_BASELINE_STALE: 'CONVERGED',
  POLICY_CAPABILITY_BLOCKED: 'ESCALATED',
  RECOVERY_BUDGET_EXHAUSTION: 'DEGRADED',
} as const;

describe('SH-02.10 independent QM assurance', () => {
  it('binds assurance to the exact current contract generations', () => {
    expect(SELF_HEALING_CONTRACT_VERSION).toBe('self-healing-contract/1.2.0');
    expect(SH_02_10_FAULT_SUITE_VERSION).toBe('sh-02.10-fault-convergence/1.3.0');
  });

  it('proves the complete deterministic 17-scenario work graph', () => {
    expect(validateSelfHealingContract()).toEqual([]);
    expect(validateFaultInjectionConvergenceSuite()).toEqual([]);

    expect(REQUIRED_SH_02_10_SCENARIOS).toHaveLength(17);
    expect(new Set(REQUIRED_SH_02_10_SCENARIOS).size).toBe(17);
    expect(SH_02_10_FAULT_MATRIX).toHaveLength(17);

    const observedIds = SH_02_10_FAULT_MATRIX.map(scenario => scenario.id);
    expect(observedIds).toEqual([...REQUIRED_SH_02_10_SCENARIOS]);

    for (const scenario of SH_02_10_FAULT_MATRIX) {
      expect(scenario.expectedTerminalState, scenario.id).toBe(expectedTerminalState[scenario.id]);
      expect(scenario.protectedMutationAllowed, scenario.id).toBe(false);
      expect(scenario.productionFaultAllowed, scenario.id).toBe(false);
      expect(scenario.assuranceRequired, scenario.id).toEqual(['QM', 'SECURITY']);

      const policy = getRemediationPolicy(scenario.findingClass);
      expect(policy.allowedActionIds, scenario.id).toContain(scenario.actionId);
    }
  });

  it('keeps every remediation budget finite, positive and deterministic', () => {
    const actions = getRemediationActions();
    expect(actions.length).toBeGreaterThan(0);

    for (const action of actions) {
      expect(Number.isInteger(action.budget.maxAttempts), action.id).toBe(true);
      expect(action.budget.maxAttempts, action.id).toBeGreaterThan(0);
      expect(Number.isFinite(action.budget.cooldownMs), action.id).toBe(true);
      expect(action.budget.cooldownMs, action.id).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(action.budget.timeoutMs), action.id).toBe(true);
      expect(action.budget.timeoutMs, action.id).toBeGreaterThan(0);
      expect(action.killSwitch.length, action.id).toBeGreaterThan(0);
      expect(action.verificationProbe.length, action.id).toBeGreaterThan(0);
    }
  });

  it('keeps protected actions held and the suite non-destructive', () => {
    const contract = getSelfHealingContractSnapshot();
    const faults = getFaultInjectionSuiteSnapshot();

    expect(contract.valid).toBe(true);
    expect(faults.complete).toBe(true);
    expect(faults.protectedActionsHeld).toBe(true);
    expect(faults.productionFaultsEnabled).toBe(false);
    expect(faults.independentAssurance).toEqual(['QM', 'SECURITY']);
    expect(faults.validationErrors).toEqual([]);
  });

  it('retains both PR-governance regressions as convergent bounded scenarios', () => {
    for (const id of [
      'PR_GOVERNANCE_V18_METADATA_OMISSION',
      'PR_GOVERNANCE_V18_HYBRID_BASELINE_SECTION',
    ] as const) {
      const scenario = SH_02_10_FAULT_MATRIX.find(item => item.id === id);
      expect(scenario, id).toBeDefined();
      expect(scenario).toMatchObject({
        actionId: 'RECONCILE_PR_DECISION_EVIDENCE',
        expectedTerminalState: 'CONVERGED',
        protectedMutationAllowed: false,
        productionFaultAllowed: false,
      });
    }
  });

  it('does not mistake blocked or degraded outcomes for convergence', () => {
    const converged = SH_02_10_FAULT_MATRIX.filter(item => item.expectedTerminalState === 'CONVERGED');
    const nonConverged = SH_02_10_FAULT_MATRIX.filter(item => item.expectedTerminalState !== 'CONVERGED');

    expect(converged.map(item => item.id).sort()).toEqual([
      'CURRENT_STATE_PROJECTION_BASELINE_STALE',
      'PR_GOVERNANCE_V18_HYBRID_BASELINE_SECTION',
      'PR_GOVERNANCE_V18_METADATA_OMISSION',
      'STALE_TEST_EXPECTATION_AFTER_RUNTIME_CONTRACT_CHANGE',
    ].sort());
    expect(nonConverged).toHaveLength(13);
    expect(nonConverged.every(item => ['DEGRADED', 'QUARANTINED', 'ESCALATED'].includes(item.expectedTerminalState))).toBe(true);
  });
});

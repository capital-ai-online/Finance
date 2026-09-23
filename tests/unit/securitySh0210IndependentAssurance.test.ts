import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  SELF_HEALING_CONTRACT_VERSION,
  getRemediationAction,
  getRemediationPolicy,
} from '../../src/platform/Supervisor/selfHealingContract';
import {
  REQUIRED_SH_02_10_SCENARIOS,
  SH_02_10_FAULT_MATRIX,
  SH_02_10_FAULT_SUITE_VERSION,
  getFaultInjectionSuiteSnapshot,
  validateFaultInjectionConvergenceSuite,
} from '../../src/platform/Supervisor/faultInjectionConvergence';

const readWorkflow = (path: string) => readFileSync(path, 'utf8');

describe('SH-02.10 independent Security assurance', () => {
  it('binds the exact current contract and fault-suite generations', () => {
    expect(SELF_HEALING_CONTRACT_VERSION).toBe('self-healing-contract/1.2.0');
    expect(SH_02_10_FAULT_SUITE_VERSION).toBe('sh-02.10-fault-convergence/1.3.0');
  });

  it('requires the complete 17-scenario non-destructive matrix', () => {
    expect(REQUIRED_SH_02_10_SCENARIOS).toHaveLength(17);
    expect(SH_02_10_FAULT_MATRIX).toHaveLength(17);
    expect(validateFaultInjectionConvergenceSuite()).toEqual([]);

    const snapshot = getFaultInjectionSuiteSnapshot();
    expect(snapshot).toMatchObject({
      version: 'sh-02.10-fault-convergence/1.3.0',
      scenarioCount: 17,
      requiredScenarioCount: 17,
      complete: true,
      protectedActionsHeld: true,
      productionFaultsEnabled: false,
      independentAssurance: ['QM', 'SECURITY'],
      validationErrors: [],
    });

    for (const scenario of SH_02_10_FAULT_MATRIX) {
      expect(scenario.protectedMutationAllowed, scenario.id).toBe(false);
      expect(scenario.productionFaultAllowed, scenario.id).toBe(false);
      expect(scenario.assuranceRequired, scenario.id).toEqual(['QM', 'SECURITY']);
    }
  });

  it('keeps all protected production actions held behind external capabilities', () => {
    for (const actionId of [
      'RUNTIME_PROCESS_RECYCLE',
      'REDEPLOY_EXACT_SHA',
      'PROTECTED_ROLLBACK_RESTORE',
    ] as const) {
      const action = getRemediationAction(actionId);
      expect(action.activation, actionId).toBe('HELD');
      expect(action.requiredCapability, actionId).toBeTruthy();
      expect(action.budget.maxAttempts, actionId).toBe(1);
    }
  });

  it('routes both v1.8 PR-governance regressions through the one leading PR-body action', () => {
    const metadataPolicy = getRemediationPolicy('REPOSITORY_PR_GOVERNANCE_METADATA_DRIFT');
    expect(metadataPolicy.preferredActionId).toBe('RECONCILE_PR_DECISION_EVIDENCE');
    expect(metadataPolicy.allowedActionIds).toEqual([
      'RECONCILE_PR_DECISION_EVIDENCE',
      'OBSERVE_ONLY',
    ]);

    const hybrid = SH_02_10_FAULT_MATRIX.find(
      scenario => scenario.id === 'PR_GOVERNANCE_V18_HYBRID_BASELINE_SECTION',
    );
    expect(hybrid).toMatchObject({
      findingClass: 'REPOSITORY_PR_GOVERNANCE_METADATA_DRIFT',
      actionId: 'RECONCILE_PR_DECISION_EVIDENCE',
      expectedTerminalState: 'CONVERGED',
      protectedMutationAllowed: false,
      productionFaultAllowed: false,
    });

    const superseded = getRemediationAction('RECONCILE_PR_GOVERNANCE_METADATA');
    expect(superseded).toMatchObject({
      activation: 'HELD',
      requiredCapability: null,
      killSwitch: 'self-healing.pr-governance-metadata-superseded',
      verificationProbe: 'superseded-pr-body-action-held',
      budget: { maxAttempts: 1 },
    });
    expect(metadataPolicy.allowedActionIds).not.toContain('RECONCILE_PR_GOVERNANCE_METADATA');
  });

  it('keeps PR-body mutation authority on exactly one self-healing workflow', () => {
    const leading = readWorkflow('.github/workflows/pr-decision-reconciler.yml');
    const baselineRelay = readWorkflow('.github/workflows/pr-production-baseline-refresh.yml');
    const postMergeObserver = readWorkflow('.github/workflows/pr-production-baseline-post-merge-refresh.yml');

    expect(leading).toContain('# This workflow is the only mutable owner of open same-repository PR bodies.');
    expect(leading).toContain('group: capital-ai-pr-writer-${{ matrix.pr_number }}');
    expect(leading).toContain('pull-requests: write');
    expect(leading).toContain('node scripts/pr/reconcilePrDecisionEvidence.mjs');

    expect(baselineRelay).toContain('# Compatibility relay only.');
    expect(baselineRelay).not.toContain('pull-requests: write');
    expect(baselineRelay).not.toContain('updatePrProductionBaseline.mjs');
    expect(baselineRelay).not.toContain('repairLegacyPrBodyStructure.mjs');

    expect(postMergeObserver).toContain('# Compatibility observer only.');
    expect(postMergeObserver).not.toContain('pull-requests: write');
    expect(postMergeObserver).not.toContain('updatePrProductionBaseline.mjs');
    expect(postMergeObserver).not.toContain('repairLegacyPrBodyStructure.mjs');
  });
});

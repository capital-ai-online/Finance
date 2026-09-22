import {
  getRemediationAction,
  getRemediationPolicy,
  type FindingClass,
  type RemediationActionId,
  type TerminalRecoveryState,
} from './selfHealingContract';

export const SH_02_10_FAULT_SUITE_VERSION = 'sh-02.10-fault-convergence/1.0.0' as const;

export const REQUIRED_SH_02_10_SCENARIOS = [
  'PROCESS_FATAL',
  'PROVIDER_TRANSIENT_5XX_TIMEOUT',
  'PROVIDER_PERSISTENT_FAILURE',
  'WORKER_STALL',
  'FRONTEND_STALE_CHUNK',
  'FRONTEND_RENDER_FAILURE',
  'API_503',
  'API_429',
  'DEPLOYMENT_IDENTITY_MISMATCH',
  'FAILED_EXACT_SHA_REDEPLOY_VERIFICATION',
  'CURRENT_STATE_PROJECTION_BASELINE_STALE',
  'POLICY_CAPABILITY_BLOCKED',
  'RECOVERY_BUDGET_EXHAUSTION',
] as const;

export type FaultInjectionScenarioId = (typeof REQUIRED_SH_02_10_SCENARIOS)[number];

export type FaultInjectionSurface =
  | 'PROCESS_MODEL'
  | 'DEPENDENCY_MODEL'
  | 'WORKER_MODEL'
  | 'FRONTEND_MODEL'
  | 'HTTP_MOCK'
  | 'DEPLOYMENT_MODEL'
  | 'REPOSITORY_MODEL'
  | 'POLICY_MODEL'
  | 'BUDGET_MODEL';

export interface FaultInjectionScenario {
  id: FaultInjectionScenarioId;
  description: string;
  surface: FaultInjectionSurface;
  findingClass: FindingClass;
  actionId: RemediationActionId;
  expectedTerminalState: TerminalRecoveryState;
  protectedMutationAllowed: false;
  productionFaultAllowed: false;
  assuranceRequired: readonly ['QM', 'SECURITY'];
}

function scenario(
  id: FaultInjectionScenarioId,
  description: string,
  surface: FaultInjectionSurface,
  findingClass: FindingClass,
  actionId: RemediationActionId,
  expectedTerminalState: TerminalRecoveryState,
): FaultInjectionScenario {
  return Object.freeze({
    id,
    description,
    surface,
    findingClass,
    actionId,
    expectedTerminalState,
    protectedMutationAllowed: false as const,
    productionFaultAllowed: false as const,
    assuranceRequired: ['QM', 'SECURITY'] as const,
  });
}

export const SH_02_10_FAULT_MATRIX: readonly FaultInjectionScenario[] = Object.freeze([
  scenario(
    'PROCESS_FATAL',
    'Latch a fatal process state and verify unhealthy liveness without invoking a real production recycle.',
    'PROCESS_MODEL',
    'PROCESS_FATAL',
    'RUNTIME_PROCESS_RECYCLE',
    'ESCALATED',
  ),
  scenario(
    'PROVIDER_TRANSIENT_5XX_TIMEOUT',
    'Project a transient provider transport failure into dependency resilience without a nested retry loop.',
    'DEPENDENCY_MODEL',
    'DEPENDENCY_TRANSIENT',
    'RETRY_SAFE_OPERATION',
    'DEGRADED',
  ),
  scenario(
    'PROVIDER_PERSISTENT_FAILURE',
    'Project a persistent provider failure into observe/escalate semantics.',
    'DEPENDENCY_MODEL',
    'DEPENDENCY_PERSISTENT',
    'OBSERVE_ONLY',
    'ESCALATED',
  ),
  scenario(
    'WORKER_STALL',
    'Model a stalled durable worker item and preserve quarantine/dead-letter ownership.',
    'WORKER_MODEL',
    'WORKER_STALLED',
    'QUARANTINE_WORK_ITEM',
    'QUARANTINED',
  ),
  scenario(
    'FRONTEND_STALE_CHUNK',
    'Inject a stale dynamic-import failure and prove one-shot session recovery.',
    'FRONTEND_MODEL',
    'FRONTEND_STALE_ASSET',
    'FRONTEND_RELOAD_ONCE',
    'DEGRADED',
  ),
  scenario(
    'FRONTEND_RENDER_FAILURE',
    'Inject a persistent render failure and prove that automatic reload is denied.',
    'FRONTEND_MODEL',
    'FRONTEND_RENDER_FAILURE',
    'OBSERVE_ONLY',
    'ESCALATED',
  ),
  scenario(
    'API_503',
    'Mock a 503 response and prove bounded retry for safe frontend reads only.',
    'HTTP_MOCK',
    'DEPENDENCY_TRANSIENT',
    'RETRY_SAFE_OPERATION',
    'DEGRADED',
  ),
  scenario(
    'API_429',
    'Mock a 429 response and prove bounded retry for safe frontend reads only.',
    'HTTP_MOCK',
    'DEPENDENCY_TRANSIENT',
    'RETRY_SAFE_OPERATION',
    'DEGRADED',
  ),
  scenario(
    'DEPLOYMENT_IDENTITY_MISMATCH',
    'Model deployment identity drift while protected exact-SHA redeploy stays held.',
    'DEPLOYMENT_MODEL',
    'DEPLOYMENT_IDENTITY_DRIFT',
    'REDEPLOY_EXACT_SHA',
    'ESCALATED',
  ),
  scenario(
    'FAILED_EXACT_SHA_REDEPLOY_VERIFICATION',
    'Model failed post-redeploy readback and require escalation.',
    'DEPLOYMENT_MODEL',
    'DEPLOYMENT_IDENTITY_DRIFT',
    'REDEPLOY_EXACT_SHA',
    'ESCALATED',
  ),
  scenario(
    'CURRENT_STATE_PROJECTION_BASELINE_STALE',
    'Model a stale docs/projects current-state baseline and route it to the single bounded baseline autofix specialist with exact-head readback.',
    'REPOSITORY_MODEL',
    'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT',
    'RECONCILE_REPOSITORY_PROJECTION',
    'CONVERGED',
  ),
  scenario(
    'POLICY_CAPABILITY_BLOCKED',
    'Model a missing external capability and require fail-closed blocking.',
    'POLICY_MODEL',
    'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT',
    'RECONCILE_REPOSITORY_PROJECTION',
    'ESCALATED',
  ),
  scenario(
    'RECOVERY_BUDGET_EXHAUSTION',
    'Exhaust a bounded recovery budget and prove no further remediation attempt is admitted.',
    'BUDGET_MODEL',
    'FRONTEND_STALE_ASSET',
    'FRONTEND_RELOAD_ONCE',
    'DEGRADED',
  ),
]);

export interface FaultInjectionSuiteSnapshot {
  version: typeof SH_02_10_FAULT_SUITE_VERSION;
  scenarioCount: number;
  requiredScenarioCount: number;
  scenarioIds: FaultInjectionScenarioId[];
  complete: boolean;
  protectedActionsHeld: boolean;
  productionFaultsEnabled: false;
  independentAssurance: readonly ['QM', 'SECURITY'];
  validationErrors: string[];
}

export function validateFaultInjectionConvergenceSuite(): string[] {
  const errors: string[] = [];
  const ids = new Set<FaultInjectionScenarioId>();

  for (const item of SH_02_10_FAULT_MATRIX) {
    if (ids.has(item.id)) errors.push(`DUPLICATE_SCENARIO:${item.id}`);
    ids.add(item.id);

    const policy = getRemediationPolicy(item.findingClass);
    if (!policy.allowedActionIds.includes(item.actionId)) {
      errors.push(`ACTION_NOT_ALLOWED:${item.id}:${item.actionId}`);
    }
    if (item.protectedMutationAllowed || item.productionFaultAllowed) {
      errors.push(`DESTRUCTIVE_INJECTION_FORBIDDEN:${item.id}`);
    }
  }

  for (const required of REQUIRED_SH_02_10_SCENARIOS) {
    if (!ids.has(required)) errors.push(`MISSING_SCENARIO:${required}`);
  }

  for (const actionId of ['RUNTIME_PROCESS_RECYCLE', 'REDEPLOY_EXACT_SHA', 'PROTECTED_ROLLBACK_RESTORE'] as const) {
    if (getRemediationAction(actionId).activation !== 'HELD') {
      errors.push(`PROTECTED_ACTION_NOT_HELD:${actionId}`);
    }
  }

  return errors;
}

export function getFaultInjectionSuiteSnapshot(): FaultInjectionSuiteSnapshot {
  const validationErrors = validateFaultInjectionConvergenceSuite();
  const protectedActionsHeld = (
    ['RUNTIME_PROCESS_RECYCLE', 'REDEPLOY_EXACT_SHA', 'PROTECTED_ROLLBACK_RESTORE'] as const
  ).every(actionId => getRemediationAction(actionId).activation === 'HELD');

  return {
    version: SH_02_10_FAULT_SUITE_VERSION,
    scenarioCount: SH_02_10_FAULT_MATRIX.length,
    requiredScenarioCount: REQUIRED_SH_02_10_SCENARIOS.length,
    scenarioIds: SH_02_10_FAULT_MATRIX.map(item => item.id),
    complete: validationErrors.length === 0,
    protectedActionsHeld,
    productionFaultsEnabled: false,
    independentAssurance: ['QM', 'SECURITY'],
    validationErrors,
  };
}

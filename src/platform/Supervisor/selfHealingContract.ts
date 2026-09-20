/**
 * Bounded self-healing contract for CAPITAL-AI.
 *
 * This module is intentionally pure: it defines finding classes, remediation
 * policy, budgets and state transitions, but it does not execute remediation.
 * Execution remains with the existing Supervisor/provider/runtime paths.
 */

export const SELF_HEALING_CONTRACT_VERSION = 'self-healing-contract/1.0.0' as const;

export const FINDING_CLASSES = [
  'PROCESS_FATAL',
  'LIVENESS_FAILED',
  'BUSINESS_NOT_READY',
  'DEPENDENCY_TRANSIENT',
  'DEPENDENCY_PERSISTENT',
  'PROVIDER_CIRCUIT_OPEN',
  'WORKER_STALLED',
  'DEPLOYMENT_IDENTITY_DRIFT',
  'FRONTEND_STALE_ASSET',
  'FRONTEND_RENDER_FAILURE',
  'VERSION_SKEW',
  'DATA_RECOVERY_REQUIRED',
  'SECURITY_OR_POLICY_BLOCKED',
] as const;

export type FindingClass = (typeof FINDING_CLASSES)[number];
export type RecoveryTier = 'SH-0' | 'SH-1' | 'SH-2' | 'SH-3';
export type RemediationActivation = 'ENABLED' | 'HELD';
export type IdempotencyClass = 'READ_ONLY' | 'IDEMPOTENT' | 'SIDE_EFFECTING' | 'PROTECTED';
export type TerminalRecoveryState = 'CONVERGED' | 'DEGRADED' | 'QUARANTINED' | 'ESCALATED';

export type RemediationActionId =
  | 'OBSERVE_ONLY'
  | 'FRONTEND_RELOAD_ONCE'
  | 'RETRY_SAFE_OPERATION'
  | 'QUARANTINE_WORK_ITEM'
  | 'RUNTIME_PROCESS_RECYCLE'
  | 'REDEPLOY_EXACT_SHA'
  | 'PROTECTED_ROLLBACK_RESTORE';

export interface RemediationBudget {
  maxAttempts: number;
  cooldownMs: number;
  timeoutMs: number;
}

export interface RemediationAction {
  id: RemediationActionId;
  tier: RecoveryTier;
  activation: RemediationActivation;
  idempotencyClass: IdempotencyClass;
  blastRadius: 'OBSERVATION' | 'LOCAL_CLIENT' | 'LOCAL_RUNTIME' | 'WORK_ITEM' | 'PRODUCTION_RUNTIME' | 'PROTECTED_STATE';
  requiredCapability: string | null;
  killSwitch: string;
  verificationProbe: string;
  budget: RemediationBudget;
  exhaustionState: Exclude<TerminalRecoveryState, 'CONVERGED'>;
  description: string;
}

export interface RemediationPolicy {
  findingClass: FindingClass;
  preferredActionId: RemediationActionId;
  allowedActionIds: readonly RemediationActionId[];
  blockedState: 'ESCALATED' | 'QUARANTINED';
}

const ACTIONS: Record<RemediationActionId, RemediationAction> = {
  OBSERVE_ONLY: {
    id: 'OBSERVE_ONLY',
    tier: 'SH-0',
    activation: 'ENABLED',
    idempotencyClass: 'READ_ONLY',
    blastRadius: 'OBSERVATION',
    requiredCapability: null,
    killSwitch: 'self-healing.observe',
    verificationProbe: 'finding-reobservation',
    budget: { maxAttempts: 1, cooldownMs: 0, timeoutMs: 1_000 },
    exhaustionState: 'ESCALATED',
    description: 'Record and re-observe a finding without performing a state-changing remediation.',
  },
  FRONTEND_RELOAD_ONCE: {
    id: 'FRONTEND_RELOAD_ONCE',
    tier: 'SH-1',
    activation: 'ENABLED',
    idempotencyClass: 'IDEMPOTENT',
    blastRadius: 'LOCAL_CLIENT',
    requiredCapability: null,
    killSwitch: 'self-healing.frontend-reload',
    verificationProbe: 'frontend-runtime-rehydrated',
    budget: { maxAttempts: 1, cooldownMs: 0, timeoutMs: 15_000 },
    exhaustionState: 'DEGRADED',
    description: 'Reload a stale frontend deployment asset once per recovery fingerprint/session.',
  },
  RETRY_SAFE_OPERATION: {
    id: 'RETRY_SAFE_OPERATION',
    tier: 'SH-1',
    activation: 'HELD',
    idempotencyClass: 'IDEMPOTENT',
    blastRadius: 'LOCAL_RUNTIME',
    requiredCapability: null,
    killSwitch: 'self-healing.safe-retry',
    verificationProbe: 'dependency-operation-readback',
    budget: { maxAttempts: 3, cooldownMs: 500, timeoutMs: 10_000 },
    exhaustionState: 'DEGRADED',
    description: 'Retry only read-only or explicitly idempotent dependency operations with bounded backoff.',
  },
  QUARANTINE_WORK_ITEM: {
    id: 'QUARANTINE_WORK_ITEM',
    tier: 'SH-1',
    activation: 'HELD',
    idempotencyClass: 'IDEMPOTENT',
    blastRadius: 'WORK_ITEM',
    requiredCapability: null,
    killSwitch: 'self-healing.worker-quarantine',
    verificationProbe: 'work-item-quarantine-readback',
    budget: { maxAttempts: 1, cooldownMs: 0, timeoutMs: 5_000 },
    exhaustionState: 'QUARANTINED',
    description: 'Move an exhausted durable work item into a bounded quarantine/dead-letter state.',
  },
  RUNTIME_PROCESS_RECYCLE: {
    id: 'RUNTIME_PROCESS_RECYCLE',
    tier: 'SH-2',
    activation: 'HELD',
    idempotencyClass: 'SIDE_EFFECTING',
    blastRadius: 'PRODUCTION_RUNTIME',
    requiredCapability: 'runtime.process.recycle',
    killSwitch: 'self-healing.runtime-recycle',
    verificationProbe: 'liveness-and-readiness-readback',
    budget: { maxAttempts: 1, cooldownMs: 60_000, timeoutMs: 180_000 },
    exhaustionState: 'ESCALATED',
    description: 'Recycle a production runtime only through an already-authorized runtime capability.',
  },
  REDEPLOY_EXACT_SHA: {
    id: 'REDEPLOY_EXACT_SHA',
    tier: 'SH-2',
    activation: 'HELD',
    idempotencyClass: 'SIDE_EFFECTING',
    blastRadius: 'PRODUCTION_RUNTIME',
    requiredCapability: 'release.redeploy.exact-sha',
    killSwitch: 'self-healing.exact-sha-redeploy',
    verificationProbe: 'production-identity-liveness-readiness-readback',
    budget: { maxAttempts: 1, cooldownMs: 300_000, timeoutMs: 900_000 },
    exhaustionState: 'ESCALATED',
    description: 'Re-drive an already merged provenance-valid SHA through the existing protected deployment path.',
  },
  PROTECTED_ROLLBACK_RESTORE: {
    id: 'PROTECTED_ROLLBACK_RESTORE',
    tier: 'SH-3',
    activation: 'HELD',
    idempotencyClass: 'PROTECTED',
    blastRadius: 'PROTECTED_STATE',
    requiredCapability: 'recovery.protected.rollback-restore',
    killSwitch: 'self-healing.protected-recovery',
    verificationProbe: 'independent-rollback-restore-integrity',
    budget: { maxAttempts: 1, cooldownMs: 900_000, timeoutMs: 3_600_000 },
    exhaustionState: 'ESCALATED',
    description: 'Protected rollback/restore contract; remains held until independent pre/post conditions are proven.',
  },
};

const POLICIES: Record<FindingClass, RemediationPolicy> = {
  PROCESS_FATAL: policy('PROCESS_FATAL', 'RUNTIME_PROCESS_RECYCLE', ['RUNTIME_PROCESS_RECYCLE', 'OBSERVE_ONLY']),
  LIVENESS_FAILED: policy('LIVENESS_FAILED', 'RUNTIME_PROCESS_RECYCLE', ['RUNTIME_PROCESS_RECYCLE', 'OBSERVE_ONLY']),
  BUSINESS_NOT_READY: policy('BUSINESS_NOT_READY', 'OBSERVE_ONLY', ['OBSERVE_ONLY']),
  DEPENDENCY_TRANSIENT: policy('DEPENDENCY_TRANSIENT', 'RETRY_SAFE_OPERATION', ['RETRY_SAFE_OPERATION', 'OBSERVE_ONLY']),
  DEPENDENCY_PERSISTENT: policy('DEPENDENCY_PERSISTENT', 'OBSERVE_ONLY', ['OBSERVE_ONLY']),
  PROVIDER_CIRCUIT_OPEN: policy('PROVIDER_CIRCUIT_OPEN', 'OBSERVE_ONLY', ['OBSERVE_ONLY']),
  WORKER_STALLED: policy('WORKER_STALLED', 'QUARANTINE_WORK_ITEM', ['QUARANTINE_WORK_ITEM', 'OBSERVE_ONLY'], 'QUARANTINED'),
  DEPLOYMENT_IDENTITY_DRIFT: policy('DEPLOYMENT_IDENTITY_DRIFT', 'REDEPLOY_EXACT_SHA', ['REDEPLOY_EXACT_SHA', 'OBSERVE_ONLY']),
  FRONTEND_STALE_ASSET: policy('FRONTEND_STALE_ASSET', 'FRONTEND_RELOAD_ONCE', ['FRONTEND_RELOAD_ONCE', 'OBSERVE_ONLY']),
  FRONTEND_RENDER_FAILURE: policy('FRONTEND_RENDER_FAILURE', 'OBSERVE_ONLY', ['OBSERVE_ONLY']),
  VERSION_SKEW: policy('VERSION_SKEW', 'FRONTEND_RELOAD_ONCE', ['FRONTEND_RELOAD_ONCE', 'OBSERVE_ONLY']),
  DATA_RECOVERY_REQUIRED: policy('DATA_RECOVERY_REQUIRED', 'PROTECTED_ROLLBACK_RESTORE', ['PROTECTED_ROLLBACK_RESTORE', 'OBSERVE_ONLY']),
  SECURITY_OR_POLICY_BLOCKED: policy('SECURITY_OR_POLICY_BLOCKED', 'OBSERVE_ONLY', ['OBSERVE_ONLY']),
};

function policy(
  findingClass: FindingClass,
  preferredActionId: RemediationActionId,
  allowedActionIds: readonly RemediationActionId[],
  blockedState: 'ESCALATED' | 'QUARANTINED' = 'ESCALATED',
): RemediationPolicy {
  return { findingClass, preferredActionId, allowedActionIds, blockedState };
}

export function getRemediationAction(id: RemediationActionId): RemediationAction {
  return cloneAction(ACTIONS[id]);
}

export function getRemediationActions(): RemediationAction[] {
  return Object.values(ACTIONS).map(cloneAction);
}

export function getRemediationPolicy(findingClass: FindingClass): RemediationPolicy {
  const item = POLICIES[findingClass];
  return { ...item, allowedActionIds: [...item.allowedActionIds] };
}

export function getRemediationPolicies(): RemediationPolicy[] {
  return FINDING_CLASSES.map(getRemediationPolicy);
}

function cloneAction(action: RemediationAction): RemediationAction {
  return { ...action, budget: { ...action.budget } };
}

export type RecoveryState =
  | 'OBSERVED'
  | 'DIAGNOSED'
  | 'ELIGIBLE'
  | 'BLOCKED'
  | 'REMEDIATING'
  | 'VERIFYING'
  | TerminalRecoveryState;

const ALLOWED_TRANSITIONS: Record<RecoveryState, readonly RecoveryState[]> = {
  OBSERVED: ['DIAGNOSED'],
  DIAGNOSED: ['ELIGIBLE', 'BLOCKED'],
  ELIGIBLE: ['REMEDIATING'],
  BLOCKED: ['ESCALATED', 'QUARANTINED'],
  REMEDIATING: ['VERIFYING', 'DEGRADED', 'QUARANTINED', 'ESCALATED'],
  VERIFYING: ['CONVERGED', 'DEGRADED', 'QUARANTINED', 'ESCALATED'],
  CONVERGED: [],
  DEGRADED: [],
  QUARANTINED: [],
  ESCALATED: [],
};

export function canTransitionRecoveryState(from: RecoveryState, to: RecoveryState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export interface RemediationEligibilityInput {
  findingClass: FindingClass;
  actionId: RemediationActionId;
  attemptsUsed: number;
  nowMs: number;
  lastAttemptAtMs?: number;
  killSwitchActive: boolean;
  capabilityAuthorized: boolean;
  verificationAvailable: boolean;
  operationIdempotency?: IdempotencyClass;
}

export type RemediationBlockReason =
  | 'ACTION_NOT_ALLOWED_FOR_FINDING'
  | 'ACTION_HELD'
  | 'KILL_SWITCH_ACTIVE'
  | 'BUDGET_EXHAUSTED'
  | 'COOLDOWN_ACTIVE'
  | 'CAPABILITY_NOT_AUTHORIZED'
  | 'VERIFICATION_UNAVAILABLE'
  | 'UNSAFE_OPERATION_CLASS';

export type RemediationEligibility =
  | { state: 'ELIGIBLE'; action: RemediationAction; remainingAttempts: number }
  | { state: 'BLOCKED'; action: RemediationAction; reason: RemediationBlockReason };

export function evaluateRemediationEligibility(input: RemediationEligibilityInput): RemediationEligibility {
  const action = ACTIONS[input.actionId];
  const policyForFinding = POLICIES[input.findingClass];

  if (!policyForFinding.allowedActionIds.includes(input.actionId)) {
    return blocked(action, 'ACTION_NOT_ALLOWED_FOR_FINDING');
  }
  if (action.activation !== 'ENABLED') {
    return blocked(action, 'ACTION_HELD');
  }
  if (input.killSwitchActive) {
    return blocked(action, 'KILL_SWITCH_ACTIVE');
  }
  if (!Number.isInteger(input.attemptsUsed) || input.attemptsUsed < 0 || input.attemptsUsed >= action.budget.maxAttempts) {
    return blocked(action, 'BUDGET_EXHAUSTED');
  }
  if (
    input.lastAttemptAtMs !== undefined &&
    input.nowMs - input.lastAttemptAtMs < action.budget.cooldownMs
  ) {
    return blocked(action, 'COOLDOWN_ACTIVE');
  }
  if (action.requiredCapability !== null && !input.capabilityAuthorized) {
    return blocked(action, 'CAPABILITY_NOT_AUTHORIZED');
  }
  if (!input.verificationAvailable) {
    return blocked(action, 'VERIFICATION_UNAVAILABLE');
  }
  if (
    action.idempotencyClass === 'IDEMPOTENT' &&
    input.operationIdempotency !== undefined &&
    input.operationIdempotency !== 'READ_ONLY' &&
    input.operationIdempotency !== 'IDEMPOTENT'
  ) {
    return blocked(action, 'UNSAFE_OPERATION_CLASS');
  }

  return {
    state: 'ELIGIBLE',
    action: cloneAction(action),
    remainingAttempts: action.budget.maxAttempts - input.attemptsUsed,
  };
}

function blocked(action: RemediationAction, reason: RemediationBlockReason): RemediationEligibility {
  return { state: 'BLOCKED', action: cloneAction(action), reason };
}

export interface VerificationResult {
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_RUN';
  probe: string;
  evidenceRef?: string;
}

export interface ConvergenceResult {
  state: TerminalRecoveryState;
  converged: boolean;
  reason: 'VERIFIED' | 'VERIFICATION_FAILED' | 'VERIFICATION_BLOCKED' | 'VERIFICATION_NOT_RUN';
  verification: VerificationResult;
}

export function resolveConvergence(
  actionId: RemediationActionId,
  verification: VerificationResult,
  attemptsUsed: number,
): ConvergenceResult {
  const action = ACTIONS[actionId];

  if (verification.status === 'PASS') {
    return { state: 'CONVERGED', converged: true, reason: 'VERIFIED', verification: { ...verification } };
  }
  if (verification.status === 'BLOCKED') {
    return { state: 'ESCALATED', converged: false, reason: 'VERIFICATION_BLOCKED', verification: { ...verification } };
  }
  if (verification.status === 'NOT_RUN') {
    return { state: 'ESCALATED', converged: false, reason: 'VERIFICATION_NOT_RUN', verification: { ...verification } };
  }

  const exhausted = attemptsUsed >= action.budget.maxAttempts;
  return {
    state: exhausted ? action.exhaustionState : 'DEGRADED',
    converged: false,
    reason: 'VERIFICATION_FAILED',
    verification: { ...verification },
  };
}

export interface SelfHealingContractSnapshot {
  version: typeof SELF_HEALING_CONTRACT_VERSION;
  valid: boolean;
  validationErrors: string[];
  findingClasses: readonly FindingClass[];
  enabledActionIds: RemediationActionId[];
  heldActionIds: RemediationActionId[];
  protectedActionIds: RemediationActionId[];
}

export function validateSelfHealingContract(): string[] {
  const errors: string[] = [];

  for (const findingClass of FINDING_CLASSES) {
    const remediationPolicy = POLICIES[findingClass];
    if (!remediationPolicy) {
      errors.push(`missing policy for ${findingClass}`);
      continue;
    }
    if (!remediationPolicy.allowedActionIds.includes(remediationPolicy.preferredActionId)) {
      errors.push(`preferred action not allowed for ${findingClass}`);
    }
    for (const actionId of remediationPolicy.allowedActionIds) {
      if (!ACTIONS[actionId]) errors.push(`unknown action ${actionId} for ${findingClass}`);
    }
  }

  for (const action of Object.values(ACTIONS)) {
    if (!Number.isInteger(action.budget.maxAttempts) || action.budget.maxAttempts < 1) {
      errors.push(`${action.id} maxAttempts must be a positive integer`);
    }
    if (!Number.isFinite(action.budget.cooldownMs) || action.budget.cooldownMs < 0) {
      errors.push(`${action.id} cooldownMs must be finite and non-negative`);
    }
    if (!Number.isFinite(action.budget.timeoutMs) || action.budget.timeoutMs <= 0) {
      errors.push(`${action.id} timeoutMs must be finite and positive`);
    }
    if (!action.killSwitch.trim()) errors.push(`${action.id} requires a kill switch`);
    if (!action.verificationProbe.trim()) errors.push(`${action.id} requires a verification probe`);
    if ((action.tier === 'SH-2' || action.tier === 'SH-3') && !action.requiredCapability) {
      errors.push(`${action.id} protected tiers require an external capability`);
    }
    if (action.requiredCapability === action.id) {
      errors.push(`${action.id} may not self-authorize`);
    }
  }

  return errors;
}

export function getSelfHealingContractSnapshot(): SelfHealingContractSnapshot {
  const validationErrors = validateSelfHealingContract();
  const actions = Object.values(ACTIONS);

  return {
    version: SELF_HEALING_CONTRACT_VERSION,
    valid: validationErrors.length === 0,
    validationErrors,
    findingClasses: [...FINDING_CLASSES],
    enabledActionIds: actions.filter(action => action.activation === 'ENABLED').map(action => action.id),
    heldActionIds: actions.filter(action => action.activation === 'HELD').map(action => action.id),
    protectedActionIds: actions
      .filter(action => action.tier === 'SH-2' || action.tier === 'SH-3')
      .map(action => action.id),
  };
}

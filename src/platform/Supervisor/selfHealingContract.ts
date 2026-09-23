/**
 * Bounded self-healing contract for CAPITAL-AI.
 *
 * This module is intentionally pure: it defines finding classes, remediation
 * policy, budgets and state transitions, but it does not execute remediation.
 * Execution remains with the existing Supervisor/provider/runtime paths.
 */

export const SELF_HEALING_CONTRACT_VERSION = 'self-healing-contract/1.2.0' as const;

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
  'FRONTEND_OPTIONAL_INIT_FAILURE',
  'VERSION_SKEW',
  'DATA_RECOVERY_REQUIRED',
  'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT',
  'REPOSITORY_WORK_GRAPH_EXPECTATION_DRIFT',
  'REPOSITORY_PR_DECISION_EVIDENCE_DRIFT',
  'REPOSITORY_PR_GOVERNANCE_METADATA_DRIFT',
  'REPOSITORY_ISSUE_PROJECT_DISPATCH_DRIFT',
  'PROTECTED_GITHUB_ACTIONS_COST_BLOCKER',
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
  | 'RECONCILE_REPOSITORY_PROJECTION'
  | 'RECONCILE_PR_DECISION_EVIDENCE'
  | 'RECONCILE_PR_GOVERNANCE_METADATA'
  | 'VERIFY_ISSUE_PROJECT_DISPATCH'
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
  RECONCILE_REPOSITORY_PROJECTION: {
    id: 'RECONCILE_REPOSITORY_PROJECTION',
    tier: 'SH-1',
    activation: 'ENABLED',
    idempotencyClass: 'IDEMPOTENT',
    blastRadius: 'WORK_ITEM',
    requiredCapability: 'repository.pr.autofix',
    killSwitch: 'self-healing.repository-pr-autofix',
    verificationProbe: 'exact-pr-head-ci-governance-readback',
    budget: { maxAttempts: 1, cooldownMs: 0, timeoutMs: 300_000 },
    exhaustionState: 'ESCALATED',
    description: 'Delegate an exact allowlisted repository projection or deterministic expectation repair to the existing PR autofix specialists, then require exact-head CI/Governance readback.',
  },
  RECONCILE_PR_GOVERNANCE_METADATA: {
    id: 'RECONCILE_PR_GOVERNANCE_METADATA',
    tier: 'SH-1',
    activation: 'HELD',
    idempotencyClass: 'IDEMPOTENT',
    blastRadius: 'WORK_ITEM',
    requiredCapability: null,
    killSwitch: 'self-healing.pr-governance-metadata-superseded',
    verificationProbe: 'superseded-pr-body-action-held',
    budget: { maxAttempts: 1, cooldownMs: 0, timeoutMs: 300_000 },
    exhaustionState: 'ESCALATED',
    description: 'Superseded compatibility action. Productive PR Governance metadata remediation is routed only through RECONCILE_PR_DECISION_EVIDENCE so no second PR-body writer remains.',
  },
  RECONCILE_PR_DECISION_EVIDENCE: {
    id: 'RECONCILE_PR_DECISION_EVIDENCE',
    tier: 'SH-1',
    activation: 'ENABLED',
    idempotencyClass: 'IDEMPOTENT',
    blastRadius: 'WORK_ITEM',
    requiredCapability: 'repository.pr.decision-evidence-reconciler',
    killSwitch: 'self-healing.pr-decision-evidence-reconciler',
    verificationProbe: 'exact-pr-body-convergence-readback',
    budget: { maxAttempts: 1, cooldownMs: 0, timeoutMs: 300_000 },
    exhaustionState: 'ESCALATED',
    description: 'Single leading PR-body remediation: converge allowlisted structure, production baseline, Governance metadata and Decision/Evidence under one per-PR writer lease and one atomic body write, then require exact-head/base readback.',
  },
  VERIFY_ISSUE_PROJECT_DISPATCH: {
    id: 'VERIFY_ISSUE_PROJECT_DISPATCH',
    tier: 'SH-0',
    activation: 'ENABLED',
    idempotencyClass: 'READ_ONLY',
    blastRadius: 'OBSERVATION',
    requiredCapability: null,
    killSwitch: 'self-healing.issue-project-dispatch',
    verificationProbe: 'issue-open-project-label-routing-generation-readback',
    budget: { maxAttempts: 1, cooldownMs: 0, timeoutMs: 5_000 },
    exhaustionState: 'ESCALATED',
    description: 'Verify GOV issue-routing evidence against the unchanged routing generation, open Issue state and exact canonical project-label provider readback; Issue content never grants execution authority.',
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
  FRONTEND_OPTIONAL_INIT_FAILURE: policy('FRONTEND_OPTIONAL_INIT_FAILURE', 'OBSERVE_ONLY', ['OBSERVE_ONLY']),
  VERSION_SKEW: policy('VERSION_SKEW', 'FRONTEND_RELOAD_ONCE', ['FRONTEND_RELOAD_ONCE', 'OBSERVE_ONLY']),
  DATA_RECOVERY_REQUIRED: policy('DATA_RECOVERY_REQUIRED', 'PROTECTED_ROLLBACK_RESTORE', ['PROTECTED_ROLLBACK_RESTORE', 'OBSERVE_ONLY']),
  REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT: policy(
    'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT',
    'RECONCILE_REPOSITORY_PROJECTION',
    ['RECONCILE_REPOSITORY_PROJECTION', 'OBSERVE_ONLY'],
  ),
  REPOSITORY_WORK_GRAPH_EXPECTATION_DRIFT: policy(
    'REPOSITORY_WORK_GRAPH_EXPECTATION_DRIFT',
    'RECONCILE_REPOSITORY_PROJECTION',
    ['RECONCILE_REPOSITORY_PROJECTION', 'OBSERVE_ONLY'],
  ),
  REPOSITORY_PR_GOVERNANCE_METADATA_DRIFT: policy(
    'REPOSITORY_PR_GOVERNANCE_METADATA_DRIFT',
    'RECONCILE_PR_DECISION_EVIDENCE',
    ['RECONCILE_PR_DECISION_EVIDENCE', 'OBSERVE_ONLY'],
  ),
  REPOSITORY_PR_DECISION_EVIDENCE_DRIFT: policy(
    'REPOSITORY_PR_DECISION_EVIDENCE_DRIFT',
    'RECONCILE_PR_DECISION_EVIDENCE',
    ['RECONCILE_PR_DECISION_EVIDENCE', 'OBSERVE_ONLY'],
  ),
  REPOSITORY_ISSUE_PROJECT_DISPATCH_DRIFT: policy(
    'REPOSITORY_ISSUE_PROJECT_DISPATCH_DRIFT',
    'VERIFY_ISSUE_PROJECT_DISPATCH',
    ['VERIFY_ISSUE_PROJECT_DISPATCH', 'OBSERVE_ONLY'],
  ),
  PROTECTED_GITHUB_ACTIONS_COST_BLOCKER: policy(
    'PROTECTED_GITHUB_ACTIONS_COST_BLOCKER',
    'OBSERVE_ONLY',
    ['OBSERVE_ONLY'],
  ),
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

export const SELF_HEALING_EVIDENCE_CONTRACT_VERSION = 'self-healing-evidence/1.0.0' as const;

export type IndependentAssuranceDomain = 'QM' | 'SECURITY';
export type IndependentAssuranceState = 'NOT_REQUIRED' | 'VERIFIED' | 'PENDING' | 'BLOCKED' | 'FAILED';

export type EvidenceGenerationIdentity =
  | {
      kind: 'PR';
      repository: string;
      prNumber: number;
      headSha: string;
      baseSha: string;
      currentMainSha: string;
      controlPlaneVersion: string;
      generationDigest: string;
    }
  | {
      kind: 'RUNTIME';
      repository: string;
      deployedSha: string;
      currentMainSha: string;
      controlPlaneVersion: string;
      generationDigest: string;
    }
  | {
      kind: 'PROVIDER';
      repository: string;
      resource: string;
      observedRevision: string;
      currentMainSha: string;
      controlPlaneVersion: string;
      generationDigest: string;
    };

export interface VerificationEvidence {
  schema: typeof SELF_HEALING_EVIDENCE_CONTRACT_VERSION;
  evidenceId: string;
  generation: EvidenceGenerationIdentity;
  source: {
    authority: string;
    ref: string;
    observedAt: string;
  };
  integrity: {
    inputDigest: string;
    resultDigest: string;
    recordDigest: string;
  };
  reproducible: boolean;
  current: boolean;
  generationBound: boolean;
  sourceBound: boolean;
  integrityValid: boolean;
  readback: {
    required: boolean;
    verified: boolean;
  };
  contradictionFree: boolean;
  requiredAssurance: IndependentAssuranceDomain[];
  assurance: Partial<Record<IndependentAssuranceDomain, IndependentAssuranceState>>;
}

export type VerificationStatus =
  | 'PASS'
  | 'FAIL'
  | 'BLOCKED'
  | 'NOT_RUN'
  | 'NOT_EXECUTED'
  | 'PENDING'
  | 'NOT_AVAILABLE'
  | 'STALE'
  | 'IDENTITY_MISMATCH'
  | 'READBACK_FAILED';

export type VerificationResult =
  | {
      status: 'PASS';
      probe: string;
      evidenceRef: string;
      evidence: VerificationEvidence;
    }
  | {
      status: Exclude<VerificationStatus, 'PASS'>;
      probe: string;
      evidenceRef?: string;
      evidence?: VerificationEvidence;
    };

export interface EvidenceValidationResult {
  valid: boolean;
  issues: string[];
}

const SHA40 = /^[0-9a-f]{40}$/i;
const SHA256 = /^sha256:[0-9a-f]{64}$/i;

function nonEmpty(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function validGeneration(generation: EvidenceGenerationIdentity, issues: string[]): void {
  if (!nonEmpty(generation.repository)) issues.push('GENERATION_REPOSITORY_REQUIRED');
  if (!SHA40.test(generation.currentMainSha)) issues.push('CURRENT_MAIN_SHA_INVALID');
  if (!nonEmpty(generation.controlPlaneVersion)) issues.push('CONTROL_PLANE_VERSION_REQUIRED');
  if (!SHA256.test(generation.generationDigest)) issues.push('GENERATION_DIGEST_INVALID');

  if (generation.kind === 'PR') {
    if (!Number.isInteger(generation.prNumber) || generation.prNumber < 1) issues.push('PR_NUMBER_INVALID');
    if (!SHA40.test(generation.headSha)) issues.push('PR_HEAD_SHA_INVALID');
    if (!SHA40.test(generation.baseSha)) issues.push('PR_BASE_SHA_INVALID');
  } else if (generation.kind === 'RUNTIME') {
    if (!SHA40.test(generation.deployedSha)) issues.push('DEPLOYED_SHA_INVALID');
  } else {
    if (!nonEmpty(generation.resource)) issues.push('PROVIDER_RESOURCE_REQUIRED');
    if (!nonEmpty(generation.observedRevision)) issues.push('PROVIDER_REVISION_REQUIRED');
  }
}

export function validateVerificationEvidence(
  evidence: VerificationEvidence | undefined,
  additionalRequiredAssurance: readonly IndependentAssuranceDomain[] = [],
): EvidenceValidationResult {
  const issues: string[] = [];
  if (!evidence) return { valid: false, issues: ['EVIDENCE_REQUIRED'] };

  if (evidence.schema !== SELF_HEALING_EVIDENCE_CONTRACT_VERSION) issues.push('EVIDENCE_SCHEMA_INVALID');
  if (!nonEmpty(evidence.evidenceId)) issues.push('EVIDENCE_ID_REQUIRED');
  validGeneration(evidence.generation, issues);

  if (!nonEmpty(evidence.source.authority)) issues.push('AUTHORITATIVE_SOURCE_REQUIRED');
  if (!nonEmpty(evidence.source.ref)) issues.push('SOURCE_REFERENCE_REQUIRED');
  if (!Number.isFinite(Date.parse(evidence.source.observedAt))) issues.push('SOURCE_TIMESTAMP_INVALID');

  for (const [name, digest] of Object.entries(evidence.integrity)) {
    if (!SHA256.test(digest)) issues.push(`${name.toUpperCase()}_INVALID`);
  }

  if (!evidence.reproducible) issues.push('NOT_REPRODUCIBLE');
  if (!evidence.current) issues.push('EVIDENCE_STALE');
  if (!evidence.generationBound) issues.push('GENERATION_NOT_BOUND');
  if (!evidence.sourceBound) issues.push('SOURCE_NOT_BOUND');
  if (!evidence.integrityValid) issues.push('INTEGRITY_NOT_VALID');
  if (evidence.readback.required && !evidence.readback.verified) issues.push('READBACK_NOT_VERIFIED');
  if (!evidence.contradictionFree) issues.push('EVIDENCE_CONTRADICTION');

  const requiredAssurance = new Set<IndependentAssuranceDomain>([
    ...evidence.requiredAssurance,
    ...additionalRequiredAssurance,
  ]);
  for (const domain of requiredAssurance) {
    if (evidence.assurance[domain] !== 'VERIFIED') issues.push(`${domain}_ASSURANCE_NOT_VERIFIED`);
  }

  return { valid: issues.length === 0, issues };
}

export type ConvergenceReason =
  | 'VERIFIED'
  | 'VERIFICATION_FAILED'
  | 'VERIFICATION_BLOCKED'
  | 'VERIFICATION_NOT_RUN'
  | 'VERIFICATION_PENDING'
  | 'EVIDENCE_NOT_AVAILABLE'
  | 'EVIDENCE_STALE'
  | 'IDENTITY_MISMATCH'
  | 'READBACK_FAILED'
  | 'VERIFICATION_EVIDENCE_INVALID';

export interface ConvergenceResult {
  state: TerminalRecoveryState;
  converged: boolean;
  reason: ConvergenceReason;
  verification: VerificationResult;
  evidenceValidation: EvidenceValidationResult;
}

export function resolveConvergence(
  actionId: RemediationActionId,
  verification: VerificationResult,
  attemptsUsed: number,
): ConvergenceResult {
  const action = ACTIONS[actionId];
  const additionalAssurance: IndependentAssuranceDomain[] =
    action.tier === 'SH-3' ? ['QM', 'SECURITY'] : [];
  const evidenceValidation = validateVerificationEvidence(verification.evidence, additionalAssurance);

  if (verification.status === 'PASS') {
    if (!verification.evidenceRef || !evidenceValidation.valid) {
      return {
        state: 'ESCALATED',
        converged: false,
        reason: 'VERIFICATION_EVIDENCE_INVALID',
        verification: { ...verification },
        evidenceValidation,
      };
    }
    return {
      state: 'CONVERGED',
      converged: true,
      reason: 'VERIFIED',
      verification: { ...verification },
      evidenceValidation,
    };
  }

  if (verification.status === 'BLOCKED') {
    return { state: 'ESCALATED', converged: false, reason: 'VERIFICATION_BLOCKED', verification: { ...verification }, evidenceValidation };
  }
  if (verification.status === 'NOT_RUN' || verification.status === 'NOT_EXECUTED') {
    return { state: 'ESCALATED', converged: false, reason: 'VERIFICATION_NOT_RUN', verification: { ...verification }, evidenceValidation };
  }
  if (verification.status === 'PENDING') {
    return { state: 'ESCALATED', converged: false, reason: 'VERIFICATION_PENDING', verification: { ...verification }, evidenceValidation };
  }
  if (verification.status === 'NOT_AVAILABLE') {
    return { state: 'ESCALATED', converged: false, reason: 'EVIDENCE_NOT_AVAILABLE', verification: { ...verification }, evidenceValidation };
  }
  if (verification.status === 'STALE') {
    return { state: 'ESCALATED', converged: false, reason: 'EVIDENCE_STALE', verification: { ...verification }, evidenceValidation };
  }
  if (verification.status === 'IDENTITY_MISMATCH') {
    return { state: 'ESCALATED', converged: false, reason: 'IDENTITY_MISMATCH', verification: { ...verification }, evidenceValidation };
  }
  if (verification.status === 'READBACK_FAILED') {
    return { state: 'ESCALATED', converged: false, reason: 'READBACK_FAILED', verification: { ...verification }, evidenceValidation };
  }

  const exhausted = attemptsUsed >= action.budget.maxAttempts;
  return {
    state: exhausted ? action.exhaustionState : 'DEGRADED',
    converged: false,
    reason: 'VERIFICATION_FAILED',
    verification: { ...verification },
    evidenceValidation,
  };
}

export interface SelfHealingContractSnapshot {
  version: typeof SELF_HEALING_CONTRACT_VERSION;
  evidenceContractVersion: typeof SELF_HEALING_EVIDENCE_CONTRACT_VERSION;
  positiveStateInvariant: 'EVIDENCE_REQUIRED_FOR_PASS_VERIFIED_CONVERGED_READY';
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
    evidenceContractVersion: SELF_HEALING_EVIDENCE_CONTRACT_VERSION,
    positiveStateInvariant: 'EVIDENCE_REQUIRED_FOR_PASS_VERIFIED_CONVERGED_READY',
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


export const SELF_HEALING_OBSERVABILITY_CONTRACT_VERSION = 'self-healing-observability/1.0.0' as const;

export interface RecoveryObservationInput {
  findingId: string;
  correlationId: string;
  findingClass: FindingClass;
  actionId: RemediationActionId;
  attempt: number;
  detectedAt: string;
  verificationStatus: VerificationStatus;
  convergence: ConvergenceResult;
}

export interface RecoveryObservation {
  schema: typeof SELF_HEALING_OBSERVABILITY_CONTRACT_VERSION;
  findingId: string;
  correlationId: string;
  detectedAt: string;
  classification: FindingClass;
  selectedAction: RemediationActionId;
  actionTier: RecoveryTier;
  attempt: number;
  verification: {
    status: VerificationStatus;
    probe: string;
    evidencePresent: boolean;
    readbackRequired: boolean;
    readbackVerified: boolean;
  };
  convergence: {
    state: TerminalRecoveryState;
    converged: boolean;
    reason: ConvergenceReason;
  };
}

const SAFE_OBSERVABILITY_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function requireSafeObservationId(name: string, value: string): string {
  const normalized = String(value || '').trim();
  if (!SAFE_OBSERVABILITY_ID.test(normalized)) {
    throw new Error(`${name}_UNSAFE_OR_INVALID`);
  }
  return normalized;
}

/**
 * Projects one bounded recovery event for the existing Telemetry/EventMesh path.
 *
 * Deliberately excludes raw errors, user/provider payloads, desired/observed
 * business data, secrets and free-form metadata. Callers may emit this
 * projection through the existing telemetry plane; this contract creates no
 * second logger, queue or incident authority.
 */
export function projectRecoveryObservation(input: RecoveryObservationInput): RecoveryObservation {
  const action = ACTIONS[input.actionId];
  if (!action) throw new Error('ACTION_UNKNOWN');
  if (!POLICIES[input.findingClass]?.allowedActionIds.includes(input.actionId)) {
    throw new Error('ACTION_NOT_ALLOWED_FOR_FINDING');
  }
  if (!Number.isInteger(input.attempt) || input.attempt < 1 || input.attempt > action.budget.maxAttempts) {
    throw new Error('ATTEMPT_OUTSIDE_BUDGET');
  }
  if (!Number.isFinite(Date.parse(input.detectedAt))) {
    throw new Error('DETECTED_AT_INVALID');
  }
  if (input.verificationStatus !== input.convergence.verification.status) {
    throw new Error('VERIFICATION_STATUS_MISMATCH');
  }

  return {
    schema: SELF_HEALING_OBSERVABILITY_CONTRACT_VERSION,
    findingId: requireSafeObservationId('FINDING_ID', input.findingId),
    correlationId: requireSafeObservationId('CORRELATION_ID', input.correlationId),
    detectedAt: input.detectedAt,
    classification: input.findingClass,
    selectedAction: input.actionId,
    actionTier: action.tier,
    attempt: input.attempt,
    verification: {
      status: input.convergence.verification.status,
      probe: action.verificationProbe,
      evidencePresent: Boolean(input.convergence.verification.evidence),
      readbackRequired: Boolean(input.convergence.verification.evidence?.readback.required),
      readbackVerified: Boolean(input.convergence.verification.evidence?.readback.verified),
    },
    convergence: {
      state: input.convergence.state,
      converged: input.convergence.converged,
      reason: input.convergence.reason,
    },
  };
}

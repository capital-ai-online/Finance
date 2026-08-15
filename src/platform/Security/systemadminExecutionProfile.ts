// ESS-0021 / ADR-0065 — SA2 Chat Execution Profile for the Systemadmin Roadmap Executor.
//
// SA2 deliberately prepares policy-bound action envelopes but keeps LIVE mutation disabled until
// SA3 has verified append-only mandate/action audit correlation. This avoids an unaudited gap
// between the REM validator (SA1) and the first real autonomous work-package pilot (SA4).

import {
  AGENT_CAPABILITIES,
  type AgentCapability,
  type AgentRiskClass,
} from './agentIam';
import {
  SYSTEMADMIN_AGENT_ID,
  SYSTEMADMIN_BASE_BRANCH,
  SYSTEMADMIN_REPOSITORY,
  type SystemadminRoadmapAuthorizationDecision,
  type SystemadminRoadmapAuthorizationRequest,
} from './roadmapExecutionMandate';
import { evaluateSystemadminRoadmapPolicy } from '../Compliance/PolicyGate';

export const SYSTEMADMIN_CHAT_PROFILE_ID = 'capital-ai-systemadmin-chat-execution';
export const SYSTEMADMIN_CHAT_PROFILE_VERSION = '1.0.0';
export const SYSTEMADMIN_CHAT_APP_ID = 'chatgpt-github-connector';

export const SYSTEMADMIN_CHAT_CAPABILITIES = Object.freeze([
  AGENT_CAPABILITIES.READ,
  AGENT_CAPABILITIES.ANALYZE,
  AGENT_CAPABILITIES.PLAN,
  AGENT_CAPABILITIES.BRANCH,
  AGENT_CAPABILITIES.COMMIT,
  AGENT_CAPABILITIES.PR,
  AGENT_CAPABILITIES.CI_REQUEST,
] as const);

const SYSTEMADMIN_CHAT_CAPABILITY_SET: ReadonlySet<AgentCapability> = new Set(
  SYSTEMADMIN_CHAT_CAPABILITIES,
);

const MUTATING_CHAT_CAPABILITIES: ReadonlySet<AgentCapability> = new Set([
  AGENT_CAPABILITIES.BRANCH,
  AGENT_CAPABILITIES.COMMIT,
  AGENT_CAPABILITIES.PR,
  AGENT_CAPABILITIES.CI_REQUEST,
]);

export type SystemadminChatExecutionMode = 'DRY_RUN' | 'LIVE';
export type SystemadminChatProfileLayer = 'CHAT_PROFILE' | 'REM_POLICY' | 'PROVIDER_PROFILE';

export interface SystemadminChatExecutionCheckpoint {
  /** SA1 has been merged and its authoritative repository CI passed. */
  sa1VerifiedPass: boolean;
  /** Current main SHA was resolved immediately before the work package. */
  mainResolved: boolean;
  /** Current roadmap gate/work package was resolved immediately before execution. */
  roadmapResolved: boolean;
  /** Security/risk/negative-test preflight completed successfully. */
  securityPreflightPassed: boolean;
  /** Open PR changed-file overlap was checked successfully. */
  overlapCheckPassed: boolean;
  /** PR check class D/C/R/M was resolved. */
  checkClassResolved: boolean;
  /** Rollback/revert strategy exists before mutation. */
  rollbackDefined: boolean;
  /** Targeted validation/negative-test plan exists before mutation. */
  testsDefined: boolean;

  freshBranchCreated?: boolean;
  branchName?: string;
  implementationComplete?: boolean;
  targetedValidationPassed?: boolean;
  pullRequestOpen?: boolean;
  pullRequestNumber?: number;
  currentHeadSha?: string;

  /** Once final Human/Owner review starts, the agent may inspect but may not mutate silently. */
  finalOwnerReviewStarted?: boolean;
  /** Tool host detected attempted raw/reusable credential exposure to the model. */
  credentialExposureDetected?: boolean;
  /** Retrieved/tool content attempted to widen mandate/capability/target scope. */
  untrustedScopeElevationDetected?: boolean;
  /** The work package unexpectedly requires a production mutation. */
  productionMutationRequired?: boolean;
}

export interface SystemadminChatExecutionProfileRequest {
  mode: SystemadminChatExecutionMode;
  authorization: Readonly<SystemadminRoadmapAuthorizationRequest>;
  checkpoint: Readonly<SystemadminChatExecutionCheckpoint>;
}

export interface SystemadminChatExecutionDecision {
  verdict: 'ALLOW' | 'DENY';
  reason: string;
  riskClass: AgentRiskClass;
  layer: SystemadminChatProfileLayer;
  capability?: AgentCapability;
  mandateId?: string;
  liveMutationPermitted: boolean;
}

export interface SystemadminPreparedActionEnvelope {
  profileId: typeof SYSTEMADMIN_CHAT_PROFILE_ID;
  profileVersion: typeof SYSTEMADMIN_CHAT_PROFILE_VERSION;
  mandateId: string;
  roadmapItem: string;
  humanActorId: string;
  appId: string;
  agentId: string;
  sessionId: string;
  requestId: string;
  capability: AgentCapability;
  riskClass: AgentRiskClass;
  targetResource: string;
  repository: typeof SYSTEMADMIN_REPOSITORY;
  baseBranch: typeof SYSTEMADMIN_BASE_BRANCH;
  requestedPaths: readonly string[];
  branchName?: string;
  currentHeadSha?: string;
  pullRequestNumber?: number;
  /** SA2 envelopes are preparation evidence only; SA3 must enable audited LIVE execution. */
  liveMutationPermitted: false;
  requiresHumanMerge: true;
}

export type SystemadminPreparedActionResult =
  | { decision: SystemadminChatExecutionDecision }
  | {
      decision: SystemadminChatExecutionDecision & { verdict: 'ALLOW' };
      envelope: Readonly<SystemadminPreparedActionEnvelope>;
    };

function deny(
  request: Readonly<SystemadminChatExecutionProfileRequest>,
  reason: string,
  layer: SystemadminChatProfileLayer = 'CHAT_PROFILE',
  policyDecision?: Readonly<SystemadminRoadmapAuthorizationDecision>,
): SystemadminChatExecutionDecision {
  return {
    verdict: 'DENY',
    reason,
    riskClass: policyDecision?.riskClass ?? request.authorization.riskClass,
    layer,
    ...(policyDecision?.capability ? { capability: policyDecision.capability } : {}),
    ...(policyDecision?.mandateId ? { mandateId: policyDecision.mandateId } : {}),
    liveMutationPermitted: false,
  };
}

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFreshWorkBranch(branchName: string | undefined): branchName is string {
  return isNonEmpty(branchName)
    && branchName !== SYSTEMADMIN_BASE_BRANCH
    && branchName.startsWith('agent/');
}

function hasMutationPreflight(checkpoint: Readonly<SystemadminChatExecutionCheckpoint>): boolean {
  return checkpoint.sa1VerifiedPass
    && checkpoint.mainResolved
    && checkpoint.roadmapResolved
    && checkpoint.securityPreflightPassed
    && checkpoint.overlapCheckPassed
    && checkpoint.checkClassResolved
    && checkpoint.rollbackDefined
    && checkpoint.testsDefined;
}

function evaluateSequence(
  request: Readonly<SystemadminChatExecutionProfileRequest>,
  capability: AgentCapability,
): string | null {
  const checkpoint = request.checkpoint;

  if (!checkpoint.sa1VerifiedPass) return 'SA1 ist nicht als VERIFIED PASS bestätigt.';
  if (checkpoint.credentialExposureDetected) {
    return 'Credential-Exposure erkannt; Systemadmin-Ausführung wird fail-closed gestoppt.';
  }
  if (checkpoint.untrustedScopeElevationDetected) {
    return 'Untrusted Content versucht Scope-Elevation; Systemadmin-Ausführung wird gestoppt.';
  }

  if (MUTATING_CHAT_CAPABILITIES.has(capability)) {
    if (checkpoint.productionMutationRequired) {
      return 'Arbeitspaket benötigt unerwartet Production-Mutation; SA2 muss stoppen und neu eskalieren.';
    }
    if (checkpoint.finalOwnerReviewStarted) {
      return 'Finaler Human/Owner-Review hat begonnen; stille Agent-Mutation ist ab diesem Punkt gesperrt.';
    }
    if (!hasMutationPreflight(checkpoint)) {
      return 'Mutierende Aktion benötigt vollständigen SA2 Security-/Roadmap-Preflight.';
    }
  }

  if (capability === AGENT_CAPABILITIES.PLAN) {
    if (!checkpoint.mainResolved || !checkpoint.roadmapResolved) {
      return 'PLAN benötigt aufgelösten aktuellen main- und Roadmap-Stand.';
    }
  }

  if (capability === AGENT_CAPABILITIES.BRANCH) {
    if (checkpoint.freshBranchCreated) return 'Ein frischer Arbeitsbranch existiert bereits.';
  }

  if (capability === AGENT_CAPABILITIES.COMMIT) {
    if (!checkpoint.freshBranchCreated || !isFreshWorkBranch(checkpoint.branchName)) {
      return 'COMMIT benötigt einen frischen agent/*-Arbeitsbranch abseits von main.';
    }
    if (!checkpoint.targetedValidationPassed) {
      return 'COMMIT benötigt PASS der für diesen Commit vorgesehenen Targeted Validation.';
    }
  }

  if (capability === AGENT_CAPABILITIES.PR) {
    if (!checkpoint.freshBranchCreated || !isFreshWorkBranch(checkpoint.branchName)) {
      return 'PR benötigt einen frischen agent/*-Arbeitsbranch.';
    }
    if (!checkpoint.implementationComplete || !checkpoint.targetedValidationPassed) {
      return 'PR benötigt abgeschlossene Implementierung und Targeted Validation PASS.';
    }
    if (!isNonEmpty(checkpoint.currentHeadSha)) return 'PR benötigt den aktuellen Branch-Head-SHA.';
    if (checkpoint.pullRequestOpen) return 'Für dieses Arbeitspaket ist bereits ein Pull Request offen.';
  }

  if (capability === AGENT_CAPABILITIES.CI_REQUEST) {
    if (!checkpoint.pullRequestOpen || !Number.isInteger(checkpoint.pullRequestNumber)) {
      return 'CI_REQUEST benötigt einen bereits geöffneten Pull Request.';
    }
    if (!isNonEmpty(checkpoint.currentHeadSha)) return 'CI_REQUEST benötigt den aktuellen PR-Head-SHA.';
    if (!checkpoint.targetedValidationPassed) {
      return 'CI_REQUEST benötigt vorherige Targeted Validation PASS.';
    }
  }

  return null;
}

/**
 * SA2 profile evaluation. This is an additional restriction layer in front of SA1.
 *
 * The ChatGPT client id never grants authority by itself; it only constrains which execution
 * surface may use this profile. Authority still comes from the exact Owner-approved REM and the
 * unchanged M4 Agent IAM reached through evaluateSystemadminRoadmapPolicy().
 */
export function evaluateSystemadminChatExecutionProfile(
  request: Readonly<SystemadminChatExecutionProfileRequest>,
): SystemadminChatExecutionDecision {
  if (request.authorization.principal.agentId !== SYSTEMADMIN_AGENT_ID) {
    return deny(request, 'Falscher Agent-Principal für das Systemadmin Chat Execution Profile.');
  }
  if (request.authorization.principal.appId !== SYSTEMADMIN_CHAT_APP_ID) {
    return deny(request, 'Execution-Client ist für das SA2 Chat Profile nicht freigegeben.');
  }
  if (request.authorization.execution.repository !== SYSTEMADMIN_REPOSITORY) {
    return deny(request, 'Execution-Repository entspricht nicht dem Systemadmin-Profil.');
  }
  if (request.authorization.execution.baseBranch !== SYSTEMADMIN_BASE_BRANCH) {
    return deny(request, 'Execution-Base muss main sein.');
  }

  const capability = request.authorization.capability;
  if (!SYSTEMADMIN_CHAT_CAPABILITY_SET.has(capability as AgentCapability)) {
    return deny(request, `Capability ${capability} ist im SA2 Chat Profile nicht freigegeben.`);
  }
  const typedCapability = capability as AgentCapability;

  const sequenceError = evaluateSequence(request, typedCapability);
  if (sequenceError) return deny(request, sequenceError);

  const policyDecision = evaluateSystemadminRoadmapPolicy(request.authorization);
  if (policyDecision.verdict === 'DENY') {
    return deny(request, policyDecision.reason, 'REM_POLICY', policyDecision);
  }

  if (request.mode === 'LIVE' && MUTATING_CHAT_CAPABILITIES.has(typedCapability)) {
    return deny(
      request,
      'LIVE-Mutation bleibt bis SA3 append-only Audit-Korrelation VERIFIED PASS technisch gesperrt.',
      'CHAT_PROFILE',
      policyDecision,
    );
  }

  return {
    verdict: 'ALLOW',
    reason: request.mode === 'DRY_RUN'
      ? 'SA2 Chat Profile, REM-Scope und Agent IAM sind ALLOW; Action darf als Dry-Run vorbereitet werden.'
      : 'Nicht-mutierende LIVE-Aktion ist durch SA2 Chat Profile, REM-Scope und Agent IAM freigegeben.',
    riskClass: policyDecision.riskClass,
    layer: 'REM_POLICY',
    capability: policyDecision.capability,
    mandateId: policyDecision.mandateId,
    liveMutationPermitted: request.mode === 'LIVE' && !MUTATING_CHAT_CAPABILITIES.has(typedCapability),
  };
}

/**
 * Produces a secret-free, immutable action envelope after all SA2 + SA1 policy checks pass.
 *
 * In SA2, mutating envelopes are always marked liveMutationPermitted=false. A tool host MUST NOT
 * interpret an envelope as permission to execute a side effect until SA3 extends the execution
 * path with durable append-only audit correlation.
 */
export function prepareSystemadminChatAction(
  request: Readonly<SystemadminChatExecutionProfileRequest>,
): SystemadminPreparedActionResult {
  const decision = evaluateSystemadminChatExecutionProfile(request);
  if (decision.verdict === 'DENY') return { decision };

  const capability = decision.capability!;
  const mandateId = decision.mandateId!;
  const checkpoint = request.checkpoint;
  const principal = request.authorization.principal;

  const envelope: SystemadminPreparedActionEnvelope = Object.freeze({
    profileId: SYSTEMADMIN_CHAT_PROFILE_ID,
    profileVersion: SYSTEMADMIN_CHAT_PROFILE_VERSION,
    mandateId,
    roadmapItem: request.authorization.execution.roadmapItem,
    humanActorId: principal.humanActorId,
    appId: principal.appId,
    agentId: principal.agentId,
    sessionId: principal.sessionId,
    requestId: principal.requestId,
    capability,
    riskClass: decision.riskClass,
    targetResource: request.authorization.targetResource,
    repository: SYSTEMADMIN_REPOSITORY,
    baseBranch: SYSTEMADMIN_BASE_BRANCH,
    requestedPaths: Object.freeze([...(request.authorization.execution.requestedPaths ?? [])]),
    ...(isFreshWorkBranch(checkpoint.branchName) ? { branchName: checkpoint.branchName } : {}),
    ...(isNonEmpty(checkpoint.currentHeadSha) ? { currentHeadSha: checkpoint.currentHeadSha } : {}),
    ...(Number.isInteger(checkpoint.pullRequestNumber)
      ? { pullRequestNumber: checkpoint.pullRequestNumber }
      : {}),
    liveMutationPermitted: false,
    requiresHumanMerge: true,
  });

  return {
    decision: { ...decision, verdict: 'ALLOW' },
    envelope,
  };
}

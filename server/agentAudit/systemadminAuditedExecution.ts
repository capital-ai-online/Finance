import { AGENT_CAPABILITIES, type AgentCapability } from '../../src/platform/Security/agentIam';
import {
  SYSTEMADMIN_BASE_BRANCH,
  SYSTEMADMIN_REPOSITORY,
} from '../../src/platform/Security/roadmapExecutionMandate';
import {
  SYSTEMADMIN_CHAT_PROFILE_ID,
  SYSTEMADMIN_CHAT_PROFILE_VERSION,
  prepareSystemadminChatAction,
  type SystemadminChatExecutionDecision,
  type SystemadminChatExecutionProfileRequest,
  type SystemadminPreparedActionEnvelope,
} from '../../src/platform/Security/systemadminExecutionProfile';
import { writeAgentAuditEvent, type AgentAuditResult } from './agentAuditWriter';

export const SYSTEMADMIN_SA3_AUDIT_POLICY_ID = 'ADR-0059/ADR-0065/SA3';
const AUDIT_REFERENCE = /^supabase:agent_audit_events:[A-Za-z0-9_-]+$/;
const MUTATING = new Set<AgentCapability>([
  AGENT_CAPABILITIES.BRANCH,
  AGENT_CAPABILITIES.COMMIT,
  AGENT_CAPABILITIES.PR,
  AGENT_CAPABILITIES.CI_REQUEST,
]);

export const SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS = Object.freeze([
  '.ai/contracts/systemadmin-roadmap-execution-profile.json',
  '.ai/contracts/systemadmin-audit-execution-profile.json',
  '.ai/mandates/REM-SA3B-PROBE-001.json',
  '.ai/mandates/REM-SA4-PILOT-001.json',
  '.ai/mandates/REM-M5A-REPOSITORY-001.json',
  '.github/workflows/systemadmin-roadmap-executor.yml',
  '.github/workflows/systemadmin-sa4-pilot.yml',
  '.github/workflows/ci.yml',
  '.github/workflows/capital-ai-ci-shadow.yml',
  '.github/policies/main-production-protection.expected.json',
  'docs/adr/ADR-0067-systemadmin-github-actions-execution-host.md',
  'docs/adr/ADR-0068-first-bounded-autonomous-work-package.md',
  'src/platform/Security/systemadminExecutionProfile.ts',
  'src/platform/Security/roadmapExecutionMandate.ts',
  'server/agentAudit/agentAuditWriter.ts',
  'server/agentAudit/authorizedAgentExecution.ts',
  'server/agentAudit/systemadminAuditedExecution.ts',
  'server/systemadmin/githubActionsOidc.ts',
  'server/systemadmin/systemadminExecutionBrokerRouter.ts',
  'scripts/systemadmin/validateExecutionIssue.mjs',
  'scripts/systemadmin/validateSa4PilotIssue.mjs',
  'scripts/systemadmin/runSa4Pilot.mjs',
  'scripts/security/verifyChangedWorkflowSecurity.mjs',
] as const);

export interface SystemadminAuditContext {
  traceId: string;
  spanId?: string;
  policyId?: string;
  toolId?: string;
  workflowRunId?: string;
  runtimeVersion?: string;
  rollbackReference?: string;
  metadata?: Record<string, unknown>;
}

export type SystemadminAuditedExecutionPermit = Readonly<
  SystemadminPreparedActionEnvelope & {
    authorizationAuditReference: string;
    auditBoundExecutionPermitted: true;
  }
>;

export interface SystemadminAuditedAuthorization {
  decision: SystemadminChatExecutionDecision;
  auditReference: string;
  traceId: string;
  executionPermit?: SystemadminAuditedExecutionPermit;
}

function touchesOwnControlPlane(request: Readonly<SystemadminChatExecutionProfileRequest>): boolean {
  if (!MUTATING.has(request.authorization.capability as AgentCapability)) return false;
  return (request.authorization.execution.requestedPaths ?? []).some(path =>
    SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS.includes(
      path as (typeof SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS)[number],
    ));
}

function selfAuthorityDeny(decision: Readonly<SystemadminChatExecutionDecision>): SystemadminChatExecutionDecision {
  return {
    verdict: 'DENY',
    reason: 'SA3/SA4 Audit-/Execution-Control-Plane ist für Systemadmin-REM-Mutationen geschützt.',
    riskClass: decision.riskClass,
    layer: 'CHAT_PROFILE',
    ...(decision.capability ? { capability: decision.capability } : {}),
    ...(decision.mandateId ? { mandateId: decision.mandateId } : {}),
    liveMutationPermitted: false,
  };
}

export async function authorizeSystemadminAuditedExecution(
  input: Readonly<Omit<SystemadminChatExecutionProfileRequest, 'mode'>>,
  context: Readonly<SystemadminAuditContext>,
): Promise<SystemadminAuditedAuthorization> {
  const request: SystemadminChatExecutionProfileRequest = { ...input, mode: 'DRY_RUN' };
  const prepared = prepareSystemadminChatAction(request);
  const decision = touchesOwnControlPlane(request)
    ? selfAuthorityDeny(prepared.decision)
    : prepared.decision;
  const principal = request.authorization.principal;
  const checkpoint = request.checkpoint;
  const roadmapItem = request.authorization.execution.roadmapItem;
  const requestedPaths = request.authorization.execution.requestedPaths ?? [];

  const auditReference = await writeAgentAuditEvent({
    requestId: principal.requestId,
    traceId: context.traceId,
    humanActorId: principal.humanActorId,
    appId: principal.appId,
    agentId: principal.agentId,
    intent: 'systemadmin_authorization',
    scope: {
      mandateId: decision.mandateId,
      roadmapItem,
      targetResource: request.authorization.targetResource,
      repository: SYSTEMADMIN_REPOSITORY,
      baseBranch: SYSTEMADMIN_BASE_BRANCH,
      requestedPaths,
      branchName: checkpoint.branchName,
      currentHeadSha: checkpoint.currentHeadSha,
      pullRequestNumber: checkpoint.pullRequestNumber,
    },
    capability: decision.capability ?? request.authorization.capability,
    riskClass: decision.riskClass,
    policyId: context.policyId ?? SYSTEMADMIN_SA3_AUDIT_POLICY_ID,
    decision: decision.verdict,
    repository: SYSTEMADMIN_REPOSITORY,
    result: decision.verdict === 'ALLOW' ? 'PENDING' : 'DENIED',
    ...(checkpoint.branchName ? { branch: checkpoint.branchName } : {}),
    ...(checkpoint.currentHeadSha ? { commitSha: checkpoint.currentHeadSha } : {}),
    ...(context.spanId ? { spanId: context.spanId } : {}),
    ...(context.toolId ? { toolId: context.toolId } : {}),
    ...(context.workflowRunId ? { workflowRunId: context.workflowRunId } : {}),
    ...(context.runtimeVersion ? { runtimeVersion: context.runtimeVersion } : {}),
    ...(context.rollbackReference ? { rollbackReference: context.rollbackReference } : {}),
    ...(Number.isInteger(checkpoint.pullRequestNumber)
      ? { prNumber: checkpoint.pullRequestNumber }
      : {}),
    metadata: {
      ...context.metadata,
      eventType: 'systemadmin_authorization',
      profileId: SYSTEMADMIN_CHAT_PROFILE_ID,
      profileVersion: SYSTEMADMIN_CHAT_PROFILE_VERSION,
      mandateId: decision.mandateId,
      roadmapItem,
      sessionId: principal.sessionId,
      targetResource: request.authorization.targetResource,
      baseBranch: SYSTEMADMIN_BASE_BRANCH,
      requestedPaths,
      branchName: checkpoint.branchName,
      currentHeadSha: checkpoint.currentHeadSha,
      pullRequestNumber: checkpoint.pullRequestNumber,
      authorizationReason: decision.reason,
    },
  });

  if (decision.verdict !== 'ALLOW' || !('envelope' in prepared)) {
    return Object.freeze({ decision, auditReference, traceId: context.traceId });
  }
  if (!AUDIT_REFERENCE.test(auditReference)) {
    throw new Error('[SystemadminAudit][SECURITY] invalid authorization audit reference.');
  }

  const executionPermit: SystemadminAuditedExecutionPermit = Object.freeze({
    ...prepared.envelope,
    authorizationAuditReference: auditReference,
    auditBoundExecutionPermitted: true as const,
  });
  return Object.freeze({ decision, auditReference, traceId: context.traceId, executionPermit });
}

export async function recordSystemadminAuditedOutcome(input: Readonly<{
  authorization: SystemadminAuditedAuthorization;
  result: Extract<AgentAuditResult, 'SUCCESS' | 'ERROR'>;
  branchName?: string;
  commitSha?: string;
  pullRequestNumber?: number;
  workflowRunId?: string;
  policyId?: string;
  metadata?: Record<string, unknown>;
}>): Promise<string> {
  const permit = input.authorization.executionPermit;
  if (input.authorization.decision.verdict !== 'ALLOW' || !permit) {
    throw new Error('[SystemadminAudit][SECURITY] outcome requires an audited ALLOW permit.');
  }
  if (!AUDIT_REFERENCE.test(input.authorization.auditReference)
    || permit.authorizationAuditReference !== input.authorization.auditReference) {
    throw new Error('[SystemadminAudit][SECURITY] authorization audit reference mismatch.');
  }

  const branchName = input.branchName ?? permit.branchName;
  const pullRequestNumber = input.pullRequestNumber ?? permit.pullRequestNumber;

  return writeAgentAuditEvent({
    requestId: permit.requestId,
    traceId: input.authorization.traceId,
    humanActorId: permit.humanActorId,
    appId: permit.appId,
    agentId: permit.agentId,
    intent: 'systemadmin_execution_outcome',
    scope: {
      mandateId: permit.mandateId,
      roadmapItem: permit.roadmapItem,
      targetResource: permit.targetResource,
      repository: permit.repository,
      requestedPaths: permit.requestedPaths,
      branchName,
      authorizationHeadSha: permit.currentHeadSha,
      commitSha: input.commitSha,
      pullRequestNumber,
    },
    capability: permit.capability,
    riskClass: permit.riskClass,
    policyId: input.policyId ?? SYSTEMADMIN_SA3_AUDIT_POLICY_ID,
    decision: 'ALLOW',
    repository: permit.repository,
    result: input.result,
    ...(branchName ? { branch: branchName } : {}),
    ...(input.commitSha ? { commitSha: input.commitSha } : {}),
    ...(input.workflowRunId ? { workflowRunId: input.workflowRunId } : {}),
    ...(Number.isInteger(pullRequestNumber)
      ? { prNumber: pullRequestNumber }
      : {}),
    metadata: {
      ...input.metadata,
      eventType: 'systemadmin_execution_outcome',
      authorizationAuditReference: input.authorization.auditReference,
      mandateId: permit.mandateId,
      roadmapItem: permit.roadmapItem,
      sessionId: permit.sessionId,
      targetResource: permit.targetResource,
      requestedPaths: permit.requestedPaths,
      branchName,
      authorizationHeadSha: permit.currentHeadSha,
      commitSha: input.commitSha,
      pullRequestNumber,
      requiresHumanMerge: permit.requiresHumanMerge,
    },
  });
}

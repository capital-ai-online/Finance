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
import { checkProviderProfileScope } from '../../src/platform/Security/providerProfile';
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
  '.ai/mandates/REM-WORKPACKAGE-GEN-PROOF-001.json',
  '.github/workflows/systemadmin-roadmap-executor.yml',
  '.github/workflows/systemadmin-sa4-pilot.yml',
  '.github/workflows/systemadmin-work-package-runner.yml',
  '.github/workflows/ci.yml',
  '.github/workflows/capital-ai-ci-shadow.yml',
  '.github/policies/main-production-protection.expected.json',
  'docs/adr/ADR-0067-systemadmin-github-actions-execution-host.md',
  'docs/adr/ADR-0068-first-bounded-autonomous-work-package.md',
  'docs/adr/ADR-0074-generalized-systemadmin-work-package-catalog.md',
  'src/platform/Security/systemadminExecutionProfile.ts',
  'src/platform/Security/roadmapExecutionMandate.ts',
  'server/agentAudit/agentAuditWriter.ts',
  'server/agentAudit/authorizedAgentExecution.ts',
  'server/agentAudit/systemadminAuditedExecution.ts',
  'server/systemadmin/githubActionsOidc.ts',
  'server/systemadmin/systemadminExecutionBrokerRouter.ts',
  'server/systemadmin/breakGlassRouter.ts',
  'src/platform/Security/breakGlass.ts',
  'scripts/systemadmin/validateExecutionIssue.mjs',
  'scripts/systemadmin/validateSa4PilotIssue.mjs',
  'scripts/systemadmin/runSa4Pilot.mjs',
  'scripts/systemadmin/validateWorkPackageIssue.mjs',
  'scripts/systemadmin/runWorkPackage.mjs',
  'scripts/systemadmin/workPackages/registry.mjs',
  'scripts/systemadmin/workPackages/generalizationProof.mjs',
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
    auditCorrelationId: string;
    provider?: string;
    model?: string;
    toolId?: string;
    auditBoundExecutionPermitted: true;
  }
>;

export interface SystemadminAuditedAuthorization {
  decision: SystemadminChatExecutionDecision;
  auditReference: string;
  auditCorrelationId: string;
  traceId: string;
  executionPermit?: SystemadminAuditedExecutionPermit;
}

function buildAuditCorrelationId(requestId: string, traceId: string, sessionId: string): string {
  const parts = { requestId: requestId.trim(), traceId: traceId.trim(), sessionId: sessionId.trim() };
  for (const [name, value] of Object.entries(parts)) {
    if (!value) throw new Error(`[SystemadminAudit][SECURITY] ${name} is required for M8 audit correlation.`);
  }
  return `${parts.requestId}:${parts.traceId}:${parts.sessionId}`;
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

// M8 (ADR-0062, docs/runbooks/M8_AGENT_CUTOVER.md, "Policy Equivalence Tests" against a real
// caller). The SA2 profile already hardcodes the equivalent of a ChatGPT provider profile
// (SYSTEMADMIN_CHAT_APP_ID + SYSTEMADMIN_CHAT_CAPABILITIES). This adds an independent, generic
// M8 Provider Profile Registry check that must ALSO agree - it can only narrow, never widen, what
// SA2/SA1/M4 already decide. Deliberately does NOT re-run agentIam.ts a second time (that stays
// the sole job of evaluateSystemadminRoadmapPolicy() inside prepareSystemadminChatAction); see
// checkProviderProfileScope's own doc comment for why re-running it here would be unsafe.
function providerProfileDeny(
  decision: Readonly<SystemadminChatExecutionDecision>,
  reason: string,
): SystemadminChatExecutionDecision {
  return {
    verdict: 'DENY',
    reason: `M8 Provider-Profile-Gate: ${reason}`,
    riskClass: decision.riskClass,
    layer: 'PROVIDER_PROFILE',
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
  const providerScope = checkProviderProfileScope({
    appId: request.authorization.principal.appId,
    principal: request.authorization.principal,
    capability: request.authorization.capability,
    riskClass: request.authorization.riskClass,
    auditCorrelationId: context.traceId,
    envelopeId: request.authorization.envelopeId,
    seenEnvelopeIds: request.authorization.seenEnvelopeIds,
  });
  const decision = touchesOwnControlPlane(request)
    ? selfAuthorityDeny(prepared.decision)
    : providerScope.verdict === 'DENY'
      ? providerProfileDeny(prepared.decision, providerScope.reason)
      : prepared.decision;
  const principal = request.authorization.principal;
  const checkpoint = request.checkpoint;
  const roadmapItem = request.authorization.execution.roadmapItem;
  const requestedPaths = request.authorization.execution.requestedPaths ?? [];
  const auditCorrelationId = buildAuditCorrelationId(
    principal.requestId,
    context.traceId,
    principal.sessionId,
  );

  const auditReference = await writeAgentAuditEvent({
    requestId: principal.requestId,
    traceId: context.traceId,
    humanActorId: principal.humanActorId,
    appId: principal.appId,
    agentId: principal.agentId,
    ...(principal.provider ? { provider: principal.provider } : {}),
    ...(principal.model ? { model: principal.model } : {}),
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
      auditCorrelationId,
      environment: request.authorization.environment,
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
      auditCorrelationId,
      requestId: principal.requestId,
      traceId: context.traceId,
      environment: request.authorization.environment,
      providerProfileId: principal.appId,
    },
  });

  if (decision.verdict !== 'ALLOW' || !('envelope' in prepared)) {
    return Object.freeze({ decision, auditReference, auditCorrelationId, traceId: context.traceId });
  }
  if (!AUDIT_REFERENCE.test(auditReference)) {
    throw new Error('[SystemadminAudit][SECURITY] invalid authorization audit reference.');
  }

  const executionPermit: SystemadminAuditedExecutionPermit = Object.freeze({
    ...prepared.envelope,
    authorizationAuditReference: auditReference,
    auditCorrelationId,
    ...(principal.provider ? { provider: principal.provider } : {}),
    ...(principal.model ? { model: principal.model } : {}),
    ...(context.toolId ? { toolId: context.toolId } : {}),
    auditBoundExecutionPermitted: true as const,
  });
  return Object.freeze({ decision, auditReference, auditCorrelationId, traceId: context.traceId, executionPermit });
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
  const expectedCorrelationId = buildAuditCorrelationId(
    permit.requestId,
    input.authorization.traceId,
    permit.sessionId,
  );
  if (input.authorization.auditCorrelationId !== expectedCorrelationId
    || permit.auditCorrelationId !== expectedCorrelationId) {
    throw new Error('[SystemadminAudit][SECURITY] authorization/outcome audit correlation mismatch.');
  }

  const branchName = input.branchName ?? permit.branchName;
  const pullRequestNumber = input.pullRequestNumber ?? permit.pullRequestNumber;

  return writeAgentAuditEvent({
    requestId: permit.requestId,
    traceId: input.authorization.traceId,
    humanActorId: permit.humanActorId,
    appId: permit.appId,
    agentId: permit.agentId,
    ...(permit.provider ? { provider: permit.provider } : {}),
    ...(permit.model ? { model: permit.model } : {}),
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
      auditCorrelationId: expectedCorrelationId,
      authorizationAuditReference: input.authorization.auditReference,
    },
    capability: permit.capability,
    riskClass: permit.riskClass,
    policyId: input.policyId ?? SYSTEMADMIN_SA3_AUDIT_POLICY_ID,
    decision: 'ALLOW',
    repository: permit.repository,
    result: input.result,
    ...(permit.toolId ? { toolId: permit.toolId } : {}),
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
      auditCorrelationId: expectedCorrelationId,
      authorizationRequestId: permit.requestId,
      authorizationTraceId: input.authorization.traceId,
      authorizationSessionId: permit.sessionId,
      providerProfileId: permit.appId,
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

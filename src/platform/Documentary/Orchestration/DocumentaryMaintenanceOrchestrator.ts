import type { PlatformDecisionRecord } from '../../PlatformDirector/Contracts/PlatformDecision';
import { assertProtectedDecisionBoundary } from '../../PlatformDirector/Policies/ProtectedDecisionBoundary';
import { evaluateAgentPolicy } from '../../Compliance/PolicyGate';
import {
  AGENT_CAPABILITIES,
  type AgentAuthorizationRequest,
  type AgentCapability,
} from '../../Security/agentIam';
import type { DocumentaryMaintenanceRecommendation } from '../../Supervisor/documentaryMaintenanceObservation';
import type { SemanticFreshnessReport } from '../Discovery/SemanticFreshnessAnalyzer';
import {
  planDocumentaryMaintenance,
  type DocumentaryMaintenancePlan,
  type DocumentarySemanticMaintenanceProvider,
} from '../Agents/DocumentaryMaintenanceAgent';

export const DOCUMENTARY_MAINTENANCE_ORCHESTRATOR_VERSION = 'documentary-maintenance-orchestrator/1.0.0' as const;

export type DocumentaryAgentAuthorizationContext = Omit<AgentAuthorizationRequest, 'capability'>;

export interface AuthorizedDocumentaryMaintenanceTask {
  orchestratorVersion: typeof DOCUMENTARY_MAINTENANCE_ORCHESTRATOR_VERSION;
  decisionId: string;
  correlationId: string;
  sourceCommit: string;
  supervisorEvidenceId: string;
  patchablePaths: string[];
  reviewRequiredPaths: string[];
}

function assertAgentCapability(context: DocumentaryAgentAuthorizationContext, capability: AgentCapability): void {
  const decision = evaluateAgentPolicy({ ...context, capability });
  if (decision.verdict !== 'ALLOW') {
    throw new Error(`[DocumentaryMaintenanceOrchestrator] Agent capability ${capability} denied: ${decision.reason}`);
  }
}

export function authorizeDocumentaryMaintenanceTask(options: {
  decision: PlatformDecisionRecord;
  recommendation: DocumentaryMaintenanceRecommendation;
  freshness: SemanticFreshnessReport;
  agentAuthorization: DocumentaryAgentAuthorizationContext;
}): AuthorizedDocumentaryMaintenanceTask {
  assertProtectedDecisionBoundary(options.decision);
  if (options.decision.status !== 'APPROVED' || options.decision.decidedBy !== 'Platform Director') {
    throw new Error('[DocumentaryMaintenanceOrchestrator] an approved Platform Director decision is required.');
  }
  if (!options.decision.affectedComponents.some((component) => component.toLowerCase() === 'documentary')) {
    throw new Error('[DocumentaryMaintenanceOrchestrator] Platform Decision must explicitly include Documentary in affectedComponents.');
  }
  if (options.recommendation.verdict !== 'RECOMMENDED') {
    throw new Error(`[DocumentaryMaintenanceOrchestrator] Supervisor recommendation is ${options.recommendation.verdict}.`);
  }
  if (
    options.decision.correlationId !== options.recommendation.correlationId ||
    options.freshness.correlationId !== options.recommendation.correlationId
  ) {
    throw new Error('[DocumentaryMaintenanceOrchestrator] correlationId mismatch across decision, Supervisor and freshness evidence.');
  }
  if (options.freshness.sourceCommit !== options.recommendation.sourceCommit) {
    throw new Error('[DocumentaryMaintenanceOrchestrator] sourceCommit mismatch between Supervisor and freshness evidence.');
  }

  const supervisorEvidence = options.decision.prerequisites.supervisorAssessment;
  if (!supervisorEvidence || supervisorEvidence.outcome !== 'PASS') {
    throw new Error('[DocumentaryMaintenanceOrchestrator] Platform Decision requires PASS Supervisor assessment evidence.');
  }
  if (supervisorEvidence.evidenceId !== options.recommendation.evidenceId) {
    throw new Error('[DocumentaryMaintenanceOrchestrator] Platform Decision is not bound to the current Supervisor evidenceId.');
  }

  assertAgentCapability(options.agentAuthorization, AGENT_CAPABILITIES.ANALYZE);
  assertAgentCapability(options.agentAuthorization, AGENT_CAPABILITIES.PLAN);

  return Object.freeze({
    orchestratorVersion: DOCUMENTARY_MAINTENANCE_ORCHESTRATOR_VERSION,
    decisionId: options.decision.decisionId,
    correlationId: options.decision.correlationId,
    sourceCommit: options.recommendation.sourceCommit,
    supervisorEvidenceId: options.recommendation.evidenceId,
    patchablePaths: [...options.recommendation.patchablePaths],
    reviewRequiredPaths: [...options.recommendation.reviewRequiredPaths],
  });
}

export async function orchestrateDocumentaryMaintenance(options: {
  repoRoot?: string;
  decision: PlatformDecisionRecord;
  recommendation: DocumentaryMaintenanceRecommendation;
  freshness: SemanticFreshnessReport;
  provider: DocumentarySemanticMaintenanceProvider;
  agentAuthorization: DocumentaryAgentAuthorizationContext;
  minConfidence?: number;
}): Promise<{ task: AuthorizedDocumentaryMaintenanceTask; plan: DocumentaryMaintenancePlan }> {
  const task = authorizeDocumentaryMaintenanceTask(options);
  const plan = await planDocumentaryMaintenance({
    repoRoot: options.repoRoot,
    freshness: options.freshness,
    recommendation: options.recommendation,
    provider: options.provider,
    minConfidence: options.minConfidence,
  });
  return { task, plan };
}

export function assertDocumentaryRepositoryMutationCapability(
  context: DocumentaryAgentAuthorizationContext,
  capability: 'BRANCH' | 'COMMIT' | 'PR',
): void {
  assertAgentCapability(context, capability);
}

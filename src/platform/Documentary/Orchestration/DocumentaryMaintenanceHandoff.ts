import type { ApplicationChangeImpact } from '../Discovery/ApplicationChangeImpactAnalyzer';
import type { DocumentaryAutoSyncPlan } from '../Automation/DocumentaryAutoSyncEngine';

export const DOCUMENTARY_MAINTENANCE_HANDOFF_VERSION = 'documentary-maintenance-handoff/1.0.0' as const;

export type DocumentaryMaintenanceHandoffState =
  | 'AUTO_SYNC_DRAFT_PR'
  | 'SEMANTIC_AUTHORIZATION_REQUIRED'
  | 'REVIEW_ONLY'
  | 'NO_ACTION';

export interface DocumentaryMaintenanceHandoff {
  handoffVersion: typeof DOCUMENTARY_MAINTENANCE_HANDOFF_VERSION;
  correlationId: string;
  sourceCommit: string;
  state: DocumentaryMaintenanceHandoffState;
  autoSyncPaths: string[];
  semanticPatchPaths: string[];
  reviewRequiredPaths: string[];
  maintenanceEntryPoint: 'scripts/automation/runDocumentaryMaintenanceControlLoop.ts';
  draftPrWorkflow: '.github/workflows/open-agent-draft-pr.yml';
  requiredAuthorization: {
    required: boolean;
    chain: string[];
    syntheticApprovalAllowed: false;
  };
}

export function buildDocumentaryMaintenanceHandoff(options: {
  impact: ApplicationChangeImpact;
  autoSync: DocumentaryAutoSyncPlan;
}): DocumentaryMaintenanceHandoff {
  if (options.impact.sourceCommit !== options.autoSync.sourceCommit) {
    throw new Error('[DocumentaryMaintenanceHandoff] sourceCommit mismatch between impact and AUTO_SYNC evidence.');
  }

  const autoSyncPaths = options.autoSync.patches.map((patch) => patch.path).sort();
  const semanticPatchPaths = [...options.impact.patchableDocumentationPaths].sort();
  const reviewRequiredPaths = [...options.impact.reviewOnlyDocumentationPaths].sort();

  const state: DocumentaryMaintenanceHandoffState = autoSyncPaths.length > 0
    ? 'AUTO_SYNC_DRAFT_PR'
    : semanticPatchPaths.length > 0
      ? 'SEMANTIC_AUTHORIZATION_REQUIRED'
      : reviewRequiredPaths.length > 0
        ? 'REVIEW_ONLY'
        : 'NO_ACTION';

  const authorizationRequired = state === 'SEMANTIC_AUTHORIZATION_REQUIRED';

  return Object.freeze({
    handoffVersion: DOCUMENTARY_MAINTENANCE_HANDOFF_VERSION,
    correlationId: options.impact.correlationId,
    sourceCommit: options.impact.sourceCommit,
    state,
    autoSyncPaths,
    semanticPatchPaths,
    reviewRequiredPaths,
    maintenanceEntryPoint: 'scripts/automation/runDocumentaryMaintenanceControlLoop.ts',
    draftPrWorkflow: '.github/workflows/open-agent-draft-pr.yml',
    requiredAuthorization: {
      required: authorizationRequired,
      chain: authorizationRequired
        ? ['Supervisor recommendation', 'Platform Director APPROVED decision', 'Agent IAM ANALYZE/PLAN/BRANCH/COMMIT/PR']
        : [],
      syntheticApprovalAllowed: false,
    },
  });
}

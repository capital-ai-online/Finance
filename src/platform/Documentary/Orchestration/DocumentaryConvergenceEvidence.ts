import type { ApplicationChangeImpact } from '../Discovery/ApplicationChangeImpactAnalyzer';
import type { DocumentaryAutoSyncPlan } from '../Automation/DocumentaryAutoSyncEngine';
import type { DocumentaryMaintenanceHandoff } from './DocumentaryMaintenanceHandoff';
import {
  SELF_HEALING_CONTRACT_VERSION,
  getSelfHealingContractSnapshot,
} from '../../Supervisor/selfHealingContract';

export const DOCUMENTARY_CONVERGENCE_EVIDENCE_VERSION = 'documentary-convergence-evidence/1.1.0' as const;
export const DOCUMENTARY_SELF_HEALING_PARENT = 'OPS-08-B-SH-02' as const;
export const DOCUMENTARY_SELF_HEALING_CONTRACT = 'SH-02.3' as const;

export interface DocumentaryConvergenceEvidence {
  evidenceVersion: typeof DOCUMENTARY_CONVERGENCE_EVIDENCE_VERSION;
  role: 'EVIDENCE_PROJECTION_ONLY';
  parentWorkPackage: typeof DOCUMENTARY_SELF_HEALING_PARENT;
  parentContract: typeof DOCUMENTARY_SELF_HEALING_CONTRACT;
  sourceCommit: string;
  correlationId: string;
  observedCurrentMain: boolean;
  triggerModel: 'MAIN_PUSH_EVENT_DRIVEN';
  staleMainPolicy: 'ABORT_AND_RESTART_ON_NEXT_MAIN_PUSH';
  concurrencyKey: string;
  branchCollisionPolicy: 'IDEMPOTENT_REUSE';
  impactState: DocumentaryMaintenanceHandoff['state'];
  counts: {
    changedPaths: number;
    routeSignals: number;
    dependencySignals: number;
    patchableDocumentationPaths: number;
    reviewOnlyDocumentationPaths: number;
    autoSyncPatches: number;
  };
  selfHealingContract: {
    version: typeof SELF_HEALING_CONTRACT_VERSION;
    valid: true;
    authorityClaimedByDocumentary: false;
    enabledActions: number;
    heldActions: number;
    protectedActions: number;
  };
  convergenceClaim: 'NOT_ESTABLISHED_BY_DOCUMENTARY_EVIDENCE';
}

export function buildDocumentaryConvergenceEvidence(options: {
  impact: ApplicationChangeImpact;
  autoSync: DocumentaryAutoSyncPlan;
  handoff: DocumentaryMaintenanceHandoff;
  observedCurrentMain: boolean;
  concurrencyKey: string;
}): DocumentaryConvergenceEvidence {
  const sourceCommit = options.impact.sourceCommit.toLowerCase();
  if (
    sourceCommit !== options.autoSync.sourceCommit.toLowerCase() ||
    sourceCommit !== options.handoff.sourceCommit.toLowerCase()
  ) {
    throw new Error('[DocumentaryConvergenceEvidence] sourceCommit mismatch across impact/AUTO_SYNC/handoff evidence.');
  }
  if (options.impact.correlationId !== options.handoff.correlationId) {
    throw new Error('[DocumentaryConvergenceEvidence] correlationId mismatch across impact/handoff evidence.');
  }
  if (!options.concurrencyKey.trim()) {
    throw new Error('[DocumentaryConvergenceEvidence] concurrencyKey is required.');
  }

  const contract = getSelfHealingContractSnapshot();
  if (!contract.valid) {
    throw new Error(
      `[DocumentaryConvergenceEvidence] SH-02.3 contract invalid: ${contract.validationErrors.join('; ')}`,
    );
  }

  return Object.freeze({
    evidenceVersion: DOCUMENTARY_CONVERGENCE_EVIDENCE_VERSION,
    role: 'EVIDENCE_PROJECTION_ONLY',
    parentWorkPackage: DOCUMENTARY_SELF_HEALING_PARENT,
    parentContract: DOCUMENTARY_SELF_HEALING_CONTRACT,
    sourceCommit,
    correlationId: options.impact.correlationId,
    observedCurrentMain: options.observedCurrentMain,
    triggerModel: 'MAIN_PUSH_EVENT_DRIVEN',
    staleMainPolicy: 'ABORT_AND_RESTART_ON_NEXT_MAIN_PUSH',
    concurrencyKey: options.concurrencyKey,
    branchCollisionPolicy: 'IDEMPOTENT_REUSE',
    impactState: options.handoff.state,
    counts: {
      changedPaths: options.impact.changedPaths.length,
      routeSignals: options.impact.routeSignals.length,
      dependencySignals: options.impact.dependencySignals.length,
      patchableDocumentationPaths: options.impact.patchableDocumentationPaths.length,
      reviewOnlyDocumentationPaths: options.impact.reviewOnlyDocumentationPaths.length,
      autoSyncPatches: options.autoSync.patches.length,
    },
    selfHealingContract: {
      version: contract.version,
      valid: true as const,
      authorityClaimedByDocumentary: false as const,
      enabledActions: contract.enabledActionIds.length,
      heldActions: contract.heldActionIds.length,
      protectedActions: contract.protectedActionIds.length,
    },
    convergenceClaim: 'NOT_ESTABLISHED_BY_DOCUMENTARY_EVIDENCE',
  });
}

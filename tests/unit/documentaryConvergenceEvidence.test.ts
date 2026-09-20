import { describe, expect, it } from 'vitest';
import {
  buildDocumentaryConvergenceEvidence,
  DOCUMENTARY_SELF_HEALING_CONTRACT,
  DOCUMENTARY_SELF_HEALING_PARENT,
} from '../../src/platform/Documentary/Orchestration/DocumentaryConvergenceEvidence';
import { SELF_HEALING_CONTRACT_VERSION } from '../../src/platform/Supervisor/selfHealingContract';

function fixture(overrides: Partial<any> = {}) {
  const sourceCommit = 'a'.repeat(40);
  const correlationId = 'corr-wp06e';
  return {
    impact: {
      analyzerVersion: 'documentary-application-change-impact/1.0.0',
      correlationId,
      sourceCommit,
      changedPaths: ['server/routes/health.ts', 'package.json'],
      changeKinds: {
        ROUTE: ['server/routes/health.ts'],
        DEPENDENCY: ['package.json'],
        RUNTIME: [],
        CONTRACT: [],
        CONFIG: [],
        DOCUMENTATION: [],
        WORKFLOW: [],
        UNKNOWN: [],
      },
      patchableDocumentationPaths: ['docs/projects/documentary/README.md'],
      reviewOnlyDocumentationPaths: ['docs/security/SECURITY.md'],
      dependencySignals: ['package.json'],
      routeSignals: ['server/routes/health.ts'],
      freshness: {
        analyzerVersion: 'documentary-semantic-freshness/1.0.0',
        correlationId,
        sourceCommit,
        generatedAt: '2026-09-20T12:00:00.000Z',
        fullScan: false,
        sourceChanges: [],
        findings: [],
        summary: { registered: 0, candidates: 0, patchable: 0, reviewOnly: 0, skipped: 0 },
      },
      ...overrides.impact,
    },
    autoSync: {
      engineVersion: 'documentary-autosync/1.0.0',
      sourceCommit,
      patches: [],
      ...overrides.autoSync,
    },
    handoff: {
      handoffVersion: 'documentary-maintenance-handoff/1.0.0',
      correlationId,
      sourceCommit,
      state: 'SEMANTIC_AUTHORIZATION_REQUIRED',
      autoSyncPaths: [],
      semanticPatchPaths: ['docs/projects/documentary/README.md'],
      reviewRequiredPaths: ['docs/security/SECURITY.md'],
      maintenanceEntryPoint: 'scripts/automation/runDocumentaryMaintenanceControlLoop.ts',
      draftPrWorkflow: '.github/workflows/open-agent-draft-pr.yml',
      requiredAuthorization: {
        required: true,
        chain: ['Supervisor recommendation'],
        syntheticApprovalAllowed: false,
      },
      ...overrides.handoff,
    },
  };
}

describe('DocumentaryConvergenceEvidence', () => {
  it('binds Documentary closure evidence directly to the canonical SH-02.3 contract', () => {
    const evidence = buildDocumentaryConvergenceEvidence({
      ...fixture(),
      observedCurrentMain: true,
      concurrencyKey: 'documentary-change-impact-main',
    });

    expect(evidence.parentWorkPackage).toBe(DOCUMENTARY_SELF_HEALING_PARENT);
    expect(evidence.parentContract).toBe(DOCUMENTARY_SELF_HEALING_CONTRACT);
    expect(evidence.selfHealingContract.version).toBe(SELF_HEALING_CONTRACT_VERSION);
    expect(evidence.selfHealingContract.valid).toBe(true);
    expect(evidence.selfHealingContract.authorityClaimedByDocumentary).toBe(false);
    expect(evidence.convergenceClaim).toBe('NOT_ESTABLISHED_BY_DOCUMENTARY_EVIDENCE');
    expect(evidence.counts.routeSignals).toBe(1);
    expect(evidence.counts.dependencySignals).toBe(1);
    expect(evidence.triggerModel).toBe('MAIN_PUSH_EVENT_DRIVEN');
    expect(evidence.staleMainPolicy).toBe('ABORT_AND_RESTART_ON_NEXT_MAIN_PUSH');
    expect(evidence.branchCollisionPolicy).toBe('IDEMPOTENT_REUSE');
  });

  it('exposes contract activation counts without copying remediation policy into Documentary', () => {
    const evidence = buildDocumentaryConvergenceEvidence({
      ...fixture(),
      observedCurrentMain: true,
      concurrencyKey: 'documentary-change-impact-main',
    });

    expect(evidence.selfHealingContract.enabledActions).toBeGreaterThan(0);
    expect(evidence.selfHealingContract.heldActions).toBeGreaterThan(0);
    expect(evidence.selfHealingContract.protectedActions).toBeGreaterThan(0);
  });

  it('fails closed when evidence sources do not bind to one exact source commit', () => {
    const input = fixture({
      autoSync: { sourceCommit: 'b'.repeat(40) },
    });

    expect(() => buildDocumentaryConvergenceEvidence({
      ...input,
      observedCurrentMain: true,
      concurrencyKey: 'documentary-change-impact-main',
    })).toThrow(/sourceCommit mismatch/);
  });
});

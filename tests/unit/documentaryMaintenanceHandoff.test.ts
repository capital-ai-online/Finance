import { describe, expect, it } from 'vitest';
import type { ApplicationChangeImpact } from '../../src/platform/Documentary/Discovery/ApplicationChangeImpactAnalyzer';
import type { DocumentaryAutoSyncPlan } from '../../src/platform/Documentary/Automation/DocumentaryAutoSyncEngine';
import { buildDocumentaryMaintenanceHandoff } from '../../src/platform/Documentary/Orchestration/DocumentaryMaintenanceHandoff';

function impact(overrides: Partial<ApplicationChangeImpact> = {}): ApplicationChangeImpact {
  return {
    analyzerVersion: 'documentary-application-change-impact/1.0.0',
    correlationId: 'DOC-IMPACT-TEST',
    sourceCommit: 'a'.repeat(40),
    changedPaths: [],
    changeKinds: {
      ROUTE: [],
      DEPENDENCY: [],
      RUNTIME: [],
      CONTRACT: [],
      CONFIG: [],
      DOCUMENTATION: [],
      WORKFLOW: [],
      UNKNOWN: [],
    },
    patchableDocumentationPaths: [],
    reviewOnlyDocumentationPaths: [],
    dependencySignals: [],
    routeSignals: [],
    freshness: {
      analyzerVersion: 'documentary-semantic-freshness/1.0.0',
      correlationId: 'DOC-IMPACT-TEST',
      sourceCommit: 'a'.repeat(40),
      generatedAt: '2026-09-20T00:00:00.000Z',
      fullScan: false,
      sourceChanges: [],
      findings: [],
      summary: { registered: 0, candidates: 0, patchable: 0, reviewOnly: 0, skipped: 0 },
    },
    ...overrides,
  };
}

function autoSync(patches: DocumentaryAutoSyncPlan['patches'] = []): DocumentaryAutoSyncPlan {
  return {
    engineVersion: 'documentary-autosync/1.0.0',
    sourceCommit: 'a'.repeat(40),
    patches,
  };
}

describe('DocumentaryMaintenanceHandoff', () => {
  it('routes deterministic AUTO_SYNC work to the trusted Draft-PR path', () => {
    const result = buildDocumentaryMaintenanceHandoff({
      impact: impact({ patchableDocumentationPaths: ['docs/projects/documentary/README.md'] }),
      autoSync: autoSync([{
        path: 'docs/projects/README.md',
        ruleIds: ['DOC-AUTOSYNC-TEST'],
        previousSha256: '1'.repeat(64),
        proposedSha256: '2'.repeat(64),
        proposedContent: 'updated\n',
      }]),
    });

    expect(result.state).toBe('AUTO_SYNC_DRAFT_PR');
    expect(result.autoSyncPaths).toEqual(['docs/projects/README.md']);
    expect(result.requiredAuthorization.required).toBe(false);
    expect(result.draftPrWorkflow).toBe('.github/workflows/open-agent-draft-pr.yml');
  });

  it('fails closed to the existing authorization chain for semantic patches', () => {
    const result = buildDocumentaryMaintenanceHandoff({
      impact: impact({ patchableDocumentationPaths: ['docs/projects/documentary/README.md'] }),
      autoSync: autoSync(),
    });

    expect(result.state).toBe('SEMANTIC_AUTHORIZATION_REQUIRED');
    expect(result.requiredAuthorization.required).toBe(true);
    expect(result.requiredAuthorization.syntheticApprovalAllowed).toBe(false);
    expect(result.requiredAuthorization.chain).toEqual([
      'Supervisor recommendation',
      'Platform Director APPROVED decision',
      'Agent IAM ANALYZE/PLAN/BRANCH/COMMIT/PR',
    ]);
  });

  it('preserves protected candidates as review-only without mutation authority', () => {
    const result = buildDocumentaryMaintenanceHandoff({
      impact: impact({ reviewOnlyDocumentationPaths: ['docs/security/CONTROL.md'] }),
      autoSync: autoSync(),
    });

    expect(result.state).toBe('REVIEW_ONLY');
    expect(result.reviewRequiredPaths).toEqual(['docs/security/CONTROL.md']);
    expect(result.requiredAuthorization.required).toBe(false);
  });

  it('rejects mismatched source evidence', () => {
    expect(() => buildDocumentaryMaintenanceHandoff({
      impact: impact(),
      autoSync: { ...autoSync(), sourceCommit: 'b'.repeat(40) },
    })).toThrow(/sourceCommit mismatch/);
  });
});

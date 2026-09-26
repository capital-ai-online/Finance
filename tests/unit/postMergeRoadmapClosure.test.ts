import { describe, expect, it } from 'vitest';
import {
  buildPostMergeClosureFingerprint,
  evaluatePostMergeRoadmapClosure,
  type PostMergeRoadmapClosureInput,
} from '../../src/platform/Supervisor/postMergeRoadmapClosure';

const sha = (char: string) => char.repeat(40);

function input(
  overrides: Partial<PostMergeRoadmapClosureInput> = {},
): PostMergeRoadmapClosureInput {
  return {
    mergedPrNumber: 1466,
    mergeCommitSha: sha('a'),
    currentMainSha: sha('b'),
    mergeContainedInCurrentMain: true,
    projectId: 'CAPITAL-AI-OPS',
    executingProjectId: 'CAPITAL-AI-OPS',
    workPackageId: 'OPS-AUTH-SESSION-CONVERGENCE',
    workPackagePath:
      'docs/projects/operations/work-packages/OPS_AUTH_SESSION_CONVERGENCE_2026-09-26.md',
    exitEvidenceDigest: 'sha256:exit-evidence-v1',
    packageCompletesScope: true,
    evidence: [
      { id: 'exact-head-ci', state: 'PASS', required: true, domain: 'REPOSITORY' },
      { id: 'governance', state: 'PASS', required: true, domain: 'REPOSITORY' },
    ],
    persistent: {
      workPackageState: 'DONE_MAIN / TERMINAL',
      leadingRoadmapState: 'DONE_MAIN / TERMINAL',
      claimReleased: true,
    },
    ...overrides,
  };
}

describe('SH-02.13 post-merge Roadmap closure', () => {
  it('closes a fully evidenced merged work package only when both documentation surfaces converge', () => {
    const result = evaluatePostMergeRoadmapClosure(input());

    expect(result.state).toBe('DONE_MAIN / TERMINAL');
    expect(result.documentationConverged).toBe(true);
    expect(result.action).toBe('NONE');
    expect(result.unresolvedEvidence).toEqual([]);
  });

  it('keeps repository-complete work at an evidence gate when a required downstream gate is open', () => {
    const result = evaluatePostMergeRoadmapClosure(
      input({
        evidence: [
          { id: 'exact-head-ci', state: 'PASS', required: true, domain: 'REPOSITORY' },
          { id: 'provider-readback', state: 'PENDING', required: true, domain: 'RUNTIME' },
        ],
        persistent: {
          workPackageState: 'MERGED_MAIN / EVIDENCE_GATE',
          leadingRoadmapState: 'MERGED_MAIN / EVIDENCE_GATE',
          claimReleased: true,
        },
      }),
    );

    expect(result.state).toBe('MERGED_MAIN / EVIDENCE_GATE');
    expect(result.unresolvedEvidence).toEqual(['provider-readback:PENDING']);
    expect(result.action).toBe('NONE');
  });

  it('keeps a bounded child merge active instead of closing its parent package', () => {
    const result = evaluatePostMergeRoadmapClosure(
      input({
        packageCompletesScope: false,
        persistent: {
          workPackageState: 'PARTIAL_MAIN / ACTIVE',
          leadingRoadmapState: 'PARTIAL_MAIN / ACTIVE',
          claimReleased: true,
        },
      }),
    );

    expect(result.state).toBe('PARTIAL_MAIN / ACTIVE');
    expect(result.documentationConverged).toBe(true);
  });

  it('fails closed when merge/current-main identity cannot be proven', () => {
    const result = evaluatePostMergeRoadmapClosure(
      input({ mergeContainedInCurrentMain: false }),
    );

    expect(result.state).toBe('BLOCKED_CORRELATION');
    expect(result.action).toBe('BLOCKED');
    expect(result.reasons).toContain('POST_MERGE_IDENTITY_OR_GENERATION_UNRESOLVED');
  });

  it('routes owner-local documentation drift to the existing projection repair action', () => {
    const result = evaluatePostMergeRoadmapClosure(
      input({
        persistent: {
          workPackageState: 'IMPLEMENTED_ON_BRANCH / HUMAN_MERGE_REQUIRED',
          leadingRoadmapState: null,
          claimReleased: false,
        },
      }),
    );

    expect(result.state).toBe('DONE_MAIN / TERMINAL');
    expect(result.documentationConverged).toBe(false);
    expect(result.findingClass).toBe('REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT');
    expect(result.actionId).toBe('RECONCILE_REPOSITORY_PROJECTION');
    expect(result.action).toBe('RECONCILE_REPOSITORY_PROJECTION');
  });

  it('hands foreign-owner projection drift back instead of seizing its Roadmap', () => {
    const result = evaluatePostMergeRoadmapClosure(
      input({
        projectId: 'CAPITAL-AI-GOV',
        persistent: {
          workPackageState: null,
          leadingRoadmapState: 'DONE_MAIN / TERMINAL',
          claimReleased: false,
        },
      }),
    );

    expect(result.foreignOwner).toBe(true);
    expect(result.action).toBe('OWNER_CORRECT_HANDOFF');
    expect(result.findingClass).toBe('REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT');
  });

  it('is idempotent for an already observed closure fingerprint', () => {
    const base = input({
      persistent: {
        workPackageState: 'IMPLEMENTED_ON_BRANCH',
        leadingRoadmapState: null,
        claimReleased: false,
      },
    });
    const fingerprint = buildPostMergeClosureFingerprint(base);
    const result = evaluatePostMergeRoadmapClosure({
      ...base,
      previousFingerprints: [fingerprint],
    });

    expect(result.replayed).toBe(true);
    expect(result.action).toBe('NONE');
  });

  it('suppresses recursive mutation for a metadata-only closure synchronization', () => {
    const result = evaluatePostMergeRoadmapClosure(
      input({
        closureSync: true,
        persistent: {
          workPackageState: 'IMPLEMENTED_ON_BRANCH',
          leadingRoadmapState: null,
          claimReleased: false,
        },
      }),
    );

    expect(result.recursionSuppressed).toBe(true);
    expect(result.action).toBe('NONE');
    expect(result.reasons).toContain('CLOSURE_SYNC_RECURSION_SUPPRESSED');
  });
});

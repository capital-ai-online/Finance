/**
 * SH-02.13 — evidence-bound post-merge Roadmap/work-package closure.
 *
 * Pure contract only. It never mutates GitHub, Roadmaps, work packages or claims.
 * Persistent reconciliation remains in the existing branch-only
 * REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT -> RECONCILE_REPOSITORY_PROJECTION lane.
 */

export const POST_MERGE_ROADMAP_CLOSURE_SCHEMA =
  'post-merge-roadmap-closure/1.0.0' as const;

export type PostMergeClosureState =
  | 'DONE_MAIN / TERMINAL'
  | 'MERGED_MAIN / EVIDENCE_GATE'
  | 'PARTIAL_MAIN / ACTIVE'
  | 'BLOCKED_CORRELATION';

export type PostMergeClosureAction =
  | 'NONE'
  | 'RECONCILE_REPOSITORY_PROJECTION'
  | 'OWNER_CORRECT_HANDOFF'
  | 'BLOCKED';

export type ClosureEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'BLOCKED'
  | 'NOT_RUN'
  | 'PENDING'
  | 'MISSING';

export interface ClosureEvidence {
  id: string;
  state: ClosureEvidenceState;
  required: boolean;
  domain:
    | 'REPOSITORY'
    | 'PRODUCTION'
    | 'RUNTIME'
    | 'SECURITY'
    | 'QM'
    | 'COMPLIANCE'
    | 'DOMAIN';
  ref?: string;
}

export interface PersistentClosureProjection {
  workPackageState: string | null;
  leadingRoadmapState: string | null;
  claimReleased: boolean;
}

export interface PostMergeRoadmapClosureInput {
  mergedPrNumber: number;
  mergeCommitSha: string;
  currentMainSha: string;
  mergeContainedInCurrentMain: boolean;
  projectId: string;
  executingProjectId: string;
  workPackageId: string;
  workPackagePath: string;
  exitEvidenceDigest: string;
  packageCompletesScope: boolean;
  evidence: readonly ClosureEvidence[];
  persistent: PersistentClosureProjection;
  previousFingerprints?: readonly string[];
  closureSync?: boolean;
}

export interface PostMergeRoadmapClosureResult {
  schema: typeof POST_MERGE_ROADMAP_CLOSURE_SCHEMA;
  state: PostMergeClosureState;
  action: PostMergeClosureAction;
  findingClass: 'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT' | null;
  actionId: 'RECONCILE_REPOSITORY_PROJECTION' | null;
  closureFingerprint: string;
  documentationConverged: boolean;
  workPackageConverged: boolean;
  leadingRoadmapConverged: boolean;
  claimLifecycleConverged: boolean;
  foreignOwner: boolean;
  replayed: boolean;
  recursionSuppressed: boolean;
  unresolvedEvidence: string[];
  reasons: string[];
}

const SHA40 = /^[0-9a-f]{40}$/i;
const PROJECT_ID = /^CAPITAL-AI-[A-Z0-9-]+$/;
const WORK_PACKAGE_PATH =
  /^docs\/projects\/[^/]+\/work-packages\/[A-Za-z0-9._-]+\.md$/;

function normalizedState(value: string | null): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function stateMatchesProjection(
  observed: string | null,
  expected: PostMergeClosureState,
): boolean {
  const normalized = normalizedState(observed);
  if (!normalized) return false;

  if (expected === 'DONE_MAIN / TERMINAL') {
    return normalized.includes('DONE_MAIN') && normalized.includes('TERMINAL');
  }
  if (expected === 'MERGED_MAIN / EVIDENCE_GATE') {
    return normalized.includes('MERGED_MAIN') && normalized.includes('EVIDENCE_GATE');
  }
  if (expected === 'PARTIAL_MAIN / ACTIVE') {
    return normalized.includes('PARTIAL_MAIN') && normalized.includes('ACTIVE');
  }
  return normalized.includes('BLOCKED_CORRELATION');
}

function requiredEvidenceNotPass(evidence: readonly ClosureEvidence[]): ClosureEvidence[] {
  return evidence.filter((item) => item.required && item.state !== 'PASS');
}

function repositoryEvidenceNotPass(evidence: readonly ClosureEvidence[]): ClosureEvidence[] {
  return evidence.filter(
    (item) => item.required && item.domain === 'REPOSITORY' && item.state !== 'PASS',
  );
}

function downstreamEvidenceNotPass(evidence: readonly ClosureEvidence[]): ClosureEvidence[] {
  return evidence.filter(
    (item) => item.required && item.domain !== 'REPOSITORY' && item.state !== 'PASS',
  );
}

export function buildPostMergeClosureFingerprint(
  input: Pick<
    PostMergeRoadmapClosureInput,
    'mergedPrNumber' | 'mergeCommitSha' | 'workPackageId' | 'exitEvidenceDigest'
  >,
): string {
  return [
    'post-merge-roadmap-closure/1.0.0',
    'pr=' + input.mergedPrNumber,
    'merge=' + input.mergeCommitSha.toLowerCase(),
    'workPackage=' + input.workPackageId,
    'exit=' + input.exitEvidenceDigest,
  ].join('|');
}

export function evaluatePostMergeRoadmapClosure(
  input: PostMergeRoadmapClosureInput,
): PostMergeRoadmapClosureResult {
  const reasons: string[] = [];
  const fingerprint = buildPostMergeClosureFingerprint(input);
  const replayed = (input.previousFingerprints ?? []).includes(fingerprint);
  const recursionSuppressed = input.closureSync === true;
  const foreignOwner = input.projectId !== input.executingProjectId;

  let state: PostMergeClosureState = 'BLOCKED_CORRELATION';

  const identityValid =
    Number.isInteger(input.mergedPrNumber) &&
    input.mergedPrNumber > 0 &&
    SHA40.test(input.mergeCommitSha) &&
    SHA40.test(input.currentMainSha) &&
    input.mergeContainedInCurrentMain &&
    PROJECT_ID.test(input.projectId) &&
    PROJECT_ID.test(input.executingProjectId) &&
    input.workPackageId.trim().length > 0 &&
    WORK_PACKAGE_PATH.test(input.workPackagePath) &&
    input.exitEvidenceDigest.trim().length > 0;

  if (!identityValid) {
    reasons.push('POST_MERGE_IDENTITY_OR_GENERATION_UNRESOLVED');
  } else {
    const repositoryOpen = repositoryEvidenceNotPass(input.evidence);
    const downstreamOpen = downstreamEvidenceNotPass(input.evidence);

    if (repositoryOpen.length > 0) {
      state = 'MERGED_MAIN / EVIDENCE_GATE';
      reasons.push('REQUIRED_REPOSITORY_EVIDENCE_OPEN');
    } else if (!input.packageCompletesScope) {
      state = 'PARTIAL_MAIN / ACTIVE';
      reasons.push('MERGE_COMPLETES_ONLY_BOUNDED_CHILD_SCOPE');
    } else if (downstreamOpen.length > 0) {
      state = 'MERGED_MAIN / EVIDENCE_GATE';
      reasons.push('REQUIRED_DOWNSTREAM_EVIDENCE_OPEN');
    } else {
      state = 'DONE_MAIN / TERMINAL';
      reasons.push('ALL_REQUIRED_EXIT_EVIDENCE_VERIFIED');
    }
  }

  const workPackageConverged = stateMatchesProjection(
    input.persistent.workPackageState,
    state,
  );
  const leadingRoadmapConverged = stateMatchesProjection(
    input.persistent.leadingRoadmapState,
    state,
  );
  const claimLifecycleConverged = input.persistent.claimReleased;
  const documentationConverged =
    workPackageConverged &&
    leadingRoadmapConverged &&
    claimLifecycleConverged;

  const unresolvedEvidence = requiredEvidenceNotPass(input.evidence).map(
    (item) => item.id + ':' + item.state,
  );

  let action: PostMergeClosureAction = 'NONE';
  let findingClass: PostMergeRoadmapClosureResult['findingClass'] = null;
  let actionId: PostMergeRoadmapClosureResult['actionId'] = null;

  if (state === 'BLOCKED_CORRELATION') {
    action = 'BLOCKED';
  } else if (!documentationConverged) {
    findingClass = 'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT';
    actionId = 'RECONCILE_REPOSITORY_PROJECTION';
    action = foreignOwner
      ? 'OWNER_CORRECT_HANDOFF'
      : 'RECONCILE_REPOSITORY_PROJECTION';
    reasons.push('WORK_PACKAGE_ROADMAP_OR_CLAIM_PROJECTION_DRIFT');
  }

  if (replayed) {
    action = 'NONE';
    reasons.push('CLOSURE_FINGERPRINT_ALREADY_OBSERVED');
  }
  if (recursionSuppressed) {
    action = 'NONE';
    reasons.push('CLOSURE_SYNC_RECURSION_SUPPRESSED');
  }

  return {
    schema: POST_MERGE_ROADMAP_CLOSURE_SCHEMA,
    state,
    action,
    findingClass,
    actionId,
    closureFingerprint: fingerprint,
    documentationConverged,
    workPackageConverged,
    leadingRoadmapConverged,
    claimLifecycleConverged,
    foreignOwner,
    replayed,
    recursionSuppressed,
    unresolvedEvidence,
    reasons,
  };
}

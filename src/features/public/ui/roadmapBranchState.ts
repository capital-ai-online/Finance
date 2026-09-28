export interface RoadmapBranchEvidence {
  name: string;
  headSha: string;
  currentMainSha: string;
  aheadBy: number;
  behindBy: 0;
  relation: 'LIVE_CURRENT_MAIN_DESCENDANT';
  projectId: string | null;
  projectFolder: string | null;
  projectLabel: string | null;
  ownerResolution: 'RESOLVED' | 'UNRESOLVED';
}

export interface RoadmapBranchProjection {
  schemaVersion: 'roadmap-branch-evidence/1.0.0';
  role: 'NON_AUTHORIZING_LIVE_PROJECTION';
  observedAt: string;
  stale: boolean;
  repository: {
    currentMainSha: string;
  };
  branches: RoadmapBranchEvidence[];
}

export type RoadmapBranchClientState =
  | { status: 'loading'; projection: null; error: null }
  | { status: 'available'; projection: RoadmapBranchProjection; error: null }
  | { status: 'unavailable'; projection: null; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSha(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{40}$/i.test(value);
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

export function parseRoadmapBranchProjection(input: unknown): RoadmapBranchProjection {
  if (!isRecord(input)) throw new Error('roadmap-branch-projection-not-object');
  if (input.schemaVersion !== 'roadmap-branch-evidence/1.0.0') {
    throw new Error('roadmap-branch-schema-version-invalid');
  }
  if (input.role !== 'NON_AUTHORIZING_LIVE_PROJECTION') {
    throw new Error('roadmap-branch-role-invalid');
  }
  if (typeof input.observedAt !== 'string' || Number.isNaN(Date.parse(input.observedAt))) {
    throw new Error('roadmap-branch-observed-at-invalid');
  }
  if (typeof input.stale !== 'boolean') throw new Error('roadmap-branch-stale-invalid');
  if (!isRecord(input.repository) || !isSha(input.repository.currentMainSha)) {
    throw new Error('roadmap-branch-current-main-invalid');
  }
  if (!Array.isArray(input.branches)) throw new Error('roadmap-branches-invalid');

  const currentMainSha = input.repository.currentMainSha.toLowerCase();
  const branches = input.branches.map((value, index): RoadmapBranchEvidence => {
    if (!isRecord(value)) throw new Error(`roadmap-branch-${index}-not-object`);
    if (typeof value.name !== 'string' || value.name.length < 1 || value.name.length > 255) {
      throw new Error(`roadmap-branch-${index}-name-invalid`);
    }
    if (!isSha(value.headSha) || !isSha(value.currentMainSha)) {
      throw new Error(`roadmap-branch-${index}-sha-invalid`);
    }
    if (value.currentMainSha.toLowerCase() !== currentMainSha) {
      throw new Error(`roadmap-branch-${index}-main-mismatch`);
    }
    if (!Number.isInteger(value.aheadBy) || Number(value.aheadBy) <= 0) {
      throw new Error(`roadmap-branch-${index}-ahead-invalid`);
    }
    if (value.behindBy !== 0 || value.relation !== 'LIVE_CURRENT_MAIN_DESCENDANT') {
      throw new Error(`roadmap-branch-${index}-relation-invalid`);
    }
    if (!nullableString(value.projectId) || !nullableString(value.projectFolder) || !nullableString(value.projectLabel)) {
      throw new Error(`roadmap-branch-${index}-project-invalid`);
    }
    if (!['RESOLVED', 'UNRESOLVED'].includes(String(value.ownerResolution))) {
      throw new Error(`roadmap-branch-${index}-owner-resolution-invalid`);
    }
    if (
      value.ownerResolution === 'RESOLVED' &&
      (!value.projectId || !value.projectFolder || !value.projectLabel)
    ) {
      throw new Error(`roadmap-branch-${index}-resolved-owner-missing`);
    }

    return {
      name: value.name,
      headSha: value.headSha.toLowerCase(),
      currentMainSha,
      aheadBy: Number(value.aheadBy),
      behindBy: 0,
      relation: 'LIVE_CURRENT_MAIN_DESCENDANT',
      projectId: value.projectId,
      projectFolder: value.projectFolder,
      projectLabel: value.projectLabel,
      ownerResolution: value.ownerResolution as 'RESOLVED' | 'UNRESOLVED',
    };
  });

  return {
    schemaVersion: 'roadmap-branch-evidence/1.0.0',
    role: 'NON_AUTHORIZING_LIVE_PROJECTION',
    observedAt: input.observedAt,
    stale: input.stale,
    repository: { currentMainSha },
    branches,
  };
}

import { createHash } from 'node:crypto';

export const ADR_0104_AUTHORITY_ID = 'AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01';
export const ADR_0104_VERSION = '1.4.0';
export const ADR_0104_DURATION = 'PT8H';

export type Adr0104SlotId = 'ADR-0104-S1' | 'ADR-0104-S2' | 'ADR-0104-S3';
export const ADR_0104_SLOT_BASELINE: Readonly<Record<Adr0104SlotId, 'AVAILABLE' | 'UNAVAILABLE'>> = {
  // S1 is already bound to the current text-activated session and may not be reused by the new runtime.
  'ADR-0104-S1': 'UNAVAILABLE',
  // S2 was consumed by PR #691 under the effective ADR history.
  'ADR-0104-S2': 'UNAVAILABLE',
  // S3 is the only unused slot on the v1.4.0 authority baseline.
  'ADR-0104-S3': 'AVAILABLE',
};

export interface CanonicalProjectSelection {
  projectId: string;
  projectFolder: string;
  projectStages: string[];
  primaryOwner: string;
}

export const ADR_0104_PROJECT_OPTIONS: readonly CanonicalProjectSelection[] = [
  { projectId: 'CAPITAL-AI-CLIENT', projectFolder: 'docs/projects/agent-client/', projectStages: ['PVC-01'], primaryOwner: 'CAPITAL-AI-CLIENT' },
  { projectId: 'CAPITAL-AI-OPS', projectFolder: 'docs/projects/operations/', projectStages: ['PVC-02', 'PVC-04', 'PVC-06', 'PVC-07', 'PVC-08', 'PVC-18'], primaryOwner: 'CAPITAL-AI-OPS' },
  { projectId: 'CAPITAL-AI-DOC', projectFolder: 'docs/projects/documentary/', projectStages: ['PVC-03'], primaryOwner: 'CAPITAL-AI-DOC' },
  { projectId: 'CAPITAL-AI-GOV', projectFolder: 'docs/projects/governance/', projectStages: ['PVC-05'], primaryOwner: 'CAPITAL-AI-GOV' },
  { projectId: 'CAPITAL-AI-FINTECH', projectFolder: 'docs/projects/fintech/', projectStages: ['PVC-09', 'PVC-10', 'PVC-11', 'PVC-12', 'PVC-13', 'PVC-14', 'PVC-15', 'PVC-16', 'PVC-17'], primaryOwner: 'CAPITAL-AI-FINTECH' },
] as const;

function stableProjectRecord(project: CanonicalProjectSelection): string {
  return [project.projectId, project.projectFolder, [...project.projectStages].sort().join(','), project.primaryOwner].join('|');
}

export function assertAdr0104SlotAvailable(slotId: Adr0104SlotId): void {
  if (ADR_0104_SLOT_BASELINE[slotId] !== 'AVAILABLE') throw new Error('ADR0104_SLOT_UNAVAILABLE');
}

export function resolveAdr0104ProjectSet(projectIds: readonly string[]): CanonicalProjectSelection[] {
  const unique = [...new Set(projectIds)];
  if (unique.length < 1 || unique.length > 3 || unique.length !== projectIds.length) throw new Error('ADR0104_PROJECT_SET_INVALID');
  const resolved = unique.map((projectId) => {
    const project = ADR_0104_PROJECT_OPTIONS.find((candidate) => candidate.projectId === projectId);
    if (!project) throw new Error('ADR0104_PROJECT_UNKNOWN');
    return { ...project, projectStages: [...project.projectStages] };
  });
  return resolved.sort((a, b) => a.projectId.localeCompare(b.projectId));
}

export function digestAdr0104ProjectSet(projects: readonly CanonicalProjectSelection[]): string {
  const canonical = [...projects].sort((a, b) => a.projectId.localeCompare(b.projectId)).map(stableProjectRecord).join('\n');
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function assertInitialProjectMember(projects: readonly CanonicalProjectSelection[], initialProjectId: string): CanonicalProjectSelection {
  const project = projects.find((candidate) => candidate.projectId === initialProjectId);
  if (!project) throw new Error('ADR0104_INITIAL_PROJECT_OUTSIDE_SET');
  return project;
}

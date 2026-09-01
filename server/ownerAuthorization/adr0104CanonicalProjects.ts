import { createHash } from 'node:crypto';
import type { CanonicalProjectSelection } from './adr0104ProjectSet';

export const ADR_0104_CANONICAL_PROJECT_SOURCES: Readonly<Record<string, string>> = {
  'CAPITAL-AI-CLIENT': 'docs/projects/agent-client/README.md',
  'CAPITAL-AI-OPS': 'docs/projects/operations/README.md',
  'CAPITAL-AI-DOC': 'docs/projects/documentary/README.md',
  'CAPITAL-AI-GOV': 'docs/projects/governance/README.md',
  'CAPITAL-AI-DATA': 'docs/projects/data/README.md',
  'CAPITAL-AI-FINTECH': 'docs/projects/fintech/README.md',
};

function normalizeProjectFolder(path: string): string {
  return path.replace(/README\.md$/, '');
}

function parseStages(content: string): string[] {
  const stages = [...new Set(content.match(/PVC-\d{2}/g) ?? [])];
  return stages.sort();
}

function parseProjectId(content: string): string | null {
  const match = content.match(/\*\*(?:Project ID|Project):\*\*\s*`([^`]+)`/);
  return match?.[1]?.trim() ?? null;
}

export async function resolveCanonicalAdr0104ProjectSetFromMain(
  projectIds: readonly string[],
  currentMainSha: string,
  fetchText: (path: string, sha: string) => Promise<string>,
): Promise<CanonicalProjectSelection[]> {
  const unique = [...new Set(projectIds)];
  if (unique.length < 1 || unique.length > 3 || unique.length !== projectIds.length) {
    throw new Error('ADR0104_PROJECT_SET_INVALID');
  }

  const resolved = await Promise.all(unique.map(async (projectId) => {
    const source = ADR_0104_CANONICAL_PROJECT_SOURCES[projectId];
    if (!source) throw new Error('ADR0104_PROJECT_UNKNOWN');
    const content = await fetchText(source, currentMainSha);
    const declaredProjectId = parseProjectId(content);
    if (declaredProjectId !== projectId) throw new Error('ADR0104_CANONICAL_PROJECT_ID_DRIFT');
    const projectStages = parseStages(content);
    if (projectStages.length === 0) throw new Error('ADR0104_CANONICAL_PROJECT_STAGE_MISSING');
    return {
      projectId,
      projectFolder: normalizeProjectFolder(source),
      projectStages,
      primaryOwner: projectId,
    };
  }));

  return resolved.sort((a, b) => a.projectId.localeCompare(b.projectId));
}

export function digestCanonicalAdr0104ProjectSet(projects: readonly CanonicalProjectSelection[]): string {
  const canonical = [...projects]
    .sort((a, b) => a.projectId.localeCompare(b.projectId))
    .map((project) => [project.projectId, project.projectFolder, [...project.projectStages].sort().join(','), project.primaryOwner].join('|'))
    .join('\n');
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

import { digestAdr0104ProjectSet, type CanonicalProjectSelection } from './adr0104ProjectSet';

const PROJECT_ROUTING_SOURCE = 'docs/projects/README.md';
const PROJECT_OWNERSHIP_SOURCE = 'docs/projects/PROJECT_VALUE_CHAIN.md';

function extractProjectFolder(routing: string, projectId: string): string {
  const row = routing.split('\n').find((line) => line.startsWith(`| \`${projectId}\` |`));
  const match = row?.match(/`(docs\/projects\/[^`]+\/)`/);
  if (!match?.[1]) throw new Error('ADR0104_CANONICAL_PROJECT_FOLDER_UNRESOLVED');
  return match[1];
}

function extractOwnedStages(ownership: string, projectId: string): string[] {
  const stages = ownership.split('\n').flatMap((line) => {
    const cells = line.split('|').map((cell) => cell.trim());
    if (cells.length < 4 || cells[3] !== `\`${projectId}\``) return [];
    const stage = cells[1]?.match(/`(PVC-\d{2})`/)?.[1];
    return stage ? [stage] : [];
  });
  if (stages.length === 0) throw new Error('ADR0104_CANONICAL_PROJECT_STAGE_UNRESOLVED');
  return [...new Set(stages)].sort();
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

  const [routing, ownership] = await Promise.all([
    fetchText(PROJECT_ROUTING_SOURCE, currentMainSha),
    fetchText(PROJECT_OWNERSHIP_SOURCE, currentMainSha),
  ]);

  return unique.map((projectId) => ({
    projectId,
    projectFolder: extractProjectFolder(routing, projectId),
    projectStages: extractOwnedStages(ownership, projectId),
    primaryOwner: projectId,
  })).sort((a, b) => a.projectId.localeCompare(b.projectId));
}

export function digestCanonicalAdr0104ProjectSet(projects: readonly CanonicalProjectSelection[]): string {
  return digestAdr0104ProjectSet(projects);
}

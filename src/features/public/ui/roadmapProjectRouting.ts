import type {
  RoadmapQueuedItem,
  RoadmapWorkPackage,
} from './roadmapSnapshot';

export interface RoadmapProjectRoute {
  projectId: string;
  pvcRelationship: string;
  folder: string;
  branchSlug: string;
  displayName: string;
  symbol: string;
  color: string;
  materializationOwner: string;
  label: string;
}

export interface RoadmapProjectFilters {
  owner: string;
  folder: string;
  label: string;
}

export interface RoadmapExecutionLane {
  id: string;
  itemIds: string[];
  projectIds: string[];
  dependencies: string[];
  activeItems: number;
  readyItems: number;
}

const cleanCell = (value: string) => value.trim().replace(/`/g, '');

export function parseRoadmapProjectRouting(markdown: string): RoadmapProjectRoute[] {
  const marker = '## Canonical project-folder routing';
  const start = markdown.indexOf(marker);
  if (start < 0) return [];

  const section = markdown.slice(start);
  const routes: RoadmapProjectRoute[] = [];

  for (const line of section.split('\n')) {
    if (!line.trim().startsWith('| `CAPITAL-AI-')) continue;

    const cells = line
      .split('|')
      .slice(1, -1)
      .map(cleanCell);

    if (cells.length < 9) continue;

    const [
      projectId,
      pvcRelationship,
      folder,
      branchSlug,
      displayName,
      symbol,
      color,
      materializationOwner,
    ] = cells;

    if (
      !/^CAPITAL-AI-[A-Z-]+$/.test(projectId) ||
      !folder.startsWith('docs/projects/') ||
      !/^#[0-9A-F]{6}$/.test(color)
    ) {
      continue;
    }

    routes.push({
      projectId,
      pvcRelationship,
      folder,
      branchSlug,
      displayName,
      symbol,
      color,
      materializationOwner,
      label: `project:${projectId}`,
    });
  }

  return routes;
}

export function resolveRoadmapProjects(
  owner: string,
  routes: RoadmapProjectRoute[],
): RoadmapProjectRoute[] {
  return routes.filter((route) => owner.includes(route.projectId));
}

function projectIdForFilter(
  value: string,
  key: 'projectId' | 'folder' | 'label',
  routes: RoadmapProjectRoute[],
): string | null {
  if (!value) return null;
  return routes.find((route) => route[key] === value)?.projectId ?? '__NO_MATCH__';
}

export function matchesRoadmapProjectFilters(
  owner: string,
  filters: RoadmapProjectFilters,
  routes: RoadmapProjectRoute[],
): boolean {
  const matchedProjects = new Set(
    resolveRoadmapProjects(owner, routes).map((route) => route.projectId),
  );
  const constraints = [
    projectIdForFilter(filters.owner, 'projectId', routes),
    projectIdForFilter(filters.folder, 'folder', routes),
    projectIdForFilter(filters.label, 'label', routes),
  ].filter((value): value is string => Boolean(value));

  return constraints.every((projectId) => matchedProjects.has(projectId));
}

export function buildRoadmapExecutionLanes(
  activeWorkPackages: RoadmapWorkPackage[],
  queuedItems: RoadmapQueuedItem[],
  routes: RoadmapProjectRoute[],
): RoadmapExecutionLane[] {
  const lanes = new Map<string, RoadmapExecutionLane>();

  const add = (
    item: RoadmapWorkPackage | RoadmapQueuedItem,
    kind: 'active' | 'ready',
  ) => {
    const laneId = item.executionGroup ?? item.id;
    const lane = lanes.get(laneId) ?? {
      id: laneId,
      itemIds: [],
      projectIds: [],
      dependencies: [],
      activeItems: 0,
      readyItems: 0,
    };

    if (!lane.itemIds.includes(item.id)) lane.itemIds.push(item.id);

    for (const route of resolveRoadmapProjects(item.owner, routes)) {
      if (!lane.projectIds.includes(route.projectId)) lane.projectIds.push(route.projectId);
    }

    for (const dependency of item.dependsOn ?? []) {
      if (!lane.dependencies.includes(dependency)) lane.dependencies.push(dependency);
    }

    if (kind === 'active') lane.activeItems += 1;
    else lane.readyItems += 1;

    lanes.set(laneId, lane);
  };

  for (const item of activeWorkPackages) {
    if (item.state === 'evidence-gate') continue;
    add(item, 'active');
  }

  for (const item of queuedItems) {
    if (item.state !== 'ready') continue;
    add(item, 'ready');
  }

  return [...lanes.values()].sort((left, right) => left.id.localeCompare(right.id));
}

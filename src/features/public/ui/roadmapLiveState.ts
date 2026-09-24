import type {
  RoadmapQueuedItem,
  RoadmapWorkPackage,
} from './roadmapSnapshot';
import type { RoadmapProjectFilters } from './roadmapProjectRouting';

export type RoadmapLiveState =
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'EVIDENCE_GATE'
  | 'READY'
  | 'HELD'
  | 'QUEUED';

export interface RoadmapLiveItem {
  id: string;
  title: string;
  projectId: string;
  projectFolder: string;
  projectLabel: string;
  pvcRelationship: string;
  state: RoadmapLiveState;
  stateLabel: string;
  source: string;
  sourceSha: string;
  detail: string;
  dependencies: string[];
  executionGroup: string;
  workerCandidate: boolean;
}

export interface RoadmapLiveWarning {
  code: string;
  source: string;
  itemId?: string;
  detail: string;
}

export interface RoadmapLiveProjection {
  schemaVersion: 'roadmap-live-state/1.0.0';
  role: 'NON_AUTHORIZING_LIVE_PROJECTION';
  observedAt: string;
  stale: boolean;
  repository: { currentMainSha: string };
  sources: string[];
  items: RoadmapLiveItem[];
  warnings: RoadmapLiveWarning[];
}

export type RoadmapLiveClientState =
  | { status: 'loading'; projection: null; error: null }
  | { status: 'available'; projection: RoadmapLiveProjection; error: null }
  | { status: 'unavailable'; projection: null; error: string };

const LIVE_STATES = new Set<RoadmapLiveState>([
  'ACTIVE',
  'IN_PROGRESS',
  'EVIDENCE_GATE',
  'READY',
  'HELD',
  'QUEUED',
]);

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(label + '-invalid');
  }
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(label + '-invalid');
  }
  return value.trim();
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error(label + '-invalid');
  }
  return value.map((entry) => entry.trim()).filter(Boolean);
}

function parseItem(value: unknown): RoadmapLiveItem {
  const item = record(value, 'roadmap-live-item');
  const state = stringValue(item.state, 'roadmap-live-item-state') as RoadmapLiveState;
  if (!LIVE_STATES.has(state)) throw new Error('roadmap-live-item-state-invalid');

  const sourceSha = stringValue(item.sourceSha, 'roadmap-live-item-source-sha').toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(sourceSha)) {
    throw new Error('roadmap-live-item-source-sha-invalid');
  }

  const projectId = stringValue(item.projectId, 'roadmap-live-item-project');
  const projectFolder = stringValue(item.projectFolder, 'roadmap-live-item-folder');
  const projectLabel = stringValue(item.projectLabel, 'roadmap-live-item-label');
  if (!/^CAPITAL-AI-[A-Z-]+$/.test(projectId)) {
    throw new Error('roadmap-live-item-project-invalid');
  }
  if (!projectFolder.startsWith('docs/projects/') || !projectFolder.endsWith('/')) {
    throw new Error('roadmap-live-item-folder-invalid');
  }
  if (projectLabel !== 'project:' + projectId) {
    throw new Error('roadmap-live-item-label-invalid');
  }
  if (typeof item.workerCandidate !== 'boolean') {
    throw new Error('roadmap-live-item-worker-candidate-invalid');
  }

  return {
    id: stringValue(item.id, 'roadmap-live-item-id'),
    title: stringValue(item.title, 'roadmap-live-item-title'),
    projectId,
    projectFolder,
    projectLabel,
    pvcRelationship: stringValue(item.pvcRelationship, 'roadmap-live-item-pvc'),
    state,
    stateLabel: stringValue(item.stateLabel, 'roadmap-live-item-state-label'),
    source: stringValue(item.source, 'roadmap-live-item-source'),
    sourceSha,
    detail: typeof item.detail === 'string' ? item.detail : '',
    dependencies: stringArray(item.dependencies, 'roadmap-live-item-dependencies'),
    executionGroup: stringValue(item.executionGroup, 'roadmap-live-item-execution-group'),
    workerCandidate: item.workerCandidate,
  };
}

export function parseRoadmapLiveProjection(value: unknown): RoadmapLiveProjection {
  const projection = record(value, 'roadmap-live-projection');
  if (projection.schemaVersion !== 'roadmap-live-state/1.0.0') {
    throw new Error('roadmap-live-schema-unsupported');
  }
  if (projection.role !== 'NON_AUTHORIZING_LIVE_PROJECTION') {
    throw new Error('roadmap-live-role-invalid');
  }
  if (typeof projection.stale !== 'boolean') {
    throw new Error('roadmap-live-stale-invalid');
  }

  const repository = record(projection.repository, 'roadmap-live-repository');
  const currentMainSha = stringValue(
    repository.currentMainSha,
    'roadmap-live-current-main',
  ).toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(currentMainSha)) {
    throw new Error('roadmap-live-current-main-invalid');
  }

  const observedAt = stringValue(projection.observedAt, 'roadmap-live-observed-at');
  if (Number.isNaN(Date.parse(observedAt))) {
    throw new Error('roadmap-live-observed-at-invalid');
  }

  if (!Array.isArray(projection.items) || !Array.isArray(projection.warnings)) {
    throw new Error('roadmap-live-collections-invalid');
  }

  const warnings = projection.warnings.map((value) => {
    const warning = record(value, 'roadmap-live-warning');
    return {
      code: stringValue(warning.code, 'roadmap-live-warning-code'),
      source: stringValue(warning.source, 'roadmap-live-warning-source'),
      itemId:
        typeof warning.itemId === 'string' && warning.itemId.trim()
          ? warning.itemId.trim()
          : undefined,
      detail: stringValue(warning.detail, 'roadmap-live-warning-detail'),
    };
  });

  const items = projection.items.map(parseItem);
  if (items.some((item) => item.sourceSha !== currentMainSha)) {
    throw new Error('roadmap-live-generation-mismatch');
  }

  return {
    schemaVersion: 'roadmap-live-state/1.0.0',
    role: 'NON_AUTHORIZING_LIVE_PROJECTION',
    observedAt,
    stale: projection.stale,
    repository: { currentMainSha },
    sources: stringArray(projection.sources, 'roadmap-live-sources'),
    items,
    warnings,
  };
}

export function matchesRoadmapLiveItemFilters(
  item: RoadmapLiveItem,
  filters: RoadmapProjectFilters,
): boolean {
  return (
    (!filters.owner || item.projectId === filters.owner) &&
    (!filters.folder || item.projectFolder === filters.folder) &&
    (!filters.label || item.projectLabel === filters.label)
  );
}

function phaseFor(item: RoadmapLiveItem): RoadmapWorkPackage['phase'] {
  if (item.projectId === 'CAPITAL-AI-SEC' || item.projectId === 'CAPITAL-AI-COMP') {
    return 'Security & Compliance';
  }
  if (/^SH-|SELF.?HEAL/i.test(item.id + ' ' + item.executionGroup)) {
    return 'Self-Healing Runtime';
  }
  if (
    item.projectId === 'CAPITAL-AI-GOV' ||
    item.projectId === 'CAPITAL-AI-OPS' ||
    item.projectId === 'CAPITAL-AI-DOC' ||
    item.projectId === 'CAPITAL-AI-QM'
  ) {
    return 'Automation';
  }
  return 'Product & Market';
}

function activeState(state: RoadmapLiveState): RoadmapWorkPackage['state'] | null {
  if (state === 'ACTIVE') return 'active';
  if (state === 'IN_PROGRESS') return 'in-progress';
  if (state === 'EVIDENCE_GATE') return 'evidence-gate';
  return null;
}

function queueState(state: RoadmapLiveState): RoadmapQueuedItem['state'] | null {
  if (state === 'READY') return 'ready';
  if (state === 'HELD') return 'held';
  if (state === 'QUEUED') return 'queued';
  return null;
}

export function splitRoadmapLiveItems(items: RoadmapLiveItem[]): {
  activeWorkPackages: RoadmapWorkPackage[];
  queuedItems: RoadmapQueuedItem[];
} {
  const activeWorkPackages: RoadmapWorkPackage[] = [];
  const queuedItems: RoadmapQueuedItem[] = [];

  for (const item of items) {
    const workState = activeState(item.state);
    if (workState) {
      activeWorkPackages.push({
        id: item.id,
        title: item.title,
        owner: item.projectId,
        relationship: item.pvcRelationship,
        phase: phaseFor(item),
        state: workState,
        stateLabel: item.stateLabel,
        source: item.source,
        sourceType: 'canonical-roadmap',
        detail: item.detail,
        executionGroup: item.executionGroup,
        dependsOn: item.dependencies,
      });
      continue;
    }

    const queuedState = queueState(item.state);
    if (queuedState) {
      queuedItems.push({
        id: item.id,
        owner: item.projectId,
        state: queuedState,
        stateLabel: item.stateLabel,
        source: item.source,
        gate: item.detail || item.stateLabel,
        executionGroup: item.executionGroup,
        dependsOn: item.dependencies,
      });
    }
  }

  return { activeWorkPackages, queuedItems };
}

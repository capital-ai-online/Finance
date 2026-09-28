import {
  fetchCurrentMainTextFile,
  resolveCurrentMainSha,
} from '../ownerAuthorization/currentMain';

export type RoadmapLiveState =
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'EVIDENCE_GATE'
  | 'READY'
  | 'HELD'
  | 'QUEUED';

export interface RoadmapProjectRoute {
  projectId: string;
  pvcRelationship: string;
  folder: string;
  branchSlug: string;
  displayName: string;
  symbol: string;
  color: string;
  label: string;
}

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

export interface RoadmapProjectionWarning {
  code:
    | 'STALE_BRANCH_STATE_ON_CURRENT_MAIN'
    | 'DUPLICATE_CURRENT_IDENTITY'
    | 'UNRESOLVED_LIVE_PROJECT';
  source: string;
  itemId?: string;
  detail: string;
}

export interface RoadmapStateProjection {
  schemaVersion: 'roadmap-live-state/1.0.0';
  role: 'NON_AUTHORIZING_LIVE_PROJECTION';
  observedAt: string;
  stale: boolean;
  repository: {
    currentMainSha: string;
  };
  sources: string[];
  items: RoadmapLiveItem[];
  warnings: RoadmapProjectionWarning[];
}

const LIVE_ROADMAP_PATH = 'docs/architecture/ROADMAP.md';
const PROJECT_MAPPING_PATH = 'docs/projects/README.md';
const ITEM_ID = /\b[A-Z][A-Z0-9]*(?:[-.][A-Z0-9]+){1,}\b/g;
const NON_ACTIVE_SECTION =
  /historical baseline|non-active ledger|terminal\s*\/\s*superseded|verified merged foundations|reconciled legacy identities|superseded work|historical\/detail/i;
const TERMINAL_STATE =
  /\b(DONE_MAIN|TERMINAL|SUPERSEDED|NOT_APPLICABLE|RETIRED|CLOSED|CANCELLED|ABANDONED)\b/i;
const CACHE_MS = 120_000;

let cache: { at: number; value: RoadmapStateProjection } | null = null;

function cleanCell(value: string): string {
  return value
    .trim()
    .replace(/^\|+|\|+$/g, '')
    .replace(/\*\*/g, '')
    .replace(/\x60/g, '')
    .trim();
}

function stripMarkdown(value: string): string {
  return value
    .replace(/\*\*/g, '')
    .replace(/\x60/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/^[-*>\s]+/, '')
    .trim();
}

function extractIds(value: string): string[] {
  return [...value.matchAll(ITEM_ID)]
    .map((match) => match[0])
    .filter((id) => !id.startsWith('CAPITAL-AI-'));
}

function classifyState(
  label: string,
): { state: RoadmapLiveState; warning?: RoadmapProjectionWarning['code'] } | null {
  const normalized = stripMarkdown(label).toUpperCase();
  if (!normalized) return null;

  // Only the leading state segment is authoritative for terminality. Narrative
  // evidence may legitimately mention a closed/retired PR while the work item
  // itself remains open (for example: EVIDENCE_MISSING / OPEN — PR #802 closed).
  const terminalScope = normalized.split(/\s+[—–]\s+|\s+VIA\s+/i, 1)[0].trim();
  if (TERMINAL_STATE.test(terminalScope)) return null;

  if (
    normalized.includes('IMPLEMENTED_ON_BRANCH') ||
    normalized.includes('HUMAN_MERGE_REQUIRED')
  ) {
    return {
      state: 'EVIDENCE_GATE',
      warning: 'STALE_BRANCH_STATE_ON_CURRENT_MAIN',
    };
  }
  if (normalized.includes('LEGAL_REVIEW') || normalized.includes('EVIDENCE_')) {
    return { state: 'EVIDENCE_GATE' };
  }
  if (normalized.includes('QUEUED')) return { state: 'QUEUED' };
  if (
    normalized.includes('HELD') ||
    normalized.includes('PENDING') ||
    normalized.includes('BLOCKED') ||
    normalized.includes('CONDITIONAL') ||
    normalized.includes('NO_PHYSICAL_RUNTIME_TRIGGER') ||
    normalized.includes('UNAVAILABLE_BY_PLAN')
  ) {
    return { state: 'HELD' };
  }
  if (normalized.includes('READY') && !normalized.includes('NOT_READY')) {
    return { state: 'READY' };
  }
  if (
    normalized.includes('IN_PROGRESS') ||
    normalized.includes('IN PROGRESS') ||
    normalized.includes('IMPLEMENTING') ||
    normalized.includes('IMPLEMENTATION_IN_PROGRESS') ||
    normalized.includes('IMPLEMENTATION_CANDIDATE') ||
    normalized.includes('REMEDIATION')
  ) {
    return { state: 'IN_PROGRESS' };
  }
  if (normalized.includes('ACTIVE')) return { state: 'ACTIVE' };
  return null;
}

function isWorkerCandidate(state: RoadmapLiveState, dependencies: string[]): boolean {
  return (
    (state === 'ACTIVE' || state === 'IN_PROGRESS' || state === 'READY') &&
    dependencies.length === 0
  );
}

function executionGroup(id: string, explicit?: string): string {
  if (explicit) return stripMarkdown(explicit);
  if (/^SEC-WEB-(00|10|20|30|40|50)$/.test(id)) return 'SEC-WEB-HARDENING-01';
  if (/^SOCIAL-P[12]$/.test(id)) return 'SOCIAL-P1-P2';
  if (id === 'QM-PR900-03') return 'QM-ACTIONS-ASSURANCE';
  if (id === 'QM-PR900-04') return 'QM-READINESS';
  if (id === 'SH-02.11') return 'OPS-SH-02.11';
  if (id === 'SH-02.12') return 'OPS-SH-02.12';
  return id;
}

function dependenciesFor(id: string, explicit: string[]): string[] {
  const values = new Set(explicit);
  if (id === 'SOCIAL-P2') values.add('SOCIAL-P1');
  if (id === 'SOCIAL-P3') values.add('SOCIAL-P2');
  if (id === 'QM-PR900-04') values.add('QM-PR900-03');
  if (/^SEC-WEB-(20|30|40)$/.test(id)) {
    values.add('SEC-WEB-00');
    values.add('SEC-WEB-10');
  }
  if (id === 'SEC-WEB-50') {
    values.add('SEC-WEB-20');
    values.add('SEC-WEB-30');
    values.add('SEC-WEB-40');
  }
  return [...values];
}

export function parseRoadmapProjectRouting(markdown: string): RoadmapProjectRoute[] {
  const marker = '## Canonical project-folder routing';
  const start = markdown.indexOf(marker);
  if (start < 0) throw new Error('ROADMAP_PROJECT_ROUTING_MISSING');

  const routes: RoadmapProjectRoute[] = [];
  for (const line of markdown.slice(start).split(/\r?\n/)) {
    if (!line.trim().startsWith('|') || !line.includes('CAPITAL-AI-')) continue;
    const cells = line.split('|').slice(1, -1).map(cleanCell);
    if (cells.length < 9) continue;

    const [projectId, pvcRelationship, folder, branchSlug, displayName, symbol, color] =
      cells;
    if (!/^CAPITAL-AI-[A-Z-]+$/.test(projectId)) continue;
    if (!folder.startsWith('docs/projects/') || !folder.endsWith('/')) continue;

    routes.push({
      projectId,
      pvcRelationship,
      folder,
      branchSlug,
      displayName,
      symbol,
      color,
      label: 'project:' + projectId,
    });
  }

  if (routes.length === 0) throw new Error('ROADMAP_PROJECT_ROUTING_EMPTY');
  const seen = new Set<string>();
  for (const route of routes) {
    if (seen.has(route.projectId)) {
      throw new Error('ROADMAP_PROJECT_ROUTING_DUPLICATE:' + route.projectId);
    }
    seen.add(route.projectId);
  }
  return routes;
}

interface ParseResult {
  items: RoadmapLiveItem[];
  warnings: RoadmapProjectionWarning[];
}

function headingContext(lines: string[]): Array<{ historical: boolean }> {
  const stack: Array<{ level: number; historical: boolean }> = [];
  return lines.map((line) => {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (match) {
      const level = match[1].length;
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      const inherited = stack.some((entry) => entry.historical);
      stack.push({
        level,
        historical: inherited || NON_ACTIVE_SECTION.test(stripMarkdown(match[2])),
      });
    }
    return { historical: stack.some((entry) => entry.historical) };
  });
}

function metadataValue(block: string[], key: string): string | undefined {
  const pattern = new RegExp('^\\*\\*' + key + ':\\*\\*\\s*(.+?)\\s*$', 'i');
  for (const line of block) {
    const match = pattern.exec(line.trim());
    if (match) return stripMarkdown(match[1]);
  }
  return undefined;
}

function firstDetail(block: string[]): string {
  for (const line of block) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith('**') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('|')
    ) {
      continue;
    }
    const value = stripMarkdown(trimmed);
    if (value) return value.slice(0, 360);
  }
  return '';
}

function buildItem(input: {
  id: string;
  title: string;
  route: RoadmapProjectRoute;
  stateLabel: string;
  source: string;
  sourceSha: string;
  detail?: string;
  dependencies?: string[];
  executionGroup?: string;
}): { item: RoadmapLiveItem | null; warning?: RoadmapProjectionWarning } {
  const classification = classifyState(input.stateLabel);
  if (!classification) return { item: null };

  const dependencies = dependenciesFor(input.id, input.dependencies ?? []);
  const item: RoadmapLiveItem = {
    id: input.id,
    title: input.title || input.id,
    projectId: input.route.projectId,
    projectFolder: input.route.folder,
    projectLabel: input.route.label,
    pvcRelationship: input.route.pvcRelationship,
    state: classification.state,
    stateLabel: stripMarkdown(input.stateLabel),
    source: input.source,
    sourceSha: input.sourceSha,
    detail: input.detail || '',
    dependencies,
    executionGroup: executionGroup(input.id, input.executionGroup),
    workerCandidate: isWorkerCandidate(classification.state, dependencies),
  };

  return {
    item,
    warning: classification.warning
      ? {
          code: classification.warning,
          source: input.source,
          itemId: input.id,
          detail:
            'CURRENT_MAIN source still carries branch/merge-gate state: ' +
            stripMarkdown(input.stateLabel),
        }
      : undefined,
  };
}

function parseProjectMarkdown(
  markdown: string,
  route: RoadmapProjectRoute,
  source: string,
  sourceSha: string,
): ParseResult {
  const lines = markdown.split(/\r?\n/);
  const context = headingContext(lines);
  const items: RoadmapLiveItem[] = [];
  const warnings: RoadmapProjectionWarning[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const heading = /^(#{2,6})\s+(.+?)\s*$/.exec(lines[index]);
    if (!heading || context[index].historical) continue;

    const headingIds = extractIds(stripMarkdown(heading[2]));
    if (headingIds.length === 0) continue;
    const id = headingIds[0];

    let end = index + 1;
    while (end < lines.length && !/^(#{1,6})\s+/.test(lines[end])) end += 1;
    const block = lines.slice(index + 1, end);
    const stateLabel = metadataValue(block, 'State') || metadataValue(block, 'Status');
    if (!stateLabel) continue;

    const title = stripMarkdown(heading[2])
      .replace(id, '')
      .replace(/^\s*[—–:-]\s*/, '')
      .trim();
    const deps = extractIds(
      metadataValue(block, 'Dependencies') || metadataValue(block, 'Dependency') || '',
    );
    const resolved = buildItem({
      id,
      title,
      route,
      stateLabel,
      source,
      sourceSha,
      detail: firstDetail(block),
      dependencies: deps,
      executionGroup: metadataValue(block, 'Execution group'),
    });
    if (resolved.item) items.push(resolved.item);
    if (resolved.warning) warnings.push(resolved.warning);
  }

  for (let index = 0; index < lines.length - 1; index += 1) {
    if (context[index].historical || !lines[index].trim().startsWith('|')) continue;
    if (!/^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(lines[index + 1])) continue;

    const headers = lines[index].split('|').slice(1, -1).map(cleanCell);
    const idIndex = headers.findIndex((header) =>
      /^(ID|Work item|Requirement|Phase)$/i.test(header),
    );
    const stateIndex = headers.findIndex((header) =>
      /(State|Live state|Current evidence state|State \/ exit)/i.test(header),
    );
    if (idIndex < 0 || stateIndex < 0) continue;

    let row = index + 2;
    while (row < lines.length && lines[row].trim().startsWith('|')) {
      if (context[row].historical) {
        row += 1;
        continue;
      }

      const cells = lines[row].split('|').slice(1, -1).map(cleanCell);
      if (cells.length !== headers.length) {
        row += 1;
        continue;
      }

      const rowIds = extractIds(cells[idIndex]);
      const id = rowIds[0];
      if (!id) {
        row += 1;
        continue;
      }

      const titleIndex = headers.findIndex((header) => /(Purpose|Stage|Title)/i.test(header));
      const dependencyIndex = headers.findIndex((header) => /Dependencies/i.test(header));
      const executionGroupIndex = headers.findIndex((header) => /Execution group/i.test(header));
      const exitIndex = headers.findIndex((header) => /Exit gate|State \/ exit/i.test(header));
      const resolved = buildItem({
        id,
        title: titleIndex >= 0 ? cells[titleIndex] : cells[idIndex],
        route,
        stateLabel: cells[stateIndex],
        source,
        sourceSha,
        detail: exitIndex >= 0 ? cells[exitIndex] : '',
        dependencies:
          dependencyIndex >= 0 ? extractIds(cells[dependencyIndex]) : [],
        executionGroup:
          executionGroupIndex >= 0 ? cells[executionGroupIndex] : undefined,
      });
      if (resolved.item) items.push(resolved.item);
      if (resolved.warning) warnings.push(resolved.warning);
      row += 1;
    }
    index = row - 1;
  }

  for (let index = 0; index < lines.length; index += 1) {
    if (context[index].historical) continue;
    const line = stripMarkdown(lines[index]);
    let proseIds = extractIds(line);
    if (proseIds.length === 0) continue;

    let stateLabel: string | null = null;
    if (/current dependency-ready/i.test(line)) {
      stateLabel = 'READY / CURRENT DEPENDENCY-READY';
    } else if (/fresh owner direction activates/i.test(line)) {
      stateLabel = 'ACTIVE / FRESH OWNER DIRECTION';
      const activationOffset = line.toLowerCase().indexOf('fresh owner direction activates');
      proseIds = extractIds(line.slice(activationOffset));
    } else if (/remains dependency-held/i.test(line)) {
      stateLabel = 'HELD / DEPENDENCY_HELD';
    }

    if (!stateLabel) continue;
    for (const id of proseIds) {
      const resolved = buildItem({
        id,
        title: id,
        route,
        stateLabel,
        source,
        sourceSha,
        detail: line.slice(0, 360),
      });
      if (resolved.item) items.push(resolved.item);
      if (resolved.warning) warnings.push(resolved.warning);
    }
  }

  return { items, warnings };
}

function parseLiveRoadmap(
  markdown: string,
  routes: RoadmapProjectRoute[],
  sourceSha: string,
): ParseResult {
  const matches = [...markdown.matchAll(/^## Live .*?(CAPITAL-AI-[A-Z-]+).*$/gm)];
  const items: RoadmapLiveItem[] = [];
  const warnings: RoadmapProjectionWarning[] = [];

  for (let index = 0; index < matches.length; index += 1) {
    const projectId = matches[index][1];
    const route = routes.find((candidate) => candidate.projectId === projectId);
    if (!route) {
      warnings.push({
        code: 'UNRESOLVED_LIVE_PROJECT',
        source: LIVE_ROADMAP_PATH,
        detail: 'Live Roadmap section cannot resolve canonical project routing: ' + projectId,
      });
      continue;
    }

    const start = matches[index].index ?? 0;
    const end =
      index + 1 < matches.length
        ? matches[index + 1].index ?? markdown.length
        : markdown.length;
    const parsed = parseProjectMarkdown(
      markdown.slice(start, end),
      route,
      LIVE_ROADMAP_PATH,
      sourceSha,
    );
    items.push(...parsed.items);
    warnings.push(...parsed.warnings);
  }

  return { items, warnings };
}

export function buildRoadmapStateFromSources(input: {
  currentMainSha: string;
  projectMapping: string;
  liveRoadmap: string;
  projectRoadmaps: Record<string, string>;
}): RoadmapStateProjection {
  const routes = parseRoadmapProjectRouting(input.projectMapping);
  const items: RoadmapLiveItem[] = [];
  const warnings: RoadmapProjectionWarning[] = [];
  const sources = [LIVE_ROADMAP_PATH];

  const live = parseLiveRoadmap(input.liveRoadmap, routes, input.currentMainSha);
  items.push(...live.items);
  warnings.push(...live.warnings);

  for (const route of routes) {
    const path = route.folder + 'ROADMAP.md';
    const markdown = input.projectRoadmaps[path];
    if (typeof markdown !== 'string') {
      throw new Error('ROADMAP_PROJECT_SOURCE_MISSING:' + path);
    }
    sources.push(path);

    const parsed = parseProjectMarkdown(
      markdown,
      route,
      path,
      input.currentMainSha,
    );
    items.push(...parsed.items);
    warnings.push(...parsed.warnings);
  }

  const deduplicated = new Map<string, RoadmapLiveItem>();
  for (const item of items) {
    const previous = deduplicated.get(item.id);
    if (!previous) {
      deduplicated.set(item.id, item);
      continue;
    }

    if (
      previous.source !== LIVE_ROADMAP_PATH &&
      item.source === LIVE_ROADMAP_PATH
    ) {
      deduplicated.set(item.id, item);
      continue;
    }

    if (
      previous.projectId !== item.projectId ||
      previous.state !== item.state ||
      previous.stateLabel !== item.stateLabel
    ) {
      warnings.push({
        code: 'DUPLICATE_CURRENT_IDENTITY',
        source: item.source,
        itemId: item.id,
        detail:
          'Duplicate current identity disagrees with ' +
          previous.source +
          '; canonical source correlation is required.',
      });
    }
  }

  const projected = [...deduplicated.values()].sort((left, right) => {
    const byProject = left.projectId.localeCompare(right.projectId);
    return byProject !== 0 ? byProject : left.id.localeCompare(right.id);
  });

  return {
    schemaVersion: 'roadmap-live-state/1.0.0',
    role: 'NON_AUTHORIZING_LIVE_PROJECTION',
    observedAt: new Date().toISOString(),
    stale: false,
    repository: { currentMainSha: input.currentMainSha },
    sources: [...new Set(sources)],
    items: projected,
    warnings,
  };
}

export async function buildRoadmapStateProjection(): Promise<RoadmapStateProjection> {
  const currentMainSha = await resolveCurrentMainSha();
  const projectMapping = await fetchCurrentMainTextFile(
    PROJECT_MAPPING_PATH,
    currentMainSha,
  );
  const routes = parseRoadmapProjectRouting(projectMapping);

  const [liveRoadmap, ...roadmaps] = await Promise.all([
    fetchCurrentMainTextFile(LIVE_ROADMAP_PATH, currentMainSha),
    ...routes.map((route) =>
      fetchCurrentMainTextFile(route.folder + 'ROADMAP.md', currentMainSha),
    ),
  ]);

  const projectRoadmaps = Object.fromEntries(
    routes.map((route, index) => [
      route.folder + 'ROADMAP.md',
      roadmaps[index],
    ]),
  );

  return buildRoadmapStateFromSources({
    currentMainSha,
    projectMapping,
    liveRoadmap,
    projectRoadmaps,
  });
}

export async function loadRoadmapStateProjection(): Promise<RoadmapStateProjection> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.value;

  try {
    const value = await buildRoadmapStateProjection();
    cache = { at: now, value };
    return value;
  } catch (error) {
    if (cache) {
      return {
        ...cache.value,
        stale: true,
        observedAt: new Date().toISOString(),
        warnings: [
          ...cache.value.warnings,
          {
            code: 'UNRESOLVED_LIVE_PROJECT',
            source: 'runtime',
            detail: error instanceof Error ? error.message : String(error),
          },
        ],
      };
    }
    throw error;
  }
}

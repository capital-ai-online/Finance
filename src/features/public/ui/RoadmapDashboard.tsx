import React, { useEffect, useMemo, useState } from 'react';
import projectMappingMarkdown from '../../../../docs/projects/README.md?raw';
import {
  Activity,
  ArrowLeft,
  CircleDot,
  Clock3,
  GitBranch,
  Layers3,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from 'lucide-react';
import { LandingPageTemplate, LandingPanel } from './LandingPageTemplate';
import {
  type RoadmapQueueState,
  type RoadmapWorkState,
} from './roadmapSnapshot';
import {
  buildRoadmapExecutionLanes,
  parseRoadmapProjectRouting,
  resolveRoadmapProjects,
  type RoadmapProjectFilters,
} from './roadmapProjectRouting';
import {
  matchesRoadmapLiveItemFilters,
  parseRoadmapLiveProjection,
  splitRoadmapLiveItems,
  type RoadmapLiveClientState,
  type RoadmapLiveItem,
  type RoadmapLiveState,
} from './roadmapLiveState';

type ProductionIdentityState =
  | { status: 'loading'; commitSha: null; branch: null; version: null }
  | { status: 'available'; commitSha: string | null; branch: string | null; version: string | null }
  | { status: 'unavailable'; commitSha: null; branch: null; version: null };


const PROJECT_ROUTES = parseRoadmapProjectRouting(projectMappingMarkdown);
const EMPTY_FILTERS: RoadmapProjectFilters = { owner: '', folder: '', label: '' };

type RoadmapStatusFilter = 'active' | 'pending';

const ROADMAP_STATUS_FILTERS: Array<{
  id: RoadmapStatusFilter;
  label: string;
  detail: string;
}> = [
  { id: 'active', label: 'Aktiv', detail: 'Deploy-Snapshot' },
  { id: 'pending', label: 'Pending', detail: 'Backlog / geplant' },
];

function matchesStatusFilter(item: RoadmapLiveItem, filter: RoadmapStatusFilter): boolean {
  if (filter === 'active') {
    return item.state === 'ACTIVE' || item.state === 'IN_PROGRESS' || item.state === 'EVIDENCE_GATE';
  }
  if (filter === 'pending') {
    return item.state === 'READY' || item.state === 'HELD' || item.state === 'QUEUED';
  }
  return false;
}

function ProjectMetadata({ owner }: { owner: string }) {
  const projects = resolveRoadmapProjects(owner, PROJECT_ROUTES);
  if (projects.length === 0) {
    return (
      <p className="font-mono text-[10px] text-score-warning">
        Project mapping unresolved — fail closed
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Project routing metadata">
      {projects.map((project) => (
        <span
          key={project.projectId}
          className="rounded-md border bg-black/20 px-2 py-1 font-mono text-[10px] text-white/65"
          style={{ borderColor: project.color }}
          title={`${project.projectId} · ${project.folder} · ${project.label}`}
        >
          {project.symbol} {project.projectId} · {project.folder} · {project.label}
        </span>
      ))}
    </div>
  );
}

const STATE_STYLE: Record<RoadmapWorkState, string> = {
  'in-flight': 'border-status-info/30 bg-status-info/10 text-status-info',
  active: 'border-brand-success/30 bg-brand-success/10 text-brand-success',
  'in-progress': 'border-brand-accent/30 bg-brand-accent/10 text-brand-accent',
  'evidence-gate': 'border-score-warning/30 bg-score-warning/10 text-score-warning',
};

const QUEUE_STYLE: Record<RoadmapQueueState, string> = {
  ready: 'border-brand-success/30 bg-brand-success/10 text-brand-success',
  held: 'border-score-warning/30 bg-score-warning/10 text-score-warning',
  queued: 'border-status-info/30 bg-status-info/10 text-status-info',
};

function shortSha(value: string | null | undefined) {
  return value ? value.slice(0, 8) : 'nicht verfügbar';
}

const LIVE_COLUMNS: Array<{ state: RoadmapLiveState; label: string }> = [
  { state: 'QUEUED', label: 'Queued' },
  { state: 'HELD', label: 'Held' },
  { state: 'READY', label: 'Ready' },
  { state: 'EVIDENCE_GATE', label: 'Evidence' },
  { state: 'IN_PROGRESS', label: 'In Progress' },
  { state: 'ACTIVE', label: 'Active' },
];

const LIVE_STATE_STYLE: Record<RoadmapLiveState, string> = {
  QUEUED: QUEUE_STYLE.queued,
  HELD: QUEUE_STYLE.held,
  READY: QUEUE_STYLE.ready,
  EVIDENCE_GATE: STATE_STYLE['evidence-gate'],
  IN_PROGRESS: STATE_STYLE['in-progress'],
  ACTIVE: STATE_STYLE.active,
};

function liveColumnIcon(state: RoadmapLiveState) {
  if (state === 'HELD' || state === 'EVIDENCE_GATE') {
    return <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />;
  }
  if (state === 'IN_PROGRESS') return <Activity className="h-3.5 w-3.5" aria-hidden="true" />;
  if (state === 'ACTIVE' || state === 'READY') return <CircleDot className="h-3.5 w-3.5" aria-hidden="true" />;
  return <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />;
}

function buildOwnerLanes(items: RoadmapLiveItem[]) {
  const grouped = new Map<string, RoadmapLiveItem[]>();
  for (const item of items) {
    const bucket = grouped.get(item.projectId);
    if (bucket) bucket.push(item);
    else grouped.set(item.projectId, [item]);
  }

  const known = PROJECT_ROUTES.map((route) => route.projectId);
  const ordered = [
    ...known.filter((projectId) => grouped.has(projectId)),
    ...[...grouped.keys()].filter((projectId) => !known.includes(projectId)).sort(),
  ];

  return ordered.map((projectId) => ({
    projectId,
    route: PROJECT_ROUTES.find((route) => route.projectId === projectId) ?? null,
    items: grouped.get(projectId) ?? [],
  }));
}

function OwnerStateTimeline({
  items,
  selectedId,
  onSelect,
}: {
  items: RoadmapLiveItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const lanes = buildOwnerLanes(items);

  return (
    <div className="landing-page-panel landing-page-panel--elevated overflow-x-auto">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
          Landing-Zustandsachse
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
          Queued → Active · keine Termine
        </p>
      </div>
      <div className="mb-3 h-0.5 rounded-full bg-brand-primary" />
      <div
        className="grid min-w-[68rem] gap-2"
        style={{ gridTemplateColumns: 'minmax(11rem, 14rem) repeat(6, minmax(9.25rem, 1fr))' }}
        role="table"
        aria-label="Owner-Timeline nach Work-State"
      >
        <div role="row" className="contents">
        <div
          role="columnheader"
          className="sticky left-0 z-20 bg-[#090D1C] px-2 py-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-brand-primary"
        >
            Project Owner
          </div>
          {LIVE_COLUMNS.map((column) => (
            <div
              key={column.state}
              role="columnheader"
              className="flex items-center gap-1.5 px-2 py-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-brand-primary"
            >
              {liveColumnIcon(column.state)}
              {column.label}
            </div>
          ))}
        </div>

        {lanes.map((lane) => (
          <div key={lane.projectId} role="row" className="contents">
            <div
              role="rowheader"
              className="sticky left-0 z-10 rounded-xl border border-white/10 bg-[#090D1C] px-3 py-3"
              style={lane.route ? { boxShadow: `inset 3px 0 0 ${lane.route.color}` } : undefined}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-primary">
                {lane.route ? `${lane.route.symbol} ${lane.route.displayName}` : 'Unmapped'}
              </p>
              <p className="mt-1 break-words text-xs font-black text-white">{lane.projectId}</p>
              <p className="mt-2 font-mono text-[10px] text-slate-400">{lane.items.length} Pakete</p>
            </div>
            {LIVE_COLUMNS.map((column) => {
              const cellItems = lane.items.filter((item) => item.state === column.state);
              return (
                <div
                  key={`${lane.projectId}-${column.state}`}
                  role="cell"
                  className="min-h-16 rounded-xl border border-white/10 bg-surface/40 p-1.5"
                >
                  {cellItems.length === 0 ? (
                    <span className="block px-2 py-3 text-center font-mono text-[10px] text-white/20" aria-hidden="true">
                      —
                    </span>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {cellItems.map((item) => {
                        const selected = selectedId === item.id;
                        return (
                          <button
                            key={`${item.id}-${item.state}`}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onSelect(item.id)}
                            className={`min-h-11 rounded-lg border px-2 py-1.5 text-left ${LIVE_STATE_STYLE[item.state]} ${
                              selected ? 'ring-2 ring-brand-primary' : ''
                            }`}
                          >
                            <span className="block font-mono text-[10px] font-black">{item.id}</span>
                            <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-white">
                              {item.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}


function LiveItemDetail({ item }: { item: RoadmapLiveItem }) {
  return (
    <LandingPanel elevated className="mt-4 flex flex-col gap-3 border-white/8 bg-surface/75 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            {item.projectId} · {item.projectFolder}
          </p>
          <h3 className="mt-1 break-words text-base font-extrabold text-white">{item.id}</h3>
          <p className="mt-1 text-sm font-semibold text-white/75">{item.title}</p>
        </div>
        <span
          className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${LIVE_STATE_STYLE[item.state]}`}
        >
          {liveColumnIcon(item.state)}
          <span className="break-words">{item.stateLabel}</span>
        </span>
      </div>
      {item.detail ? <p className="text-sm leading-6 text-text-secondary">{item.detail}</p> : null}
      <div className="space-y-2 border-t border-white/8 pt-3">
        <p className="text-[11px] leading-5 text-white/55">
          <span className="font-bold text-white/70">Owner-Boundary:</span> {item.pvcRelationship}
        </p>
        <p className="text-[11px] leading-5 text-white/55">
          <span className="font-bold text-white/70">Execution Group:</span> {item.executionGroup}
          {item.workerCandidate ? ' · Worker Candidate' : ''}
        </p>
        {item.dependencies.length > 0 ? (
          <p className="text-[11px] leading-5 text-white/55">
            <span className="font-bold text-white/70">Abhängigkeiten:</span> {item.dependencies.join(' · ')}
          </p>
        ) : null}
        <ProjectMetadata owner={item.projectId} />
        <p className="break-all font-mono text-[10px] leading-5 text-white/40">
          {item.source} · {shortSha(item.sourceSha)}
        </p>
      </div>
    </LandingPanel>
  );
}

export function RoadmapDashboard() {
  const [production, setProduction] = useState<ProductionIdentityState>({
    status: 'loading',
    commitSha: null,
    branch: null,
    version: null,
  });

  const [liveRoadmap, setLiveRoadmap] = useState<RoadmapLiveClientState>({
    status: 'loading',
    projection: null,
    error: null,
  });
  const [projectFilters, setProjectFilters] = useState<RoadmapProjectFilters>(EMPTY_FILTERS);
  const [statusFilter, setStatusFilter] = useState<RoadmapStatusFilter | null>(null);
  const [workPackageQuery, setWorkPackageQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void fetch('/healthz', {
      method: 'GET',
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('healthz-unavailable');
        setProduction({
          status: 'available',
          commitSha: response.headers.get('x-capital-ai-commit'),
          branch: response.headers.get('x-capital-ai-branch'),
          version: response.headers.get('x-capital-ai-version'),
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setProduction({ status: 'unavailable', commitSha: null, branch: null, version: null });
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void fetch('/roadmap-deploy-snapshot.json', {
      method: 'GET',
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('roadmap-deploy-snapshot-unavailable');
        return parseRoadmapLiveProjection(await response.json());
      })
      .then((projection) => {
        if (!controller.signal.aborted) {
          setLiveRoadmap({ status: 'available', projection, error: null });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setLiveRoadmap({
            status: 'unavailable',
            projection: null,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

    return () => controller.abort();
  }, []);

  const liveProjection =
    liveRoadmap.status === 'available' ? liveRoadmap.projection : null;
  const filteredLiveItems = useMemo(() => {
    const query = workPackageQuery.trim().toLowerCase();
    return (
      liveProjection?.items.filter((item) => {
        if (!matchesRoadmapLiveItemFilters(item, projectFilters)) return false;
        if (!query) return true;
        return [item.id, item.title, item.detail, item.executionGroup]
          .join(' ')
          .toLowerCase()
          .includes(query);
      }) ?? []
    );
  }, [liveProjection, projectFilters, workPackageQuery]);

  const visibleTimelineItems = useMemo(() => {
    if (statusFilter === null) return filteredLiveItems;
    return filteredLiveItems.filter((item) => matchesStatusFilter(item, statusFilter));
  }, [filteredLiveItems, statusFilter]);

  const selectedLiveItem = useMemo(
    () => visibleTimelineItems.find((item) => item.id === selectedItemId) ?? null,
    [selectedItemId, visibleTimelineItems],
  );

  const liveWork = useMemo(
    () => splitRoadmapLiveItems(filteredLiveItems),
    [filteredLiveItems],
  );
  const visibleWorkPackages = liveWork.activeWorkPackages;

  const visibleQueuedItems = liveWork.queuedItems;

  const executionLanes = useMemo(
    () => buildRoadmapExecutionLanes(visibleWorkPackages, visibleQueuedItems, PROJECT_ROUTES),
    [visibleQueuedItems, visibleWorkPackages],
  );

  const metrics = useMemo(() => {
    const owners = new Set(filteredLiveItems.map((item) => item.projectId)).size;
    return {
      active: visibleWorkPackages.length,
      workerCandidates: filteredLiveItems.filter((item) => item.workerCandidate).length,
      owners,
      parallelLanes: executionLanes.length,
    };
  }, [executionLanes, filteredLiveItems, visibleWorkPackages]);

  const liveCurrentMainSha = liveProjection?.repository.currentMainSha ?? null;
  const productionAligned =
    liveProjection?.stale === false &&
    production.status === 'available' &&
    Boolean(production.commitSha) &&
    Boolean(liveCurrentMainSha) &&
    production.commitSha === liveCurrentMainSha;

  return (
    <LandingPageTemplate
      eyebrow="Control Center · Roadmap"
      statusLabel="Derived · Non-authorizing"
      title="Roadmap"
      description={
        <>
          Owner-Timeline aus <code>/roadmap-deploy-snapshot.json</code> des ausgelieferten Commits.
          Standard sind alle Work-States von Queued bis Active, ohne Kalenderdaten.
          Der Stand wird beim vorgesehenen Deploy erstellt.
        </>
      }
      actions={
        <>
          <a href="/" className="landing-page-button-secondary inline-flex items-center gap-2 px-4 py-2 text-xs font-bold">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Landingpage
          </a>
          <a href="/vocabulary" className="landing-page-button-secondary inline-flex items-center gap-2 px-4 py-2 text-xs font-bold">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
            Vocabulary
          </a>
        </>
      }
    >
        <section aria-label="Roadmap-Deploy-Signale" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <LandingPanel className="border-white/8 bg-surface/70 p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-brand-success" aria-hidden="true" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Aktive Pakete</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {liveRoadmap.status === 'available' ? metrics.active : '—'}
                </p>
              </div>
            </div>
          </LandingPanel>
          <LandingPanel className="border-white/8 bg-surface/70 p-4">
            <div className="flex items-center gap-3">
              <UsersRound className="h-5 w-5 text-status-info" aria-hidden="true" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Worker Candidates</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {liveRoadmap.status === 'available' ? metrics.workerCandidates : '—'}
                </p>
              </div>
            </div>
          </LandingPanel>
          <LandingPanel className="border-white/8 bg-surface/70 p-4">
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-brand-primary" aria-hidden="true" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Deploy-Commit</p>
                <p className="mt-1 font-mono text-sm font-black text-white">
                  {liveRoadmap.status === 'loading'
                    ? 'wird gelesen…'
                    : liveRoadmap.status === 'unavailable'
                      ? 'nicht verfügbar'
                      : shortSha(liveCurrentMainSha)}
                </p>
              </div>
            </div>
          </LandingPanel>
          <LandingPanel className="border-white/8 bg-surface/70 p-4">
            <div className="flex items-center gap-3">
              <Radio
                className={`h-5 w-5 ${
                  productionAligned
                    ? 'text-brand-success'
                    : production.status === 'available'
                      ? 'text-score-warning'
                      : 'text-text-secondary'
                }`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Production Identity</p>
                <p className="mt-1 truncate font-mono text-sm font-black text-white">
                  {production.status === 'loading'
                    ? 'wird gelesen…'
                    : production.status === 'unavailable'
                      ? 'nicht verfügbar'
                      : shortSha(production.commitSha)}
                </p>
                {production.status === 'available' ? (
                  <p className="mt-1 text-[10px] text-white/45">
                    {productionAligned ? 'Baseline identisch' : 'Deployment-Identität abweichend'} · {production.branch ?? 'branch n/a'}
                    {production.version ? ` · v${production.version}` : ''}
                  </p>
                ) : null}
              </div>
            </div>
          </LandingPanel>
        </section>

        <section
          aria-live="polite"
          data-roadmap-live-state={
            liveRoadmap.status === 'available'
              ? liveRoadmap.projection.stale
                ? 'stale'
                : 'deploy'
              : liveRoadmap.status
          }
          className="landing-page-panel"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
                Roadmap-Deploy-Snapshot
              </p>
              <h2 className="mt-1 text-lg font-black text-white">
                {liveRoadmap.status === 'loading'
                  ? 'Deploy-Snapshot wird geladen'
                  : liveRoadmap.status === 'unavailable'
                    ? 'Deploy-Snapshot nicht verfügbar'
                    : liveRoadmap.projection.stale
                      ? 'STALE · Deploy-Snapshot prüfen'
                      : 'Stand des letzten Deploys'}
              </h2>
            </div>
            {liveRoadmap.status === 'available' ? (
              <span
                className={
                  liveRoadmap.projection.stale
                    ? 'rounded-full border border-score-warning/30 bg-score-warning/10 px-2.5 py-1 text-[10px] font-black uppercase text-score-warning'
                    : 'rounded-full border border-brand-success/30 bg-brand-success/10 px-2.5 py-1 text-[10px] font-black uppercase text-brand-success'
                }
              >
                {liveRoadmap.projection.stale ? 'STALE' : 'DEPLOY'}
              </span>
            ) : null}
          </div>

          {liveRoadmap.status === 'available' ? (
            <div className="mt-3 space-y-1 text-xs leading-5 text-text-secondary">
              <p>
                Generation <code>{shortSha(liveRoadmap.projection.repository.currentMainSha)}</code>
                {' · '}erstellt {liveRoadmap.projection.observedAt}
                {' · '}{liveRoadmap.projection.sources.length} Quellen
              </p>
              {liveRoadmap.projection.stale ? (
                <p className="font-semibold text-score-warning">
                  Der ausgelieferte Snapshot ist als STALE markiert.
                </p>
              ) : null}
              {liveRoadmap.projection.warnings.length > 0 ? (
                <p>{liveRoadmap.projection.warnings.length} Snapshot-Warnung(en) · Details bleiben fail-closed.</p>
              ) : null}
            </div>
          ) : liveRoadmap.status === 'unavailable' ? (
            <p className="mt-3 text-xs leading-5 text-score-warning">
              Arbeitspakete und Worker-Lanes werden fail-closed ausgeblendet. Fehler: {liveRoadmap.error}
            </p>
          ) : (
            <p className="mt-3 text-xs leading-5 text-text-secondary">
              Bis zum Laden des Deploy-Snapshots werden keine Arbeitspakete als ausgeliefert dargestellt.
            </p>
          )}
        </section>

        <section aria-labelledby="roadmap-filters-title" className="landing-page-panel landing-page-panel--elevated">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-brand-primary" aria-hidden="true" />
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
                  Project Routing Filter
                </p>
              </div>
              <h2 id="roadmap-filters-title" className="mt-1 text-lg font-black text-white">
                Nach Arbeitspaket, Status, Project Owner und Label filtern
              </h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-white/50">
                Alle Optionen werden zur Build-Zeit direkt aus <code>docs/projects/README.md</code> gelesen.
                Diese UI erzeugt keine zweite Project- oder Ownership-Registry.
              </p>
            </div>
            <button
              type="button"
              className="landing-page-button-secondary px-3 py-2 text-xs font-bold"
              onClick={() => {
                setProjectFilters(EMPTY_FILTERS);
                setStatusFilter(null);
                setWorkPackageQuery('');
                setSelectedItemId(null);
              }}
            >
              Filter zurücksetzen
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Roadmap Status">
              <button
                type="button"
                aria-pressed={statusFilter === null}
                onClick={() => {
                  setStatusFilter(null);
                  setSelectedItemId(null);
                }}
                className={`min-h-12 rounded-xl border px-2 py-2 text-left transition ${
                  statusFilter === null
                    ? 'border-brand-primary/50 bg-brand-primary/15 text-white'
                    : 'border-white/10 bg-surface/60 text-slate-400'
                }`}
              >
                <span className="block text-xs font-black">Alle</span>
                <span className="mt-0.5 block font-mono text-[9px] leading-4 text-brand-primary">Owner-Timeline</span>
              </button>
              {ROADMAP_STATUS_FILTERS.map((filter) => {
                const active = statusFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setStatusFilter(filter.id);
                      setSelectedItemId(null);
                    }}
                    className={`min-h-12 rounded-xl border px-2 py-2 text-left transition ${
                      active
                        ? 'border-brand-primary/50 bg-brand-primary/15 text-white'
                        : 'border-white/8 bg-black/20 text-white/55 hover:bg-white/5'
                    }`}
                  >
                    <span className="block text-xs font-black">{filter.label}</span>
                    <span className="mt-0.5 block font-mono text-[9px] leading-4 opacity-70">{filter.detail}</span>
                  </button>
                );
              })}
            </div>

            <label className="block space-y-2 text-xs font-bold text-white/70">
              <span>Arbeitspaket suchen</span>
              <input
                type="search"
                value={workPackageQuery}
                onChange={(event) => {
                  setWorkPackageQuery(event.target.value);
                  setSelectedItemId(null);
                }}
                placeholder="z. B. SEC-WEB-20, Auth, Pipeline …"
                className="min-h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-white placeholder:text-white/30"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <label className="space-y-2 text-xs font-bold text-white/70">
              <span>Project Owner</span>
              <select
                className="min-h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-white"
                value={projectFilters.owner}
                onChange={(event) =>
                  setProjectFilters((current) => ({ ...current, owner: event.target.value }))
                }
              >
                <option value="">Alle Project Owner</option>
                {PROJECT_ROUTES.map((project) => (
                  <option key={project.projectId} value={project.projectId}>
                    {project.symbol} {project.projectId} · {project.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-xs font-bold text-white/70">
              <span>Folder</span>
              <select
                className="min-h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-white"
                value={projectFilters.folder}
                onChange={(event) =>
                  setProjectFilters((current) => ({ ...current, folder: event.target.value }))
                }
              >
                <option value="">Alle Folder</option>
                {PROJECT_ROUTES.map((project) => (
                  <option key={project.folder} value={project.folder}>
                    {project.folder}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-xs font-bold text-white/70">
              <span>Label</span>
              <select
                className="min-h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-white"
                value={projectFilters.label}
                onChange={(event) =>
                  setProjectFilters((current) => ({ ...current, label: event.target.value }))
                }
              >
                <option value="">Alle Labels</option>
                {PROJECT_ROUTES.map((project) => (
                  <option key={project.label} value={project.label}>
                    {project.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section aria-labelledby="parallel-work-title" className="landing-page-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-3">
              <UsersRound className="mt-0.5 h-5 w-5 text-brand-primary" aria-hidden="true" />
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
                  Parallel Worker Projection
                </p>
                <h2 id="parallel-work-title" className="text-lg font-black text-white">
                  {liveRoadmap.status === 'available'
                    ? `${metrics.parallelLanes} parallelisierbare Worker-Lanes im aktuellen Filter`
                    : 'Deploy-Snapshot nicht verfügbar'}
                </h2>
              </div>
            </div>
            <p className="max-w-2xl text-xs leading-5 text-white/50">
              Eine Lane bündelt zusammengehörige ACTIVE/READY-Pakete über <code>executionGroup</code>.
              HELD/QUEUED und Evidence-Gates erhöhen die Zahl nicht. Vor dem tatsächlichen Start muss
              jeder Chat CURRENT_MAIN, offene Writer, Pfad-/Semantik-Overlap und Owner-Grenzen neu prüfen.
            </p>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {executionLanes.map((lane) => (
              <div key={lane.id} className="rounded-xl border border-white/8 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                      {lane.projectIds.join(' · ') || 'PROJECT UNRESOLVED'}
                    </p>
                    <h3 className="mt-1 text-sm font-black text-white">{lane.id}</h3>
                  </div>
                  <span className="rounded-full border border-brand-success/30 bg-brand-success/10 px-2.5 py-1 text-[10px] font-black uppercase text-brand-success">
                    {lane.itemIds.length > 1 ? 'GEBÜNDELT' : 'UNABHÄNGIG'}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-text-secondary">
                  {lane.itemIds.join(' · ')}
                </p>
                <p className="mt-3 font-mono text-[10px] text-white/45">
                  ACTIVE {lane.activeItems} · READY {lane.readyItems}
                </p>
                {lane.dependencies.length > 0 ? (
                  <p className="mt-2 text-[11px] leading-5 text-white/55">
                    Abhängigkeiten: {lane.dependencies.join(' · ')}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="owner-timeline-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary">
                Owner-Timeline
              </p>
              <h2 id="owner-timeline-title" className="mt-1 text-xl font-black text-white sm:text-2xl">
                Work-State nach Project Owner
              </h2>
            </div>
            <p className="max-w-xl text-xs leading-5 text-white/45">
              {liveRoadmap.status === 'available'
                ? `${metrics.owners} beteiligte Owner · ${visibleTimelineItems.length} sichtbar · DEPLOY ${shortSha(liveCurrentMainSha)}`
                : 'Deploy-Snapshot nicht verfügbar'}
            </p>
          </div>
          <p className="mb-4 max-w-3xl text-xs leading-5 text-white/50">
            Keine Kalenderachse. Die Zustandsmatrix ist auf jeder Breite die Roadmap: Navy, Gold und Glasflächen.
            Schmale Viewports scrollen die Achse Queued → Active horizontal; der Project Owner bleibt links stehen.
            Die Ansicht zeigt den Stand des letzten erfolgreichen Deploys.
          </p>

          {liveRoadmap.status === 'loading' ? (
            <LandingPanel className="border-white/8 bg-surface/65 p-4 text-sm text-text-secondary">
              Deploy-Snapshot wird geladen…
            </LandingPanel>
          ) : liveRoadmap.status === 'unavailable' ? (
            <LandingPanel className="border-score-warning/20 bg-score-warning/5 p-4 text-sm text-score-warning">
              Deploy-Snapshot nicht verfügbar — Arbeitspakete werden fail-closed ausgeblendet.
            </LandingPanel>
          ) : (
            <>
              {visibleTimelineItems.length === 0 ? (
                <LandingPanel className="border-white/8 bg-surface/65 p-4 text-sm text-text-secondary">
                  Keine Arbeitspakete im aktuellen Status- und Project-Filter.
                </LandingPanel>
              ) : (
                <>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 lg:sr-only">
                    Horizontal scrollen
                  </p>
                  <OwnerStateTimeline
                    items={visibleTimelineItems}
                    selectedId={selectedLiveItem?.id ?? null}
                    onSelect={(id) => setSelectedItemId((current) => (current === id ? null : id))}
                  />
                  {selectedLiveItem ? <LiveItemDetail item={selectedLiveItem} /> : (
                    <p className="mt-3 text-xs text-slate-400">Ein Paket wählen, um Quelle, Gate und Owner-Grenze zu lesen.</p>
                  )}
                </>
              )}
            </>
          )}
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/8 py-4 text-[11px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>Branding: LandingPageTemplate · BrandLogo · canonical landingPage token profile.</p>
          <p className="font-mono">
            Korrelation {liveRoadmap.status === 'available' ? shortSha(liveCurrentMainSha) : 'nicht verfügbar'} · Production-Identität kommt aus /healthz.
          </p>
        </footer>
    </LandingPageTemplate>
  );
}

export default RoadmapDashboard;

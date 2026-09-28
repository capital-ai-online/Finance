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
  ROADMAP_DASHBOARD_SNAPSHOT,
  type RoadmapIntegrationItem,
  type RoadmapIntegrationState,
  type RoadmapQueueState,
  type RoadmapWorkState,
} from './roadmapSnapshot';
import {
  buildRoadmapExecutionLanes,
  matchesRoadmapProjectFilters,
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
import {
  parseRoadmapBranchProjection,
  type RoadmapBranchClientState,
  type RoadmapBranchEvidence,
} from './roadmapBranchState';

type ProductionIdentityState =
  | { status: 'loading'; commitSha: null; branch: null; version: null }
  | { status: 'available'; commitSha: string | null; branch: string | null; version: string | null }
  | { status: 'unavailable'; commitSha: null; branch: null; version: null };


const PROJECT_ROUTES = parseRoadmapProjectRouting(projectMappingMarkdown);
const EMPTY_FILTERS: RoadmapProjectFilters = { owner: '', folder: '', label: '' };

type RoadmapStatusFilter = 'active' | 'live' | 'pending';

const ROADMAP_STATUS_FILTERS: Array<{
  id: RoadmapStatusFilter;
  label: string;
  detail: string;
}> = [
  { id: 'active', label: 'Aktiv', detail: 'CURRENT_MAIN' },
  { id: 'live', label: 'Live', detail: 'Branches · behind 0' },
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

const INTEGRATION_STYLE: Record<RoadmapIntegrationState, string> = {
  'production-covered': 'border-brand-success/30 bg-brand-success/10 text-brand-success',
  'repository-integrated': 'border-status-info/30 bg-status-info/10 text-status-info',
  'main-only': 'border-brand-accent/30 bg-brand-accent/10 text-brand-accent',
  'provider-gate': 'border-score-warning/30 bg-score-warning/10 text-score-warning',
  'legacy-drift': 'border-[#F87171]/30 bg-[#F87171]/10 text-[#F87171]',
};

const PHASES = [
  {
    id: 'foundation',
    title: 'Foundation',
    status: 'Abgeschlossen',
    accent: 'text-roadmap-foundation',
    line: 'bg-roadmap-foundation',
    detail: 'Trust Root, konsolidierte Architektur und kanonische Branding-Verträge sind auf Main etabliert.',
  },
  {
    id: 'automation',
    title: 'Automation',
    status: 'In Umsetzung',
    accent: 'text-roadmap-automation',
    line: 'bg-roadmap-automation',
    detail: 'Governance-Convergence, dokumentarische Workflows und CI-/Preflight-Steuerung bleiben aktive Arbeit.',
  },
  {
    id: 'runtime',
    title: 'Self-Healing Runtime',
    status: 'In Umsetzung',
    accent: 'text-roadmap-runtime',
    line: 'bg-roadmap-runtime',
    detail: 'SH-02.11 ist mit RETRY_SAFE_OPERATION aktiviert; SH-02.12 und weitere generische/protected Self-Healing-Aktionen bleiben held.',
  },
  {
    id: 'product',
    title: 'Produkt & Markt',
    status: 'In Umsetzung',
    accent: 'text-roadmap-product-market',
    line: 'bg-roadmap-product-market',
    detail: 'Roadmap, Consent/GA4, FAQ, Sentiment, Auth/Profile, SEO Launch sowie Social/TTS- und Media-Slices werden getrennt nach Main-, Production- und Provider-Evidence projiziert.',
  },
  {
    id: 'scaling',
    title: 'Skalierung',
    status: 'Geplant / gehalten',
    accent: 'text-roadmap-scaling',
    line: 'bg-roadmap-scaling',
    detail: 'Spätere Produktivaktivierungen bleiben von Security-, Compliance-, Quality-, Runtime- und Human-Gates abhängig.',
  },
] as const;

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
          <div role="columnheader" className="px-2 py-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-brand-primary">
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
              className="rounded-xl border border-white/10 bg-surface/80 px-3 py-3"
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


function LiveBranchCards({
  branches,
}: {
  branches: RoadmapBranchEvidence[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Live Branches mit behind 0">
      {branches.map((branch) => {
        const route = branch.projectId
          ? PROJECT_ROUTES.find((candidate) => candidate.projectId === branch.projectId)
          : undefined;
        return (
          <LandingPanel key={branch.name} className="border-brand-primary/20 bg-brand-primary/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-brand-primary">
                  {branch.projectId ?? 'OWNER UNRESOLVED'}
                </p>
                <h3 className="mt-2 break-all text-xs font-black leading-5 text-white">
                  {branch.name}
                </h3>
              </div>
              <span className="shrink-0 rounded-full border border-brand-success/30 bg-brand-success/10 px-2 py-1 font-mono text-[10px] font-black text-brand-success">
                behind 0
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10px] text-white/55">
              <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1">
                ahead +{branch.aheadBy}
              </span>
              <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1">
                {shortSha(branch.headSha)}
              </span>
            </div>
            {branch.ownerResolution === 'RESOLVED' ? (
              <p className="mt-3 break-words text-[10px] leading-5 text-white/45">
                <span style={{ color: route?.color }}>{route?.symbol ?? '•'}</span>{' '}
                {branch.projectLabel} · {branch.projectFolder}
              </p>
            ) : (
              <p className="mt-3 text-[10px] font-bold leading-5 text-score-warning">
                Project Owner nicht eindeutig auflösbar — Branch-Evidence bleibt sichtbar, aber nicht autorisierend.
              </p>
            )}
          </LandingPanel>
        );
      })}
    </div>
  );
}

function OwnerStateMobileCards({
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
    <div className="space-y-3 lg:hidden" aria-label="Mobile Roadmap nach Project Owner">
      {lanes.map((lane) => (
        <section
          key={lane.projectId}
          className="landing-page-panel p-3"
          style={lane.route ? { boxShadow: `inset 3px 0 0 ${lane.route.color}` } : undefined}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                {lane.route ? `${lane.route.symbol} ${lane.route.displayName}` : 'Unmapped'}
              </p>
              <h3 className="mt-1 break-words text-xs font-black text-white">
                {lane.projectId}
              </h3>
            </div>
            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-white/55">
              {lane.items.length}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {lane.items.map((item) => {
              const selected = selectedId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(item.id)}
                  className={`w-full rounded-xl border p-3 text-left ${LIVE_STATE_STYLE[item.state]} ${
                    selected ? 'ring-1 ring-brand-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] font-black">{item.id}</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-current/20 px-2 py-0.5 text-[9px] font-black uppercase">
                      {liveColumnIcon(item.state)}
                      {item.stateLabel}
                    </span>
                  </div>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-white/90">
                    {item.title}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
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

function IntegrationCard({ item }: { item: RoadmapIntegrationItem }) {
  return (
    <LandingPanel className="flex h-full flex-col gap-3 border-white/8 bg-surface/65 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
            {item.owner}
          </p>
          <h3 className="mt-1 break-words text-sm font-black text-white">{item.id}</h3>
          <p className="mt-1 text-xs font-semibold text-white/70">{item.title}</p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${INTEGRATION_STYLE[item.state]}`}
        >
          {item.stateLabel}
        </span>
      </div>
      <p className="text-xs leading-5 text-text-secondary">{item.detail}</p>
      {item.nextGate ? (
        <p className="rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-[11px] leading-5 text-white/60">
          <span className="font-bold text-white/75">Nächstes Gate:</span> {item.nextGate}
        </p>
      ) : null}
      <ProjectMetadata owner={item.owner} />
      <p className="mt-auto break-all border-t border-white/8 pt-3 font-mono text-[10px] leading-5 text-white/35">
        {item.source}
      </p>
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
  const [liveBranches, setLiveBranches] = useState<RoadmapBranchClientState>({
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

    void fetch('/api/roadmap/state', {
      method: 'GET',
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('roadmap-live-state-unavailable');
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

  useEffect(() => {
    const controller = new AbortController();

    void fetch('/api/roadmap/branches', {
      method: 'GET',
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('roadmap-branch-evidence-unavailable');
        return parseRoadmapBranchProjection(await response.json());
      })
      .then((projection) => {
        if (!controller.signal.aborted) {
          setLiveBranches({ status: 'available', projection, error: null });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setLiveBranches({
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
  const branchProjection =
    liveBranches.status === 'available' ? liveBranches.projection : null;

  const visibleLiveBranches = useMemo(() => {
    const query = workPackageQuery.trim().toLowerCase();
    return (
      branchProjection?.branches.filter((branch) => {
        if (projectFilters.owner && branch.projectId !== projectFilters.owner) return false;
        if (projectFilters.folder && branch.projectFolder !== projectFilters.folder) return false;
        if (projectFilters.label && branch.projectLabel !== projectFilters.label) return false;
        if (!query) return true;
        return [
          branch.name,
          branch.headSha,
          branch.projectId ?? '',
          branch.projectFolder ?? '',
          branch.projectLabel ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      }) ?? []
    );
  }, [branchProjection, projectFilters, workPackageQuery]);

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
    if (statusFilter !== 'active' && statusFilter !== 'pending') return filteredLiveItems;
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

  const visibleIntegrations = useMemo(
    () =>
      ROADMAP_DASHBOARD_SNAPSHOT.integrationLedger.filter((item) =>
        matchesRoadmapProjectFilters(item.owner, projectFilters, PROJECT_ROUTES),
      ),
    [projectFilters],
  );

  const visibleQueuedItems = liveWork.queuedItems;

  const executionLanes = useMemo(
    () => buildRoadmapExecutionLanes(visibleWorkPackages, visibleQueuedItems, PROJECT_ROUTES),
    [visibleQueuedItems, visibleWorkPackages],
  );

  const metrics = useMemo(() => {
    const owners = new Set(filteredLiveItems.map((item) => item.projectId)).size;
    const legacyDrift = visibleIntegrations.filter((item) => item.state === 'legacy-drift').length;
    return {
      active: visibleWorkPackages.length,
      workerCandidates: filteredLiveItems.filter((item) => item.workerCandidate).length,
      owners,
      integrations: visibleIntegrations.length,
      legacyDrift,
      parallelLanes: executionLanes.length,
    };
  }, [executionLanes, filteredLiveItems, visibleIntegrations, visibleWorkPackages]);

  const liveCurrentMainSha = liveProjection?.repository.currentMainSha ?? null;
  const branchCurrentMainSha = branchProjection?.repository.currentMainSha ?? null;
  const branchEvidenceAligned =
    Boolean(liveCurrentMainSha) &&
    Boolean(branchCurrentMainSha) &&
    liveCurrentMainSha === branchCurrentMainSha &&
    branchProjection?.stale === false;
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
          Owner-Timeline im Landingpage-Branding aus <code>/api/roadmap/state</code>.
          Standard sind alle Work-States von Queued bis Active, ohne Kalenderdaten.
          <code> /api/roadmap/branches</code> bleibt separate Evidence:
          Live zeigt ausschließlich aktuelle Branches mit <code>behind=0</code> und <code>ahead&gt;0</code>.
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
        <section aria-label="Roadmap-Live-Signale" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Korrelations-Basis</p>
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
                    {productionAligned ? 'Baseline identisch' : 'Live Runtime separat'} · {production.branch ?? 'branch n/a'}
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
                : 'live'
              : liveRoadmap.status
          }
          className="landing-page-panel"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
                Repository Work-State
              </p>
              <h2 className="mt-1 text-lg font-black text-white">
                {liveRoadmap.status === 'loading'
                  ? 'Live Work-State wird geladen'
                  : liveRoadmap.status === 'unavailable'
                    ? 'Live Work-State nicht verfügbar'
                    : liveRoadmap.projection.stale
                      ? 'STALE · letzte bestätigte Repository-Generation'
                      : 'LIVE · exakter CURRENT_MAIN Work-State'}
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
                {liveRoadmap.projection.stale ? 'STALE' : 'LIVE'}
              </span>
            ) : null}
          </div>

          {liveRoadmap.status === 'available' ? (
            <div className="mt-3 space-y-1 text-xs leading-5 text-text-secondary">
              <p>
                Generation <code>{shortSha(liveRoadmap.projection.repository.currentMainSha)}</code>
                {' · '}beobachtet {liveRoadmap.projection.observedAt}
                {' · '}{liveRoadmap.projection.sources.length} Quellen
              </p>
              {liveRoadmap.projection.stale ? (
                <p className="font-semibold text-score-warning">
                  Cached Evidence ist als STALE markiert und wird nicht als aktueller CURRENT_MAIN behauptet.
                </p>
              ) : null}
              {liveRoadmap.projection.warnings.length > 0 ? (
                <p>{liveRoadmap.projection.warnings.length} Live-State-Warnung(en) · Details bleiben fail-closed.</p>
              ) : null}
            </div>
          ) : liveRoadmap.status === 'unavailable' ? (
            <p className="mt-3 text-xs leading-5 text-score-warning">
              Aktive Arbeit, Queue und Worker-Lanes werden fail-closed ausgeblendet. Fehler: {liveRoadmap.error}
            </p>
          ) : (
            <p className="mt-3 text-xs leading-5 text-text-secondary">
              Bis zum erfolgreichen Readback werden keine statischen Work-Package-Daten als aktuell dargestellt.
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Roadmap Status">
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
                    : 'Live Worker-State nicht verfügbar'}
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

        <section aria-labelledby="roadmap-phases-title" className="landing-page-panel landing-page-panel--elevated">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary">
                Projekt-Roadmap
              </p>
              <h2 id="roadmap-phases-title" className="mt-1 text-xl font-black text-white sm:text-2xl">
                Von Foundation bis Skalierung
              </h2>
            </div>
            <p className="max-w-xl text-xs leading-5 text-white/50">
              Phasen sind eine visuelle Portfolio-Projektion. SEC wird bereits aus der zentralen Live-Roadmap geführt;
              andere Owner behalten ihre kanonischen Projektquellen bis zur owner-korrekten Migration.
            </p>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-5">
            {PHASES.map((phase, index) => (
              <div key={phase.id} className="relative rounded-xl border border-white/8 bg-black/20 p-4">
                <div className={`mb-4 h-1 w-full rounded-full ${phase.line}`} />
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
                  Phase {index + 1}
                </p>
                <h3 className={`mt-1 text-sm font-black ${phase.accent}`}>{phase.title}</h3>
                <p className="mt-2 text-xs font-bold text-white/75">{phase.status}</p>
                <p className="mt-3 text-xs leading-5 text-text-secondary">{phase.detail}</p>
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
              {statusFilter === 'live'
                ? liveBranches.status === 'available'
                  ? `${visibleLiveBranches.length} Branches · behind 0 · ${branchEvidenceAligned ? 'CURRENT_MAIN' : 'STALE / DRIFT'} ${shortSha(branchCurrentMainSha)}`
                  : 'Live Branch-Evidence nicht verfügbar'
                : liveRoadmap.status === 'available'
                  ? `${metrics.owners} beteiligte Owner · ${visibleTimelineItems.length} sichtbar · Filter ${statusFilter ? statusFilter.toUpperCase() : 'ALLE'} · ${liveRoadmap.projection.stale ? 'STALE' : 'CURRENT_MAIN'} ${shortSha(liveCurrentMainSha)}`
                  : 'Live Work-State nicht verfügbar'}
            </p>
          </div>
          <p className="mb-4 max-w-3xl text-xs leading-5 text-white/50">
            Keine Kalenderachse. Die Matrix folgt dem Landingpage-Profil: Navy, Gold und Glasflächen.
            Auf Smartphones werden Arbeitspakete als Owner-Karten gestapelt; die breite Zustandsmatrix
            bleibt nur für Desktop. „Live“ bezeichnet ausschließlich Branch-Evidence mit behind=0 und ist nicht identisch mit ACTIVE.
          </p>

          {liveRoadmap.status === 'loading' ? (
            <LandingPanel className="border-white/8 bg-surface/65 p-4 text-sm text-text-secondary">
              Live Work-State wird geladen…
            </LandingPanel>
          ) : liveRoadmap.status === 'unavailable' ? (
            <LandingPanel className="border-score-warning/20 bg-score-warning/5 p-4 text-sm text-score-warning">
              Live Work-State nicht verfügbar — aktive Arbeit wird fail-closed ausgeblendet.
            </LandingPanel>
          ) : (
            <>
              {visibleTimelineItems.length === 0 ? (
                <LandingPanel className="border-white/8 bg-surface/65 p-4 text-sm text-text-secondary">
                  Keine Arbeitspakete im aktuellen Status- und Project-Filter.
                </LandingPanel>
              ) : (
                <>
                  <OwnerStateMobileCards
                    items={visibleTimelineItems}
                    selectedId={selectedLiveItem?.id ?? null}
                    onSelect={(id) => setSelectedItemId((current) => (current === id ? null : id))}
                  />
                  <div className="hidden lg:block">
                    <OwnerStateTimeline
                      items={visibleTimelineItems}
                      selectedId={selectedLiveItem?.id ?? null}
                      onSelect={(id) => setSelectedItemId((current) => (current === id ? null : id))}
                    />
                  </div>
                  {selectedLiveItem ? <LiveItemDetail item={selectedLiveItem} /> : (
                    <p className="mt-3 text-xs text-slate-400">Ein Paket wählen, um Quelle, Gate und Owner-Grenze zu lesen.</p>
                  )}
                </>
              )}
              {statusFilter === 'live' ? (
            liveBranches.status === 'loading' ? (
              <LandingPanel className="border-white/8 bg-surface/65 p-4 text-sm text-text-secondary">
                Live Branch-Evidence wird geladen…
              </LandingPanel>
            ) : liveBranches.status === 'unavailable' ? (
              <LandingPanel className="border-score-warning/25 bg-score-warning/5 p-4">
                <p className="text-sm font-bold text-score-warning">Live Branch-Evidence nicht verfügbar.</p>
                <p className="mt-2 text-xs leading-5 text-white/55">
                  Der Live-Filter bleibt fail-closed. Es werden keine Branch-Zustände aus lokalen oder statischen Daten erfunden.
                </p>
              </LandingPanel>
            ) : !branchEvidenceAligned ? (
              <LandingPanel className="border-[#F87171]/25 bg-[#F87171]/5 p-4">
                <p className="text-sm font-bold text-[#F87171]">Branch-Evidence und CURRENT_MAIN sind nicht korreliert.</p>
                <p className="mt-2 text-xs leading-5 text-white/55">
                  Work-State {shortSha(liveCurrentMainSha)} · Branch-Evidence {shortSha(branchCurrentMainSha)}.
                  Bis beide Projektionen denselben Main-SHA belegen, wird Live fail-closed ausgeblendet.
                </p>
              </LandingPanel>
            ) : visibleLiveBranches.length === 0 ? (
              <LandingPanel className="border-white/8 bg-surface/65 p-4 text-sm text-text-secondary">
                Keine aktuellen Branches mit behind=0 und ahead&gt;0 im gewählten Filter.
              </LandingPanel>
            ) : (
              <LiveBranchCards branches={visibleLiveBranches} />
            )
              ) : null}
            </>
          )}
        </section>

        <section aria-labelledby="integration-ledger-title" className="landing-page-panel landing-page-panel--elevated">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary">
                Production / SEO Integration Ledger
              </p>
              <h2 id="integration-ledger-title" className="mt-1 text-xl font-black text-white sm:text-2xl">
                Integriert, provider-gated und Legacy-Drift
              </h2>
            </div>
            <p className="max-w-xl text-xs leading-5 text-white/50">
              {metrics.integrations} korrelierte Integrationen · {metrics.legacyDrift} Legacy-Drift. Der Live-Deployment-Stand
              kommt separat aus /healthz; Repository-Merge wird nicht automatisch als Production-PASS gewertet.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {visibleIntegrations.map((item) => (
              <IntegrationCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/8 py-4 text-[11px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>Branding: LandingPageTemplate · BrandLogo · canonical landingPage token profile.</p>
          <p className="font-mono">
            Korrelation {liveRoadmap.status === 'available' ? shortSha(liveCurrentMainSha) : 'nicht verfügbar'} · Production bleibt separate Live-Evidence.
          </p>
        </footer>
    </LandingPageTemplate>
  );
}

export default RoadmapDashboard;

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  CircleDot,
  Clock3,
  ExternalLink,
  GitBranch,
  GitPullRequest,
  Layers3,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import { CapitalAiLogo } from '../../../shared/branding/CapitalAiLogo';
import { Card } from '../../../shared/ui/Card';
import {
  ROADMAP_DASHBOARD_SNAPSHOT,
  type RoadmapIntegrationItem,
  type RoadmapIntegrationState,
  type RoadmapQueueState,
  type RoadmapWorkPackage,
  type RoadmapWorkState,
} from './roadmapSnapshot';

type ProductionIdentityState =
  | { status: 'loading'; commitSha: null; branch: null; version: null }
  | { status: 'available'; commitSha: string | null; branch: string | null; version: string | null }
  | { status: 'unavailable'; commitSha: null; branch: null; version: null };

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

function statusIcon(state: RoadmapWorkState) {
  if (state === 'in-flight') return <GitPullRequest className="h-4 w-4" aria-hidden="true" />;
  if (state === 'evidence-gate') return <ShieldCheck className="h-4 w-4" aria-hidden="true" />;
  if (state === 'in-progress') return <Activity className="h-4 w-4" aria-hidden="true" />;
  return <CircleDot className="h-4 w-4" aria-hidden="true" />;
}

function IntegrationCard({ item }: { item: RoadmapIntegrationItem }) {
  return (
    <Card className="flex h-full flex-col gap-3 border-white/8 bg-surface/65 p-4">
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
      <p className="mt-auto break-all border-t border-white/8 pt-3 font-mono text-[10px] leading-5 text-white/35">
        {item.source}
      </p>
    </Card>
  );
}

function WorkPackageCard({ item }: { item: RoadmapWorkPackage }) {
  return (
    <Card elevated className="flex h-full flex-col gap-4 border-white/8 bg-surface/75 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            {item.owner} · {item.phase}
          </p>
          <h3 className="mt-1 break-words text-base font-extrabold text-white">{item.id}</h3>
          <p className="mt-1 text-sm font-semibold text-white/75">{item.title}</p>
        </div>
        <span
          className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${STATE_STYLE[item.state]}`}
        >
          {statusIcon(item.state)}
          <span className="break-words">{item.stateLabel}</span>
        </span>
      </div>

      <p className="text-sm leading-6 text-text-secondary">{item.detail}</p>

      <div className="mt-auto space-y-2 border-t border-white/8 pt-3">
        <p className="text-[11px] leading-5 text-white/55">
          <span className="font-bold text-white/70">Owner-Boundary:</span> {item.relationship}
        </p>
        <p className="break-all font-mono text-[10px] leading-5 text-white/40">{item.source}</p>
        {item.prNumber ? (
          <a
            href={`https://github.com/capital-ai-online/Finance/pull/${item.prNumber}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-brand-primary transition hover:text-aif-gold-light"
          >
            PR #{item.prNumber} öffnen
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </Card>
  );
}

export function RoadmapDashboard() {
  const [production, setProduction] = useState<ProductionIdentityState>({
    status: 'loading',
    commitSha: null,
    branch: null,
    version: null,
  });

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

  const metrics = useMemo(() => {
    const prBacked = ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.filter((item) => item.prNumber).length;
    const owners = new Set(ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.map((item) => item.owner)).size;
    const legacyDrift = ROADMAP_DASHBOARD_SNAPSHOT.integrationLedger.filter(
      (item) => item.state === 'legacy-drift',
    ).length;
    return {
      active: ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.length,
      prBacked,
      owners,
      integrations: ROADMAP_DASHBOARD_SNAPSHOT.integrationLedger.length,
      legacyDrift,
    };
  }, []);

  const productionAligned =
    production.status === 'available' &&
    Boolean(production.commitSha) &&
    production.commitSha === ROADMAP_DASHBOARD_SNAPSHOT.currentMainSha;

  return (
    <main className="app-shell-frame min-h-screen text-foreground">
      <div className="mx-auto w-full max-w-[1680px] space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="ui-panel ui-panel--elevated overflow-hidden p-0">
          <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,color-mix(in_srgb,var(--color-brand-primary)_13%,transparent),transparent_34rem)]" />
            <div className="relative">
              <CapitalAiLogo size={82} showText={false} />
            </div>
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-brand-primary/30 bg-brand-primary/10 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-brand-primary">
                  Roadmap Live Dashboard
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
                  Derived · Non-authorizing
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                CAPITAL-AI Roadmap
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary sm:text-base">
                Aktive Arbeitspakete, Owner-Grenzen und Runtime-Evidence auf Basis des korrelierten
                CURRENT_MAIN-Snapshots. Produktivstatus wird separat über <code>/healthz</code> gelesen.
              </p>
            </div>
            <div className="relative flex flex-wrap gap-2 lg:justify-end">
              <a href="/" className="ui-button-secondary inline-flex items-center gap-2 px-4 py-2 text-xs font-bold">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Landingpage
              </a>
              <a href="/vocabulary" className="ui-button-secondary inline-flex items-center gap-2 px-4 py-2 text-xs font-bold">
                <Layers3 className="h-4 w-4" aria-hidden="true" />
                Vocabulary
              </a>
            </div>
          </div>
        </header>

        <section aria-label="Roadmap-Live-Signale" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/8 bg-surface/70 p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-brand-success" aria-hidden="true" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Aktive Pakete</p>
                <p className="mt-1 text-2xl font-black text-white">{metrics.active}</p>
              </div>
            </div>
          </Card>
          <Card className="border-white/8 bg-surface/70 p-4">
            <div className="flex items-center gap-3">
              <GitPullRequest className="h-5 w-5 text-status-info" aria-hidden="true" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Offene PRs</p>
                <p className="mt-1 text-2xl font-black text-white">{metrics.prBacked}</p>
              </div>
            </div>
          </Card>
          <Card className="border-white/8 bg-surface/70 p-4">
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-brand-primary" aria-hidden="true" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Korrelations-Basis</p>
                <p className="mt-1 font-mono text-sm font-black text-white">
                  {shortSha(ROADMAP_DASHBOARD_SNAPSHOT.currentMainSha)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="border-white/8 bg-surface/70 p-4">
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
          </Card>
        </section>

        <section aria-labelledby="roadmap-phases-title" className="ui-panel ui-panel--elevated">
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
              Phasen sind eine visuelle Portfolio-Projektion. Ausführbare Arbeit bleibt in den owner-korrekten
              Projekt-Roadmaps und Work Packages.
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

        <section aria-labelledby="active-work-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary">
                Current Work Graph
              </p>
              <h2 id="active-work-title" className="mt-1 text-xl font-black text-white sm:text-2xl">
                Aktive bearbeitete Arbeitspakete
              </h2>
            </div>
            <p className="text-xs text-white/45">
              {metrics.owners} beteiligte Owner · Snapshot {ROADMAP_DASHBOARD_SNAPSHOT.correlatedDate}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.map((item) => (
              <WorkPackageCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section aria-labelledby="integration-ledger-title" className="ui-panel ui-panel--elevated">
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
            {ROADMAP_DASHBOARD_SNAPSHOT.integrationLedger.map((item) => (
              <IntegrationCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section aria-labelledby="queue-title" className="ui-panel">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-brand-primary" aria-hidden="true" />
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
                Dependency Queue
              </p>
              <h2 id="queue-title" className="text-lg font-black text-white">
                Ready / Held / Queued
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {ROADMAP_DASHBOARD_SNAPSHOT.queuedItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/8 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">{item.owner}</p>
                    <h3 className="mt-1 text-sm font-black text-white">{item.id}</h3>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${QUEUE_STYLE[item.state]}`}>
                    {item.stateLabel}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-text-secondary">{item.gate}</p>
                <p className="mt-3 break-all font-mono text-[10px] text-white/35">{item.source}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/8 py-4 text-[11px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>Branding: brandmark.json · design-tokens.json · CapitalAiLogo · ui-panel/Card contracts.</p>
          <p className="font-mono">
            Korrelation {shortSha(ROADMAP_DASHBOARD_SNAPSHOT.correlatedMainSha)} · Production bleibt separate Live-Evidence.
          </p>
        </footer>
      </div>
    </main>
  );
}

export default RoadmapDashboard;

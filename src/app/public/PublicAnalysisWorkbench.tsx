import React, { Suspense, lazy, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  ChevronRight,
  Compass,
  Gauge,
  LockKeyhole,
  Menu,
  Orbit,
  Percent,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';

const PublicEnterpriseScorer = lazy(() =>
  import('../../features/crypto/ui/public').then((module) => ({
    default: module.PublicCryptoScoringPreview,
  })),
);
const RankingBoard = lazy(() =>
  import('../../features/screening/ui/RankingBoard').then((module) => ({
    default: module.RankingBoard,
  })),
);
const BuffetValueCheck = lazy(() =>
  import('../../features/stocks/ui').then((module) => ({ default: module.BuffetValueCheck })),
);
const MarketScreener = lazy(() =>
  import('../../features/screening/ui').then((module) => ({ default: module.MarketScreener })),
);
const RawMaterialsDashboard = lazy(() =>
  import('../../features/commodities/ui').then((module) => ({
    default: module.RawMaterialsDashboard,
  })),
);

type PublicToolId =
  | 'enterprise-scorer'
  | 'ranking-board'
  | 'buffett-value'
  | 'market-screener'
  | 'raw-materials'
  | 'asset-universe'
  | 'charts'
  | 'price-alerts'
  | 'backtest'
  | 'sentiment'
  | 'defi'
  | 'risk-assessment';

type ToolAvailability = 'public' | 'server-gated' | 'login-required' | 'disabled';

interface ToolDefinition {
  id: PublicToolId;
  label: string;
  description: string;
  availability: ToolAvailability;
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>;
}

interface ToolGroup {
  label: string;
  tools: ToolDefinition[];
}

const TOOL_GROUPS: ToolGroup[] = [
  {
    label: 'Bewertung & Scoring',
    tools: [
      {
        id: 'enterprise-scorer',
        label: 'Enterprise Scorer',
        description: 'Kanonisches Crypto-Scoring mit Evidence- und Market-Data-Projektion.',
        availability: 'public',
        icon: Gauge,
      },
      {
        id: 'ranking-board',
        label: 'Universe TOP Rankings',
        description: 'Top/Worst-Rankings aus verifizierten kanonischen Scores.',
        availability: 'public',
        icon: Award,
      },
      {
        id: 'buffett-value',
        label: 'Buffett Value Check',
        description: 'Graham-/DCF-Bewertung; Zugriff wird ausschließlich serverseitig autorisiert.',
        availability: 'server-gated',
        icon: Percent,
      },
      {
        id: 'raw-materials',
        label: 'Rohstoff-Bewertung',
        description: 'Kanonische Rohstoffanalyse mit sichtbarer Evidence- und Score-Semantik.',
        availability: 'public',
        icon: Orbit,
      },
    ],
  },
  {
    label: 'Screening & Analyse',
    tools: [
      {
        id: 'market-screener',
        label: 'Profi Markt-Screener',
        description: 'Verifiziertes Multi-Asset-Screening ohne lokal erfundene Scores.',
        availability: 'public',
        icon: SlidersHorizontal,
      },
      {
        id: 'asset-universe',
        label: 'Multi-Asset Universum',
        description: 'Historische Cockpit-Fläche; derzeit nicht als öffentliche Evidence-Projektion freigegeben.',
        availability: 'login-required',
        icon: Compass,
      },
      {
        id: 'charts',
        label: 'Ad-Hoc Charts',
        description: 'Historische Chart-Fläche; öffentliche Freigabe bleibt wegen Fallback-/Evidence-Semantik gesperrt.',
        availability: 'login-required',
        icon: BarChart3,
      },
      {
        id: 'price-alerts',
        label: 'Preis-Alarme',
        description: 'Historische Alert-Fläche mit sitzungsgebundenem Alert-State; bleibt bis zur separaten Public-Session-Prüfung loginpflichtig.',
        availability: 'login-required',
        icon: Bell,
      },
      {
        id: 'sentiment',
        label: 'AI Markt-Sentiment',
        description: 'Historische Sentiment-Sandbox enthält Preset-/Simulationsdaten und bleibt deshalb öffentlich gesperrt.',
        availability: 'login-required',
        icon: Gauge,
      },
      {
        id: 'defi',
        label: 'DeFi Orchestration',
        description: 'Research-Surface; bleibt bis zur separaten Public-Contract-Prüfung im geschützten Dashboard.',
        availability: 'login-required',
        icon: Orbit,
      },
    ],
  },
  {
    label: 'Geschützte Alt-Tools',
    tools: [
      {
        id: 'backtest',
        label: 'Backtest Engine',
        description: 'Pro-/Enterprise-Funktion gemäß zentralem Subscription-Entitlement.',
        availability: 'login-required',
        icon: BarChart3,
      },
      {
        id: 'risk-assessment',
        label: 'Value-at-Risk Assessment',
        description: 'Im aktuellen Dashboard ausdrücklich deaktiviert; keine stille Reaktivierung auf der Public Route.',
        availability: 'disabled',
        icon: AlertTriangle,
      },
    ],
  },
];

const TOOL_BY_ID = new Map(
  TOOL_GROUPS.flatMap((group) => group.tools).map((tool) => [tool.id, tool] as const),
);

function availabilityLabel(availability: ToolAvailability): string {
  switch (availability) {
    case 'public':
      return 'Öffentlich';
    case 'server-gated':
      return 'Server-Gate';
    case 'login-required':
      return 'Login';
    case 'disabled':
      return 'Deaktiviert';
  }
}

function WorkbenchLoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border bg-surface/30 px-6 text-center" role="status" aria-live="polite">
      <div className="max-w-md space-y-3">
        <div className="mx-auto h-8 w-8 animate-pulse rounded-full border border-brand-primary/40 bg-brand-primary/10" />
        <p className="text-sm font-bold text-text-primary">Bewertungstool wird geladen</p>
        <p className="text-xs leading-relaxed text-text-secondary">
          Nur das ausgewählte Tool wird nachgeladen. Die Landingpage selbst bleibt vom jeweiligen Analyse-Bundle getrennt.
        </p>
      </div>
    </div>
  );
}

class PublicToolErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Public analysis tool failed to render:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-status-reject/30 bg-status-reject/5 px-6 text-center">
          <AlertTriangle size={22} className="text-status-reject" />
          <p className="text-sm font-black text-text-primary">Dieses Bewertungstool konnte nicht gestartet werden.</p>
          <p className="max-w-xl text-xs leading-relaxed text-text-secondary">
            Das Sideboard und die übrige Landingpage bleiben verfügbar. Es werden keine Ersatzwerte oder synthetischen Scores erzeugt.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

function ProtectedToolNotice({ tool }: { tool: ToolDefinition }) {
  const disabled = tool.availability === 'disabled';
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-surface/30 px-6 text-center">
      {disabled ? (
        <AlertTriangle size={24} className="text-status-warning" />
      ) : (
        <LockKeyhole size={24} className="text-brand-primary" />
      )}
      <div className="max-w-2xl space-y-2">
        <h3 className="text-lg font-black text-text-primary">{tool.label}</h3>
        <p className="text-sm leading-relaxed text-text-secondary">{tool.description}</p>
      </div>
      {!disabled && (
        <a
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-black text-background transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          Anmelden und Tool öffnen
        </a>
      )}
    </div>
  );
}

export function PublicAnalysisWorkbench() {
  const [activeTool, setActiveTool] = useState<PublicToolId>('enterprise-scorer');
  // Mobile recovery: the historical cockpit exposed the tool navigation immediately.
  // Keep it expanded on first render so touch users never receive a lone, inert-looking label.
  const [sideboardOpen, setSideboardOpen] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [timeframe, setTimeframe] = useState('1 tag');

  const activeDefinition = TOOL_BY_ID.get(activeTool) ?? TOOL_BY_ID.get('enterprise-scorer')!;

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'enterprise-scorer':
        return (
          <PublicEnterpriseScorer
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            timeframe={timeframe}
            onChangeTimeframe={setTimeframe}
            subscriptionTier="Free"
          />
        );
      case 'ranking-board':
        return (
          <RankingBoard
            onSelectAsset={(symbol) => {
              setSelectedSymbol(symbol);
              setActiveTool('enterprise-scorer');
            }}
          />
        );
      case 'buffett-value':
        return <BuffetValueCheck selectedSymbol={selectedSymbol} />;
      case 'market-screener':
        return (
          <MarketScreener
            selectedSymbol={selectedSymbol}
            onSelectSymbol={(symbol) => {
              setSelectedSymbol(symbol);
              setActiveTool('enterprise-scorer');
            }}
          />
        );
      case 'raw-materials':
        return <RawMaterialsDashboard />;
      default:
        return <ProtectedToolNotice tool={activeDefinition} />;
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface/40 px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setSideboardOpen((open) => !open)}
          className="ui-hit inline-flex min-h-11 min-w-11 items-center gap-2 rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-text-primary transition hover:bg-brand-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-expanded={sideboardOpen}
          aria-controls="public-analysis-sideboard"
          aria-label={sideboardOpen ? 'Analysetools einklappen' : 'Analysetools aufklappen'}
        >
          {sideboardOpen ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
          <span>{sideboardOpen ? 'Analysetools schließen' : 'Analysetools öffnen'}</span>
        </button>
        <span className="truncate text-xs font-bold text-brand-primary">{activeDefinition.label}</span>
      </div>

      <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside
          id="public-analysis-sideboard"
          aria-label="Öffentliche Bewertungstools"
          className={`${sideboardOpen ? 'block' : 'hidden'} border-b border-border bg-surface/25 p-4 lg:block lg:border-b-0 lg:border-r`}
        >
          <div className="mb-5 space-y-2 rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-4">
            <div className="flex items-center gap-2 text-brand-primary">
              <ShieldCheck size={16} aria-hidden="true" />
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em]">Public Analysis Sideboard</span>
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">
              Cockpit-Navigation mit Enterprise Scorer und allen aktuell freigegebenen Analyseflächen. Server-Gates, Login-Pflichten und aktuelle Deaktivierungen bleiben wirksam.
            </p>
          </div>

          <div className="space-y-5">
            {TOOL_GROUPS.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <h3 className="mb-2 px-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-text-secondary">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.tools.map((tool) => {
                    const Icon = tool.icon;
                    const selected = activeTool === tool.id;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          setActiveTool(tool.id);
                          setSideboardOpen(false);
                        }}
                        aria-current={selected ? 'page' : undefined}
                        className={`ui-hit flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                          selected
                            ? 'border-brand-primary/35 bg-brand-primary/10 text-text-primary'
                            : 'border-transparent text-text-secondary hover:border-border hover:bg-surface/60 hover:text-text-primary'
                        }`}
                      >
                        <Icon size={16} className={selected ? 'text-brand-primary' : 'text-text-secondary'} aria-hidden={true} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold">{tool.label}</span>
                          <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-text-secondary">
                            {availabilityLabel(tool.availability)}
                          </span>
                        </span>
                        <ChevronRight size={14} className="shrink-0 text-text-secondary" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </aside>

        <section className="min-w-0 p-4 sm:p-6" aria-labelledby="public-active-tool-title">
          <header className="mb-5 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
                Bewertungstool · {availabilityLabel(activeDefinition.availability)}
              </p>
              <h2 id="public-active-tool-title" className="mt-1 text-2xl font-black text-text-primary">
                {activeDefinition.label}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{activeDefinition.description}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/50 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-text-secondary">
              Symbol: <span className="font-black text-text-primary">{selectedSymbol}</span>
            </div>
          </header>

          <PublicToolErrorBoundary key={activeTool}>
            <Suspense fallback={<WorkbenchLoadingState />}>{renderActiveTool()}</Suspense>
          </PublicToolErrorBoundary>
        </section>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Beaker,
  Boxes,
  Database,
  GitBranch,
  Gauge,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  ANALYSIS_CONNECTION_CONTRACTS,
  DATA_CONNECTION_CONCEPTS,
  type AnalysisConnectionContract,
  type AnalysisContractStatus,
  type DataConnectionConceptName,
} from '../../../platform/Scoring/AnalysisConnectionRegistry';
import {
  architectureFitScore,
  benchmarkWorkflow,
  buildDefaultWorkflow,
  validateWorkflow,
  type WorkflowBenchmarkResult,
} from '../model/dataCalculatorModel';

const WORKFLOW_NODE_LIBRARY = [
  'Provider Adapter',
  'ProviderRegistry',
  'ProviderMatrix',
  'MarketDataGateway',
  'CircuitBreaker / RateLimitBudget / RequestCoalescer',
  'MarketTickGate / DataQualityService',
  'MarketDataCache / Fanout',
  'Evidence Identity / Provenance / Freshness',
  'Data Quality Gate',
  'ValidatedDataInput',
  'ValidatedFeatureInput',
  'ScoringModelRegistry',
  'ScoringDispatcher',
  'CanonicalScoreResult',
  'CrossAssetRanking',
  'Decision Support',
  'UI',
] as const;

type ConceptFilter = 'ALL' | DataConnectionConceptName;
type AssetFilter = 'ALL' | 'crypto' | 'stock' | 'forex' | 'index' | 'commodity' | 'bond' | 'portfolio' | 'multi-asset';

function statusClasses(status: AnalysisContractStatus): string {
  switch (status) {
    case 'CANONICAL':
      return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300';
    case 'COMPATIBILITY_ONLY':
      return 'border-cyan-400/25 bg-cyan-400/10 text-cyan-300';
    case 'RESEARCH_ONLY':
      return 'border-violet-400/25 bg-violet-400/10 text-violet-300';
    case 'CONTEXT_ONLY':
      return 'border-sky-400/25 bg-sky-400/10 text-sky-300';
    case 'BLOCKED':
      return 'border-orange-400/25 bg-orange-400/10 text-orange-300';
    case 'DISABLED':
      return 'border-rose-400/25 bg-rose-400/10 text-rose-300';
  }
}

function conceptClasses(concept: DataConnectionConceptName): string {
  switch (concept) {
    case 'Tier 1-4':
      return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200';
    case 'Data Authority & Evidence':
      return 'border-amber-300/30 bg-amber-300/10 text-amber-200';
    case 'Hybrid':
      return 'border-violet-400/30 bg-violet-400/10 text-violet-200';
    case 'Individual':
      return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  }
}

function compactStatus(status: AnalysisContractStatus): string {
  if (status === 'COMPATIBILITY_ONLY') return 'Compatibility';
  if (status === 'RESEARCH_ONLY') return 'Research';
  if (status === 'CONTEXT_ONLY') return 'Context';
  if (status === 'BLOCKED') return 'Blocked';
  if (status === 'DISABLED') return 'Disabled';
  return 'Canonical';
}

function BenchmarkCard({ benchmark }: { benchmark: WorkflowBenchmarkResult | null }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Architecture Fit</p>
        <p className="mt-2 text-3xl font-black text-amber-300">{benchmark ? benchmark.architectureFitScore : '—'}<span className="text-sm text-white/35"> / 100</span></p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Local Validation</p>
        <p className="mt-2 text-3xl font-black text-white">{benchmark ? benchmark.localValidationMs.toFixed(3) : '—'}<span className="text-sm text-white/35"> ms</span></p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Checks</p>
        <p className="mt-2 text-3xl font-black text-white">{benchmark ? benchmark.passedChecks : '—'}<span className="text-sm text-white/35"> / {benchmark?.totalChecks ?? 5}</span></p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Provider-Latenz</p>
        <p className="mt-2 text-lg font-black text-white/70">Nicht gemessen</p>
        <p className="mt-1 text-[10px] leading-relaxed text-white/35">Kein synthetischer Netzwerk-Benchmark.</p>
      </div>
    </div>
  );
}

export default function DataCalculatorWorkbench() {
  const firstContract = ANALYSIS_CONNECTION_CONTRACTS[0];
  const [selectedId, setSelectedId] = useState(firstContract.id);
  const [conceptFilter, setConceptFilter] = useState<ConceptFilter>('ALL');
  const [assetFilter, setAssetFilter] = useState<AssetFilter>('ALL');
  const [steps, setSteps] = useState<string[]>(() => buildDefaultWorkflow(firstContract));
  const [nodeToAdd, setNodeToAdd] = useState<string>(WORKFLOW_NODE_LIBRARY[0]);
  const [benchmark, setBenchmark] = useState<WorkflowBenchmarkResult | null>(null);

  const selectedContract = useMemo(
    () => ANALYSIS_CONNECTION_CONTRACTS.find((contract) => contract.id === selectedId) ?? firstContract,
    [selectedId, firstContract],
  );

  const visibleContracts = useMemo(
    () => ANALYSIS_CONNECTION_CONTRACTS.filter((contract) =>
      (conceptFilter === 'ALL' || contract.conceptName === conceptFilter)
      && (assetFilter === 'ALL' || contract.assetClasses.includes(assetFilter))),
    [conceptFilter, assetFilter],
  );

  const checks = useMemo(
    () => validateWorkflow(selectedContract, steps),
    [selectedContract, steps],
  );

  const currentArchitectureFit = useMemo(
    () => architectureFitScore(selectedContract, checks),
    [selectedContract, checks],
  );

  const defaultArchitectureFit = useMemo(() => {
    const defaultSteps = buildDefaultWorkflow(selectedContract);
    return architectureFitScore(selectedContract, validateWorkflow(selectedContract, defaultSteps));
  }, [selectedContract]);

  const selectContract = (contract: AnalysisConnectionContract) => {
    setSelectedId(contract.id);
    setSteps(buildDefaultWorkflow(contract));
    setBenchmark(null);
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next);
    setBenchmark(null);
  };

  const removeStep = (index: number) => {
    setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setBenchmark(null);
  };

  const resetWorkflow = () => {
    setSteps(buildDefaultWorkflow(selectedContract));
    setBenchmark(null);
  };

  const runBenchmark = () => {
    setBenchmark(benchmarkWorkflow(selectedContract, steps, 2_000));
  };

  return (
    <div className="min-h-screen bg-[#02050e] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 18% 8%, rgba(141,38,255,.15), transparent 34%), radial-gradient(circle at 80% 22%, rgba(249,191,33,.10), transparent 30%), radial-gradient(circle at 45% 100%, rgba(68,222,136,.08), transparent 34%)',
        }}
      />

      <main className="relative z-10 mx-auto max-w-[1680px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-3xl border border-white/10 bg-[#070b19]/90 shadow-2xl backdrop-blur-xl">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.25fr_.75fr] lg:p-9">
            <div>
              <a
                href="/"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft size={15} aria-hidden="true" />
                Landingpage
              </a>
              <p className="mt-7 font-mono text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">
                CAPITAL-AI / FINTECH / WORKFLOW LAB
              </p>
              <h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">
                Data Calculator
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 sm:text-base">
                Analyse- und Scoring-Anbindungen als versionierbare Workflows zusammensetzen, gegen fünf
                Architektur-Gates prüfen und lokal benchmarken — ohne eine zweite Scoring- oder Provider-Authority zu erzeugen.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  Evidence first
                </span>
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-200">
                  Contract driven
                </span>
                <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-violet-300">
                  No synthetic provider latency
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 self-end">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <Database size={18} className="text-amber-300" aria-hidden="true" />
                <p className="mt-4 text-3xl font-black">{ANALYSIS_CONNECTION_CONTRACTS.length}</p>
                <p className="mt-1 text-xs text-white/40">Connection Contracts</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <Boxes size={18} className="text-violet-300" aria-hidden="true" />
                <p className="mt-4 text-3xl font-black">{DATA_CONNECTION_CONCEPTS.length}</p>
                <p className="mt-1 text-xs text-white/40">Architekturprofile</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <ShieldCheck size={18} className="text-emerald-300" aria-hidden="true" />
                <p className="mt-4 text-3xl font-black">5</p>
                <p className="mt-1 text-xs text-white/40">Validation Gates</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <Gauge size={18} className="text-cyan-300" aria-hidden="true" />
                <p className="mt-4 text-3xl font-black">Local</p>
                <p className="mt-1 text-xs text-white/40">Benchmark Scope</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {DATA_CONNECTION_CONCEPTS.map((concept) => (
            <button
              key={concept.name}
              type="button"
              onClick={() => setConceptFilter((current) => current === concept.name ? 'ALL' : concept.name)}
              className={'rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ' + conceptClasses(concept.name) + (conceptFilter === concept.name ? ' ring-2 ring-white/20' : '')}
            >
              <p className="text-xs font-black uppercase tracking-[0.12em]">{concept.name}</p>
              <p className="mt-2 text-xs leading-5 text-white/50">{concept.summary}</p>
              <p className="mt-3 text-[10px] font-bold text-white/35">{concept.layers.length} Ebenen</p>
            </button>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#070b19]/85 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">Inventar</p>
              <h2 className="mt-1 text-2xl font-black">Analyse- &amp; Scoring-Anbindungen</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={conceptFilter}
                onChange={(event) => setConceptFilter(event.target.value as ConceptFilter)}
                className="min-h-11 rounded-xl border border-white/10 bg-[#02050e] px-3 text-xs font-bold text-white outline-none focus:border-amber-300/50"
              >
                <option value="ALL">Alle Konzepte</option>
                {DATA_CONNECTION_CONCEPTS.map((concept) => <option key={concept.name} value={concept.name}>{concept.name}</option>)}
              </select>
              <select
                value={assetFilter}
                onChange={(event) => setAssetFilter(event.target.value as AssetFilter)}
                className="min-h-11 rounded-xl border border-white/10 bg-[#02050e] px-3 text-xs font-bold text-white outline-none focus:border-amber-300/50"
              >
                <option value="ALL">Alle Asset-Klassen</option>
                {['crypto', 'stock', 'forex', 'index', 'commodity', 'bond', 'portfolio', 'multi-asset'].map((asset) => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-[1100px] w-full border-collapse text-left text-xs">
              <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.12em] text-white/45">
                <tr>
                  <th className="px-4 py-3">Datenbankanbindung Konzept Name</th>
                  <th className="px-4 py-3">Analysetool Name</th>
                  <th className="px-4 py-3">Asset-Klassen / Unterklassen</th>
                  <th className="px-4 py-3">Bestes anwendbares Konzept</th>
                </tr>
              </thead>
              <tbody>
                {visibleContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    onClick={() => selectContract(contract)}
                    className={'cursor-pointer border-t border-white/10 align-top transition hover:bg-white/[0.04] ' + (contract.id === selectedId ? 'bg-amber-300/[0.05]' : '')}
                  >
                    <td className="px-4 py-4">
                      <span className={'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ' + conceptClasses(contract.conceptName)}>
                        {contract.conceptName}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-black text-white">{contract.toolName}</p>
                      <span className={'mt-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ' + statusClasses(contract.status)}>
                        {compactStatus(contract.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white/60">
                      <p className="font-bold text-white/80">{contract.assetClasses.join(' · ')}</p>
                      <p className="mt-1 max-w-sm leading-5">{contract.subclasses.join(' · ')}</p>
                    </td>
                    <td className="max-w-xl px-4 py-4 leading-5 text-white/60">{contract.bestConcept}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
          <article className="rounded-3xl border border-white/10 bg-[#070b19]/85 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-violet-300">Contract Inspector</p>
                <h2 className="mt-1 text-xl font-black">{selectedContract.toolName}</h2>
              </div>
              <span className={'rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ' + statusClasses(selectedContract.status)}>
                {selectedContract.status}
              </span>
            </div>

            <dl className="mt-5 space-y-4 text-xs">
              <div>
                <dt className="font-black uppercase tracking-wider text-white/35">Scoringmodell</dt>
                <dd className="mt-1 font-mono leading-5 text-amber-200">{selectedContract.scoringModel}</dd>
              </div>
              <div>
                <dt className="font-black uppercase tracking-wider text-white/35">Formel / Semantik</dt>
                <dd className="mt-1 leading-6 text-white/65">{selectedContract.formula}</dd>
              </div>
              <div>
                <dt className="font-black uppercase tracking-wider text-white/35">Provider Application Services</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {selectedContract.providerApplicationServices.map((item) => (
                    <span key={item} className="rounded-lg border border-cyan-400/15 bg-cyan-400/[0.06] px-2 py-1 text-cyan-100/75">{item}</span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="font-black uppercase tracking-wider text-white/35">Datenspeicher-Modelle</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {selectedContract.storageModels.map((item) => (
                    <span key={item} className="rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-1 text-emerald-100/75">{item}</span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="font-black uppercase tracking-wider text-white/35">UI-Datenfluss</dt>
                <dd className="mt-2 space-y-2">
                  {selectedContract.uiFlow.map((item, index) => (
                    <div key={item + index} className="flex items-center gap-2 text-white/60">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 font-mono text-[9px] text-white/45">{index + 1}</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="font-black uppercase tracking-wider text-white/35">Source Refs</dt>
                <dd className="mt-2 space-y-1 font-mono text-[10px] leading-5 text-white/40">
                  {selectedContract.sourceRefs.map((ref) => <div key={ref}>{ref}</div>)}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-3xl border border-white/10 bg-[#070b19]/85 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Visual Workflow Composer</p>
                <h2 className="mt-1 text-xl font-black">Pipeline selbst zusammenfügen</h2>
                <p className="mt-1 text-xs text-white/40">Reihenfolge verändern, Stufen entfernen oder ergänzen und direkt neu validieren.</p>
              </div>
              <button
                type="button"
                onClick={resetWorkflow}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-white/65 transition hover:bg-white/10 hover:text-white"
              >
                <RefreshCw size={14} aria-hidden="true" />
                Contract Reset
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={nodeToAdd}
                  onChange={(event) => setNodeToAdd(event.target.value)}
                  className="min-h-11 flex-1 rounded-xl border border-white/10 bg-[#02050e] px-3 text-xs font-bold text-white outline-none"
                >
                  {WORKFLOW_NODE_LIBRARY.map((node) => <option key={node} value={node}>{node}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setSteps((current) => [...current, nodeToAdd]);
                    setBenchmark(null);
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 text-xs font-black text-[#120b00] transition hover:brightness-110"
                >
                  <Plus size={14} aria-hidden="true" />
                  Stufe hinzufügen
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {steps.map((step, index) => (
                <div key={step + index} className="group grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-black/20 font-mono text-[10px] text-white/45">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex items-center gap-2">
                    <GitBranch size={14} className="shrink-0 text-violet-300" aria-hidden="true" />
                    <span className="text-xs font-bold text-white/75">{step}</span>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" aria-label="Stufe nach oben" onClick={() => moveStep(index, -1)} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/45 transition hover:text-white"><ArrowUp size={13} /></button>
                    <button type="button" aria-label="Stufe nach unten" onClick={() => moveStep(index, 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/45 transition hover:text-white"><ArrowDown size={13} /></button>
                    <button type="button" aria-label="Stufe entfernen" onClick={() => removeStep(index)} className="grid h-8 w-8 place-items-center rounded-lg border border-rose-400/15 bg-rose-400/[0.05] text-rose-300/60 transition hover:text-rose-200"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
              {steps.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-xs text-white/35">
                  Noch keine Workflow-Stufe vorhanden.
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#070b19]/85 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
            <div>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Validation &amp; Benchmark</p>
                  <h2 className="mt-1 text-xl font-black">5-Stufen Contract Check</h2>
                </div>
                <button
                  type="button"
                  onClick={runBenchmark}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-5 text-xs font-black text-amber-200 transition hover:bg-amber-300/15"
                >
                  <Beaker size={15} aria-hidden="true" />
                  2.000× lokal benchmarken
                </button>
              </div>

              <div className="mt-5 space-y-2">
                {checks.map((check) => (
                  <div key={check.id} className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[150px_1fr] sm:items-center">
                    <span className={
                      'inline-flex w-fit rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wider '
                      + (check.state === 'PASS'
                        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                        : check.state === 'WARN'
                          ? 'border-amber-300/20 bg-amber-300/10 text-amber-200'
                          : 'border-rose-400/20 bg-rose-400/10 text-rose-300')
                    }>
                      {check.state} · {check.label}
                    </span>
                    <p className="text-xs leading-5 text-white/50">{check.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Workflow Vergleich</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-bold text-white/45">Contract Default</p>
                  <p className="mt-1 text-3xl font-black text-white">{defaultArchitectureFit}</p>
                </div>
                <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4">
                  <p className="text-xs font-bold text-amber-200/65">Aktueller Workflow</p>
                  <p className="mt-1 text-3xl font-black text-amber-300">{currentArchitectureFit}</p>
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-5 text-white/35">
                Architecture Fit ist eine deterministische Vertragsmetrik aus Evidence-Stärke, Gate-Vollständigkeit,
                Produktivstatus und Integrationskomplexität. Sie ist kein Markt-, Performance- oder Provider-Latenzscore.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <BenchmarkCard benchmark={benchmark} />
          </div>
        </section>
      </main>
    </div>
  );
}

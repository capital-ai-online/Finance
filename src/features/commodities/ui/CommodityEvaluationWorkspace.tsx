import React from 'react';
import { Activity, Beaker, Database, ShieldCheck } from 'lucide-react';
import { RawMaterialsDashboard } from './RawMaterialsDashboard';

const TOOL_PROJECTIONS = [
  {
    id: 'canonical-market-score',
    icon: <ShieldCheck size={16} aria-hidden="true" />,
    title: 'Verifizierter Markt-Score',
    authority: 'CANONICAL SCORE',
    description: 'Trend, Momentum, Breakout- und Volatilitätsqualität aus verifizierter Commodity-Marktevidence.',
  },
  {
    id: 'orchestrator-research',
    icon: <Database size={16} aria-hidden="true" />,
    title: 'Orchestrator-Research',
    authority: 'RESEARCH',
    description: 'Klassifizierung sowie strukturelle Fundamental-, Risiko-, Prozessierungs- und Kritikalitätsanalyse.',
  },
  {
    id: 'research-sandbox',
    icon: <Beaker size={16} aria-hidden="true" />,
    title: 'Research-Sandbox',
    authority: 'NOT SCORE ELIGIBLE',
    description: 'Manuelle Szenarioanalyse ohne Ranking-, Handels- oder Ausführungsberechtigung.',
  },
] as const;

export function CommodityEvaluationWorkspace() {
  return (
    <section className="ui-stack" aria-labelledby="commodity-evaluation-workspace-title">
      <div className="ui-panel border-asset-commodity/30 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-asset-commodity/30 bg-asset-commodity/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-asset-commodity">
              <Activity size={14} aria-hidden="true" />
              Commodities
            </span>
            <h2 id="commodity-evaluation-workspace-title" className="font-display text-xl font-black uppercase tracking-wide text-text-primary">
              Commodity-Bewertungswerkzeuge
            </h2>
            <p className="max-w-4xl text-xs leading-relaxed text-text-secondary">
              Der Reiter bündelt den kanonischen, evidenzgebundenen Markt-Score und sämtliche
              Research-Werkzeuge des Rohstoff-Orchestrators. Authority, Datenqualität und
              Berechenbarkeit bleiben je Ergebnis getrennt sichtbar.
            </p>
          </div>

          <div className="rounded-lg border border-status-unavailable/30 bg-status-unavailable/10 px-4 py-3 text-[11px] leading-relaxed text-text-secondary lg:max-w-sm">
            Fehlende, veraltete oder nicht verifizierbare Providerdaten bleiben
            <strong className="ml-1 text-text-primary">DATA_UNAVAILABLE</strong>. Der Client erzeugt
            keine Ersatzwerte und stuft Research nicht zum kanonischen Score hoch.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {TOOL_PROJECTIONS.map((tool) => (
            <article key={tool.id} className="rounded-xl border border-border bg-surface/70 p-4">
              <div className="flex items-center gap-2 text-asset-commodity">
                {tool.icon}
                <h3 className="text-xs font-bold uppercase tracking-wide text-text-primary">{tool.title}</h3>
              </div>
              <div className="mt-3 font-mono text-[9px] font-bold uppercase tracking-widest text-text-secondary">
                {tool.authority}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">{tool.description}</p>
            </article>
          ))}
        </div>
      </div>

      <RawMaterialsDashboard />
    </section>
  );
}

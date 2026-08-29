import React, { useMemo } from 'react';
import { Activity, BarChart3, Database, Layers3 } from 'lucide-react';
import { AuthorityBadge, ResearchOnlyBanner, StatusBadge } from '../../../shared/ui';
import { buildCryptoCategoryResearchViewModel, humanizeCryptoMetricKey } from './cryptoCategoryResearchViewModel';

export interface CryptoResearchVisualizationSuiteProps {
  selectedSymbol: string;
}

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W'] as const;

export function CryptoResearchVisualizationSuite({ selectedSymbol }: CryptoResearchVisualizationSuiteProps) {
  const symbol = selectedSymbol.toUpperCase().trim();
  const model = useMemo(() => buildCryptoCategoryResearchViewModel(symbol), [symbol]);
  const research = model.researchLens;
  if (!research) return null;

  const providers = [...new Set(research.groups.flatMap((group) => group.features.map((feature) => feature.source)).concat(research.hardGates.map((gate) => gate.source)))].sort();

  return (
    <section id="crypto-research-visualization-suite" className="mt-6 space-y-5 rounded-2xl border border-border bg-surface/35 p-5 sm:p-6" aria-labelledby="crypto-research-visualization-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-brand-cyan"><Layers3 size={13} /> CV-4 / CV-5 / CV-6 / CV-8</div>
          <h3 id="crypto-research-visualization-title" className="mt-1 font-display text-lg font-black text-text-primary">Evidence-native Research Visuals</h3>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-text-secondary">Die Visuals zeigen nur vorhandene Contract-/Provider-Struktur. Ohne runtime-attestierte Messwerte bleiben Zustände explizit NOT_COMPUTABLE; es werden keine Heatmap-, Timeframe-, Breadth- oder Derivatives-Werte synthetisiert.</p>
        </div>
        <div className="flex flex-wrap gap-2"><AuthorityBadge authority="RESEARCH" label="Research only" /><StatusBadge status="NOT_COMPUTABLE" /></div>
      </div>

      <ResearchOnlyBanner title="Keine Visualisierung als Score-Authority" description="CV-4/5/6/8 sind reine Projektionen. RankingBoard, ScoringDispatcher, ProviderMatrix und Evidence Contracts bleiben ihre jeweiligen fachlichen Authorities." />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-background/25 p-4" aria-labelledby="cv4-title">
          <div className="mb-3 flex items-center gap-2"><Database size={14} className="text-brand-cyan" /><h4 id="cv4-title" className="text-xs font-black text-text-primary">CV-4 · Evidence & Provenance Matrix</h4></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[10px]">
              <thead><tr className="border-b border-border text-text-secondary"><th className="p-2">Provider</th><th className="p-2">Contract-Nutzung</th><th className="p-2">Runtime State</th></tr></thead>
              <tbody>{providers.map((provider) => {
                const count = research.groups.flatMap((group) => group.features).filter((feature) => feature.source === provider).length + research.hardGates.filter((gate) => gate.source === provider).length;
                return <tr key={provider} className="border-b border-border/60"><td className="p-2 font-mono text-text-primary">{provider}</td><td className="p-2 text-text-secondary">{count} Feature/Gate Contract(s)</td><td className="p-2"><StatusBadge status="NOT_COMPUTABLE" /></td></tr>;
              })}</tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-background/25 p-4" aria-labelledby="cv5-title">
          <div className="mb-3 flex items-center gap-2"><Activity size={14} className="text-brand-cyan" /><h4 id="cv5-title" className="text-xs font-black text-text-primary">CV-5 · Multi-Timeframe Lens</h4></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TIMEFRAMES.map((tf) => <div key={tf} className={`rounded-lg border p-3 ${tf === '1D' ? 'border-brand-cyan/30 bg-brand-cyan/5' : 'border-border bg-surface/35'}`}><div className="font-mono text-xs font-black text-text-primary">{tf}</div><div className="mt-1 text-[8px] uppercase tracking-wider text-text-secondary">{tf === '1D' ? 'Canonical basis · 30 bars' : 'Research context'}</div><div className="mt-2"><StatusBadge status="NOT_COMPUTABLE" /></div></div>)}
          </div>
          <p className="mt-3 text-[9px] text-text-secondary">Pattern-, Momentum-, Sentiment- und Regime-Zellen werden erst befüllt, wenn der Backend-Research-Output den jeweiligen Timeframe attestiert.</p>
        </section>

        <section className="rounded-xl border border-border bg-background/25 p-4" aria-labelledby="cv6-title">
          <div className="mb-3 flex items-center gap-2"><BarChart3 size={14} className="text-brand-cyan" /><h4 id="cv6-title" className="text-xs font-black text-text-primary">CV-6 · Ranking Heatmap & Breadth</h4></div>
          <div className="rounded-lg border border-border bg-surface/35 p-4"><StatusBadge status="NOT_COMPUTABLE" /><p className="mt-2 text-[10px] leading-relaxed text-text-secondary">Keine zweite Ranking-Berechnung im Browser. Heatmap/Breadth darf ausschließlich einen vom kanonischen RankingBoard gelieferten Datensatz projizieren. Bis dieser View-Contract verdrahtet ist, bleibt die Fläche bewusst leer.</p></div>
        </section>

        <section className="rounded-xl border border-border bg-background/25 p-4" aria-labelledby="cv8-title">
          <div className="mb-3 flex items-center gap-2"><Activity size={14} className="text-brand-cyan" /><h4 id="cv8-title" className="text-xs font-black text-text-primary">CV-8 · Derivatives / Market Structure</h4></div>
          <div className="space-y-2">{research.groups.filter((group) => /market|liquidity|execution/i.test(group.id)).flatMap((group) => group.features).slice(0, 8).map((feature) => <div key={feature.key} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/35 p-3"><div><div className="text-[10px] font-bold text-text-primary">{humanizeCryptoMetricKey(feature.key)}</div><div className="mt-1 text-[8px] font-mono text-text-secondary">{feature.source}</div></div><StatusBadge status="NOT_COMPUTABLE" /></div>)}</div>
          <p className="mt-3 text-[9px] text-text-secondary">Funding/OI/Spread/Liquidity werden nur bei vorhandener verifizierter Provider-Evidence visualisiert; keine automatisch erzeugten Buy-/Sell-Signale.</p>
        </section>
      </div>
    </section>
  );
}

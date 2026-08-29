import React, { useMemo } from 'react';
import { ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { StatusBadge } from '../../../shared/ui';
import { buildCryptoCategoryResearchViewModel } from './cryptoCategoryResearchViewModel';

export interface CryptoResearchTopologyPanelsProps {
  selectedSymbol: string;
}

function matches(value: string, needles: readonly string[]): boolean {
  const normalized = value.toLowerCase();
  return needles.some((needle) => normalized.includes(needle));
}

export function CryptoResearchTopologyPanels({ selectedSymbol }: CryptoResearchTopologyPanelsProps) {
  const symbol = selectedSymbol.toUpperCase().trim();
  const model = useMemo(() => buildCryptoCategoryResearchViewModel(symbol), [symbol]);
  const research = model.researchLens;
  if (!research) return null;

  const features = research.groups.flatMap((group) => group.features.map((feature) => ({ ...feature, groupId: group.id })));
  const panels = model.category === 'Meme'
    ? [
        { id: 'meme-liquidity-execution', title: 'Liquidity / Execution', needles: ['liquidity', 'slippage', 'spread', 'volume'] },
        { id: 'meme-holder-distribution', title: 'Holder / Distribution', needles: ['holder', 'distribution', 'wallet', 'concentration', 'sniper', 'whale'] },
        { id: 'meme-social-authenticity', title: 'Social Authenticity', needles: ['author', 'engagement', 'mention', 'sentiment', 'influencer', 'bot'] },
        { id: 'meme-contract-rug', title: 'Contract / Rug Risk', needles: ['mint', 'blacklist', 'tax', 'proxy', 'deployer', 'honeypot', 'contract'] },
      ]
    : [
        { id: 'defi-scale-activity', title: 'Scale / Activity Correlation Family', needles: ['tvl', 'fee', 'revenue', 'utilization', 'active', 'retention'] },
        { id: 'defi-liquidity', title: 'Liquidity / Slippage', needles: ['liquidity', 'slippage', 'depth', 'volume'] },
        { id: 'defi-contract-security', title: 'Contract Security', needles: ['contract', 'audit', 'verification', 'exploit', 'upgrade', 'admin'] },
        { id: 'defi-oracle-integrity', title: 'Oracle Integrity', needles: ['oracle', 'deviation', 'liveness', 'manipulation', 'fallback'] },
      ];

  return (
    <section className="mt-6 rounded-2xl border border-brand-accent/20 bg-surface/35 p-5 sm:p-6" aria-labelledby="crypto-research-topology-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div><div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-widest text-brand-accent"><SlidersHorizontal size={13} /> CV-7 · Specialized Research Topology</div><h3 id="crypto-research-topology-title" className="mt-1 text-lg font-black text-text-primary">{model.category} Research-Struktur</h3><p className="mt-1 text-[10px] text-text-secondary">Korrelationsgebundene Feature-Familien werden getrennt dargestellt. Runtime-Werte erscheinen erst nach attestierter Evidence.</p></div>
        <StatusBadge status="RESEARCH_ONLY" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {panels.map((panel) => {
          const matching = features.filter((feature) => matches(`${feature.key} ${feature.groupId}`, panel.needles));
          return <section key={panel.id} className="rounded-xl border border-border bg-background/25 p-4" aria-labelledby={`${panel.id}-title`}><div className="mb-3 flex items-center justify-between gap-3"><h4 id={`${panel.id}-title`} className="text-xs font-black text-text-primary">{panel.title}</h4><StatusBadge status="NOT_COMPUTABLE" /></div>{matching.length > 0 ? <div className="space-y-2">{matching.map((feature) => <div key={feature.key} className="rounded-lg border border-border bg-surface/40 p-3"><div className="text-[10px] font-bold text-text-primary">{feature.label}</div><div className="mt-1 break-all text-[8px] font-mono text-text-secondary">{feature.source} · {feature.correlationGroup}</div></div>)}</div> : <div className="flex gap-2 text-[10px] text-text-secondary"><ShieldAlert size={13} className="shrink-0 text-status-warning" />Kein passender attestierter Feature-Contract in dieser Topologie.</div>}</section>;
        })}
      </div>
    </section>
  );
}

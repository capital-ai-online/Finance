import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Database, Layers3, ShieldCheck } from 'lucide-react';
import { assetRegistry } from '../../../lib/assetRegistry';
import { AuthorityBadge, ResearchOnlyBanner, StatusBadge } from '../../../shared/ui';
import {
  buildCryptoCategoryResearchViewModel,
  cryptoProfileLabel,
  humanizeCryptoMetricKey,
  type CryptoCategoryResearchViewModel,
} from './cryptoCategoryResearchViewModel';

export interface CryptoCategoryResearchLensesProps {
  selectedSymbol: string;
}

type LensTab = 'profile' | 'research' | 'gates';

function tabId(symbol: string, tab: LensTab): string {
  return `crypto-category-${symbol.toLowerCase()}-${tab}-tab`;
}

function panelId(symbol: string, tab: LensTab): string {
  return `crypto-category-${symbol.toLowerCase()}-${tab}-panel`;
}

function MetricBars({ model }: { model: CryptoCategoryResearchViewModel }) {
  if (model.metrics.length === 0) {
    return (
      <div className="rounded-xl border border-status-warning/25 bg-status-warning/10 p-4 text-xs text-text-secondary">
        Für dieses Kategorieprofil sind noch keine freigegebenen source-defined Gewichte hinterlegt. Die UI erzeugt bewusst keine Ersatzgewichte.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {model.metrics.map((metric) => (
        <div key={metric.key} className="rounded-xl border border-border bg-background/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-text-primary">{metric.label}</div>
              <div className="mt-1 text-[9px] font-mono uppercase tracking-wider text-text-secondary">{metric.direction === 'PENALTY' ? 'Penalty-Faktor' : 'Positiver Faktor'}</div>
            </div>
            <div className="text-sm font-black font-mono text-text-primary">{Math.round(metric.weight * 100)}%</div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border" aria-hidden="true">
            <div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.max(2, Math.min(100, metric.weight * 100))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ResearchGroups({ model }: { model: CryptoCategoryResearchViewModel }) {
  const research = model.researchLens;
  if (!research) {
    return (
      <div className="rounded-xl border border-border bg-background/25 p-4 text-xs text-text-secondary">
        Für {model.category} ist aktuell kein eigener SC-3 Meme-/DeFi-Challenger hinterlegt. Das source-defined Kategorieprofil bleibt sichtbar; spezialisierte Research-Modelle werden nicht erfunden.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-accent/25 bg-brand-accent/[0.04] p-4">
        <div>
          <div className="text-xs font-black text-text-primary">{research.modelId}@{research.modelVersion}</div>
          <div className="mt-1 text-[9px] font-mono uppercase tracking-wider text-text-secondary">{research.featureContractVersion} · {research.lifecycle}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AuthorityBadge authority="RESEARCH" label="Research Challenger" />
          <StatusBadge status="RESEARCH_ONLY" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {research.groups.map((group) => (
          <section key={group.id} className="rounded-xl border border-border bg-background/20 p-4" aria-labelledby={`${group.id}-heading`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 id={`${group.id}-heading`} className="text-xs font-black text-text-primary">{group.label}</h4>
              <span className="text-[9px] font-mono text-text-secondary">{group.features.length} Tools</span>
            </div>
            <div className="space-y-2">
              {group.features.map((feature) => (
                <div key={feature.key} className="rounded-lg border border-border bg-surface/45 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="break-words text-[11px] font-bold text-text-primary">{feature.label}</div>
                      <div className="mt-1 break-all text-[9px] font-mono text-text-secondary">{feature.source}</div>
                    </div>
                    <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[8px] font-mono uppercase text-text-secondary">{feature.requiredForResearch ? 'required' : 'optional'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {research.antiCorrelationRules.length > 0 && (
        <div className="rounded-xl border border-border bg-background/25 p-4">
          <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-text-secondary">Correlation / De-duplication Guards</div>
          <div className="space-y-2">
            {research.antiCorrelationRules.map((rule, index) => (
              <div key={index} className="flex gap-2 text-[10px] leading-relaxed text-text-secondary"><ShieldCheck size={12} className="mt-0.5 shrink-0 text-brand-cyan" />{rule}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GateRail({ model }: { model: CryptoCategoryResearchViewModel }) {
  const categoryGates = model.hardGates.map((key) => ({ key, source: 'Kategorieprofil' }));
  const researchGates = (model.researchLens?.hardGates ?? []).map((gate) => ({ key: gate.key, source: gate.source }));
  const gates = [...categoryGates, ...researchGates].filter((gate, index, all) => all.findIndex((candidate) => candidate.key === gate.key) === index);

  if (gates.length === 0 && model.unweightedPenaltyMetrics.length === 0) {
    return <div className="rounded-xl border border-border bg-background/25 p-4 text-xs text-text-secondary">Für dieses Profil sind keine expliziten Hard Gates oder ungewichteten Penalties hinterlegt.</div>;
  }

  return (
    <div className="space-y-4">
      {gates.length > 0 && (
        <div>
          <div className="mb-3 text-[10px] font-black uppercase tracking-wider text-text-secondary">Hard Gates · Status wird nicht im Frontend berechnet</div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {gates.map((gate) => (
              <div key={gate.key} className="flex items-start gap-3 rounded-xl border border-status-warning/25 bg-status-warning/5 p-4">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-status-warning" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-text-primary">{humanizeCryptoMetricKey(gate.key)}</div>
                  <div className="mt-1 break-all text-[9px] font-mono text-text-secondary">{gate.source}</div>
                  <div className="mt-2 text-[9px] font-mono uppercase text-status-warning">Evidence-/Backend-Entscheidung erforderlich</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {model.unweightedPenaltyMetrics.length > 0 && (
        <div className="rounded-xl border border-border bg-background/25 p-4">
          <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-text-secondary">Ungewichtete Penalties</div>
          <div className="flex flex-wrap gap-2">
            {model.unweightedPenaltyMetrics.map((penalty) => (
              <span key={penalty} className="rounded-lg border border-border bg-surface/50 px-2.5 py-1.5 text-[10px] text-text-secondary">{humanizeCryptoMetricKey(penalty)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CryptoCategoryResearchLenses({ selectedSymbol }: CryptoCategoryResearchLensesProps) {
  const symbol = selectedSymbol.toUpperCase().trim();
  const asset = useMemo(() => assetRegistry.getAssets().find((entry) => entry.symbol.toUpperCase() === symbol), [symbol]);
  const model = useMemo(() => buildCryptoCategoryResearchViewModel(symbol), [symbol]);
  const tabs = useMemo<LensTab[]>(() => model.researchLens ? ['profile', 'research', 'gates'] : ['profile', 'gates'], [model.researchLens]);
  const [activeTab, setActiveTab] = useState<LensTab>('profile');

  useEffect(() => {
    setActiveTab('profile');
  }, [symbol]);

  if (asset?.type !== 'crypto') return null;

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, current: LensTab) {
    const index = tabs.indexOf(current);
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    const next = tabs[nextIndex];
    setActiveTab(next);
    document.getElementById(tabId(symbol, next))?.focus();
  }

  return (
    <section id="crypto-category-model-explorer" className="mt-6 space-y-5 rounded-2xl border border-brand-accent/25 bg-surface/45 p-5 sm:p-6" aria-labelledby="crypto-category-model-explorer-title">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-brand-accent"><Layers3 size={13} /> CV-3 + CV-7 · Category Model Explorer</div>
          <h3 id="crypto-category-model-explorer-title" className="mt-1 font-display text-lg font-black text-text-primary">{model.category} · {model.subCategory}</h3>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-text-secondary">Kanonische Klassifikation und Backend-Research-Contracts werden direkt projiziert. Gewichte, Gates und Correlation Groups werden angezeigt, aber im Browser weder neu berechnet noch zu einem zweiten Score verdichtet.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg border border-border bg-background/35 px-2.5 py-1.5 text-[9px] font-mono text-text-secondary">Tier {model.tier}</span>
          <span className="rounded-lg border border-border bg-background/35 px-2.5 py-1.5 text-[9px] font-mono text-text-secondary">Confidence {(model.confidence * 100).toFixed(0)}%</span>
          <span className="rounded-lg border border-border bg-background/35 px-2.5 py-1.5 text-[9px] font-mono text-text-secondary">{cryptoProfileLabel(model.profileId)}</span>
          <StatusBadge status={model.sourceStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-background/25 p-4"><div className="text-[9px] font-mono uppercase tracking-wider text-text-secondary">Hauptkategorie</div><div className="mt-1 text-sm font-black text-text-primary">{model.category}</div></div>
        <div className="rounded-xl border border-border bg-background/25 p-4"><div className="text-[9px] font-mono uppercase tracking-wider text-text-secondary">Unterkategorie</div><div className="mt-1 text-sm font-black text-text-primary">{model.subCategory}</div></div>
        <div className="rounded-xl border border-border bg-background/25 p-4"><div className="text-[9px] font-mono uppercase tracking-wider text-text-secondary">Profilbindung</div><div className="mt-1 text-sm font-black text-text-primary">{model.binding}</div><div className="mt-1 text-[9px] text-text-secondary">{model.bindingReason}</div></div>
      </div>

      <ResearchOnlyBanner
        title="Presentation-only Research Projection"
        description="ScoringDispatcher bleibt die einzige produktive Score-Authority. CV-3/CV-7 visualisieren Kategorieprofile und Challenger-Research; scoreEligible oder Execution-Eligibility werden hier nicht erzeugt."
      />

      <div role="tablist" aria-label={`Bewertungslinsen für ${symbol}`} className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((tab) => {
          const active = activeTab === tab;
          const label = tab === 'profile' ? 'Kategorieprofil' : tab === 'research' ? 'Meme / DeFi Research' : 'Hard Gates';
          return (
            <button
              key={tab}
              id={tabId(symbol, tab)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId(symbol, tab)}
              tabIndex={active ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, tab)}
              className={`min-h-11 rounded-lg border px-3 text-[10px] font-bold transition-colors ${active ? 'border-brand-accent/50 bg-brand-accent/10 text-brand-accent' : 'border-border text-text-secondary hover:text-text-primary'}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === 'profile' && (
        <div id={panelId(symbol, 'profile')} role="tabpanel" aria-labelledby={tabId(symbol, 'profile')} tabIndex={0} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><div className="text-sm font-black text-text-primary">{cryptoProfileLabel(model.profileId)} Bewertungstools</div><div className="mt-1 text-[10px] text-text-secondary">Source-defined Profilgewichte aus `CryptoModuleContracts`.</div></div>
            <AuthorityBadge authority="RESEARCH" label="Research / Configuration" />
          </div>
          <MetricBars model={model} />
          {model.classificationReasoning.length > 0 && (
            <div className="rounded-xl border border-border bg-background/25 p-4">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-text-secondary"><Database size={12} /> Klassifikationsbegründung</div>
              <div className="space-y-1.5">{model.classificationReasoning.map((reason, index) => <div key={index} className="text-[10px] leading-relaxed text-text-secondary">{reason}</div>)}</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'research' && model.researchLens && (
        <div id={panelId(symbol, 'research')} role="tabpanel" aria-labelledby={tabId(symbol, 'research')} tabIndex={0}>
          <ResearchGroups model={model} />
        </div>
      )}

      {activeTab === 'gates' && (
        <div id={panelId(symbol, 'gates')} role="tabpanel" aria-labelledby={tabId(symbol, 'gates')} tabIndex={0}>
          <GateRail model={model} />
        </div>
      )}
    </section>
  );
}

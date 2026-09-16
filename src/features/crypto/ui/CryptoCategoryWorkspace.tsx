import React, { useMemo, useState } from 'react';
import { Boxes, Database, Layers3, Network, ShieldCheck } from 'lucide-react';
import { assetRegistry } from '../../../lib/assetRegistry';
import { ClassificationService } from '../../../services/classification.service';
import type { CryptoCategory, CryptoSubCategory, CryptoTier } from '../../../types/crypto.types';
import { AuthorityBadge, ResearchOnlyBanner, StatusBadge } from '../../../shared/ui';
import {
  buildCryptoCategoryResearchViewModel,
  cryptoProfileLabel,
  type CryptoCategoryResearchViewModel,
} from './cryptoCategoryResearchViewModel';

export interface CryptoCategoryWorkspaceProps {
  selectedSymbol: string;
  onSelectSymbol?: (symbol: string) => void;
}

type WorkspaceTab = 'overview' | 'categories' | 'models';

type CryptoMember = {
  readonly symbol: string;
  readonly name: string;
  readonly category: CryptoCategory;
  readonly subCategory: CryptoSubCategory;
  readonly tier: CryptoTier;
  readonly confidence: number;
};

type CategoryProjection = {
  readonly category: CryptoCategory;
  readonly members: readonly CryptoMember[];
  readonly subCategories: readonly CryptoSubCategory[];
  readonly representative: CryptoCategoryResearchViewModel;
};

function tabId(tab: WorkspaceTab): string {
  return `crypto-workspace-${tab}-tab`;
}

function panelId(tab: WorkspaceTab): string {
  return `crypto-workspace-${tab}-panel`;
}

function buildCategoryProjection(): readonly CategoryProjection[] {
  const cryptoMembers: CryptoMember[] = assetRegistry
    .getAssets()
    .filter((asset) => asset.type === 'crypto')
    .map((asset) => {
      const classification = ClassificationService.classifyAsset(asset.symbol);
      return Object.freeze({
        symbol: asset.symbol.toUpperCase(),
        name: asset.name,
        category: classification.category_main,
        subCategory: classification.category_sub,
        tier: classification.tier,
        confidence: classification.confidence,
      });
    });

  const grouped = new Map<CryptoCategory, CryptoMember[]>();
  for (const member of cryptoMembers) {
    const bucket = grouped.get(member.category) ?? [];
    bucket.push(member);
    grouped.set(member.category, bucket);
  }

  return Object.freeze(
    [...grouped.entries()]
      .map(([category, members]) => {
        const sortedMembers = [...members].sort((a, b) => a.symbol.localeCompare(b.symbol));
        const subCategories = [...new Set(sortedMembers.map((member) => member.subCategory))].sort();
        return Object.freeze({
          category,
          members: Object.freeze(sortedMembers),
          subCategories: Object.freeze(subCategories),
          representative: buildCryptoCategoryResearchViewModel(sortedMembers[0].symbol),
        });
      })
      .sort((a, b) => a.category.localeCompare(b.category)),
  );
}

function TierBadge({ tier }: { tier: CryptoTier }) {
  return (
    <span className="rounded-md border border-border bg-background/35 px-2 py-1 text-[9px] font-mono text-text-secondary">
      Tier {tier}
    </span>
  );
}

export function CryptoCategoryWorkspace({ selectedSymbol, onSelectSymbol }: CryptoCategoryWorkspaceProps) {
  const categories = useMemo(() => buildCategoryProjection(), []);
  const selected = useMemo(() => ClassificationService.classifyAsset(selectedSymbol), [selectedSymbol]);
  const fallbackCategory = categories[0]?.category ?? 'Unknown';
  const selectedCategory = categories.some((entry) => entry.category === selected.category_main)
    ? selected.category_main
    : fallbackCategory;
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [activeCategory, setActiveCategory] = useState<CryptoCategory>(selectedCategory);

  const category = categories.find((entry) => entry.category === activeCategory) ?? categories[0] ?? null;
  const coveredAssets = categories.reduce((total, entry) => total + entry.members.length, 0);
  const researchCategories = categories.filter((entry) => entry.representative.researchLens !== null);

  React.useEffect(() => {
    if (categories.some((entry) => entry.category === selected.category_main)) {
      setActiveCategory(selected.category_main);
    }
  }, [categories, selected.category_main]);

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, current: WorkspaceTab) {
    const tabs: WorkspaceTab[] = ['overview', 'categories', 'models'];
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
    document.getElementById(tabId(next))?.focus();
  }

  return (
    <section
      id="crypto-category-workspace"
      className="mt-6 space-y-5 rounded-2xl border border-brand-accent/25 bg-surface/45 p-5 sm:p-6"
      aria-labelledby="crypto-category-workspace-title"
    >
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-brand-accent">
            <Boxes size={13} /> Krypto · Kategorien / Unterklassen
          </div>
          <h3 id="crypto-category-workspace-title" className="mt-1 font-display text-lg font-black text-text-primary">
            Contract-backed Category Workspace
          </h3>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-text-secondary">
            Kategorien, Unterklassen und Modellbindungen werden ausschließlich aus vorhandener Asset-Klassifikation und FINTECH-Research-Verträgen projiziert. Preis-, Score- oder Provider-Werte aus lokalen UI-Registern werden hier bewusst nicht als Finanzwahrheit verwendet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg border border-border bg-background/35 px-2.5 py-1.5 text-[9px] font-mono text-text-secondary">
            {categories.length} belegte Kategorien
          </span>
          <span className="rounded-lg border border-border bg-background/35 px-2.5 py-1.5 text-[9px] font-mono text-text-secondary">
            {coveredAssets} klassifizierte Assets
          </span>
          <AuthorityBadge authority="PROJECTION" label="Presentation only" />
        </div>
      </div>

      <ResearchOnlyBanner
        title="Keine zweite Scoring- oder Provider-Authority"
        description="ScoringModelRegistry und ScoringDispatcher bleiben die produktive Modell-/Score-Authority. DATA bleibt Owner von Provider, Provenance, Freshness und DQ. Diese Oberfläche navigiert und erklärt nur bereits vorhandene Contracts."
      />

      <div role="tablist" aria-label="Krypto Workspace Bereiche" className="flex flex-wrap gap-2 border-b border-border pb-3">
        {(['overview', 'categories', 'models'] as const).map((tab) => {
          const active = activeTab === tab;
          const label = tab === 'overview' ? 'Overview' : tab === 'categories' ? 'Categories' : 'Models & Orchestration';
          return (
            <button
              key={tab}
              id={tabId(tab)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId(tab)}
              tabIndex={active ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, tab)}
              className={`min-h-11 rounded-lg border px-3 text-[10px] font-bold transition-colors ${
                active
                  ? 'border-brand-accent/50 bg-brand-accent/10 text-brand-accent'
                  : 'border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div id={panelId('overview')} role="tabpanel" aria-labelledby={tabId('overview')} tabIndex={0} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-background/25 p-4">
              <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-text-secondary"><Layers3 size={12} /> Contract Coverage</div>
              <div className="mt-2 text-2xl font-black text-text-primary">{categories.length}</div>
              <div className="mt-1 text-[10px] text-text-secondary">Nur Kategorien mit tatsächlich klassifizierten Registry-Mitgliedern; leere Taxonomie-Slots werden nicht erfunden.</div>
            </div>
            <div className="rounded-xl border border-border bg-background/25 p-4">
              <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-text-secondary"><Network size={12} /> Research Bindings</div>
              <div className="mt-2 text-2xl font-black text-text-primary">{researchCategories.length}</div>
              <div className="mt-1 text-[10px] text-text-secondary">Aktuell vorhandene dedizierte Research-Challenger werden exakt aus dem FINTECH-Contract erkannt.</div>
            </div>
            <div className="rounded-xl border border-border bg-background/25 p-4">
              <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-text-secondary"><Database size={12} /> Data Boundary</div>
              <div className="mt-2 text-sm font-black text-text-primary">DATA → FINTECH → FE</div>
              <div className="mt-1 text-[10px] text-text-secondary">Provider/Evidence erscheinen erst über kanonische Backend-Ergebnisse; fehlende Daten bleiben unavailable/not-computable.</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((entry) => (
              <button
                key={entry.category}
                type="button"
                onClick={() => { setActiveCategory(entry.category); setActiveTab('categories'); }}
                className="min-h-11 rounded-lg border border-border bg-background/30 px-3 py-2 text-left text-[10px] font-bold text-text-secondary transition hover:border-brand-accent/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                {entry.category} <span className="font-mono opacity-70">· {entry.members.length}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'categories' && category && (
        <div id={panelId('categories')} role="tabpanel" aria-labelledby={tabId('categories')} tabIndex={0} className="space-y-5">
          <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Krypto Kategorien">
            {categories.map((entry) => {
              const active = entry.category === category.category;
              return (
                <button
                  key={entry.category}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveCategory(entry.category)}
                  className={`min-h-11 shrink-0 rounded-lg border px-3 text-[10px] font-bold ${active ? 'border-brand-accent/50 bg-brand-accent/10 text-brand-accent' : 'border-border bg-background/25 text-text-secondary'}`}
                >
                  {entry.category} · {entry.members.length}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-border bg-background/25 p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <div className="text-sm font-black text-text-primary">{category.category}</div>
                <div className="mt-1 text-[10px] text-text-secondary">
                  {category.subCategories.length} contract-backed Unterklasse(n) · {category.members.length} Asset(s)
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {category.subCategories.map((subCategory) => (
                  <span key={subCategory} className="rounded-lg border border-border bg-surface/50 px-2.5 py-1.5 text-[9px] font-mono text-text-secondary">
                    {subCategory}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {category.members.map((member) => {
              const selectedMember = member.symbol === selectedSymbol.toUpperCase().trim();
              return (
                <button
                  key={member.symbol}
                  type="button"
                  onClick={() => onSelectSymbol?.(member.symbol)}
                  className={`min-h-11 rounded-xl border p-4 text-left transition ${selectedMember ? 'border-brand-primary/50 bg-brand-primary/10' : 'border-border bg-background/20 hover:border-brand-accent/35'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black text-text-primary">{member.symbol} · {member.name}</div>
                      <div className="mt-1 text-[9px] font-mono text-text-secondary">{member.subCategory}</div>
                    </div>
                    <TierBadge tier={member.tier} />
                  </div>
                  <div className="mt-3 text-[9px] font-mono text-text-secondary">Classification confidence {(member.confidence * 100).toFixed(0)}%</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'models' && (
        <div id={panelId('models')} role="tabpanel" aria-labelledby={tabId('models')} tabIndex={0} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {categories.map((entry) => {
              const model = entry.representative;
              return (
                <article key={entry.category} className="rounded-xl border border-border bg-background/25 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black text-text-primary">{entry.category}</div>
                      <div className="mt-1 text-[9px] font-mono text-text-secondary">{cryptoProfileLabel(model.profileId)} · {model.binding}</div>
                    </div>
                    <StatusBadge status={model.sourceStatus} />
                  </div>
                  <div className="mt-3 text-[10px] leading-relaxed text-text-secondary">{model.bindingReason}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded border border-border px-2 py-1 text-[9px] font-mono text-text-secondary">ScoringDispatcher only</span>
                    {model.researchLens ? (
                      <span className="rounded border border-brand-accent/25 bg-brand-accent/10 px-2 py-1 text-[9px] font-mono text-brand-accent">
                        {model.researchLens.modelId}@{model.researchLens.modelVersion} · {model.researchLens.lifecycle}
                      </span>
                    ) : (
                      <span className="rounded border border-border px-2 py-1 text-[9px] font-mono text-text-secondary">kein dedizierter Challenger</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/[0.04] p-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-brand-primary"><ShieldCheck size={13} /> Orchestration Boundary</div>
            <p className="mt-2 text-[10px] leading-relaxed text-text-secondary">
              Validated DATA / UAI → Feature Contract → ScoringModelRegistry → ScoringDispatcher → Domain Executor → CanonicalScoreResult → Ranking / Decision Support → Traceability. Provider- und DQ-Entscheidungen bleiben DATA-owned; Modell-/Score-Entscheidungen FINTECH-owned.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

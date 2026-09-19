import React from 'react';
import {
  Award,
  BarChart3,
  Compass,
  Database,
  Gauge,
  Orbit,
  ShieldCheck,
} from 'lucide-react';
import { PublicAnalysisWorkbench } from '../../../app/public/PublicAnalysisWorkbench';
import { CryptoPatternTrooper } from '../../../features/crypto/ui';
import { getAssetCatalogIntegrity, getAssetClassCounts } from '../../../lib/assetSearchCatalog';

const VISIBLE_ASSET_CLASSES = [
  {
    key: 'crypto',
    label: 'Krypto',
    detail: 'Digitale Assets und kanonische Crypto-Scoring-Pfade',
    icon: Orbit,
    className: 'border-asset-crypto/25 bg-asset-crypto/[0.06] text-asset-crypto',
  },
  {
    key: 'stock',
    label: 'Aktien',
    detail: 'Equity Discovery, Screening und Value-Analyse',
    icon: BarChart3,
    className: 'border-asset-stock/25 bg-asset-stock/[0.06] text-asset-stock',
  },
  {
    key: 'index',
    label: 'Indizes',
    detail: 'Marktindizes mit providergebundener Evidence-Projektion',
    icon: Gauge,
    className: 'border-asset-index/25 bg-asset-index/[0.06] text-asset-index',
  },
  {
    key: 'forex',
    label: 'Forex',
    detail: 'Währungspaare im Multi-Asset-Katalog',
    icon: Compass,
    className: 'border-asset-forex/25 bg-asset-forex/[0.06] text-asset-forex',
  },
  {
    key: 'commodity',
    label: 'Rohstoffe',
    detail: 'Commodity Research plus getrenntes verifiziertes Scoring',
    icon: Award,
    className: 'border-asset-commodity/25 bg-asset-commodity/[0.06] text-asset-commodity',
  },
] as const;

const ORCHESTRATOR_CAPABILITIES = [
  {
    name: 'Crypto Orchestrator',
    role: 'Research & Enrichment',
    boundary:
      'Research-Ausgaben bleiben nicht-kanonisch; verifizierte Crypto-Scores werden weiterhin über den getrennten kanonischen Scoring-Pfad bezogen.',
    icon: Orbit,
  },
  {
    name: 'Raw Materials Orchestrator',
    role: 'Commodity Research',
    boundary:
      'Research und Sandbox bleiben von der verifizierten Rohstoffbewertung getrennt. Die Oberfläche konsumiert nur die bestehenden Verträge.',
    icon: Compass,
  },
  {
    name: 'FINTECH Scoring Orchestration',
    role: 'Canonical Score Pipeline',
    boundary:
      'Registry, Dispatcher und Scoring-Authority verbleiben im FINTECH-Layer. Universe ist ausschließlich read-only Consumer und Präsentationsfläche.',
    icon: ShieldCheck,
  },
] as const;

const DATA_LAYERS = [
  {
    title: 'Asset Catalog',
    eyebrow: 'Discovery',
    description:
      'Symbol, Name, Assetklasse und Adressierbarkeit. Katalogmetadaten sind bewusst keine verifizierten Marktwerte.',
  },
  {
    title: 'Verified Observation',
    eyebrow: 'Evidence',
    description:
      'Providergebundene Beobachtungen mit Provenienz und Freshness bleiben von Discovery-Metadaten getrennt.',
  },
  {
    title: 'Canonical Score',
    eyebrow: 'Decision Support',
    description:
      'Bewertungen werden aus dem bestehenden kanonischen Scoring-Vertrag projiziert; die Subdomain erfindet keine lokalen Scores.',
  },
] as const;

function formatCount(value: number): string {
  return new Intl.NumberFormat('de-DE').format(value);
}

export function UniversePortal() {
  const counts = getAssetClassCounts();
  const integrity = getAssetCatalogIntegrity();
  const visibleCatalogCount = VISIBLE_ASSET_CLASSES.reduce((sum, assetClass) => sum + counts[assetClass.key], 0);

  return (
    <main className="min-h-screen bg-background text-text-primary selection:bg-brand-primary/30">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-[-10rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-brand-primary/[0.08] blur-3xl" />
        <div className="absolute right-[-8rem] top-[18%] h-[30rem] w-[30rem] rounded-full bg-decorative-purple/[0.05] blur-3xl" />
        <div className="absolute bottom-[-14rem] left-[35%] h-[32rem] w-[32rem] rounded-full bg-decorative-cyan/[0.04] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1760px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="ui-panel ui-panel--elevated flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-primary/35 bg-brand-primary/10 text-brand-primary shadow-[0_0_28px_rgba(245,196,83,0.12)]">
              <Orbit size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.26em] text-brand-primary">
                CAPITAL-AI / UNIVERSE
              </p>
              <p className="mt-1 text-xs font-semibold text-text-secondary">
                Multi-Asset Intelligence Surface · read-only orchestration consumer
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2" aria-label="Universe Navigation">
            <a
              href="/learning-platform"
              className="ui-button-secondary inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface/70 px-4 text-xs font-bold text-text-primary hover:border-brand-primary/35 hover:bg-brand-primary/[0.06]"
            >
              Vocabulary
            </a>
            <a
              href="https://capital-ai.online/"
              className="ui-button-primary inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-xs font-black uppercase tracking-wider"
            >
              Hauptportal
            </a>
          </nav>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:items-center lg:py-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary/[0.07] px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
              <ShieldCheck size={13} aria-hidden="true" />
              FINTECH contracts · DATA lineage · 16.08 branding
            </div>

            <div className="space-y-4">
              <h1 className="max-w-5xl text-4xl font-black tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
                Das <span className="text-brand-primary">CAPITAL-AI Universe</span> verbindet Asset Discovery,
                Evidence und kanonisches Scoring in einer Oberfläche.
              </h1>
              <p className="max-w-4xl text-sm leading-7 text-text-secondary sm:text-base">
                Die Subdomain nutzt die bestehenden CAPITAL-AI Datenbestände und FINTECH-Orchestrierungsverträge,
                ohne eine zweite Scoring-, Provider-, DATA- oder IAM-Authority zu erzeugen. Katalogmetadaten,
                verifizierte Beobachtungen und kanonische Scores bleiben bewusst getrennte Ebenen.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-brand-primary/25 bg-brand-primary/[0.06] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                Capital Gold
              </span>
              <span className="rounded-full border border-decorative-cyan/20 bg-decorative-cyan/[0.05] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-decorative-cyan">
                Intelligence Cyan
              </span>
              <span className="rounded-full border border-decorative-purple/20 bg-decorative-purple/[0.05] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-decorative-purple">
                Universe Purple
              </span>
            </div>
          </div>

          <aside className="ui-panel ui-panel--elevated space-y-5" aria-label="Universe Data Status">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-text-secondary">
                  Canonical Catalog
                </p>
                <p className="mt-2 text-4xl font-black text-text-primary">{formatCount(visibleCatalogCount)}</p>
                <p className="mt-1 text-xs text-text-secondary">sichtbare Discovery-Einträge über fünf Assetklassen</p>
              </div>
              <div className={`rounded-xl border px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider ${integrity.status === 'READY' ? 'border-status-ready/30 bg-status-ready/[0.07] text-status-ready' : 'border-status-warning/30 bg-status-warning/[0.07] text-status-warning'}`}>
                {integrity.status}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-surface/55 p-3">
                <Database size={17} className="text-brand-primary" aria-hidden="true" />
                <p className="mt-2 text-xs font-black text-text-primary">Catalog ≠ Market Data</p>
                <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">Discovery-Metadaten bleiben evidence-frei.</p>
              </div>
              <div className="rounded-xl border border-border bg-surface/55 p-3">
                <ShieldCheck size={17} className="text-status-ready" aria-hidden="true" />
                <p className="mt-2 text-xs font-black text-text-primary">No local score</p>
                <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">Scoring bleibt im FINTECH-Vertrag.</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="space-y-4" aria-labelledby="asset-universe-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary">Universe Inventory</p>
              <h2 id="asset-universe-heading" className="mt-1 text-2xl font-black text-text-primary">Assetklassen aus dem kanonischen Katalog</h2>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-text-secondary">
              Die Zahlen beschreiben Discovery-Metadaten, nicht die Anzahl aktuell verifizierter Marktbeobachtungen.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {VISIBLE_ASSET_CLASSES.map((assetClass) => {
              const Icon = assetClass.icon;
              return (
                <article key={assetClass.key} className={`rounded-2xl border p-4 ${assetClass.className}`}>
                  <div className="flex items-center justify-between gap-3">
                    <Icon size={18} aria-hidden="true" />
                    <span className="font-mono text-[10px] font-black uppercase tracking-wider">Catalog</span>
                  </div>
                  <p className="mt-5 text-3xl font-black text-text-primary">{formatCount(counts[assetClass.key])}</p>
                  <h3 className="mt-1 text-sm font-black text-text-primary">{assetClass.label}</h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">{assetClass.detail}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="pb-8" aria-labelledby="crypto-pattern-trooper-universe-heading">
          <div className="mb-4">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-asset-crypto">
              Crypto Universe · Research Surface
            </p>
            <h2 id="crypto-pattern-trooper-universe-heading" className="mt-1 text-2xl font-black text-text-primary">
              Altcoin Pattern Trooper
            </h2>
            <p className="mt-2 max-w-4xl text-xs leading-relaxed text-text-secondary">
              Die grafische Fläche ist bereits FINTECH-contract-ready, bleibt auf current main jedoch bewusst
              NOT_COMPUTABLE, bis attestierte Pattern-Research-Evidence über den Backend-Vertrag angebunden ist.
            </p>
          </div>
          <CryptoPatternTrooper />
        </section>

        <section className="grid gap-4 py-8 lg:grid-cols-3" aria-label="FinTech Orchestrator Capabilities">
          {ORCHESTRATOR_CAPABILITIES.map((capability) => {
            const Icon = capability.icon;
            return (
              <article key={capability.name} className="ui-panel space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-primary/20 bg-brand-primary/[0.06] text-brand-primary">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-text-secondary">{capability.role}</p>
                    <h3 className="mt-0.5 text-sm font-black text-text-primary">{capability.name}</h3>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-text-secondary">{capability.boundary}</p>
              </article>
            );
          })}
        </section>

        <section className="ui-panel mb-8" aria-labelledby="lineage-heading">
          <div className="mb-5 flex items-center gap-3">
            <Database size={19} className="text-brand-primary" aria-hidden="true" />
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary">Data Lineage</p>
              <h2 id="lineage-heading" className="text-xl font-black text-text-primary">Drei getrennte Datenebenen</h2>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {DATA_LAYERS.map((layer, index) => (
              <div key={layer.title} className="relative rounded-2xl border border-border bg-surface/50 p-4">
                <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-text-secondary">0{index + 1} · {layer.eyebrow}</span>
                <h3 className="mt-2 text-sm font-black text-text-primary">{layer.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">{layer.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 pb-8" aria-labelledby="workbench-heading">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary">Interactive Workbench</p>
            <h2 id="workbench-heading" className="mt-1 text-2xl font-black text-text-primary">Bestehende Bewertungstools · gleiche Verträge</h2>
            <p className="mt-2 max-w-4xl text-xs leading-relaxed text-text-secondary">
              Das Universe verwendet die bestehende Public Analysis Workbench inklusive schmalem, ausklappbarem Sideboard. Der öffentliche Enterprise Scorer bleibt weiterhin fest auf BTC gebunden; geschützte Tools werden nicht still freigeschaltet.
            </p>
          </div>
          <PublicAnalysisWorkbench />
        </section>

        <footer className="flex flex-col gap-3 border-t border-border py-6 text-[11px] text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>CAPITAL-AI Universe · Presentation consumer only · keine lokale Scoring-/Provider-Authority</p>
          <div className="flex flex-wrap gap-4">
            <a className="hover:text-brand-primary" href="/impressum">Impressum</a>
            <a className="hover:text-brand-primary" href="/datenschutz">Datenschutz</a>
            <a className="hover:text-brand-primary" href="/agb">AGB</a>
          </div>
        </footer>
      </div>
    </main>
  );
}

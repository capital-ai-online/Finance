import React from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Compass,
  FileText,
  Gauge,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { CapitalAiLogo } from '../../../shared/branding';

interface LandingPageProps {
  preview: React.ReactNode;
  onLoginNavigate?: () => void;
}

const CAPABILITY_CARDS = [
  {
    title: 'Screening',
    description: 'Strukturierte Auswahl- und Vergleichsflächen innerhalb der vorhandenen Produktgrenzen.',
    icon: Compass,
  },
  {
    title: 'Bewertung',
    description: 'Nachvollziehbare Analyse- und Scoring-Oberflächen auf Basis freigegebener Verträge.',
    icon: BarChart3,
  },
  {
    title: 'Research',
    description: 'Research-Kontext und Evidenz werden sichtbar getrennt von produktiven Daten- und Scoring-Authorities präsentiert.',
    icon: FileText,
  },
  {
    title: 'Learning',
    description: 'Begriffe, Architekturwissen und Produktverständnis bleiben über die bestehende Learning-Fläche erreichbar.',
    icon: BookOpen,
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Kontext wählen',
    description: 'Die Oberfläche führt zu den bereits freigegebenen Produkt- und Analyseflächen, ohne neue Datenpfade einzuführen.',
  },
  {
    step: '02',
    title: 'Evidence sichtbar halten',
    description: 'Daten-, Analyse- und Scoring-Zustände bleiben an ihre bestehenden Runtime- und Evidenzgrenzen gebunden.',
  },
  {
    step: '03',
    title: 'Ergebnis einordnen',
    description: 'CAPITAL-AI unterstützt Analyse und Lernen; Produktdarstellung ersetzt keine Anlageberatung oder fachliche Authority.',
  },
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary">
      {children}
    </p>
  );
}

/**
 * Canonical public landing page for /.
 *
 * The public feature owns presentation only. Application composition supplies the public analysis
 * workbench from src/app so the dependency direction remains app -> features. Authentication stays
 * on /login; this component creates no session and defines no scoring/data authority.
 */
export function LandingPage({ preview, onLoginNavigate }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-text-primary selection:bg-brand-primary/30 selection:text-text-primary">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_8%,color-mix(in_srgb,var(--color-brand-primary)_10%,transparent),transparent_30%),radial-gradient(circle_at_88%_22%,color-mix(in_srgb,var(--color-decorative-purple)_9%,transparent),transparent_28%),radial-gradient(circle_at_55%_78%,color-mix(in_srgb,var(--color-decorative-cyan)_5%,transparent),transparent_34%)]" />

      <header className="sticky top-0 z-40 border-b border-brand-primary/20 bg-background/85 backdrop-blur-xl shadow-[0_8px_32px_color-mix(in_srgb,var(--color-brand-primary)_7%,transparent)]">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <a
            href="/"
            className="flex min-h-11 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="CAPITAL-AI Startseite"
          >
            <CapitalAiLogo size={44} showText={false} />
            <span className="text-base font-black uppercase tracking-[0.14em] text-brand-primary">
              CAPITAL-AI
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Hauptnavigation">
            <a
              href="#produkt"
              className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-xs font-bold text-text-secondary transition hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              Produkt
            </a>
            <a
              href="#analysis-workbench"
              className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-xs font-bold text-text-secondary transition hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              Analysen
            </a>
            <span
              className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-xs font-bold text-text-secondary/55"
              title="Noch keine kanonische Zielroute freigegeben"
            >
              Preise
            </span>
            <a
              href="/learning-platform"
              className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-xs font-bold text-text-secondary transition hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              Learning
            </a>
            <span
              className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-xs font-bold text-text-secondary/55"
              title="Noch keine kanonische Zielroute freigegeben"
            >
              Über uns
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/login"
              onClick={onLoginNavigate}
              className="hidden min-h-11 items-center justify-center rounded-xl border border-border bg-surface/50 px-4 py-2 text-xs font-bold text-text-primary transition hover:border-brand-primary/35 hover:bg-surface sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              Anmelden
            </a>
            <a
              href="#analysis-workbench"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-xs font-black uppercase tracking-wider text-background shadow-[0_0_20px_color-mix(in_srgb,var(--color-brand-primary)_24%,transparent)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <Gauge size={14} aria-hidden="true" />
              Analyse starten
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        <section
          data-landing-section="application-description"
          aria-label="CAPITAL-AI Anwendungsbeschreibung"
          className="border-y border-brand-primary/15 bg-surface/25 px-4 py-4 text-center backdrop-blur-md sm:px-6"
        >
          <p className="mx-auto max-w-6xl text-sm leading-relaxed text-text-secondary sm:text-base">
            CAPITAL-AI verbindet Marktinformationen, nachvollziehbare KI-gestützte Analyse- und
            Scoring-Werkzeuge sowie Research in einer gemeinsamen Multi-Asset-Oberfläche für Aktien,
            Indizes, Forex, Kryptowährungen und Rohstoffe. Ziel ist eine nachvollziehbare Entscheidungsgrundlage mit erklärbaren KI-Scorings und
            sichtbar getrennten Evidenz- und Zugriffsgrenzen.
          </p>
        </section>

        <section
          data-landing-section="ai-newsfeed-slot"
          aria-labelledby="ai-newsfeed-title"
          className="ui-panel overflow-hidden border-brand-accent/20 bg-surface/35 p-5 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-3xl space-y-2">
              <SectionLabel>AI Newsfeed</SectionLabel>
              <h2 id="ai-newsfeed-title" className="text-lg font-black text-text-primary sm:text-xl">
                Nachrichten- und Research-Kontext
              </h2>
              <p className="text-sm leading-relaxed text-text-secondary">
                Neutraler Integrationsslot. Die fachliche Newsfeed-Anbindung folgt in einem
                separaten Arbeitspaket; hier werden keine Headlines, Scores oder Provider-Zustände
                erfunden.
              </p>
            </div>
            <span className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-brand-accent/25 bg-brand-accent/10 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-accent sm:self-auto">
              <Sparkles size={14} aria-hidden="true" />
              Komponente wird schrittweise angebunden
            </span>
          </div>
        </section>

        <section
          id="produkt"
          data-landing-section="hero"
          className="ui-panel relative overflow-hidden border-brand-primary/25 bg-gradient-to-br from-surface/60 via-background/70 to-brand-accent/10 p-5 shadow-[0_22px_70px_color-mix(in_srgb,var(--color-brand-primary)_8%,transparent)] sm:p-8 lg:p-10"
        >
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_35%,color-mix(in_srgb,var(--color-brand-primary)_12%,transparent),transparent_42%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary/10 px-3 py-1 text-[10px] font-mono font-black uppercase tracking-[0.2em] text-brand-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                  CAPITAL-AI Universe
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/20 bg-brand-accent/[0.08] px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-accent">
                  <ShieldCheck size={12} aria-hidden="true" />
                  Evidence-first
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-5xl font-display text-4xl font-black leading-[1.04] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
                  Finanzanalyse, Research und KI in einer klaren Oberfläche.
                </h1>
                <p className="max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base">
                  Der Design-Shell ordnet bestehende Produktflächen neu, ohne Daten-, Scoring-,
                  Authentifizierungs- oder Entitlement-Semantik zu verändern. Die öffentliche
                  Analyse bleibt an die bestehende Runtime angebunden.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#analysis-workbench"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-xs font-black uppercase tracking-wider text-background shadow-[0_0_24px_color-mix(in_srgb,var(--color-brand-primary)_28%,transparent)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  Analyse starten
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
                <a
                  href="/learning-platform"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background/45 px-6 py-3 text-xs font-bold text-text-primary transition hover:border-brand-primary/30 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <BookOpen size={14} aria-hidden="true" />
                  Learning öffnen
                </a>
              </div>
            </div>

            <aside className="ui-panel space-y-4 border-brand-primary/20 bg-background/50 p-5" aria-label="Produktprinzipien">
              <SectionLabel>Design-first progressive binding</SectionLabel>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={17} className="mt-0.5 shrink-0 text-brand-primary" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-text-secondary">
                    Bestehende Login-, Entitlement- und Evidenzgrenzen bleiben unverändert.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Activity size={17} className="mt-0.5 shrink-0 text-factor-technical" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-text-secondary">
                    Öffentliche Analyse bleibt über die vorhandene Workbench-Komposition eingebunden.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles size={17} className="mt-0.5 shrink-0 text-brand-accent" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-text-secondary">
                    Zukünftige Datenflächen erscheinen bis zur autorisierten Anbindung nur als neutrale Slots.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section
          data-landing-section="feature-symbol-strip"
          aria-label="CAPITAL-AI Produktbereiche"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {CAPABILITY_CARDS.map(({ title, icon: Icon }) => (
            <article
              key={title}
              className="ui-panel flex min-h-20 items-center gap-3 border-border bg-surface/30 px-4 py-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-primary/20 bg-brand-primary/10 text-brand-primary">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="text-sm font-black text-text-primary">{title}</span>
            </article>
          ))}
        </section>

        <section
          data-landing-section="market-overview-slot"
          aria-labelledby="market-overview-title"
          className="ui-panel border-border bg-surface/25 p-5 sm:p-7"
        >
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-3">
              <SectionLabel>Market Overview</SectionLabel>
              <h2 id="market-overview-title" className="text-2xl font-black text-text-primary">
                Marktübersicht als vorbereitete Integrationsfläche
              </h2>
              <p className="text-sm leading-relaxed text-text-secondary">
                Phase 1 stellt ausschließlich die visuelle Struktur bereit. Live-Marktprojektionen,
                Preise und Provider-Daten werden hier bewusst noch nicht erzeugt oder nachgebildet.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {['Marktbreite', 'Asset-Klassen', 'Live-Projektion'].map((label) => (
                <div
                  key={label}
                  className="flex min-h-28 flex-col justify-between rounded-xl border border-border bg-background/45 p-4"
                >
                  <span className="text-xs font-black text-text-primary">{label}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">
                    Anbindung in separatem Arbeitspaket
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          data-landing-section="core-modules-slot"
          aria-labelledby="core-modules-title"
          className="space-y-5"
        >
          <div className="max-w-3xl space-y-2">
            <SectionLabel>Core Modules</SectionLabel>
            <h2 id="core-modules-title" className="text-2xl font-black text-text-primary sm:text-3xl">
              Klare visuelle Einstiege, bestehende fachliche Grenzen
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {CAPABILITY_CARDS.map(({ title, description, icon: Icon }) => (
              <article key={title} className="ui-panel border-border bg-surface/35 p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-primary/20 bg-brand-primary/10 text-brand-primary">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3 className="text-base font-black text-text-primary">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="analysis-workbench"
          data-landing-section="scoring-analysis-slot"
          aria-labelledby="analysis-workbench-title"
          className="scroll-mt-24 ui-panel border-brand-primary/20 bg-surface/25 p-4 sm:p-6"
        >
          <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl space-y-2">
                <SectionLabel>Scoring & Analyse</SectionLabel>
                <h2 id="analysis-workbench-title" className="text-2xl font-black text-text-primary sm:text-3xl">
                  Enterprise Scorer & Bewertungstools im neuen Landing-Shell
                </h2>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Der öffentliche Enterprise Scorer bleibt über die bestehende Injection-Boundary
                  eingebunden. Lazy Loading, BTC-Fixierung sowie Login- und Entitlement-Grenzen
                  werden durch diesen Design-Slice nicht verändert.
                </p>
              </div>
              <div className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-brand-accent/25 bg-brand-accent/[0.08] px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-text-secondary lg:self-auto">
                <Activity size={13} className="text-brand-accent" aria-hidden="true" />
                BTC · Public Fixed
              </div>
            </div>
            {preview}
          </div>
        </section>

        <section
          data-landing-section="how-it-works"
          aria-labelledby="how-it-works-title"
          className="ui-panel border-border bg-surface/25 p-5 sm:p-7"
        >
          <div className="space-y-2">
            <SectionLabel>How it works</SectionLabel>
            <h2 id="how-it-works-title" className="text-2xl font-black text-text-primary sm:text-3xl">
              Von der Oberfläche zur nachvollziehbaren Analyse
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, description }) => (
              <article key={step} className="rounded-xl border border-border bg-background/45 p-5">
                <span className="font-mono text-xs font-black text-brand-primary">{step}</span>
                <h3 className="mt-4 text-base font-black text-text-primary">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          data-landing-section="trust-and-evidence"
          aria-labelledby="trust-evidence-title"
          className="ui-panel overflow-hidden border-brand-primary/25 bg-gradient-to-br from-brand-primary/10 via-surface/35 to-brand-accent/10 p-5 sm:p-7"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-4xl space-y-3">
              <SectionLabel>Trust & Evidence</SectionLabel>
              <h2 id="trust-evidence-title" className="text-2xl font-black text-text-primary">
                Keine Demo-Werte statt fehlender Evidenz.
              </h2>
              <p className="text-sm leading-relaxed text-text-secondary">
                Fehlende oder nicht freigegebene Finanz-, News- oder Scoring-Daten werden nicht
                durch synthetische Werte ersetzt. Bestehende Runtime-, Login- und
                Berechtigungsgrenzen bleiben führend.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-full border border-border px-3 py-1 text-[10px] font-mono text-text-secondary">
                  Evidence-first
                </span>
                <span className="rounded-full border border-border px-3 py-1 text-[10px] font-mono text-text-secondary">
                  Keine Anlageberatung
                </span>
                <span className="rounded-full border border-border px-3 py-1 text-[10px] font-mono text-text-secondary">
                  No-Demo-Data-Policy
                </span>
              </div>
            </div>
            <a
              href="/login"
              onClick={onLoginNavigate}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-xs font-black uppercase tracking-wider text-background shadow-[0_0_24px_color-mix(in_srgb,var(--color-brand-primary)_26%,transparent)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <LogIn size={15} aria-hidden="true" />
              Anmelden
            </a>
          </div>
        </section>
      </main>

      <footer
        data-landing-section="footer"
        aria-label="CAPITAL-AI Produkt- und Datenschutzinformationen"
        className="relative z-10 mt-4 border-t border-border bg-background/85 px-4 py-8 text-text-primary backdrop-blur-xl"
      >
        <div className="mx-auto max-w-4xl space-y-5 text-center text-xs text-text-secondary">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <div className="flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-2">
              <CapitalAiLogo size={24} showText={false} />
              <span className="font-black uppercase tracking-[0.14em] text-brand-primary">CAPITAL-AI</span>
            </div>
            <span className="rounded-xl border border-border bg-surface/45 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              Öffentliche Analysefläche
            </span>
          </div>
          <h2 className="text-sm font-black text-text-primary sm:text-base">
            CAPITAL-AI – quantitative Multi-Asset-Analyse
          </h2>
          <p className="mx-auto max-w-3xl leading-relaxed">
            CAPITAL-AI dient der Analyse und Bildung und stellt keine Anlageberatung dar. Fehlende
            oder nicht freigegebene Finanzdaten werden nicht durch Demo- oder synthetische Werte
            ersetzt. Die öffentliche Workbench erzeugt keine persistierte anonyme
            Supabase-/IAM-Session.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono">
            <Mail size={12} className="text-brand-primary" aria-hidden="true" />
            <span>Kundenservice:</span>
            <a
              href="mailto:support@capital-ai.online"
              className="font-bold text-brand-primary hover:underline"
            >
              support@capital-ai.online
            </a>
          </div>
          <nav aria-label="Rechtliche Informationen" className="flex flex-wrap justify-center gap-x-4 gap-y-2 font-bold">
            <a className="text-brand-primary hover:underline" href="/datenschutz/">
              Datenschutzerklärung
            </a>
            <a className="text-brand-primary hover:underline" href="/agb/">
              AGB
            </a>
            <a className="text-brand-primary hover:underline" href="/impressum/">
              Impressum
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

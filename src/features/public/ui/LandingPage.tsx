import React from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Compass,
  Database,
  FileText,
  Gauge,
  Globe2,
  LogIn,
  Mail,
  Menu,
  Play,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { CapitalAiLogo } from '../../../shared/branding';
import { NeuralBackground } from '../../../shared/visuals/NeuralBackground';

interface LandingPageProps {
  preview: React.ReactNode;
  newsfeed: React.ReactNode;
  onLoginNavigate?: () => void;
}

const APPLICATION_PILLARS = [
  {
    title: 'Echtzeit-Marktdaten',
    description: 'Globale Daten. Höhere Transparenz.',
    icon: Database,
  },
  {
    title: 'KI-gestützte Analysen',
    description: 'Erklärbar. Fundiert. Transparent.',
    icon: Brain,
  },
  {
    title: 'Für Privatanleger & Professionals',
    description: 'Tools für bessere Entscheidungen.',
    icon: ShieldCheck,
  },
  {
    title: 'Globale Perspektive',
    description: 'Aktien, Krypto, Forex, Rohstoffe, Indizes.',
    icon: Globe2,
  },
] as const;

const FEATURE_SYMBOLS = [
  { title: 'Echtzeit-Daten und Nachrichten', icon: Database },
  { title: 'Transparente KI-Modelle', icon: Brain },
  { title: 'Für Privatanleger und Professionals', icon: Users },
  { title: 'Weltweite Märkte auf einer Plattform', icon: Globe2 },
] as const;

const MARKET_SLOTS = [
  { label: 'Aktien', icon: BarChart3 },
  { label: 'Krypto', icon: Brain },
  { label: 'Indizes', icon: Activity },
  { label: 'Rohstoffe', icon: Compass },
  { label: 'Forex', icon: Globe2 },
] as const;

const CORE_MODULES = [
  {
    title: 'Enterprise Scorer',
    description: 'KI-gestützte Analyse mit transparenter Methodik.',
    icon: Brain,
    accentClass: 'text-brand-accent border-brand-accent/30 bg-brand-accent/10',
  },
  {
    title: 'Buffett Value Check',
    description: 'Bewertung entlang bestehender Value-Prinzipien und Zugriffsgrenzen.',
    icon: Compass,
    accentClass: 'text-brand-primary border-brand-primary/30 bg-brand-primary/10',
  },
  {
    title: 'Vocabulary',
    description: 'Finanzbegriffe, Produktwissen und Lerninhalte zentral erklärt.',
    icon: BookOpen,
    accentClass: 'text-factor-technical border-factor-technical/30 bg-factor-technical/10',
  },
  {
    title: 'Research',
    description: 'Analysen, Evidenz und Marktinsights klar voneinander getrennt.',
    icon: FileText,
    accentClass: 'text-score-best border-score-best/30 bg-score-best/10',
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

function MobileNavigation({ onLoginNavigate }: { onLoginNavigate?: () => void }) {
  return (
    <details className="group relative lg:hidden">
      <summary
        className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-border bg-surface/55 text-text-primary transition hover:border-brand-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        aria-label="Navigation öffnen"
      >
        <Menu size={20} aria-hidden="true" />
      </summary>
      <div className="absolute right-0 top-14 z-50 w-64 rounded-2xl border border-brand-primary/20 bg-background/95 p-3 shadow-2xl backdrop-blur-xl">
        <nav className="grid gap-1 text-sm" aria-label="Mobile Hauptnavigation">
          <a className="min-h-11 rounded-xl px-3 py-3 font-bold hover:bg-surface" href="#produkt">Produkt</a>
          <a className="min-h-11 rounded-xl px-3 py-3 font-bold hover:bg-surface" href="#analysis-workbench">Analysen</a>
          <span className="min-h-11 rounded-xl px-3 py-3 text-text-secondary/55">Preise</span>
          <a className="min-h-11 rounded-xl px-3 py-3 font-bold hover:bg-surface" href="/learning-platform">Learning</a>
          <span className="min-h-11 rounded-xl px-3 py-3 text-text-secondary/55">Über uns</span>
          <a
            className="mt-2 flex min-h-11 items-center justify-center rounded-xl border border-brand-primary/25 bg-brand-primary/10 px-3 py-3 font-black text-brand-primary"
            href="/login"
            onClick={onLoginNavigate}
          >
            Anmelden
          </a>
        </nav>
      </div>
    </details>
  );
}

/**
 * Canonical public landing page for /.
 *
 * The public feature owns presentation only. Application composition supplies cross-feature public
 * surfaces (Newsfeed access + analysis workbench) so the dependency direction remains app -> features.
 * Authentication stays on /login; this component creates no session and defines no scoring/data authority.
 */
export function LandingPage({ preview, newsfeed, onLoginNavigate }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-text-primary selection:bg-brand-primary/30 selection:text-text-primary">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_10%,color-mix(in_srgb,var(--color-brand-primary)_9%,transparent),transparent_30%),radial-gradient(circle_at_90%_20%,color-mix(in_srgb,var(--color-decorative-purple)_8%,transparent),transparent_30%),radial-gradient(circle_at_52%_72%,color-mix(in_srgb,var(--color-decorative-cyan)_4%,transparent),transparent_34%)]" />

      <header className="sticky top-0 z-40 hidden border-b border-brand-primary/20 bg-background/88 backdrop-blur-xl shadow-[0_8px_32px_color-mix(in_srgb,var(--color-brand-primary)_7%,transparent)] md:block">
        <div className="mx-auto flex min-h-20 max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6">
          <a
            href="/"
            className="flex min-h-11 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="CAPITAL-AI Startseite"
          >
            <CapitalAiLogo size={48} showText={false} />
            <span className="grid leading-none">
              <span className="font-display text-lg font-black tracking-tight text-text-primary sm:text-xl">
                Capital-<span className="text-brand-primary">AI</span>
              </span>
              <span className="mt-1 hidden font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-text-secondary sm:block">
                AI-driven market intelligence
              </span>
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
            <span className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-xs font-bold text-text-secondary/55" title="Noch keine kanonische Zielroute freigegeben">
              Preise
            </span>
            <a
              href="/learning-platform"
              className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-xs font-bold text-text-secondary transition hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              Learning
            </a>
            <span className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-xs font-bold text-text-secondary/55" title="Noch keine kanonische Zielroute freigegeben">
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
              className="hidden min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-xs font-black uppercase tracking-wider text-background shadow-[0_0_20px_color-mix(in_srgb,var(--color-brand-primary)_24%,transparent)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary sm:inline-flex"
            >
              <Gauge size={14} aria-hidden="true" />
              Analyse starten
            </a>
            <MobileNavigation onLoginNavigate={onLoginNavigate} />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1480px] space-y-5 px-3 py-4 sm:px-6 sm:py-6 lg:space-y-6">
        <section
          data-landing-section="mobile-mockup-hero"
          aria-label="CAPITAL-AI Mobile Startansicht nach freigegebenem Mockup"
          className="relative left-1/2 aspect-[9/16] w-screen -translate-x-1/2 overflow-hidden bg-[url('/brand/hero/capital-ai-mobile-landing.jpg')] bg-cover bg-top bg-no-repeat shadow-[0_28px_90px_color-mix(in_srgb,var(--color-brand-primary)_10%,transparent)] md:hidden"
        >
          <span className="sr-only">
            Mobile CAPITAL-AI Startansicht. Die dargestellte Grafik ist das freigegebene Layout-Mockup; Finanzdaten und Scoring bleiben an die nachfolgenden kanonischen Laufzeitflächen gebunden.
          </span>
          <a
            href="#analysis-workbench"
            aria-label="Analyse starten"
            className="absolute left-[11%] top-[44.6%] h-[5.4%] w-[45%] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <span className="sr-only">Analyse starten</span>
          </a>
          <a
            href="#core-modules"
            aria-label="Produkt entdecken"
            className="absolute left-[11%] top-[50.4%] h-[4.9%] w-[45%] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <span className="sr-only">Produkt entdecken</span>
          </a>
        </section>

        <section
          data-landing-section="application-description"
          aria-label="CAPITAL-AI Anwendungsbeschreibung"
          className="ui-panel overflow-hidden border-brand-primary/20 bg-surface/30"
        >
          <div className="grid divide-y divide-border/80 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            {APPLICATION_PILLARS.map(({ title, description, icon: Icon }) => (
              <div key={title} className="flex min-h-24 items-center gap-4 px-5 py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-primary/25 bg-brand-primary/10 text-brand-primary">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-text-primary">{title}</h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="border-t border-border/80 px-5 py-3 text-center text-xs leading-relaxed text-text-secondary">
            CAPITAL-AI verbindet Marktinformationen, nachvollziehbare KI-gestützte Analyse- und Scoring-Werkzeuge sowie Research in einer gemeinsamen Multi-Asset-Oberfläche für Aktien, Indizes, Forex, Kryptowährungen und Rohstoffe. Ziel ist eine nachvollziehbare Entscheidungsgrundlage mit erklärbaren KI-Scorings und sichtbar getrennten Evidenz- und Zugriffsgrenzen.
          </p>
        </section>

        <section
          data-landing-section="ai-newsfeed-slot"
          aria-labelledby="ai-newsfeed-title"
          className="ui-panel overflow-hidden border-brand-accent/20 bg-surface/35"
        >
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="h-10 w-1 rounded-full bg-brand-accent shadow-[0_0_20px_color-mix(in_srgb,var(--color-brand-accent)_45%,transparent)]" />
              <div>
                <SectionLabel>AI Newsfeed</SectionLabel>
                <h2 id="ai-newsfeed-title" className="mt-1 text-sm font-black text-text-primary">
                  Kanonischer News-Zugang
                </h2>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            {newsfeed}
          </div>
        </section>

        <section
          id="produkt"
          data-landing-section="hero"
          className="ui-panel relative hidden overflow-hidden border-brand-primary/25 bg-surface/30 shadow-[0_28px_90px_color-mix(in_srgb,var(--color-brand-primary)_8%,transparent)] md:block"
        >
          <NeuralBackground intensity="standard" className="opacity-35" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_74%_48%,color-mix(in_srgb,var(--color-brand-primary)_16%,transparent),transparent_25%),linear-gradient(90deg,color-mix(in_srgb,var(--color-background)_94%,transparent)_0%,color-mix(in_srgb,var(--color-background)_70%,transparent)_55%,transparent_100%)]" />

          <div className="relative grid min-h-[520px] lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="z-10 space-y-6 px-5 py-8 sm:px-8 sm:py-10 lg:px-10 xl:px-12">
              <SectionLabel>Live markets. Real insights.</SectionLabel>

              <div className="space-y-4">
                <h1 className="max-w-3xl font-display text-4xl font-black leading-[1.02] tracking-tight text-text-primary sm:text-5xl lg:text-[3.7rem]">
                  Marktdaten <span className="text-brand-primary">verstehen.</span>
                  <br />
                  Chancen besser erkennen.
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
                  CAPITAL-AI vereint Marktinformationen, KI-gestütztes Scoring und fundierte Analysen – für transparentere Entscheidungen an den globalen Märkten.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#analysis-workbench"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-brand-primary px-6 py-3 text-sm font-black text-background shadow-[0_0_28px_color-mix(in_srgb,var(--color-brand-primary)_30%,transparent)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <BarChart3 size={18} aria-hidden="true" />
                  Analyse starten
                  <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a
                  href="#core-modules"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-brand-primary/35 bg-background/55 px-6 py-3 text-sm font-bold text-text-primary transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <Play size={17} aria-hidden="true" />
                  Produkt entdecken
                </a>
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                {FEATURE_SYMBOLS.slice(0, 2).map(({ title, icon: Icon }) => (
                  <div key={title} className="flex items-center gap-3 text-xs font-bold text-text-secondary">
                    <Icon size={17} className="shrink-0 text-brand-primary" aria-hidden="true" />
                    {title}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex min-h-[390px] items-center justify-center overflow-hidden px-4 pb-7 lg:min-h-full lg:px-0 lg:pb-0">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[url('/brand/hero/capital-ai-earth-hero.svg')] bg-cover bg-[72%_center] bg-no-repeat opacity-95 sm:bg-[68%_center] lg:bg-center"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--color-background)_0%,color-mix(in_srgb,var(--color-background)_58%,transparent)_28%,transparent_68%),radial-gradient(circle_at_72%_48%,transparent_0%,color-mix(in_srgb,var(--color-background)_12%,transparent)_62%,var(--color-background)_100%)]" />
              <p className="absolute bottom-5 right-5 max-w-52 text-right font-mono text-[9px] font-black uppercase tracking-[0.28em] text-text-secondary/80 lg:bottom-8 lg:right-8">
                Globale Intelligenz. Eine bessere Zukunft.
              </p>
            </div>
          </div>

          <div
            data-landing-section="feature-symbol-strip"
            aria-label="CAPITAL-AI Produktbereiche"
            className="relative grid border-t border-border bg-background/55 sm:grid-cols-2 lg:grid-cols-4"
          >
            {FEATURE_SYMBOLS.map(({ title, icon: Icon }) => (
              <div key={title} className="flex min-h-20 items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:border-r sm:[&:nth-child(2)]:border-r-0 sm:[&:nth-child(3)]:border-b-0 lg:border-b-0 lg:[&:nth-child(2)]:border-r lg:[&:nth-child(4)]:border-r-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-primary">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className="text-xs font-bold leading-snug text-text-primary">{title}</span>
              </div>
            ))}
          </div>
        </section>

        <section
          data-landing-section="market-overview-slot"
          aria-labelledby="market-overview-title"
          className="ui-panel overflow-hidden border-border bg-surface/25"
        >
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SectionLabel>Globale Märkte im Überblick</SectionLabel>
              <h2 id="market-overview-title" className="mt-1 text-xl font-black text-text-primary">
                Vorbereitete Live-Marktflächen ohne Demo-Werte
              </h2>
            </div>
            <span className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-brand-primary/25 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-primary sm:self-auto">
              Alle Märkte
              <ArrowRight size={13} aria-hidden="true" />
            </span>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            {MARKET_SLOTS.map(({ label, icon: Icon }) => (
              <article key={label} className="min-h-28 rounded-xl border border-border bg-background/45 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-primary/25 bg-brand-primary/10 text-brand-primary">
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <h3 className="text-xs font-black text-text-primary">{label}</h3>
                </div>
                <div className="mt-5 h-px bg-gradient-to-r from-brand-primary/50 via-decorative-purple/25 to-transparent" />
                <p className="mt-3 font-mono text-[9px] uppercase tracking-wider text-text-secondary">Live-Marktprojektionen: Anbindung folgt in separatem Arbeitspaket</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="core-modules"
          data-landing-section="core-modules-slot"
          aria-labelledby="core-modules-title"
          className="scroll-mt-24 space-y-4"
        >
          <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionLabel>Unsere Kernmodule</SectionLabel>
              <h2 id="core-modules-title" className="mt-1 text-2xl font-black text-text-primary sm:text-3xl">
                Klarer Einstieg in die bestehenden Produktflächen
              </h2>
            </div>
            <span className="inline-flex min-h-11 items-center gap-2 self-start text-xs font-black text-brand-primary sm:self-auto">
              Alle Module ansehen
              <ArrowRight size={14} aria-hidden="true" />
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {CORE_MODULES.map(({ title, description, icon: Icon, accentClass }) => (
              <article key={title} className="ui-panel group min-h-52 border-border bg-surface/35 p-5 transition hover:-translate-y-0.5 hover:border-brand-primary/25">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full border ${accentClass}`}>
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h3 className="text-base font-black text-text-primary">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">{description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-brand-primary">
                  Mehr erfahren
                  <ArrowRight size={13} aria-hidden="true" />
                </span>
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
                  Der öffentliche Enterprise Scorer bleibt über die bestehende Injection-Boundary eingebunden. Lazy Loading, BTC-Fixierung sowie Login- und Entitlement-Grenzen werden durch diesen Design-Slice nicht verändert.
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
                Fehlende oder nicht freigegebene Finanz-, News- oder Scoring-Daten werden nicht durch synthetische Werte ersetzt. Bestehende Runtime-, Login- und Berechtigungsgrenzen bleiben führend.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-full border border-border px-3 py-1 text-[10px] font-mono text-text-secondary">Evidence-first</span>
                <span className="rounded-full border border-border px-3 py-1 text-[10px] font-mono text-text-secondary">Keine Anlageberatung</span>
                <span className="rounded-full border border-border px-3 py-1 text-[10px] font-mono text-text-secondary">No-Demo-Data-Policy</span>
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
        className="relative z-10 mt-4 border-t border-border bg-background/88 px-4 py-8 text-text-primary backdrop-blur-xl"
      >
        <div className="mx-auto max-w-[1480px]">
          <div className="flex flex-col items-center gap-6 text-center text-xs text-text-secondary lg:flex-row lg:justify-between lg:text-left">
            <div className="flex items-center gap-3">
              <CapitalAiLogo size={34} showText={false} />
              <div>
                <p className="font-display text-sm font-black text-text-primary">Capital-<span className="text-brand-primary">AI</span></p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.18em] text-text-secondary">AI-driven market intelligence</p>
              </div>
            </div>

            <div className="max-w-3xl">
              <h2 className="text-sm font-black text-text-primary">CAPITAL-AI – quantitative Multi-Asset-Analyse</h2>
              <p className="mt-2 leading-relaxed">
                CAPITAL-AI dient der Analyse und Bildung und stellt keine Anlageberatung dar. Fehlende oder nicht freigegebene Finanzdaten werden nicht durch Demo- oder synthetische Werte ersetzt. Die öffentliche Workbench erzeugt keine persistierte anonyme Supabase-/IAM-Session.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono lg:justify-end">
                <Mail size={12} className="text-brand-primary" aria-hidden="true" />
                <a href="mailto:support@capital-ai.online" className="font-bold text-brand-primary hover:underline">support@capital-ai.online</a>
              </div>
              <nav aria-label="Rechtliche Informationen" className="flex flex-wrap justify-center gap-x-4 gap-y-2 font-bold lg:justify-end">
                <a className="text-brand-primary hover:underline" href="/datenschutz/">Datenschutzerklärung</a>
                <a className="text-brand-primary hover:underline" href="/agb/">AGB</a>
                <a className="text-brand-primary hover:underline" href="/impressum/">Impressum</a>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

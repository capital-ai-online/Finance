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
  SlidersHorizontal,
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
    description: 'Aktien, Indizes, Forex, Kryptowährungen und Rohstoffe über die vorhandenen Analyseflächen.',
    icon: Compass,
  },
  {
    title: 'Bewertung',
    description: 'Erklärbare Bewertungs- und Scoring-Projektionen auf Basis der jeweils freigegebenen Verträge.',
    icon: BarChart3,
  },
  {
    title: 'Simulation',
    description: 'Backtesting, Stress- und Szenariofunktionen dort, wo der jeweilige Zugriff und Datenvertrag dies erlaubt.',
    icon: SlidersHorizontal,
  },
  {
    title: 'Export',
    description: 'Berichts- und Compliance-Flächen bleiben an ihre bestehenden Berechtigungen und Evidenzgrenzen gebunden.',
    icon: FileText,
  },
] as const;

function WorkbenchActivationState({ onActivate }: { onActivate: () => void }) {
  return (
    <div
      className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border bg-surface/35 px-6 text-center"
      aria-label="Analyse-Workbench auf Abruf"
    >
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/40 bg-brand-primary/10 text-brand-primary">
          <Gauge size={18} aria-hidden="true" />
        </div>
        <p className="text-sm font-bold text-text-primary">Bewertungstools auf Abruf</p>
        <p className="text-xs leading-relaxed text-text-secondary">
          Die rechenintensive Analyse-Workbench und ihre Scoring-Anfragen starten erst nach Ihrer Auswahl.
          Navigation, Anmeldung und die Landingpage bleiben dadurch unabhängig von Analyse-Bundles unmittelbar verfügbar.
        </p>
        <button
          type="button"
          onClick={onActivate}
          className="ui-hit inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-background transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <Gauge size={14} aria-hidden="true" /> Analyse-Workbench starten
        </button>
      </div>
    </div>
  );
}

function DashboardJumpNav({ onAnalysisNavigate }: { onAnalysisNavigate: () => void }) {
  return (
    <nav
      className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider"
      aria-label="Sprungnavigation Startseite"
    >
      <a
        href="#analysis-workbench"
        onClick={onAnalysisNavigate}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-surface/45 px-3 py-2 text-text-secondary transition hover:border-brand-primary/40 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        <Gauge size={12} /> Analyse
      </a>
      <a
        href="#product-access"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-surface/45 px-3 py-2 text-text-secondary transition hover:border-brand-primary/40 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        <ShieldCheck size={12} /> Zugang
      </a>
      <a
        href="/learning-platform"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-surface/45 px-3 py-2 text-text-secondary transition hover:border-brand-primary/40 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        <BookOpen size={12} /> Learning
      </a>
    </nav>
  );
}

/**
 * Canonical public landing page for `/`.
 *
 * The public feature owns presentation only. Application composition supplies the public analysis
 * workbench from src/app so the dependency direction remains app -> features. Authentication stays
 * on `/login`; this component creates no session and defines no scoring/data authority.
 *
 * The visual hierarchy mirrors the authenticated dashboard cockpit, but deliberately does not import
 * authenticated Dashboard composition, browser-side entitlement logic, or legacy financial fallbacks.
 */
export function LandingPage({ preview, onLoginNavigate }: LandingPageProps) {
  const [loadPreview, setLoadPreview] = React.useState(false);
  const activatePreview = React.useCallback(() => setLoadPreview(true), []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-text-primary selection:bg-brand-primary/30 selection:text-text-primary">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,color-mix(in_srgb,var(--color-brand-primary)_12%,transparent),transparent_34%),radial-gradient(circle_at_82%_26%,color-mix(in_srgb,var(--color-brand-accent)_10%,transparent),transparent_30%)]" />

      <header className="sticky top-0 z-40 border-b border-brand-primary/20 bg-background/90 backdrop-blur-xl shadow-[0_8px_32px_color-mix(in_srgb,var(--color-brand-primary)_8%,transparent)]">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="/" className="flex min-h-11 items-center gap-3 rounded-xl" aria-label="CAPITAL-AI Startseite">
            <CapitalAiLogo size={44} showText={false} />
            <span className="flex flex-col leading-none">
              <span className="text-base font-black uppercase tracking-[0.14em] text-brand-primary">CAPITAL-AI</span>
              <span className="mt-1 flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-text-secondary">
                Production Release
                <span className="rounded border border-brand-primary/25 bg-brand-primary/10 px-1.5 py-0.5 font-bold text-brand-primary">
                  Aktiv
                </span>
              </span>
            </span>
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface/45 px-3 py-1.5 lg:flex">
              <Activity size={14} className="text-factor-technical" aria-hidden="true" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">
                Multi-Asset Intelligence
              </span>
            </div>
            <a
              href="mailto:support@capital-ai.online"
              className="hidden min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface/45 px-3 py-2 text-xs font-mono text-text-secondary transition hover:border-brand-primary/30 hover:text-text-primary md:inline-flex"
            >
              <Mail size={13} className="text-brand-primary" />
              support@capital-ai.online
            </a>
            <a
              href="/login"
              onClick={onLoginNavigate}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-xs font-black uppercase tracking-wider text-background shadow-[0_0_20px_color-mix(in_srgb,var(--color-brand-primary)_24%,transparent)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <LogIn size={14} />
              <span className="hidden sm:inline">Anmelden / Registrieren</span>
              <span className="sm:hidden">Login</span>
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <section className="overflow-hidden rounded-2xl border border-brand-primary/25 bg-gradient-to-br from-surface/60 via-background/70 to-brand-accent/10 p-5 shadow-[0_18px_60px_color-mix(in_srgb,var(--color-brand-primary)_8%,transparent)] backdrop-blur-xl sm:p-7">
          <div className="grid gap-7 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary/10 px-3 py-1 text-[10px] font-mono font-black uppercase tracking-[0.2em] text-brand-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                  Was ist CAPITAL-AI
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-success/20 bg-brand-success/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-success">
                  <ShieldCheck size={12} /> Öffentliche Analyse aktiv
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
                  Quantitative Finanzanalyse für Multi-Asset-Screening im CAPITAL-AI Dashboard-Look.
                </h1>
                <p className="max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base">
                  Die Startseite übernimmt die Informationshierarchie und den Cockpit-Charakter des Dashboards:
                  Screening, Bewertung, Analyse und klar erkennbare Zugangsgrenzen. Öffentliche Werkzeuge bleiben
                  ohne persistierte anonyme IAM- oder Supabase-Session nutzbar; geschützte Funktionen behalten ihre
                  bestehenden Login- und Berechtigungsgrenzen.
                </p>
                <p className="max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base">
                  CAPITAL-AI bündelt Markt-, Bewertungs- und Sentiment-Daten zu erklärbaren KI-Scorings für Aktien,
                  Indizes, Forex, Kryptowährungen und Rohstoffe.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CAPABILITY_CARDS.map(({ title, description, icon: Icon }) => (
                  <article key={title} className="rounded-xl border border-border bg-background/45 p-3.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-brand-primary">
                      <Icon size={13} aria-hidden="true" />
                      <h2>{title}</h2>
                    </div>
                    <p className="text-[11px] leading-relaxed text-text-secondary">{description}</p>
                  </article>
                ))}
              </div>

              <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-mono text-text-secondary">
                    Evidence-first
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-mono text-text-secondary">
                    Keine Anlageberatung
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-mono text-text-secondary">
                    No-Demo-Data-Policy
                  </span>
                </div>
                <DashboardJumpNav onAnalysisNavigate={activatePreview} />
              </div>
            </div>

            <aside className="space-y-3 rounded-2xl border border-border bg-background/55 p-4 sm:p-5" aria-label="CAPITAL-AI Schnellzugriff">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-brand-accent" />
                  <h2 className="text-sm font-black text-text-primary">Schnellzugriff</h2>
                </div>
                <span className="rounded border border-brand-primary/20 bg-brand-primary/10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-brand-primary">
                  Public
                </span>
              </div>

              <a
                href="#analysis-workbench"
                onClick={activatePreview}
                className="group flex min-h-11 items-center justify-between rounded-xl border border-border bg-surface/45 p-3 text-xs font-bold text-text-primary transition hover:border-brand-primary/35 hover:bg-surface"
              >
                <span>Bewertungstools öffnen</span>
                <ArrowUpRight size={14} className="text-text-secondary transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-primary" />
              </a>
              <a
                href="/learning-platform"
                className="group flex min-h-11 items-center justify-between rounded-xl border border-border bg-surface/45 p-3 text-xs font-bold text-text-primary transition hover:border-brand-primary/35 hover:bg-surface"
              >
                <span>Learning Platform</span>
                <ArrowUpRight size={14} className="text-text-secondary transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-primary" />
              </a>
              <a
                href="/login"
                onClick={onLoginNavigate}
                className="group flex min-h-11 items-center justify-between rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-3 text-xs font-black text-brand-primary transition hover:bg-brand-primary/15"
              >
                <span>Konto & geschützte Funktionen</span>
                <ArrowUpRight size={14} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>

              <p className="pt-1 text-[11px] leading-relaxed text-text-secondary">
                Die öffentliche Oberfläche zeigt nur freigegebene Inhalte. Login-Pflichten, deaktivierte Module
                und serverseitige Entitlements werden durch diese Landingpage nicht verändert.
              </p>
            </aside>
          </div>
        </section>

        <section
          id="analysis-workbench"
          aria-labelledby="analysis-workbench-title"
          className="scroll-mt-24 rounded-2xl border border-border bg-surface/20 p-4 backdrop-blur-md sm:p-6"
        >
          <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl space-y-2">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary">
                  Dashboard Analysefläche
                </p>
                <h2 id="analysis-workbench-title" className="text-2xl font-black text-text-primary sm:text-3xl">
                  Bewertungstools & Sideboard
                </h2>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Die öffentliche Workbench bleibt die produktive Analysefläche der Landingpage. Sie nutzt dieselben
                  vorhandenen Feature- und Datenverträge, ohne das authentifizierte Legacy-Dashboard als öffentliche
                  Root-Komposition wiederherzustellen.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-background/55 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-text-secondary lg:self-auto">
                <Activity size={13} className="text-factor-technical" />
                On-demand Workbench
              </div>
            </div>

            {loadPreview ? preview : <WorkbenchActivationState onActivate={activatePreview} />}
          </div>
        </section>

        <section
          id="product-access"
          aria-labelledby="product-access-title"
          className="overflow-hidden rounded-2xl border border-brand-primary/30 bg-gradient-to-br from-brand-primary/10 via-surface/35 to-brand-accent/10 p-5 sm:p-7"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary/10 px-3 py-1 text-[10px] font-mono font-black uppercase tracking-wider text-brand-primary">
                <Sparkles size={13} /> Produktzugang
              </div>
              <h2 id="product-access-title" className="text-xl font-black text-text-primary sm:text-2xl">
                Mehr Dashboard-Funktionen über den regulären Konto-Zugang.
              </h2>
              <p className="text-sm leading-relaxed text-text-secondary">
                Persönliche Workspaces, geschützte Analysefunktionen und weitere Produktbereiche bleiben an die
                bestehenden Authentifizierungs- und Berechtigungsverträge gebunden. Die Landingpage stellt diese
                Grenzen sichtbar dar, statt sie clientseitig zu umgehen.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
              <a
                href="/login"
                onClick={onLoginNavigate}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-xs font-black uppercase tracking-wider text-background shadow-[0_0_24px_color-mix(in_srgb,var(--color-brand-primary)_28%,transparent)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <LogIn size={15} /> Anmelden / Registrieren
              </a>
              <a
                href="mailto:support@capital-ai.online"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background/45 px-6 py-3 text-xs font-bold text-text-primary transition hover:border-brand-primary/30 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <Mail size={14} className="text-brand-primary" /> Support kontaktieren
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer
        aria-label="CAPITAL-AI Produkt- und Datenschutzinformationen"
        className="relative z-10 mt-4 border-t border-border bg-background/85 px-4 py-8 text-text-primary backdrop-blur-xl"
      >
        <div className="mx-auto max-w-4xl space-y-5 text-center text-xs text-text-secondary">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <div className="flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-2">
              <CapitalAiLogo size={24} showText={false} />
              <span className="font-black uppercase tracking-[0.14em] text-brand-primary">CAPITAL-AI</span>
            </div>
            <span className="rounded-xl border border-brand-success/20 bg-brand-success/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-success">
              Öffentliche Analyse verfügbar
            </span>
          </div>

          <h2 className="text-sm font-black text-text-primary sm:text-base">
            CAPITAL-AI – quantitative Multi-Asset-Analyse
          </h2>

          <p className="mx-auto max-w-3xl leading-relaxed">
            CAPITAL-AI dient der Analyse und Bildung und stellt keine Anlageberatung dar. Fehlende oder nicht
            freigegebene Finanzdaten werden nicht durch Demo- oder synthetische Werte ersetzt. Die öffentliche
            Workbench erzeugt keine persistierte anonyme Supabase-/IAM-Session.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono">
            <Mail size={12} className="text-brand-primary" />
            <span>Kundenservice:</span>
            <a href="mailto:support@capital-ai.online" className="font-bold text-brand-primary hover:underline">
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

import React from 'react';
import { CapitalAiLogo } from '../../../shared/branding';

interface LandingPageProps {
  preview: React.ReactNode;
  onLoginNavigate?: () => void;
}

function WorkbenchLoadingState() {
  return (
    <div
      className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border bg-surface/35 px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-md space-y-3">
        <div className="mx-auto h-8 w-8 animate-pulse rounded-full border border-brand-primary/40 bg-brand-primary/10" />
        <p className="text-sm font-bold text-text-primary">Bewertungstools werden geladen</p>
        <p className="text-xs leading-relaxed text-text-secondary">
          Die Analyse-Workbench wird erst in Sichtnähe geladen. Navigation und Anmeldung bleiben
          dadurch unabhängig von den Bewertungs-Bundles unmittelbar verfügbar.
        </p>
      </div>
    </div>
  );
}

/**
 * Canonical public landing page for `/`.
 *
 * The public feature owns presentation only. Application composition supplies the public analysis
 * workbench from src/app so the dependency direction remains app -> features. Authentication stays
 * on `/login`; this component creates no session and defines no scoring/data authority.
 */
export function LandingPage({ preview, onLoginNavigate }: LandingPageProps) {
  const previewRef = React.useRef<HTMLElement | null>(null);
  const [loadPreview, setLoadPreview] = React.useState(false);

  React.useEffect(() => {
    const element = previewRef.current;
    if (!element || loadPreview) return;

    if (typeof IntersectionObserver === 'undefined') {
      setLoadPreview(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLoadPreview(true);
          observer.disconnect();
        }
      },
      { rootMargin: '320px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [loadPreview]);

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-brand-primary/30 selection:text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3" aria-label="CAPITAL-AI Startseite">
            <CapitalAiLogo size={44} showText={false} />
            <span>
              <span className="block text-sm font-black tracking-[0.16em] text-brand-primary">CAPITAL-AI</span>
              <span className="block text-[9px] font-mono uppercase tracking-[0.18em] text-text-secondary">
                Multi-Asset Intelligence
              </span>
            </span>
          </a>

          <nav className="flex items-center gap-2" aria-label="Hauptnavigation">
            <a
              href="#analysis-workbench"
              className="hidden min-h-11 items-center rounded-lg px-3 py-2 text-xs font-bold text-text-secondary transition hover:text-text-primary sm:inline-flex"
            >
              Bewertungstools
            </a>
            <a
              href="/learning-platform"
              className="hidden min-h-11 items-center rounded-lg px-3 py-2 text-xs font-bold text-text-secondary transition hover:text-text-primary md:inline-flex"
            >
              Learning
            </a>
            <a
              href="/login"
              onClick={onLoginNavigate}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-primary/35 bg-brand-primary/10 px-4 py-2 text-xs font-black text-brand-primary transition hover:bg-brand-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              Anmelden / Registrieren
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:pb-24 sm:pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--color-brand-primary)_14%,transparent),transparent_48%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div className="max-w-3xl space-y-6">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-brand-primary">
                Evidence-first · Multi-Asset · Explainable
              </p>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
                Quantitative Marktanalyse mit den CAPITAL-AI Bewertungstools.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
                CAPITAL-AI bündelt Markt-, Bewertungs- und Sentiment-Daten zu erklärbaren
                KI-Scorings für Aktien, Indizes, Forex, Kryptowährungen und Rohstoffe. Die
                öffentliche Landingpage stellt die produktiven Bewertungstools wieder über ein
                Sideboard bereit, ohne einen anonymen IAM- oder Supabase-Login zu erzeugen.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#analysis-workbench"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-black text-background transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  Bewertungstools öffnen
                </a>
                <a
                  href="/login"
                  onClick={onLoginNavigate}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface/50 px-5 py-2.5 text-sm font-bold text-text-primary transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  Konto öffnen
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ['Bewertung & Scoring', 'Enterprise Scorer, Rankings und fachlich freigegebene Bewertungsflächen.'],
                ['Screening & Analyse', 'Multi-Asset-Screening über vorhandene kanonische Feature- und Evidence-Verträge.'],
                ['Governed Access', 'Serverseitige Entitlements, Login-Gates und aktuelle Deaktivierungen bleiben unverändert wirksam.'],
              ].map(([title, description]) => (
                <article key={title} className="rounded-2xl border border-border bg-surface/45 p-5">
                  <h2 className="text-sm font-black text-brand-primary">{title}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="analysis-workbench"
          ref={previewRef}
          aria-labelledby="analysis-workbench-title"
          className="scroll-mt-20 border-y border-border bg-surface/20 px-4 py-12 sm:py-16"
        >
          <div className="mx-auto max-w-[1480px] space-y-6">
            <div className="max-w-4xl space-y-2">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary">
                Öffentliche Analyse-Workbench
              </p>
              <h2 id="analysis-workbench-title" className="text-2xl font-black text-text-primary sm:text-3xl">
                Bewertungstools & Sideboard
              </h2>
              <p className="text-sm leading-relaxed text-text-secondary">
                Das Sideboard stellt die etablierten Analyse- und Bewertungsflächen wieder auffindbar bereit.
                Nur fachlich öffentliche Tools werden direkt geladen; serverseitige Entitlements, Login-Gates und
                explizit deaktivierte Module werden nicht clientseitig umgangen.
              </p>
            </div>

            {loadPreview ? preview : <WorkbenchLoadingState />}
          </div>
        </section>
      </main>

      <footer
        aria-label="CAPITAL-AI Produkt- und Datenschutzinformationen"
        className="border-t border-border bg-background px-4 py-8 text-text-primary"
      >
        <div className="mx-auto max-w-7xl space-y-3 text-xs text-text-secondary">
          <h2 className="text-sm font-black text-text-primary">
            CAPITAL-AI – quantitative Multi-Asset-Analyse
          </h2>
          <p className="max-w-4xl leading-relaxed">
            CAPITAL-AI dient der Analyse und Bildung und stellt keine Anlageberatung dar. Die
            öffentliche Workbench erzeugt keine persistierte anonyme Supabase-/IAM-Session.
          </p>
          <nav
            aria-label="Rechtliche Informationen"
            className="flex flex-wrap gap-x-4 gap-y-2 font-bold"
          >
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

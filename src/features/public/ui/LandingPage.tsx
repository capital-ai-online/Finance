import React from 'react';

interface LandingPageProps {
  clearJustLoggedOut: () => void;
  handleLogin: (email: string, password: string) => Promise<void>;
  handleRegister: (name: string, email: string, password: string) => Promise<void>;
}

const LazyCryptoScoringEnterprise = React.lazy(async () => {
  const module = await import('../../crypto/ui/CryptoScoringEnterprise');
  return { default: module.CryptoScoringEnterprise };
});

const PUBLIC_VISITOR_SESSION = {
  type: 'guest' as const,
  name: 'Öffentliche Vorschau',
  email: '',
  subscriptionTier: 'Free' as const,
};

function ScorerLoadingState() {
  return (
    <div
      className="flex min-h-[420px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025] px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-md space-y-3">
        <div className="mx-auto h-8 w-8 animate-pulse rounded-full border border-aif-gold-DEFAULT/40 bg-aif-gold-DEFAULT/10" />
        <p className="text-sm font-bold text-white/80">Enterprise Scorer wird bei Bedarf geladen</p>
        <p className="text-xs leading-relaxed text-white/45">
          Die rechenintensive Analyseoberfläche wird bewusst erst nachgeladen, wenn sie in den
          sichtbaren Bereich kommt. Dadurch bleibt die öffentliche Seite sofort bedienbar.
        </p>
      </div>
    </div>
  );
}

/**
 * Canonical public landing page for `/`.
 *
 * PERFORMANCE-2026-08-29:
 * - The public route must never import the authenticated legacy Dashboard monolith.
 * - The Enterprise Scorer remains available as the limited public product preview, but is loaded
 *   only when its section approaches the viewport.
 * - Authentication remains exclusively owned by `/login`; this shell never creates or persists a
 *   Supabase/IAM session.
 */
export function LandingPage(props: LandingPageProps) {
  const previewRef = React.useRef<HTMLElement | null>(null);
  const [loadPreview, setLoadPreview] = React.useState(false);
  const [selectedSymbol, setSelectedSymbol] = React.useState('BTC');
  const [timeframe, setTimeframe] = React.useState('1 tag');

  React.useEffect(() => {
    const element = previewRef.current;
    if (!element || loadPreview) return;

    if (typeof IntersectionObserver === 'undefined') {
      setLoadPreview(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setLoadPreview(true);
          observer.disconnect();
        }
      },
      { rootMargin: '320px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [loadPreview]);

  // Keep the established AppRoutes callback contract without moving authentication into `/`.
  void props;
  void PUBLIC_VISITOR_SESSION;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-aif-gold-DEFAULT/30 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3" aria-label="CAPITAL-AI Startseite">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-aif-gold-DEFAULT/35 bg-aif-gold-DEFAULT/10 font-black text-aif-gold-DEFAULT">
              C
            </span>
            <span>
              <span className="block text-sm font-black tracking-[0.16em]">CAPITAL-AI</span>
              <span className="block text-[9px] font-mono uppercase tracking-[0.18em] text-white/40">
                Multi-Asset Intelligence
              </span>
            </span>
          </a>

          <nav className="flex items-center gap-2" aria-label="Hauptnavigation">
            <a
              href="#enterprise-scorer"
              className="hidden rounded-lg px-3 py-2 text-xs font-bold text-white/60 transition hover:text-white sm:inline-flex"
            >
              Scorer
            </a>
            <a
              href="/login"
              onClick={() => props.clearJustLoggedOut()}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-aif-gold-DEFAULT/35 bg-aif-gold-DEFAULT/10 px-4 py-2 text-xs font-black text-aif-gold-DEFAULT transition hover:bg-aif-gold-DEFAULT/15"
            >
              Anmelden / Registrieren
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:pb-24 sm:pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,196,83,0.12),transparent_48%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div className="max-w-3xl space-y-6">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-aif-gold-DEFAULT">
                Evidence-first · Multi-Asset · Explainable
              </p>
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Quantitative Marktanalyse ohne unnötige Wartezeit.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-white/62 sm:text-lg">
                CAPITAL-AI bündelt Markt-, Bewertungs- und Sentiment-Daten zu erklärbaren
                KI-Scorings für Aktien, Indizes, Forex, Kryptowährungen und Rohstoffe. Die
                öffentliche Landingpage zeigt den Enterprise Scorer als limitierte Vorschau ohne
                Anmeldung.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#enterprise-scorer"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-aif-gold-DEFAULT px-5 py-2.5 text-sm font-black text-black transition hover:brightness-110"
                >
                  Enterprise Scorer ansehen
                </a>
                <a
                  href="/login"
                  onClick={() => props.clearJustLoggedOut()}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Konto öffnen
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ['Multi-Asset', 'Ein gemeinsamer Analysezugang für mehrere Assetklassen.'],
                ['Evidence-first', 'Verifizierbare Quellen und Provenienz statt erfundener Marktdaten.'],
                ['Governance', 'Nachvollziehbare Scoring-, Sicherheits- und Freigabegrenzen.'],
              ].map(([title, description]) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <h2 className="text-sm font-black text-aif-gold-DEFAULT">{title}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-white/48">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="enterprise-scorer"
          ref={previewRef}
          className="scroll-mt-20 border-y border-white/10 bg-neutral-950/70 px-4 py-12 sm:py-16"
        >
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="max-w-3xl space-y-2">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-aif-gold-DEFAULT">
                Öffentliche Produktvorschau
              </p>
              <h2 className="text-2xl font-black sm:text-3xl">Enterprise Scorer</h2>
              <p className="text-sm leading-relaxed text-white/50">
                Der Scorer wird erst in Sichtnähe geladen. Das reduziert initiales JavaScript und
                hält Navigation und Anmeldung auch auf mobilen Geräten reaktionsfähig.
              </p>
            </div>

            {loadPreview ? (
              <React.Suspense fallback={<ScorerLoadingState />}>
                <LazyCryptoScoringEnterprise
                  selectedSymbol={selectedSymbol}
                  onSelectSymbol={setSelectedSymbol}
                  timeframe={timeframe}
                  onChangeTimeframe={setTimeframe}
                />
              </React.Suspense>
            ) : (
              <ScorerLoadingState />
            )}
          </div>
        </section>
      </main>

      <footer
        aria-label="CAPITAL-AI Produkt- und Datenschutzinformationen"
        className="border-t border-white/10 bg-black px-4 py-8 text-white"
      >
        <div className="mx-auto max-w-7xl space-y-3 text-xs text-white/60">
          <h2 className="text-sm font-black text-white">
            CAPITAL-AI – quantitative Multi-Asset-Analyse
          </h2>
          <p className="max-w-4xl leading-relaxed">
            CAPITAL-AI dient der Analyse und Bildung und stellt keine Anlageberatung dar. Die
            öffentliche Vorschau verwendet keine persistierte anonyme Supabase-/IAM-Session.
          </p>
          <nav
            aria-label="Rechtliche Informationen"
            className="flex flex-wrap gap-x-4 gap-y-2 font-bold"
          >
            <a className="text-aif-gold-DEFAULT hover:underline" href="/datenschutz/">
              Datenschutzerklärung
            </a>
            <a className="text-aif-gold-DEFAULT hover:underline" href="/agb/">
              AGB
            </a>
            <a className="text-aif-gold-DEFAULT hover:underline" href="/impressum/">
              Impressum
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
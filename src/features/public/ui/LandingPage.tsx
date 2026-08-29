import React from 'react';
import type { UserSession } from '../../../app/types/UserSession';

interface LandingPageProps {
  clearJustLoggedOut: () => void;
  handleLogin: (email: string, password: string) => Promise<void>;
  handleRegister: (name: string, email: string, password: string) => Promise<void>;
}

const LazyDashboard = React.lazy(async () => {
  const module = await import('../../../app/dashboard/Dashboard');
  return { default: module.Dashboard };
});

/**
 * Presentation-only visitor state for the public landing page.
 *
 * This value is never persisted and never represents a Supabase/IAM session. Keeping the email
 * empty prevents account-, billing- or profile-specific hydration for anonymous visitors.
 */
const PUBLIC_VISITOR_SESSION: UserSession = {
  type: 'guest',
  name: 'Öffentliche Vorschau',
  email: '',
  subscriptionTier: 'Free',
};

function DashboardLoadingState() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white"
      role="status"
      aria-live="polite"
    >
      <div className="space-y-3">
        <div className="mx-auto h-8 w-8 animate-pulse rounded-full border border-aif-gold-DEFAULT/40 bg-aif-gold-DEFAULT/10" />
        <p className="text-sm font-bold text-white/80">CAPITAL-AI wird geladen</p>
      </div>
    </main>
  );
}

/**
 * Canonical public landing page for `/`.
 *
 * The productive Dashboard remains the single functional landing-page authority. It is loaded
 * through a React.lazy boundary so the public entry chunk does not statically absorb the complete
 * Dashboard/Scorer dependency graph. This changes loading behavior only; it does not introduce a
 * second landing page or a reduced public shell.
 *
 * Authentication itself is a separate page at `/login`, reached from the dashboard's lower-left
 * login action.
 */
export function LandingPage({
  clearJustLoggedOut,
  handleLogin,
  handleRegister,
}: LandingPageProps) {
  return (
    <>
      <React.Suspense fallback={<DashboardLoadingState />}>
        <LazyDashboard
          userSession={PUBLIC_VISITOR_SESSION}
          onLogout={() => undefined}
          onRegister={() => undefined}
          onLoginEmail={async (email, password) => {
            clearJustLoggedOut();
            await handleLogin(email, password);
          }}
          onRegisterEmail={async (name, email, password) => {
            clearJustLoggedOut();
            await handleRegister(name, email, password);
          }}
        />
      </React.Suspense>

      <footer
        aria-label="CAPITAL-AI Produkt- und Datenschutzinformationen"
        className="border-t border-white/10 bg-black px-4 py-8 text-white"
      >
        <div className="mx-auto max-w-7xl space-y-3 text-xs text-white/60">
          <h2 className="text-sm font-black text-white">
            CAPITAL-AI – quantitative Multi-Asset-Analyse
          </h2>
          <p className="max-w-4xl leading-relaxed">
            CAPITAL-AI bündelt Markt-, Bewertungs- und Sentiment-Daten zu erklärbaren KI-Scorings
            für Aktien, Indizes, Forex, Kryptowährungen und Rohstoffe. Die öffentliche Landingpage
            zeigt den Enterprise Scorer als limitierte Vorschau ohne Anmeldung. CAPITAL-AI dient
            der Analyse und Bildung und stellt keine Anlageberatung dar.
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
    </>
  );
}

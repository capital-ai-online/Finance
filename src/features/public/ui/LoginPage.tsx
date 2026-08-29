import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { isNativePasskeyLoginEnabled } from '../../../lib/authFeatureFlags';
import { CapitalAiLogo } from '../../../shared/branding/CapitalAiLogo';
import { PasskeyLoginPanel } from './PasskeyLoginPanel';

interface LoginPageProps {
  /**
   * Kept temporarily for route-interface compatibility. Password authentication is intentionally
   * disabled and this callback is never invoked from the canonical login page.
   */
  onLoginEmail: (email: string, password: string) => Promise<void>;
  justLoggedOut?: boolean;
}

/**
 * Canonical authentication page for `/login`.
 *
 * Password authentication and password recovery are deliberately absent. Native Supabase passkeys
 * are the preferred first-party authentication method; Google OAuth remains a federated fallback.
 * Every successful primary authentication still converges on the native Supabase AAL/MFA gate.
 */
export function LoginPage({ justLoggedOut }: LoginPageProps) {
  const nativePasskeyEnabled = isNativePasskeyLoginEnabled();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    if (!supabase) {
      setError('Supabase ist nicht konfiguriert. Google-Anmeldung ist nicht möglich.');
      return;
    }

    setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (oauthError) throw oauthError;
      // A successful OAuth start redirects away from this page. Keep the control disabled.
    } catch (err: any) {
      console.warn('[Auth] Google OAuth start failed:', err);
      setError(err?.message || 'Google-Anmeldung konnte nicht gestartet werden.');
      setLoading(false);
    }
  };

  return (
    <main
      role="main"
      id="main-content"
      className="relative min-h-screen overflow-y-auto bg-black px-4 py-10 text-white selection:bg-aif-gold-DEFAULT selection:text-black sm:px-6"
    >
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <a
          href="/"
          className="mb-6 inline-flex text-xs font-bold text-white/50 transition-colors hover:text-aif-gold-DEFAULT"
        >
          ← Zurück zur Landingpage
        </a>

        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <aside
            className="order-2 mx-auto w-full max-w-xl space-y-5 lg:order-1 lg:mx-0"
            aria-label="Webinhalte und Funktionsübersicht"
          >
            <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-brand-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(249,191,33,0.55)]" />
              <span>Finanzanalyse-Plattform</span>
            </div>
            <h1 className="text-balance text-2xl font-black leading-tight text-white sm:text-3xl">
              Multi-Asset-Analyse mit erklärbaren KI-Scorings
            </h1>
            <p className="text-sm leading-relaxed text-white/60">
              CAPITAL-AI screent Aktien, Indizes, Forex, Krypto und Rohstoffe, berechnet quantitative
              Scorings und liefert nachvollziehbare, geprüfte Analysen. Mit einem Konto speichern Sie
              Watchlists, erhalten den Realtime-Newsfeed und schalten Backtesting frei.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-xs text-white/55">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-aif-gold-DEFAULT" />
                <span>Fundamentale Bewertung (Graham, DCF)</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-white/55">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-aif-gold-DEFAULT" />
                <span>Backtesting &amp; Stressszenarien</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-white/55">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-aif-gold-DEFAULT" />
                <span>PDF-/CSV-Exporte für Compliance</span>
              </li>
            </ul>
          </aside>

          <div className="order-1 mx-auto w-full max-w-md space-y-5 lg:order-2">
            <div className="relative overflow-hidden rounded-2xl p-[2px] shadow-2xl">
              <div
                aria-hidden="true"
                className="absolute inset-[-180%] bg-[conic-gradient(from_0deg,var(--color-brand-primary)_0deg,var(--color-brand-accent)_180deg,var(--color-brand-primary)_360deg)] animate-[spin_8s_linear_infinite] motion-reduce:animate-none"
              />
              <section className="relative z-10 rounded-[14px] bg-[#06070B]/95 p-6 backdrop-blur-2xl sm:p-8">
                <div className="mb-6 flex flex-col items-center text-center">
                  <CapitalAiLogo size={110} showText={true} />
                  <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
                    Sichere passwordless Anmeldung
                  </p>
                </div>

                {justLoggedOut && (
                  <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                    <CheckCircle2 size={15} />
                    Erfolgreich abgemeldet.
                  </div>
                )}

                {error && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {nativePasskeyEnabled ? (
                    <PasskeyLoginPanel />
                  ) : (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs leading-relaxed text-rose-200">
                      Der native Passkey-Login ist in diesem Build nicht aktiviert. Der Zugriff bleibt
                      fail-closed; verwenden Sie nur den freigegebenen federierten Fallback.
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">
                      Föderierter Fallback
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleLogin}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-xs font-bold text-neutral-800 shadow-sm transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Mit Google anmelden"
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.83z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.39 24 12 24z" />
                      <path fill="#FBBC05" d="M5.32 14.24A7.16 7.16 0 0 1 5 12c0-.79.13-1.57.32-2.34V6.51H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.11-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.18 2.12 1.21 5.39l4.11 3.15c.94-2.85 3.57-4.96 6.68-4.96z" />
                    </svg>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    <span>Mit Google anmelden</span>
                  </button>

                  <p className="text-center text-[10px] leading-relaxed text-white/35">
                    Passwort-Anmeldung und Passwort-Reset sind deaktiviert. Primär wird ein nativer,
                    hCaptcha-gebundener Supabase-Passkey verwendet. Nach jeder erfolgreichen
                    Primäranmeldung bleibt das native Supabase-AAL-/MFA-Gate verpflichtend.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

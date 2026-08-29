import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { isNativePasskeyLoginEnabled } from '../../../lib/authFeatureFlags';
import { requestHcaptchaToken } from '../../../lib/hcaptcha';
import { CapitalAiLogo } from '../../../shared/branding/CapitalAiLogo';
import { PasskeyLoginPanel } from './PasskeyLoginPanel';

interface LoginPageProps {
  /**
   * Kept temporarily for route-interface compatibility. Canonical primary authentication is
   * handled on this page directly through Supabase Auth so email/password, passkey and OAuth use
   * the same provider/session authority before converging on SessionComposition onboarding/AAL.
   */
  onLoginEmail: (email: string, password: string) => Promise<void>;
  justLoggedOut?: boolean;
}

type EmailAuthMode = 'login' | 'register';
type ActiveAction = 'email' | 'google' | null;

/**
 * Canonical authentication page for `/login`.
 *
 * Supported primary authentication methods are email/password, native Supabase passkeys and
 * Google OAuth. New email/password registrations are allowed and then converge on the same
 * RegistrationCompletionGate and native AAL/MFA gate as OAuth-created accounts. CAPTCHA remains
 * fail-closed for password and passkey Auth requests; Google OAuth uses Supabase's provider flow.
 */
export function LoginPage({ justLoggedOut }: LoginPageProps) {
  const nativePasskeyEnabled = isNativePasskeyLoginEnabled();
  const [mode, setMode] = useState<EmailAuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (nextMode: EmailAuthMode) => {
    setMode(nextMode);
    setError(null);
    setNotice(null);
  };

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!supabase) {
      setError('Supabase ist nicht konfiguriert. Anmeldung und Registrierung sind nicht möglich.');
      return;
    }

    const normalizedEmail = email.trim();
    const normalizedName = name.trim();
    if (!normalizedEmail || !password) {
      setError('Bitte E-Mail-Adresse und Passwort eingeben.');
      return;
    }
    if (mode === 'register' && !normalizedName) {
      setError('Bitte einen Namen für das Konto eingeben.');
      return;
    }
    if (mode === 'register' && password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    setActiveAction('email');
    try {
      const captchaToken = await requestHcaptchaToken();

      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
          options: { captchaToken },
        });
        if (signInError) throw signInError;
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: normalizedName },
          captchaToken,
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        setNotice('Registrierung erfolgreich. Das Konto wird jetzt sicher eingerichtet.');
      } else {
        setNotice(
          'Registrierung erfolgreich. Bitte bestätige die E-Mail-Adresse über den zugesandten Link und melde dich anschließend an.',
        );
      }
    } catch (err: any) {
      console.warn(`[Auth] ${mode === 'login' ? 'Password login' : 'Registration'} failed:`, err);
      setError(
        err?.message ||
          (mode === 'login'
            ? 'Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen und erneut versuchen.'
            : 'Registrierung konnte nicht abgeschlossen werden.'),
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setNotice(null);
    if (!supabase) {
      setError('Supabase ist nicht konfiguriert. Google-Anmeldung ist nicht möglich.');
      return;
    }

    setActiveAction('google');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (oauthError) throw oauthError;
      // A successful OAuth start redirects away from this page. Keep controls disabled until then.
    } catch (err: any) {
      console.warn('[Auth] Google OAuth start failed:', err);
      setError(err?.message || 'Google-Anmeldung konnte nicht gestartet werden.');
      setActiveAction(null);
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
                    Sichere Kontoanmeldung
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

                {notice && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                    <span>{notice}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/30 p-1">
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      disabled={activeAction !== null}
                      className={`min-h-10 rounded-lg px-3 text-xs font-bold transition ${
                        mode === 'login'
                          ? 'bg-aif-gold-DEFAULT text-black'
                          : 'text-white/55 hover:bg-white/5 hover:text-white'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      Anmelden
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      disabled={activeAction !== null}
                      className={`min-h-10 rounded-lg px-3 text-xs font-bold transition ${
                        mode === 'register'
                          ? 'bg-aif-gold-DEFAULT text-black'
                          : 'text-white/55 hover:bg-white/5 hover:text-white'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      Registrieren
                    </button>
                  </div>

                  <form onSubmit={handleEmailAuth} className="space-y-3" aria-label="E-Mail Kontoanmeldung">
                    {mode === 'register' && (
                      <div className="space-y-1.5">
                        <label htmlFor="auth-name" className="text-[10px] font-bold uppercase tracking-widest text-white/55">
                          Name
                        </label>
                        <input
                          id="auth-name"
                          type="text"
                          autoComplete="name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          required
                          disabled={activeAction !== null}
                          className="min-h-11 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-aif-gold-DEFAULT/60 focus:ring-1 focus:ring-aif-gold-DEFAULT/30 disabled:opacity-50"
                          placeholder="Vor- und Nachname"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label htmlFor="auth-email" className="text-[10px] font-bold uppercase tracking-widest text-white/55">
                        E-Mail-Adresse
                      </label>
                      <input
                        id="auth-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        disabled={activeAction !== null}
                        className="min-h-11 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-aif-gold-DEFAULT/60 focus:ring-1 focus:ring-aif-gold-DEFAULT/30 disabled:opacity-50"
                        placeholder="name@example.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="auth-password" className="text-[10px] font-bold uppercase tracking-widest text-white/55">
                        Passwort
                      </label>
                      <input
                        id="auth-password"
                        type="password"
                        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                        minLength={mode === 'register' ? 8 : undefined}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        disabled={activeAction !== null}
                        className="min-h-11 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-aif-gold-DEFAULT/60 focus:ring-1 focus:ring-aif-gold-DEFAULT/30 disabled:opacity-50"
                        placeholder="••••••••"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={activeAction !== null}
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-aif-gold-DEFAULT px-4 py-3 text-xs font-black text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {activeAction === 'email' && <Loader2 size={16} className="animate-spin" />}
                      {mode === 'login' ? 'Mit E-Mail anmelden' : 'Normales Nutzerkonto registrieren'}
                    </button>
                  </form>

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">
                      Weitere Anmeldeoptionen
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  {nativePasskeyEnabled ? (
                    <PasskeyLoginPanel />
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/50">
                      Der native Passkey-Login ist in diesem Build nicht aktiviert. E-Mail/Passwort
                      und Google OAuth bleiben als reguläre Anmeldewege verfügbar.
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={activeAction !== null}
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
                    {activeAction === 'google' ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    <span>Mit Google anmelden</span>
                  </button>

                  <p className="text-center text-[10px] leading-relaxed text-white/35">
                    E-Mail/Passwort, Passkey und Google werden durch Supabase Auth verwaltet. Neue
                    Konten durchlaufen anschließend die bestehende Profil-, Datenschutz- und
                    MFA-Einrichtung; vorhandene MFA-Konten behalten ihr AAL2-Step-up.
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

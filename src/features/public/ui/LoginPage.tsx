import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { requestHcaptchaToken } from '../../../lib/hcaptcha';
import {
  PASSWORD_RECOVERY_QUERY_PARAM,
  isPasswordRecoveryLocation,
} from '../auth/passwordRecovery';
import { CapitalAiLogo } from '../../../shared/branding/CapitalAiLogo';

interface LoginPageProps {
  /**
   * Kept temporarily for route-interface compatibility. Canonical primary authentication is
   * handled on this page directly through Supabase Auth. Email/password and Google OAuth converge
   * on SessionComposition, which applies onboarding and AAL/MFA before protected application use.
   */
  onLoginEmail: (email: string, password: string) => Promise<void>;
  justLoggedOut?: boolean;
}

type EmailAuthMode = 'login' | 'register';
type ActiveAction = 'email' | 'google' | 'recovery-request' | 'recovery-update' | null;

/**
 * Canonical authentication page for `/login`.
 *
 * Primary authentication is email/password or Google OAuth. WebAuthn passkeys configured by an
 * authenticated user in Settings are deliberately AAL2 MFA factors, not a primary-login option.
 * CAPTCHA remains fail-closed for password authentication, self-registration and password-reset
 * requests. Password-recovery sessions are confined to this public shell and signed out after the
 * password update so the next login still traverses the normal onboarding/AAL gates.
 */
export function LoginPage({ justLoggedOut }: LoginPageProps) {
  const [mode, setMode] = useState<EmailAuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [confirmRecoveryPassword, setConfirmRecoveryPassword] = useState('');
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(() => isPasswordRecoveryLocation());
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !isRecoveryFlow) return;

    let cancelled = false;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (cancelled) return;
      if (sessionError || !data.session) {
        setError(
          'Der Passwort-Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.',
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isRecoveryFlow]);

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
          emailRedirectTo: `${window.location.origin}/`,
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

  const handlePasswordRecoveryRequest = async () => {
    setError(null);
    setNotice(null);

    if (!supabase) {
      setError('Supabase ist nicht konfiguriert. Passwort-Wiederherstellung ist nicht möglich.');
      return;
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('Bitte zuerst die E-Mail-Adresse des Kontos eingeben.');
      return;
    }

    setActiveAction('recovery-request');
    try {
      const captchaToken = await requestHcaptchaToken();
      const redirectTo = `${window.location.origin}/login?${PASSWORD_RECOVERY_QUERY_PARAM}=1`;
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo,
        captchaToken,
      });
      if (recoveryError) throw recoveryError;

      setNotice(
        'Wenn für diese E-Mail ein Konto existiert, wurde ein Link zum Setzen eines Passworts versendet.',
      );
    } catch (err: any) {
      console.warn('[Auth] Password recovery request failed:', err);
      setError(err?.message || 'Der Passwort-Link konnte nicht angefordert werden.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleRecoveryPasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!supabase) {
      setError('Supabase ist nicht konfiguriert. Das Passwort kann nicht aktualisiert werden.');
      return;
    }
    if (recoveryPassword.length < 8) {
      setError('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (recoveryPassword !== confirmRecoveryPassword) {
      setError('Die beiden Passwörter stimmen nicht überein.');
      return;
    }

    setActiveAction('recovery-update');
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Der Passwort-Link ist ungültig oder abgelaufen.');
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: recoveryPassword });
      if (updateError) throw updateError;

      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) throw signOutError;

      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete(PASSWORD_RECOVERY_QUERY_PARAM);
      window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search);
      setIsRecoveryFlow(false);
      setRecoveryPassword('');
      setConfirmRecoveryPassword('');
      setPassword('');
      setNotice(
        'Passwort gespeichert. Bitte melde dich jetzt regulär mit E-Mail und Passwort an; vorhandene MFA-Prüfungen bleiben aktiv.',
      );
    } catch (err: any) {
      console.warn('[Auth] Password recovery update failed:', err);
      setError(err?.message || 'Das Passwort konnte nicht gespeichert werden.');
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
          redirectTo: `${window.location.origin}/`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (oauthError) throw oauthError;
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
                    {isRecoveryFlow ? 'Passwort sicher setzen' : 'Sichere Kontoanmeldung'}
                  </p>
                </div>

                {justLoggedOut && !isRecoveryFlow && (
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

                {isRecoveryFlow ? (
                  <form onSubmit={handleRecoveryPasswordUpdate} className="space-y-3" aria-label="Neues Passwort setzen">
                    <p className="text-xs leading-relaxed text-white/55">
                      Setze ein neues Passwort für dieses verifizierte Konto. Danach wird die
                      temporäre Recovery-Sitzung beendet und die nächste Anmeldung läuft wieder
                      vollständig durch die vorhandenen Sicherheitsprüfungen.
                    </p>
                    <div className="space-y-1.5">
                      <label htmlFor="recovery-password" className="text-[10px] font-bold uppercase tracking-widest text-white/55">
                        Neues Passwort
                      </label>
                      <input
                        id="recovery-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        value={recoveryPassword}
                        onChange={(event) => setRecoveryPassword(event.target.value)}
                        required
                        disabled={activeAction !== null}
                        className="min-h-11 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-aif-gold-DEFAULT/60 focus:ring-1 focus:ring-aif-gold-DEFAULT/30 disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="recovery-password-confirm" className="text-[10px] font-bold uppercase tracking-widest text-white/55">
                        Passwort bestätigen
                      </label>
                      <input
                        id="recovery-password-confirm"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        value={confirmRecoveryPassword}
                        onChange={(event) => setConfirmRecoveryPassword(event.target.value)}
                        required
                        disabled={activeAction !== null}
                        className="min-h-11 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-aif-gold-DEFAULT/60 focus:ring-1 focus:ring-aif-gold-DEFAULT/30 disabled:opacity-50"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={activeAction !== null}
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-aif-gold-DEFAULT px-4 py-3 text-xs font-black text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {activeAction === 'recovery-update' && <Loader2 size={16} className="animate-spin" />}
                      Passwort speichern
                    </button>
                  </form>
                ) : (
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

                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={handlePasswordRecoveryRequest}
                        disabled={activeAction !== null}
                        className="w-full text-center text-[11px] text-white/45 transition-colors hover:text-aif-gold-DEFAULT disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {activeAction === 'recovery-request'
                          ? 'Passwort-Link wird angefordert…'
                          : 'Passwort vergessen oder noch kein Passwort gesetzt?'}
                      </button>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">
                        Oder
                      </span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

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
                      E-Mail/Passwort und Google sind die regulären Anmeldewege. Ein in den
                      Benutzereinstellungen aktivierter WebAuthn-Passkey wird anschließend als
                      zusätzlicher AAL2-Faktor abgefragt; er ist kein separater Login-Button.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
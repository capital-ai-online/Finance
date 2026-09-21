import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Globe2, Loader2, Lock, LogIn, Mail, Shield, ShieldCheck, Sparkles, TrendingUp, UserPlus } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { requestHcaptchaToken } from '../../../lib/hcaptcha';
import {
  PASSWORD_MIN_LENGTH,
  assertStrongUncompromisedPassword,
  validatePasswordStrength,
} from '../../../lib/passwordSecurity';
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
    if (mode === 'register') {
      try {
        validatePasswordStrength(password);
      } catch (passwordError) {
        setError(passwordError instanceof Error ? passwordError.message : 'Das Passwort erfüllt die Sicherheitsanforderungen nicht.');
        return;
      }
    }

    setActiveAction('email');
    try {
      if (mode === 'register') {
        await assertStrongUncompromisedPassword(password);
      }

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
    try {
      validatePasswordStrength(recoveryPassword);
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Das neue Passwort erfüllt die Sicherheitsanforderungen nicht.');
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

      await assertStrongUncompromisedPassword(recoveryPassword);

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
      data-design-source="SvenKulessa/FRONTEND"
      data-design-source-commit="64a0c24bd60501611aef10d36c61f71eba81f752"
      className="relative min-h-screen overflow-hidden bg-[#02050e] px-4 pb-16 pt-4 text-slate-100 selection:bg-aif-gold-DEFAULT selection:text-black sm:px-6"
    >
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-10 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-40 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col">
        <div className="flex items-center justify-between pb-4 pt-2">
          <a
            href="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-aif-gold-DEFAULT" />
            <span>Zurück zur Übersicht</span>
          </a>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-mono text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Sicherer Zugang</span>
          </div>
        </div>

        <section className="mb-5 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-400/10 via-fuchsia-500/10 to-violet-600/15 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-lg border border-amber-400/30 bg-amber-400/15 p-1.5 text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300 sm:text-[11px]">
              Capital-AI Webanwendung
            </span>
          </div>
          <h1 className="text-base font-extrabold leading-snug tracking-tight text-white sm:text-lg">
            Marktintelligenz und Analyse in einer Oberfläche
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
            Die Login-Oberfläche folgt der aktuellen grafischen Architektur aus dem FRONTEND-Repository.
            Authentifizierung, Session-Sicherheit und Recovery bleiben an die produktiven Finance-Verträge gebunden.
          </p>
          <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-200">
              <Globe2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="font-semibold">Multi-Asset</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-200">
              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-fuchsia-400" />
              <span className="font-semibold">Erklärbares Scoring</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-200">
              <Shield className="h-3.5 w-3.5 shrink-0 text-violet-400" />
              <span className="font-semibold">Geschützter Zugang</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span className="font-semibold">Compliance-Grenzen</span>
            </div>
          </div>
        </section>

        <section className="relative rounded-3xl border border-amber-500/25 bg-[#070b19]/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(249,191,33,0.12)] backdrop-blur-xl sm:p-8">
          <div className="mb-5 flex flex-col items-center text-center">
            <CapitalAiLogo size={110} showText={true} />
            <h2 className="mt-4 text-xl font-bold tracking-tight text-white">
              {isRecoveryFlow ? 'Passwort sicher setzen' : mode === 'login' ? 'Terminal Anmeldung' : 'Neues Konto erstellen'}
            </h2>
            <p className="mt-1 max-w-xs text-xs text-slate-400">
              {isRecoveryFlow
                ? 'Setze ein neues Passwort über die verifizierte Recovery-Sitzung.'
                : mode === 'login'
                  ? 'Sicherer Zugang zur Capital-AI Anwendung.'
                  : 'Erstelle ein reguläres Nutzerkonto über den bestehenden sicheren Registrierungsprozess.'}
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
            <form onSubmit={handleRecoveryPasswordUpdate} className="space-y-4" aria-label="Neues Passwort setzen">
              <div>
                <label htmlFor="recovery-password" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Neues Passwort
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="recovery-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={PASSWORD_MIN_LENGTH}
                    value={recoveryPassword}
                    onChange={(event) => setRecoveryPassword(event.target.value)}
                    required
                    disabled={activeAction !== null}
                    className="min-h-11 w-full rounded-xl border border-slate-700/80 bg-black/50 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="recovery-password-confirm" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Passwort bestätigen
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="recovery-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    minLength={PASSWORD_MIN_LENGTH}
                    value={confirmRecoveryPassword}
                    onChange={(event) => setConfirmRecoveryPassword(event.target.value)}
                    required
                    disabled={activeAction !== null}
                    className="min-h-11 w-full rounded-xl border border-slate-700/80 bg-black/50 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={activeAction !== null}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-emerald-400 to-violet-500 px-4 py-3 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(249,191,33,0.25)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeAction === 'recovery-update' && <Loader2 size={16} className="animate-spin" />}
                Passwort speichern
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-black/40 p-1">
                <button
                  type="button"
                  id="tab-mode-login"
                  onClick={() => switchMode('login')}
                  disabled={activeAction !== null}
                  className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition ${
                    mode === 'login'
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow'
                      : 'text-slate-400 hover:text-white'
                  } disabled:opacity-50`}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Anmelden
                </button>
                <button
                  type="button"
                  id="tab-mode-register"
                  onClick={() => switchMode('register')}
                  disabled={activeAction !== null}
                  className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition ${
                    mode === 'register'
                      ? 'bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  } disabled:opacity-50`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Registrieren
                </button>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4" aria-label="E-Mail Kontoanmeldung">
                {mode === 'register' && (
                  <div>
                    <label htmlFor="auth-name" className="mb-1.5 block text-xs font-medium text-slate-300">
                      Vollständiger Name
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      disabled={activeAction !== null}
                      className="min-h-11 w-full rounded-xl border border-slate-700/80 bg-black/50 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400 disabled:opacity-50"
                      placeholder="Vor- und Nachname"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-slate-300">
                    E-Mail-Adresse
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      disabled={activeAction !== null}
                      className="min-h-11 w-full rounded-xl border border-slate-700/80 bg-black/50 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
                      placeholder="name@beispiel.de"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-password" className="mb-1.5 block text-xs font-medium text-slate-300">
                    Passwort
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-password"
                      type="password"
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      minLength={mode === 'register' ? PASSWORD_MIN_LENGTH : undefined}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      disabled={activeAction !== null}
                      className="min-h-11 w-full rounded-xl border border-slate-700/80 bg-black/50 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={activeAction !== null}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-emerald-400 to-violet-500 px-4 py-3 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(249,191,33,0.25)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {activeAction === 'email' && <Loader2 size={16} className="animate-spin" />}
                  {mode === 'login' ? (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Mit E-Mail anmelden</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Normales Nutzerkonto registrieren</span>
                    </>
                  )}
                </button>
              </form>

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={handlePasswordRecoveryRequest}
                  disabled={activeAction !== null}
                  className="w-full text-center text-[11px] text-amber-400 transition hover:text-amber-300 disabled:opacity-50"
                >
                  {activeAction === 'recovery-request'
                    ? 'Passwort-Link wird angefordert…'
                    : 'Passwort vergessen oder noch kein Passwort gesetzt?'}
                </button>
              )}

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">Oder</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                disabled={activeAction !== null}
                onClick={handleGoogleLogin}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-xs font-bold text-neutral-800 shadow-sm transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Mit Google anmelden"
              >
                {activeAction === 'google' ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                <span>Mit Google anmelden</span>
              </button>

              <p className="text-center text-[10px] leading-relaxed text-white/35">
                E-Mail/Passwort und Google bleiben die produktiven Primärwege. Ein aktivierter
                WebAuthn-Passkey wird anschließend als zusätzlicher AAL2-Faktor geprüft.
              </p>
              <p className="text-center text-[10px] text-white/35">
                Fragen zu rechtlichen und allgemeinen Nutzungsthemen findest du in den <a href="/faq" className="text-amber-400 hover:underline">FAQ</a>.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

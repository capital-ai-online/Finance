import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { isNativePasskeyLoginEnabled } from '../../../lib/authFeatureFlags';
import { requestHcaptchaToken } from '../../../lib/hcaptcha';
import { CapitalAiLogo } from '../../../shared/branding/CapitalAiLogo';
import { PasskeyLoginPanel } from './PasskeyLoginPanel';

interface LoginPageProps {
  onLoginEmail: (email: string, password: string) => Promise<void>;
  justLoggedOut?: boolean;
}

/**
 * Canonical authentication page for `/login`.
 *
 * Google OAuth is the leading provider while native Supabase passkeys are disabled. Google owns
 * the account-verification ceremony and can use a Google-account passkey when the user has one
 * configured; CAPITAL-AI never receives or stores that Google passkey. Once the controlled native
 * passkey feature flag is enabled, the native panel is rendered first and becomes the leading
 * website login path.
 */
export function LoginPage({ onLoginEmail, justLoggedOut }: LoginPageProps) {
  const nativePasskeyEnabled = isNativePasskeyLoginEnabled();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

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

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Bitte E-Mail-Adresse und Passwort eingeben.');
      return;
    }

    setLoading(true);
    try {
      await onLoginEmail(email, password);
    } catch (err: any) {
      setError(err?.message || 'Anmeldung fehlgeschlagen.');
      setLoading(false);
    }
  };

  const openPasswordReset = () => {
    setResetEmail(email);
    setResetError(null);
    setResetSuccess(null);
    setResetOpen(true);
  };

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetEmail) {
      setResetError('Bitte geben Sie Ihre registrierte E-Mail-Adresse ein.');
      return;
    }
    if (!supabase) {
      setResetError('Supabase ist nicht konfiguriert.');
      return;
    }

    setResetLoading(true);
    try {
      const captchaToken = await requestHcaptchaToken();
      const { error: passwordResetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login`,
        captchaToken,
      });
      if (passwordResetError) throw passwordResetError;

      setResetSuccess(
        'Der geschützte Reset-Link wurde angefordert. Bitte prüfen Sie Ihr E-Mail-Postfach.',
      );
    } catch (err: any) {
      console.warn('[Auth] Password reset request failed:', err);
      setResetError(err?.message || 'Der Passwort-Reset konnte nicht angefordert werden.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main
      role="main"
      id="main-content"
      className="min-h-screen bg-neutral-950 px-4 py-10 text-white selection:bg-aif-gold-DEFAULT selection:text-black"
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <a
          href="/"
          className="self-start text-xs font-bold text-white/50 transition-colors hover:text-aif-gold-DEFAULT"
        >
          ← Zurück zur Landingpage
        </a>

        <section className="rounded-2xl border border-white/10 bg-black/50 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <CapitalAiLogo size={110} showText={true} />
            <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
              Sichere Anmeldung
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
            {nativePasskeyEnabled && <PasskeyLoginPanel />}

            <section
              className={
                nativePasskeyEnabled
                  ? 'rounded-xl border border-white/10 bg-white/[0.02] p-4'
                  : 'rounded-xl border border-aif-gold-DEFAULT/20 bg-aif-gold-DEFAULT/5 p-4'
              }
            >
              <div className="mb-3 flex items-center gap-2">
                <KeyRound
                  size={16}
                  className={nativePasskeyEnabled ? 'text-white/60' : 'text-aif-gold-DEFAULT'}
                />
                <div>
                  <p
                    className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                      nativePasskeyEnabled ? 'text-white/55' : 'text-aif-gold-DEFAULT'
                    }`}
                  >
                    {nativePasskeyEnabled ? 'Google Fallback' : 'Primärer Login · Google'}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/45">
                    Ist für Ihr Google-Konto ein Passkey eingerichtet, kann Google die Anmeldung
                    passkey-basiert bestätigen. Die Passkey-Verifikation verbleibt vollständig bei
                    Google.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-xs font-bold text-neutral-800 shadow-sm transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Mit Google anmelden; Google Passkey wird verwendet, wenn im Google-Konto verfügbar"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.83z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.39 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.32 14.24A7.16 7.16 0 0 1 5 12c0-.79.13-1.57.32-2.34V6.51H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.11-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.18 2.12 1.21 5.39l4.11 3.15c.94-2.85 3.57-4.96 6.68-4.96z"
                  />
                </svg>
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>Mit Google anmelden</span>
              </button>
            </section>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">
                registriertes Konto
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="text-[10px] font-bold uppercase tracking-widest text-white/55"
                >
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                  />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/60 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-aif-gold-DEFAULT/60"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="text-[10px] font-bold uppercase tracking-widest text-white/55"
                  >
                    Passwort
                  </label>
                  <button
                    type="button"
                    onClick={openPasswordReset}
                    className="text-[10px] font-bold text-aif-gold-DEFAULT hover:underline"
                  >
                    Passwort vergessen?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/60 py-3 pl-10 pr-11 text-sm text-white outline-none transition focus:border-aif-gold-DEFAULT/60"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white/70"
                    aria-label={showPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-aif-gold-DEFAULT px-4 py-3 text-xs font-black uppercase tracking-wider text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                Anmelden
              </button>
            </form>

            <p className="text-center text-[10px] leading-relaxed text-white/35">
              Die Selbstregistrierung bleibt kontrolliert deaktiviert. Bereits registrierte Konten
              können Google oder E-Mail/Passwort verwenden. Nach erfolgreicher Primäranmeldung
              bleibt das native Supabase-AAL-/MFA-Gate verpflichtend.
            </p>
          </div>
        </section>

        {resetOpen && (
          <section className="rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur-xl">
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-aif-gold-DEFAULT">
                Passwort zurücksetzen · hCaptcha geschützt
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/50">
                Vor jeder Reset-Anforderung wird ein kurzlebiger hCaptcha-Token erzeugt und direkt
                an Supabase Auth übergeben. Der Token wird nicht gespeichert.
              </p>
            </div>

            {resetError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setResetOpen(false)}
                  className="w-full min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  Schließen
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/60 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-aif-gold-DEFAULT/60"
                    placeholder="name@beispiel.com"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setResetOpen(false)}
                    className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white transition hover:bg-white/10"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-aif-gold-DEFAULT px-4 py-3 text-xs font-black text-black transition hover:brightness-110 disabled:opacity-50"
                  >
                    {resetLoading ? <Loader2 size={15} className="animate-spin" /> : null}
                    Reset-Link senden
                  </button>
                </div>
              </form>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

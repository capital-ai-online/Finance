import React, { useEffect, useMemo, useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  AtSign,
  Phone,
} from 'lucide-react';
import { BrandLogo } from './frontend-port/components/BrandLogo';

interface LoginPageProps {
  justLoggedOut?: boolean;
}

type AuthMode = 'login' | 'register';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  callback_verification_failed: 'Die Google-Rückmeldung konnte nicht verifiziert werden.',
  code_exchange_failed: 'Die Google-Sitzung konnte nicht sicher übernommen werden.',
  callback_failed: 'Die Anmeldung konnte nicht abgeschlossen werden.',
  email_confirmation_invalid: 'Der Bestätigungslink ist ungültig oder unvollständig.',
  email_confirmation_failed: 'Die E-Mail-Bestätigung konnte nicht abgeschlossen werden.',
};

async function postAuthJson(
  path: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; body: any }> {
  if (!path.startsWith('/api/auth/')) {
    throw new Error('AUTH_ROUTE_OUTSIDE_BACKEND_BOUNDARY');
  }

  const response = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, body };
}

function providerMessage(body: any, fallback: string): string {
  const message =
    typeof body?.message === 'string'
      ? body.message.trim()
      : typeof body?.error === 'string'
        ? body.error.trim()
        : '';
  return message || fallback;
}

/**
 * Backend-first auth presentation.
 *
 * Visual source:
 * SvenKulessa/FRONTEND@f2a101330d74420c373f0ec56fa58caac53d741d/src/components/LoginPage.tsx
 *
 * The browser renders the forms and sends credentials only to same-origin backend auth routes.
 * Session material remains backend-owned and inaccessible to this component.
 */
export function LoginPage({ justLoggedOut = false }: LoginPageProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acknowledgePrivacy, setAcknowledgePrivacy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'phone'>('email');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryPhoneCode, setRecoveryPhoneCode] = useState('');
  const [recoveryPhonePending, setRecoveryPhonePending] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(() => {
    return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mfa_required') === '1';
  });
  const [mfaCode, setMfaCode] = useState('');

  const authError = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const code = new URLSearchParams(window.location.search).get('auth_error');
    if (!code) return null;
    return AUTH_ERROR_MESSAGES[code] ?? 'Die Anmeldung konnte nicht abgeschlossen werden.';
  }, []);

  useEffect(() => {
    if (mfaRequired) return;
    const controller = new AbortController();
    void fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!controller.signal.aborted && payload?.mfaRequired === true) setMfaRequired(true);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [mfaRequired]);

  const resetFeedback = () => {
    setStatusMessage(null);
    setFormError(null);
  };

  const selectMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setRecoveryOpen(false);
    setMfaRequired(false);
    setMfaCode('');
    resetFeedback();
  };

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setIsLoading(true);

    try {
      const result = await postAuthJson('/api/auth/login/email', {
        identifier: loginEmail,
        password: loginPassword,
      });

      if (!result.ok) {
        setFormError(providerMessage(result.body, 'Anmeldung fehlgeschlagen.'));
        return;
      }

      if (result.body?.mfaRequired === true) {
        setMfaRequired(true);
        setStatusMessage('Bitte die Anmeldung mit deiner Authenticator-App bestätigen.');
        return;
      }

      setStatusMessage('Anmeldung erfolgreich. Die sichere Sitzung wird geladen.');
      if (typeof window !== 'undefined') window.location.replace('/');
    } catch (error) {
      console.warn('[AuthUI] Email login failed:', error);
      setFormError('Anmeldung ist derzeit nicht verfügbar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    resetFeedback();
    setIsLoading(true);

    try {
      const startResult = await postAuthJson('/api/auth/login/passkey/start', {});
      if (!startResult.ok) {
        setFormError(providerMessage(startResult.body, 'Passkey-Anmeldung konnte nicht gestartet werden.'));
        return;
      }
      if (typeof startResult.body?.challengeId !== 'string' || !startResult.body?.options) {
        setFormError('Die Passkey-Challenge des Servers ist ungültig.');
        return;
      }

      const credential = await startAuthentication({ optionsJSON: startResult.body.options });
      const verifyResult = await postAuthJson('/api/auth/login/passkey/verify', {
        challengeId: startResult.body.challengeId,
        credential,
      });
      if (!verifyResult.ok) {
        setFormError(providerMessage(verifyResult.body, 'Passkey-Anmeldung konnte nicht verifiziert werden.'));
        return;
      }

      if (verifyResult.body?.mfaRequired === true) {
        setMfaRequired(true);
        setStatusMessage('Passkey bestätigt. Bitte zusätzlich den Authenticator-Code eingeben.');
        return;
      }

      setStatusMessage('Passkey bestätigt. Die sichere Sitzung wird geladen.');
      if (typeof window !== 'undefined') window.location.replace('/');
    } catch (error) {
      console.warn('[AuthUI] Passkey login failed:', error);
      setFormError(error instanceof Error ? error.message : 'Passkey-Anmeldung ist derzeit nicht verfügbar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();

    if (regPassword !== regConfirmPassword) {
      setFormError('Die Passwörter stimmen nicht überein.');
      return;
    }
    if (!acceptTerms || !acknowledgePrivacy) {
      setFormError('Bitte die AGB akzeptieren und die Datenschutzhinweise bestätigen.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await postAuthJson('/api/auth/register', {
        name: regName,
        username: regUsername,
        email: regEmail,
        phoneNumber: regPhone || undefined,
        password: regPassword,
        termsAccepted: acceptTerms,
        privacyAcknowledged: acknowledgePrivacy,
        marketingConsent,
      });

      if (!result.ok) {
        setFormError(providerMessage(result.body, 'Registrierung ist derzeit nicht verfügbar.'));
        return;
      }

      setPendingConfirmationEmail(regEmail.trim());
      setStatusMessage(
        providerMessage(
          result.body,
          'Registrierung angenommen. Bitte den Link in der Bestätigungsmail öffnen.',
        ),
      );
    } catch (error) {
      console.warn('[AuthUI] Registration failed:', error);
      setFormError('Registrierung ist derzeit nicht verfügbar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setIsLoading(true);

    try {
      const result = recoveryMethod === 'email'
        ? await postAuthJson('/api/auth/password/forgot', { email: recoveryEmail || loginEmail })
        : await postAuthJson('/api/auth/password/phone/start', { phone: recoveryPhone });

      if (!result.ok) {
        setFormError(providerMessage(result.body, recoveryMethod === 'email' ? 'Passwort-Reset-Mail konnte nicht angefordert werden.' : 'SMS-Code konnte nicht angefordert werden.'));
        return;
      }

      if (recoveryMethod === 'phone') setRecoveryPhonePending(true);

      setStatusMessage(
        providerMessage(
          result.body,
          recoveryMethod === 'email'
            ? 'Wenn ein Konto für diese Adresse existiert, wurde eine Passwort-Reset-Mail angefordert.'
            : 'Wenn eine bestätigte Telefonnummer hinterlegt ist, wurde ein SMS-Code angefordert.',
        ),
      );
    } catch (error) {
      console.warn('[AuthUI] Password recovery failed:', error);
      setFormError('Passwort-Reset-Mail konnte nicht angefordert werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneRecoveryVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setIsLoading(true);
    try {
      const result = await postAuthJson('/api/auth/password/phone/verify', {
        phone: recoveryPhone,
        token: recoveryPhoneCode,
      });
      if (!result.ok) {
        setFormError(providerMessage(result.body, 'SMS-Code konnte nicht verifiziert werden.'));
        return;
      }
      if (typeof window !== 'undefined') window.location.replace('/account/update-password');
    } catch (error) {
      console.warn('[AuthUI] Phone recovery verification failed:', error);
      setFormError('SMS-Code konnte nicht verifiziert werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaLoginVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setIsLoading(true);
    try {
      const result = await postAuthJson('/api/auth/login/totp/verify', { code: mfaCode });
      if (!result.ok) {
        setFormError(providerMessage(result.body, 'Authenticator-Code konnte nicht verifiziert werden.'));
        return;
      }
      setStatusMessage('Zwei-Faktor-Anmeldung erfolgreich.');
      if (typeof window !== 'undefined') window.location.replace('/');
    } catch (error) {
      console.warn('[AuthUI] TOTP login verification failed:', error);
      setFormError('Authenticator-Code konnte nicht verifiziert werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const restartMfaLogin = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'local' }),
      });
    } finally {
      setMfaRequired(false);
      setMfaCode('');
      resetFeedback();
      if (typeof window !== 'undefined') window.history.replaceState({}, '', '/login');
    }
  };

  const handleConfirmationResend = async () => {
    if (!pendingConfirmationEmail) return;
    resetFeedback();
    setIsLoading(true);

    try {
      const result = await postAuthJson('/api/auth/confirmation/resend', {
        email: pendingConfirmationEmail,
      });

      if (!result.ok) {
        setFormError(providerMessage(result.body, 'Bestätigungsmail konnte nicht erneut angefordert werden.'));
        return;
      }

      setStatusMessage(
        providerMessage(
          result.body,
          'Wenn eine unbestätigte Registrierung existiert, wurde eine neue Bestätigungsmail angefordert.',
        ),
      );
    } catch (error) {
      console.warn('[AuthUI] Confirmation resend failed:', error);
      setFormError('Bestätigungsmail konnte nicht erneut angefordert werden.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      role="main"
      id="main-content"
      data-auth-architecture="backend-first"
      data-design-source="SvenKulessa/FRONTEND"
      data-design-commit="f2a101330d74420c373f0ec56fa58caac53d741d"
      className="relative flex min-h-screen w-full select-none flex-col items-center justify-start overflow-hidden bg-[#02050e] p-4 pb-16 text-slate-100 sm:p-6"
    >
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-10 h-96 w-96 -translate-x-1/2 rounded-full bg-[#8D26FF]/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-40 h-80 w-80 rounded-full bg-[#F9BF21]/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-[#44DE88]/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-1/4 top-1/2 h-72 w-72 rounded-full bg-[#FF2E93]/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col">
        <div className="flex items-center justify-between pb-4 pt-2">
          <a
            href="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-amber-400" />
            <span>Zurück zur Übersicht</span>
          </a>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Backend Session</span>
          </div>
        </div>

        <section className="mb-5 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-400/10 via-[#FF2E93]/10 to-[#8D26FF]/15 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-lg border border-amber-400/30 bg-amber-400/15 p-1.5 text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
              CAPITAL-AI Zugang
            </span>
          </div>
          <h1 className="text-lg font-extrabold leading-snug tracking-tight text-white">
            Sicher anmelden oder kostenlos registrieren
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            Google, E-Mail-Anmeldung und Registrierung verwenden denselben geschützten
            Backend-Sessionpfad.
          </p>
        </section>

        <section className="rounded-3xl border border-amber-500/25 bg-[#070b19]/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(249,191,33,0.12)] backdrop-blur-xl sm:p-8">
          <div className="mb-5 flex flex-col items-center text-center">
            <BrandLogo variant="stacked" size="lg" />
            <h2 className="mt-4 text-xl font-bold tracking-tight text-white">
              {authMode === 'login' ? 'Terminal Anmeldung' : 'Neues Konto erstellen'}
            </h2>
            <p className="mt-1 max-w-xs text-xs text-slate-400">
              {authMode === 'login'
                ? 'Sicherer Zugang zur CAPITAL-AI Plattform.'
                : 'Registrierung mit E-Mail-Bestätigung über den geschützten Backend-Workflow.'}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-black/40 p-1">
            <button
              type="button"
              id="tab-mode-login"
              disabled={mfaRequired}
              onClick={() => selectMode('login')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Anmelden</span>
            </button>
            <button
              type="button"
              id="tab-mode-register"
              disabled={mfaRequired}
              onClick={() => selectMode('register')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-[#FF2E93] to-[#8D26FF] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Registrieren</span>
            </button>
          </div>

          {justLoggedOut && (
            <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle2 size={15} />
              Erfolgreich abgemeldet.
            </div>
          )}

          {authError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {formError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {statusMessage && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {authMode === 'login' ? (
            mfaRequired ? (
              <form id="totp-login-form" onSubmit={handleMfaLoginVerify} className="space-y-4">
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-xs leading-relaxed text-cyan-100">
                  Öffne deine Authenticator-App und gib den aktuellen sechsstelligen Code ein.
                </div>
                <input value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required placeholder="000000" aria-label="Sechsstelliger Authenticator-Code" className="w-full rounded-xl border border-cyan-400/25 bg-black/50 px-4 py-3 text-center font-mono text-lg tracking-[0.4em] text-white focus:border-cyan-300 focus:outline-none" />
                <button type="submit" disabled={isLoading || mfaCode.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-400 px-4 py-3 text-sm font-extrabold text-black disabled:opacity-60">
                  <ShieldCheck className="h-4 w-4" /> 2FA-Anmeldung bestätigen
                </button>
                <button type="button" onClick={() => void restartMfaLogin()} className="w-full text-xs font-semibold text-slate-400 hover:text-white">Anmeldung neu starten</button>
              </form>
            ) : recoveryOpen ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
                  <button type="button" onClick={() => { setRecoveryMethod('email'); setRecoveryPhonePending(false); resetFeedback(); }} className={`rounded-lg px-3 py-2 text-xs font-bold ${recoveryMethod === 'email' ? 'bg-amber-400 text-black' : 'text-slate-400'}`}>E-Mail</button>
                  <button type="button" onClick={() => { setRecoveryMethod('phone'); resetFeedback(); }} className={`rounded-lg px-3 py-2 text-xs font-bold ${recoveryMethod === 'phone' ? 'bg-emerald-400 text-black' : 'text-slate-400'}`}>Telefon</button>
                </div>
                {recoveryMethod === 'phone' && recoveryPhonePending ? (
                  <form id="phone-recovery-verify-form" onSubmit={handlePhoneRecoveryVerify} className="space-y-4">
                    <label htmlFor="recovery-phone-code" className="block text-xs font-medium text-slate-300">Sechsstelliger SMS-Code</label>
                    <input id="recovery-phone-code" value={recoveryPhoneCode} onChange={(event) => setRecoveryPhoneCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required placeholder="000000" className="w-full rounded-xl border border-slate-700/80 bg-black/50 px-4 py-3 text-center font-mono tracking-[0.35em] text-white focus:border-emerald-400 focus:outline-none" />
                    <button type="submit" disabled={isLoading || recoveryPhoneCode.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-extrabold text-black disabled:opacity-60">Code bestätigen</button>
                  </form>
                ) : (
                  <form id="password-recovery-form" onSubmit={handlePasswordRecovery} className="space-y-4">
                    <div>
                      <label htmlFor={recoveryMethod === 'email' ? 'recovery-email' : 'recovery-phone'} className="mb-1.5 block text-xs font-medium text-slate-300">{recoveryMethod === 'email' ? 'E-Mail-Adresse' : 'Verifizierte Telefonnummer'}</label>
                      <div className="relative">
                        {recoveryMethod === 'email' ? <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /> : <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />}
                        <input id={recoveryMethod === 'email' ? 'recovery-email' : 'recovery-phone'} type={recoveryMethod === 'email' ? 'email' : 'tel'} required autoComplete={recoveryMethod === 'email' ? 'email' : 'tel'} value={recoveryMethod === 'email' ? recoveryEmail : recoveryPhone} onChange={(event) => recoveryMethod === 'email' ? setRecoveryEmail(event.target.value) : setRecoveryPhone(event.target.value)} placeholder={recoveryMethod === 'email' ? 'name@beispiel.de' : '+491701234567'} className="w-full rounded-xl border border-slate-700/80 bg-black/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 transition-all focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400" />
                      </div>
                    </div>
                    <button id="password-recovery-submit-btn" type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 px-4 py-3 text-sm font-extrabold text-black transition hover:opacity-95 disabled:opacity-60">
                      {recoveryMethod === 'email' ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                      {recoveryMethod === 'email' ? 'Reset-Link anfordern' : 'SMS-Code anfordern'}
                    </button>
                  </form>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryOpen(false);
                    resetFeedback();
                  }}
                  className="w-full text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Zurück zur Anmeldung
                </button>
              </div>
            ) : (
              <form id="email-login-form" onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-slate-300">
                    E-Mail-Adresse oder Benutzername
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="login-email"
                      type="text"
                      required
                      autoComplete="username"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      placeholder="name@beispiel.de oder username"
                      className="w-full rounded-xl border border-slate-700/80 bg-black/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 transition-all focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-xs font-medium text-slate-300">
                      Passwort
                    </label>
                    <button
                      type="button"
                      id="password-forgot-btn"
                      onClick={() => {
                        setRecoveryEmail(loginEmail);
                        setRecoveryOpen(true);
                        resetFeedback();
                      }}
                      className="text-[11px] text-amber-400 transition-colors hover:text-amber-300"
                    >
                      Passwort vergessen?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-slate-700/80 bg-black/50 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-600 transition-all focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300"
                      aria-label={showLoginPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F9BF21] via-[#44DE88] to-[#8D26FF] px-4 py-3 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(249,191,33,0.25)] transition hover:opacity-95 disabled:opacity-60"
                >
                  <LogIn className="h-4 w-4 stroke-[2.5]" />
                  <span>{isLoading ? 'Anmeldung läuft…' : 'Anmelden'}</span>
                </button>
              </form>
            )
          ) : (
            <form id="email-register-form" onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label htmlFor="reg-name" className="mb-1 block text-xs font-medium text-slate-300">
                  Vollständiger Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete="name"
                    value={regName}
                    onChange={(event) => setRegName(event.target.value)}
                    placeholder="Max Mustermann"
                    className="w-full rounded-xl border border-slate-700/80 bg-black/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 transition-all focus:border-[#FF2E93] focus:outline-none focus:ring-1 focus:ring-[#FF2E93]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-username" className="mb-1 block text-xs font-medium text-slate-300">
                  Benutzername
                </label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="reg-username"
                    type="text"
                    required
                    minLength={3}
                    maxLength={32}
                    pattern="[a-z0-9][a-z0-9._-]{2,31}"
                    autoComplete="username"
                    value={regUsername}
                    onChange={(event) => setRegUsername(event.target.value.toLowerCase())}
                    placeholder="max.mustermann"
                    className="w-full rounded-xl border border-slate-700/80 bg-black/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 transition-all focus:border-[#FF2E93] focus:outline-none focus:ring-1 focus:ring-[#FF2E93]"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">3–32 Zeichen: Kleinbuchstaben, Ziffern, Punkt, Minus oder Unterstrich.</p>
              </div>

              <div>
                <label htmlFor="reg-email" className="mb-1 block text-xs font-medium text-slate-300">
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={regEmail}
                    onChange={(event) => setRegEmail(event.target.value)}
                    placeholder="name@beispiel.de"
                    className="w-full rounded-xl border border-slate-700/80 bg-black/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 transition-all focus:border-[#FF2E93] focus:outline-none focus:ring-1 focus:ring-[#FF2E93]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-phone" className="mb-1 block text-xs font-medium text-slate-300">
                  Telefonnummer <span className="text-slate-500">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input id="reg-phone" type="tel" autoComplete="tel" value={regPhone} onChange={(event) => setRegPhone(event.target.value)} placeholder="+491701234567" className="w-full rounded-xl border border-slate-700/80 bg-black/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 transition-all focus:border-[#44DE88] focus:outline-none focus:ring-1 focus:ring-[#44DE88]" />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">Die Nummer wird erst nach späterer SMS-Verifizierung für Recovery genutzt.</p>
              </div>

              <div>
                <label htmlFor="reg-password" className="mb-1 block text-xs font-medium text-slate-300">
                  Passwort
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(event) => setRegPassword(event.target.value)}
                    placeholder="Sicheres Passwort"
                    className="w-full rounded-xl border border-slate-700/80 bg-black/50 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-600 transition-all focus:border-[#FF2E93] focus:outline-none focus:ring-1 focus:ring-[#FF2E93]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300"
                    aria-label={showRegPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                  Mindestens 12 Zeichen; verwende eine lange, einzigartige Passphrase.
                </p>
              </div>

              <div>
                <label htmlFor="reg-confirm-password" className="mb-1 block text-xs font-medium text-slate-300">
                  Passwort wiederholen
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="reg-confirm-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    value={regConfirmPassword}
                    onChange={(event) => setRegConfirmPassword(event.target.value)}
                    placeholder="Passwort wiederholen"
                    className="w-full rounded-xl border border-slate-700/80 bg-black/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 transition-all focus:border-[#FF2E93] focus:outline-none focus:ring-1 focus:ring-[#FF2E93]"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 pt-1 text-xs leading-snug text-slate-400">
                <input
                  id="registration-terms"
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={(event) => setAcceptTerms(event.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-black/60 text-[#FF2E93] focus:ring-[#FF2E93]/50"
                />
                <span>
                  Ich akzeptiere die{' '}
                  <a href="/agb" target="_blank" rel="noopener noreferrer" className="text-slate-200 underline hover:text-amber-400">
                    Nutzungsbedingungen (AGB)
                  </a>
                  .
                </span>
              </label>

              <label className="flex items-start gap-2 text-xs leading-snug text-slate-400">
                <input
                  id="registration-privacy"
                  type="checkbox"
                  required
                  checked={acknowledgePrivacy}
                  onChange={(event) => setAcknowledgePrivacy(event.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-black/60 text-[#44DE88] focus:ring-[#44DE88]/50"
                />
                <span>
                  Ich habe die{' '}
                  <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-slate-200 underline hover:text-emerald-400">
                    Datenschutzhinweise
                  </a>
                  {' '}zur Verarbeitung meiner Registrierungsdaten gelesen.
                </span>
              </label>

              <label className="flex items-start gap-2 text-xs leading-snug text-slate-500">
                <input
                  id="registration-marketing"
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(event) => setMarketingConsent(event.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-black/60 text-[#8D26FF] focus:ring-[#8D26FF]/50"
                />
                <span>Optional: Ich möchte Produktneuigkeiten per E-Mail erhalten. Diese Einwilligung kann ich jederzeit widerrufen.</span>
              </label>

              <button
                id="register-submit-btn"
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF2E93] via-[#8D26FF] to-[#44DE88] px-4 py-3 text-sm font-extrabold text-white shadow-[0_0_20px_rgba(255,46,147,0.3)] transition hover:opacity-95 disabled:opacity-60"
              >
                <UserPlus className="h-4 w-4 stroke-[2.5]" />
                <span>{isLoading ? 'Registrierung läuft…' : 'Konto registrieren'}</span>
              </button>

              {pendingConfirmationEmail && (
                <button
                  id="confirmation-resend-btn"
                  type="button"
                  disabled={isLoading}
                  onClick={() => void handleConfirmationResend()}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
                >
                  Bestätigungsmail erneut senden
                </button>
              )}
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#070b19] px-2 text-[10px] uppercase tracking-widest text-slate-500">
                Oder fortfahren mit
              </span>
            </div>
          </div>

          <a
            id="backend-google-login"
            href="/api/auth/login/google?next=%2F"
            className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 shadow-sm transition hover:border-white/20 hover:bg-white/10"
            aria-label="Mit Google anmelden"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 5c1.5 0 2.8.5 3.9 1.5l2.9-2.9C17 1.9 14.7 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.6 2.8C6.4 7.1 8.9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
              <path fill="#FBBC05" d="M5.5 14.8c-.3-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.9 6.4C.7 8.8 0 10.3 0 12s.7 3.2 1.9 5.6l3.6-2.8z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.6-2.1-6.5-5.1L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
            </svg>
            <span>Mit Google fortfahren</span>
          </a>

          {authMode === 'login' && (
            <button
              id="backend-passkey-login"
              type="button"
              disabled={isLoading}
              onClick={() => void handlePasskeyLogin()}
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-2.5 text-xs font-semibold text-cyan-100 shadow-sm transition hover:border-cyan-300/35 hover:bg-cyan-400/10 disabled:opacity-50"
              aria-label="Mit Passkey anmelden"
            >
              <Fingerprint className="h-4 w-4 text-cyan-300" />
              <span>Mit Passkey anmelden</span>
            </button>
          )}

          <div className="mt-5 text-center text-xs text-slate-400">
            {authMode === 'login' ? (
              <>
                Noch kein Konto?{' '}
                <button
                  type="button"
                  onClick={() => selectMode('register')}
                  className="font-semibold text-amber-400 underline underline-offset-4 hover:text-amber-300"
                >
                  Jetzt registrieren
                </button>
              </>
            ) : (
              <>
                Bereits registriert?{' '}
                <button
                  type="button"
                  onClick={() => selectMode('login')}
                  className="font-semibold text-amber-400 underline underline-offset-4 hover:text-amber-300"
                >
                  Jetzt anmelden
                </button>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-slate-800/80 pt-4 text-[10px] text-slate-500">
            <a href="/datenschutz" className="hover:text-slate-300">Datenschutz</a>
            <a href="/impressum" className="hover:text-slate-300">Impressum</a>
            <a href="/agb" className="hover:text-slate-300">AGB</a>
            <a href="/faq" className="hover:text-amber-300">FAQ</a>
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { LoginStepUpGate } from '../../components/LoginStepUpGate';
import { RegistrationCompletionGate } from '../../components/RegistrationCompletionGate';
import {
  clearLoginStepUpMarkers,
  loginStepUpRequirement,
} from '../../lib/loginStepUp';
import { needsOnboarding } from '../../lib/onboarding';
import {
  assertStrongUncompromisedPassword,
  PASSWORD_MIN_LENGTH,
} from '../../lib/passwordSecurity';
import type { SubscriptionTier, UserSession } from '../types/UserSession';

export interface SessionCompositionValue {
  userSession: UserSession | null;
  justLoggedOut: boolean;
  clearJustLoggedOut: () => void;
  handleLogin: (email: string, password: string) => Promise<void>;
  handleRegister: (name: string, email: string, password: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

interface SessionCompositionProps {
  children: (value: SessionCompositionValue) => React.ReactNode;
}

interface AuthErrorState {
  message: string;
  code: string;
  expectedId: string;
  receivedId?: string;
}

const PUBLIC_SHELL_PATHS = new Set([
  '/',
  '/datenschutz',
  '/impressum',
  '/agb',
  '/learning-platform',
]);

function shouldRenderPublicShellImmediately(): boolean {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  return PUBLIC_SHELL_PATHS.has(pathname);
}

/**
 * BB-1 Application Composition boundary.
 *
 * Owns authenticated session restoration, Supabase auth lifecycle, onboarding,
 * login step-up, password recovery and global unauthorized handling.
 * Anonymous and guest sessions are intentionally not supported.
 *
 * Public routes are deliberately allowed to render while authentication is hydrated in the
 * background. This keeps the canonical public homepage independent from Supabase/IAM/Billing
 * latency while protected routes continue to fail closed behind the existing security gates.
 */
export function SessionComposition({ children }: SessionCompositionProps) {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [justLoggedOut, setJustLoggedOut] = useState<boolean>(false);
  const [authError, setAuthError] = useState<AuthErrorState | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [passwordRecoveryError, setPasswordRecoveryError] = useState<string | null>(null);
  const [passwordRecoverySubmitting, setPasswordRecoverySubmitting] = useState(false);
  const [pendingStepUpSession, setPendingStepUpSession] = useState<any | null>(null);
  const [pendingOnboardingSession, setPendingOnboardingSession] = useState<any | null>(null);
  const renderPublicShellImmediately = shouldRenderPublicShellImmediately();

  const updateUserSession = (session: UserSession | null) => {
    setUserSession(session);
    if (session) {
      localStorage.setItem('mcc_user_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('mcc_user_session');
    }
  };

  const rejectAnonymousSession = async () => {
    updateUserSession(null);
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Auth] Anonymous session cleanup failed:', err);
      }
    }
    setLoading(false);
  };

  const handleSupabaseSession = async (session: any) => {
    const user = session.user;

    if (!user || user.is_anonymous) {
      await rejectAnonymousSession();
      return;
    }

    const email = user.email || '';
    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email.split('@')[0] ||
      'User';

    try {
      const res = await fetch(`/api/stripe/user-subscription?userId=${encodeURIComponent(user.id)}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      let tier: SubscriptionTier = 'Free';

      if (res.ok) {
        const data = await res.json();

        if (data && data.userId && data.userId !== user.id) {
          console.error(
            'CRITICAL SECURITY MISMATCH: Expected User ID',
            user.id,
            'but received',
            data.userId,
          );
          setAuthError({
            message:
              'Sicherheits-Fehler: Es wurde eine Diskrepanz zwischen Ihrer lokalen Benutzer-ID und der Server-ID festgestellt. Um Ihre Daten zu schützen, wurde der Zugriff vorübergehend gesperrt.',
            code: 'IDENTITY_MISMATCH_DETECTED',
            expectedId: user.id,
            receivedId: data.userId,
          });
          setLoading(false);
          return;
        }

        if (data && data.subscriptionTier) {
          tier = data.subscriptionTier;
        }
      }

      // SECURITY (2026-08-25 architecture review, finding #2): accessToken is intentionally not
      // set here anymore - see the comment on UserSession.accessToken. authFetch() always reads
      // the live token from the Supabase SDK session directly instead.
      updateUserSession({
        type: 'registered',
        name,
        email,
        subscriptionTier: tier,
        id: user.id,
      });
    } catch (err) {
      console.error('Error loading subscription tier:', err);
      updateUserSession({
        type: 'registered',
        name,
        email,
        subscriptionTier: 'Free',
        id: user.id,
      });
    } finally {
      setLoading(false);
    }
  };

  const establishSession = async (session: any) => {
    if (!session?.user || session.user.is_anonymous) {
      await rejectAnonymousSession();
      return;
    }

    if (await needsOnboarding(session)) {
      setPendingOnboardingSession(session);
      setLoading(false);
      return;
    }

    const required = await loginStepUpRequirement(session);
    if (required === 'none') {
      await handleSupabaseSession(session);
    } else {
      setPendingStepUpSession(session);
      setLoading(false);
    }
  };

  useEffect(() => {
    // ADR-0003.5: development auto-login remains double-gated by exact local
    // hostname plus explicit build flag.
    const isExplicitLocalDev =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      (import.meta as any).env?.VITE_ENABLE_DEV_AUTOLOGIN === 'true';

    if (isExplicitLocalDev) {
      const devSession: UserSession = {
        type: 'registered',
        name: 'Sven Kulessa (Dev Admin)',
        email: 'sven.kulessa@gmx.net',
        subscriptionTier: 'Enterprise',
        id: 'dev-admin-sven-kulessa-gmx-net',
        accessToken: 'LOCAL_DEV_ONLY_INVALID_TOKEN',
      };
      setUserSession(devSession);
      localStorage.setItem('mcc_user_session', JSON.stringify(devSession));
      setLoading(false);
      return;
    }

    // SECURITY (2026-08-25 architecture review, finding #3): mcc_user_session is a display cache,
    // never an authentication authority. It is intentionally not restored before Supabase validates
    // the current SDK session. A tampered/stale cache therefore cannot render an authenticated UI,
    // and a Supabase outage fails closed instead of preserving cached authentication state.
    if (!supabase) {
      updateUserSession(null);
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          establishSession(session);
        } else {
          updateUserSession(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Supabase getSession failed; clearing non-authoritative local session cache:', err);
        updateUserSession(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setLoading(false);
        return;
      }

      if (session) {
        await establishSession(session);
      } else {
        if (event === 'SIGNED_OUT') {
          updateUserSession(null);
        }
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase ist nicht konfiguriert. Bitte überprüfen Sie die Verbindungseinstellungen.');
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      console.warn('[App] Login failed:', err);
      throw new Error(err.message || 'Anmeldung fehlgeschlagen.');
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase ist nicht konfiguriert. Registrierung nicht möglich.');
    }

    try {
      // Free-tier compensating control for Supabase Pro leaked-password protection:
      // enforce the strong local policy and query HIBP with k-anonymity before Auth receives it.
      await assertStrongUncompromisedPassword(password);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      console.warn('[App] Registration failed:', err);
      throw new Error(err.message || 'Registrierung fehlgeschlagen.');
    }
  };

  const handleSetNewPassword = async (newPassword: string) => {
    setPasswordRecoveryError(null);

    if (!supabase) {
      setPasswordRecoveryError('Supabase ist nicht konfiguriert.');
      return;
    }

    setPasswordRecoverySubmitting(true);
    try {
      // Use exactly the same policy for recovery/password rotation as for signup.
      await assertStrongUncompromisedPassword(newPassword);

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordRecoveryError(error.message);
        return;
      }

      setIsPasswordRecovery(false);
      setPasswordRecoveryError(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await establishSession(session);
      }
    } catch (err: any) {
      setPasswordRecoveryError(err.message || 'Das Passwort konnte nicht aktualisiert werden.');
    } finally {
      setPasswordRecoverySubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut error:', e);
      }
    }

    clearLoginStepUpMarkers();
    setPendingStepUpSession(null);
    setPendingOnboardingSession(null);
    updateUserSession(null);
    setJustLoggedOut(true);
    setTimeout(() => {
      setJustLoggedOut(false);
    }, 5000);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn('[Auth] 401 empfangen - Session ist ungültig/abgelaufen, logge aus.');
      handleLogout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  if (loading && !renderPublicShellImmediately) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-aif-gold-DEFAULT border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-white/40 font-mono uppercase tracking-widest animate-pulse">
            Lade Sicherheits-Modul...
          </p>
        </div>
      </div>
    );
  }

  if (pendingOnboardingSession && !renderPublicShellImmediately) {
    return (
      <RegistrationCompletionGate
        session={pendingOnboardingSession}
        onComplete={async () => {
          const session = pendingOnboardingSession;
          setPendingOnboardingSession(null);
          setLoading(true);
          await handleSupabaseSession(session);
        }}
        onAbort={async () => {
          setPendingOnboardingSession(null);
          await handleLogout();
        }}
      />
    );
  }

  if (pendingStepUpSession && !renderPublicShellImmediately) {
    return (
      <LoginStepUpGate
        session={pendingStepUpSession}
        onVerified={async () => {
          const session = pendingStepUpSession;
          setPendingStepUpSession(null);
          setLoading(true);
          await handleSupabaseSession(session);
        }}
        onAbort={async () => {
          setPendingStepUpSession(null);
          await handleLogout();
        }}
      />
    );
  }

  if (isPasswordRecovery) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-aif-gold-DEFAULT selection:text-black">
        <div className="w-full max-w-md bg-black/40 border border-aif-gold-DEFAULT/30 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(245,196,83,0.1)]">
          <div className="space-y-2 text-center mb-6">
            <h1 className="text-xl font-bold font-display tracking-tight text-white">Neues Passwort festlegen</h1>
            <p className="text-xs text-white/60">Bitte vergeben Sie ein neues Passwort für Ihr Konto.</p>
            <p className="text-[11px] text-white/40">
              Mindestens {PASSWORD_MIN_LENGTH} Zeichen sowie Groß-/Kleinbuchstabe, Ziffer und Sonderzeichen.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const pw = (form.elements.namedItem('newPassword') as HTMLInputElement)?.value || '';
              const pwConfirm =
                (form.elements.namedItem('newPasswordConfirm') as HTMLInputElement)?.value || '';
              if (pw !== pwConfirm) {
                setPasswordRecoveryError('Die Passwörter stimmen nicht überein.');
                return;
              }
              handleSetNewPassword(pw);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-white/50 uppercase tracking-wider">Neues Passwort</label>
              <input
                name="newPassword"
                type="password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                autoFocus
                autoComplete="new-password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-aif-gold-DEFAULT/50 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-white/50 uppercase tracking-wider">Passwort bestätigen</label>
              <input
                name="newPasswordConfirm"
                type="password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete="new-password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-aif-gold-DEFAULT/50 outline-none"
              />
            </div>
            {passwordRecoveryError && <p className="text-xs text-red-400">{passwordRecoveryError}</p>}
            <button
              type="submit"
              disabled={passwordRecoverySubmitting}
              className="w-full px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-aif-gold-DEFAULT text-black hover:opacity-90 transition-all disabled:opacity-50"
            >
              {passwordRecoverySubmitting ? 'Wird geprüft…' : 'Passwort speichern'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (authError && !renderPublicShellImmediately) {
    return (
      <div
        id="auth-error-screen"
        className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-aif-gold-DEFAULT selection:text-black"
      >
        <div
          id="auth-error-card"
          className="w-full max-w-md bg-black/40 border border-red-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(239,68,68,0.1)] relative overflow-hidden"
        >
          <div
            id="auth-error-accent-bar"
            className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500"
          />

          <div className="flex flex-col items-center text-center space-y-6">
            <div
              id="auth-error-icon"
              className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 id="auth-error-title" className="text-xl font-bold font-display tracking-tight text-white">
                Identitäts-Diskrepanz erkannt
              </h1>
              <p className="text-xs font-mono uppercase tracking-widest text-red-400">Security Guard Protocol</p>
            </div>

            <p id="auth-error-message" className="text-sm text-white/70 leading-relaxed">
              {authError.message}
            </p>

            <div
              id="auth-error-details"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 text-left font-mono text-[11px]"
            >
              <div>
                <span className="text-white/40 block mb-0.5">Aktive Auth-Sitzung (id):</span>
                <span className="text-aif-gold-DEFAULT font-semibold break-all">{authError.expectedId}</span>
              </div>
              {authError.receivedId && (
                <div>
                  <span className="text-white/40 block mb-0.5">Vom Server gemeldet (userId):</span>
                  <span className="text-red-400 font-semibold break-all">{authError.receivedId}</span>
                </div>
              )}
              <div>
                <span className="text-white/40 block mb-0.5">Fehlercode:</span>
                <span className="text-white/80">{authError.code}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
              <button
                id="auth-error-retry-btn"
                onClick={async () => {
                  setAuthError(null);
                  setLoading(true);
                  if (supabase) {
                    try {
                      const {
                        data: { session },
                      } = await supabase.auth.getSession();
                      if (session) {
                        await establishSession(session);
                      } else {
                        updateUserSession(null);
                        setLoading(false);
                      }
                    } catch (err) {
                      console.error('Retry failed:', err);
                      updateUserSession(null);
                      setLoading(false);
                    }
                  } else {
                    updateUserSession(null);
                    setLoading(false);
                  }
                }}
                className="flex-1 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all cursor-pointer"
              >
                Erneut versuchen
              </button>
              <button
                id="auth-error-reset-btn"
                onClick={async () => {
                  setAuthError(null);
                  await handleLogout();
                }}
                className="flex-1 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 transition-all cursor-pointer"
              >
                Sitzung zurücksetzen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children({
    userSession,
    justLoggedOut,
    clearJustLoggedOut: () => setJustLoggedOut(false),
    handleLogin,
    handleRegister,
    handleLogout,
  });
}
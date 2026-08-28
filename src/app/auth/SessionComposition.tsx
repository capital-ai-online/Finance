/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { LoginStepUpGate } from '../../components/LoginStepUpGate';
import { RegistrationCompletionGate } from '../../components/RegistrationCompletionGate';
import { requestHcaptchaToken } from '../../lib/hcaptcha';
import { clearLoginStepUpMarkers } from '../../lib/loginStepUp';
import { needsOnboarding } from '../../lib/onboarding';
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
  '/login',
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
 * Supabase Auth is the sole authentication authority. Supported website primary authentication
 * methods may issue a Supabase session through email/password, Google OAuth or a native passkey.
 * Every restored or newly issued non-anonymous Supabase session is routed through LoginStepUpGate
 * so native AAL/TOTP state remains fail-closed before private application access. Owner/PR passkey
 * authorization is a separate governance boundary and is not weakened by website login methods.
 */
export function SessionComposition({ children }: SessionCompositionProps) {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [justLoggedOut, setJustLoggedOut] = useState<boolean>(false);
  const [authError, setAuthError] = useState<AuthErrorState | null>(null);
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

    // SECURITY: every authenticated Supabase session must pass the native assurance gate,
    // independently from whether primary authentication used password, Google OAuth or passkey.
    setPendingStepUpSession(session);
    setLoading(false);
  };

  useEffect(() => {
    // ADR-0003.5: development auto-login remains double-gated by exact local hostname plus an
    // explicit build flag. It is not compiled into a production authentication path by default.
    const isExplicitLocalDev =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      (import.meta as any).env?.VITE_ENABLE_DEV_AUTOLOGIN === 'true';

    if (isExplicitLocalDev) {
      const devSession: UserSession = {
        type: 'registered',
        name: 'Local Dev Admin',
        email: 'local-dev@example.invalid',
        subscriptionTier: 'Enterprise',
        id: 'local-dev-admin',
        accessToken: 'LOCAL_DEV_ONLY_INVALID_TOKEN',
      };
      setUserSession(devSession);
      localStorage.setItem('mcc_user_session', JSON.stringify(devSession));
      setLoading(false);
      return;
    }

    // Local session cache is display-only and never an authentication authority.
    if (!supabase) {
      updateUserSession(null);
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          establishSession(session).catch((err) => {
            console.error('[Auth] Initial session establishment failed:', err);
            updateUserSession(null);
            setLoading(false);
          });
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Supabase documents that awaiting another Supabase call inside onAuthStateChange may
      // deadlock the client. Defer all session work until the auth callback has returned.
      window.setTimeout(() => {
        if (session) {
          establishSession(session).catch((err) => {
            console.error('[Auth] Deferred session establishment failed:', err);
            updateUserSession(null);
            setLoading(false);
          });
          return;
        }

        updateUserSession(null);
        setPendingStepUpSession(null);
        setPendingOnboardingSession(null);
        setLoading(false);
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Existing registered website users authenticate with their Supabase email/password identity.
   * hCaptcha remains enabled as the bot-abuse control and its short-lived token is attached to the
   * password grant. A successful primary login still has to pass LoginStepUpGate afterwards.
   */
  const handleLogin = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase ist nicht konfiguriert. Anmeldung ist nicht möglich.');
    }

    try {
      const captchaToken = await requestHcaptchaToken();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn('[Auth] E-Mail-/Passwort-Anmeldung fehlgeschlagen:', err);
      throw new Error(err?.message || 'Anmeldung fehlgeschlagen.');
    }
  };

  /**
   * Account provisioning remains a separately controlled product decision. This fix restores
   * sign-in for already registered users and Google OAuth without silently reopening sign-up.
   */
  const handleRegister = async (_name: string, _email: string, _password: string) => {
    throw new Error(
      'Selbstregistrierung ist derzeit kontrolliert deaktiviert. Bereits registrierte Konten können sich per E-Mail/Passwort oder Google anmelden.',
    );
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

  // Authenticated gates always outrank the public-shell latency optimization. In particular, an
  // OAuth callback can return to `/login`, so immediately rendering the login shell must never
  // suppress onboarding/AAL processing once Supabase has established the authenticated session.
  if (pendingOnboardingSession) {
    return (
      <RegistrationCompletionGate
        session={pendingOnboardingSession}
        onComplete={async () => {
          const session = pendingOnboardingSession;
          setPendingOnboardingSession(null);
          setPendingStepUpSession(session);
          setLoading(false);
        }}
        onAbort={async () => {
          setPendingOnboardingSession(null);
          await handleLogout();
        }}
      />
    );
  }

  if (pendingStepUpSession) {
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

  if (authError) {
    return (
      <div
        id="auth-error-screen"
        className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-aif-gold-DEFAULT selection:text-black"
      >
        <div
          id="auth-error-card"
          className="w-full max-w-md bg-black/40 border border-red-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(239,68,68,0.1)] relative overflow-hidden"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-xl font-bold font-display tracking-tight text-white">
                Identitäts-Diskrepanz erkannt
              </h1>
              <p className="text-xs font-mono uppercase tracking-widest text-red-400">
                Security Guard Protocol
              </p>
            </div>

            <p className="text-sm text-white/70 leading-relaxed">{authError.message}</p>

            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 text-left font-mono text-[11px]">
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
                onClick={async () => {
                  setAuthError(null);
                  setLoading(true);
                  if (!supabase) {
                    updateUserSession(null);
                    setLoading(false);
                    return;
                  }

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
                }}
                className="flex-1 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all cursor-pointer"
              >
                Erneut versuchen
              </button>
              <button
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

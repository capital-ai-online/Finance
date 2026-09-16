/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { LoginStepUpGate } from '../../components/LoginStepUpGate';
import { RegistrationCompletionGate } from '../../components/RegistrationCompletionGate';
import { authFetch } from '../../lib/authFetch';
import { clearLoginStepUpMarkers } from '../../lib/loginStepUp';
import { needsOnboarding as readNeedsOnboarding } from '../../lib/onboarding';
import {
  getSessionBootstrapKey,
  isSessionEstablishmentEvent,
} from './sessionBootstrap';
import type { SubscriptionTier, UserSession } from '../types/UserSession';

export interface SessionCompositionValue {
  userSession: UserSession | null;
  authBootstrapPending: boolean;
  justLoggedOut: boolean;
  clearJustLoggedOut: () => void;
  handleLogin: (email: string, password: string) => Promise<void>;
  handleRegister: (name: string, email: string, password: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleGlobalLogout: () => Promise<void>;
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

const SIGN_OUT_TIMEOUT_MS = 5_000;
const SESSION_STAGE_TIMEOUT_MS = 10_000;

/**
 * Safety ceiling only. This never delays a successful operation; it prevents a provider/network
 * call from hanging forever after the UI has already remained interactive.
 */
function withSessionStageTimeout<T>(operation: () => Promise<T>, stage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Supabase session stage timed out: ${stage}`)),
      SESSION_STAGE_TIMEOUT_MS,
    );
  });

  return Promise.race([Promise.resolve().then(operation), timeout]).finally(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });
}

function needsOnboarding(session: { user: any }): Promise<boolean> {
  return withSessionStageTimeout(() => readNeedsOnboarding(session), 'onboarding status');
}

/**
 * Supabase Auth is the sole website authentication authority. Every restored or newly issued
 * non-anonymous session must pass onboarding and the native AAL/TOTP gate before private access.
 *
 * The public/browser shell never waits for Supabase initialization. `onAuthStateChange` remains the
 * sole bootstrap source and the callback stays synchronous. Follow-up work is queued as a microtask
 * so the auth callback returns before another Supabase operation begins, avoiding a callback lock
 * without introducing an artificial timer delay. Private routes receive only a boolean resolution
 * state so they do not redirect a valid restored session before the mandatory auth gates resolve.
 */
export function SessionComposition({ children }: SessionCompositionProps) {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [authBootstrapPending, setAuthBootstrapPending] = useState<boolean>(true);
  const [justLoggedOut, setJustLoggedOut] = useState<boolean>(false);
  const [authError, setAuthError] = useState<AuthErrorState | null>(null);
  const [pendingStepUpSession, setPendingStepUpSession] = useState<any | null>(null);
  const [pendingOnboardingSession, setPendingOnboardingSession] = useState<any | null>(null);
  const sessionBootstrapKeyRef = useRef<string | null>(null);

  const updateUserSession = (session: UserSession | null) => {
    setUserSession(session);
    if (session) {
      localStorage.setItem('mcc_user_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('mcc_user_session');
    }
  };

  const resetAuthProjection = () => {
    sessionBootstrapKeyRef.current = null;
    setPendingStepUpSession(null);
    setPendingOnboardingSession(null);
    updateUserSession(null);
  };

  const signOutWithTimeout = async (scope: 'local' | 'global') => {
    if (!supabase) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        supabase.auth.signOut({ scope }),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error(`Supabase ${scope} signOut timed out`)),
            SIGN_OUT_TIMEOUT_MS,
          );
        }),
      ]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const rejectAnonymousSession = async () => {
    resetAuthProjection();
    setAuthBootstrapPending(false);
    if (supabase) {
      try {
        await signOutWithTimeout('local');
      } catch (err) {
        console.warn('[Auth] Anonymous session cleanup failed:', err);
      }
    }
  };

  const handleSupabaseSession = async (session: any) => {
    const user = session?.user;
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

    // Render the authenticated application immediately with the least-privileged tier. The Stripe
    // subscription lookup is enrichment, not authentication authority, and must never hold the UI.
    const baseSession: UserSession = {
      type: 'registered',
      name,
      email,
      subscriptionTier: 'Free',
      id: user.id,
    };
    updateUserSession(baseSession);
    setAuthBootstrapPending(false);
    setJustLoggedOut(false);

    void withSessionStageTimeout(
      () => authFetch('/api/stripe/user-subscription'),
      'subscription handoff',
    ).then(async (res) => {
      if (res.status === 401 || !res.ok) return;

      const data = await res.json();
      if (data && data.userId && data.userId !== user.id) {
        console.error(
          'CRITICAL SECURITY MISMATCH: Expected User ID',
          user.id,
          'but received',
          data.userId,
        );
        resetAuthProjection();
        setAuthBootstrapPending(false);
        setAuthError({
          message:
            'Sicherheits-Fehler: Es wurde eine Diskrepanz zwischen Ihrer lokalen Benutzer-ID und der Server-ID festgestellt. Um Ihre Daten zu schützen, wurde der Zugriff vorübergehend gesperrt.',
          code: 'IDENTITY_MISMATCH_DETECTED',
          expectedId: user.id,
          receivedId: data.userId,
        });
        return;
      }

      const tier: SubscriptionTier = data?.subscriptionTier || 'Free';
      setUserSession((current) => {
        if (!current || current.type !== 'registered' || current.id !== user.id) return current;
        const next = { ...current, subscriptionTier: tier };
        localStorage.setItem('mcc_user_session', JSON.stringify(next));
        return next;
      });
    }).catch((err) => {
      console.warn('[Auth] Subscription enrichment failed; keeping least-privileged Free tier:', err);
    });
  };

  const establishSession = async (session: any) => {
    if (!session?.user || session.user.is_anonymous) {
      await rejectAnonymousSession();
      return;
    }

    const onboardingRequired = await needsOnboarding(session);
    if (onboardingRequired) {
      setPendingOnboardingSession(session);
      setAuthBootstrapPending(false);
      return;
    }

    // SECURITY: Google OAuth and native passkey both converge on this exact gate.
    setPendingStepUpSession(session);
    setAuthBootstrapPending(false);
  };

  const scheduleSessionEstablishment = (session: any) => {
    const key = getSessionBootstrapKey(session);
    if (!key || sessionBootstrapKeyRef.current === key) return;

    sessionBootstrapKeyRef.current = key;
    setAuthBootstrapPending(true);

    queueMicrotask(() => {
      establishSession(session).catch((err) => {
        console.error('[Auth] Session establishment failed:', err);
        if (sessionBootstrapKeyRef.current === key) sessionBootstrapKeyRef.current = null;
        updateUserSession(null);
        setPendingStepUpSession(null);
        setPendingOnboardingSession(null);
        setAuthBootstrapPending(false);
      });
    });
  };

  const performLogout = async (scope: 'local' | 'global') => {
    sessionBootstrapKeyRef.current = null;
    clearLoginStepUpMarkers();
    setAuthError(null);
    resetAuthProjection();
    setAuthBootstrapPending(false);
    setJustLoggedOut(true);

    try {
      await signOutWithTimeout(scope);
    } catch (e) {
      console.warn(`Supabase ${scope} signOut error:`, e);
    }
  };

  const handleLogout = async () => performLogout('local');
  const handleGlobalLogout = async () => performLogout('global');

  useEffect(() => {
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
      setAuthBootstrapPending(false);
      return;
    }

    if (!supabase) {
      resetAuthProjection();
      setAuthBootstrapPending(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        sessionBootstrapKeyRef.current = null;
        updateUserSession(null);
        setPendingStepUpSession(null);
        setPendingOnboardingSession(null);
        setAuthBootstrapPending(false);
        return;
      }

      if (!isSessionEstablishmentEvent(event)) return;
      scheduleSessionEstablishment(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (_email: string, _password: string) => {
    throw new Error(
      'Passwortbasierte Anmeldung ist deaktiviert. Verwenden Sie den nativen Passkey oder Google.',
    );
  };

  const handleRegister = async (_name: string, _email: string, _password: string) => {
    throw new Error(
      'Selbstregistrierung ist derzeit kontrolliert deaktiviert. Bereits registrierte Konten verwenden Passkey oder Google.',
    );
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn('[Auth] 401 empfangen - Session ist ungültig/abgelaufen, logge aus.');
      void handleLogout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  if (pendingOnboardingSession) {
    return (
      <RegistrationCompletionGate
        session={pendingOnboardingSession}
        onComplete={async () => {
          const session = pendingOnboardingSession;
          setPendingOnboardingSession(null);
          setPendingStepUpSession(session);
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
          const verifiedSession = pendingStepUpSession;
          setPendingStepUpSession(null);

          if (!verifiedSession?.user?.id) {
            resetAuthProjection();
            setAuthBootstrapPending(false);
            setAuthError({
              message:
                'Die verifizierte Sitzung konnte nicht eindeutig übernommen werden. Bitte bauen Sie die Sitzung erneut auf.',
              code: 'POST_MFA_SESSION_HANDOFF_FAILED',
              expectedId: 'unknown',
            });
            return;
          }

          await handleSupabaseSession(verifiedSession);
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
      <div id="auth-error-screen" className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-aif-gold-DEFAULT selection:text-black">
        <div id="auth-error-card" className="w-full max-w-md bg-black/40 border border-red-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(239,68,68,0.1)] relative overflow-hidden">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-xl font-bold font-display tracking-tight text-white">Identitäts-Diskrepanz erkannt</h1>
              <p className="text-xs font-mono uppercase tracking-widest text-red-400">Security Guard Protocol</p>
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
                  if (!supabase) {
                    resetAuthProjection();
                    setAuthBootstrapPending(false);
                    return;
                  }
                  setAuthBootstrapPending(true);
                  try {
                    const {
                      data: { session },
                    } = await withSessionStageTimeout(
                      () => supabase.auth.getSession(),
                      'auth recovery session read',
                    );
                    if (session) {
                      sessionBootstrapKeyRef.current = null;
                      await establishSession(session);
                    } else {
                      resetAuthProjection();
                      setAuthBootstrapPending(false);
                    }
                  } catch (err) {
                    console.error('Retry failed:', err);
                    resetAuthProjection();
                    setAuthBootstrapPending(false);
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
    authBootstrapPending,
    justLoggedOut,
    clearJustLoggedOut: () => setJustLoggedOut(false),
    handleLogin,
    handleRegister,
    handleLogout,
    handleGlobalLogout,
  });
}
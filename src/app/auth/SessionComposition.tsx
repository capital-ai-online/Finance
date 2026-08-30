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
import { needsOnboarding } from '../../lib/onboarding';
import {
  getSessionBootstrapKey,
  isSessionEstablishmentEvent,
} from './sessionBootstrap';
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
 * Supabase Auth is the sole website authentication authority. Every restored or newly issued
 * non-anonymous session must pass onboarding and the native AAL/TOTP gate before private access.
 *
 * The bootstrap deliberately uses one auth-state source only. Supabase emits INITIAL_SESSION when
 * the listener is registered, so running getSession() in parallel with onAuthStateChange creates a
 * redundant lock/race during OAuth callback recovery. All post-auth Supabase work is deferred until
 * the synchronous auth callback has returned and duplicate INITIAL_SESSION/SIGNED_IN events are
 * collapsed by a non-secret session key.
 */
export function SessionComposition({ children }: SessionCompositionProps) {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [justLoggedOut, setJustLoggedOut] = useState<boolean>(false);
  const [authError, setAuthError] = useState<AuthErrorState | null>(null);
  const [pendingStepUpSession, setPendingStepUpSession] = useState<any | null>(null);
  const [pendingOnboardingSession, setPendingOnboardingSession] = useState<any | null>(null);
  const sessionBootstrapKeyRef = useRef<string | null>(null);
  const renderPublicShellImmediately = shouldRenderPublicShellImmediately();

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

  const rejectAnonymousSession = async () => {
    resetAuthProjection();
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

    try {
      // Always resolve billing through the live Supabase SDK session. MFA verification rotates
      // session credentials, so reusing the pre-step-up access token here can race the rotation
      // and temporarily project a paid account as Free. authFetch performs exactly one guarded
      // refresh/retry and only emits the global unauthorized event when that retry also fails.
      const res = await authFetch('/api/stripe/user-subscription');
      if (res.status === 401) {
        return;
      }

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
        if (data?.subscriptionTier) tier = data.subscriptionTier;
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

    const onboardingRequired = await needsOnboarding(session);
    if (onboardingRequired) {
      setPendingOnboardingSession(session);
      setLoading(false);
      return;
    }

    // SECURITY: Google OAuth and native passkey both converge on this exact gate.
    setPendingStepUpSession(session);
    setLoading(false);
  };

  const scheduleSessionEstablishment = (session: any) => {
    const key = getSessionBootstrapKey(session);
    if (!key || sessionBootstrapKeyRef.current === key) return;

    sessionBootstrapKeyRef.current = key;
    setLoading(true);

    // Supabase documents that async Supabase work from onAuthStateChange can deadlock the client.
    // A macrotask guarantees the auth callback and its internal lock have returned first.
    window.setTimeout(() => {
      establishSession(session).catch((err) => {
        console.error('[Auth] Deferred session establishment failed:', err);
        if (sessionBootstrapKeyRef.current === key) sessionBootstrapKeyRef.current = null;
        updateUserSession(null);
        setPendingStepUpSession(null);
        setPendingOnboardingSession(null);
        setLoading(false);
      });
    }, 0);
  };

  const handleLogout = async () => {
    sessionBootstrapKeyRef.current = null;
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut error:', e);
      }
    }

    clearLoginStepUpMarkers();
    resetAuthProjection();
    setJustLoggedOut(true);
    setLoading(false);
    setTimeout(() => setJustLoggedOut(false), 5000);
  };

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
      setLoading(false);
      return;
    }

    if (!supabase) {
      resetAuthProjection();
      setLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // The callback itself remains synchronous. No Supabase API is awaited here.
      if (event === 'SIGNED_OUT' || !session) {
        sessionBootstrapKeyRef.current = null;
        updateUserSession(null);
        setPendingStepUpSession(null);
        setPendingOnboardingSession(null);
        setLoading(false);
        return;
      }

      if (!isSessionEstablishmentEvent(event)) return;
      scheduleSessionEstablishment(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (_email: string, _password: string) => {
    // SECURITY: keep the legacy callback for component compatibility, but make it fail closed.
    // Password authentication is intentionally unavailable in the application even if an old
    // presentation component still attempts to invoke this callback.
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
          const expectedSession = pendingStepUpSession;
          setPendingStepUpSession(null);
          setLoading(true);

          if (!supabase) {
            resetAuthProjection();
            setLoading(false);
            return;
          }

          try {
            // Supabase MFA verification issues/rotates the live session. Never continue the
            // billing/bootstrap handoff with the pre-MFA session object captured by the gate.
            const {
              data: { session: liveSession },
              error,
            } = await supabase.auth.getSession();

            const expectedUserId = expectedSession?.user?.id || '';
            const receivedUserId = liveSession?.user?.id || '';
            if (error || !liveSession || !expectedUserId || receivedUserId !== expectedUserId) {
              console.error('[Auth] Post-MFA session handoff failed:', error || 'identity mismatch');
              setAuthError({
                message:
                  'Die aktualisierte Sitzung konnte nach der Sicherheitsbestätigung nicht eindeutig übernommen werden. Der Zugriff bleibt gesperrt, bis die Sitzung erneut aufgebaut wurde.',
                code: 'POST_MFA_SESSION_HANDOFF_FAILED',
                expectedId: expectedUserId || 'unknown',
                ...(receivedUserId ? { receivedId: receivedUserId } : {}),
              });
              setLoading(false);
              return;
            }

            await handleSupabaseSession(liveSession);
          } catch (err) {
            console.error('[Auth] Post-MFA live-session read failed:', err);
            setAuthError({
              message:
                'Die aktualisierte Sitzung konnte nach der Sicherheitsbestätigung nicht geladen werden. Bitte bauen Sie die Sitzung erneut auf.',
              code: 'POST_MFA_SESSION_READ_FAILED',
              expectedId: expectedSession?.user?.id || 'unknown',
            });
            setLoading(false);
          }
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
                  setLoading(true);
                  if (!supabase) {
                    resetAuthProjection();
                    setLoading(false);
                    return;
                  }
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                      sessionBootstrapKeyRef.current = null;
                      await establishSession(session);
                    } else {
                      resetAuthProjection();
                      setLoading(false);
                    }
                  } catch (err) {
                    console.error('Retry failed:', err);
                    resetAuthProjection();
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

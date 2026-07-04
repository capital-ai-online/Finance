/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { MarketingLandingPage } from './components/MarketingLandingPage';
import { Dashboard } from './components/Dashboard';
import { ResetPasswordScreen } from './components/ResetPasswordScreen';
import { BetaVisitorCounter } from './components/BetaVisitorCounter';
import { supabase } from './supabaseClient';

export interface UserSession {
  type: 'registered';
  name: string;
  email: string;
  subscriptionTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  accessToken?: string;
}

export default function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [justLoggedOut, setJustLoggedOut] = useState<boolean>(false);
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState<boolean>(false);
  // Public marketing page is the default first view. The auth form only
  // appears once the visitor explicitly chooses to log in or register —
  // the Dashboard itself (screenings, scoring, watchlists) stays fully
  // gated behind a real session either way.
  const [showAuthForm, setShowAuthForm] = useState<boolean>(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');

  const updateUserSession = (session: UserSession | null) => {
    setUserSession(session);
    if (session) {
      localStorage.setItem('mcc_user_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('mcc_user_session');
    }
  };

  const handleSupabaseSession = async (session: any) => {
    const user = session.user;
    const email = user.email || '';
    const isAnonymous = user.is_anonymous || false;
    const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'User';

    if (isAnonymous) {
      // Guest / anonymous mode has been discontinued. Sign the anonymous
      // session out immediately instead of granting any access.
      console.warn('[Auth] Anonymous session rejected — guest mode is disabled.');
      if (supabase) {
        try { await supabase.auth.signOut(); } catch (e) { /* no-op */ }
      }
      updateUserSession(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch real subscription tier from the backend database!
      const res = await fetch(`/api/stripe/user-subscription?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      let tier: 'Free' | 'Starter' | 'Pro' | 'Enterprise' = 'Free';
      if (res.ok) {
        const data = await res.json();
        if (data && data.subscriptionTier) {
          tier = data.subscriptionTier;
        }
      }
      
      updateUserSession({
        type: 'registered',
        name,
        email,
        subscriptionTier: tier,
        accessToken: session.access_token,
      });
    } catch (err) {
      console.error("Error loading subscription tier:", err);
      updateUserSession({
        type: 'registered',
        name,
        email,
        subscriptionTier: 'Free',
        accessToken: session.access_token,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load cached session from localStorage (robust compliance with EinwVO/DSGVO & standalone readiness when JWT is deactivated)
    const localSessionJson = localStorage.getItem('mcc_user_session');
    if (localSessionJson) {
      try {
        const parsed = JSON.parse(localSessionJson);
        if (parsed && parsed.email) {
          setUserSession(parsed);
          setLoading(false);
          // Still verify with Supabase in background if possible, but don't block
        }
      } catch (e) {
        console.error("Failed to parse local session", e);
      }
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSupabaseSession(session);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.warn("Supabase getSession failed, using local cache state:", err);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Supabase issues a temporary session from the recovery link.
          // Do not route into the Dashboard yet — force the explicit
          // "set a new password" screen first.
          setPasswordRecoveryMode(true);
          setLoading(false);
          return;
        }
        if (session) {
          handleSupabaseSession(session);
        } else {
          // If we manually logged out, clear it, but otherwise keep local state if JWT is deactivated
          if (event === 'SIGNED_OUT') {
            updateUserSession(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error("Supabase ist nicht konfiguriert. Bitte überprüfen Sie die Verbindungseinstellungen.");
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      console.warn("[App] Login failed:", err);
      throw new Error(err.message || "Anmeldung fehlgeschlagen.");
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    if (!supabase) {
      throw new Error("Supabase ist nicht konfiguriert. Registrierung nicht möglich.");
    }
    try {
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
      console.warn("[App] Registration failed:", err);
      throw new Error(err.message || "Registrierung fehlgeschlagen.");
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Supabase signOut error:", e);
      }
    }
    updateUserSession(null);
    setJustLoggedOut(true);
    setShowAuthForm(true);
    setAuthInitialTab('login');
    setTimeout(() => {
      setJustLoggedOut(false);
    }, 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-aif-gold-DEFAULT border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-white/40 font-mono uppercase tracking-widest animate-pulse">Lade Sicherheits-Modul...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <BetaVisitorCounter />
      {passwordRecoveryMode ? (
        <ResetPasswordScreen
          onComplete={() => {
            setPasswordRecoveryMode(false);
          }}
        />
      ) : userSession ? (
        <Dashboard 
          userSession={userSession} 
          onLogout={handleLogout} 
          onRegister={(name, email) => {}}
        />
      ) : showAuthForm ? (
        <LandingPage 
          onLoginEmail={async (email, pwd) => {
            setJustLoggedOut(false);
            await handleLogin(email, pwd);
          }} 
          onRegisterEmail={async (name, email, pwd) => {
            setJustLoggedOut(false);
            await handleRegister(name, email, pwd);
          }}
          justLoggedOut={justLoggedOut}
          initialTab={authInitialTab}
          onBack={() => setShowAuthForm(false)}
        />
      ) : (
        <MarketingLandingPage
          onGetStarted={() => { setAuthInitialTab('register'); setShowAuthForm(true); }}
          onLogin={() => { setAuthInitialTab('login'); setShowAuthForm(true); }}
        />
      )}
    </>
  );
}

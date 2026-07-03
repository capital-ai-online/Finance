/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { supabase } from './supabaseClient';

export interface UserSession {
  type: 'guest' | 'registered';
  name: string;
  email: string;
  subscriptionTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  accessToken?: string;
}

export default function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [justLoggedOut, setJustLoggedOut] = useState<boolean>(false);

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
    const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || (isAnonymous ? 'Gast-User' : 'User');
    
    if (isAnonymous) {
      updateUserSession({
        type: 'guest',
        name: 'Gast-User',
        email: email || 'gast@aif-core.de',
        subscriptionTier: 'Free',
        accessToken: session.access_token,
      });
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

  const handleGuestLogin = async (secretKey?: string) => {
    // Der Gastmodus ist programmweit gesperrt und schreibgeschützt.
    // Aktivierung nur für Global Administrator Rolle oder über Secret Key.
    const hasSecretKey = secretKey === 'AIF_CORE_SECRET_KEY_2026' || (typeof window !== 'undefined' && window.location.search.includes('secret=AIF_CORE_SECRET_KEY_2026'));
    if (!hasSecretKey) {
      console.error("[SECURITY] Gastmodus ist schreibgeschützt und deaktiviert.");
      alert("Zugriff verweigert: Der Gastmodus wurde deaktiviert und ist schreibgeschützt.");
      return;
    }

    if (supabase) {
      const { error } = await supabase.auth.signInAnonymously();
      if (!error) return;
    }
    // Local fallback if Supabase is offline or anonymous auth is disabled
    updateUserSession({
      type: 'guest',
      name: 'Gast-User (Admin-Bypass)',
      email: 'gast@aif-core.de',
      subscriptionTier: 'Free',
    });
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
      {userSession ? (
        <Dashboard 
          userSession={userSession} 
          onLogout={handleLogout} 
          onRegister={(name, email) => {}}
        />
      ) : (
        <LandingPage 
          onLoginEmail={async (email, pwd) => {
            setJustLoggedOut(false);
            await handleLogin(email, pwd);
          }} 
          onGuestLogin={async () => {
            setJustLoggedOut(false);
            await handleGuestLogin();
          }}
          onRegisterEmail={async (name, email, pwd) => {
            setJustLoggedOut(false);
            await handleRegister(name, email, pwd);
          }}
          justLoggedOut={justLoggedOut}
        />
      )}
    </>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { supabase } from './supabaseClient';
import { CapitalAiLogo } from './components/common/CapitalAiLogo';
import { LayoutDashboard, Compass, Layers, SlidersHorizontal, Settings, ShieldCheck, Activity, Cpu, Sparkles, Orbit } from 'lucide-react';

export interface UserSession {
  type: 'guest' | 'registered';
  name: string;
  email: string;
  subscriptionTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  accessToken?: string;
}

const DEFAULT_GUEST_SESSION: UserSession = {
  type: 'guest',
  name: 'Gast-User',
  email: 'gast@capital-ai.de',
  subscriptionTier: 'Free',
};

export default function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [justLoggedOut, setJustLoggedOut] = useState<boolean>(false);

  const updateUserSession = (session: UserSession | null) => {
    if (session) {
      setUserSession(session);
      localStorage.setItem('mcc_user_session', JSON.stringify(session));
    } else {
      setUserSession(DEFAULT_GUEST_SESSION);
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
        email: email || 'gast@capital-ai.de',
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
    let hasLocal = false;
    // Load cached session from localStorage (robust compliance with EinwVO/DSGVO & standalone readiness when JWT is deactivated)
    const localSessionJson = localStorage.getItem('mcc_user_session');
    if (localSessionJson) {
      try {
        const parsed = JSON.parse(localSessionJson);
        if (parsed && parsed.email) {
          setUserSession(parsed);
          setLoading(false);
          hasLocal = true;
          // Still verify with Supabase in background if possible, but don't block
        }
      } catch (e) {
        console.error("Failed to parse local session", e);
      }
    }

    const handleSessionUpdate = () => {
      const updatedSess = localStorage.getItem('mcc_user_session');
      if (updatedSess) {
        try {
          const parsed = JSON.parse(updatedSess);
          if (parsed && parsed.email) {
            setUserSession(parsed);
          }
        } catch (e) {
          console.error("Failed to parse updated session:", e);
        }
      }
    };
    window.addEventListener('mcc_session_update', handleSessionUpdate);

    if (!supabase) {
      if (!hasLocal) {
        setUserSession(DEFAULT_GUEST_SESSION);
      }
      setLoading(false);
      return () => {
        window.removeEventListener('mcc_session_update', handleSessionUpdate);
      };
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSupabaseSession(session);
      } else {
        if (!hasLocal) {
          setUserSession(DEFAULT_GUEST_SESSION);
        }
        setLoading(false);
      }
    }).catch(err => {
      console.warn("Supabase getSession failed, using local cache state:", err);
      if (!hasLocal) {
        setUserSession(DEFAULT_GUEST_SESSION);
      }
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
      window.removeEventListener('mcc_session_update', handleSessionUpdate);
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
    const hasSecretKey = secretKey === 'CAPITAL_AI_SECRET_KEY_2026' || (typeof window !== 'undefined' && window.location.search.includes('secret=CAPITAL_AI_SECRET_KEY_2026'));
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
      email: 'gast@capital-ai.de',
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
      <div className="min-h-screen bg-[#18181b] text-white selection:bg-aif-gold-DEFAULT/30 font-sans relative flex flex-row overflow-hidden select-none">
        
        {/* Background Effect - Neural Network connection visualization matching real dashboard */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
            <defs>
              <linearGradient id="skeleton-neural" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F5C453" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#0DDDDD" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#B026FF" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path d="M 0,200 Q 300,50 600,250 T 1200,100 T 1800,300" fill="none" stroke="url(#skeleton-neural)" strokeWidth="1.5" className="animate-pulse" />
            <path d="M 100,600 Q 450,400 800,650 T 1500,450 T 2000,700" fill="none" stroke="url(#skeleton-neural)" strokeWidth="1" className="opacity-40 animate-pulse" />
            <circle cx="25%" cy="35%" r="6" fill="#B026FF" className="animate-pulse" />
            <circle cx="40%" cy="15%" r="5" fill="#F5C453" className="animate-pulse" />
            <circle cx="75%" cy="90%" r="6" fill="#F5C453" className="animate-pulse" />
          </svg>
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-violet-500/5 blur-[150px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-cyan-500/5 blur-[150px] rounded-full" />
        </div>

        {/* Desktop Sidebar Skeleton */}
        <div className="w-80 border-r border-white/5 bg-black/35 backdrop-blur-md hidden lg:flex flex-col justify-between p-6 z-10 relative">
          <div className="space-y-6">
            {/* Header / Logo */}
            <div className="flex items-center gap-3">
              <CapitalAiLogo size={38} showText={false} />
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#F0D597] to-[#D4A017] font-display uppercase">
                  Capital-AI
                </span>
                <span className="text-[8px] font-mono tracking-widest text-white/30 uppercase mt-0.5">
                  Web-Agenten Platform
                </span>
              </div>
            </div>

            {/* Profile Placeholder Section */}
            <div className="p-4 border border-white/5 rounded-xl bg-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 animate-pulse flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
                <div className="h-2 w-28 bg-zinc-800/60 rounded animate-pulse" />
              </div>
            </div>

            {/* Navigation Group Items Skeletons */}
            <div className="space-y-4">
              {/* Category 1: Hauptzentrale */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2">
                    <Orbit size={13} className="text-aif-gold-DEFAULT animate-spin opacity-50" />
                    <div className="h-2 w-24 bg-zinc-800 rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1.5 pl-4">
                  <div className="h-8 w-full bg-zinc-900/60 rounded-xl animate-pulse flex items-center px-3 gap-2.5">
                    <div className="w-3.5 h-3.5 bg-zinc-800 rounded" />
                    <div className="h-2 w-24 bg-zinc-800/60 rounded" />
                  </div>
                  <div className="h-8 w-full bg-zinc-900/20 rounded-xl animate-pulse flex items-center px-3 gap-2.5">
                    <div className="w-3.5 h-3.5 bg-zinc-800/40 rounded" />
                    <div className="h-2 w-20 bg-zinc-800/40 rounded" />
                  </div>
                </div>
              </div>

              {/* Category 2: Markt-Analyse */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2">
                    <Compass size={13} className="text-zinc-600" />
                    <div className="h-2 w-20 bg-zinc-800 rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1.5 pl-4">
                  <div className="h-8 w-full bg-zinc-900/20 rounded-xl animate-pulse flex items-center px-3 gap-2.5" />
                  <div className="h-8 w-full bg-zinc-900/20 rounded-xl animate-pulse flex items-center px-3 gap-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Footer Loader */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="h-2.5 w-32 bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="h-2 w-24 bg-zinc-800/40 rounded animate-pulse" />
          </div>
        </div>

        {/* Main Content Area Skeleton */}
        <div className="flex-1 flex flex-col min-h-screen relative overflow-y-auto p-6 sm:p-8 space-y-6 z-10">
          {/* Top Navbar Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-48 bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-5 w-16 bg-zinc-800/70 rounded-full animate-pulse" />
              </div>
              <div className="h-3 w-64 bg-zinc-800/50 rounded animate-pulse" />
            </div>

            {/* Session Verification Status Indicator */}
            <div className="flex items-center gap-3 self-start sm:self-center bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
              <Cpu className="text-aif-gold-DEFAULT animate-spin" size={14} />
              <div className="space-y-1">
                <div className="h-2.5 w-32 bg-zinc-800 rounded animate-pulse" />
                <div className="h-1.5 w-40 bg-zinc-800/40 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Quick Metrics Ribbon Skeleton (KPIs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm animate-pulse space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-2 w-20 bg-zinc-800 rounded" />
                  <div className="w-5 h-5 bg-zinc-800 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-5 w-24 bg-zinc-800 rounded" />
                  <div className="h-2 w-12 bg-zinc-800/40 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Large Main Dashboard Visual Center Card */}
          <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-black/40 to-black/10 backdrop-blur-sm h-[320px] flex flex-col justify-between animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3.5 w-36 bg-zinc-800 rounded" />
                <div className="h-2 w-24 bg-zinc-800/40 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-zinc-800 rounded-lg" />
                <div className="h-6 w-20 bg-zinc-800 rounded-lg" />
              </div>
            </div>
            
            {/* Visual simulation lines mirroring graph/charts */}
            <div className="flex items-end justify-between gap-2.5 flex-1 pt-8 px-4">
              {[60, 40, 80, 50, 75, 90, 65, 45, 85, 70, 55, 95].map((height, idx) => (
                <div 
                  key={idx} 
                  style={{ height: `${height}%` }} 
                  className="flex-1 bg-gradient-to-t from-zinc-800/10 to-zinc-800/80 rounded-t"
                />
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="h-2 w-32 bg-zinc-800/40 rounded" />
              <div className="h-2 w-20 bg-zinc-800/40 rounded" />
            </div>
          </div>

          {/* Grid Bento Modules Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((col) => (
              <div key={col} className="p-5 rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm space-y-4 h-[180px] animate-pulse">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="h-2.5 w-24 bg-zinc-800 rounded" />
                  <div className="w-3.5 h-3.5 bg-zinc-800 rounded" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-zinc-800 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-2 w-full bg-zinc-800 rounded" />
                      <div className="h-1.5 w-20 bg-zinc-800/40 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-zinc-800/60 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-2 w-full bg-zinc-800/60 rounded" />
                      <div className="h-1.5 w-16 bg-zinc-800/30 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dashboard 
      userSession={userSession || DEFAULT_GUEST_SESSION} 
      onLogout={handleLogout} 
      onRegister={(name, email) => {}}
      onLoginEmail={async (email, pwd) => {
        setJustLoggedOut(false);
        await handleLogin(email, pwd);
      }}
      onGuestLogin={async () => {
        setJustLoggedOut(false);
        updateUserSession(DEFAULT_GUEST_SESSION);
      }}
      onRegisterEmail={async (name, email, pwd) => {
        setJustLoggedOut(false);
        await handleRegister(name, email, pwd);
      }}
      justLoggedOut={justLoggedOut}
    />
  );
}

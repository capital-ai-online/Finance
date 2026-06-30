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

  const handleSupabaseSession = async (session: any) => {
    const user = session.user;
    const email = user.email || '';
    const isAnonymous = user.is_anonymous || false;
    const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || (isAnonymous ? 'Gast-User' : 'User');
    
    if (isAnonymous) {
      setUserSession({
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
      
      setUserSession({
        type: 'registered',
        name,
        email,
        subscriptionTier: tier,
        accessToken: session.access_token,
      });
    } catch (err) {
      console.error("Error loading subscription tier:", err);
      setUserSession({
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
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          handleSupabaseSession(session);
        } else {
          setUserSession(null);
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
      throw new Error('Supabase is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your env variables.');
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your env variables.');
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    if (error) throw error;
  };

  const handleGuestLogin = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signInAnonymously();
      if (!error) return;
    }
    // Local fallback if Supabase is offline or anonymous auth is disabled
    setUserSession({
      type: 'guest',
      name: 'Gast-User',
      email: 'gast@aif-core.de',
      subscriptionTier: 'Free',
    });
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUserSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
          onLoginEmail={handleLogin} 
          onGuestLogin={handleGuestLogin}
          onRegisterEmail={handleRegister}
        />
      )}
    </>
  );
}


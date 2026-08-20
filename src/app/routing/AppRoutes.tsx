/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Dashboard } from '../../components/Dashboard';
import { Datenschutz } from '../../components/Datenschutz';
import { ImpressumAgb } from '../../components/ImpressumAgb';
import { LandingPage } from '../../components/LandingPage';
import type { UserSession } from '../types/UserSession';

interface AppRoutesProps {
  userSession: UserSession | null;
  justLoggedOut: boolean;
  clearJustLoggedOut: () => void;
  handleLogin: (email: string, password: string) => Promise<void>;
  handleRegister: (name: string, email: string, password: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

/**
 * BB-1 route/presentation composition.
 *
 * This module intentionally preserves the existing lightweight pathname
 * routing semantics. Introducing a routing framework or moving feature
 * implementations belongs to a separate migration decision/wave.
 */
export function AppRoutes({
  userSession,
  justLoggedOut,
  clearJustLoggedOut,
  handleLogin,
  handleRegister,
  handleLogout,
}: AppRoutesProps) {
  const [currentPath] = useState(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });

  if (currentPath === '/datenschutz' || currentPath === '/datenschutz/') {
    return (
      <div className="min-h-screen bg-black text-white py-12 px-4 relative overflow-y-auto selection:bg-cyan-500/30 selection:text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,221,221,0.08),rgba(0,0,0,0))]" />
        <div className="max-w-5xl mx-auto space-y-6 relative z-10">
          <div className="flex justify-between items-center bg-[#0d0e12]/80 border border-white/10 rounded-xl p-4 backdrop-blur-md">
            <a
              href="/"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold font-mono rounded-lg transition-all flex items-center gap-2 text-white"
            >
              ← Zurück zum Portal
            </a>
            <span className="text-[10px] font-mono text-white/40 font-bold uppercase tracking-widest hidden sm:inline">
              Public Security Compliance Document
            </span>
          </div>
          <Datenschutz />
        </div>
      </div>
    );
  }

  if (currentPath === '/impressum' || currentPath === '/impressum/') {
    return (
      <div className="min-h-screen bg-black text-white py-12 px-4 relative overflow-y-auto selection:bg-aif-gold-DEFAULT/30 selection:text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,196,83,0.08),rgba(0,0,0,0))]" />
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="flex justify-between items-center bg-[#0d0e12]/80 border border-white/10 rounded-xl p-4 backdrop-blur-md">
            <a
              href="/"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold font-mono rounded-lg transition-all flex items-center gap-2 text-white"
            >
              ← Zurück zum Portal
            </a>
            <span className="text-[10px] font-mono text-white/40 font-bold uppercase tracking-widest hidden sm:inline">
              Public Corporate Disclosure (TMG §5)
            </span>
          </div>
          <ImpressumAgb />
        </div>
      </div>
    );
  }

  if (currentPath === '/agb' || currentPath === '/agb/') {
    return (
      <div className="min-h-screen bg-black text-white py-12 px-4 relative overflow-y-auto selection:bg-aif-gold-DEFAULT/30 selection:text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,196,83,0.08),rgba(0,0,0,0))]" />
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="flex justify-between items-center bg-[#0d0e12]/80 border border-white/10 rounded-xl p-4 backdrop-blur-md">
            <a
              href="/"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold font-mono rounded-lg transition-all flex items-center gap-2 text-white"
            >
              ← Zurück zum Portal
            </a>
            <span className="text-[10px] font-mono text-white/40 font-bold uppercase tracking-widest hidden sm:inline">
              Allgemeine Geschäftsbedingungen
            </span>
          </div>
          <ImpressumAgb initialTab="agb" />
        </div>
      </div>
    );
  }

  if (userSession) {
    return (
      <Dashboard
        userSession={userSession}
        onLogout={handleLogout}
        onRegister={(name, email) => {}}
        onLoginEmail={handleLogin}
        onRegisterEmail={handleRegister}
      />
    );
  }

  return (
    <LandingPage
      onLoginEmail={async (email, password) => {
        clearJustLoggedOut();
        await handleLogin(email, password);
      }}
      onGuestLogin={() => {
        // Compatibility prop until LandingPage API cleanup: guest access is disabled.
      }}
      onRegisterEmail={async (name, email, password) => {
        clearJustLoggedOut();
        await handleRegister(name, email, password);
      }}
      justLoggedOut={justLoggedOut}
    />
  );
}

/** 
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Dashboard } from '../../components/Dashboard';
import { Datenschutz } from '../../components/Datenschutz';
import { ImpressumAgb } from '../../components/ImpressumAgb';
import { LandingPage } from '../../components/LandingPage';
import { MediaStudio } from '../../features/social/ui';
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
              Anbieterkennzeichnung gemäß § 5 DDG
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

  if (userSession && (currentPath === '/media-studio' || currentPath === '/media-studio/')) {
    return (
      <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1680px] space-y-5">
          <header className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0d0e12]/85 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-aif-gold-DEFAULT">
                CAPITAL-AI / SOCIAL / MEDIA
              </p>
              <h1 className="mt-1 text-lg font-black text-white">Media Creation Studio</h1>
            </div>
            <a
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT"
            >
              ← Zurück zum Cockpit
            </a>
          </header>
          <MediaStudio />
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
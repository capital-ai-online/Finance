/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { LandingPage, LegalAndFaqPages, LoginPage } from '../../features/public/ui';
import type { UserSession } from '../types/UserSession';

const Dashboard = lazy(() =>
  import('../dashboard/Dashboard').then((module) => ({ default: module.Dashboard })),
);
const LearningVocabulary = lazy(() =>
  import('../../features/learning/ui/LearningVocabulary').then((module) => ({
    default: module.LearningVocabulary,
  })),
);
const MediaStudio = lazy(() =>
  import('../../features/social/ui/MediaStudio').then((module) => ({ default: module.MediaStudio })),
);

interface AppRoutesProps {
  userSession: UserSession | null;
  authBootstrapPending: boolean;
  justLoggedOut: boolean;
  clearJustLoggedOut: () => void;
  handleLogin: (email: string, password: string) => Promise<void>;
  handleRegister: (name: string, email: string, password: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleGlobalLogout: () => Promise<void>;
}

function RouteLoadingBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-white">
          <p className="text-xs font-mono uppercase tracking-widest text-white/45">Ansicht wird geladen…</p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

function AuthRouteResolution() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-white">
      <div className="max-w-md text-center">
        <p className="text-xs font-mono uppercase tracking-widest text-white/55">
          Sichere Sitzung wird synchronisiert
        </p>
        <a
          href="/"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10"
        >
          Zur öffentlichen Landingpage
        </a>
      </div>
    </div>
  );
}

function normalizeRoutePath(rawPath: string): string {
  return rawPath.trim().toLowerCase().replace(/\/+$/, '') || '/';
}

function RouteRedirect({ to, label }: { to: string; label: string }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace(to);
    }
  }, [to]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-white">
      <a
        href={to}
        className="text-xs font-bold uppercase tracking-wider text-aif-gold-DEFAULT hover:underline"
      >
        {label}
      </a>
    </div>
  );
}

export function AppRoutes({
  userSession,
  authBootstrapPending,
  justLoggedOut,
  clearJustLoggedOut,
  handleLogin,
  handleRegister,
  handleLogout,
  handleGlobalLogout,
}: AppRoutesProps) {
  const [currentPath] = useState(() => {
    return typeof window !== 'undefined'
      ? normalizeRoutePath(window.location.pathname)
      : '/';
  });

  const renderAuthenticatedDashboard = () => {
    if (!userSession) {
      if (authBootstrapPending) return <AuthRouteResolution />;
      return <RouteRedirect to="/login" label="Weiter zur Anmeldung" />;
    }

    return (
      <RouteLoadingBoundary>
        <Dashboard
          userSession={userSession}
          onLogout={async () => {
            await handleLogout();
            if (typeof window !== 'undefined') {
              window.location.replace('/');
            }
          }}
          onGlobalLogout={async () => {
            await handleGlobalLogout();
            if (typeof window !== 'undefined') {
              window.location.replace('/');
            }
          }}
          onRegister={() => undefined}
          onLoginEmail={handleLogin}
          onRegisterEmail={handleRegister}
        />
      </RouteLoadingBoundary>
    );
  };

  if (
    currentPath === '/datenschutz' ||
    currentPath === '/impressum' ||
    currentPath === '/agb' ||
    currentPath === '/faq'
  ) {
    return <LegalAndFaqPages route={currentPath} />;
  }

  if (currentPath === '/learning-platform') {
    return (
      <div className="min-h-screen bg-[#18181b] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <header className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0d0e12]/85 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-aif-gold-DEFAULT">
                CAPITAL-AI / LEARNING
              </p>
              <p className="mt-1 text-sm font-bold text-white/70">Canonical Vocabulary · Read-only</p>
            </div>
            <a href="/" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT">
              ← Zurück zur Landingpage
            </a>
          </header>
          <RouteLoadingBoundary>
            <LearningVocabulary />
          </RouteLoadingBoundary>
        </div>
      </div>
    );
  }

  if (currentPath === '/') {
    return <LandingPage onLoginNavigate={clearJustLoggedOut} />;
  }

  if (currentPath === '/login') {
    return <LoginPage onLoginEmail={handleLogin} justLoggedOut={justLoggedOut} />;
  }

  if (currentPath === '/dashboard') {
    return renderAuthenticatedDashboard();
  }

  if (currentPath === '/media-studio') {
    if (!userSession) {
      if (authBootstrapPending) return <AuthRouteResolution />;
      return <RouteRedirect to="/login" label="Weiter zur Anmeldung" />;
    }

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
            <a href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT">
              ← Zurück zum Dashboard
            </a>
          </header>
          <RouteLoadingBoundary>
            <MediaStudio />
          </RouteLoadingBoundary>
        </div>
      </div>
    );
  }

  if (userSession) {
    return <RouteRedirect to="/" label="Zur Landingpage" />;
  }

  if (authBootstrapPending) {
    return <AuthRouteResolution />;
  }

  return <RouteRedirect to="/" label="Zur Landingpage" />;
}

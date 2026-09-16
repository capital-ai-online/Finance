/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Datenschutz, ImpressumAgb, LandingPage, LoginPage } from '../../features/public/ui';
import type { UserSession } from '../types/UserSession';

const Dashboard = lazy(() =>
  import('../dashboard/Dashboard').then((module) => ({ default: module.Dashboard })),
);
const PublicAnalysisWorkbench = lazy(() =>
  import('../public/PublicAnalysisWorkbench').then((module) => ({
    default: module.PublicAnalysisWorkbench,
  })),
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

interface PublicPreviewErrorBoundaryState {
  hasError: boolean;
}

class PublicPreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  PublicPreviewErrorBoundaryState
> {
  state: PublicPreviewErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PublicPreviewErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Public analysis workbench failed to render:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-surface/35 px-4 py-10 text-center text-text-primary sm:px-6">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary">
            Bewertungstools vorübergehend nicht verfügbar
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
            Die öffentliche CAPITAL-AI-Landingpage bleibt verfügbar. Die Analyse-Workbench konnte in diesem Browser nicht gestartet werden.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-xs font-black uppercase tracking-wider text-background"
            >
              Zur Anmeldung
            </a>
            <a
              href="/learning-platform"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface/50 px-4 py-2 text-xs font-bold text-text-primary"
            >
              Learning öffnen
            </a>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

function PublicPreviewBoundary({ children }: { children: React.ReactNode }) {
  return (
    <PublicPreviewErrorBoundary>
      <Suspense
        fallback={
          <section className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-surface/35 px-4 py-10 text-text-primary sm:px-6">
            <p className="text-xs font-mono uppercase tracking-widest text-text-secondary">Bewertungstools werden geladen…</p>
          </section>
        }
      >
        {children}
      </Suspense>
    </PublicPreviewErrorBoundary>
  );
}

function PublicAnalysisPreview() {
  return (
    <PublicPreviewBoundary>
      <PublicAnalysisWorkbench />
    </PublicPreviewBoundary>
  );
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
      ? window.location.pathname.replace(/\/+$/, '') || '/'
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

  if (currentPath === '/datenschutz') {
    return (
      <div className="min-h-screen bg-black text-white py-12 px-4 relative overflow-y-auto selection:bg-cyan-500/30 selection:text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,221,221,0.08),rgba(0,0,0,0))]" />
        <div className="max-w-5xl mx-auto space-y-6 relative z-10">
          <div className="flex justify-between items-center bg-[#0d0e12]/80 border border-white/10 rounded-xl p-4 backdrop-blur-md">
            <a href="/" className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold font-mono rounded-lg transition-all flex items-center gap-2 text-white">
              ← Zurück zur Landingpage
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

  if (currentPath === '/impressum') {
    return (
      <div className="min-h-screen bg-black text-white py-12 px-4 relative overflow-y-auto selection:bg-aif-gold-DEFAULT/30 selection:text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,196,83,0.08),rgba(0,0,0,0))]" />
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="flex justify-between items-center bg-[#0d0e12]/80 border border-white/10 rounded-xl p-4 backdrop-blur-md">
            <a href="/" className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold font-mono rounded-lg transition-all flex items-center gap-2 text-white">
              ← Zurück zur Landingpage
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

  if (currentPath === '/agb') {
    return (
      <div className="min-h-screen bg-black text-white py-12 px-4 relative overflow-y-auto selection:bg-aif-gold-DEFAULT/30 selection:text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,196,83,0.08),rgba(0,0,0,0))]" />
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="flex justify-between items-center bg-[#0d0e12]/80 border border-white/10 rounded-xl p-4 backdrop-blur-md">
            <a href="/" className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold font-mono rounded-lg transition-all flex items-center gap-2 text-white">
              ← Zurück zur Landingpage
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
    if (userSession) {
      return <RouteRedirect to="/dashboard" label="Weiter zum Dashboard" />;
    }

    return (
      <LandingPage
        onLoginNavigate={clearJustLoggedOut}
        preview={<PublicAnalysisPreview />}
      />
    );
  }

  if (currentPath === '/login') {
    if (userSession) {
      return <RouteRedirect to="/dashboard" label="Weiter zum Dashboard" />;
    }
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
    return <RouteRedirect to="/dashboard" label="Weiter zum Dashboard" />;
  }

  if (authBootstrapPending) {
    return <AuthRouteResolution />;
  }

  return <RouteRedirect to="/" label="Zur Landingpage" />;
}

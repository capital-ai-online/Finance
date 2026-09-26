/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { ProfilePage } from '../../components/ProfilePage';
import { LandingPage, LegalAndFaqPages, LoginPage, PasswordUpdatePage } from '../../features/public/ui';
import type { UserSession } from '../types/UserSession';

const LearningVocabulary = lazy(() =>
  import('../../features/learning/ui/LearningVocabulary').then((module) => ({
    default: module.LearningVocabulary,
  })),
);
const MarketVocabularyModal = lazy(() =>
  import('../../features/public/ui/frontend-port/components/MarketVocabularyModal').then((module) => ({
    default: module.MarketVocabularyModal,
  })),
);
const RoadmapDashboard = lazy(() =>
  import('../../features/public/ui/RoadmapDashboard').then((module) => ({
    default: module.RoadmapDashboard,
  })),
);
const MediaStudio = lazy(() =>
  import('../../features/social/ui/MediaStudio').then((module) => ({ default: module.MediaStudio })),
);
const DataCalculatorWorkbench = lazy(() =>
  import('../../features/datacalculator/ui/DataCalculatorWorkbench'),
);

interface AppRoutesProps {
  userSession: UserSession | null;
  authBootstrapPending: boolean;
  justLoggedOut: boolean;
  clearJustLoggedOut: () => void;
  handleLogout: () => Promise<void>;
  refreshSession: () => Promise<void>;
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

function AuthRouteResolution({ onRetry }: { onRetry: () => Promise<void> }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#02050e] p-6 text-white">
      <div aria-hidden="true" className="absolute h-80 w-80 rounded-full bg-[#8D26FF]/15 blur-3xl" />
      <div className="relative max-w-md rounded-3xl border border-amber-400/25 bg-[#070b19]/90 p-8 text-center shadow-2xl backdrop-blur-xl">
        <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-2 border-amber-300/25 border-t-amber-300" aria-hidden="true" />
        <p className="mt-5 text-xs font-mono font-black uppercase tracking-[0.2em] text-amber-300">CAPITAL-AI / Konto</p>
        <h1 className="mt-2 text-xl font-black">Sichere Sitzung wird synchronisiert</h1>
        <p className="mt-2 text-sm text-white/50">Die Anfrage wird nach zehn Sekunden beendet, damit diese Ansicht nie dauerhaft hängen bleibt.</p>
        <button type="button" onClick={() => void onRetry()} className="mt-5 min-h-11 rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-xs font-bold text-white transition hover:bg-white/10">
          Sitzung erneut prüfen
        </button>
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
  handleLogout,
  refreshSession,
}: AppRoutesProps) {
  const [currentPath, setCurrentPath] = useState(() => {
    return typeof window !== 'undefined'
      ? normalizeRoutePath(window.location.pathname)
      : '/';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncPathFromHistory = () => {
      setCurrentPath(normalizeRoutePath(window.location.pathname));
    };

    window.addEventListener('popstate', syncPathFromHistory);
    return () => window.removeEventListener('popstate', syncPathFromHistory);
  }, []);

  const navigatePublicRoute = (path: string, replace = false) => {
    const normalizedPath = normalizeRoutePath(path);

    if (typeof window !== 'undefined') {
      if (replace) {
        window.history.replaceState({}, '', normalizedPath);
      } else {
        window.history.pushState({}, '', normalizedPath);
      }
    }

    setCurrentPath(normalizedPath);
  };

  const renderAuthenticatedProfile = () => {
    if (!userSession) {
      if (authBootstrapPending) return <AuthRouteResolution onRetry={refreshSession} />;
      return <RouteRedirect to="/login" label="Weiter zur Anmeldung" />;
    }

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#02050e] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#8D26FF]/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-48 h-80 w-80 rounded-full bg-[#F9BF21]/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-[#44DE88]/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-6xl space-y-5">
          <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#070b19]/85 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
                CAPITAL-AI / KONTO
              </p>
              <h1 className="mt-1 text-xl font-black text-white">Profil &amp; Sicherheit</h1>
              <p className="mt-1 text-xs text-white/45">Persönliche Angaben und Kontoschutz an einem Ort.</p>
            </div>
            <button
              type="button"
              onClick={() => navigatePublicRoute('/')}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              ← Zur Landingpage
            </button>
          </header>
          <RouteLoadingBoundary>
            <ProfilePage
              profile={{
                id: userSession.id,
                name: userSession.name,
                email: userSession.email,
                username: userSession.username || '',
                phoneNumber: userSession.phoneNumber || '',
                phoneVerified: userSession.phoneVerified === true,
                avatarId: userSession.avatarId || '1',
                avatarColor: userSession.avatarColor || 'from-brand-primary to-brand-primary',
                preferredAssetClass: userSession.preferredAssetClass || 'Crypto',
                riskProfile: userSession.riskProfile || 'Ausgewogen',
                capital: userSession.capital || 0,
                subscriptionTier: userSession.subscriptionTier,
                customAvatarUrl: userSession.customAvatarUrl,
                favoriteCryptocurrencies: userSession.favoriteCryptocurrencies || [],
                favoriteStocks: userSession.favoriteStocks || [],
                portfolioAssets: userSession.portfolioAssets || [],
                investmentHorizon: userSession.investmentHorizon || 'Langfristig',
                experienceLevel: userSession.experienceLevel || 'Einsteiger',
                preferredCurrency: userSession.preferredCurrency || 'EUR',
              }}
              onUpdateProfile={() => {
                void refreshSession();
              }}
            />
          </RouteLoadingBoundary>
        </div>
      </div>
    );
  };

  if (currentPath === '/account/update-password') {
    return <PasswordUpdatePage />;
  }

  if (
    currentPath === '/datenschutz' ||
    currentPath === '/impressum' ||
    currentPath === '/agb' ||
    currentPath === '/faq'
  ) {
    return <LegalAndFaqPages route={currentPath} />;
  }

  if (
    currentPath === '/glossar' ||
    currentPath === '/lexikon' ||
    currentPath === '/market-vocabulary' ||
    currentPath === '/dictionary'
  ) {
    return <RouteRedirect to="/vocabulary" label="Weiter zum Market Vocabulary" />;
  }

  if (currentPath === '/vocabulary') {
    return (
      <div className="min-h-screen bg-[#02050e] text-white">
        <RouteLoadingBoundary>
          <MarketVocabularyModal
            isOpen
            onClose={() => {
              navigatePublicRoute('/', true);
            }}
          />
        </RouteLoadingBoundary>
      </div>
    );
  }

  if (currentPath === '/roadmap') {
    return (
      <RouteLoadingBoundary>
        <RoadmapDashboard />
      </RouteLoadingBoundary>
    );
  }

  if (currentPath === '/datacalculator') {
    return (
      <RouteLoadingBoundary>
        <DataCalculatorWorkbench />
      </RouteLoadingBoundary>
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
    if (userSession?.type === 'registered') {
      return (
        <LandingPage
          onLoginNavigate={clearJustLoggedOut}
          onNavigate={navigatePublicRoute}
          onLogout={async () => {
            await handleLogout();
            if (typeof window !== 'undefined') window.location.replace('/');
          }}
          authenticatedProfile={{
            name: userSession.name,
            email: userSession.email,
            subscriptionTier: userSession.subscriptionTier,
          }}
        />
      );
    }

    return <LandingPage onLoginNavigate={clearJustLoggedOut} onNavigate={navigatePublicRoute} />;
  }

  if (currentPath === '/login') {
    if (userSession?.type === 'registered') {
      return <RouteRedirect to="/" label="Zur Landingpage" />;
    }

    return <LoginPage justLoggedOut={justLoggedOut} />;
  }

  if (currentPath === '/profile') {
    return renderAuthenticatedProfile();
  }

  if (currentPath === '/dashboard') {
    return <RouteRedirect to="/profile" label="Weiter zum Profil" />;
  }

  if (currentPath === '/media-studio') {
    if (!userSession) {
      if (authBootstrapPending) return <AuthRouteResolution onRetry={refreshSession} />;
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
            <a href="/profile" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT">
              ← Zurück zum Profil
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
    return <AuthRouteResolution onRetry={refreshSession} />;
  }

  return <RouteRedirect to="/" label="Zur Landingpage" />;
}

import React from 'react';
import { UniversePortal } from './UniversePortal';

const UNIVERSE_PRODUCTION_HOST = 'universe.capital-ai.online';
const UNIVERSE_LOCAL_HOST = 'universe.localhost';

export function isUniverseHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return normalized === UNIVERSE_PRODUCTION_HOST || normalized === UNIVERSE_LOCAL_HOST;
}

export function UniverseHostBoundary({ children }: { children: React.ReactNode }) {
  if (typeof window === 'undefined') return children;

  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  if (pathname === '/' && isUniverseHostname(window.location.hostname)) {
    return <UniversePortal />;
  }

  return children;
}

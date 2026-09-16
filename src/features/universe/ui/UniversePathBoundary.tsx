import React from 'react';
import { UniversePortal } from './UniversePortal';

export const UNIVERSE_PATH = '/universe' as const;

export function UniversePathBoundary({ children }: { children: React.ReactNode }) {
  if (typeof window === 'undefined') return children;

  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  if (pathname === UNIVERSE_PATH) {
    return <UniversePortal />;
  }

  return children;
}

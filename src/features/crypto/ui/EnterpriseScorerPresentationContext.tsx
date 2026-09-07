import React, { createContext, useContext } from 'react';

export type EnterpriseScorerPresentationMode = 'authenticated' | 'public-preview';

const EnterpriseScorerPresentationContext = createContext<EnterpriseScorerPresentationMode>('authenticated');

interface EnterpriseScorerPresentationProviderProps {
  mode: EnterpriseScorerPresentationMode;
  children: React.ReactNode;
}

/**
 * Presentation-only mode for the canonical Enterprise Scorer surface.
 *
 * This context does not alter scoring, market-data, IAM or entitlement decisions. It only lets
 * nested UI omit controls whose existing contract is explicitly authenticated when the scorer is
 * projected on the public landing page.
 */
export function EnterpriseScorerPresentationProvider({
  mode,
  children,
}: EnterpriseScorerPresentationProviderProps) {
  return (
    <EnterpriseScorerPresentationContext.Provider value={mode}>
      {children}
    </EnterpriseScorerPresentationContext.Provider>
  );
}

export function useEnterpriseScorerPresentationMode(): EnterpriseScorerPresentationMode {
  return useContext(EnterpriseScorerPresentationContext);
}

import React, { createContext, useContext } from 'react';

export interface AuthenticatedLandingProfile {
  name: string;
  email: string;
  subscriptionTier: string;
}

const LandingSessionContext = createContext<AuthenticatedLandingProfile | null>(null);

export function LandingSessionProvider({
  profile,
  children,
}: {
  profile: AuthenticatedLandingProfile | null;
  children: React.ReactNode;
}) {
  return (
    <LandingSessionContext.Provider value={profile}>
      {children}
    </LandingSessionContext.Provider>
  );
}

export function useLandingSessionProfile(): AuthenticatedLandingProfile | null {
  return useContext(LandingSessionContext);
}

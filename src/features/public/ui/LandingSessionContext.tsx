import React, { createContext, useContext } from 'react';

export interface AuthenticatedLandingProfile {
  name: string;
  email: string;
  subscriptionTier: string;
}

interface LandingSessionValue {
  profile: AuthenticatedLandingProfile | null;
  onLogout?: () => void | Promise<void>;
}

const LandingSessionContext = createContext<LandingSessionValue>({ profile: null });

export function LandingSessionProvider({
  profile,
  onLogout,
  children,
}: {
  profile: AuthenticatedLandingProfile | null;
  onLogout?: () => void | Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <LandingSessionContext.Provider value={{ profile, onLogout }}>
      {children}
    </LandingSessionContext.Provider>
  );
}

export function useLandingSessionProfile(): AuthenticatedLandingProfile | null {
  return useContext(LandingSessionContext).profile;
}

export function useLandingSessionLogout(): (() => void | Promise<void>) | undefined {
  return useContext(LandingSessionContext).onLogout;
}

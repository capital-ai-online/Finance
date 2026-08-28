import React from 'react';
import { LoginPageRedirect } from '../features/public/ui/LoginPageRedirect';

interface LegacyLandingPageProps {
  onLoginEmail?: (email: string, password: string) => Promise<void>;
  onGuestLogin?: () => void;
  onRegisterEmail?: (name: string, email: string, password: string) => Promise<void>;
  justLoggedOut?: boolean;
}

/**
 * @deprecated Compatibility bridge for the legacy Dashboard `activeView='login'` branch.
 *
 * The canonical public landing page is `src/features/public/ui/LandingPage.tsx` at `/`.
 * The canonical authentication page is `src/features/public/ui/LoginPage.tsx` at `/login`.
 */
export function LandingPage(_props: LegacyLandingPageProps) {
  return <LoginPageRedirect />;
}

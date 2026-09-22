import type React from 'react';
import ReferenceApp from './frontend-port/ReferenceApp';
import { LandingSessionProvider, type AuthenticatedLandingProfile } from './LandingSessionContext';
import './frontend-port/frontend-port.css';

interface LandingPageProps {
  onLoginNavigate?: () => void;
  onLogout?: () => void | Promise<void>;
  authenticatedProfile?: AuthenticatedLandingProfile | null;
}

/**
 * Canonical public landing page for /.
 *
 * Visual design authority is pinned to:
 * SvenKulessa/FRONTEND@cbc558019ae6785f44079fe6fca3403460774df3
 *
 * The current presentation components/data/types/assets are source-locked; host routing and branding remain explicit Finance adapters verified by
 * frontendReferenceDesignLock.test.ts. CAPITAL-AI routing and productive runtime authority remain
 * outside the imported design snapshot.
 *
 * Mobile remains the source presentation baseline. The Finance-owned responsive adapter activates
 * the website desktop canvas at >=1024px without changing the pinned FRONTEND component tree.
 */
export function LandingPage({ authenticatedProfile = null, onLogout }: LandingPageProps) {
  return (
    <LandingSessionProvider profile={authenticatedProfile} onLogout={onLogout}>
      <section
      className="capital-ai-frontend-port"
      data-landing-section="frontend-reference-design-port"
      data-landing-design-repository="SvenKulessa/FRONTEND"
      data-landing-design-commit="cbc558019ae6785f44079fe6fca3403460774df3"
      data-mobile-view="active"
      data-desktop-view="responsive-active"
      data-market-data-binding="verified-on-selection"
      data-landing-scorer-gate="FIN-LF-01"
    >
        <ReferenceApp />
      </section>
    </LandingSessionProvider>
  );
}

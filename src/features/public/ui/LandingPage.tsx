import type React from 'react';
import ReferenceApp from './frontend-port/ReferenceApp';
import { LandingSessionProvider, type AuthenticatedLandingProfile } from './LandingSessionContext';
import './frontend-port/frontend-port.css';

interface LandingPageProps {
  onLoginNavigate?: () => void;
  onLogout?: () => void | Promise<void>;
  authenticatedProfile?: AuthenticatedLandingProfile | null;
  onNavigate?: (path: string) => void;
}

/**
 * Canonical public landing page for /.
 *
 * Base presentation snapshot remains pinned to:
 * SvenKulessa/FRONTEND@cbc558019ae6785f44079fe6fca3403460774df3
 *
 * Owner-provided 2026-09-23 design deltas are applied only through Finance presentation adapters;
 * productive FINTECH scoring/data authority is not copied from the uploaded archive.
 *
 * The current presentation components/data/types/assets are source-locked; host routing and branding remain explicit Finance adapters verified by
 * frontendReferenceDesignLock.test.ts. CAPITAL-AI routing and productive runtime authority remain
 * outside the imported design snapshot.
 *
 * Mobile remains the source presentation baseline. The Finance-owned responsive adapter activates
 * the website desktop canvas at >=1024px, with a 960–1023px browser desktop-site compatibility bridge, without changing the pinned FRONTEND component tree.
 */
export function LandingPage({ authenticatedProfile = null, onLogout, onNavigate }: LandingPageProps) {
  return (
    <LandingSessionProvider profile={authenticatedProfile} onLogout={onLogout}>
      <section
      className="capital-ai-frontend-port"
      data-landing-section="frontend-reference-design-port"
      data-landing-design-repository="SvenKulessa/FRONTEND"
      data-landing-design-commit="cbc558019ae6785f44079fe6fca3403460774df3"
      data-landing-design-overlay="owner-upload-2026-09-23-no-scoring"
      data-mobile-view="active"
      data-desktop-view="responsive-active"
      data-market-data-binding="verified-on-selection"
      data-landing-scorer-gate="FIN-LF-01"
    >
        <ReferenceApp onNavigate={onNavigate} />
      </section>
    </LandingSessionProvider>
  );
}

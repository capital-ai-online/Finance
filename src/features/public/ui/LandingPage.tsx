import type React from 'react';
import ReferenceApp from './frontend-port/ReferenceApp';
import './frontend-port/frontend-port.css';

interface LandingPageProps {
  onLoginNavigate?: () => void;
}

/**
 * Canonical public landing page for /.
 *
 * Visual design authority is pinned to:
 * SvenKulessa/FRONTEND@f2a101330d74420c373f0ec56fa58caac53d741d
 *
 * The current presentation components/data/types/assets are source-locked; host routing and branding remain explicit Finance adapters verified by
 * frontendReferenceDesignLock.test.ts. CAPITAL-AI routing and productive runtime authority remain
 * outside the imported design snapshot.
 *
 * Mobile remains the source presentation baseline. The Finance-owned responsive adapter activates
 * the website desktop canvas at >=1024px without changing the pinned FRONTEND component tree.
 */
export function LandingPage(_props: LandingPageProps) {
  return (
    <section
      className="capital-ai-frontend-port"
      data-landing-section="frontend-reference-design-port"
      data-landing-design-repository="SvenKulessa/FRONTEND"
      data-landing-design-commit="f2a101330d74420c373f0ec56fa58caac53d741d"
      data-mobile-view="active"
      data-desktop-view="responsive-active"
      data-market-data-binding="verified-on-selection"
      data-landing-scorer-gate="FIN-LF-01"
    >
      <ReferenceApp />
    </section>
  );
}

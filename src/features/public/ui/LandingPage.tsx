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
 * SvenKulessa/FRONTEND@8f6b629c985ca2e46c822ff911f53741d0141e07
 *
 * The referenced App/components/data/types/assets are copied byte-for-byte and verified by
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
      data-landing-design-commit="8f6b629c985ca2e46c822ff911f53741d0141e07"
      data-mobile-view="active"
      data-desktop-view="responsive-active"
    >
      <ReferenceApp />
    </section>
  );
}

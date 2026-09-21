import type React from 'react';
import ReferenceApp from './frontend-port/ReferenceApp';
import './frontend-port/frontend-port.css';
import { useLandingRuntimeBinding } from './landing-runtime/LandingRuntimeBinding';

interface LandingPageProps {
  onLoginNavigate?: () => void;
}

/**
 * Canonical public landing page for /.
 *
 * Visual design authority is pinned to:
 * SvenKulessa/FRONTEND@8f6b629c985ca2e46c822ff911f53741d0141e07
 *
 * The referenced App/components/data/types/assets remain source-locked. Productive Finance data and
 * scoring are projected through the Finance-owned runtime binding outside the pinned design tree,
 * so the graphical source cannot become a second Data/Scoring authority.
 *
 * Mobile remains the source presentation baseline. The Finance-owned responsive adapter activates
 * the website desktop canvas at >=1024px without changing the pinned FRONTEND component tree.
 */
export function LandingPage(_props: LandingPageProps) {
  const { onClickCapture, overlays } = useLandingRuntimeBinding();

  return (
    <section
      className="capital-ai-frontend-port"
      data-landing-section="frontend-reference-design-port"
      data-landing-design-repository="SvenKulessa/FRONTEND"
      data-landing-design-commit="8f6b629c985ca2e46c822ff911f53741d0141e07"
      data-landing-runtime-binding="verified-asset-display/1.0.0"
      data-mobile-view="active"
      data-desktop-view="responsive-active"
      onClickCapture={onClickCapture}
    >
      <ReferenceApp />
      {overlays}
    </section>
  );
}

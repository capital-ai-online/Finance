import React from 'react';
import {
  CryptoScoringEnterprise as CanonicalCryptoScoringEnterprise,
  type CryptoScoringEnterpriseProps,
} from './CryptoScoringEnterprise';
import { CryptoCategoryResearchLenses } from './CryptoCategoryResearchLenses';
import { CryptoResearchVisualizationSuite } from './CryptoResearchVisualizationSuite';

/**
 * Canonical crypto scoring composition for routed feature consumers.
 *
 * Keeps the productive scorer and research projections in one feature-owned entry point.
 * Research visuals are presentation-only; score authority stays in the server-side
 * ScoringModelRegistry -> ScoringDispatcher path.
 */
export function CryptoScoringWorkspace(props: CryptoScoringEnterpriseProps) {
  return (
    <>
      <CanonicalCryptoScoringEnterprise {...props} />
      <CryptoCategoryResearchLenses selectedSymbol={props.selectedSymbol} />
      <CryptoResearchVisualizationSuite selectedSymbol={props.selectedSymbol} />
    </>
  );
}

export type { CryptoScoringEnterpriseProps };

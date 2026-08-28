import React from 'react';
import {
  CryptoScoringEnterprise as CanonicalCryptoScoringEnterprise,
  type CryptoScoringEnterpriseProps,
} from './CryptoScoringEnterprise';
import { CryptoCategoryResearchLenses } from './CryptoCategoryResearchLenses';

/**
 * Canonical crypto scoring composition for routed feature consumers.
 *
 * Keeps the productive scorer and CV-3/CV-7 research projection in one feature-owned
 * entry point so BB-2D/BB-6 route migrations cannot silently drop the research lenses.
 * The research projection remains presentation-only; score authority stays in the
 * server-side ScoringModelRegistry -> ScoringDispatcher path.
 */
export function CryptoScoringWorkspace(props: CryptoScoringEnterpriseProps) {
  return (
    <>
      <CanonicalCryptoScoringEnterprise {...props} />
      <CryptoCategoryResearchLenses selectedSymbol={props.selectedSymbol} />
    </>
  );
}

export type { CryptoScoringEnterpriseProps };

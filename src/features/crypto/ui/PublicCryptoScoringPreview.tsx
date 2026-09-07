import React from 'react';
import {
  CryptoScoringEnterprise as CanonicalCryptoScoringEnterprise,
  type CryptoScoringEnterpriseProps,
} from './CryptoScoringEnterprise';
import { EnterpriseScorerPresentationProvider } from './EnterpriseScorerPresentationContext';

/**
 * Public projection of the canonical Enterprise Scorer.
 *
 * The scorer implementation and all canonical score/evidence contracts stay shared with the
 * authenticated workspace. The public projection only selects presentation mode so authenticated
 * sub-surfaces are omitted; it creates no parallel scoring or market-data architecture.
 */
export function PublicCryptoScoringPreview(props: CryptoScoringEnterpriseProps) {
  return (
    <EnterpriseScorerPresentationProvider mode="public-preview">
      <CanonicalCryptoScoringEnterprise {...props} />
    </EnterpriseScorerPresentationProvider>
  );
}

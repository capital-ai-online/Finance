// Compatibility export during the canonical frontend Strangler migration (BB-6).
// Productive implementation lives in src/features/crypto/ui.
import React from 'react';
import {
  CryptoScoringEnterprise as CanonicalCryptoScoringEnterprise,
  type CryptoScoringEnterpriseProps,
} from '../features/crypto/ui/CryptoScoringEnterprise';
import { CryptoCategoryResearchLenses } from '../features/crypto/ui/CryptoCategoryResearchLenses';

export function CryptoScoringEnterprise(props: CryptoScoringEnterpriseProps) {
  return (
    <>
      <CanonicalCryptoScoringEnterprise {...props} />
      <CryptoCategoryResearchLenses selectedSymbol={props.selectedSymbol} />
    </>
  );
}

export type { CryptoScoringEnterpriseProps };

import React from 'react';
import {
  CryptoScoringEnterprise as BaseCryptoScoringEnterprise,
  type CryptoScoringEnterpriseProps,
} from './CryptoScoringEnterpriseBase';
import { CryptoEvidenceToolbox } from './CryptoEvidenceToolbox';

export type { CryptoScoringEnterpriseProps } from './CryptoScoringEnterpriseBase';

/**
 * SC4 evidence projection wrapper.
 * The existing Enterprise Scorer remains unchanged and authoritative; evidence visualization is
 * appended below it and consumes the read-only /api/crypto/evidence/:symbol projection.
 */
export function CryptoScoringEnterprise(props: CryptoScoringEnterpriseProps) {
  return (
    <>
      <BaseCryptoScoringEnterprise {...props} />
      <CryptoEvidenceToolbox symbol={props.selectedSymbol} />
    </>
  );
}

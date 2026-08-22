import { describe, expect, it } from 'vitest';
import {
  CRYPTO_EVIDENCE_IDENTITY_REGISTRY_VERSION,
  resolveCryptoEvidenceIdentity,
} from '../../src/platform/MarketData/CryptoEvidenceIdentityRegistry';
import {
  DUNE_SAVED_QUERY_REGISTRY_VERSION,
  resolveDuneSavedQueriesForSymbol,
} from '../../src/platform/MarketData/DuneSavedQueryRegistry';

describe('CryptoEvidenceIdentityRegistry Dune governance', () => {
  it('keeps Dune query IDs in the semantic Dune registry rather than the asset identity authority', () => {
    expect(CRYPTO_EVIDENCE_IDENTITY_REGISTRY_VERSION).toBe('crypto-evidence-identity-registry/1.4.0');
    expect(DUNE_SAVED_QUERY_REGISTRY_VERSION).toBe('dune-saved-query-registry/1.0.0');

    const aave = resolveCryptoEvidenceIdentity('AAVE');
    expect(aave).not.toBeNull();
    expect(aave?.reviewedBy).toBe('OWNER');

    const queries = resolveDuneSavedQueriesForSymbol('AAVE', {
      DUNE_QUERY_AAVE_ACTIVE_ADDRESSES: '5833540',
      DUNE_QUERY_AAVE_TREASURY: '27230',
    });
    const queryIds = queries.map((request) => request.queryId);
    expect(queryIds).toEqual([5833540, 27230]);
    expect(queryIds).not.toContain(91004);

    const activeAddresses = queries.find((request) => request.queryId === 5833540);
    expect(activeAddresses?.expectedColumns).toEqual(['observed_at', 'active_addresses']);
    expect(activeAddresses?.mappings).toEqual([
      { featureKey: 'protocol.activeAddresses24h', column: 'active_addresses' },
    ]);

    const treasury = queries.find((request) => request.queryId === 27230);
    expect(treasury?.expectedColumns).toEqual(['observed_at', 'treasury_usd']);
    expect(treasury?.mappings).toEqual([
      { featureKey: 'protocol.treasuryUsd', column: 'treasury_usd' },
    ]);
    expect(treasury?.mappings.some((mapping) => mapping.featureKey === 'protocol.treasuryToMarketCap')).toBe(false);
  });

  it('does not guess identities for an unregistered symbol', () => {
    expect(resolveCryptoEvidenceIdentity('UNKNOWN')).toBeNull();
  });
});

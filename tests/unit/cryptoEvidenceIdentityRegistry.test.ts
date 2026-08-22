import { describe, expect, it } from 'vitest';
import {
  CRYPTO_EVIDENCE_IDENTITY_REGISTRY_VERSION,
  resolveCryptoEvidenceIdentity,
} from '../../src/platform/MarketData/CryptoEvidenceIdentityRegistry';

describe('CryptoEvidenceIdentityRegistry Dune governance', () => {
  it('registers only the Owner-reviewed Aave query ids with fail-closed schemas', () => {
    expect(CRYPTO_EVIDENCE_IDENTITY_REGISTRY_VERSION).toBe('crypto-evidence-identity-registry/1.3.0');

    const aave = resolveCryptoEvidenceIdentity('AAVE');
    expect(aave).not.toBeNull();
    expect(aave?.reviewedBy).toBe('OWNER');

    const queryIds = aave?.dune?.map((request) => request.queryId) ?? [];
    expect(queryIds).toEqual([5833540, 27230]);
    expect(queryIds).not.toContain(91004);

    const activeAddresses = aave?.dune?.find((request) => request.queryId === 5833540);
    expect(activeAddresses?.expectedColumns).toEqual(['observed_at', 'active_addresses']);
    expect(activeAddresses?.mappings).toEqual([
      { featureKey: 'protocol.activeAddresses24h', column: 'active_addresses' },
    ]);

    const treasury = aave?.dune?.find((request) => request.queryId === 27230);
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

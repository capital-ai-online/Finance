import { describe, expect, it } from 'vitest';
import {
  CRYPTO_CATEGORY_FEATURE_DEFINITIONS,
  CRYPTO_CATEGORY_FEATURE_CONTRACT_VERSION,
  buildCryptoCategoryFeatureContract,
  getCryptoCategoryFeatureDefinitions,
  type CryptoFeatureDefinition,
  type CryptoFeatureEvidence,
} from '../../src/platform/FinTechCore/Modules/Crypto/CryptoCategoryFeatureContracts';

function verified(definition: CryptoFeatureDefinition, value?: number | boolean | string): CryptoFeatureEvidence {
  const defaultValue = definition.valueType === 'BOOLEAN'
    ? true
    : definition.valueType === 'TEXT'
      ? 'verified'
      : 1;
  return {
    key: definition.key,
    status: 'VERIFIED',
    value: value ?? defaultValue,
    provider: 'test-provider',
    evidenceRefs: [`evidence:${definition.key}`],
    observedAt: '2026-08-20T12:00:00.000Z',
    retrievedAt: '2026-08-20T12:00:01.000Z',
  };
}

function complete(profileId: Parameters<typeof getCryptoCategoryFeatureDefinitions>[0]): CryptoFeatureEvidence[] {
  return getCryptoCategoryFeatureDefinitions(profileId).map(item => verified(item));
}

describe('FinTech Core crypto category feature contracts', () => {
  it('keeps feature identities unique within every analysis profile', () => {
    for (const definitions of Object.values(CRYPTO_CATEGORY_FEATURE_DEFINITIONS)) {
      const keys = definitions.map(item => item.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('builds a ready stablecoin contract only when required evidence and all hard gates exist', () => {
    const result = buildCryptoCategoryFeatureContract({
      assetId: 'crypto:USDC',
      profileId: 'stablecoin',
      evidence: complete('stablecoin'),
    });

    expect(result.contractVersion).toBe(CRYPTO_CATEGORY_FEATURE_CONTRACT_VERSION);
    expect(result.status).toBe('READY');
    expect(result.evidenceCoverage).toBe(1);
    expect(result.missingRequiredFeatures).toEqual([]);
    expect(result.missingHardGates).toEqual([]);
    expect(result.failedHardGates).toEqual([]);
    expect(result.scoreAuthority).toBe('SCORING_DISPATCHER_ONLY');
  });

  it('fails closed when a hard gate is missing', () => {
    const evidence = complete('stablecoin')
      .filter(item => item.key !== 'reserves.attestationVerified');

    const result = buildCryptoCategoryFeatureContract({
      assetId: 'crypto:USDC',
      profileId: 'stablecoin',
      evidence,
    });

    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.missingHardGates).toContain('reserves.attestationVerified');
    expect(result.evidenceCoverage).toBeLessThan(1);
  });

  it('blocks the feature contract when a verified boolean hard gate fails', () => {
    const evidence = complete('rwa').map(item => item.key === 'legal.ownershipVerified'
      ? { ...item, value: false }
      : item);

    const result = buildCryptoCategoryFeatureContract({
      assetId: 'crypto:RWA',
      profileId: 'rwa',
      evidence,
    });

    expect(result.status).toBe('BLOCKED');
    expect(result.failedHardGates).toEqual(['legal.ownershipVerified']);
  });

  it('keeps stale required evidence missing instead of converting it to a numeric fallback', () => {
    const evidence = complete('gamefi').map(item => item.key === 'product.dailyActiveUsers'
      ? { ...item, status: 'STALE' as const }
      : item);

    const result = buildCryptoCategoryFeatureContract({
      assetId: 'crypto:GAME',
      profileId: 'gamefi',
      evidence,
    });

    expect(result.status).toBe('PARTIAL');
    expect(result.missingRequiredFeatures).toContain('product.dailyActiveUsers');
  });

  it('does not invent a computable Meme contract while the profile remains pending evidence', () => {
    const result = buildCryptoCategoryFeatureContract({
      assetId: 'crypto:DOGE',
      profileId: 'meme',
      evidence: [{
        key: 'market.volume24hUsd',
        status: 'VERIFIED',
        value: 1_000_000,
        provider: 'test-provider',
        evidenceRefs: ['evidence:volume'],
        observedAt: '2026-08-20T12:00:00.000Z',
        retrievedAt: '2026-08-20T12:00:01.000Z',
      }],
    });

    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.profileSourceStatus).toBe('PENDING_EVIDENCE');
    expect(result.evidenceCoverage).toBe(0);
  });

  it('carries universal market evidence separately without satisfying category requirements', () => {
    const universal: CryptoFeatureEvidence[] = [{
      key: 'market.marketCapUsd',
      status: 'VERIFIED',
      value: 500_000_000,
      provider: 'CoinGecko',
      evidenceRefs: ['snapshot:market-cap'],
      observedAt: '2026-08-20T12:00:00.000Z',
      retrievedAt: '2026-08-20T12:00:01.000Z',
    }];

    const result = buildCryptoCategoryFeatureContract({
      assetId: 'crypto:ETH',
      profileId: 'layer1',
      universalMarketEvidence: universal,
    });

    expect(result.status).toBe('PARTIAL');
    expect(result.evidenceCoverage).toBe(0);
    expect(result.universalMarketEvidence).toEqual(universal);
    expect(result.missingRequiredFeatures.length).toBeGreaterThan(0);
  });

  it('rejects unknown profile evidence keys from implicit promotion', () => {
    const result = buildCryptoCategoryFeatureContract({
      assetId: 'crypto:ETH',
      profileId: 'layer1',
      evidence: [{
        key: 'agent.magicScore',
        status: 'VERIFIED',
        value: 100,
        provider: 'agent',
        evidenceRefs: ['agent:research'],
        observedAt: '2026-08-20T12:00:00.000Z',
        retrievedAt: '2026-08-20T12:00:01.000Z',
      }],
    });

    expect(result.rejectedEvidenceKeys).toEqual(['agent.magicScore']);
    expect(result.evidenceCoverage).toBe(0);
  });

  it('fails deterministically on duplicate feature evidence keys', () => {
    const definition = getCryptoCategoryFeatureDefinitions('gamefi')[0];
    const item = verified(definition);
    expect(() => buildCryptoCategoryFeatureContract({
      assetId: 'crypto:GAME',
      profileId: 'gamefi',
      evidence: [item, item],
    })).toThrow(/duplicate evidence key/i);
  });
});

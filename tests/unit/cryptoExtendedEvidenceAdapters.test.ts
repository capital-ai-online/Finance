import { describe, expect, it } from 'vitest';
import { adaptCoinGlassDerivativesEvidence } from '../../src/platform/FinTechCore/Modules/Crypto/Adapters/ExtendedCryptoEvidenceAdapters';
import {
  CRYPTO_CATEGORY_FEATURE_CONTRACT_VERSION,
  buildCryptoCategoryFeatureContract,
  getCryptoCategoryFeatureDefinitions,
} from '../../src/platform/FinTechCore/Modules/Crypto/CryptoCategoryFeatureContracts';
import type { CoinGlassDerivativesEvidence } from '../../src/platform/MarketData/providers/CoinGlassCryptoEvidenceProvider';

describe('SC4 extended crypto evidence adapters', () => {
  it('preserves verified fields from PARTIAL provider evidence without filling missing fields', () => {
    const input: CoinGlassDerivativesEvidence = {
      contractVersion: 'coinglass-crypto-evidence/1.0.0',
      status: 'PARTIAL',
      symbol: 'BTC',
      retrievedAt: '2026-08-22T05:00:00.000Z',
      evidenceRefs: ['coinglass:open-interest:BTC:e1'],
      openInterestUsd: 10_000_000,
      openInterestChange5mPct: null,
      openInterestChange1hPct: 1.2,
      openInterestChange4hPct: null,
      openInterestChange24hPct: null,
      meanFundingRate: null,
      liquidationUsd24h: null,
      longLiquidationUsd24h: null,
      shortLiquidationUsd24h: null,
      aggregatedBidsUsd1Pct: null,
      aggregatedAsksUsd1Pct: null,
      orderbookObservedAt: null,
      reason: 'Only open-interest family is available.',
    };

    const evidence = adaptCoinGlassDerivativesEvidence(input);
    const oi = evidence.find(item => item.key === 'derivatives.openInterestUsd');
    const funding = evidence.find(item => item.key === 'derivatives.meanFundingRate');

    expect(oi).toMatchObject({ status: 'VERIFIED', value: 10_000_000, provider: 'coinglass' });
    expect(oi?.evidenceRefs.length).toBe(1);
    expect(funding).toMatchObject({ status: 'NOT_AVAILABLE', value: null, provider: 'coinglass' });
    expect(funding?.evidenceRefs).toEqual([]);
  });

  it('admits extended raw evidence in the canonical DeFi category feature authority', () => {
    const evidence = [{
      key: 'derivatives.openInterestUsd',
      status: 'VERIFIED' as const,
      value: 10_000_000,
      provider: 'coinglass',
      evidenceRefs: ['coinglass:open-interest:BTC:e1'],
      observedAt: '2026-08-22T05:00:00.000Z',
      retrievedAt: '2026-08-22T05:00:01.000Z',
    }];

    const result = buildCryptoCategoryFeatureContract({
      assetId: 'crypto:AAVE',
      profileId: 'defi',
      evidence,
    });

    expect(result.contractVersion).toBe(CRYPTO_CATEGORY_FEATURE_CONTRACT_VERSION);
    expect(result.contractVersion).toBe('fintech-core.crypto/category-features/0.2.0');
    expect(result.rejectedEvidenceKeys).not.toContain('derivatives.openInterestUsd');
    expect(result.status).not.toBe('READY');
    expect(result.scoreAuthority).toBe('SCORING_DISPATCHER_ONLY');
  });

  it('inventories Meme raw evidence while preserving PENDING_EVIDENCE / NOT_COMPUTABLE', () => {
    const definitions = getCryptoCategoryFeatureDefinitions('meme');
    expect(definitions.some(item => item.key === 'risk.honeypotDetected')).toBe(true);
    expect(definitions.every(item => item.requirement === 'OPTIONAL')).toBe(true);

    const result = buildCryptoCategoryFeatureContract({
      assetId: 'crypto:DOGE',
      profileId: 'meme',
      evidence: [{
        key: 'risk.honeypotDetected',
        status: 'VERIFIED',
        value: false,
        provider: 'goplus',
        evidenceRefs: ['goplus:token-security:1:doge:e1'],
        observedAt: '2026-08-22T05:00:00.000Z',
        retrievedAt: '2026-08-22T05:00:01.000Z',
      }],
    });

    expect(result.profileSourceStatus).toBe('PENDING_EVIDENCE');
    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.rejectedEvidenceKeys).toEqual([]);
    expect(result.scoreAuthority).toBe('SCORING_DISPATCHER_ONLY');
  });
});

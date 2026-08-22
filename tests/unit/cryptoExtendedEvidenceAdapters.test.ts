import { describe, expect, it } from 'vitest';
import {
  adaptBinancePublicAnalyticsEvidence,
  adaptKrakenFuturesAnalyticsEvidence,
} from '../../src/platform/FinTechCore/Modules/Crypto/Adapters/ExtendedCryptoEvidenceAdapters';
import {
  CRYPTO_CATEGORY_FEATURE_CONTRACT_VERSION,
  buildCryptoCategoryFeatureContract,
  getCryptoCategoryFeatureDefinitions,
} from '../../src/platform/FinTechCore/Modules/Crypto/CryptoCategoryFeatureContracts';
import type { BinancePublicAnalyticsEvidence } from '../../src/platform/MarketData/providers/BinancePublicAnalyticsProvider';
import type { KrakenFuturesAnalyticsEvidence } from '../../src/platform/MarketData/providers/KrakenFuturesAnalyticsProvider';

describe('SC4 extended crypto evidence adapters', () => {
  it('maps Binance into generic raw market features without fabricating missing fields', () => {
    const input: BinancePublicAnalyticsEvidence = {
      contractVersion: 'binance-public-analytics/1.0.0',
      status: 'PARTIAL',
      symbol: 'BTCUSDT',
      retrievedAt: '2026-08-22T05:00:00.000Z',
      observedAt: '2026-08-22T04:55:00.000Z',
      evidenceRefs: ['binance:futures:open-interest:BTCUSDT:e1'],
      openInterest: 10,
      fundingRate: null,
      markPrice: 50_000,
      indexPrice: 49_990,
      bidDepthUsd1Pct: 500_000,
      askDepthUsd1Pct: null,
      reason: 'Partial test evidence.',
    };
    const evidence = adaptBinancePublicAnalyticsEvidence(input);
    expect(evidence.find(item => item.key === 'derivatives.openInterestUsd')).toMatchObject({
      status: 'VERIFIED', value: 500_000, provider: 'binance-public',
    });
    expect(evidence.find(item => item.key === 'derivatives.meanFundingRate')).toMatchObject({
      status: 'NOT_AVAILABLE', value: null, provider: 'binance-public',
    });
  });

  it('keeps Kraken observations provider-specific to prevent duplicate feature-key authority', () => {
    const input: KrakenFuturesAnalyticsEvidence = {
      contractVersion: 'kraken-futures-analytics-evidence/1.0.0',
      status: 'PARTIAL',
      marketSymbol: 'PI_XBTUSD',
      retrievedAt: '2026-08-22T05:00:00.000Z',
      observedAt: '2026-08-22T04:55:00.000Z',
      evidenceRefs: ['kraken:futures-analytics:PI_XBTUSD:open-interest:e1'],
      openInterest: 10_000_000,
      openInterestChangePct: 1.2,
      fundingRate: null,
      liquidationVolume: null,
      bidLiquidity01: null,
      askLiquidity01: null,
      bidSlippage100k: null,
      askSlippage100k: null,
      reason: 'Only open-interest family is available.',
    };
    const evidence = adaptKrakenFuturesAnalyticsEvidence(input);
    const oi = evidence.find(item => item.key === 'derivatives.krakenOpenInterest');
    const funding = evidence.find(item => item.key === 'derivatives.krakenFundingRate');
    expect(oi).toMatchObject({ status: 'VERIFIED', value: 10_000_000, provider: 'kraken-futures-public' });
    expect(funding).toMatchObject({ status: 'NOT_AVAILABLE', value: null, provider: 'kraken-futures-public' });
    expect(new Set(evidence.map(item => item.key)).size).toBe(evidence.length);
  });

  it('admits GoPlus raw security evidence in the canonical DeFi category feature authority', () => {
    const evidence = [{
      key: 'risk.honeypotDetected', status: 'VERIFIED' as const, value: false, provider: 'goplus',
      evidenceRefs: ['goplus:token-security:1:0x1111111111111111111111111111111111111111:e1'],
      observedAt: '2026-08-22T05:00:00.000Z', retrievedAt: '2026-08-22T05:00:01.000Z',
    }];
    const result = buildCryptoCategoryFeatureContract({ assetId: 'crypto:AAVE', profileId: 'defi', evidence });
    expect(result.contractVersion).toBe(CRYPTO_CATEGORY_FEATURE_CONTRACT_VERSION);
    expect(result.contractVersion).toBe('fintech-core.crypto/category-features/0.2.0');
    expect(result.rejectedEvidenceKeys).not.toContain('risk.honeypotDetected');
    expect(result.status).not.toBe('READY');
    expect(result.scoreAuthority).toBe('SCORING_DISPATCHER_ONLY');
  });

  it('inventories Meme security evidence while preserving PENDING_EVIDENCE / NOT_COMPUTABLE', () => {
    const definitions = getCryptoCategoryFeatureDefinitions('meme');
    expect(definitions.some(item => item.key === 'risk.honeypotDetected')).toBe(true);
    expect(definitions.every(item => item.requirement === 'OPTIONAL')).toBe(true);
    const result = buildCryptoCategoryFeatureContract({
      assetId: 'crypto:DOGE', profileId: 'meme',
      evidence: [{ key: 'risk.honeypotDetected', status: 'VERIFIED', value: false, provider: 'goplus', evidenceRefs: ['goplus:token-security:1:doge:e1'], observedAt: '2026-08-22T05:00:00.000Z', retrievedAt: '2026-08-22T05:00:01.000Z' }],
    });
    expect(result.profileSourceStatus).toBe('PENDING_EVIDENCE');
    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.rejectedEvidenceKeys).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  assertMarketEvidenceContract,
  isAdmissibleMarketEvidence,
  type MarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/evidenceQualityContracts';
import { buildEffectiveScoringFingerprintMetadata } from '../../src/platform/Scoring/scoringFingerprint';

const fingerprintBase = {
  modelVersion: 'crypto-technical-provenance/0.7.0',
  featureContractVersion: 'crypto-technical-features/0.7.0',
  nominalWeightsVersion: 'crypto-technical-weights/0.7.0',
  evidenceContractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  values: { trend: 80, momentum: 70 },
  nominalWeights: { trend: 0.6, momentum: 0.4 },
  invertedFields: new Set<string>(),
} as const;

describe('P0 replay fingerprint contract binding', () => {
  it('ändert den Feature- und Weight-Fingerprint bei einer Evidence-Contract-Revision', () => {
    const baseline = buildEffectiveScoringFingerprintMetadata(fingerprintBase);
    const revised = buildEffectiveScoringFingerprintMetadata({
      ...fingerprintBase,
      evidenceContractVersion: 'market-evidence-dq/1.1.0',
    });

    expect(revised.effectiveFeatureFingerprint).not.toBe(baseline.effectiveFeatureFingerprint);
    expect(revised.effectiveWeightFingerprint).not.toBe(baseline.effectiveWeightFingerprint);
  });

  it('ändert bei reiner Weight-Contract-Revision nur den Weight-Fingerprint', () => {
    const baseline = buildEffectiveScoringFingerprintMetadata(fingerprintBase);
    const revised = buildEffectiveScoringFingerprintMetadata({
      ...fingerprintBase,
      nominalWeightsVersion: 'crypto-technical-weights/0.7.1',
    });

    expect(revised.effectiveFeatureFingerprint).toBe(baseline.effectiveFeatureFingerprint);
    expect(revised.effectiveWeightFingerprint).not.toBe(baseline.effectiveWeightFingerprint);
  });
});

describe('P0 verified evidence freshness authority', () => {
  const staleClaim: MarketEvidenceQualityRecord = {
    assetId: 'crypto:BTC',
    providerId: 'binance',
    capability: 'spot-price',
    field: 'price',
    observedAt: '2026-08-21T10:00:00.000Z',
    retrievedAt: '2026-08-21T10:00:06.000Z',
    freshness: {
      ageMs: 6000,
      maxAgeMs: 5000,
      evaluatedAt: '2026-08-21T10:00:06.000Z',
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: 'VERIFIED',
    evidenceRef: 'binance:btc:spot:stale',
  };

  it('akzeptiert ein als VERIFIED markiertes, aber veraltetes Evidence-Objekt nicht', () => {
    expect(isAdmissibleMarketEvidence(staleClaim)).toBe(false);
    expect(() => assertMarketEvidenceContract(staleClaim))
      .toThrow('MARKET_EVIDENCE_DQ_VERIFIED_REQUIRES_FRESH_EVIDENCE');
  });
});

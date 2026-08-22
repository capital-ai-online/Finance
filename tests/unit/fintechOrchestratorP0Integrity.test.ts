import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SCORING_MODELS,
  RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY,
  ScoringModelRegistry,
} from '../../src/platform/Scoring/ScoringModelRegistry';
import {
  CRYPTO_DEFI_RESEARCH_FEATURE_CONTRACT_VERSION,
  CRYPTO_MEME_RESEARCH_FEATURE_CONTRACT_VERSION,
} from '../../src/platform/Scoring/CryptoResearchModelContracts';
import { createUniversalAssetIdentity } from '../../src/platform/Scoring/UniversalAssetAdapter';
import {
  CRYPTO_SCORING_WEIGHTS,
  CryptoScoringService,
} from '../../src/services/cryptoScoringService';
import {
  buildEffectiveScoringFingerprintMetadata,
} from '../../src/platform/Scoring/scoringFingerprint';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  assertMarketEvidenceContract,
  isAdmissibleMarketEvidence,
} from '../../src/platform/MarketData/evidenceQualityContracts';
import {
  evaluateUniverseSla,
  type UniverseAdmissionRecord,
} from '../../src/platform/Scoring/UniverseSla';
import { calculateRankScore, isTop10Eligible } from '../../src/services/ranking.service';

const cryptoAsset = createUniversalAssetIdentity({
  symbol: 'BTC',
  assetClass: 'crypto',
  source: 'request',
});

describe('P0 Scoring Registry 1.1.0', () => {
  it('routet ausschließlich den Crypto Champion 0.7.0 produktiv', () => {
    const registry = new ScoringModelRegistry();
    const resolution = registry.resolve(cryptoAsset);
    expect(resolution.status).toBe('RESOLVED');
    if (resolution.status !== 'RESOLVED') return;
    expect(resolution.model.modelId).toBe('crypto-technical-provenance');
    expect(resolution.model.version).toBe('0.7.0');
    expect(resolution.model.registryVersion).toBe('scoring-model-registry/1.1.0');
    expect(resolution.model.resultContractVersion).toBe('scoring-integrity/1.1.0');
    expect(resolution.model.scoreEligible).toBe(true);
  });

  it('registriert Meme und DeFi 0.2.0 nur als nicht scorefähige Challenger', () => {
    const registry = new ScoringModelRegistry();
    const expected = [
      ['crypto-meme-integrity', CRYPTO_MEME_RESEARCH_FEATURE_CONTRACT_VERSION],
      ['crypto-defi-fundamental', CRYPTO_DEFI_RESEARCH_FEATURE_CONTRACT_VERSION],
    ] as const;

    for (const [modelId, featureContractVersion] of expected) {
      const model = registry.get(modelId, '0.2.0');
      expect(model?.version).toBe('0.2.0');
      expect(model?.lifecycle).toBe('challenger');
      expect(model?.alias).toBe('challenger');
      expect(model?.evidencePolicy).toBe('research-only');
      expect(model?.scoreEligible).toBe(false);
      expect(model?.executorKey).toBe(RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY);
      expect(model?.featureContractVersion).toBe(featureContractVersion);
    }
  });

  it('verhindert mehrdeutige kanonische Routing-Scopes bereits beim Registry-Aufbau', () => {
    const champion = DEFAULT_SCORING_MODELS.find((model) => model.modelId === 'crypto-technical-provenance')!;
    expect(() => new ScoringModelRegistry([
      champion,
      { ...champion, modelId: 'crypto-conflicting-champion', version: '9.9.9' },
    ])).toThrow(/SCORING_MODEL_REGISTRY_AMBIGUOUS_SCOPE/);
  });
});

describe('P0 Crypto Champion 0.7.0 factor authority', () => {
  const canonicalInputs = {
    coin: 'BTC',
    trend: 0.8,
    momentum: 0.7,
    volatility_quality: 0.6,
    breakout_quality: 0.5,
    relative_strength: 0.7,
    avg_daily_volume: 0.9,
    supply_dynamics: 0.8,
    data_quality_risk: 0.1,
  } as const;

  it('enthält exchange_liquidity und regime_bonus nicht in den kanonischen Gewichten', () => {
    expect(Object.keys(CRYPTO_SCORING_WEIGHTS)).not.toContain('exchange_liquidity');
    expect(Object.keys(CRYPTO_SCORING_WEIGHTS)).not.toContain('regime_bonus');
    expect(Object.keys(CRYPTO_SCORING_WEIGHTS)).toContain('avg_daily_volume');
    const sum = Object.values(CRYPTO_SCORING_WEIGHTS).reduce((acc, value) => acc + value, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it('ignoriert Legacy exchange_liquidity/regime_bonus vollständig im final_score', () => {
    const baseline = CryptoScoringService.scoreCrypto(canonicalInputs);
    const hostileLegacyValues = CryptoScoringService.scoreCrypto({
      ...canonicalInputs,
      exchange_liquidity: 1,
      regime_bonus: 1,
    });
    expect(hostileLegacyValues.final_score).toBe(baseline.final_score);
    expect(hostileLegacyValues.weights).toEqual(baseline.weights);
    expect(hostileLegacyValues.regime_bonus).toBe(0);
  });
});

describe('P0 effective score fingerprints', () => {
  const base = {
    modelVersion: 'crypto-technical-provenance/0.7.0',
    featureContractVersion: 'crypto-technical-features/0.7.0',
    nominalWeightsVersion: 'crypto-technical-weights/0.7.0',
    evidenceContractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    nominalWeights: { trend: 0.6, momentum: 0.4 },
    invertedFields: new Set<string>(),
  } as const;

  it('ist unabhängig von der Key-Reihenfolge und replay-deterministisch', () => {
    const a = buildEffectiveScoringFingerprintMetadata({ ...base, values: { trend: 80, momentum: 70 } });
    const b = buildEffectiveScoringFingerprintMetadata({ ...base, values: { momentum: 70, trend: 80 } });
    expect(a.effectiveFeatureFingerprint).toBe(b.effectiveFeatureFingerprint);
    expect(a.effectiveWeightFingerprint).toBe(b.effectiveWeightFingerprint);
    expect(a.effectiveWeights).toEqual(b.effectiveWeights);
  });

  it('ändert Feature- und Weight-Fingerprint bei Missing Evidence', () => {
    const complete = buildEffectiveScoringFingerprintMetadata({ ...base, values: { trend: 80, momentum: 70 } });
    const missing = buildEffectiveScoringFingerprintMetadata({ ...base, values: { trend: 80, momentum: undefined } });
    expect(missing.effectiveFeatureFingerprint).not.toBe(complete.effectiveFeatureFingerprint);
    expect(missing.effectiveWeightFingerprint).not.toBe(complete.effectiveWeightFingerprint);
    expect(missing.effectiveWeights).toEqual({ momentum: 0, trend: 1 });
  });

  it('ändert Fingerprints bei geänderter Modellversion', () => {
    const a = buildEffectiveScoringFingerprintMetadata({ ...base, values: { trend: 80, momentum: 70 } });
    const b = buildEffectiveScoringFingerprintMetadata({ ...base, modelVersion: 'crypto-technical-provenance/0.7.1', values: { trend: 80, momentum: 70 } });
    expect(a.effectiveFeatureFingerprint).not.toBe(b.effectiveFeatureFingerprint);
    expect(a.effectiveWeightFingerprint).not.toBe(b.effectiveWeightFingerprint);
  });
});

describe('P0 caller classification authority', () => {
  const basePayload = {
    coin: 'BTC',
    symbol: 'BTC',
    classification: { tier: 3, confidence: 0 },
    scores: { liquidity: 80 },
    data_quality: { level: 'high' },
  } as any;

  it('Caller-Tier kann den Rank-Score nicht erhöhen', () => {
    const low = calculateRankScore(basePayload, 80);
    const forged = calculateRankScore({ ...basePayload, classification: { tier: 1, confidence: 1 } }, 80);
    expect(forged).toBe(low);
  });

  it('Caller-Confidence kann Top-N-Eligibility nicht verändern', () => {
    const low = isTop10Eligible(basePayload);
    const forged = isTop10Eligible({ ...basePayload, classification: { tier: 1, confidence: 1 } });
    expect(forged).toBe(low);
  });
});

describe('P0 Market Evidence/DQ 1.0.0', () => {
  it('akzeptiert VERIFIED nur mit echter Provenance', () => {
    const verified = {
      assetId: 'crypto:BTC',
      providerId: 'binance',
      capability: 'spot-price',
      field: 'price',
      observedAt: '2026-08-21T10:00:00.000Z',
      retrievedAt: '2026-08-21T10:00:01.000Z',
      freshness: { ageMs: 1000, maxAgeMs: 5000, evaluatedAt: '2026-08-21T10:00:01.000Z' },
      contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
      qualityStatus: 'VERIFIED' as const,
      evidenceRef: 'binance:btc:spot:1',
    };
    expect(() => assertMarketEvidenceContract(verified)).not.toThrow();
    expect(isAdmissibleMarketEvidence(verified)).toBe(true);
  });

  it('behandelt fehlende VERIFIED Provenance fail-closed', () => {
    expect(() => assertMarketEvidenceContract({
      assetId: 'crypto:BTC',
      providerId: 'binance',
      capability: 'spot-price',
      field: 'price',
      observedAt: null,
      retrievedAt: '2026-08-21T10:00:01.000Z',
      freshness: { ageMs: null, maxAgeMs: 5000, evaluatedAt: '2026-08-21T10:00:01.000Z' },
      contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
      qualityStatus: 'VERIFIED',
      evidenceRef: null,
    })).toThrow('MARKET_EVIDENCE_DQ_VERIFIED_REQUIRES_PROVENANCE');
  });
});

describe('P0 No-Demo Universe SLA', () => {
  const records = (count: number): UniverseAdmissionRecord[] => Array.from({ length: count }, (_, index) => ({
    asset: createUniversalAssetIdentity({ symbol: `REAL${index}`, assetClass: 'crypto', source: 'catalog' }),
    admitted: true,
    evidenceSufficient: true,
  }));

  it('meldet ein reales Universum unter 24 explizit statt Filler zu erzeugen', () => {
    const result = evaluateUniverseSla(records(23), 'crypto');
    expect(result.status).toBe('INSUFFICIENT_REAL_UNIVERSE');
    expect(result.availableCount).toBe(23);
    expect(result.availableAssets).toHaveLength(23);
    expect(result.hardMinimum).toBe(false);
  });

  it('meldet AVAILABLE erst bei 24 real zugelassenen Assets', () => {
    const result = evaluateUniverseSla(records(24), 'crypto');
    expect(result.status).toBe('AVAILABLE');
    expect(result.availableCount).toBe(24);
  });
});

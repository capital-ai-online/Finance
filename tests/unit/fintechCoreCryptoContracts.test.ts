import { describe, expect, it } from 'vitest';
import {
  CRYPTO_CATEGORY_ANALYSIS_PROFILES,
  FINTECH_CORE_CRYPTO_CONTRACT_VERSION,
  FINTECH_CORE_CRYPTO_MODULE_ID,
  PATTERN_CATALOG,
  PATTERN_GROUP_BASE_WEIGHTS,
  PATTERN_VALIDATION_RESEARCH_DEFAULTS,
  STABLECOIN_RESEARCH_GATE_DEFAULTS,
  getProfileAbsoluteWeight,
  resolveCryptoAnalysisProfile,
} from '../../src/platform/FinTechCore/CryptoModuleContracts';

describe('FinTech Core Crypto Module 01 contract foundation', () => {
  it('keeps a stable module and contract identity', () => {
    expect(FINTECH_CORE_CRYPTO_MODULE_ID).toBe('fintech-core.crypto');
    expect(FINTECH_CORE_CRYPTO_CONTRACT_VERSION).toBe('fintech-core.crypto/contracts/0.1.0');
  });

  it('maps source-backed canonical categories without replacing the existing taxonomy', () => {
    expect(resolveCryptoAnalysisProfile('Layer 1')).toMatchObject({
      profileId: 'layer1',
      binding: 'DIRECT',
    });
    expect(resolveCryptoAnalysisProfile('Real World Assets')).toMatchObject({
      profileId: 'rwa',
      binding: 'DIRECT',
    });
    expect(resolveCryptoAnalysisProfile('NFT / Creator')).toMatchObject({
      profileId: 'nft',
      binding: 'CONDITIONAL',
    });
    expect(resolveCryptoAnalysisProfile('AI / Data')).toMatchObject({
      profileId: 'ai-depin',
      binding: 'CONDITIONAL',
    });
    expect(resolveCryptoAnalysisProfile('Unknown')).toMatchObject({
      profileId: 'generic',
      binding: 'GENERIC',
    });
  });

  it('keeps all source-defined category profile weights normalized by absolute weight', () => {
    const definedProfiles = Object.values(CRYPTO_CATEGORY_ANALYSIS_PROFILES)
      .filter((profile) => profile.sourceStatus === 'SOURCE_DEFINED');

    expect(definedProfiles.length).toBeGreaterThan(0);
    for (const profile of definedProfiles) {
      expect(getProfileAbsoluteWeight(profile)).toBe(1);
      expect(profile.scoreAuthority).toBe('SCORING_DISPATCHER_ONLY');
      expect(profile.normalization).toBe('WITHIN_PROFILE');
    }
  });

  it('does not invent a meme or generic profile formula when source evidence is missing', () => {
    expect(CRYPTO_CATEGORY_ANALYSIS_PROFILES.meme.sourceStatus).toBe('PENDING_EVIDENCE');
    expect(CRYPTO_CATEGORY_ANALYSIS_PROFILES.meme.metrics).toEqual([]);
    expect(CRYPTO_CATEGORY_ANALYSIS_PROFILES.generic.sourceStatus).toBe('PENDING_EVIDENCE');
    expect(CRYPTO_CATEGORY_ANALYSIS_PROFILES.generic.metrics).toEqual([]);
  });

  it('retains stablecoin source defaults as research-only configuration rather than production policy', () => {
    expect(STABLECOIN_RESEARCH_GATE_DEFAULTS.pegDeviationPctMax).toBe(1);
    expect(STABLECOIN_RESEARCH_GATE_DEFAULTS.reserveCoverageMin).toBe(1);
    expect(STABLECOIN_RESEARCH_GATE_DEFAULTS.redemptionStatusRequired).toBe(true);
    expect(STABLECOIN_RESEARCH_GATE_DEFAULTS.reserveAttestationRequired).toBe(true);
    expect(STABLECOIN_RESEARCH_GATE_DEFAULTS.authority).toBe('RESEARCH_DEFAULT_NOT_PRODUCTION_POLICY');
  });

  it('preserves the Owner-source pattern priority order as start weights, not probabilities', () => {
    const weights = [
      PATTERN_GROUP_BASE_WEIGHTS.STRUCTURE_REVERSAL,
      PATTERN_GROUP_BASE_WEIGHTS.STRUCTURE_CONTINUATION,
      PATTERN_GROUP_BASE_WEIGHTS.BREAKOUT_STRUCTURE,
      PATTERN_GROUP_BASE_WEIGHTS.WEDGE,
      PATTERN_GROUP_BASE_WEIGHTS.CANDLESTICK_REVERSAL,
      PATTERN_GROUP_BASE_WEIGHTS.CANDLESTICK_CONTINUATION,
      PATTERN_GROUP_BASE_WEIGHTS.SINGLE_CANDLE,
      PATTERN_GROUP_BASE_WEIGHTS.MICRO_PATTERN,
    ];

    expect(weights).toEqual([1, 0.9, 0.85, 0.8, 0.65, 0.6, 0.4, 0.25]);
    expect(weights.every((weight, index) => index === 0 || weight < weights[index - 1])).toBe(true);
  });

  it('keeps the initial pattern catalog deterministic and duplicate-free', () => {
    const ids = PATTERN_CATALOG.map((pattern) => pattern.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(PATTERN_CATALOG.some((pattern) => pattern.id === 'double-bottom')).toBe(true);
    expect(PATTERN_CATALOG.some((pattern) => pattern.id === 'head-and-shoulders')).toBe(true);
    expect(PATTERN_CATALOG.some((pattern) => pattern.id === 'bullish-engulfing')).toBe(true);
    expect(PATTERN_CATALOG.some((pattern) => pattern.id === 'breakaway-gap' && pattern.requiresGapCapableMarketData)).toBe(true);
  });

  it('captures walk-forward, cost-aware pattern validation defaults without promoting them to production policy', () => {
    expect(PATTERN_VALIDATION_RESEARCH_DEFAULTS.minimumOccurrences).toBe(100);
    expect(PATTERN_VALIDATION_RESEARCH_DEFAULTS.trainWindowDays).toBe(730);
    expect(PATTERN_VALIDATION_RESEARCH_DEFAULTS.validationWindowDays).toBe(180);
    expect(PATTERN_VALIDATION_RESEARCH_DEFAULTS.walkForward).toBe(true);
    expect(PATTERN_VALIDATION_RESEARCH_DEFAULTS.includeFees).toBe(true);
    expect(PATTERN_VALIDATION_RESEARCH_DEFAULTS.includeSlippage).toBe(true);
    expect(PATTERN_VALIDATION_RESEARCH_DEFAULTS.includeFunding).toBe(true);
    expect(PATTERN_VALIDATION_RESEARCH_DEFAULTS.authority).toBe('RESEARCH_DEFAULT_NOT_PRODUCTION_POLICY');
  });
});

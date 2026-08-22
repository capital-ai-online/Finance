import { describe, expect, it } from 'vitest';
import {
  CRYPTO_DEFI_RESEARCH_FEATURE_CONTRACT_VERSION,
  CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT,
  CRYPTO_MEME_RESEARCH_FEATURE_CONTRACT_VERSION,
  CRYPTO_MEME_RESEARCH_MODEL_CONTRACT,
  RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY,
  createUniversalAssetIdentity,
  scoringModelRegistry,
} from '../../src/platform/Scoring';

describe('Supersession-B Meme/DeFi research model contracts', () => {
  it('keeps both category models non-executable challengers', () => {
    for (const contract of [CRYPTO_MEME_RESEARCH_MODEL_CONTRACT, CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT]) {
      expect(contract.modelVersion).toBe('0.2.0');
      expect(contract.lifecycle).toBe('challenger');
      expect(contract.scoreEligible).toBe(false);
      expect(contract.executableWeights).toBe(false);
      expect(contract.promotionRequirements.length).toBeGreaterThan(0);
      expect(contract.antiCorrelationRules.length).toBeGreaterThan(0);
    }
  });

  it('binds correlated Meme price-path observations into one correlation group before any future weighting', () => {
    const pricePath = CRYPTO_MEME_RESEARCH_MODEL_CONTRACT.features
      .filter((feature) => ['technical.trend', 'technical.momentum', 'risk.volatilityQuality'].includes(feature.key));
    expect(pricePath).toHaveLength(3);
    expect(new Set(pricePath.map((feature) => feature.correlationGroup))).toEqual(new Set(['meme-price-path']));
    expect(CRYPTO_MEME_RESEARCH_MODEL_CONTRACT.features.filter((feature) => feature.role === 'HARD_GATE').map((feature) => feature.key))
      .toEqual(expect.arrayContaining(['risk.contractIntegrityVerified', 'risk.manipulationEvidenceWithinPolicy']));
  });

  it('binds DeFi TVL, fees and revenue to one protocol scale/activity correlation group', () => {
    const scaleActivity = CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT.features
      .filter((feature) => ['protocol.tvlUsd', 'protocol.feesUsd', 'protocol.revenueUsd'].includes(feature.key));
    expect(scaleActivity).toHaveLength(3);
    expect(new Set(scaleActivity.map((feature) => feature.correlationGroup))).toEqual(new Set(['defi-scale-activity']));
  });

  it('registers the superseded challengers without changing crypto champion resolution', () => {
    const meme = scoringModelRegistry.get('crypto-meme-integrity');
    const defi = scoringModelRegistry.get('crypto-defi-fundamental');

    expect(meme).toMatchObject({
      version: '0.2.0',
      lifecycle: 'challenger',
      scoreEligible: false,
      evidencePolicy: 'research-only',
      executorKey: RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY,
      featureContractVersion: CRYPTO_MEME_RESEARCH_FEATURE_CONTRACT_VERSION,
    });
    expect(defi).toMatchObject({
      version: '0.2.0',
      lifecycle: 'challenger',
      scoreEligible: false,
      evidencePolicy: 'research-only',
      executorKey: RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY,
      featureContractVersion: CRYPTO_DEFI_RESEARCH_FEATURE_CONTRACT_VERSION,
    });

    const resolution = scoringModelRegistry.resolve(
      createUniversalAssetIdentity({ symbol: 'DOGE', assetClass: 'crypto' }),
    );
    expect(resolution.status).toBe('RESOLVED');
    if (resolution.status === 'RESOLVED') {
      expect(resolution.model.modelId).toBe('crypto-technical-provenance');
      expect(resolution.model.version).toBe('0.7.0');
    }
  });
});
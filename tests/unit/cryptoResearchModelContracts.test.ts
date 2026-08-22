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

describe('Meme/DeFi research model contracts 0.3.0', () => {
  it('keeps both source-backed category models non-executable challengers', () => {
    for (const contract of [CRYPTO_MEME_RESEARCH_MODEL_CONTRACT, CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT]) {
      expect(contract.modelVersion).toBe('0.3.0');
      expect(contract.lifecycle).toBe('challenger');
      expect(contract.scoreEligible).toBe(false);
      expect(contract.executableWeights).toBe(false);
      expect(contract.promotionRequirements.length).toBeGreaterThan(0);
      expect(contract.antiCorrelationRules.length).toBeGreaterThan(0);
    }
    expect(CRYPTO_MEME_RESEARCH_FEATURE_CONTRACT_VERSION).toBe('crypto-meme-research-features/0.3.0');
    expect(CRYPTO_DEFI_RESEARCH_FEATURE_CONTRACT_VERSION).toBe('crypto-defi-research-features/0.3.0');
  });

  it('binds Meme execution-liquidity observations once and keeps holder distribution separate', () => {
    const execution = CRYPTO_MEME_RESEARCH_MODEL_CONTRACT.features
      .filter((feature) => feature.correlationGroup === 'meme-execution-liquidity');
    const holderDistribution = CRYPTO_MEME_RESEARCH_MODEL_CONTRACT.features
      .filter((feature) => feature.correlationGroup === 'meme-holder-distribution');

    expect(execution).toHaveLength(5);
    expect(new Set(execution.map((feature) => feature.latentFactor))).toEqual(new Set(['executionLiquidity']));
    expect(holderDistribution).toHaveLength(6);
    expect(new Set(holderDistribution.map((feature) => feature.latentFactor))).toEqual(new Set(['holderDistribution']));
  });

  it('requires explicit Meme transaction/contract/manipulation hard gates', () => {
    const hardGates = CRYPTO_MEME_RESEARCH_MODEL_CONTRACT.features
      .filter((feature) => feature.role === 'HARD_GATE')
      .map((feature) => feature.key);
    expect(hardGates).toEqual(expect.arrayContaining([
      'risk.buySimulationSuccess',
      'risk.sellSimulationSuccess',
      'risk.liquidityLockWithinPolicy',
      'risk.transferTaxWithinPolicy',
      'risk.contractIntegrityVerified',
      'risk.manipulationEvidenceWithinPolicy',
    ]));
  });

  it('keeps DeFi TVL, fees and revenue correlation-bound while expanding independent risk families', () => {
    const scaleActivity = CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT.features
      .filter((feature) => ['protocol.tvlUsd', 'protocol.feesUsd', 'protocol.revenueUsd'].includes(feature.key));
    expect(scaleActivity).toHaveLength(3);
    expect(new Set(scaleActivity.map((feature) => feature.correlationGroup))).toEqual(new Set(['defi-scale-activity']));

    const groups = new Set(CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT.features.map((feature) => feature.correlationGroup));
    expect(groups.has('defi-utilization')).toBe(true);
    expect(groups.has('defi-contract-security')).toBe(true);
    expect(groups.has('defi-oracle-integrity')).toBe(true);
    expect(groups.has('defi-token-economics')).toBe(true);
  });

  it('registers 0.3.0 challengers without changing crypto champion resolution', () => {
    const meme = scoringModelRegistry.get('crypto-meme-integrity');
    const defi = scoringModelRegistry.get('crypto-defi-fundamental');

    expect(meme).toMatchObject({
      version: '0.3.0',
      lifecycle: 'challenger',
      scoreEligible: false,
      evidencePolicy: 'research-only',
      executorKey: RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY,
      featureContractVersion: CRYPTO_MEME_RESEARCH_FEATURE_CONTRACT_VERSION,
    });
    expect(defi).toMatchObject({
      version: '0.3.0',
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

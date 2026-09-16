import { describe, expect, it } from 'vitest';
import { CRYPTO_CATEGORY_PROFILE_BINDINGS } from '../../src/platform/FinTechCore/CryptoModuleContracts';
import {
  bindValidatedDataToCryptoCategoryFeatures,
  buildCryptoCategoryDispatchBinding,
  projectCryptoScoringLineage,
  resolveCryptoCategoryModelBinding,
} from '../../src/platform/FinTechCore/Modules/Crypto/CryptoCategoryScoringBinding';
import type {
  CryptoClassification,
  CryptoSubCategory,
} from '../../src/types/crypto.types';
import type { CanonicalScoreResult } from '../../src/types/scoringIntegrity';
import {
  VALIDATED_DATA_INPUT_CONTRACT_VERSION,
  type ValidatedDataInput,
  type ValidatedDataObservation,
  type ValidatedDataStatus,
} from '../../src/platform/MarketData/ValidatedDataInput';
import { UNIVERSAL_ASSET_CONTRACT_VERSION } from '../../src/platform/Scoring/contracts';

const NOW = '2026-09-16T12:00:00.000Z';

function classification(
  category_main: CryptoClassification['category_main'] = 'Layer 1',
  category_sub: CryptoSubCategory = 'Chain-native Asset',
): CryptoClassification {
  return {
    category_main,
    category_sub,
    asset_type: 'coin',
    tier: 1,
    confidence: 0.97,
    reasoning: ['deterministic fixture'],
  };
}

function observation(
  field: string,
  value: number,
  options: Readonly<{
    providerId?: string;
    status?: ValidatedDataStatus;
    currency?: string | null;
    evidenceRef?: string | null;
  }> = {},
): ValidatedDataObservation {
  return {
    field,
    value,
    currency: options.currency ?? null,
    providerId: options.providerId ?? 'validated-data-provider',
    providerFeed: 'fixture-feed',
    evidenceRef: options.evidenceRef === undefined ? `evidence:${field}:${options.providerId ?? 'primary'}` : options.evidenceRef,
    observedAt: '2026-09-16T11:59:00.000Z',
    retrievedAt: NOW,
    freshness: { ageMs: 60_000, maxAgeMs: 300_000, evaluatedAt: NOW },
    status: options.status ?? 'PASS',
  };
}

function validatedInput(
  observations: readonly ValidatedDataObservation[],
  aggregateStatus: ValidatedDataStatus = 'PASS',
): ValidatedDataInput {
  return {
    contractVersion: VALIDATED_DATA_INPUT_CONTRACT_VERSION,
    assetIdentity: {
      contractVersion: UNIVERSAL_ASSET_CONTRACT_VERSION,
      assetId: 'crypto:ETH',
      symbol: 'ETH',
      assetClass: 'crypto',
      source: 'request',
    },
    correlationId: 'corr-fintech-crypto-001',
    observations,
    aggregateStatus,
    missingRequiredFields: [],
    nonComputableReasons: [],
    provenanceComplete: true,
  };
}

function readyLayer1Input(): ValidatedDataInput {
  return validatedInput([
    observation('network.activeAddresses', 1_000_000),
    observation('network.transactionGrowth', 4.2),
    observation('network.feesRevenue', 2_000_000),
    observation('network.developerActivity', 82),
    observation('network.stakingSecurity', 91),
    observation('network.decentralization', 86),
    observation('tokenomics.quality', 79),
    observation('liquidity.quality', 88),
    observation('price', 3_500, { currency: 'USD' }),
  ]);
}

function readyCanonical(modelId: string, modelVersion: string, featureVersion: string): CanonicalScoreResult {
  return {
    status: 'READY',
    score: 84,
    final_score: 84,
    integrity: {
      status: 'READY',
      assetId: 'crypto:ETH',
      providers: ['validated-data-provider'],
      observedAt: '2026-09-16T11:59:00.000Z',
      retrievedAt: NOW,
      dataQuality: 'high',
      featureVersion,
      scoringVersion: `${modelId}/${modelVersion}`,
      coverage: 1,
      evidence: [],
      missingFields: [],
      modelId,
      modelVersion,
      modelLifecycle: 'canonical',
    },
  };
}

describe('FINTECH crypto category feature/model/lineage binding', () => {
  it('maps complete DATA-backed Layer-1 evidence into a typed READY contract with exact lineage', () => {
    const result = bindValidatedDataToCryptoCategoryFeatures(readyLayer1Input(), classification());

    expect(result.status).toBe('READY');
    expect(result.effectiveProfileId).toBe('layer1');
    expect(result.blockingReasons).toEqual([]);
    expect(result.categoryFeatureContract.status).toBe('READY');
    expect(result.lineage.find(item => item.sourceField === 'price')).toMatchObject({
      featureKey: 'market.priceUsd',
      providerId: 'validated-data-provider',
      evidenceRef: 'evidence:price:primary',
    });
    expect(result.lineage.every(item => item.dataStatus === 'PASS')).toBe(true);
  });

  it('keeps missing/stale category evidence NOT_COMPUTABLE with no neutral or zero default', () => {
    const stale = observation('network.activeAddresses', 100, { status: 'STALE' });
    const result = bindValidatedDataToCryptoCategoryFeatures(
      validatedInput([stale], 'STALE'),
      classification(),
    );

    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.lineage).toEqual([]);
    expect(result.blockingReasons).toContain('aggregate-status:STALE');
    expect(result.categoryFeatureContract.missingRequiredFeatures).toContain('network.activeAddresses');
  });

  it('fails closed on provider conflicts for the same feature instead of choosing one silently', () => {
    const input = validatedInput([
      observation('network.activeAddresses', 100, { providerId: 'provider-a' }),
      observation('network.activeAddresses', 101, { providerId: 'provider-b' }),
    ]);
    const result = bindValidatedDataToCryptoCategoryFeatures(input, classification());

    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.blockingReasons).toContain('feature-source-ambiguous:network.activeAddresses');
    expect(result.lineage).toEqual([]);
  });

  it('does not promote conditional AI/Data classification to DePIN without separate qualifying evidence', () => {
    const result = bindValidatedDataToCryptoCategoryFeatures(
      validatedInput([observation('network.activeNodes', 20_000)]),
      classification('AI / Data', 'Protocol Token'),
    );

    expect(result.requestedProfileId).toBe('ai-depin');
    expect(result.effectiveProfileId).toBe('generic');
    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.blockingReasons).toContain('conditional-profile-evidence-required:ai-depin');
  });

  it('binds every canonical category to the one registered champion while preserving research-only challengers', () => {
    for (const category of Object.keys(CRYPTO_CATEGORY_PROFILE_BINDINGS) as CryptoClassification['category_main'][]) {
      const binding = resolveCryptoCategoryModelBinding(classification(category));
      expect(binding.canonical.modelId).toBe('crypto-technical-provenance');
      expect(binding.canonical.modelVersion).toBe('0.7.0');
      expect(binding.canonical.lifecycle).toBe('canonical');
      expect(binding.canonical.scoreEligible).toBe(true);
      expect(binding.canonical.executionEligible).toBe(true);
    }

    const meme = resolveCryptoCategoryModelBinding(classification('Meme'));
    expect(meme.researchChallengers).toHaveLength(1);
    expect(meme.researchChallengers[0]).toMatchObject({
      modelId: 'crypto-meme-integrity',
      modelVersion: '0.3.0',
      lifecycle: 'challenger',
      scoreEligible: false,
      executionEligible: false,
    });
    expect(meme.researchChallengers[0].hardGates.length).toBeGreaterThan(0);
    expect(meme.researchChallengers[0].antiCorrelationRules.length).toBeGreaterThan(0);

    const defi = resolveCryptoCategoryModelBinding(classification('DeFi'));
    expect(defi.researchChallengers[0]).toMatchObject({
      modelId: 'crypto-defi-fundamental',
      modelVersion: '0.3.0',
      lifecycle: 'challenger',
      scoreEligible: false,
      executionEligible: false,
    });
  });

  it('keeps candidate specialized lenses as research targets rather than registering hidden models', () => {
    const stablecoin = resolveCryptoCategoryModelBinding(classification('Stablecoin', 'Protocol Token'));
    expect(stablecoin.researchChallengers).toEqual([]);
    expect(stablecoin.researchTarget).toEqual({
      authority: 'RESEARCH_TARGET_NOT_MODEL',
      lenses: ['peg_quality', 'liquidity', 'reserve_evidence_when_available', 'depeg_risk'],
    });
  });

  it('projects identical correlation/model/evidence identity to dispatch, FE and OPS trace', () => {
    const feature = bindValidatedDataToCryptoCategoryFeatures(readyLayer1Input(), classification());
    const models = resolveCryptoCategoryModelBinding(classification());
    const dispatch = buildCryptoCategoryDispatchBinding(feature, models);
    const canonical = readyCanonical(
      models.canonical.modelId,
      models.canonical.modelVersion,
      models.canonical.featureContractVersion,
    );
    const lineage = projectCryptoScoringLineage(feature, models, canonical);

    expect(dispatch).toMatchObject({
      assetId: 'crypto:ETH',
      categoryMain: 'Layer 1',
      categorySub: 'Chain-native Asset',
      modelId: 'crypto-technical-provenance',
      modelVersion: '0.7.0',
      correlationId: 'corr-fintech-crypto-001',
      dataQuality: 'PASS',
    });
    expect(lineage.status).toBe('READY');
    expect(lineage.frontend).toMatchObject({
      model_id: dispatch.modelId,
      model_version: dispatch.modelVersion,
      lifecycle: 'canonical',
      canonical_vs_research: 'CANONICAL',
      category_main: dispatch.categoryMain,
      category_sub: dispatch.categorySub,
      data_quality: dispatch.dataQuality,
      scoreEligible: true,
      executionEligible: true,
      explicit_not_computable_reason: null,
    });
    expect(lineage.opsTrace).toMatchObject({
      correlationId: dispatch.correlationId,
      assetId: dispatch.assetId,
      modelId: dispatch.modelId,
      modelVersion: dispatch.modelVersion,
      dataQuality: dispatch.dataQuality,
      canonicalScoreStatus: 'READY',
    });
    expect(lineage.opsTrace.evidenceIds).toEqual(dispatch.evidenceRefs);
    expect(lineage.frontend.evidence_ids).toEqual(dispatch.evidenceRefs);
  });

  it('rejects canonical lineage metadata mismatches instead of relabeling the score', () => {
    const feature = bindValidatedDataToCryptoCategoryFeatures(readyLayer1Input(), classification());
    const models = resolveCryptoCategoryModelBinding(classification());
    const canonical = readyCanonical('wrong-model', '9.9.9', 'wrong-features');
    const lineage = projectCryptoScoringLineage(feature, models, canonical);

    expect(lineage.status).toBe('NOT_COMPUTABLE');
    expect(lineage.reasons).toContain('canonical-model-id-mismatch');
    expect(lineage.reasons).toContain('canonical-model-version-mismatch');
    expect(lineage.reasons).toContain('canonical-feature-version-mismatch');
    expect(lineage.frontend.explicit_not_computable_reason).toContain('canonical-model-id-mismatch');
  });
});

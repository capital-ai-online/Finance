import { evaluateVerifiedCryptoTechnicalScore, type VerifiedCryptoTechnicalAssessment } from '../../services/verifiedCryptoTechnicalScoring';
import type { CanonicalScoreResult } from '../../types/scoringIntegrity';
import {
  CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
  type ScoringModelDescriptor,
  type UniversalAssetClass,
  type UniversalAssetIdentity,
  type UniversalAssetSource,
} from './contracts';
import {
  ScoringModelRegistry,
  VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY,
  scoringModelRegistry,
} from './ScoringModelRegistry';
import { createUniversalAssetIdentity } from './UniversalAssetAdapter';

export const CANONICAL_SCORING_DISPATCHER_VERSION = 'canonical-scoring-dispatcher/1.0.0' as const;

export interface CanonicalScoringDispatchRequest {
  symbol: string;
  assetClass: UniversalAssetClass;
  name?: string;
  subtype?: string;
  instrumentKind?: string;
  source?: UniversalAssetSource;
}

type ScoringModelResolver = Pick<ScoringModelRegistry, 'resolve'>;
type CryptoScoreExecutor = (symbol: string) => Promise<VerifiedCryptoTechnicalAssessment>;

export interface CanonicalScoringDispatcherDependencies {
  registry?: ScoringModelResolver;
  cryptoExecutor?: CryptoScoreExecutor;
}

export type CanonicalScoringDispatchResult =
  | {
      status: 'DISPATCHED';
      dispatcherVersion: typeof CANONICAL_SCORING_DISPATCHER_VERSION;
      asset: UniversalAssetIdentity;
      model: ScoringModelDescriptor;
      canonical: CanonicalScoreResult;
      assessment: VerifiedCryptoTechnicalAssessment;
    }
  | {
      status: 'SCORE_NOT_COMPUTABLE';
      dispatcherVersion: typeof CANONICAL_SCORING_DISPATCHER_VERSION;
      asset: UniversalAssetIdentity;
      model: ScoringModelDescriptor | null;
      canonical: CanonicalScoreResult;
      reason: string;
    };

function buildDispatchFailure(
  asset: UniversalAssetIdentity,
  reason: string,
  model: ScoringModelDescriptor | null = null,
): CanonicalScoringDispatchResult {
  return {
    status: 'SCORE_NOT_COMPUTABLE',
    dispatcherVersion: CANONICAL_SCORING_DISPATCHER_VERSION,
    asset,
    model,
    reason,
    canonical: {
      status: 'SCORE_NOT_COMPUTABLE',
      score: null,
      final_score: null,
      integrity: {
        status: 'SCORE_NOT_COMPUTABLE',
        assetId: asset.assetId,
        providers: [],
        retrievedAt: new Date().toISOString(),
        dataQuality: 'unknown',
        featureVersion: model?.featureContractVersion ?? 'model-registry-unresolved',
        scoringVersion: CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
        coverage: 0,
        evidence: [],
        missingFields: ['scoringModel'],
        reason,
      },
    },
  };
}

/**
 * SC-2 Phase C canonical model-execution boundary.
 *
 * Productive callers provide identity only. This dispatcher constructs the UAI identity,
 * resolves the canonical champion from ScoringModelRegistry, verifies the executor/evidence/
 * result-contract binding and only then invokes the registered domain executor. Routes and
 * orchestration layers must never import a productive scoring engine directly.
 *
 * The initial executable binding is the verified Standard-Crypto scorer. Other asset classes
 * intentionally fail closed until their existing engines have CanonicalScoreResult adapters and
 * are explicitly bound here in later SC-2 migration increments.
 */
export async function dispatchCanonicalScore(
  input: Readonly<CanonicalScoringDispatchRequest>,
  dependencies: Readonly<CanonicalScoringDispatcherDependencies> = {},
): Promise<CanonicalScoringDispatchResult> {
  const asset = createUniversalAssetIdentity({
    symbol: input.symbol,
    name: input.name,
    assetClass: input.assetClass,
    subtype: input.subtype,
    instrumentKind: input.instrumentKind,
    source: input.source ?? 'request',
  });

  const registry = dependencies.registry ?? scoringModelRegistry;
  const resolution = registry.resolve(asset);
  if (resolution.status !== 'RESOLVED') {
    return buildDispatchFailure(asset, resolution.reason);
  }

  const model = resolution.model;
  const isCanonicalCryptoBinding = asset.assetClass === 'crypto'
    && model.executorKey === VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY
    && model.evidencePolicy === 'verified-required'
    && model.resultContractVersion === CANONICAL_SCORE_RESULT_CONTRACT_VERSION
    && model.canonicalResultAdapterRequired === false;

  if (!isCanonicalCryptoBinding) {
    return buildDispatchFailure(
      asset,
      `Resolved model ${model.modelId}@${model.version} is not executable by ${CANONICAL_SCORING_DISPATCHER_VERSION}.`,
      model,
    );
  }

  const cryptoExecutor = dependencies.cryptoExecutor ?? evaluateVerifiedCryptoTechnicalScore;
  const assessment = await cryptoExecutor(asset.symbol);

  return {
    status: 'DISPATCHED',
    dispatcherVersion: CANONICAL_SCORING_DISPATCHER_VERSION,
    asset,
    model,
    canonical: assessment.canonical,
    assessment,
  };
}

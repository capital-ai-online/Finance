import { evaluateVerifiedCryptoTechnicalScore, type VerifiedCryptoTechnicalAssessment } from '../../services/verifiedCryptoTechnicalScoring';
import type { CommodityMarketEvidence } from '../../services/commodityMarketEvidence';
import type { BondEvidenceResult } from '../../services/eodhdBondEvidence';
import type { TraditionalAssetScoringInputs } from '../../services/traditionalAssetScoring';
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
import {
  COMMODITY_EVIDENCE_EXECUTOR_KEY,
  SOVEREIGN_BENCHMARK_EXECUTOR_KEY,
  TRADITIONAL_SCORING_EXECUTOR_KEY,
  executeCommodityCanonicalScore,
  executeSovereignBenchmarkCanonicalScore,
  executeTraditionalCanonicalScore,
  type TraditionalCanonicalScoringAssessment,
} from './ScoringExecutorAdapters';
import type { CommodityEvidenceScoringResult } from '../../services/commodityEvidenceScoring';
import type { SovereignBenchmarkScoringResult } from '../../services/sovereignBenchmarkEvidenceScoring';

export const CANONICAL_SCORING_DISPATCHER_VERSION = 'canonical-scoring-dispatcher/1.1.0' as const;

interface CanonicalScoringDispatchBaseRequest {
  symbol: string;
  assetClass: UniversalAssetClass;
  name?: string;
  subtype?: string;
  instrumentKind?: string;
  source?: UniversalAssetSource;
}

export interface CryptoCanonicalScoringDispatchRequest extends CanonicalScoringDispatchBaseRequest {
  assetClass: 'crypto';
}

export interface TraditionalCanonicalScoringDispatchRequest extends CanonicalScoringDispatchBaseRequest {
  assetClass: 'stock' | 'forex' | 'index';
  execution?: { kind: 'traditional'; inputs: TraditionalAssetScoringInputs };
}

export interface CommodityCanonicalScoringDispatchRequest extends CanonicalScoringDispatchBaseRequest {
  assetClass: 'commodity';
  execution?: { kind: 'commodity-evidence'; evidence: CommodityMarketEvidence };
}

export interface SovereignCanonicalScoringDispatchRequest extends CanonicalScoringDispatchBaseRequest {
  assetClass: 'bond';
  execution?: { kind: 'sovereign-benchmark-evidence'; evidence: BondEvidenceResult };
}

export type CanonicalScoringDispatchRequest =
  | CryptoCanonicalScoringDispatchRequest
  | TraditionalCanonicalScoringDispatchRequest
  | CommodityCanonicalScoringDispatchRequest
  | SovereignCanonicalScoringDispatchRequest;

type ScoringModelResolver = Pick<ScoringModelRegistry, 'resolve'>;
type CryptoScoreExecutor = (symbol: string) => Promise<VerifiedCryptoTechnicalAssessment>;
type TraditionalScoreExecutor = typeof executeTraditionalCanonicalScore;
type CommodityScoreExecutor = typeof executeCommodityCanonicalScore;
type SovereignScoreExecutor = typeof executeSovereignBenchmarkCanonicalScore;

export interface CanonicalScoringDispatcherDependencies {
  registry?: ScoringModelResolver;
  cryptoExecutor?: CryptoScoreExecutor;
  traditionalExecutor?: TraditionalScoreExecutor;
  commodityExecutor?: CommodityScoreExecutor;
  sovereignExecutor?: SovereignScoreExecutor;
}

export interface CanonicalScoringDispatchFailure {
  status: 'SCORE_NOT_COMPUTABLE';
  dispatcherVersion: typeof CANONICAL_SCORING_DISPATCHER_VERSION;
  asset: UniversalAssetIdentity;
  model: ScoringModelDescriptor | null;
  canonical: CanonicalScoreResult;
  reason: string;
}

interface CanonicalScoringDispatchSuccess<TAssessment> {
  status: 'DISPATCHED';
  dispatcherVersion: typeof CANONICAL_SCORING_DISPATCHER_VERSION;
  asset: UniversalAssetIdentity;
  model: ScoringModelDescriptor;
  canonical: CanonicalScoreResult;
  assessment: TAssessment;
}

export type CryptoCanonicalScoringDispatchResult = CanonicalScoringDispatchFailure | CanonicalScoringDispatchSuccess<VerifiedCryptoTechnicalAssessment>;
export type TraditionalCanonicalScoringDispatchResult = CanonicalScoringDispatchFailure | CanonicalScoringDispatchSuccess<TraditionalCanonicalScoringAssessment>;
export type CommodityCanonicalScoringDispatchResult = CanonicalScoringDispatchFailure | CanonicalScoringDispatchSuccess<CommodityEvidenceScoringResult>;
export type SovereignCanonicalScoringDispatchResult = CanonicalScoringDispatchFailure | CanonicalScoringDispatchSuccess<SovereignBenchmarkScoringResult>;
export type CanonicalScoringDispatchResult =
  | CryptoCanonicalScoringDispatchResult
  | TraditionalCanonicalScoringDispatchResult
  | CommodityCanonicalScoringDispatchResult
  | SovereignCanonicalScoringDispatchResult;

function bindCanonicalTraceability(canonical: CanonicalScoreResult, asset: UniversalAssetIdentity, model: ScoringModelDescriptor): CanonicalScoreResult {
  return {
    ...canonical,
    integrity: {
      ...canonical.integrity,
      assetId: asset.assetId,
      featureVersion: model.featureContractVersion,
      dispatcherVersion: CANONICAL_SCORING_DISPATCHER_VERSION,
      modelRegistryVersion: model.registryVersion,
      modelId: model.modelId,
      modelVersion: model.version,
      modelAlias: model.alias,
      modelLifecycle: model.lifecycle,
      executorKey: model.executorKey,
      resultContractVersion: model.resultContractVersion,
    },
  } as CanonicalScoreResult;
}

function buildDispatchFailure(
  asset: UniversalAssetIdentity,
  reason: string,
  model: ScoringModelDescriptor | null = null,
  missingField: 'scoringModel' | 'scoringEvidence' = 'scoringModel',
): CanonicalScoringDispatchFailure {
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
        scoringVersion: model?.modelId && model?.version ? `${model.modelId}/${model.version}` : CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
        coverage: 0,
        evidence: [],
        missingFields: [missingField],
        reason,
        dispatcherVersion: CANONICAL_SCORING_DISPATCHER_VERSION,
        modelRegistryVersion: model?.registryVersion,
        modelId: model?.modelId,
        modelVersion: model?.version,
        modelAlias: model?.alias,
        modelLifecycle: model?.lifecycle,
        executorKey: model?.executorKey,
        resultContractVersion: model?.resultContractVersion ?? CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
      },
    },
  };
}

function commonBindingReady(model: ScoringModelDescriptor): boolean {
  return model.evidencePolicy === 'verified-required'
    && model.resultContractVersion === CANONICAL_SCORE_RESULT_CONTRACT_VERSION
    && model.canonicalResultAdapterRequired === false;
}

/**
 * SC-2 Phase C canonical model-execution boundary.
 * Callers provide UAI identity plus an asset-class-specific verified feature/evidence contract.
 * The dispatcher resolves the canonical champion, validates executor/evidence/result bindings and
 * is the only productive layer allowed to invoke a domain scoring engine.
 */
export function dispatchCanonicalScore(input: CryptoCanonicalScoringDispatchRequest, dependencies?: Readonly<CanonicalScoringDispatcherDependencies>): Promise<CryptoCanonicalScoringDispatchResult>;
export function dispatchCanonicalScore(input: TraditionalCanonicalScoringDispatchRequest, dependencies?: Readonly<CanonicalScoringDispatcherDependencies>): Promise<TraditionalCanonicalScoringDispatchResult>;
export function dispatchCanonicalScore(input: CommodityCanonicalScoringDispatchRequest, dependencies?: Readonly<CanonicalScoringDispatcherDependencies>): Promise<CommodityCanonicalScoringDispatchResult>;
export function dispatchCanonicalScore(input: SovereignCanonicalScoringDispatchRequest, dependencies?: Readonly<CanonicalScoringDispatcherDependencies>): Promise<SovereignCanonicalScoringDispatchResult>;
export function dispatchCanonicalScore(input: CanonicalScoringDispatchRequest, dependencies?: Readonly<CanonicalScoringDispatcherDependencies>): Promise<CanonicalScoringDispatchResult>;
export async function dispatchCanonicalScore(
  input: CanonicalScoringDispatchRequest,
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
  if (resolution.status !== 'RESOLVED') return buildDispatchFailure(asset, resolution.reason);

  const model = resolution.model;
  if (!commonBindingReady(model)) {
    return buildDispatchFailure(asset, `Resolved model ${model.modelId}@${model.version} violates the canonical evidence/result binding required by ${CANONICAL_SCORING_DISPATCHER_VERSION}.`, model);
  }

  if (input.assetClass === 'crypto') {
    if (model.executorKey !== VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY) {
      return buildDispatchFailure(asset, `Unexpected crypto executor binding: ${model.executorKey}.`, model);
    }
    const cryptoExecutor = dependencies.cryptoExecutor ?? evaluateVerifiedCryptoTechnicalScore;
    const assessment = await cryptoExecutor(asset.symbol);
    const canonical = bindCanonicalTraceability(assessment.canonical, asset, model);
    return { status: 'DISPATCHED', dispatcherVersion: CANONICAL_SCORING_DISPATCHER_VERSION, asset, model, canonical, assessment: { ...assessment, canonical } };
  }

  if (input.assetClass === 'stock' || input.assetClass === 'forex' || input.assetClass === 'index') {
    if (model.executorKey !== TRADITIONAL_SCORING_EXECUTOR_KEY) {
      return buildDispatchFailure(asset, `Unexpected traditional executor binding: ${model.executorKey}.`, model);
    }
    if (!input.execution || input.execution.kind !== 'traditional') {
      return buildDispatchFailure(asset, 'Verified Traditional scoring inputs are required before model execution.', model, 'scoringEvidence');
    }
    const executor = dependencies.traditionalExecutor ?? executeTraditionalCanonicalScore;
    const assessment = executor(asset, input.execution.inputs);
    const canonical = bindCanonicalTraceability(assessment.canonical, asset, model);
    return { status: 'DISPATCHED', dispatcherVersion: CANONICAL_SCORING_DISPATCHER_VERSION, asset, model, canonical, assessment: { ...assessment, canonical } };
  }

  if (input.assetClass === 'commodity') {
    if (model.executorKey !== COMMODITY_EVIDENCE_EXECUTOR_KEY) {
      return buildDispatchFailure(asset, `Unexpected commodity executor binding: ${model.executorKey}.`, model);
    }
    if (!input.execution || input.execution.kind !== 'commodity-evidence') {
      return buildDispatchFailure(asset, 'Verified commodity market evidence is required before model execution.', model, 'scoringEvidence');
    }
    const executor = dependencies.commodityExecutor ?? executeCommodityCanonicalScore;
    const assessment = executor(input.execution.evidence);
    const canonical = bindCanonicalTraceability(assessment.canonical, asset, model);
    return { status: 'DISPATCHED', dispatcherVersion: CANONICAL_SCORING_DISPATCHER_VERSION, asset, model, canonical, assessment: { ...assessment, canonical } };
  }

  if (input.assetClass === 'bond') {
    if (model.executorKey !== SOVEREIGN_BENCHMARK_EXECUTOR_KEY) {
      return buildDispatchFailure(asset, `Unexpected sovereign executor binding: ${model.executorKey}.`, model);
    }
    if (!input.execution || input.execution.kind !== 'sovereign-benchmark-evidence') {
      return buildDispatchFailure(asset, 'Verified sovereign benchmark evidence is required before model execution.', model, 'scoringEvidence');
    }
    const executor = dependencies.sovereignExecutor ?? executeSovereignBenchmarkCanonicalScore;
    const assessment = executor(asset, input.execution.evidence);
    const canonical = bindCanonicalTraceability(assessment.canonical, asset, model);
    return { status: 'DISPATCHED', dispatcherVersion: CANONICAL_SCORING_DISPATCHER_VERSION, asset, model, canonical, assessment: { ...assessment, canonical } };
  }

  return buildDispatchFailure(asset, `No executor adapter is registered for ${asset.assetClass}.`, model);
}

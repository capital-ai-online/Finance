import { CANONICAL_SCORE_RESULT_CONTRACT_VERSION, type ScoringModelResolution, type UniversalAssetSource } from './contracts';
import type { CanonicalScoreResult } from '../../types/scoringIntegrity';
import {
  ScoringModelRegistry,
  VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY,
  scoringModelRegistry,
} from './ScoringModelRegistry';
import { createUniversalAssetIdentity } from './UniversalAssetAdapter';

export interface CryptoScoreExecutionRequest {
  symbol: string;
  name?: string;
  subtype?: string;
  source?: UniversalAssetSource;
}

type ScoringModelResolver = Pick<ScoringModelRegistry, 'resolve'>;
type CryptoScoreResolutionFailure = Extract<ScoringModelResolution, { status: 'SCORE_NOT_COMPUTABLE' }>;

/**
 * SC-2 crypto-consumer execution policy.
 *
 * Productive crypto consumers may execute scoring only after UAI construction and canonical
 * registry resolution. A registry descriptor that points at a different executor, requires a
 * result adapter, or does not emit the canonical result contract fails closed. This keeps model
 * selection in the registry without prematurely introducing the Phase-C single dispatcher.
 */
export function resolveCryptoScoreExecution(
  input: Readonly<CryptoScoreExecutionRequest>,
  registry: ScoringModelResolver = scoringModelRegistry,
): ScoringModelResolution {
  const asset = createUniversalAssetIdentity({
    symbol: input.symbol,
    name: input.name,
    subtype: input.subtype,
    assetClass: 'crypto',
    source: input.source ?? 'request',
  });
  const resolution = registry.resolve(asset);
  if (resolution.status !== 'RESOLVED') return resolution;

  const model = resolution.model;
  const executable = model.executorKey === VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY
    && model.evidencePolicy === 'verified-required'
    && model.resultContractVersion === CANONICAL_SCORE_RESULT_CONTRACT_VERSION
    && model.canonicalResultAdapterRequired === false;

  if (!executable) {
    return {
      status: 'SCORE_NOT_COMPUTABLE',
      asset,
      reason: `Resolved crypto model ${model.modelId}@${model.version} is not executable by the canonical crypto score adapter.`,
    };
  }

  return resolution;
}

/**
 * Keep registry-resolution failures inside the public CanonicalScoreResult envelope without
 * pretending that market evidence or a feature contract was evaluated. No scoring executor runs.
 */
export function buildCryptoRegistryResolutionFailure(
  resolution: Readonly<CryptoScoreResolutionFailure>,
): CanonicalScoreResult {
  return {
    status: 'SCORE_NOT_COMPUTABLE',
    score: null,
    final_score: null,
    integrity: {
      status: 'SCORE_NOT_COMPUTABLE',
      assetId: resolution.asset.assetId,
      providers: [],
      retrievedAt: new Date().toISOString(),
      dataQuality: 'unknown',
      featureVersion: 'model-registry-unresolved',
      scoringVersion: CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
      coverage: 0,
      evidence: [],
      missingFields: ['scoringModel'],
      reason: resolution.reason,
    },
  };
}

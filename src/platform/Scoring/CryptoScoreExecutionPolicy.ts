import { CANONICAL_SCORE_RESULT_CONTRACT_VERSION, type ScoringModelResolution } from './contracts';
import {
  ScoringModelRegistry,
  VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY,
  scoringModelRegistry,
} from './ScoringModelRegistry';
import { createUniversalAssetIdentity } from './UniversalAssetAdapter';

export interface CryptoScoreExecutionRequest {
  symbol: string;
  name?: string;
}

type ScoringModelResolver = Pick<ScoringModelRegistry, 'resolve'>;

/**
 * SC-2 Phase A first-consumer policy.
 *
 * The route may execute crypto scoring only after UAI construction and canonical registry
 * resolution. A registry descriptor that points at a different executor, requires a result
 * adapter, or does not emit the canonical result contract fails closed. This keeps model
 * selection in the registry without prematurely introducing the Phase-C single dispatcher.
 */
export function resolveCryptoScoreExecution(
  input: Readonly<CryptoScoreExecutionRequest>,
  registry: ScoringModelResolver = scoringModelRegistry,
): ScoringModelResolution {
  const asset = createUniversalAssetIdentity({
    symbol: input.symbol,
    name: input.name,
    assetClass: 'crypto',
    source: 'request',
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

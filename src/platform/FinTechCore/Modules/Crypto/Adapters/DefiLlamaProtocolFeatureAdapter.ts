import type {
  DefiLlamaFeesResult,
  DefiLlamaProtocolTvlResult,
} from '../../../../MarketData/providers/DefiLlamaProtocolProvider';
import type { CryptoFeatureEvidence } from '../CryptoCategoryFeatureContracts';

export const DEFILLAMA_PROTOCOL_FEATURE_ADAPTER_VERSION =
  'fintech-core.crypto/defillama-protocol-feature-adapter/0.1.0' as const;

/**
 * Pure adapter from ADR-0100 DeFiLlama protocol evidence into universal FinTech-Core
 * `protocol.*` feature evidence. Performs no network I/O and creates no score; it only maps
 * already-fetched, already-validated provider results onto the shared evidence contract so the
 * `defi` category-feature contract (`protocol.tvlUsd`/`protocol.feesUsd`/`protocol.revenueUsd`)
 * can be populated the same way every other provider's evidence is populated.
 *
 * Zero-interpolation: NOT_AVAILABLE/INVALID provider results stay null/NOT_AVAILABLE here too;
 * nothing is estimated, smoothed or filled in.
 */

function statusFor(status: DefiLlamaProtocolTvlResult['status']): CryptoFeatureEvidence['status'] {
  if (status === 'VERIFIED') return 'VERIFIED';
  if (status === 'STALE') return 'STALE';
  if (status === 'INVALID') return 'INVALID';
  return 'NOT_AVAILABLE';
}

export function adaptDefiLlamaProtocolTvlToFeatureEvidence(
  result: DefiLlamaProtocolTvlResult,
): CryptoFeatureEvidence {
  const status = statusFor(result.status);
  return Object.freeze({
    key: 'protocol.tvlUsd',
    status,
    value: status === 'VERIFIED' || status === 'STALE' ? result.tvlUsd : null,
    provider: result.evidenceId ? 'DeFiLlama' : null,
    evidenceRefs: Object.freeze(result.evidenceId ? [result.evidenceId] : []),
    observedAt: result.observedAt,
    retrievedAt: result.retrievedAt,
    degraded: result.cacheMode === 'last-known-good',
    reason: result.reason,
  });
}

export function adaptDefiLlamaFeesToFeatureEvidence(
  result: DefiLlamaFeesResult,
): readonly CryptoFeatureEvidence[] {
  const status = statusFor(result.status);
  const degraded = result.cacheMode === 'last-known-good';
  const evidenceRefs = Object.freeze(result.evidenceId ? [result.evidenceId] : []);
  const provider = result.evidenceId ? 'DeFiLlama' : null;

  const feesEvidence: CryptoFeatureEvidence = Object.freeze({
    key: 'protocol.feesUsd',
    status: result.feesUsd24h === null ? 'NOT_AVAILABLE' : status,
    value: result.feesUsd24h,
    provider,
    evidenceRefs,
    observedAt: result.observedAt,
    retrievedAt: result.retrievedAt,
    degraded,
    reason: result.feesUsd24h === null ? (result.reason ?? 'No finite DeFiLlama fee value.') : result.reason,
  });

  const revenueEvidence: CryptoFeatureEvidence = Object.freeze({
    key: 'protocol.revenueUsd',
    status: result.revenueUsd24h === null ? 'NOT_AVAILABLE' : status,
    value: result.revenueUsd24h,
    provider,
    evidenceRefs,
    observedAt: result.observedAt,
    retrievedAt: result.retrievedAt,
    degraded,
    reason: result.revenueUsd24h === null ? (result.reason ?? 'No finite DeFiLlama revenue value.') : result.reason,
  });

  return Object.freeze([feesEvidence, revenueEvidence]);
}

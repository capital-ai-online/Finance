import type { CanonicalScoreResult } from '../../types/scoringIntegrity';
import { createUniversalAssetIdentity } from '../Scoring/UniversalAssetAdapter';
import type { UniversalAssetClass, UniversalAssetSource } from '../Scoring/contracts';
import { rankCanonicalUniverse } from './CrossAssetRanking';
import type {
  CrossAssetRankingGovernance,
  CrossAssetRankingResult,
} from './contracts';

export const BACKEND_RANKING_PROJECTION_CONTRACT_VERSION =
  'backend-ranking-projection/1.0.0' as const;

export interface BackendRankingProjectionInput {
  symbol: string;
  name?: string;
  assetClass: UniversalAssetClass;
  subtype?: string;
  instrumentKind?: string;
  source?: UniversalAssetSource;
  canonical: CanonicalScoreResult;
  category?: string | null;
  tier?: 1 | 2 | 3 | null;
  governance: CrossAssetRankingGovernance;
}

export interface BackendRankingProjection {
  contractVersion: typeof BACKEND_RANKING_PROJECTION_CONTRACT_VERSION;
  authority: 'CrossAssetRanking';
  mode: 'overall';
  result: CrossAssetRankingResult;
}

/**
 * FIN-17 backend projection boundary.
 *
 * This adapter does not recalculate scores, create comparability evidence or merge incomparable
 * cohorts. It binds already-canonical score results to the existing CrossAssetRanking authority.
 */
export function buildBackendRankingProjection(
  items: readonly BackendRankingProjectionInput[],
): BackendRankingProjection {
  const candidates = items.map((item) => ({
    asset: createUniversalAssetIdentity({
      symbol: item.symbol,
      name: item.name,
      assetClass: item.assetClass,
      subtype: item.subtype,
      instrumentKind: item.instrumentKind,
      source: item.source ?? 'request',
    }),
    canonical: item.canonical,
    category: item.category,
    tier: item.tier,
    governance: item.governance,
  }));

  return {
    contractVersion: BACKEND_RANKING_PROJECTION_CONTRACT_VERSION,
    authority: 'CrossAssetRanking',
    mode: 'overall',
    result: rankCanonicalUniverse(candidates, 'overall'),
  };
}

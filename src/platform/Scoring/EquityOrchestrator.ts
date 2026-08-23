import type { UniversalAssetIdentity } from './contracts';
import {
  evaluateEquityResearchScore,
  type EquityResearchAssessment,
  type EquityResearchScoringInput,
} from './EquityResearchScoring';

export const EQUITY_ORCHESTRATOR_VERSION = 'equity-orchestrator/0.1.0' as const;

export interface EquityOrchestratorResearchResult {
  readonly orchestratorVersion: typeof EQUITY_ORCHESTRATOR_VERSION;
  readonly asset: UniversalAssetIdentity;
  readonly status: EquityResearchAssessment['status'];
  readonly assessment: EquityResearchAssessment;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly canonicalPromotionRequired: true;
}

/**
 * Equity domain orchestration boundary for the P0 challenger.
 *
 * This is deliberately NOT an asset router, public score endpoint or second dispatcher. The
 * productive authority remains ScoringDispatcher. Until an explicit Owner-approved promotion,
 * this function is research-only and cannot produce CanonicalScoreResult or ranking eligibility.
 */
export function orchestrateEquityResearch(
  asset: UniversalAssetIdentity,
  input: EquityResearchScoringInput,
): EquityOrchestratorResearchResult {
  if (asset.assetClass !== 'stock') {
    throw new Error(`EQUITY_ORCHESTRATOR_ASSET_CLASS_MISMATCH:${asset.assetId}`);
  }

  for (const family of Object.values(input.families)) {
    if (!family) continue;
    for (const evidence of family.evidence) {
      if (evidence.assetId !== asset.assetId) {
        throw new Error(`EQUITY_ORCHESTRATOR_EVIDENCE_IDENTITY_MISMATCH:${asset.assetId}:${evidence.assetId}`);
      }
    }
  }

  const assessment = evaluateEquityResearchScore(input);
  return Object.freeze({
    orchestratorVersion: EQUITY_ORCHESTRATOR_VERSION,
    asset,
    status: assessment.status,
    assessment,
    scoreEligible: false as const,
    executionEligible: false as const,
    canonicalPromotionRequired: true as const,
  });
}

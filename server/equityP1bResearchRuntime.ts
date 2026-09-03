import {
  buildEquityResearchFoundation,
  type EquityResearchRuntimeRequest,
  type EquityResearchRuntimeResult,
} from './equityResearchRuntime';
import {
  SecEdgarCompanyFactsAdapter,
  type SecEdgarCompanyFactsResult,
} from './secEdgarCompanyFacts';
import {
  bridgeSecCompanyFactsToEquityFilingEvidence,
  type EquitySecEvidenceBridgeResult,
} from './equitySecEvidenceBridge';
import {
  bridgeSecComparableEvidence,
  buildPriorComparableAsOf,
  type EquitySecComparableEvidenceResult,
} from './equitySecComparableEvidence';
import {
  augmentEquityResearchSnapshotWithFilingEvidence,
  type EquityFilingFeatureDiagnostics,
} from '../src/platform/Scoring/EquityFilingFeatureComposer';
import type { EquityResearchFeatureSnapshot } from '../src/platform/Scoring/EquityFeatureComposer';

export const EQUITY_P1B_RESEARCH_RUNTIME_VERSION = 'equity-pit-filing-research-runtime/0.2.0' as const;

export interface EquityP1bResearchRuntimeResult {
  readonly runtimeVersion: typeof EQUITY_P1B_RESEARCH_RUNTIME_VERSION;
  readonly symbol: string;
  readonly base: EquityResearchRuntimeResult;
  readonly currentSec: SecEdgarCompanyFactsResult;
  readonly currentFiling: EquitySecEvidenceBridgeResult;
  readonly priorSec: SecEdgarCompanyFactsResult | null;
  readonly priorFiling: EquitySecEvidenceBridgeResult | null;
  readonly comparable: EquitySecComparableEvidenceResult | null;
  readonly snapshot: EquityResearchFeatureSnapshot;
  readonly filingDiagnostics: EquityFilingFeatureDiagnostics;
  readonly canonical: false;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly publicRouteExposed: false;
  readonly authority: 'RESEARCH_ONLY_EXISTING_SCORING_AUTHORITY_UNCHANGED';
}

export interface EquityP1bResearchRuntimeDependencies {
  readonly buildBaseFoundation: (request: EquityResearchRuntimeRequest) => Promise<EquityResearchRuntimeResult>;
  readonly fetchSecEvidence: (input: { symbol: string; asOf?: string }) => Promise<SecEdgarCompanyFactsResult>;
}

const secAdapter = new SecEdgarCompanyFactsAdapter();
const DEFAULT_DEPENDENCIES: EquityP1bResearchRuntimeDependencies = Object.freeze({
  buildBaseFoundation: (request) => buildEquityResearchFoundation(request),
  fetchSecEvidence: (input) => secAdapter.fetchEvidence(input),
});

/**
 * P1-B orchestrates SEC PIT evidence entirely inside the existing research/evidence chain. It does
 * not register or execute a scoring model, expose a public route, persist filings or emit a
 * CanonicalScoreResult. Comparable history is acquired at the prior information-time boundary and
 * then subjected to period-end/duration gates before entering the feature snapshot.
 */
export async function buildEquityP1bResearchFoundation(
  request: EquityResearchRuntimeRequest,
  dependencies: EquityP1bResearchRuntimeDependencies = DEFAULT_DEPENDENCIES,
): Promise<EquityP1bResearchRuntimeResult> {
  const symbol = request.symbol.trim().toUpperCase();
  if (!symbol) throw new Error('EQUITY_P1B_SYMBOL_REQUIRED');

  const base = await dependencies.buildBaseFoundation({ ...request, symbol });
  const currentSec = await dependencies.fetchSecEvidence({ symbol, asOf: request.evaluatedAt });
  const currentFiling = bridgeSecCompanyFactsToEquityFilingEvidence(currentSec, base.snapshot.assetId);

  let priorSec: SecEdgarCompanyFactsResult | null = null;
  let priorFiling: EquitySecEvidenceBridgeResult | null = null;
  let comparable: EquitySecComparableEvidenceResult | null = null;
  const priorAnchor = buildPriorComparableAsOf(currentSec);

  if (priorAnchor) {
    priorSec = await dependencies.fetchSecEvidence({ symbol, asOf: priorAnchor.priorAsOf });
    priorFiling = bridgeSecCompanyFactsToEquityFilingEvidence(priorSec, base.snapshot.assetId);
    comparable = bridgeSecComparableEvidence({
      assetId: base.snapshot.assetId,
      currentSec,
      priorSec,
      currentBridge: currentFiling,
      priorBridge: priorFiling,
      targetPriorPeriodEnd: priorAnchor.targetPriorPeriodEnd,
      priorAsOf: priorAnchor.priorAsOf,
    });
  }

  const augmented = augmentEquityResearchSnapshotWithFilingEvidence({
    base: base.snapshot,
    filing: currentFiling.derived,
    comparable: comparable?.metrics,
  });

  return Object.freeze({
    runtimeVersion: EQUITY_P1B_RESEARCH_RUNTIME_VERSION,
    symbol,
    base,
    currentSec,
    currentFiling,
    priorSec,
    priorFiling,
    comparable,
    snapshot: augmented.snapshot,
    filingDiagnostics: augmented.diagnostics,
    canonical: false as const,
    scoreEligible: false as const,
    executionEligible: false as const,
    publicRouteExposed: false as const,
    authority: 'RESEARCH_ONLY_EXISTING_SCORING_AUTHORITY_UNCHANGED' as const,
  });
}

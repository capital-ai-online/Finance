import {
  ensureFundamentalsFresh,
  getCachedFundamentals,
  type StockFundamentals,
} from './stockFundamentals';
import {
  generateTraditionalAssetInputs,
  type TraditionalAssetScoringInputs,
} from '../src/services/traditionalAssetScoring';
import {
  composeEquityResearchFeatureSnapshot,
  type EquityResearchFeatureSnapshot,
} from '../src/platform/Scoring/EquityFeatureComposer';
import {
  createUnclassifiedEquityClassification,
  type EquityClassification,
} from '../src/platform/Scoring/EquityModelContracts';

export const EQUITY_RESEARCH_RUNTIME_VERSION = 'equity-research-runtime/0.1.0' as const;

export interface EquityResearchRuntimeRequest {
  readonly symbol: string;
  readonly classification?: EquityClassification;
  readonly evaluatedAt?: string;
}

export interface EquityResearchRuntimeResult {
  readonly runtimeVersion: typeof EQUITY_RESEARCH_RUNTIME_VERSION;
  readonly symbol: string;
  readonly snapshot: EquityResearchFeatureSnapshot;
  readonly canonical: false;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly publicRouteExposed: false;
  readonly authority: 'RESEARCH_ONLY_EXISTING_SCORING_AUTHORITY_UNCHANGED';
}

export interface EquityResearchRuntimeDependencies {
  readonly ensureFundamentalsFresh: (symbol: string) => Promise<void>;
  readonly getCachedFundamentals: (symbol: string) => StockFundamentals | undefined;
  readonly generateTraditionalAssetInputs: (
    symbol: string,
    assetType: 'stock',
    fundamentals?: StockFundamentals,
  ) => Promise<TraditionalAssetScoringInputs>;
}

const DEFAULT_DEPENDENCIES: EquityResearchRuntimeDependencies = Object.freeze({
  ensureFundamentalsFresh,
  getCachedFundamentals,
  generateTraditionalAssetInputs,
});

/**
 * Server-only P1-A binding. Provider I/O remains in the existing stock-fundamentals and Traditional
 * acquisition paths. The research snapshot uses the UAI-style stock identity `stock:SYMBOL`, exposes
 * no HTTP route, writes no persistence and emits no CanonicalScoreResult.
 */
export async function buildEquityResearchFoundation(
  request: EquityResearchRuntimeRequest,
  dependencies: EquityResearchRuntimeDependencies = DEFAULT_DEPENDENCIES,
): Promise<EquityResearchRuntimeResult> {
  const symbol = request.symbol.trim().toUpperCase();
  if (!symbol) throw new Error('EQUITY_RESEARCH_SYMBOL_REQUIRED');

  await dependencies.ensureFundamentalsFresh(symbol);
  const fundamentals = dependencies.getCachedFundamentals(symbol);
  const traditional = await dependencies.generateTraditionalAssetInputs(symbol, 'stock', fundamentals);

  const snapshot = composeEquityResearchFeatureSnapshot({
    assetId: `stock:${symbol}`,
    classification: request.classification ?? createUnclassifiedEquityClassification(),
    fundamentals: fundamentals ?? { provenance: [] },
    traditional,
    evaluatedAt: request.evaluatedAt,
  });

  return Object.freeze({
    runtimeVersion: EQUITY_RESEARCH_RUNTIME_VERSION,
    symbol,
    snapshot,
    canonical: false,
    scoreEligible: false,
    executionEligible: false,
    publicRouteExposed: false,
    authority: 'RESEARCH_ONLY_EXISTING_SCORING_AUTHORITY_UNCHANGED' as const,
  });
}

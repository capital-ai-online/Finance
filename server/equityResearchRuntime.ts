import { assetRegistry, type HistoryResult } from '../src/lib/assetRegistry';
import { createUniversalAssetIdentity } from '../src/platform/Scoring/UniversalAssetAdapter';
import {
  composeEquityResearchInput,
  type EquityFeatureCompositionResult,
  type EquityFundamentalSnapshot,
  type EquityHistorySnapshot,
} from '../src/platform/Scoring/EquityFeatureComposer';
import {
  orchestrateEquityResearch,
  type EquityOrchestratorResearchResult,
} from '../src/platform/Scoring/EquityOrchestrator';
import type { EquityClassification } from '../src/platform/Scoring/EquityModelContracts';
import {
  ensureFundamentalsFresh,
  getCachedFundamentals,
  type StockFundamentals,
} from './stockFundamentals';

export const EQUITY_RESEARCH_RUNTIME_VERSION = 'equity-research-runtime/0.1.0' as const;
export const EQUITY_RESEARCH_HISTORY_WINDOW_DAYS = 400 as const;

export interface EquityResearchRuntimeDependencies {
  readonly ensureFundamentalsFresh: (symbol: string) => Promise<void>;
  readonly getCachedFundamentals: (symbol: string) => StockFundamentals | undefined;
  readonly getHistory: (symbol: string, limit: number) => Promise<HistoryResult>;
  readonly now: () => string;
}

export interface EquityResearchRuntimeResult {
  readonly runtimeVersion: typeof EQUITY_RESEARCH_RUNTIME_VERSION;
  readonly symbol: string;
  readonly historySource: HistoryResult['source'];
  readonly composition: EquityFeatureCompositionResult;
  readonly orchestration: EquityOrchestratorResearchResult;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly publicRouteExposed: false;
}

const DEFAULT_DEPENDENCIES: EquityResearchRuntimeDependencies = Object.freeze({
  ensureFundamentalsFresh,
  getCachedFundamentals,
  getHistory: (symbol, limit) => assetRegistry.getHistory(symbol, limit),
  now: () => new Date().toISOString(),
});

function emptyFundamentals(): EquityFundamentalSnapshot {
  return Object.freeze({ provenance: Object.freeze([]) });
}

function historySnapshot(
  symbol: string,
  history: HistoryResult,
  retrievedAt: string,
): EquityHistorySnapshot | undefined {
  if (history.source !== 'live') return undefined;
  return Object.freeze({
    provider: 'Stooq' as const,
    sourcePath: `assetRegistry:stooq-history:${symbol}`,
    retrievedAt,
    points: Object.freeze(history.points.map((point) => Object.freeze({ ...point }))),
  });
}

/**
 * Research-only application adapter for the Equity challenger.
 *
 * Provider I/O stays outside `EquityFeatureComposer`, `EquityResearchScoring` and
 * `EquityOrchestrator`. This runtime reuses existing stock fundamentals/history paths and exposes no
 * HTTP route, persistence writer, ranking authority or CanonicalScoreResult. Simulated registry
 * history is explicitly rejected from the momentum family by omitting it from the composition.
 */
export async function runEquityResearchChallenger(
  input: {
    readonly symbol: string;
    readonly classification: EquityClassification;
  },
  dependencies: Readonly<EquityResearchRuntimeDependencies> = DEFAULT_DEPENDENCIES,
): Promise<EquityResearchRuntimeResult> {
  const symbol = input.symbol.toUpperCase().trim();
  await dependencies.ensureFundamentalsFresh(symbol);
  const fundamentals = dependencies.getCachedFundamentals(symbol) ?? emptyFundamentals();
  const history = await dependencies.getHistory(symbol, EQUITY_RESEARCH_HISTORY_WINDOW_DAYS);
  const evaluatedAt = dependencies.now();
  const asset = createUniversalAssetIdentity({
    symbol,
    assetClass: 'stock',
    source: 'request',
  });

  const composition = composeEquityResearchInput({
    assetId: asset.assetId,
    classification: input.classification,
    fundamentals,
    history: historySnapshot(symbol, history, evaluatedAt),
    evaluatedAt,
  });
  const orchestration = orchestrateEquityResearch(asset, composition.input);

  return Object.freeze({
    runtimeVersion: EQUITY_RESEARCH_RUNTIME_VERSION,
    symbol,
    historySource: history.source,
    composition,
    orchestration,
    scoreEligible: false as const,
    executionEligible: false as const,
    publicRouteExposed: false as const,
  });
}

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
  getVerifiedTraditionalFallbackHistory,
  type VerifiedTraditionalFallbackHistory,
} from '../src/services/traditionalHistoryFallback';
import {
  ensureFundamentalsFresh,
  getCachedFundamentals,
  type StockFundamentals,
} from './stockFundamentals';

export const EQUITY_RESEARCH_RUNTIME_VERSION = 'equity-research-runtime/0.1.0' as const;
export const EQUITY_RESEARCH_HISTORY_WINDOW_DAYS = 365 as const;

export interface EquityResearchRuntimeDependencies {
  readonly ensureFundamentalsFresh: (symbol: string) => Promise<void>;
  readonly getCachedFundamentals: (symbol: string) => StockFundamentals | undefined;
  readonly getVerifiedHistory: (
    symbol: string,
    assetClass: 'stock',
    days: number,
  ) => Promise<VerifiedTraditionalFallbackHistory | null>;
  readonly now: () => string;
}

export interface EquityResearchRuntimeResult {
  readonly runtimeVersion: typeof EQUITY_RESEARCH_RUNTIME_VERSION;
  readonly symbol: string;
  readonly historyProvider: VerifiedTraditionalFallbackHistory['provider'] | null;
  readonly composition: EquityFeatureCompositionResult;
  readonly orchestration: EquityOrchestratorResearchResult;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly publicRouteExposed: false;
}

const DEFAULT_DEPENDENCIES: EquityResearchRuntimeDependencies = Object.freeze({
  ensureFundamentalsFresh,
  getCachedFundamentals,
  getVerifiedHistory: (symbol, assetClass, days) => getVerifiedTraditionalFallbackHistory(symbol, assetClass, days),
  now: () => new Date().toISOString(),
});

function emptyFundamentals(): EquityFundamentalSnapshot {
  return Object.freeze({ provenance: Object.freeze([]) });
}

function historySnapshot(history: VerifiedTraditionalFallbackHistory | null): EquityHistorySnapshot | undefined {
  if (!history) return undefined;
  return Object.freeze({
    provider: history.provider,
    sourcePath: history.sourcePath,
    retrievedAt: history.retrievedAt,
    points: Object.freeze(history.points.map((point) => Object.freeze({
      date: point.date,
      close: point.close,
    }))),
  });
}

/**
 * Research-only application adapter for the Equity challenger.
 *
 * Provider I/O stays outside `EquityFeatureComposer`, `EquityResearchScoring` and
 * `EquityOrchestrator`. This runtime reuses the existing fundamentals and verified Traditional
 * history provider-routing paths and exposes no HTTP route, persistence writer, ranking authority or
 * CanonicalScoreResult. AssetRegistry `simulated` history is intentionally not a dependency here:
 * momentum can only enter through a provenance-aware TwelveData/EODHD history result.
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
  const history = await dependencies.getVerifiedHistory(symbol, 'stock', EQUITY_RESEARCH_HISTORY_WINDOW_DAYS);
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
    history: historySnapshot(history),
    evaluatedAt,
  });
  const orchestration = orchestrateEquityResearch(asset, composition.input);

  return Object.freeze({
    runtimeVersion: EQUITY_RESEARCH_RUNTIME_VERSION,
    symbol,
    historyProvider: history?.provider ?? null,
    composition,
    orchestration,
    scoreEligible: false as const,
    executionEligible: false as const,
    publicRouteExposed: false as const,
  });
}

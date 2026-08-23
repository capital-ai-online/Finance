import { createUniversalAssetIdentity } from '../src/platform/Scoring/UniversalAssetAdapter';
import {
  composeEquityResearchInput,
  type EquityFeatureCompositionResult,
  type EquityFundamentalSnapshot,
  type EquityHistorySnapshot,
} from '../src/platform/Scoring/EquityFeatureComposer';
import {
  augmentEquityResearchWithFilingEvidence,
  type EquityFilingFeatureCompositionResult,
} from '../src/platform/Scoring/EquityFilingFeatureComposer';
import {
  orchestrateEquityResearch,
  type EquityOrchestratorResearchResult,
} from '../src/platform/Scoring/EquityOrchestrator';
import type { EquityClassification, EquityFactorFamily } from '../src/platform/Scoring/EquityModelContracts';
import {
  getVerifiedTraditionalFallbackHistory,
  type VerifiedTraditionalFallbackHistory,
} from '../src/services/traditionalHistoryFallback';
import {
  ensureFundamentalsFresh,
  getCachedFundamentals,
  type StockFundamentals,
} from './stockFundamentals';
import {
  SecEdgarCompanyFactsAdapter,
  type SecEdgarCompanyFactsResult,
} from './secEdgarCompanyFacts';
import {
  bridgeSecCompanyFactsToEquityFilingEvidence,
  type EquitySecEvidenceBridgeResult,
} from './equitySecEvidenceBridge';

export const EQUITY_RESEARCH_RUNTIME_VERSION = 'equity-research-runtime/0.2.0' as const;
export const EQUITY_RESEARCH_HISTORY_WINDOW_DAYS = 365 as const;

const DEFAULT_SEC_ADAPTER = new SecEdgarCompanyFactsAdapter();

export interface EquityResearchRuntimeDependencies {
  readonly ensureFundamentalsFresh: (symbol: string) => Promise<void>;
  readonly getCachedFundamentals: (symbol: string) => StockFundamentals | undefined;
  readonly getVerifiedHistory: (
    symbol: string,
    assetClass: 'stock',
    days: number,
  ) => Promise<VerifiedTraditionalFallbackHistory | null>;
  /** Optional for deterministic tests; production default is the governed SEC CompanyFacts adapter. */
  readonly fetchSecEvidence?: (symbol: string, asOf: string) => Promise<SecEdgarCompanyFactsResult>;
  readonly now: () => string;
}

export interface EquityResearchRuntimeResult {
  readonly runtimeVersion: typeof EQUITY_RESEARCH_RUNTIME_VERSION;
  readonly symbol: string;
  readonly historyProvider: VerifiedTraditionalFallbackHistory['provider'] | null;
  readonly secStatus: SecEdgarCompanyFactsResult['status'] | 'NOT_REQUESTED';
  readonly secCik: string | null;
  readonly composition: EquityFeatureCompositionResult;
  readonly secBridge: EquitySecEvidenceBridgeResult | null;
  readonly filingComposition: EquityFilingFeatureCompositionResult | null;
  readonly orchestration: EquityOrchestratorResearchResult;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly publicRouteExposed: false;
}

const DEFAULT_DEPENDENCIES: EquityResearchRuntimeDependencies = Object.freeze({
  ensureFundamentalsFresh,
  getCachedFundamentals,
  getVerifiedHistory: (symbol, assetClass, days) => getVerifiedTraditionalFallbackHistory(symbol, assetClass, days),
  fetchSecEvidence: (symbol, asOf) => DEFAULT_SEC_ADAPTER.fetchEvidence({ symbol, asOf }),
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
 * `EquityOrchestrator`. The runtime reuses the existing AlphaVantage/FMP fundamentals path,
 * provenance-aware TwelveData/EODHD history routing and the governed SEC CompanyFacts evidence
 * adapter. Filing evidence is converted into provider-neutral contracts before feature composition.
 *
 * No HTTP route, persistence writer, ranking authority, CanonicalScoreResult or productive model
 * promotion is created here. AssetRegistry simulated history is not a dependency.
 */
export async function runEquityResearchChallenger(
  input: {
    readonly symbol: string;
    readonly classification: EquityClassification;
  },
  dependencies: Readonly<EquityResearchRuntimeDependencies> = DEFAULT_DEPENDENCIES,
): Promise<EquityResearchRuntimeResult> {
  const symbol = input.symbol.toUpperCase().trim();
  const evaluatedAt = dependencies.now();

  const historyPromise = dependencies.getVerifiedHistory(symbol, 'stock', EQUITY_RESEARCH_HISTORY_WINDOW_DAYS);
  const secPromise = dependencies.fetchSecEvidence
    ? dependencies.fetchSecEvidence(symbol, evaluatedAt)
    : Promise.resolve<SecEdgarCompanyFactsResult | null>(null);

  await dependencies.ensureFundamentalsFresh(symbol);
  const [history, secEvidence] = await Promise.all([historyPromise, secPromise]);
  const fundamentals = dependencies.getCachedFundamentals(symbol) ?? emptyFundamentals();
  const asset = createUniversalAssetIdentity({
    symbol,
    assetClass: 'stock',
    source: 'request',
  });

  const baseComposition = composeEquityResearchInput({
    assetId: asset.assetId,
    classification: input.classification,
    fundamentals,
    history: historySnapshot(history),
    evaluatedAt,
  });

  const secBridge = secEvidence
    ? bridgeSecCompanyFactsToEquityFilingEvidence(secEvidence, asset.assetId)
    : null;
  const filingComposition = secBridge
    ? augmentEquityResearchWithFilingEvidence({
      base: baseComposition,
      snapshot: secBridge.snapshot,
      derived: secBridge.derived,
    })
    : null;

  const composition: EquityFeatureCompositionResult = filingComposition
    ? Object.freeze({
      input: filingComposition.input,
      diagnostics: Object.freeze({
        ...baseComposition.diagnostics,
        composedFamilies: Object.freeze(Object.keys(filingComposition.input.families) as EquityFactorFamily[]),
        warnings: Object.freeze([
          ...baseComposition.diagnostics.warnings,
          ...filingComposition.diagnostics.warnings,
        ]),
      }),
    })
    : baseComposition;
  const orchestration = orchestrateEquityResearch(asset, composition.input);

  return Object.freeze({
    runtimeVersion: EQUITY_RESEARCH_RUNTIME_VERSION,
    symbol,
    historyProvider: history?.provider ?? null,
    secStatus: secEvidence?.status ?? 'NOT_REQUESTED',
    secCik: secEvidence?.cik ?? null,
    composition,
    secBridge,
    filingComposition,
    orchestration,
    scoreEligible: false as const,
    executionEligible: false as const,
    publicRouteExposed: false as const,
  });
}

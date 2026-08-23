import { createUniversalAssetIdentity } from '../src/platform/Scoring/UniversalAssetAdapter';
import {
  composeEquityResearchInput,
  type EquityFeatureCompositionResult,
  type EquityFundamentalSnapshot,
  type EquityHistorySnapshot,
} from '../src/platform/Scoring/EquityFeatureComposer';
import {
  augmentEquityResearchWithVendorDerivedFeatures,
  type EquityVendorDerivedFeatureResult,
} from '../src/platform/Scoring/EquityVendorDerivedFeatureComposer';
import {
  augmentEquityResearchWithFilingEvidence,
  type EquityFilingFeatureCompositionResult,
} from '../src/platform/Scoring/EquityFilingFeatureComposer';
import {
  augmentEquityResearchWithComparableFilings,
  type EquityComparableFilingFeatureResult,
} from '../src/platform/Scoring/EquityComparableFilingFeatureComposer';
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
import {
  bridgeSecComparableEvidence,
  buildPriorComparableAsOf,
  type EquitySecComparableEvidenceResult,
} from './equitySecComparableEvidence';

export const EQUITY_RESEARCH_RUNTIME_VERSION = 'equity-research-runtime/0.4.0' as const;
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
  /** Optional for deterministic tests; production default is the governed cached SEC CompanyFacts adapter. */
  readonly fetchSecEvidence?: (symbol: string, asOf: string) => Promise<SecEdgarCompanyFactsResult>;
  readonly now: () => string;
}

export interface EquityResearchRuntimeResult {
  readonly runtimeVersion: typeof EQUITY_RESEARCH_RUNTIME_VERSION;
  readonly symbol: string;
  readonly historyProvider: VerifiedTraditionalFallbackHistory['provider'] | null;
  readonly secStatus: SecEdgarCompanyFactsResult['status'] | 'NOT_REQUESTED';
  readonly secCik: string | null;
  readonly priorSecStatus: SecEdgarCompanyFactsResult['status'] | 'NOT_REQUESTED';
  readonly priorSecAsOf: string | null;
  readonly composition: EquityFeatureCompositionResult;
  readonly vendorDerivedComposition: EquityVendorDerivedFeatureResult;
  readonly secBridge: EquitySecEvidenceBridgeResult | null;
  readonly priorSecBridge: EquitySecEvidenceBridgeResult | null;
  readonly filingComposition: EquityFilingFeatureCompositionResult | null;
  readonly comparableEvidence: EquitySecComparableEvidenceResult | null;
  readonly comparableComposition: EquityComparableFilingFeatureResult | null;
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

function composeDiagnostics(
  base: EquityFeatureCompositionResult,
  families: EquityResearchRuntimeResult['composition']['input']['families'],
  warnings: readonly string[],
): EquityFeatureCompositionResult['diagnostics'] {
  return Object.freeze({
    ...base.diagnostics,
    composedFamilies: Object.freeze(Object.keys(families) as EquityFactorFamily[]),
    warnings: Object.freeze([...base.diagnostics.warnings, ...warnings]),
  });
}

/**
 * Research-only application adapter for the Equity challenger.
 *
 * Provider I/O stays outside `EquityFeatureComposer`, `EquityResearchScoring` and
 * `EquityOrchestrator`. The runtime reuses existing AlphaVantage/FMP fundamentals, provenance-aware
 * TwelveData/EODHD history and one governed cached SEC CompanyFacts adapter. TTM FCF conversion and
 * FCF yield are composed only from already verified fundamentals/history and remain inside the
 * existing Quality/Valuation families. A second historical `fetchEvidence(asOf=...)` call reuses the
 * same SEC adapter/cache and therefore does not create a second SEC provider authority or endpoint.
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
  const currentSecPromise = dependencies.fetchSecEvidence
    ? dependencies.fetchSecEvidence(symbol, evaluatedAt)
    : Promise.resolve<SecEdgarCompanyFactsResult | null>(null);

  await dependencies.ensureFundamentalsFresh(symbol);
  const [history, secEvidence] = await Promise.all([historyPromise, currentSecPromise]);
  const fundamentals = dependencies.getCachedFundamentals(symbol) ?? emptyFundamentals();
  const asset = createUniversalAssetIdentity({ symbol, assetClass: 'stock', source: 'request' });
  const normalizedHistory = historySnapshot(history);

  const baseComposition = composeEquityResearchInput({
    assetId: asset.assetId,
    classification: input.classification,
    fundamentals,
    history: normalizedHistory,
    evaluatedAt,
  });

  const vendorDerivedComposition = augmentEquityResearchWithVendorDerivedFeatures({
    base: baseComposition,
    assetId: asset.assetId,
    fundamentals,
    history: normalizedHistory,
    evaluatedAt,
  });
  const vendorBaseComposition: EquityFeatureCompositionResult = Object.freeze({
    input: vendorDerivedComposition.input,
    diagnostics: composeDiagnostics(
      baseComposition,
      vendorDerivedComposition.input.families,
      vendorDerivedComposition.diagnostics.warnings,
    ),
  });

  const secBridge = secEvidence
    ? bridgeSecCompanyFactsToEquityFilingEvidence(secEvidence, asset.assetId)
    : null;
  const filingComposition = secBridge
    ? augmentEquityResearchWithFilingEvidence({
      base: vendorBaseComposition,
      snapshot: secBridge.snapshot,
      derived: secBridge.derived,
    })
    : null;

  const priorSpec = secEvidence && dependencies.fetchSecEvidence
    ? buildPriorComparableAsOf(secEvidence)
    : null;
  const priorSecEvidence = priorSpec && dependencies.fetchSecEvidence
    ? await dependencies.fetchSecEvidence(symbol, priorSpec.priorAsOf)
    : null;
  const priorSecBridge = priorSecEvidence
    ? bridgeSecCompanyFactsToEquityFilingEvidence(priorSecEvidence, asset.assetId)
    : null;

  const comparableEvidence = secEvidence && secBridge && priorSecEvidence && priorSecBridge && priorSpec
    ? bridgeSecComparableEvidence({
      assetId: asset.assetId,
      currentSec: secEvidence,
      priorSec: priorSecEvidence,
      currentBridge: secBridge,
      priorBridge: priorSecBridge,
      targetPriorPeriodEnd: priorSpec.targetPriorPeriodEnd,
      priorAsOf: priorSpec.priorAsOf,
    })
    : null;

  const comparableComposition = filingComposition && comparableEvidence && secBridge
    ? augmentEquityResearchWithComparableFilings({
      base: filingComposition,
      comparable: comparableEvidence.metrics,
      currentFiling: secBridge.snapshot,
      currentDerived: secBridge.derived,
    })
    : null;

  const finalInput = comparableComposition?.input
    ?? filingComposition?.input
    ?? vendorBaseComposition.input;
  const additionalWarnings = [
    ...(filingComposition?.diagnostics.warnings ?? []),
    ...(comparableComposition?.diagnostics.warnings ?? []),
  ];
  const composition: EquityFeatureCompositionResult = Object.freeze({
    input: finalInput,
    diagnostics: composeDiagnostics(vendorBaseComposition, finalInput.families, additionalWarnings),
  });
  const orchestration = orchestrateEquityResearch(asset, composition.input);

  return Object.freeze({
    runtimeVersion: EQUITY_RESEARCH_RUNTIME_VERSION,
    symbol,
    historyProvider: history?.provider ?? null,
    secStatus: secEvidence?.status ?? 'NOT_REQUESTED',
    secCik: secEvidence?.cik ?? null,
    priorSecStatus: priorSecEvidence?.status ?? 'NOT_REQUESTED',
    priorSecAsOf: priorSpec?.priorAsOf ?? null,
    composition,
    vendorDerivedComposition,
    secBridge,
    priorSecBridge,
    filingComposition,
    comparableEvidence,
    comparableComposition,
    orchestration,
    scoreEligible: false as const,
    executionEligible: false as const,
    publicRouteExposed: false as const,
  });
}

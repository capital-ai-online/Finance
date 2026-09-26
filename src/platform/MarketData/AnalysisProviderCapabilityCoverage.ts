import {
  ANALYSIS_CONNECTION_CONTRACTS,
} from '../Scoring/AnalysisConnectionRegistry';
import type {
  MarketDataAssetClass,
  ProviderCapability,
} from './contracts';
import {
  PROVIDER_MATRIX,
  providerCapabilityGatewayStatus,
  providerSupportsCapability,
  type ProviderGatewayStatus,
} from './ProviderMatrix';

export type AnalysisProviderRequirementMode =
  | 'CANONICAL_INPUT'
  | 'EVIDENCE_INPUT'
  | 'OPTIONAL_CONTEXT';

export interface AnalysisProviderCapabilityRequirement {
  readonly capability: ProviderCapability;
  readonly assetClass: MarketDataAssetClass;
  readonly mode: AnalysisProviderRequirementMode;
  readonly purpose: string;
}

export type ProviderRequirementCoverageState =
  | 'CANONICAL_GATEWAY'
  | 'SHADOW_ONLY'
  | 'COMPATIBILITY'
  | 'EVIDENCE_ONLY'
  | 'CANDIDATE_ONLY'
  | 'UNMAPPED';

export interface AnalysisProviderRequirementCoverage {
  readonly requirement: AnalysisProviderCapabilityRequirement;
  readonly state: ProviderRequirementCoverageState;
  readonly providerIds: readonly string[];
  readonly routes: readonly ProviderGatewayStatus[];
  readonly accepted: boolean;
}

export type AnalysisProviderContractCoverageState =
  | 'FULL_CANONICAL'
  | 'EVIDENCE_ACCEPTED'
  | 'PARTIAL'
  | 'NOT_APPLICABLE';

export interface AnalysisProviderContractCoverage {
  readonly contractId: string;
  readonly state: AnalysisProviderContractCoverageState;
  readonly requirements: readonly AnalysisProviderRequirementCoverage[];
}

const requirement = (
  capability: ProviderCapability,
  assetClass: MarketDataAssetClass,
  mode: AnalysisProviderRequirementMode,
  purpose: string,
): AnalysisProviderCapabilityRequirement => Object.freeze({
  capability,
  assetClass,
  mode,
  purpose,
});

const canonical = (
  capability: ProviderCapability,
  assetClass: MarketDataAssetClass,
  purpose: string,
) => requirement(capability, assetClass, 'CANONICAL_INPUT', purpose);

const evidence = (
  capability: ProviderCapability,
  assetClass: MarketDataAssetClass,
  purpose: string,
) => requirement(capability, assetClass, 'EVIDENCE_INPUT', purpose);

const optional = (
  capability: ProviderCapability,
  assetClass: MarketDataAssetClass,
  purpose: string,
) => requirement(capability, assetClass, 'OPTIONAL_CONTEXT', purpose);

/**
 * FIN-19 non-authorizing requirement projection.
 *
 * This map never selects a provider. It declares the provider-capability needs of each
 * AnalysisConnectionRegistry contract and resolves coverage only through PROVIDER_MATRIX.
 * Runtime provider selection remains with the existing gateway/evidence adapters.
 */
export const ANALYSIS_PROVIDER_CAPABILITY_REQUIREMENTS: Readonly<
  Record<string, readonly AnalysisProviderCapabilityRequirement[]>
> = Object.freeze({
  'crypto-technical-provenance': [
    canonical('snapshot', 'crypto', 'Verified current market snapshot.'),
    canonical('history', 'crypto', 'Verified price history for technical factors.'),
  ],
  'traditional-scoring-stock': [
    canonical('quote', 'stock', 'Verified stock quote.'),
    canonical('history', 'stock', 'Verified stock history for trend/momentum/breakout/volatility.'),
    evidence('fundamentals', 'stock', 'Provenance-backed value/dividend/quality factors when available.'),
  ],
  'traditional-scoring-fx-index': [
    canonical('quote', 'forex', 'Verified FX quote.'),
    canonical('history', 'forex', 'Verified FX history.'),
    canonical('quote', 'index', 'Verified index quote.'),
    canonical('history', 'index', 'Verified index history.'),
  ],
  'commodity-market-evidence': [
    canonical('history', 'commodity', 'Verified commodity benchmark history.'),
  ],
  'sovereign-benchmark-yield': [
    evidence('history', 'bond', 'Explicit sovereign benchmark-yield history evidence.'),
    optional('macro-series', 'bond', 'Macro/rate context for interpretation, never execution pricing.'),
  ],
  'crypto-meme-integrity': [
    evidence('snapshot', 'crypto', 'Token market-structure snapshot evidence.'),
    evidence('onchain', 'crypto', 'On-chain/token-address evidence.'),
    evidence('security', 'crypto', 'Contract/rug/security evidence.'),
    optional('news', 'crypto', 'Narrative/news context.'),
    optional('orderbook', 'crypto', 'Liquidity/slippage context.'),
  ],
  'crypto-defi-fundamental': [
    evidence('fundamentals', 'crypto', 'Protocol fundamentals/utilization evidence.'),
    evidence('onchain', 'crypto', 'Protocol/on-chain evidence.'),
    optional('security', 'crypto', 'Contract/oracle security evidence.'),
  ],
  'commodity-energy-hybrid': [
    evidence('history', 'commodity', 'Energy benchmark market history.'),
    evidence('fundamentals', 'commodity', 'Energy supply/demand evidence.'),
    optional('derivatives', 'commodity', 'Positioning/futures context.'),
  ],
  'commodity-industrial-metals-hybrid': [
    evidence('history', 'commodity', 'Industrial-metal market history.'),
    evidence('fundamentals', 'commodity', 'Physical supply/criticality evidence.'),
  ],
  'commodity-precious-metals-hybrid': [
    evidence('history', 'commodity', 'Precious-metal market history.'),
    optional('macro-series', 'macro', 'Rates/macro context.'),
    optional('news', 'commodity', 'Narrative/geopolitical context.'),
  ],
  'commodity-agriculture-hybrid': [
    evidence('history', 'commodity', 'Agriculture benchmark history.'),
    evidence('fundamentals', 'commodity', 'Point-in-time agriculture supply/demand evidence.'),
    optional('derivatives', 'commodity', 'COT/futures positioning context.'),
  ],
  'legacy-market-sentiment-widget': [
    evidence('news', 'crypto', 'Crypto news/provenance evidence.'),
    evidence('news', 'stock', 'Stock news/provenance evidence.'),
    evidence('news', 'forex', 'FX news/provenance evidence.'),
    evidence('news', 'index', 'Index news/provenance evidence.'),
    evidence('news', 'commodity', 'Commodity news/provenance evidence.'),
  ],
  'legacy-sentiment-dashboard': [
    evidence('news', 'crypto', 'Observed crypto news evidence.'),
    evidence('news', 'stock', 'Observed stock news evidence.'),
    evidence('news', 'forex', 'Observed FX news evidence.'),
    evidence('news', 'commodity', 'Observed commodity news evidence.'),
  ],
  'market-sentiment-evidence': [
    evidence('news', 'crypto', 'Attested crypto news features.'),
    evidence('news', 'stock', 'Attested stock news features.'),
    evidence('news', 'forex', 'Attested FX news features.'),
    evidence('news', 'index', 'Attested index news features.'),
    evidence('news', 'commodity', 'Attested commodity news features.'),
  ],
  'macro-risk-regime': [
    evidence('macro-series', 'macro', 'Allow-listed yield/rate observations.'),
  ],
  'cross-asset-ranking': [],
  'deterministic-portfolio-allocation': [],
  'individual-bond-scoring-draft': [
    evidence('history', 'bond', 'Bond/yield history research evidence.'),
    optional('macro-series', 'bond', 'Rate-regime context for the draft model.'),
  ],
  'altcoin-pattern-research': [
    evidence('bars', 'crypto', 'OHLC bars for deterministic pattern research.'),
  ],
  'market-screener-projection': [
    canonical('quote', 'crypto', 'Verified crypto quote projection.'),
    canonical('quote', 'stock', 'Verified stock quote projection.'),
    canonical('quote', 'forex', 'Verified FX quote projection.'),
    canonical('quote', 'index', 'Verified index quote projection.'),
    canonical('quote', 'commodity', 'Verified commodity quote projection when shown as current market data.'),
  ],
  'crypto-momentum-research': [
    evidence('history', 'crypto', 'Return/trend history.'),
    optional('derivatives', 'crypto', 'Funding/open-interest context.'),
  ],
  'crypto-regime-research': [
    evidence('history', 'crypto', 'Momentum/volatility market history.'),
    optional('derivatives', 'crypto', 'Funding/open-interest/liquidity regime context.'),
    optional('news', 'crypto', 'Sentiment context.'),
  ],
  'crypto-pattern-confluence-research': [
    evidence('bars', 'crypto', 'Multi-timeframe OHLC evidence.'),
  ],
  'crypto-signal-fusion-research': [
    evidence('history', 'crypto', 'Momentum/regime source evidence.'),
    optional('derivatives', 'crypto', 'Execution-quality context.'),
    optional('news', 'crypto', 'Sentiment source evidence.'),
  ],
  'crypto-kill-switch-research': [],
  'buffett-value-check': [
    canonical('quote', 'stock', 'Verified market price for margin-of-safety comparison.'),
    evidence('fundamentals', 'stock', 'EPS/cash-flow/value-factor provenance.'),
  ],
  'monte-carlo-risk-engine': [
    evidence('quote', 'stock', 'Scenario starting-price evidence for stock selections.'),
    evidence('quote', 'crypto', 'Scenario starting-price evidence for crypto selections.'),
    evidence('quote', 'forex', 'Scenario starting-price evidence for FX selections.'),
  ],
  'quant-backtest-engine': [
    canonical('history', 'crypto', 'Verified crypto backtest history.'),
    canonical('history', 'stock', 'Verified stock backtest history.'),
    canonical('history', 'forex', 'Verified FX backtest history.'),
    canonical('history', 'commodity', 'Verified commodity backtest history.'),
  ],
  'portfolio-backtester': [
    canonical('history', 'crypto', 'Verified crypto portfolio history.'),
    canonical('history', 'stock', 'Verified stock portfolio history.'),
    canonical('history', 'forex', 'Verified FX portfolio history.'),
    canonical('history', 'commodity', 'Verified commodity portfolio history.'),
  ],
  'portfolio-performance-legacy': [
    canonical('history', 'crypto', 'Verified NAV component history.'),
    canonical('history', 'stock', 'Verified NAV component history.'),
  ],
  'legacy-screener': [
    canonical('quote', 'crypto', 'Verified quote input.'),
    canonical('quote', 'stock', 'Verified quote input.'),
    canonical('quote', 'forex', 'Verified quote input.'),
    canonical('quote', 'index', 'Verified quote input.'),
  ],
  'charts-technical-analysis-legacy': [
    canonical('history', 'crypto', 'Verified chart history.'),
    canonical('history', 'stock', 'Verified chart history.'),
    canonical('history', 'forex', 'Verified chart history.'),
    canonical('history', 'index', 'Verified chart history.'),
    canonical('history', 'commodity', 'Verified chart history.'),
  ],
  'heatmap-creator-legacy': [
    evidence('quote', 'crypto', 'Observed crypto market evidence.'),
    evidence('quote', 'stock', 'Observed stock market evidence.'),
    evidence('quote', 'forex', 'Observed FX market evidence.'),
    optional('news', 'crypto', 'News context for heatmap narratives.'),
  ],
  'realtime-risk-assessment-disabled': [],
  'favorite-asset-pattern-slots': [
    evidence('bars', 'crypto', 'Live 1h/4h OHLC pattern evidence.'),
  ],
  'asset-universe-sandbox-legacy': [],
  'enterprise-scorer-workbench': [],
  'raw-materials-dashboard': [
    evidence('history', 'commodity', 'Canonical commodity market-evidence history.'),
    optional('fundamentals', 'commodity', 'Separated commodity research evidence.'),
  ],
});

function routeRank(status: ProviderGatewayStatus): number {
  switch (status) {
    case 'behind_gateway':
    case 'history_gateway_only':
    case 'consensus_only':
      return 0;
    case 'shadow_only':
      return 1;
    case 'legacy_off_gateway':
      return 2;
    case 'not_wired':
      return 3;
  }
}

function coverageState(
  matches: readonly { enabled: boolean; route: ProviderGatewayStatus }[],
): ProviderRequirementCoverageState {
  const enabled = matches.filter(match => match.enabled);
  if (enabled.some(match => routeRank(match.route) === 0)) return 'CANONICAL_GATEWAY';
  if (enabled.some(match => match.route === 'shadow_only')) return 'SHADOW_ONLY';
  if (enabled.some(match => match.route === 'legacy_off_gateway')) return 'COMPATIBILITY';
  if (enabled.some(match => match.route === 'not_wired')) return 'EVIDENCE_ONLY';
  if (matches.length > 0) return 'CANDIDATE_ONLY';
  return 'UNMAPPED';
}

function accepted(
  mode: AnalysisProviderRequirementMode,
  state: ProviderRequirementCoverageState,
): boolean {
  if (mode === 'OPTIONAL_CONTEXT') return true;
  if (mode === 'CANONICAL_INPUT') return state === 'CANONICAL_GATEWAY';
  return ['CANONICAL_GATEWAY', 'SHADOW_ONLY', 'COMPATIBILITY', 'EVIDENCE_ONLY'].includes(state);
}

export function evaluateAnalysisProviderRequirement(
  requirementInput: AnalysisProviderCapabilityRequirement,
): AnalysisProviderRequirementCoverage {
  const matches = PROVIDER_MATRIX
    .filter(entry => providerSupportsCapability(entry, requirementInput.capability, requirementInput.assetClass))
    .map(entry => ({
      id: entry.id,
      enabled: entry.enabled,
      route: providerCapabilityGatewayStatus(entry, requirementInput.capability, requirementInput.assetClass),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const state = coverageState(matches);
  return Object.freeze({
    requirement: requirementInput,
    state,
    providerIds: Object.freeze(matches.map(match => match.id)),
    routes: Object.freeze([...new Set(matches.map(match => match.route))]),
    accepted: accepted(requirementInput.mode, state),
  });
}

export function evaluateAnalysisProviderContract(
  contractId: string,
): AnalysisProviderContractCoverage {
  const requirements = ANALYSIS_PROVIDER_CAPABILITY_REQUIREMENTS[contractId];
  if (!requirements) {
    return Object.freeze({
      contractId,
      state: 'PARTIAL' as const,
      requirements: Object.freeze([]),
    });
  }
  if (requirements.length === 0) {
    return Object.freeze({
      contractId,
      state: 'NOT_APPLICABLE' as const,
      requirements: Object.freeze([]),
    });
  }

  const coverage = requirements.map(evaluateAnalysisProviderRequirement);
  const required = coverage.filter(item => item.requirement.mode !== 'OPTIONAL_CONTEXT');
  const allAccepted = required.every(item => item.accepted);
  const allCanonical = required.length > 0 && required.every(item => item.state === 'CANONICAL_GATEWAY');

  return Object.freeze({
    contractId,
    state: allCanonical
      ? 'FULL_CANONICAL' as const
      : allAccepted
        ? 'EVIDENCE_ACCEPTED' as const
        : 'PARTIAL' as const,
    requirements: Object.freeze(coverage),
  });
}

export function evaluateAllAnalysisProviderContracts(): readonly AnalysisProviderContractCoverage[] {
  return Object.freeze(
    ANALYSIS_CONNECTION_CONTRACTS.map(contract => evaluateAnalysisProviderContract(contract.id)),
  );
}

export function validateAnalysisProviderRequirementCoverage(): readonly string[] {
  const errors: string[] = [];
  const contractIds = new Set(ANALYSIS_CONNECTION_CONTRACTS.map(contract => contract.id));
  const requirementIds = new Set(Object.keys(ANALYSIS_PROVIDER_CAPABILITY_REQUIREMENTS));

  for (const id of contractIds) {
    if (!requirementIds.has(id)) errors.push('missing-provider-requirement-contract:' + id);
  }
  for (const id of requirementIds) {
    if (!contractIds.has(id)) errors.push('orphan-provider-requirement-contract:' + id);
  }

  return Object.freeze(errors.sort());
}

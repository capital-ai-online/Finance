export const EQUITY_RESEARCH_MODEL_ID = 'equity-multifactor' as const;
export const EQUITY_RESEARCH_MODEL_VERSION = '0.2.0' as const;
export const EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION = 'equity-multifactor-features/0.2.0' as const;
export const EQUITY_CLASSIFICATION_CONTRACT_VERSION = 'equity-classification/0.1.0' as const;
export const EQUITY_NON_EXECUTABLE_WEIGHTS_VERSION = 'equity-research-non-executable-weights/0.2.0' as const;

export const EQUITY_FACTOR_FAMILIES = [
  'quality',
  'valuation',
  'growth',
  'momentum',
  'financialStrength',
  'capitalAllocation',
] as const;

export type EquityFactorFamily = typeof EQUITY_FACTOR_FAMILIES[number];
export type EquitySizeBucket = 'mega' | 'large' | 'mid' | 'small' | 'micro' | 'unknown';
export type EquityStyleTag = 'quality' | 'growth' | 'value' | 'momentum' | 'income' | 'cyclical' | 'turnaround';
export type EquityPrimaryProfile =
  | 'compounder'
  | 'quality-growth'
  | 'value'
  | 'cyclical-value'
  | 'momentum'
  | 'income'
  | 'turnaround-special-situation'
  | 'financial'
  | 'platform-software'
  | 'semiconductor-ai-infrastructure'
  | 'healthcare-innovator'
  | 'energy-commodity-producer'
  | 'unclassified';

export interface EquityIndustryClassification {
  readonly scheme: 'provider' | 'internal' | 'gics';
  readonly sector?: string;
  readonly industry?: string;
  readonly code?: string;
  readonly taxonomyVersion?: string;
  readonly source: string;
}

export interface EquityClassification {
  readonly contractVersion: typeof EQUITY_CLASSIFICATION_CONTRACT_VERSION;
  readonly industry: EquityIndustryClassification;
  readonly sizeBucket: EquitySizeBucket;
  readonly styleTags: readonly EquityStyleTag[];
  readonly primaryProfile: EquityPrimaryProfile;
  readonly classificationSource: 'verified-provider' | 'governed-rule' | 'unclassified';
  readonly observedAt?: string;
}

export type EquityFeatureDirection = 'higher-is-better' | 'lower-is-better' | 'context-only';
export type EquityFeaturePhase = 'P1A' | 'P1B';

export interface EquityResearchFeatureBinding {
  readonly key: string;
  readonly family: EquityFactorFamily;
  readonly correlationGroup: string;
  readonly sourceFields: readonly string[];
  readonly unit: string;
  readonly direction: EquityFeatureDirection;
  readonly phase: EquityFeaturePhase;
}

const binding = (
  key: string,
  family: EquityFactorFamily,
  correlationGroup: string,
  sourceFields: readonly string[],
  unit: string,
  direction: EquityFeatureDirection,
  phase: EquityFeaturePhase,
): EquityResearchFeatureBinding => Object.freeze({
  key,
  family,
  correlationGroup,
  sourceFields: Object.freeze([...sourceFields]),
  unit,
  direction,
  phase,
});

/**
 * P1-A/P1-B feature inventory. This contract authorizes evidence lineage only: no feature or family
 * receives an executable weight. SEC filing observations supersede economically equivalent vendor
 * proxies inside the same correlation group instead of being added as independent score components.
 */
export const EQUITY_RESEARCH_FEATURE_BINDINGS: readonly EquityResearchFeatureBinding[] = Object.freeze([
  binding('quality.profitMarginPct', 'quality', 'equity-profitability', ['profitMarginPct'], 'percent', 'higher-is-better', 'P1A'),
  binding('quality.freeCashFlowConversion', 'quality', 'equity-profitability', ['freeCashFlowPerShare', 'epsTtm'], 'ratio', 'higher-is-better', 'P1A'),
  binding('valuation.peRatio', 'valuation', 'equity-valuation', ['peRatio'], 'ratio', 'lower-is-better', 'P1A'),
  binding('momentum.trend', 'momentum', 'equity-price-path', ['trend'], 'normalized-0-1', 'higher-is-better', 'P1A'),
  binding('momentum.momentum', 'momentum', 'equity-price-path', ['momentum'], 'normalized-0-1', 'higher-is-better', 'P1A'),
  binding('momentum.breakoutQuality', 'momentum', 'equity-price-path', ['breakout_quality'], 'normalized-0-1', 'higher-is-better', 'P1A'),
  binding('momentum.volatilityQuality', 'momentum', 'equity-price-path', ['volatility_quality'], 'normalized-0-1', 'higher-is-better', 'P1A'),
  binding('momentum.relativeStrength', 'momentum', 'equity-price-path', ['relative_strength'], 'normalized-0-1', 'higher-is-better', 'P1A'),
  binding('financialStrength.debtToEquity', 'financialStrength', 'equity-balance-sheet', ['debtToEquity'], 'ratio', 'lower-is-better', 'P1A'),

  binding('financialStrength.currentRatio', 'financialStrength', 'equity-balance-sheet', ['currentAssets', 'currentLiabilities'], 'ratio', 'higher-is-better', 'P1B'),
  binding('financialStrength.interestCoverage', 'financialStrength', 'equity-debt-service', ['operatingIncome', 'interestExpense'], 'ratio', 'higher-is-better', 'P1B'),
  binding('growth.revenueGrowthYoYPct', 'growth', 'equity-growth', ['revenue'], 'percent', 'higher-is-better', 'P1B'),
  binding('growth.dilutedEpsGrowthYoYPct', 'growth', 'equity-growth', ['dilutedEps'], 'percent', 'higher-is-better', 'P1B'),
  binding('growth.freeCashFlowGrowthYoYPct', 'growth', 'equity-growth', ['operatingCashFlow', 'capitalExpenditure'], 'percent', 'higher-is-better', 'P1B'),
  binding('capitalAllocation.shareCountChangeYoYPct', 'capitalAllocation', 'equity-capital-allocation', ['sharesOutstanding'], 'percent', 'lower-is-better', 'P1B'),
  binding('capitalAllocation.distributionCoverageYtd', 'capitalAllocation', 'equity-capital-allocation', ['operatingCashFlow', 'capitalExpenditure', 'dividendsPaid', 'shareRepurchases'], 'ratio', 'higher-is-better', 'P1B'),
  binding('capitalAllocation.reinvestmentIntensityYtd', 'capitalAllocation', 'equity-capital-allocation', ['operatingCashFlow', 'capitalExpenditure'], 'ratio', 'context-only', 'P1B'),
]);

export const EQUITY_NON_SCORING_CONTEXT_FIELDS = Object.freeze([
  'dividendYieldPct',
  'epsTtm',
  'freeCashFlowPerShare',
] as const);

export const EQUITY_ANTI_CORRELATION_RULES = Object.freeze([
  'Only factor families may receive future top-level weights; P1-A/P1-B define no executable Equity weights.',
  'All price-path signals belong to the single momentum family and must never be re-added as independent trend, breakout, RSI or technical bonuses.',
  'Provider observations representing the same economic signal must be selected or superseded, never stacked additively.',
  'Verified SEC filing evidence supersedes same-correlation-group vendor proxy evidence when both are available; both must never receive independent family coverage.',
  'FCF conversion requires same-provider and same-observation-period EPS/FCF evidence; merged display values must never be cross-provider combined.',
  'Revenue/EPS/FCF growth must come from comparable point-in-time periods and must not be stacked with non-comparable quarterly vendor growth proxies.',
  'Dividend yield alone is context and must not manufacture a Capital Allocation family.',
  'Missing, stale, conflicting or unattributable evidence remains missing and must not become zero, neutral score, PASS or synthetic confidence.',
  'Empirical subfeature/family correlation analysis is mandatory before any productive promotion.',
]);

export const EQUITY_RESEARCH_MODEL_CONTRACT = Object.freeze({
  modelId: EQUITY_RESEARCH_MODEL_ID,
  modelVersion: EQUITY_RESEARCH_MODEL_VERSION,
  featureContractVersion: EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION,
  classificationContractVersion: EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  lifecycle: 'challenger' as const,
  evidencePolicy: 'research-only' as const,
  scoreEligible: false as const,
  executionEligible: false as const,
  executableWeights: false as const,
  factorFamilies: Object.freeze([...EQUITY_FACTOR_FAMILIES]),
  featureBindings: EQUITY_RESEARCH_FEATURE_BINDINGS,
  antiCorrelationRules: EQUITY_ANTI_CORRELATION_RULES,
});

export function createUnclassifiedEquityClassification(): EquityClassification {
  return Object.freeze({
    contractVersion: EQUITY_CLASSIFICATION_CONTRACT_VERSION,
    industry: Object.freeze({ scheme: 'internal' as const, source: 'unclassified' }),
    sizeBucket: 'unknown' as const,
    styleTags: Object.freeze([]),
    primaryProfile: 'unclassified' as const,
    classificationSource: 'unclassified' as const,
  });
}

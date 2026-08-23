export const EQUITY_RESEARCH_MODEL_VERSION = '0.1.0' as const;
export const EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION = 'equity-multifactor-features/0.1.0' as const;
export const EQUITY_CLASSIFICATION_CONTRACT_VERSION = 'equity-classification/0.1.0' as const;

export const EQUITY_FACTOR_FAMILIES = [
  'quality',
  'valuation',
  'growth',
  'momentum',
  'financialStrength',
  'capitalAllocation',
] as const;

export type EquityFactorFamily = typeof EQUITY_FACTOR_FAMILIES[number];

export const EQUITY_PRIMARY_PROFILES = [
  'compounder',
  'quality-growth',
  'value',
  'cyclical-value',
  'momentum',
  'income',
  'turnaround-special-situation',
  'financial',
  'platform-software',
  'semiconductor-ai-infrastructure',
  'healthcare-innovator',
  'energy-commodity-producer',
] as const;

export type EquityPrimaryProfile = typeof EQUITY_PRIMARY_PROFILES[number];

export type EquityStyleTag =
  | 'quality'
  | 'growth'
  | 'value'
  | 'momentum'
  | 'income'
  | 'low-volatility'
  | 'small-cap'
  | 'turnaround'
  | 'cyclical'
  | 'asset-backed';

export type EquitySizeBucket = 'mega' | 'large' | 'mid' | 'small' | 'micro' | 'unknown';

export interface EquityIndustryClassification {
  /**
   * Classification metadata is routing/context only. It is never financial evidence by itself.
   * `gics` may be used only when the upstream provider/licence permits it.
   */
  readonly scheme: 'gics' | 'provider' | 'internal';
  readonly taxonomyVersion?: string;
  readonly sector?: string;
  readonly industryGroup?: string;
  readonly industry?: string;
  readonly subIndustry?: string;
  readonly code?: string;
  readonly source: string;
}

export interface EquityClassification {
  readonly contractVersion: typeof EQUITY_CLASSIFICATION_CONTRACT_VERSION;
  readonly industry: EquityIndustryClassification;
  readonly sizeBucket: EquitySizeBucket;
  readonly styleTags: readonly EquityStyleTag[];
  /** Exactly one deterministic scoring profile; tags may remain multi-valued. */
  readonly primaryProfile: EquityPrimaryProfile;
  readonly classificationSource: 'governed-rule' | 'verified-provider';
  readonly observedAt?: string;
}

export interface EquityResearchFeatureBinding {
  readonly key: string;
  readonly family: EquityFactorFamily;
  readonly source: string;
  readonly correlationGroup: string;
  readonly requiredForResearch: boolean;
}

export interface EquityResearchModelContract {
  readonly modelId: 'equity-multifactor';
  readonly modelVersion: typeof EQUITY_RESEARCH_MODEL_VERSION;
  readonly featureContractVersion: typeof EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION;
  readonly lifecycle: 'challenger';
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly factorFamilies: readonly EquityFactorFamily[];
  readonly features: readonly EquityResearchFeatureBinding[];
  readonly antiCorrelationRules: readonly string[];
  readonly promotionRequirements: readonly string[];
}

const feature = (
  key: string,
  family: EquityFactorFamily,
  source: string,
  correlationGroup: string,
  requiredForResearch = false,
): EquityResearchFeatureBinding => Object.freeze({ key, family, source, correlationGroup, requiredForResearch });

/**
 * Equity-specific research contract. It deliberately inventories evidence at subfeature level but
 * authorizes weighting only at the six factor-family level. This prevents economically overlapping
 * observations (for example margin/ROIC/ROE or multiple momentum horizons) from being counted as
 * independent top-level score components.
 */
export const EQUITY_RESEARCH_MODEL_CONTRACT: EquityResearchModelContract = Object.freeze({
  modelId: 'equity-multifactor',
  modelVersion: EQUITY_RESEARCH_MODEL_VERSION,
  featureContractVersion: EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION,
  lifecycle: 'challenger',
  scoreEligible: false,
  executionEligible: false,
  factorFamilies: Object.freeze([...EQUITY_FACTOR_FAMILIES]),
  features: Object.freeze([
    feature('quality.profitability', 'quality', 'governed-stock-fundamentals-evidence', 'equity-profitability'),
    feature('quality.freeCashFlowConversion', 'quality', 'governed-cash-flow-evidence', 'equity-profitability'),
    feature('quality.returnOnInvestedCapital', 'quality', 'governed-stock-fundamentals-evidence', 'equity-profitability'),
    feature('quality.earningsQuality', 'quality', 'governed-filing-evidence', 'equity-earnings-quality'),
    feature('quality.earningsVariabilityQuality', 'quality', 'governed-filing-history-evidence', 'equity-earnings-quality'),

    feature('valuation.earningsYield', 'valuation', 'governed-stock-fundamentals-evidence', 'equity-valuation'),
    feature('valuation.freeCashFlowYield', 'valuation', 'governed-cash-flow-evidence', 'equity-valuation'),
    feature('valuation.bookToPrice', 'valuation', 'governed-balance-sheet-evidence', 'equity-valuation'),
    feature('valuation.evToEbitQuality', 'valuation', 'governed-stock-fundamentals-evidence', 'equity-valuation'),

    feature('growth.revenueGrowth', 'growth', 'governed-filing-history-evidence', 'equity-growth'),
    feature('growth.epsGrowth', 'growth', 'governed-filing-history-evidence', 'equity-growth'),
    feature('growth.freeCashFlowGrowth', 'growth', 'governed-cash-flow-history-evidence', 'equity-growth'),

    feature('momentum.return12mEx1m', 'momentum', 'governed-market-history-evidence', 'equity-price-path'),
    feature('momentum.return6mEx1m', 'momentum', 'governed-market-history-evidence', 'equity-price-path'),
    feature('momentum.relativeStrength', 'momentum', 'governed-market-history-evidence', 'equity-price-path'),

    feature('financialStrength.debtToEquityQuality', 'financialStrength', 'governed-balance-sheet-evidence', 'equity-balance-sheet'),
    feature('financialStrength.interestCoverageQuality', 'financialStrength', 'governed-income-statement-evidence', 'equity-balance-sheet'),
    feature('financialStrength.liquidityQuality', 'financialStrength', 'governed-balance-sheet-evidence', 'equity-balance-sheet'),

    feature('capitalAllocation.shareholderYield', 'capitalAllocation', 'governed-capital-actions-evidence', 'equity-capital-allocation'),
    feature('capitalAllocation.dividendCoverage', 'capitalAllocation', 'governed-cash-flow-evidence', 'equity-capital-allocation'),
    feature('capitalAllocation.buybackYield', 'capitalAllocation', 'governed-capital-actions-evidence', 'equity-capital-allocation'),
    feature('capitalAllocation.reinvestmentEfficiency', 'capitalAllocation', 'governed-filing-history-evidence', 'equity-capital-allocation'),
  ]),
  antiCorrelationRules: Object.freeze([
    'Only factor-family scores are top-level weighted. Subfeatures within a family MUST NOT be independently re-added to the composite.',
    'Profit margin, ROIC, ROE, cash-flow conversion and earnings quality are correlated quality observations and MUST be composed inside the quality family before top-level weighting.',
    'P/E, earnings yield, FCF yield, EV/EBIT and book-to-price are valuation observations and MUST be composed inside the valuation family rather than stacked as separate top-level factors.',
    'Multiple return horizons, relative strength, breakout and trend observations are one price-path family; the Equity model MUST NOT add a second generic technical/momentum score outside the momentum family.',
    'Dividend yield, dividend coverage, buyback yield and shareholder yield are capital-allocation/income observations and MUST NOT be duplicated as independent generic yield bonuses.',
    'Market regime, sector rotation, sentiment and pattern signals remain context-only for Equity 0.1.0 and have no scoreImpact or rankingImpact.',
    'Missing, stale, conflicting or unverified evidence remains missing; it MUST NOT be converted into zero, neutral, PASS or synthetic confidence.',
  ]),
  promotionRequirements: Object.freeze([
    'explicit Owner-approved promotion through the existing ScoringModelRegistry and ScoringDispatcher; no parallel dispatcher or route-local score authority',
    'point-in-time verified evidence coverage for every promoted factor family with provider provenance, observedAt, retrievedAt and freshness policy',
    'peer/sector-relative normalization and outlier policy validated without importing proprietary classification data without an applicable licence',
    'out-of-sample and rolling-window backtesting across sectors, market-cap buckets and market regimes with survivorship/look-ahead controls',
    'documented correlation/de-duplication analysis at subfeature and family level',
    'effective-feature and effective-weight fingerprints bound to the promoted feature/evidence/weight contract versions',
    'atomic stock routing cutover so traditional-scoring stops owning stock in the same reviewed change that the Equity champion becomes canonical',
  ]),
});

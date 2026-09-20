export const EQUITY_RESEARCH_UNIVERSE_VERSION =
  'fintech-equity-research-universe/1.0.0' as const;

export interface EquityResearchLens {
  readonly id: string;
  readonly label: string;
  readonly assetClass: 'stock';
  readonly lifecycle: 'RESEARCH_TARGET_NOT_MODEL';
  readonly classificationAuthority: 'VERIFIED_CLASSIFICATION_EVIDENCE_REQUIRED';
  readonly scoreAuthority: 'SCORING_DISPATCHER_ONLY';
  readonly currentChampionBinding: 'traditional-scoring@2.1.0';
}

/**
 * Owner-reference-derived equity lenses.
 *
 * These labels are analytical research targets layered on top of verified structural/company
 * classification. They are not a second taxonomy registry, model registry, scoring formula or
 * productive routing table. A lens becomes executable only through a separately reviewed model
 * descriptor, verified evidence contract, backtest/correlation evidence and governed promotion.
 */
export const EQUITY_RESEARCH_LENSES: readonly EquityResearchLens[] = Object.freeze([
  ['mega-cap-compounders', 'Mega Cap Compounders'],
  ['quality-growth', 'Quality Growth'],
  ['profitable-growth', 'Profitable Growth'],
  ['deep-value', 'Deep Value'],
  ['cyclical-value', 'Cyclical Value'],
  ['momentum-leaders', 'Momentum Leaders'],
  ['turnaround-stocks', 'Turnaround Stocks'],
  ['defensive-cash-generators', 'Defensive Cash Generators'],
  ['dividend-growth', 'Dividend Growth'],
  ['high-yield-income', 'High Yield Income'],
  ['small-cap-growth', 'Small Cap Growth'],
  ['small-cap-deep-value', 'Small Cap Deep Value'],
  ['asset-plays', 'Asset Plays'],
  ['special-situations', 'Special Situations'],
  ['financial-compounders', 'Financial Compounders'],
  ['platform-software-network-effects', 'Platform / Software / Network Effects'],
  ['semiconductor-ai-infrastructure', 'Semiconductor / AI Infrastructure'],
  ['healthcare-innovators', 'Healthcare Innovators'],
  ['industrial-rerating-candidates', 'Industrial Re-Rating Candidates'],
  ['commodity-energy-cash-flow-names', 'Commodity / Energy Cash Flow Names'],
].map(([id, label]) => Object.freeze({
  id,
  label,
  assetClass: 'stock' as const,
  lifecycle: 'RESEARCH_TARGET_NOT_MODEL' as const,
  classificationAuthority: 'VERIFIED_CLASSIFICATION_EVIDENCE_REQUIRED' as const,
  scoreAuthority: 'SCORING_DISPATCHER_ONLY' as const,
  currentChampionBinding: 'traditional-scoring@2.1.0' as const,
})));

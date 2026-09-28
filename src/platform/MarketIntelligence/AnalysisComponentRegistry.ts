import type {
  AnalysisComponentDescriptor,
  AnalysisProviderCapabilityDependency,
  MarketIntelligenceAssetClass,
} from './contracts';
import {
  ANALYSIS_COMPONENT_RESULT_CONTRACT_VERSION,
  ANALYSIS_COMPONENT_REGISTRY_VERSION,
} from './contracts';

const OWNER = 'CAPITAL-AI-FINTECH' as const;

const provider = (
  capability: AnalysisProviderCapabilityDependency['capability'],
  mode: AnalysisProviderCapabilityDependency['mode'],
  purpose: string,
): AnalysisProviderCapabilityDependency => Object.freeze({ capability, mode, purpose });

type ComponentSeed = Omit<
  AnalysisComponentDescriptor,
  'outputContract' | 'owner' | 'lastValidatedAt'
>;

function component(seed: ComponentSeed): AnalysisComponentDescriptor {
  return Object.freeze({
    ...seed,
    outputContract: ANALYSIS_COMPONENT_RESULT_CONTRACT_VERSION,
    owner: OWNER,
    lastValidatedAt: null,
  });
}

const marketAssets = ['stock', 'etf', 'index', 'crypto', 'forex', 'commodity', 'future', 'bond'] as const;
const allAssets = [...marketAssets, 'option', 'macro', 'portfolio', 'multi-asset'] as const;
const technicalInputs = ['validated-data/1.0.0', 'validated-financial-feature/1.0.0'] as const;
type TechnicalComponentSeed = readonly [
  componentId: string,
  displayName: string,
  feature: string,
  calculationVersion: string,
  capabilities: readonly AnalysisProviderCapabilityDependency['capability'][],
  analysisConnectionIds: readonly string[],
];

const technicalComponentSeeds: readonly TechnicalComponentSeed[] = [
  ['multi_timeframe_trend_regime_scorer','Multi-Timeframe Trend Regime Scorer','trend','0.1.0',['history','bars'],['crypto-momentum-research','crypto-regime-research']],
  ['relative_strength_scorer','Relative Strength Scorer','relative-strength','0.1.0',['history'],['crypto-technical-provenance','traditional-scoring-stock']],
  ['momentum_persistence_scorer','Momentum Persistence Scorer','momentum','0.1.0',['history'],['crypto-momentum-research','traditional-scoring-fx-index']],
  ['breakout_quality_scorer','Breakout Quality Scorer','breakout','0.1.0',['history','bars'],['crypto-pattern-confluence-research','commodity-market-evidence']],
  ['volume_confirmation_scorer','Volume Confirmation Scorer','volume-confirmation','0.1.0',['bars','trade'],['crypto-technical-provenance','charts-technical-analysis-legacy']],
  ['volatility_regime_scorer','Volatility Regime Scorer','volatility-regime','0.1.0',['history'],['crypto-regime-research','monte-carlo-risk-engine']],
];

type ResearchComponentSeed = readonly [
  componentId: string,
  displayName: string,
  status: AnalysisComponentDescriptor['status'],
  reasonCodeCatalog: string,
  capabilities: readonly AnalysisProviderCapabilityDependency['capability'][],
  analysisConnectionIds: readonly string[],
];

const researchComponentSeeds: readonly ResearchComponentSeed[] = [
  ['news_relevance_scorer','News Relevance Scorer','planned','RC-NEWS',['news'],['market-sentiment-evidence']],
  ['financial_sentiment_scorer','Financial Sentiment Scorer','shadow','RC-SENT',['news'],['market-sentiment-evidence','legacy-market-sentiment-widget']],
  ['sentiment_velocity_scorer','Sentiment Velocity Scorer','planned','RC-SENT',['news'],['legacy-sentiment-dashboard']],
  ['sentiment_dispersion_scorer','Sentiment Dispersion Scorer','planned','RC-SENT',['news'],['legacy-sentiment-dashboard']],
  ['news_novelty_scorer','News Novelty Scorer','planned','RC-NEWS',['news'],['market-sentiment-evidence']],
  ['source_authority_scorer','Source Authority Scorer','shadow','RC-NEWS',['news'],['market-sentiment-evidence']],
  ['event_detection_classification_engine','Event Detection & Classification Engine','planned','RC-NEWS',['news'],['market-sentiment-evidence']],
  ['event_impact_scorer','Event Impact Scorer','planned','RC-NEWS',['news','history'],['market-sentiment-evidence']],
  ['catalyst_strength_scorer','Catalyst Strength Scorer','planned','RC-NEWS',['news','fundamentals'],['traditional-scoring-stock']],
  ['market_reaction_validator','Market Reaction Validator','planned','RC-NEWS',['history','news'],['quant-backtest-engine']],
  ['narrative_emergence_scorer','Narrative Emergence Scorer','planned','RC-SENT',['news'],['market-sentiment-evidence']],
  ['narrative_saturation_scorer','Narrative Saturation Scorer','planned','RC-SENT',['news'],['market-sentiment-evidence']],
  ['social_attention_velocity_scorer','Social Attention Velocity Scorer','planned','RC-SENT',[],['crypto-meme-integrity']],
  ['social_engagement_quality_scorer','Social Engagement Quality Scorer','planned','RC-SENT',[],['crypto-meme-integrity']],
  ['bot_manipulation_risk_scorer','Bot / Manipulation Risk Scorer','planned','RC-SENT',[],['crypto-meme-integrity']],
];

export const ANALYSIS_COMPONENTS: readonly AnalysisComponentDescriptor[] = Object.freeze([
  component({ componentId:'market_integrity_gate', displayName:'Market Integrity Gate', domain:'risk-controls', assetClassScope:allAssets, status:'active', dataAvailability:['live','delayed','cached','degraded'], inputContracts:['market-tick-gate/1.0.0','market-data/1.0.0'], featureDependencies:['freshness','timestamp-order','provider-identity','spike-baseline'], providerDependencies:[provider('snapshot','EVIDENCE_INPUT','Canonical market observation.'),provider('trade','OPTIONAL_CONTEXT','Venue trade evidence.')], calculationVersion:'1.0.0', refreshPolicy:'event-driven', weightPolicy:'hard-gate', confidencePolicy:'data-sufficiency', riskPolicy:'hard-block', eligibilityPolicy:'hard-gated', reasonCodeCatalog:'RC-DQ', analysisConnectionIds:['crypto-technical-provenance','crypto-kill-switch-research'] }),
  component({ componentId:'data_quality_scorer', displayName:'Data Quality Scorer', domain:'data-quality', assetClassScope:allAssets, status:'active', dataAvailability:['live','delayed','cached','degraded','unavailable'], inputContracts:['market-evidence-quality/1.0.0','validated-data/1.0.0'], featureDependencies:['freshness','provenance','completeness','source-consistency'], providerDependencies:[], calculationVersion:'1.0.0', refreshPolicy:'snapshot', weightPolicy:'fixed-versioned', confidencePolicy:'data-sufficiency', riskPolicy:'hard-block', eligibilityPolicy:'hard-gated', reasonCodeCatalog:'RC-DQ', analysisConnectionIds:['crypto-technical-provenance','traditional-scoring-stock','traditional-scoring-fx-index','commodity-market-evidence','sovereign-benchmark-yield'] }),
  component({ componentId:'liquidity_eligibility_scorer', displayName:'Liquidity Eligibility Scorer', domain:'risk-controls', assetClassScope:marketAssets, status:'shadow', dataAvailability:['live','cached','degraded','unavailable'], inputContracts:['market-tick-gate/1.0.0','validated-data/1.0.0'], featureDependencies:['volume','depth','spread'], providerDependencies:[provider('orderbook','EVIDENCE_INPUT','Depth and spread evidence.'),provider('trade','OPTIONAL_CONTEXT','Observed trade liquidity.')], calculationVersion:'0.1.0', refreshPolicy:'event-driven', weightPolicy:'hard-gate', confidencePolicy:'evidence-coverage', riskPolicy:'hard-block', eligibilityPolicy:'hard-gated', reasonCodeCatalog:'RC-LIQ', analysisConnectionIds:['crypto-meme-integrity','market-screener-projection'] }),
  component({ componentId:'spread_slippage_risk_scorer', displayName:'Spread & Slippage Risk Scorer', domain:'risk-controls', assetClassScope:marketAssets, status:'shadow', dataAvailability:['live','cached','degraded','unavailable'], inputContracts:['market-tick-gate/1.0.0'], featureDependencies:['spreadBps','depth','expectedSlippage'], providerDependencies:[provider('orderbook','EVIDENCE_INPUT','BBO/depth evidence.')], calculationVersion:'0.1.0', refreshPolicy:'event-driven', weightPolicy:'fixed-versioned', confidencePolicy:'evidence-coverage', riskPolicy:'hard-block', eligibilityPolicy:'hard-gated', reasonCodeCatalog:'RC-LIQ', analysisConnectionIds:['realtime-risk-assessment-disabled','crypto-signal-fusion-research'] }),
  component({ componentId:'tradability_gate', displayName:'Tradability Gate', domain:'risk-controls', assetClassScope:marketAssets, status:'shadow', dataAvailability:['live','delayed','cached','degraded','unavailable'], inputContracts:['analysis-component-result/1.0.0','validated-data/1.0.0'], featureDependencies:['data-quality','liquidity','market-integrity'], providerDependencies:[provider('quote','EVIDENCE_INPUT','Current quote availability.')], calculationVersion:'0.1.0', refreshPolicy:'event-driven', weightPolicy:'hard-gate', confidencePolicy:'data-sufficiency', riskPolicy:'hard-block', eligibilityPolicy:'hard-gated', reasonCodeCatalog:'RC-LIQ', analysisConnectionIds:['market-screener-projection','legacy-screener','crypto-kill-switch-research'] }),

  ...technicalComponentSeeds.map(([componentId,displayName,feature,calculationVersion,capabilities,analysisConnectionIds]) => component({
    componentId: componentId as string,
    displayName: displayName as string,
    domain:'scoring',
    assetClassScope:marketAssets,
    status:'shadow',
    dataAvailability:['cached','degraded','unavailable'],
    inputContracts:technicalInputs,
    featureDependencies:[feature as string],
    providerDependencies:capabilities.map(capability => provider(capability,'EVIDENCE_INPUT',`${displayName} evidence.`)),
    calculationVersion: calculationVersion as string,
    refreshPolicy:'bar-close',
    weightPolicy:'renormalized-versioned',
    confidencePolicy:'evidence-coverage',
    riskPolicy:'penalty',
    eligibilityPolicy:'canonical-score-only',
    reasonCodeCatalog:'RC-TECH',
    analysisConnectionIds,
  })),

  component({ componentId:'mean_reversion_opportunity_scorer', displayName:'Mean Reversion Opportunity Scorer', domain:'scoring', assetClassScope:marketAssets, status:'planned', dataAvailability:['unavailable'], inputContracts:technicalInputs, featureDependencies:['normalized-deviation','volatility-regime'], providerDependencies:[provider('history','EVIDENCE_INPUT','Point-in-time price history.')], calculationVersion:'0.1.0', refreshPolicy:'bar-close', weightPolicy:'research-only', confidencePolicy:'not-calibrated', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-TECH', analysisConnectionIds:['charts-technical-analysis-legacy'] }),
  component({ componentId:'support_resistance_proximity_scorer', displayName:'Support / Resistance Proximity Scorer', domain:'market-intelligence', assetClassScope:marketAssets, status:'planned', dataAvailability:['unavailable'], inputContracts:technicalInputs, featureDependencies:['validated-levels'], providerDependencies:[provider('history','EVIDENCE_INPUT','Historical level evidence.')], calculationVersion:'0.1.0', refreshPolicy:'bar-close', weightPolicy:'research-only', confidencePolicy:'evidence-coverage', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-TECH', analysisConnectionIds:['crypto-pattern-confluence-research','favorite-asset-pattern-slots'] }),
  component({ componentId:'pattern_confidence_scorer', displayName:'Pattern Confidence Scorer', domain:'market-intelligence', assetClassScope:marketAssets, status:'shadow', dataAvailability:['cached','degraded','unavailable'], inputContracts:['pattern-research-evidence/1.0.0'], featureDependencies:['pattern-evidence','multi-timeframe-confluence'], providerDependencies:[provider('bars','EVIDENCE_INPUT','OHLC pattern evidence.')], calculationVersion:'0.1.0', refreshPolicy:'bar-close', weightPolicy:'research-only', confidencePolicy:'evidence-coverage', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-TECH', analysisConnectionIds:['altcoin-pattern-research','crypto-pattern-confluence-research','favorite-asset-pattern-slots'] }),
  component({ componentId:'vwap_location_scorer', displayName:'VWAP Location Scorer', domain:'market-intelligence', assetClassScope:marketAssets, status:'shadow', dataAvailability:['live','degraded','unavailable'], inputContracts:['market-tick-gate/1.0.0'], featureDependencies:['vwap','last-price'], providerDependencies:[provider('trade','EVIDENCE_INPUT','Accepted trade ticks for VWAP.')], calculationVersion:'0.1.0', refreshPolicy:'event-driven', weightPolicy:'fixed-versioned', confidencePolicy:'evidence-coverage', riskPolicy:'penalty', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-TECH', analysisConnectionIds:['crypto-technical-provenance'] }),
  component({ componentId:'market_breadth_scorer', displayName:'Market Breadth Scorer', domain:'market-intelligence', assetClassScope:['stock','etf','index'], status:'planned', dataAvailability:['unavailable'], inputContracts:['validated-data/1.0.0'], featureDependencies:['advance-decline','universe-coverage'], providerDependencies:[provider('snapshot','EVIDENCE_INPUT','Cross-sectional market observations.')], calculationVersion:'0.1.0', refreshPolicy:'snapshot', weightPolicy:'research-only', confidencePolicy:'evidence-coverage', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-TECH', analysisConnectionIds:['heatmap-creator-legacy'] }),
  component({ componentId:'sector_rotation_scorer', displayName:'Sector Rotation Scorer', domain:'market-intelligence', assetClassScope:['stock','etf'], status:'planned', dataAvailability:['unavailable'], inputContracts:['validated-data/1.0.0'], featureDependencies:['sector-relative-strength','sector-momentum'], providerDependencies:[provider('history','EVIDENCE_INPUT','Sector constituent/ETF history.')], calculationVersion:'0.1.0', refreshPolicy:'scheduled', weightPolicy:'research-only', confidencePolicy:'evidence-coverage', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-TECH', analysisConnectionIds:['heatmap-creator-legacy'] }),
  component({ componentId:'correlation_diversification_scorer', displayName:'Correlation & Diversification Scorer', domain:'risk-controls', assetClassScope:['portfolio','multi-asset'], status:'shadow', dataAvailability:['cached','degraded','unavailable'], inputContracts:['validated-data/1.0.0'], featureDependencies:['rolling-correlation','concentration'], providerDependencies:[provider('history','EVIDENCE_INPUT','Aligned asset histories.')], calculationVersion:'0.1.0', refreshPolicy:'scheduled', weightPolicy:'fixed-versioned', confidencePolicy:'evidence-coverage', riskPolicy:'penalty', eligibilityPolicy:'canonical-score-only', reasonCodeCatalog:'RC-RANK', analysisConnectionIds:['cross-asset-ranking','deterministic-portfolio-allocation','portfolio-backtester','monte-carlo-risk-engine'] }),
  component({ componentId:'cross_asset_regime_scorer', displayName:'Cross-Asset Regime Scorer', domain:'market-intelligence', assetClassScope:['multi-asset','macro'], status:'shadow', dataAvailability:['cached','degraded','unavailable'], inputContracts:['validated-data/1.0.0','macro-risk-regime/1.1.0'], featureDependencies:['rates-regime','equity-regime','fx-regime','commodity-regime'], providerDependencies:[provider('history','EVIDENCE_INPUT','Cross-asset history.'),provider('macro-series','EVIDENCE_INPUT','Rates/macro context.')], calculationVersion:'0.1.0', refreshPolicy:'macro-release', weightPolicy:'research-only', confidencePolicy:'evidence-coverage', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-MACRO', analysisConnectionIds:['macro-risk-regime','asset-universe-sandbox-legacy','commodity-precious-metals-hybrid'] }),
  component({ componentId:'macro_surprise_scorer', displayName:'Macro Surprise Scorer', domain:'market-intelligence', assetClassScope:['macro','multi-asset'], status:'planned', dataAvailability:['unavailable'], inputContracts:['macro-event-evidence/1.0.0'], featureDependencies:['actual','consensus','revision'], providerDependencies:[provider('macro-series','EVIDENCE_INPUT','Observed macro release values.')], calculationVersion:'0.1.0', refreshPolicy:'macro-release', weightPolicy:'research-only', confidencePolicy:'evidence-coverage', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-MACRO', analysisConnectionIds:['macro-risk-regime','commodity-agriculture-hybrid'] }),
  component({ componentId:'economic_calendar_risk_scorer', displayName:'Economic Calendar Risk Scorer', domain:'risk-controls', assetClassScope:['macro','multi-asset'], status:'planned', dataAvailability:['unavailable'], inputContracts:['economic-calendar-evidence/1.0.0'], featureDependencies:['event-proximity','event-severity'], providerDependencies:[provider('macro-series','OPTIONAL_CONTEXT','Macro series context; calendar capability remains absent.')], calculationVersion:'0.1.0', refreshPolicy:'macro-release', weightPolicy:'hard-gate', confidencePolicy:'not-calibrated', riskPolicy:'hard-block', eligibilityPolicy:'hard-gated', reasonCodeCatalog:'RC-MACRO', analysisConnectionIds:['macro-risk-regime'] }),
  component({ componentId:'entity_resolution_engine', displayName:'Entity Resolution Engine', domain:'asset-master', assetClassScope:allAssets, status:'shadow', dataAvailability:['cached','degraded','unavailable'], inputContracts:['uai/1.0.0','news-evidence/1.0.0'], featureDependencies:['symbol-aliases','entity-aliases'], providerDependencies:[provider('news','OPTIONAL_CONTEXT','External entity/name observations.')], calculationVersion:'0.1.0', refreshPolicy:'news-event', weightPolicy:'hard-gate', confidencePolicy:'evidence-coverage', riskPolicy:'hard-block', eligibilityPolicy:'hard-gated', reasonCodeCatalog:'RC-NEWS', analysisConnectionIds:['market-sentiment-evidence','legacy-market-sentiment-widget'] }),

  ...researchComponentSeeds.map(([componentId,displayName,status,reasonCodeCatalog,capabilities,analysisConnectionIds]) => component({
    componentId: componentId as string,
    displayName: displayName as string,
    domain: componentId === 'bot_manipulation_risk_scorer' ? 'risk-controls' : 'market-intelligence',
    assetClassScope: componentId.startsWith('social_') || componentId.startsWith('bot_') ? ['crypto','stock'] : allAssets,
    status,
    dataAvailability: status === 'shadow' ? ['delayed','cached','degraded','unavailable'] : ['unavailable'],
    inputContracts:['news-evidence/1.0.0','analysis-component-result/1.0.0'],
    featureDependencies:[componentId as string],
    providerDependencies:capabilities.map(capability => provider(capability,'EVIDENCE_INPUT',`${displayName} evidence.`)),
    calculationVersion:'0.1.0',
    refreshPolicy:'news-event',
    weightPolicy:'research-only',
    confidencePolicy: status === 'shadow' ? 'evidence-coverage' : 'not-calibrated',
    riskPolicy: componentId === 'bot_manipulation_risk_scorer' ? 'hard-block' : 'research-block',
    eligibilityPolicy:'research-only',
    reasonCodeCatalog,
    analysisConnectionIds,
  })),

  component({ componentId:'fundamental_quality_scorer', displayName:'Fundamental Quality Scorer', domain:'scoring', assetClassScope:['stock','etf'], status:'shadow', dataAvailability:['delayed','cached','degraded','unavailable'], inputContracts:['validated-financial-feature/1.0.0'], featureDependencies:['profitability','balance-sheet-quality','cash-flow-quality'], providerDependencies:[provider('fundamentals','EVIDENCE_INPUT','Verified point-in-time fundamentals.')], calculationVersion:'0.1.0', refreshPolicy:'fundamental-release', weightPolicy:'fixed-versioned', confidencePolicy:'evidence-coverage', riskPolicy:'penalty', eligibilityPolicy:'canonical-score-only', reasonCodeCatalog:'RC-FUND', analysisConnectionIds:['traditional-scoring-stock','buffett-value-check'] }),
  component({ componentId:'growth_acceleration_scorer', displayName:'Growth Acceleration Scorer', domain:'scoring', assetClassScope:['stock','etf'], status:'planned', dataAvailability:['unavailable'], inputContracts:['validated-financial-feature/1.0.0'], featureDependencies:['revenue-growth','earnings-growth','growth-delta'], providerDependencies:[provider('fundamentals','EVIDENCE_INPUT','Point-in-time growth history.')], calculationVersion:'0.1.0', refreshPolicy:'fundamental-release', weightPolicy:'research-only', confidencePolicy:'not-calibrated', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-FUND', analysisConnectionIds:['traditional-scoring-stock'] }),
  component({ componentId:'valuation_peer_comparison_scorer', displayName:'Valuation Peer Comparison Scorer', domain:'scoring', assetClassScope:['stock','etf'], status:'planned', dataAvailability:['unavailable'], inputContracts:['validated-financial-feature/1.0.0'], featureDependencies:['valuation-multiples','peer-set'], providerDependencies:[provider('fundamentals','EVIDENCE_INPUT','Valuation and peer evidence.')], calculationVersion:'0.1.0', refreshPolicy:'fundamental-release', weightPolicy:'research-only', confidencePolicy:'not-calibrated', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-FUND', analysisConnectionIds:['buffett-value-check'] }),
  component({ componentId:'earnings_revision_scorer', displayName:'Earnings Revision Scorer', domain:'market-intelligence', assetClassScope:['stock','etf'], status:'planned', dataAvailability:['unavailable'], inputContracts:['earnings-estimate-evidence/1.0.0'], featureDependencies:['estimate-revisions'], providerDependencies:[provider('fundamentals','EVIDENCE_INPUT','Estimate history; current matrix does not attest analyst revisions.')], calculationVersion:'0.1.0', refreshPolicy:'fundamental-release', weightPolicy:'research-only', confidencePolicy:'not-calibrated', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-FUND', analysisConnectionIds:['traditional-scoring-stock'] }),
  component({ componentId:'earnings_surprise_guidance_scorer', displayName:'Earnings Surprise & Guidance Scorer', domain:'market-intelligence', assetClassScope:['stock','etf'], status:'planned', dataAvailability:['unavailable'], inputContracts:['earnings-event-evidence/1.0.0'], featureDependencies:['earnings-surprise','guidance-delta'], providerDependencies:[provider('fundamentals','EVIDENCE_INPUT','Reported fundamentals.'),provider('news','OPTIONAL_CONTEXT','Guidance/event context.')], calculationVersion:'0.1.0', refreshPolicy:'fundamental-release', weightPolicy:'research-only', confidencePolicy:'not-calibrated', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-FUND', analysisConnectionIds:['traditional-scoring-stock'] }),
  component({ componentId:'financial_distress_scorer', displayName:'Financial Distress Scorer', domain:'risk-controls', assetClassScope:['stock','etf','bond'], status:'planned', dataAvailability:['unavailable'], inputContracts:['validated-financial-feature/1.0.0'], featureDependencies:['leverage','liquidity','coverage'], providerDependencies:[provider('fundamentals','EVIDENCE_INPUT','Financial statement evidence.')], calculationVersion:'0.1.0', refreshPolicy:'fundamental-release', weightPolicy:'fixed-versioned', confidencePolicy:'evidence-coverage', riskPolicy:'hard-block', eligibilityPolicy:'hard-gated', reasonCodeCatalog:'RC-FUND', analysisConnectionIds:['individual-bond-scoring-draft','traditional-scoring-stock'] }),
  component({ componentId:'insider_institutional_flow_scorer', displayName:'Insider / Institutional Flow Scorer', domain:'market-intelligence', assetClassScope:['stock'], status:'blocked', dataAvailability:['unavailable'], inputContracts:['institutional-flow-evidence/1.0.0'], featureDependencies:['insider-transactions','institutional-positioning'], providerDependencies:[], calculationVersion:'0.1.0', refreshPolicy:'fundamental-release', weightPolicy:'research-only', confidencePolicy:'not-calibrated', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-FLOW', analysisConnectionIds:['traditional-scoring-stock'] }),
  component({ componentId:'options_positioning_gamma_scorer', displayName:'Options Positioning & Gamma Scorer', domain:'market-intelligence', assetClassScope:['option'], status:'blocked', dataAvailability:['unavailable'], inputContracts:['options-chain-evidence/1.0.0'], featureDependencies:['open-interest','implied-volatility','delta','gamma'], providerDependencies:[provider('derivatives','EVIDENCE_INPUT','Derivatives capability exists, but no canonical options-chain contract is attested.')], calculationVersion:'0.1.0', refreshPolicy:'event-driven', weightPolicy:'research-only', confidencePolicy:'not-calibrated', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-DERIV', analysisConnectionIds:['realtime-risk-assessment-disabled'] }),
  component({ componentId:'open_interest_funding_regime_scorer', displayName:'Open Interest & Funding Regime Scorer', domain:'market-intelligence', assetClassScope:['crypto','future'], status:'shadow', dataAvailability:['live','delayed','cached','degraded','unavailable'], inputContracts:['derivatives-evidence/1.0.0'], featureDependencies:['open-interest','funding-rate'], providerDependencies:[provider('derivatives','EVIDENCE_INPUT','Governed crypto derivatives evidence.')], calculationVersion:'0.1.0', refreshPolicy:'event-driven', weightPolicy:'research-only', confidencePolicy:'evidence-coverage', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-DERIV', analysisConnectionIds:['crypto-regime-research','crypto-momentum-research'] }),
  component({ componentId:'orderflow_liquidity_imbalance_scorer', displayName:'Orderflow Liquidity Imbalance Scorer', domain:'market-intelligence', assetClassScope:marketAssets, status:'shadow', dataAvailability:['live','cached','degraded','unavailable'], inputContracts:['market-tick-gate/1.0.0'], featureDependencies:['bid-depth','ask-depth','imbalance'], providerDependencies:[provider('orderbook','EVIDENCE_INPUT','Venue order-book evidence.')], calculationVersion:'0.1.0', refreshPolicy:'event-driven', weightPolicy:'research-only', confidencePolicy:'evidence-coverage', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-FLOW', analysisConnectionIds:['crypto-signal-fusion-research','crypto-meme-integrity'] }),
  component({ componentId:'onchain_flow_holder_behavior_scorer', displayName:'On-Chain Flow & Holder Behavior Scorer', domain:'market-intelligence', assetClassScope:['crypto'], status:'blocked', dataAvailability:['unavailable'], inputContracts:['onchain-flow-evidence/1.0.0'], featureDependencies:['exchange-flow','holder-distribution','whale-flow'], providerDependencies:[provider('onchain','EVIDENCE_INPUT','On-chain capability exists; generic holder/whale-flow contract is not attested.')], calculationVersion:'0.1.0', refreshPolicy:'onchain-cadence', weightPolicy:'research-only', confidencePolicy:'not-calibrated', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-ONCHAIN', analysisConnectionIds:['crypto-meme-integrity','crypto-defi-fundamental'] }),
  component({ componentId:'protocol_fundamentals_tokenomics_scorer', displayName:'Protocol Fundamentals & Tokenomics Scorer', domain:'market-intelligence', assetClassScope:['crypto'], status:'shadow', dataAvailability:['delayed','cached','degraded','unavailable'], inputContracts:['protocol-evidence/1.1.0','analysis-component-result/1.0.0'], featureDependencies:['tvl','fees','revenue','tokenomics','contract-security'], providerDependencies:[provider('fundamentals','EVIDENCE_INPUT','Protocol fundamentals.'),provider('onchain','EVIDENCE_INPUT','Governed protocol/on-chain evidence.'),provider('security','OPTIONAL_CONTEXT','Contract/security context.')], calculationVersion:'0.1.0', refreshPolicy:'onchain-cadence', weightPolicy:'research-only', confidencePolicy:'evidence-coverage', riskPolicy:'research-block', eligibilityPolicy:'research-only', reasonCodeCatalog:'RC-ONCHAIN', analysisConnectionIds:['crypto-defi-fundamental'] }),
  component({ componentId:'final_rank_confidence_evidence_scorer', displayName:'Final Rank Confidence & Evidence Scorer', domain:'ranking', assetClassScope:['multi-asset'], status:'shadow', dataAvailability:['cached','degraded','unavailable'], inputContracts:['scoring-integrity/1.1.0','cross-asset-ranking/1.1.0','fintech-scoring-trace-lineage/1.0.0'], featureDependencies:['canonical-score','risk-state','eligibility-state','evidence-coverage'], providerDependencies:[], calculationVersion:'0.1.0', refreshPolicy:'snapshot', weightPolicy:'hard-gate', confidencePolicy:'data-sufficiency', riskPolicy:'hard-block', eligibilityPolicy:'canonical-score-only', reasonCodeCatalog:'RC-RANK', analysisConnectionIds:['cross-asset-ranking','deterministic-portfolio-allocation','enterprise-scorer-workbench','portfolio-performance-legacy'] }),
]);

export const ANALYSIS_COMPONENT_IDS = Object.freeze(
  ANALYSIS_COMPONENTS.map(componentDescriptor => componentDescriptor.componentId),
);

export function getAnalysisComponent(
  componentId: string,
): AnalysisComponentDescriptor | undefined {
  return ANALYSIS_COMPONENTS.find(componentDescriptor => componentDescriptor.componentId === componentId);
}

export function analysisComponentRegistryIdentity(): string {
  return `${ANALYSIS_COMPONENT_REGISTRY_VERSION}:${ANALYSIS_COMPONENTS.length}`;
}

export function analysisComponentAssetScope(
  componentId: string,
): readonly MarketIntelligenceAssetClass[] {
  return getAnalysisComponent(componentId)?.assetClassScope ?? [];
}

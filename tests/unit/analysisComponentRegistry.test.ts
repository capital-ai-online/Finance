import { describe, expect, it } from 'vitest';
import { ANALYSIS_CONNECTION_CONTRACTS } from '../../src/platform/Scoring/AnalysisConnectionRegistry';
import {
  ANALYSIS_COMPONENTS,
  ANALYSIS_COMPONENT_IDS,
  analysisComponentRegistryIdentity,
} from '../../src/platform/MarketIntelligence/AnalysisComponentRegistry';
import { validateAnalysisComponentRegistry } from '../../src/platform/MarketIntelligence/runtimeValidation';

const EXPECTED_COMPONENT_IDS = new Set([
  'market_integrity_gate','data_quality_scorer','liquidity_eligibility_scorer','spread_slippage_risk_scorer','tradability_gate',
  'multi_timeframe_trend_regime_scorer','relative_strength_scorer','momentum_persistence_scorer','breakout_quality_scorer','mean_reversion_opportunity_scorer',
  'volume_confirmation_scorer','volatility_regime_scorer','support_resistance_proximity_scorer','pattern_confidence_scorer','vwap_location_scorer',
  'market_breadth_scorer','sector_rotation_scorer','correlation_diversification_scorer','cross_asset_regime_scorer','macro_surprise_scorer',
  'economic_calendar_risk_scorer','entity_resolution_engine','news_relevance_scorer','financial_sentiment_scorer','sentiment_velocity_scorer',
  'sentiment_dispersion_scorer','news_novelty_scorer','source_authority_scorer','event_detection_classification_engine','event_impact_scorer',
  'catalyst_strength_scorer','market_reaction_validator','narrative_emergence_scorer','narrative_saturation_scorer','social_attention_velocity_scorer',
  'social_engagement_quality_scorer','bot_manipulation_risk_scorer','fundamental_quality_scorer','growth_acceleration_scorer','valuation_peer_comparison_scorer',
  'earnings_revision_scorer','earnings_surprise_guidance_scorer','financial_distress_scorer','insider_institutional_flow_scorer','options_positioning_gamma_scorer',
  'open_interest_funding_regime_scorer','orderflow_liquidity_imbalance_scorer','onchain_flow_holder_behavior_scorer','protocol_fundamentals_tokenomics_scorer',
  'final_rank_confidence_evidence_scorer',
]);

describe('FIN-MI-01 AnalysisComponentRegistry', () => {
  it('contains exactly 50 unique canonical component ids', () => {
    expect(ANALYSIS_COMPONENTS).toHaveLength(50);
    expect(new Set(ANALYSIS_COMPONENT_IDS).size).toBe(50);
    expect(new Set(ANALYSIS_COMPONENT_IDS)).toEqual(EXPECTED_COMPONENT_IDS);
    expect(analysisComponentRegistryIdentity()).toBe('analysis-component-registry/1.0.0:50');
    expect(validateAnalysisComponentRegistry()).toEqual([]);
  });

  it('declares every mandatory registry field and an explicit data-availability state', () => {
    for (const component of ANALYSIS_COMPONENTS) {
      expect(component.componentId).not.toBe('');
      expect(component.displayName).not.toBe('');
      expect(component.domain).not.toBe('');
      expect(component.assetClassScope.length).toBeGreaterThan(0);
      expect(component.status).not.toBe('');
      expect(component.dataAvailability.length).toBeGreaterThan(0);
      expect(component.inputContracts.length).toBeGreaterThan(0);
      expect(component.outputContract).toBe('analysis-component-result/1.0.0');
      expect(component.calculationVersion).not.toBe('');
      expect(component.refreshPolicy).not.toBe('');
      expect(component.weightPolicy).not.toBe('');
      expect(component.confidencePolicy).not.toBe('');
      expect(component.riskPolicy).not.toBe('');
      expect(component.reasonCodeCatalog).not.toBe('');
      expect(component.owner).toBe('CAPITAL-AI-FINTECH');
      expect(component.lastValidatedAt).toBeNull();
    }
  });

  it('maps every one of the 38 existing AnalysisConnectionContracts to at least one component', () => {
    expect(ANALYSIS_CONNECTION_CONTRACTS).toHaveLength(38);
    const mappedIds = new Set(ANALYSIS_COMPONENTS.flatMap(component => component.analysisConnectionIds));

    for (const connection of ANALYSIS_CONNECTION_CONTRACTS) {
      expect(mappedIds.has(connection.id), connection.id).toBe(true);
    }
  });

  it('does not introduce an executable options, whale-flow or unsupported institutional-flow component', () => {
    for (const id of [
      'options_positioning_gamma_scorer',
      'onchain_flow_holder_behavior_scorer',
      'insider_institutional_flow_scorer',
    ]) {
      const component = ANALYSIS_COMPONENTS.find(candidate => candidate.componentId === id);
      expect(component?.status, id).toBe('blocked');
      expect(component?.dataAvailability, id).toContain('unavailable');
      expect(component?.eligibilityPolicy, id).toBe('research-only');
    }
  });
});

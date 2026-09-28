import { describe, expect, it } from 'vitest';
import { ANALYSIS_CONNECTION_CONTRACTS } from '../../src/platform/Scoring/AnalysisConnectionRegistry';
import {
  ANALYSIS_COMPONENTS,
  ANALYSIS_COMPONENT_IDS,
  analysisComponentRegistryIdentity,
} from '../../src/platform/MarketIntelligence/AnalysisComponentRegistry';
import { validateAnalysisComponentRegistry } from '../../src/platform/MarketIntelligence/runtimeValidation';

describe('FIN-MI-01 AnalysisComponentRegistry', () => {
  it('contains exactly 50 unique canonical component ids', () => {
    expect(ANALYSIS_COMPONENTS).toHaveLength(50);
    expect(new Set(ANALYSIS_COMPONENT_IDS).size).toBe(50);
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

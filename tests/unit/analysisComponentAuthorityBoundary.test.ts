import { describe, expect, it } from 'vitest';
import { PROVIDER_MATRIX } from '../../src/platform/MarketData/ProviderMatrix';
import { ANALYSIS_COMPONENTS } from '../../src/platform/MarketIntelligence/AnalysisComponentRegistry';
import { failClosedEligibility } from '../../src/platform/MarketIntelligence/componentPolicies';
import { validateAnalysisComponentRegistry } from '../../src/platform/MarketIntelligence/runtimeValidation';

describe('FIN-MI-01 authority boundary', () => {
  it('uses provider-neutral capabilities that exist in the canonical ProviderMatrix', () => {
    expect(validateAnalysisComponentRegistry()).toEqual([]);
    const capabilities = new Set(PROVIDER_MATRIX.flatMap(entry => entry.capabilities));

    for (const component of ANALYSIS_COMPONENTS) {
      for (const dependency of component.providerDependencies) {
        expect(capabilities.has(dependency.capability), `${component.componentId}:${dependency.capability}`).toBe(true);
      }
    }
  });

  it('fails closed for every non-active lifecycle state', () => {
    for (const component of ANALYSIS_COMPONENTS.filter(candidate => candidate.status !== 'active')) {
      expect(failClosedEligibility(component, {
        scoreEligible: true,
        rankingEligible: true,
        alertEligible: true,
      }, 'DERIVED'), component.componentId).toEqual({
        scoreEligible: false,
        rankingEligible: false,
        alertEligible: false,
      });
    }
  });

  it('fails closed for demo outputs even on active components', () => {
    for (const component of ANALYSIS_COMPONENTS.filter(candidate => candidate.status === 'active')) {
      expect(failClosedEligibility(component, {
        scoreEligible: true,
        rankingEligible: true,
        alertEligible: true,
      }, 'DEMO'), component.componentId).toEqual({
        scoreEligible: false,
        rankingEligible: false,
        alertEligible: false,
      });
    }
  });

  it('creates no second provider or scoring authority in the descriptor contract', () => {
    const serialized = JSON.stringify(ANALYSIS_COMPONENTS);
    expect(serialized).not.toContain('providerId');
    expect(serialized).not.toContain('canonicalScore');
    expect(serialized).not.toContain('ScoringDispatcher');
    expect(serialized).not.toContain('ScoringModelRegistry');
  });
});

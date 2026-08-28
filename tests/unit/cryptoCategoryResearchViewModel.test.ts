import { describe, expect, it } from 'vitest';
import { buildCryptoCategoryResearchViewModel } from '../../src/features/crypto/ui/cryptoCategoryResearchViewModel';

describe('CV-3/CV-7 crypto category research projection', () => {
  it('projects DeFi category tools and the SC-3 challenger without creating score authority', () => {
    const view = buildCryptoCategoryResearchViewModel('AAVE');

    expect(view.category).toBe('DeFi');
    expect(view.subCategory).toBe('Protocol Token');
    expect(view.profileId).toBe('defi');
    expect(view.metrics.map((metric) => metric.key)).toEqual([
      'revenue',
      'tvlQuality',
      'protocolRisk',
      'technical',
      'liquidity',
    ]);
    expect(view.scoreAuthority).toBe('SCORING_DISPATCHER_ONLY');
    expect(view.researchLens).toMatchObject({
      modelId: 'crypto-defi-fundamental',
      modelVersion: '0.3.0',
      lifecycle: 'challenger',
      scoreEligible: false,
    });
    expect(view.researchLens?.groups.some((group) => group.id === 'defi-contract-security')).toBe(true);
    expect(view.researchLens?.hardGates.length).toBeGreaterThan(0);
  });

  it('projects the effective SC-3 Meme profile and its research challenger coherently', () => {
    const view = buildCryptoCategoryResearchViewModel('DOGE');

    expect(view.category).toBe('Meme');
    expect(view.profileId).toBe('meme');
    expect(view.sourceStatus).toBe('SOURCE_DEFINED');
    expect(view.analysisReady).toBe(true);
    expect(view.metrics.map((metric) => [metric.key, metric.weight])).toEqual([
      ['liquidity', 0.25],
      ['marketStructure', 0.20],
      ['sentiment', 0.18],
      ['narrative', 0.15],
      ['distribution', 0.12],
      ['exchangeAccess', 0.10],
    ]);
    expect(view.hardGates).toContain('buySimulationSuccess');
    expect(view.hardGates).toContain('independentMarketConfirmations');
    expect(view.scoreAuthority).toBe('SCORING_DISPATCHER_ONLY');
    expect(view.researchLens).toMatchObject({
      modelId: 'crypto-meme-integrity',
      modelVersion: '0.3.0',
      lifecycle: 'challenger',
      scoreEligible: false,
    });
    expect(view.researchLens?.groups.some((group) => group.id === 'meme-holder-distribution')).toBe(true);
    expect(view.researchLens?.hardGates.some((gate) => gate.key === 'risk.buySimulationSuccess')).toBe(true);
  });

  it('fails closed for unknown assets and does not invent profile weights', () => {
    const view = buildCryptoCategoryResearchViewModel('NOT_A_REAL_ASSET');

    expect(view.category).toBe('Unknown');
    expect(view.profileId).toBe('generic');
    expect(view.analysisReady).toBe(false);
    expect(view.metrics).toEqual([]);
    expect(view.researchLens).toBeNull();
  });
});

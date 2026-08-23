import { describe, expect, it } from 'vitest';
import {
  COMMODITY_RESEARCH_MODEL_CONTRACTS,
  buildCommodityResearchFeatureSnapshot,
  classifyCommodityResearchInstrumentKind,
} from '../../src/platform/Scoring/CommodityResearchModelContracts';
import { createUniversalAssetIdentity } from '../../src/platform/Scoring/UniversalAssetAdapter';
import { scoringModelRegistry } from '../../src/platform/Scoring/ScoringModelRegistry';

describe('Commodity P0/P1 research contracts', () => {
  it('classifies commodity benchmark identities deterministically without LLM routing', () => {
    expect(classifyCommodityResearchInstrumentKind('CMD_WTI_NYMEX', 'WTI Crude Oil')).toBe('commodity-energy-benchmark');
    expect(classifyCommodityResearchInstrumentKind('CMD_GOLD_COMEX', 'COMEX Gold')).toBe('commodity-precious-metal-benchmark');
    expect(classifyCommodityResearchInstrumentKind('CMD_CORN_CBOT', 'CBOT Corn')).toBe('commodity-agriculture-benchmark');
    expect(classifyCommodityResearchInstrumentKind('CMD_COPPER_COMEX', 'COMEX Copper')).toBe('commodity-industrial-metal-benchmark');
  });

  it('preserves resource-project identity instead of leaking it into benchmark scoring', () => {
    const asset = createUniversalAssetIdentity({
      symbol: 'PROJECT_X',
      name: 'Example Mine Project',
      assetClass: 'commodity',
      instrumentKind: 'commodity-resource-project',
    });
    expect(asset.instrumentKind).toBe('commodity-resource-project');
  });

  it('registers all category models as non-executable challengers only', () => {
    expect(COMMODITY_RESEARCH_MODEL_CONTRACTS).toHaveLength(4);
    for (const contract of COMMODITY_RESEARCH_MODEL_CONTRACTS) {
      expect(contract.lifecycle).toBe('challenger');
      expect(contract.scoreEligible).toBe(false);
      expect(contract.executableWeights).toBe(false);
      expect(contract.weightHypothesis.status).toBe('research-hypothesis');
      expect(contract.weightHypothesis.executable).toBe(false);

      const descriptor = scoringModelRegistry.get(contract.modelId, contract.modelVersion);
      expect(descriptor?.lifecycle).toBe('challenger');
      expect(descriptor?.scoreEligible).toBe(false);
      expect(descriptor?.evidencePolicy).toBe('research-only');
      expect(descriptor?.instrumentKinds).toEqual([contract.instrumentKind]);
    }
  });

  it('keeps the existing commodity champion authoritative for canonical resolution', () => {
    const asset = createUniversalAssetIdentity({
      symbol: 'CMD_WTI_NYMEX',
      name: 'NYMEX WTI Crude Oil Futures',
      assetClass: 'commodity',
      instrumentKind: 'commodity-benchmark',
      source: 'catalog',
    });
    expect(asset.instrumentKind).toBe('commodity-energy-benchmark');
    const resolution = scoringModelRegistry.resolve(asset);
    expect(resolution.status).toBe('RESOLVED');
    if (resolution.status === 'RESOLVED') {
      expect(resolution.model.modelId).toBe('commodity-evidence-scoring');
      expect(resolution.model.alias).toBe('champion');
      expect(resolution.model.scoreEligible).toBe(true);
    }
  });

  it('fails closed on missing required features without neutral-value substitution', () => {
    const nowMs = Date.parse('2026-08-23T12:00:00.000Z');
    const snapshot = buildCommodityResearchFeatureSnapshot({
      assetId: 'commodity:CMD_WTI_NYMEX',
      symbol: 'CMD_WTI_NYMEX',
      instrumentKind: 'commodity-energy-benchmark',
      observations: [{
        featureKey: 'market.priceHistory',
        rawValue: 75,
        unit: 'price-series',
        source: 'TwelveData:XTI/USD',
        observedAt: '2026-08-22T23:59:59.000Z',
        retrievedAt: '2026-08-23T00:01:00.000Z',
        evidenceId: 'market:1',
      }],
      nowMs,
    });

    expect(snapshot.canonical).toBe(false);
    expect(snapshot.scoreEligible).toBe(false);
    expect(snapshot.researchReady).toBe(false);
    expect(snapshot.requiredCoverage).toBeLessThan(1);
    expect(snapshot.features.filter(feature => feature.status === 'MISSING').length).toBeGreaterThan(0);
    expect(snapshot.features.filter(feature => feature.status === 'MISSING').every(feature => feature.rawValue === null)).toBe(true);
  });

  it('marks a fully sourced Energy required-feature set research-ready but still non-score-eligible', () => {
    const nowMs = Date.parse('2026-08-23T12:00:00.000Z');
    const snapshot = buildCommodityResearchFeatureSnapshot({
      assetId: 'commodity:CMD_WTI_NYMEX',
      symbol: 'CMD_WTI_NYMEX',
      instrumentKind: 'commodity-energy-benchmark',
      observations: [
        { featureKey: 'market.priceHistory', rawValue: 75, unit: 'price-series', source: 'TwelveData:XTI/USD', observedAt: '2026-08-22T23:59:59.000Z', retrievedAt: '2026-08-23T00:01:00.000Z', evidenceId: 'market:1' },
        { featureKey: 'fundamentals.inventoryLevel', rawValue: 420, unit: 'million-barrels', source: 'EIA:inventory', observedAt: '2026-08-20T00:00:00.000Z', retrievedAt: '2026-08-21T00:00:00.000Z', evidenceId: 'eia:1' },
        { featureKey: 'fundamentals.production', rawValue: 13.4, unit: 'million-bpd', source: 'EIA:production', observedAt: '2026-08-01T00:00:00.000Z', retrievedAt: '2026-08-10T00:00:00.000Z', evidenceId: 'eia:2' },
      ],
      nowMs,
    });

    expect(snapshot.requiredCoverage).toBe(1);
    expect(snapshot.researchReady).toBe(true);
    expect(snapshot.scoreEligible).toBe(false);
    expect(snapshot.hardGates.every(gate => gate.passed)).toBe(true);
  });

  it('blocks stale required evidence according to feature-specific freshness', () => {
    const nowMs = Date.parse('2026-08-23T12:00:00.000Z');
    const snapshot = buildCommodityResearchFeatureSnapshot({
      assetId: 'commodity:CMD_CORN_CBOT',
      symbol: 'CMD_CORN_CBOT',
      instrumentKind: 'commodity-agriculture-benchmark',
      observations: [
        { featureKey: 'market.priceHistory', rawValue: 400, unit: 'price-series', source: 'TwelveData:C_1', observedAt: '2026-08-01T00:00:00.000Z', retrievedAt: '2026-08-02T00:00:00.000Z', evidenceId: 'market:stale' },
      ],
      nowMs,
    });
    expect(snapshot.features.find(feature => feature.featureKey === 'market.priceHistory')?.status).toBe('STALE');
    expect(snapshot.researchReady).toBe(false);
  });

  it('accepts annual official USGS evidence within its annual freshness window', () => {
    const nowMs = Date.parse('2026-08-23T12:00:00.000Z');
    const snapshot = buildCommodityResearchFeatureSnapshot({
      assetId: 'commodity:CMD_COPPER_COMEX',
      symbol: 'CMD_COPPER_COMEX',
      instrumentKind: 'commodity-industrial-metal-benchmark',
      observations: [
        { featureKey: 'market.priceHistory', rawValue: 4.5, unit: 'price-series', source: 'TwelveData:COPPER', observedAt: '2026-08-22T00:00:00.000Z', retrievedAt: '2026-08-22T01:00:00.000Z', evidenceId: 'market:copper' },
        { featureKey: 'fundamentals.mineProduction', rawValue: 23000, unit: 'thousand-metric-tons', source: 'USGS:MCS', observedAt: '2025-12-31T23:59:59.000Z', retrievedAt: '2026-01-30T12:00:00.000Z', evidenceId: 'usgs:production:2025' },
        { featureKey: 'fundamentals.netImportReliance', rawValue: 45, unit: 'percent', source: 'USGS:MCS', observedAt: '2025-12-31T23:59:59.000Z', retrievedAt: '2026-01-30T12:00:00.000Z', evidenceId: 'usgs:import:2025' },
      ],
      nowMs,
    });
    expect(snapshot.features.find(feature => feature.featureKey === 'fundamentals.mineProduction')?.status).toBe('VALID');
    expect(snapshot.requiredCoverage).toBe(1);
    expect(snapshot.researchReady).toBe(true);
  });

  it('rejects future-dated evidence and temporal ordering violations', () => {
    const nowMs = Date.parse('2026-08-23T12:00:00.000Z');
    const snapshot = buildCommodityResearchFeatureSnapshot({
      assetId: 'commodity:CMD_WTI_NYMEX',
      symbol: 'CMD_WTI_NYMEX',
      instrumentKind: 'commodity-energy-benchmark',
      observations: [{
        featureKey: 'market.priceHistory',
        rawValue: 75,
        unit: 'price-series',
        source: 'TwelveData:XTI/USD',
        observedAt: '2026-08-24T00:00:00.000Z',
        retrievedAt: '2026-08-23T11:00:00.000Z',
        evidenceId: 'market:future',
      }],
      nowMs,
    });
    expect(snapshot.features.find(feature => feature.featureKey === 'market.priceHistory')?.status).toBe('INVALID');
    expect(snapshot.researchReady).toBe(false);
  });

  it('fails closed when duplicate observations bypass an upstream governed merge decision', () => {
    const nowMs = Date.parse('2026-08-23T12:00:00.000Z');
    const common = {
      featureKey: 'market.priceHistory',
      rawValue: 75,
      unit: 'price-series',
      observedAt: '2026-08-22T00:00:00.000Z',
      retrievedAt: '2026-08-22T01:00:00.000Z',
    } as const;
    const snapshot = buildCommodityResearchFeatureSnapshot({
      assetId: 'commodity:CMD_WTI_NYMEX',
      symbol: 'CMD_WTI_NYMEX',
      instrumentKind: 'commodity-energy-benchmark',
      observations: [
        { ...common, source: 'provider:a', evidenceId: 'a' },
        { ...common, source: 'provider:b', evidenceId: 'b' },
      ],
      nowMs,
    });
    expect(snapshot.features.find(feature => feature.featureKey === 'market.priceHistory')?.status).toBe('INVALID');
    expect(snapshot.researchReady).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildCommodityResearchFeatureSnapshot,
  evaluateCommodityCategoryResearchSnapshot,
} from '../../src/platform/Scoring';

const NOW = Date.parse('2026-08-23T12:00:00.000Z');
const OBSERVED = '2026-08-22T12:00:00.000Z';
const RETRIEVED = '2026-08-23T11:00:00.000Z';

function energyObservations() {
  return [
    {
      featureKey: 'market.priceHistory',
      rawValue: 74.2,
      unit: 'price-series',
      source: 'twelvedata:CL1',
      observedAt: OBSERVED,
      retrievedAt: RETRIEVED,
      evidenceId: 'commodity-history:twelvedata:CL1:2026-08-22',
      confidence: 1,
    },
    {
      featureKey: 'fundamentals.inventoryLevel',
      rawValue: 410000,
      unit: 'source-unit',
      source: 'EIA:PET.WCESTUS1.W',
      observedAt: OBSERVED,
      retrievedAt: RETRIEVED,
      evidenceId: 'eia:PET.WCESTUS1.W:20260822',
      confidence: 1,
    },
    {
      featureKey: 'fundamentals.production',
      rawValue: 13.4,
      unit: 'source-unit',
      source: 'EIA:PET.WCRFPUS2.W',
      observedAt: OBSERVED,
      retrievedAt: RETRIEVED,
      evidenceId: 'eia:PET.WCRFPUS2.W:20260822',
      confidence: 1,
    },
  ] as const;
}

describe('Commodity category research evaluation', () => {
  it('marks a complete energy research snapshot ready but never score eligible', () => {
    const snapshot = buildCommodityResearchFeatureSnapshot({
      assetId: 'commodity:CMD_WTI_NYMEX',
      symbol: 'CMD_WTI_NYMEX',
      instrumentKind: 'commodity-energy-benchmark',
      observations: energyObservations(),
      nowMs: NOW,
    });
    const assessment = evaluateCommodityCategoryResearchSnapshot(snapshot);

    expect(snapshot.researchReady).toBe(true);
    expect(assessment.status).toBe('RESEARCH_READY');
    expect(assessment.researchCompositeScore).toBeNull();
    expect(assessment.canonical).toBe(false);
    expect(assessment.scoreEligible).toBe(false);
    expect(assessment.executionEligible).toBe(false);
    expect(assessment.blockers).toEqual([]);
    expect(assessment.lineage.effectiveFeatureFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(assessment.lineage.weightFingerprintSemantic).toBe('NON_EXECUTABLE_ZERO_WEIGHT');
  });

  it('blocks missing required evidence and cannot neutral-fill it', () => {
    const snapshot = buildCommodityResearchFeatureSnapshot({
      assetId: 'commodity:CMD_WTI_NYMEX',
      symbol: 'CMD_WTI_NYMEX',
      instrumentKind: 'commodity-energy-benchmark',
      observations: energyObservations().slice(0, 1),
      nowMs: NOW,
    });
    const assessment = evaluateCommodityCategoryResearchSnapshot(snapshot);

    expect(snapshot.researchReady).toBe(false);
    expect(assessment.status).toBe('BLOCKED');
    expect(assessment.missingFeatures).toContain('fundamentals.inventoryLevel');
    expect(assessment.missingFeatures).toContain('fundamentals.production');
    expect(assessment.blockers.length).toBeGreaterThan(0);
    expect(assessment.researchCompositeScore).toBeNull();
  });

  it('produces stable feature lineage for the same evidence state', () => {
    const input = {
      assetId: 'commodity:CMD_WTI_NYMEX',
      symbol: 'CMD_WTI_NYMEX',
      instrumentKind: 'commodity-energy-benchmark' as const,
      observations: energyObservations(),
      nowMs: NOW,
    };
    const a = evaluateCommodityCategoryResearchSnapshot(buildCommodityResearchFeatureSnapshot(input));
    const b = evaluateCommodityCategoryResearchSnapshot(buildCommodityResearchFeatureSnapshot(input));

    expect(a.lineage.effectiveFeatureFingerprint).toBe(b.lineage.effectiveFeatureFingerprint);
    expect(a.lineage.nonExecutableWeightFingerprint).toBe(b.lineage.nonExecutableWeightFingerprint);
  });
});

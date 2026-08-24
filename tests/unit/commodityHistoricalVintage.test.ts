import { describe, expect, it } from 'vitest';
import {
  assembleCommodityHistoricalDataset,
  buildCommodityHistoricalVintage,
  commodityHistoricalSourcePolicy,
  commodityHistoricalVintageToPointInTimeValue,
  type CommodityHistoricalSourceId,
  type CommodityHistoricalVintageArtifact,
} from '../../src/platform/Scoring';

const decisionAt = '2026-03-01T12:00:00.000Z';

function pitVintage(input: Readonly<{
  providerId: CommodityHistoricalSourceId;
  featureKey: string;
  source?: string;
  value?: number;
  unit?: string;
  releaseId?: string | null;
  revisionId?: string | null;
}>): CommodityHistoricalVintageArtifact {
  return buildCommodityHistoricalVintage({
    providerId: input.providerId,
    assetId: 'commodity:WTI',
    symbol: 'CL',
    domain: 'energy',
    featureKey: input.featureKey,
    value: input.value ?? 1,
    unit: input.unit ?? 'index',
    source: input.source ?? input.providerId,
    sourceVersion: `${input.providerId}/test-v1`,
    sourcePath: `https://example.invalid/${input.providerId}`,
    observedAt: '2026-02-20T12:00:00.000Z',
    availableAt: '2026-02-21T12:00:00.000Z',
    retrievedAt: '2026-02-21T12:01:00.000Z',
    evidenceId: `evidence:${input.featureKey}`,
    releaseId: input.releaseId === undefined ? `release:${input.featureKey}` : input.releaseId,
    revisionId: input.revisionId === undefined ? `revision:${input.featureKey}` : input.revisionId,
    availabilityEvidenceId: `availability:${input.featureKey}`,
    acquisitionMode: input.providerId === 'commodity-market-evidence'
      || input.providerId === 'governed-futures-curve-evidence'
      ? 'GOVERNED_MARKET_CAPTURE'
      : 'ARCHIVED_RELEASE_CAPTURE',
  });
}

describe('Commodity historical vintage governance', () => {
  it('never treats retroactive live API history as PIT evidence by source policy', () => {
    for (const providerId of ['eia', 'usda-fas-psd', 'cftc-cot', 'usgs-mcs', 'eu-crma'] as const) {
      const policy = commodityHistoricalSourcePolicy(providerId);
      expect(policy.retroactiveApiHistoryIsPitEligible).toBe(false);
      expect(policy.pitRequiresAvailabilityEvidence).toBe(true);
    }
  });

  it('keeps a current EIA historical value research-only even when the old period is known', () => {
    const vintage = buildCommodityHistoricalVintage({
      providerId: 'eia',
      assetId: 'commodity:WTI',
      symbol: 'CL',
      domain: 'energy',
      featureKey: 'fundamentals.inventoryLevel',
      value: 420,
      unit: 'million-barrels',
      source: 'eia:PET.WCESTUS1.W',
      sourceVersion: 'EIA-API-v2-current-history',
      sourcePath: 'https://api.eia.gov/v2/seriesid/PET.WCESTUS1.W',
      observedAt: '2025-01-03T23:59:59.000Z',
      availableAt: '2026-08-24T00:00:00.000Z',
      retrievedAt: '2026-08-24T00:00:00.000Z',
      evidenceId: 'eia-current-history:PET.WCESTUS1.W:2025-01-03',
      acquisitionMode: 'LIVE_API_CURRENT_HISTORY',
    });

    expect(vintage.evidenceGrade).toBe('CURRENT_HISTORY_ONLY');
    expect(commodityHistoricalVintageToPointInTimeValue(vintage)).toBeNull();
  });

  it('requires revision evidence before an archived EIA release becomes PIT verified', () => {
    const missingRevision = pitVintage({
      providerId: 'eia',
      featureKey: 'fundamentals.inventoryLevel',
      revisionId: null,
    });
    expect(missingRevision.evidenceGrade).toBe('REFERENCE_STATIC');

    const complete = pitVintage({
      providerId: 'eia',
      featureKey: 'fundamentals.inventoryLevel',
    });
    expect(complete.evidenceGrade).toBe('PIT_VERIFIED');
    expect(commodityHistoricalVintageToPointInTimeValue(complete)?.availableAt).toBe('2026-02-21T12:00:00.000Z');
  });

  it('rejects dataset assembly when any factor relies on CURRENT_HISTORY_ONLY evidence', () => {
    const currentHistory = buildCommodityHistoricalVintage({
      providerId: 'eia',
      assetId: 'commodity:WTI',
      symbol: 'CL',
      domain: 'energy',
      featureKey: 'fundamentals.inventoryLevel',
      value: 420,
      unit: 'source-unit',
      source: 'eia:test',
      sourceVersion: 'current',
      sourcePath: 'https://api.eia.gov/v2',
      observedAt: '2026-02-20T00:00:00.000Z',
      availableAt: '2026-08-24T00:00:00.000Z',
      retrievedAt: '2026-08-24T00:00:00.000Z',
      evidenceId: 'current-history',
      acquisitionMode: 'LIVE_API_CURRENT_HISTORY',
    });

    const assembled = assembleCommodityHistoricalDataset({
      datasetId: 'invalid-current-history',
      datasetVersion: '1.0.0',
      createdAt: '2026-08-24T00:20:00.000Z',
      modelId: 'commodity-energy-hybrid',
      universeId: 'energy-test-universe',
      normalizationContractVersion: 'commodity-factor-normalization/test-v1',
      decisions: [{
        observationId: 'obs-invalid',
        assetId: 'commodity:WTI',
        symbol: 'CL',
        domain: 'energy',
        decisionAt,
        realizedAt: '2026-03-06T12:00:00.000Z',
        realizedReturn: 0.01,
        confidence: 1,
        universeMembershipEvidenceId: 'universe:WTI:2026-03-01',
        vintages: [currentHistory],
        normalization: {
          contractVersion: 'commodity-factor-normalization/test-v1',
          evidenceId: 'normalization:invalid',
          createdAt: decisionAt,
          normalizedFactorValues: { physicalBalance: 0.1 },
          factorEvidenceFeatureKeys: { physicalBalance: ['fundamentals.inventoryLevel'] },
        },
      }],
      benchmarks: [],
      benchmarkReturns: [],
    });

    expect(assembled.valid).toBe(false);
    expect(assembled.dataset).toBeNull();
    expect(assembled.blockers.some(item => item.includes('VINTAGE_NOT_PIT_VERIFIED'))).toBe(true);
  });

  it('assembles a fully PIT-verified energy observation into the existing immutable dataset contract', () => {
    const vintages = [
      pitVintage({ providerId: 'commodity-market-evidence', featureKey: 'market.priceHistory' }),
      pitVintage({ providerId: 'eia', featureKey: 'fundamentals.inventoryLevel' }),
      pitVintage({ providerId: 'governed-futures-curve-evidence', featureKey: 'market.termStructure', releaseId: null, revisionId: null }),
      pitVintage({ providerId: 'cftc-cot', featureKey: 'positioning.managedMoneyNetPctOi', revisionId: null }),
      pitVintage({ providerId: 'governed-official-supply-evidence', featureKey: 'risk.supplyConcentration' }),
    ];
    expect(vintages.every(vintage => vintage.evidenceGrade === 'PIT_VERIFIED')).toBe(true);

    const assembled = assembleCommodityHistoricalDataset({
      datasetId: 'energy-pit-assembly-test',
      datasetVersion: '1.0.0',
      createdAt: '2026-08-24T00:20:00.000Z',
      modelId: 'commodity-energy-hybrid',
      universeId: 'energy-test-universe',
      normalizationContractVersion: 'commodity-factor-normalization/test-v1',
      decisions: [{
        observationId: 'energy:WTI:2026-03-01',
        assetId: 'commodity:WTI',
        symbol: 'CL',
        domain: 'energy',
        decisionAt,
        realizedAt: '2026-03-06T12:00:00.000Z',
        realizedReturn: 0.015,
        confidence: 0.95,
        universeMembershipEvidenceId: 'universe:WTI:2026-03-01',
        vintages,
        normalization: {
          contractVersion: 'commodity-factor-normalization/test-v1',
          evidenceId: 'normalization:WTI:2026-03-01',
          createdAt: '2026-03-01T11:59:00.000Z',
          normalizedFactorValues: {
            marketStructure: 0.2,
            physicalBalance: 0.3,
            carryStructure: 0.1,
            positioning: -0.1,
            supplyRisk: -0.2,
          },
          factorEvidenceFeatureKeys: {
            marketStructure: ['market.priceHistory'],
            physicalBalance: ['fundamentals.inventoryLevel'],
            carryStructure: ['market.termStructure'],
            positioning: ['positioning.managedMoneyNetPctOi'],
            supplyRisk: ['risk.supplyConcentration'],
          },
        },
      }],
      benchmarks: [
        { benchmarkId: 'commodity-evidence-scoring@1.0.0', kind: 'CURRENT_CHAMPION', version: '1.0.0', description: 'Current commodity champion.' },
        { benchmarkId: 'naive-equal-weight@1.0.0', kind: 'NAIVE_BASELINE', version: '1.0.0', description: 'Naive equal-weight baseline.' },
      ],
      benchmarkReturns: [],
    });

    expect(assembled.valid).toBe(true);
    expect(assembled.dataset?.authority).toBe('VALIDATION_ONLY');
    expect(assembled.dataset?.observations[0].pointInTimeSnapshot.values).toHaveLength(5);
    expect(assembled.validation?.pointInTimeValid).toBe(true);
    expect(assembled.validation?.datasetFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(assembled.canonical).toBe(false);
    expect(assembled.scoreEligible).toBe(false);
  });

  it('blocks a versioned annual release from decisions before its publication time', () => {
    const futureRelease = buildCommodityHistoricalVintage({
      providerId: 'usgs-mcs',
      assetId: 'commodity:COPPER',
      symbol: 'COPPER',
      domain: 'industrial-metals',
      featureKey: 'fundamentals.mineProduction',
      value: 100,
      unit: 'kt',
      source: 'usgs-mcs:copper:mine-production',
      sourceVersion: 'MCS-2026-v1.3',
      sourcePath: 'https://doi.org/10.5066/P1WKQ63T',
      observedAt: '2025-12-31T23:59:59.000Z',
      availableAt: '2026-02-06T12:00:00.000Z',
      retrievedAt: '2026-02-06T12:01:00.000Z',
      evidenceId: 'usgs:copper:2025',
      releaseId: 'MCS-2026',
      revisionId: 'MCS-2026-v1.3',
      availabilityEvidenceId: 'usgs-publication:2026-02-06',
      acquisitionMode: 'VERSIONED_ANNUAL_RELEASE',
    });
    expect(futureRelease.evidenceGrade).toBe('PIT_VERIFIED');
    expect(Date.parse(futureRelease.availableAt)).toBeGreaterThan(Date.parse('2025-12-31T23:59:59.000Z'));
  });
});

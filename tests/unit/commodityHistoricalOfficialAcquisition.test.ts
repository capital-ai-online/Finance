import { describe, expect, it } from 'vitest';
import {
  buildArchivedOfficialHistoricalVintages,
  buildEuCrmaHistoricalAssessmentVintages,
  buildUsgsHistoricalReleaseVintages,
  fetchCftcHistoricalVintages,
  fetchEiaCurrentHistoricalVintages,
  fetchUsdaCurrentHistoricalVintages,
  type CommodityArchivedReleaseEvidence,
} from '../../src/services/commodityHistoricalOfficialAcquisition';
import {
  buildCommodityHistoricalArchiveManifest,
  verifyCommodityHistoricalArchiveArtifact,
  type CommodityHistoricalArchiveProviderId,
} from '../../src/services/commodityHistoricalArchiveEvidence';

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function verifiedRelease(input: Readonly<{
  providerId: CommodityHistoricalArchiveProviderId;
  artifactId: string;
  sourceUrl: string;
  sourceVersion: string;
  releaseId: string;
  revisionId: string | null;
  publishedAt: string;
  capturedAt: string;
  payload?: string;
}>): CommodityArchivedReleaseEvidence {
  const payload = input.payload ?? `archive:${input.artifactId}`;
  const manifest = buildCommodityHistoricalArchiveManifest({
    providerId: input.providerId,
    artifactId: input.artifactId,
    artifactRole: input.providerId === 'eu-crma' ? 'REGULATORY_ASSESSMENT' : 'DATA_PAYLOAD',
    sourceUrl: input.sourceUrl,
    sourceVersion: input.sourceVersion,
    releaseId: input.releaseId,
    revisionId: input.revisionId,
    publishedAt: input.publishedAt,
    capturedAt: input.capturedAt,
    mediaType: 'application/json',
    captureMethod: 'OFFICIAL_HTTPS_DOWNLOAD',
    payload,
  });
  const verification = verifyCommodityHistoricalArchiveArtifact(manifest, payload);
  if (!verification.releaseEvidence) throw new Error(`TEST_ARCHIVE_VERIFICATION_FAILED:${input.artifactId}`);
  return verification.releaseEvidence;
}

describe('Commodity historical official acquisition', () => {
  it('retrieves EIA old periods as CURRENT_HISTORY_ONLY rather than false PIT vintages', async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse({
      response: {
        data: [
          { period: '2025-01', value: '100', units: 'million-barrels' },
          { period: '2025-02', value: '101', units: 'million-barrels' },
        ],
      },
    });

    const acquired = await fetchEiaCurrentHistoricalVintages({
      assetId: 'commodity:WTI',
      symbol: 'CL',
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-02-28T00:00:00.000Z',
      series: [{ featureKey: 'fundamentals.inventoryLevel', seriesId: 'PET.TEST.W', unit: 'million-barrels' }],
    }, {
      apiKey: 'test-key',
      fetchImpl,
      nowMs: () => Date.parse('2026-08-24T00:00:00.000Z'),
    });

    expect(acquired.status).toBe('READY');
    expect(acquired.vintages).toHaveLength(2);
    expect(acquired.vintages.every(vintage => vintage.evidenceGrade === 'CURRENT_HISTORY_ONLY')).toBe(true);
    expect(acquired.vintages[0].availableAt).toBe('2026-08-24T00:00:00.000Z');
  });

  it('keeps current USDA PSD history non-PIT and sends the API key through the official API_KEY header', async () => {
    const seenHeaders: Headers[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      seenHeaders.push(new Headers(init?.headers));
      const target = String(url);
      if (target.includes('dataReleaseDates')) return jsonResponse(['2026-08-12T12:00:00.000Z']);
      return jsonResponse([
        { attributeId: 1, value: '1200', unitDescription: '1000 MT' },
        { attributeId: 2, value: '900', unitDescription: '1000 MT' },
      ]);
    };

    const acquired = await fetchUsdaCurrentHistoricalVintages({
      assetId: 'commodity:CORN',
      symbol: 'CORN',
      commodityCode: '0440000',
      marketYears: [2024, 2025],
      attributes: [
        { featureKey: 'fundamentals.production', attributeId: 1, unit: '1000 MT' },
        { featureKey: 'fundamentals.consumption', attributeId: 2, unit: '1000 MT' },
      ],
    }, {
      apiKey: 'test-usda-key',
      fetchImpl,
      nowMs: () => Date.parse('2026-08-24T00:00:00.000Z'),
    });

    expect(acquired.status).toBe('READY');
    expect(acquired.vintages).toHaveLength(4);
    expect(acquired.vintages.every(vintage => vintage.evidenceGrade === 'CURRENT_HISTORY_ONLY')).toBe(true);
    expect(seenHeaders.every(headers => headers.get('API_KEY') === 'test-usda-key')).toBe(true);
  });

  it('upgrades an archived USDA release to PIT only after exact archive payload verification', () => {
    const release = verifiedRelease({
      providerId: 'usda-fas-psd',
      artifactId: 'usda-psd-corn-2025-05-12',
      sourceUrl: 'https://apps.fas.usda.gov/PSDOnline/',
      sourceVersion: 'USDA-PSD-release/2025-05-12',
      releaseId: 'USDA-PSD-2025-05-12-CORN',
      revisionId: 'USDA-PSD-2025-05-12-CORN-v1',
      publishedAt: '2025-05-12T12:00:00.000Z',
      capturedAt: '2025-05-12T12:05:00.000Z',
    });
    const acquired = buildArchivedOfficialHistoricalVintages({
      providerId: 'usda-fas-psd',
      assetId: 'commodity:CORN',
      symbol: 'CORN',
      domain: 'agriculture',
      source: 'usda-fas-psd:0440000',
      release,
      rows: [{
        featureKey: 'fundamentals.production',
        value: 1200,
        unit: '1000 MT',
        observedAt: '2025-05-12T12:00:00.000Z',
        evidenceId: 'usda:corn:production:2025-05-12',
        periodLabel: '2024/25',
      }],
    });

    expect(acquired.status).toBe('READY');
    expect(acquired.vintages[0].evidenceGrade).toBe('PIT_VERIFIED');
    expect(acquired.vintages[0].revisionId).toBe('USDA-PSD-2025-05-12-CORN-v1');
    expect(acquired.vintages[0].availabilityEvidenceId).toMatch(/^commodity-archive:/);
  });

  it('blocks metadata-only archived release objects from upgrading rows to PIT', () => {
    const forged = {
      publishedAt: '2025-05-12T12:00:00.000Z',
      capturedAt: '2025-05-12T12:05:00.000Z',
      releaseId: 'USDA-PSD-2025-05-12-CORN',
      revisionId: 'USDA-PSD-2025-05-12-CORN-v1',
      availabilityEvidenceId: 'archive:usda:corn:2025-05-12',
      sourceVersion: 'USDA-PSD-release/2025-05-12',
      sourcePath: 'https://apps.fas.usda.gov/PSDOnline/',
    } as unknown as CommodityArchivedReleaseEvidence;

    const acquired = buildArchivedOfficialHistoricalVintages({
      providerId: 'usda-fas-psd',
      assetId: 'commodity:CORN',
      symbol: 'CORN',
      domain: 'agriculture',
      source: 'usda-fas-psd:0440000',
      release: forged,
      rows: [{
        featureKey: 'fundamentals.production',
        value: 1200,
        unit: '1000 MT',
        observedAt: '2025-05-12T12:00:00.000Z',
        evidenceId: 'usda:corn:production:2025-05-12',
      }],
    });

    expect(acquired.status).toBe('INVALID');
    expect(acquired.vintages).toEqual([]);
  });

  it('rejects an empty archived row set even when release evidence is valid', () => {
    const release = verifiedRelease({
      providerId: 'usda-fas-psd',
      artifactId: 'usda-empty-row-release',
      sourceUrl: 'https://apps.fas.usda.gov/PSDOnline/',
      sourceVersion: 'USDA-PSD-release/2025-05-12',
      releaseId: 'USDA-PSD-2025-05-12-CORN',
      revisionId: 'USDA-PSD-2025-05-12-CORN-v1',
      publishedAt: '2025-05-12T12:00:00.000Z',
      capturedAt: '2025-05-12T12:05:00.000Z',
    });
    const acquired = buildArchivedOfficialHistoricalVintages({
      providerId: 'usda-fas-psd',
      assetId: 'commodity:CORN',
      symbol: 'CORN',
      domain: 'agriculture',
      source: 'usda-fas-psd:0440000',
      release,
      rows: [],
    });

    expect(acquired.status).toBe('INVALID');
    expect(acquired.vintages).toEqual([]);
  });

  it('never promotes values from the current CFTC PRE endpoint merely because archive metadata is attached', async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse([{
      market_and_exchange_names: 'CRUDE OIL, LIGHT SWEET - NEW YORK MERCANTILE EXCHANGE',
      cftc_contract_market_code: '067651',
      report_date_as_yyyy_mm_dd: '2025-01-07T00:00:00.000',
      m_money_positions_long_all: '100',
      m_money_positions_short_all: '40',
      open_interest_all: '1000',
    }]);

    const release = verifiedRelease({
      providerId: 'cftc-cot',
      artifactId: 'cftc-cot-2025-01-10',
      sourceUrl: 'https://www.cftc.gov/MarketReports/CommitmentsofTraders/HistoricalCompressed/index.htm',
      sourceVersion: 'CFTC-Disaggregated-Futures-Only/2025-01-10',
      releaseId: 'CFTC-COT-2025-01-10',
      revisionId: null,
      publishedAt: '2025-01-10T20:30:00.000Z',
      capturedAt: '2025-01-10T20:31:00.000Z',
    });

    const current = await fetchCftcHistoricalVintages({
      assetId: 'commodity:WTI',
      symbol: 'CL',
      domain: 'energy',
      marketNameContains: 'CRUDE OIL, LIGHT SWEET',
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-31T00:00:00.000Z',
      archivedReports: [{ reportDate: '2025-01-07T00:00:00.000Z', ...release }],
    }, {
      fetchImpl,
      nowMs: () => Date.parse('2026-08-24T00:00:00.000Z'),
    });

    expect(current.status).toBe('PARTIAL');
    expect(current.vintages[0].evidenceGrade).toBe('CURRENT_HISTORY_ONLY');
    expect(current.vintages[0].availableAt).toBe('2026-08-24T00:00:00.000Z');
    expect(current.vintages[0].availabilityEvidenceId).toBeNull();

    const archived = buildArchivedOfficialHistoricalVintages({
      providerId: 'cftc-cot',
      assetId: 'commodity:WTI',
      symbol: 'CL',
      domain: 'energy',
      source: 'cftc-cot:CRUDE OIL, LIGHT SWEET',
      release,
      rows: [{
        featureKey: 'positioning.managedMoneyNetPctOi',
        value: 6,
        unit: 'percent-open-interest',
        observedAt: '2025-01-07T00:00:00.000Z',
        evidenceId: 'cftc-archive:067651:2025-01-07',
        periodLabel: '2025-01-07',
      }],
    });

    expect(archived.status).toBe('READY');
    expect(archived.vintages[0].evidenceGrade).toBe('PIT_VERIFIED');
    expect(archived.vintages[0].availableAt).toBe('2025-01-10T20:30:00.000Z');
    expect(archived.vintages[0].value).toBe(6);
  });

  it('models a USGS statistic as available from the verified versioned release date', () => {
    const release = verifiedRelease({
      providerId: 'usgs-mcs',
      artifactId: 'usgs-mcs-2026-v1.3',
      sourceUrl: 'https://www.usgs.gov/centers/national-minerals-information-center/mineral-commodity-summaries',
      sourceVersion: 'MCS-2026-v1.3',
      releaseId: 'USGS-MCS-2026',
      revisionId: 'MCS-2026-v1.3',
      publishedAt: '2026-02-06T12:00:00.000Z',
      capturedAt: '2026-02-06T12:05:00.000Z',
    });
    const acquired = buildUsgsHistoricalReleaseVintages({
      assetId: 'commodity:COPPER',
      symbol: 'COPPER',
      release,
      observations: [{
        featureKey: 'fundamentals.mineProduction',
        value: 23000,
        unit: 'kt',
        commodity: 'copper',
        statistic: 'world-mine-production',
        year: 2025,
        sourcePath: 'https://untrusted.example/should-not-override-release-evidence',
      }],
    });

    expect(acquired.status).toBe('READY');
    expect(acquired.vintages[0].evidenceGrade).toBe('PIT_VERIFIED');
    expect(acquired.vintages[0].observedAt).toBe('2025-12-31T23:59:59.000Z');
    expect(acquired.vintages[0].availableAt).toBe('2026-02-06T12:00:00.000Z');
    expect(acquired.vintages[0].sourcePath).toBe(release.sourcePath);
  });

  it('keeps CRMA Economic Importance and Supply Risk separate and release-versioned', () => {
    const release = verifiedRelease({
      providerId: 'eu-crma',
      artifactId: 'eu-crma-2024-1252-assessment',
      sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2024/1252/oj',
      sourceVersion: 'EU-CRMA-2024/1252-v1',
      releaseId: 'EU-CRMA-2024-1252-ASSESSMENT',
      revisionId: 'EU-CRMA-2024-1252-v1',
      publishedAt: '2024-05-03T00:00:00.000Z',
      capturedAt: '2024-05-03T00:05:00.000Z',
    });
    const acquired = buildEuCrmaHistoricalAssessmentVintages({
      assetId: 'commodity:COPPER',
      symbol: 'COPPER',
      release,
      criticality: {
        economicImportance: 4.1,
        supplyRisk: 1.3,
        assessmentPeriodEndAt: '2023-12-31T23:59:59.000Z',
        evidenceId: 'crma:copper:assessment',
      },
    });

    expect(acquired.status).toBe('READY');
    expect(acquired.vintages.map(vintage => vintage.featureKey).sort()).toEqual([
      'criticality.economicImportance',
      'criticality.supplyRisk',
    ]);
    expect(acquired.vintages.every(vintage => vintage.evidenceGrade === 'PIT_VERIFIED')).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildArchivedOfficialHistoricalVintages,
  buildEuCrmaHistoricalAssessmentVintages,
  buildUsgsHistoricalReleaseVintages,
  fetchCftcHistoricalVintages,
  fetchEiaCurrentHistoricalVintages,
  fetchUsdaCurrentHistoricalVintages,
} from '../../src/services/commodityHistoricalOfficialAcquisition';

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
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

  it('upgrades an archived USDA release to PIT only when release, revision and availability evidence are bound', () => {
    const acquired = buildArchivedOfficialHistoricalVintages({
      providerId: 'usda-fas-psd',
      assetId: 'commodity:CORN',
      symbol: 'CORN',
      domain: 'agriculture',
      source: 'usda-fas-psd:0440000',
      release: {
        publishedAt: '2025-05-12T12:00:00.000Z',
        capturedAt: '2025-05-12T12:05:00.000Z',
        releaseId: 'USDA-PSD-2025-05-12-CORN',
        revisionId: 'USDA-PSD-2025-05-12-CORN-v1',
        availabilityEvidenceId: 'archive:usda:corn:2025-05-12',
        sourceVersion: 'USDA-PSD-release/2025-05-12',
        sourcePath: 'https://apps.fas.usda.gov/PSDOnline/',
      },
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
  });

  it('keeps CFTC current PRE history non-PIT unless an archived report artifact is supplied', async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse([{
      market_and_exchange_names: 'CRUDE OIL, LIGHT SWEET - NEW YORK MERCANTILE EXCHANGE',
      cftc_contract_market_code: '067651',
      report_date_as_yyyy_mm_dd: '2025-01-07T00:00:00.000',
      m_money_positions_long_all: '100',
      m_money_positions_short_all: '40',
      open_interest_all: '1000',
    }]);

    const current = await fetchCftcHistoricalVintages({
      assetId: 'commodity:WTI',
      symbol: 'CL',
      domain: 'energy',
      marketNameContains: 'CRUDE OIL, LIGHT SWEET',
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-31T00:00:00.000Z',
    }, {
      fetchImpl,
      nowMs: () => Date.parse('2026-08-24T00:00:00.000Z'),
    });
    expect(current.vintages[0].evidenceGrade).toBe('CURRENT_HISTORY_ONLY');

    const archived = await fetchCftcHistoricalVintages({
      assetId: 'commodity:WTI',
      symbol: 'CL',
      domain: 'energy',
      marketNameContains: 'CRUDE OIL, LIGHT SWEET',
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-31T00:00:00.000Z',
      archivedReports: [{
        reportDate: '2025-01-07T00:00:00.000Z',
        publishedAt: '2025-01-10T20:30:00.000Z',
        capturedAt: '2025-01-10T20:31:00.000Z',
        releaseId: 'CFTC-COT-2025-01-10',
        availabilityEvidenceId: 'archive:cftc:2025-01-10',
        sourceVersion: 'CFTC-Disaggregated-Futures-Only/2025-01-10',
        sourcePath: 'https://www.cftc.gov/MarketReports/CommitmentsofTraders/HistoricalCompressed/index.htm',
      }],
    }, {
      fetchImpl,
      nowMs: () => Date.parse('2026-08-24T00:00:00.000Z'),
    });

    expect(archived.vintages[0].evidenceGrade).toBe('PIT_VERIFIED');
    expect(archived.vintages[0].availableAt).toBe('2025-01-10T20:30:00.000Z');
    expect(archived.vintages[0].value).toBe(6);
  });

  it('models a USGS statistic as available from the versioned release date, not from the statistic year', () => {
    const acquired = buildUsgsHistoricalReleaseVintages({
      assetId: 'commodity:COPPER',
      symbol: 'COPPER',
      release: {
        publishedAt: '2026-02-06T12:00:00.000Z',
        capturedAt: '2026-02-06T12:05:00.000Z',
        releaseId: 'USGS-MCS-2026',
        revisionId: 'MCS-2026-v1.3',
        availabilityEvidenceId: 'usgs:mcs2026:publication',
        sourceVersion: 'MCS-2026-v1.3',
        sourcePath: 'https://doi.org/10.5066/P1WKQ63T',
      },
      observations: [{
        featureKey: 'fundamentals.mineProduction',
        value: 23000,
        unit: 'kt',
        commodity: 'copper',
        statistic: 'world-mine-production',
        year: 2025,
      }],
    });

    expect(acquired.status).toBe('READY');
    expect(acquired.vintages[0].evidenceGrade).toBe('PIT_VERIFIED');
    expect(acquired.vintages[0].observedAt).toBe('2025-12-31T23:59:59.000Z');
    expect(acquired.vintages[0].availableAt).toBe('2026-02-06T12:00:00.000Z');
  });

  it('keeps CRMA Economic Importance and Supply Risk separate and release-versioned', () => {
    const acquired = buildEuCrmaHistoricalAssessmentVintages({
      assetId: 'commodity:COPPER',
      symbol: 'COPPER',
      release: {
        publishedAt: '2024-05-03T00:00:00.000Z',
        capturedAt: '2024-05-03T00:05:00.000Z',
        releaseId: 'EU-CRMA-2024-1252-ASSESSMENT',
        revisionId: 'EU-CRMA-2024-1252-v1',
        availabilityEvidenceId: 'eur-lex:2024-1252:oj',
        sourceVersion: 'EU-CRMA-2024/1252-v1',
        sourcePath: 'https://eur-lex.europa.eu/eli/reg/2024/1252/oj',
      },
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

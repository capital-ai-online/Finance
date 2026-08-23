import { describe, expect, it } from 'vitest';
import {
  USDA_FAS_OPEN_DATA_BASE_URL,
  buildEuCrmaCriticalityEvidence,
  buildUsgsMineralEvidence,
  buildVerifiedTermStructureObservation,
  fetchCftcPositioningEvidence,
  fetchEiaEnergyEvidence,
  fetchUsdaAgricultureEvidence,
} from '../../src/services/commodityOfficialEvidence';

function jsonResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  } as Response;
}

describe('Commodity P1 official evidence adapters', () => {
  it('normalizes governed EIA series without symbol guessing', async () => {
    const fetchImpl = (async () => jsonResponse({
      response: {
        data: [
          { period: '2026-08-15', value: '415.2', units: 'million barrels' },
          { period: '2026-08-22', value: '410.8', units: 'million barrels' },
        ],
      },
    })) as typeof fetch;

    const bundle = await fetchEiaEnergyEvidence({
      assetId: 'commodity:CMD_WTI_NYMEX',
      symbol: 'CMD_WTI_NYMEX',
      series: [{ featureKey: 'fundamentals.inventoryLevel', seriesId: 'TEST.INVENTORY.W', unit: 'source-unit' }],
    }, { apiKey: 'test', fetchImpl, nowMs: () => Date.parse('2026-08-23T12:00:00.000Z') });

    expect(bundle.status).toBe('READY');
    expect(bundle.scoreEligible).toBe(false);
    expect(bundle.observations).toHaveLength(1);
    expect(bundle.observations[0].rawValue).toBe(410.8);
    expect(bundle.observations[0].source).toContain('EIA:TEST.INVENTORY.W');
  });

  it('uses the official USDA OpenData host/header contract and preserves release lineage', async () => {
    const requests: Array<{ url: string; headers: Headers }> = [];
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, headers: new Headers(init?.headers) });
      if (url.includes('dataReleaseDates')) {
        return jsonResponse([{ releaseDate: '2026-08-12T00:00:00Z' }]);
      }
      return jsonResponse([
        { attributeId: 1, value: 1000, unitDescription: '1000 MT' },
        { attributeId: 2, value: 800, unitDescription: '1000 MT' },
        { attributeId: 3, value: 200, unitDescription: '1000 MT' },
      ]);
    }) as typeof fetch;

    const bundle = await fetchUsdaAgricultureEvidence({
      assetId: 'commodity:CMD_CORN_CBOT',
      symbol: 'CMD_CORN_CBOT',
      commodityCode: '0440000',
      marketYear: 2026,
      attributes: [
        { featureKey: 'fundamentals.production', attributeId: 1, unit: 'source-unit' },
        { featureKey: 'fundamentals.consumption', attributeId: 2, unit: 'source-unit' },
        { featureKey: 'fundamentals.endingStocks', attributeId: 3, unit: 'source-unit' },
      ],
    }, { apiKey: 'test', fetchImpl, nowMs: () => Date.parse('2026-08-23T12:00:00.000Z') });

    expect(bundle.status).toBe('READY');
    expect(bundle.observations).toHaveLength(3);
    expect(bundle.observations.every(item => item.revisionId === '2026-08-12T00:00:00.000Z')).toBe(true);
    expect(requests.every(request => request.url.startsWith(USDA_FAS_OPEN_DATA_BASE_URL))).toBe(true);
    expect(requests.every(request => request.headers.get('API_KEY') === 'test')).toBe(true);
  });

  it('derives CFTC managed-money net positioning as context evidence only', async () => {
    const fetchImpl = (async () => jsonResponse([{
      market_and_exchange_names: 'GOLD - COMMODITY EXCHANGE INC.',
      cftc_contract_market_code: '088691',
      report_date_as_yyyy_mm_dd: '2026-08-18T00:00:00.000',
      open_interest_all: '200000',
      m_money_positions_long_all: '80000',
      m_money_positions_short_all: '30000',
    }])) as typeof fetch;

    const bundle = await fetchCftcPositioningEvidence({
      assetId: 'commodity:CMD_GOLD_COMEX',
      symbol: 'CMD_GOLD_COMEX',
      domain: 'precious-metals',
      marketNameContains: 'GOLD',
    }, { fetchImpl, nowMs: () => Date.parse('2026-08-23T12:00:00.000Z') });

    expect(bundle.status).toBe('READY');
    expect(bundle.scoreEligible).toBe(false);
    expect(bundle.observations[0].rawValue).toBe(25);
    expect(bundle.observations[0].unit).toBe('percent-open-interest');
  });

  it('normalizes USGS data-release rows for industrial and precious-metal domains', () => {
    const industrial = buildUsgsMineralEvidence({
      assetId: 'commodity:CMD_COPPER_COMEX',
      symbol: 'CMD_COPPER_COMEX',
      retrievedAt: '2026-08-23T12:00:00.000Z',
      observations: [
        { featureKey: 'fundamentals.mineProduction', value: 23000, unit: 'thousand-metric-tons', commodity: 'Copper', statistic: 'World mine production', year: 2025 },
        { featureKey: 'fundamentals.netImportReliance', value: 45, unit: 'percent', commodity: 'Copper', statistic: 'Net import reliance', year: 2025 },
      ],
    });
    const precious = buildUsgsMineralEvidence({
      assetId: 'commodity:CMD_GOLD_COMEX',
      symbol: 'CMD_GOLD_COMEX',
      domain: 'precious-metals',
      retrievedAt: '2026-08-23T12:00:00.000Z',
      observations: [
        { featureKey: 'fundamentals.mineProduction', value: 3300, unit: 'metric-tons', commodity: 'Gold', statistic: 'World mine production', year: 2025 },
      ],
    });

    expect(industrial.status).toBe('READY');
    expect(industrial.providerId).toBe('usgs-mcs');
    expect(industrial.domain).toBe('industrial-metals');
    expect(industrial.observations.every(item => item.evidenceId?.startsWith('usgs-mcs-2026:'))).toBe(true);
    expect(precious.domain).toBe('precious-metals');
  });

  it('keeps CRMA economic importance and supply risk separate', () => {
    const bundle = buildEuCrmaCriticalityEvidence({
      assetId: 'commodity:CMD_COPPER_COMEX',
      symbol: 'CMD_COPPER_COMEX',
      retrievedAt: '2026-08-23T12:00:00.000Z',
      criticality: {
        economicImportance: 4.2,
        supplyRisk: 1.4,
        observedAt: '2024-05-03T00:00:00.000Z',
        evidenceId: 'eu-crma:2024-1252:annex-ii:copper',
      },
    });
    expect(bundle.status).toBe('READY');
    expect(bundle.observations.map(item => item.featureKey)).toEqual([
      'criticality.economicImportance',
      'criticality.supplyRisk',
    ]);
    expect(bundle.scoreEligible).toBe(false);
  });

  it('derives term structure only from two already governed futures observations', () => {
    const observation = buildVerifiedTermStructureObservation({
      nearPrice: 75,
      farPrice: 72,
      source: 'governed-futures-curve-evidence',
      observedAt: '2026-08-22T20:00:00.000Z',
      retrievedAt: '2026-08-22T20:01:00.000Z',
      nearEvidenceId: 'future:near',
      farEvidenceId: 'future:far',
    });
    expect(observation?.featureKey).toBe('market.termStructure');
    expect(observation?.rawValue).toBeCloseTo(4.1666667, 5);
    expect(observation?.evidenceId).toContain('future:near');
    expect(buildVerifiedTermStructureObservation({
      nearPrice: 0,
      farPrice: 72,
      source: 'governed-futures-curve-evidence',
      observedAt: '2026-08-22T20:00:00.000Z',
      retrievedAt: '2026-08-22T20:01:00.000Z',
      nearEvidenceId: 'future:near',
      farEvidenceId: 'future:far',
    })).toBeNull();
  });
});

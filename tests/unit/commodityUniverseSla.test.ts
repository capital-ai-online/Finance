import { describe, expect, it } from 'vitest';
import { getAssetSearchCatalog } from '../../src/lib/assetSearchCatalog';
import {
  classifyCommodityResearchInstrumentKind,
  commodityResearchDomainFromInstrumentKind,
  type CommodityResearchDomain,
  type CommodityResearchInstrumentKind,
} from '../../src/platform/Scoring/CommodityResearchModelContracts';
import type { AssetCatalogEntry } from '../../src/services/assetCatalogIntegrity';
import {
  assessCommodityUniverseSla,
  COMMODITY_DOMAIN_TARGET,
  COMMODITY_UNIVERSE_TARGET,
} from '../../src/services/commodityUniverseSla';

const INSTRUMENT_KIND: Record<CommodityResearchDomain, CommodityResearchInstrumentKind> = {
  energy: 'commodity-energy-benchmark',
  'industrial-metals': 'commodity-industrial-metal-benchmark',
  'precious-metals': 'commodity-precious-metal-benchmark',
  agriculture: 'commodity-agriculture-benchmark',
};

function candidate(domain: CommodityResearchDomain, index: number): AssetCatalogEntry {
  const token = domain.replace(/[^A-Z0-9]+/gi, '_').toUpperCase();
  return {
    symbol: `TEST_${token}_${index}`,
    name: `Test ${domain} ${index}`,
    type: 'commodity',
    instrumentKind: INSTRUMENT_KIND[domain],
    screeningContract: 'catalog-only',
    catalogSource: 'test-only catalog identity',
    origin: 'catalog-expansion',
  };
}

function balancedCatalog(perDomain = COMMODITY_DOMAIN_TARGET): AssetCatalogEntry[] {
  return (Object.keys(INSTRUMENT_KIND) as CommodityResearchDomain[])
    .flatMap(domain => Array.from({ length: perDomain }, (_, index) => candidate(domain, index + 1)));
}

describe('Commodity P3-B universe SLA', () => {
  it('has enough real repository catalog identities for a 24-candidate four-domain target without filler', () => {
    const commodities = getAssetSearchCatalog().filter(entry => entry.type === 'commodity');
    expect(commodities.length).toBeGreaterThanOrEqual(COMMODITY_UNIVERSE_TARGET);

    const counts = new Map<CommodityResearchDomain, number>();
    for (const entry of commodities) {
      const kind = classifyCommodityResearchInstrumentKind(entry.symbol, entry.name, entry.instrumentKind);
      const domain = commodityResearchDomainFromInstrumentKind(kind);
      counts.set(domain, (counts.get(domain) ?? 0) + 1);
    }

    for (const domain of Object.keys(INSTRUMENT_KIND) as CommodityResearchDomain[]) {
      expect(counts.get(domain) ?? 0).toBeGreaterThanOrEqual(COMMODITY_DOMAIN_TARGET);
    }
  });

  it('selects exactly six mapped real identities per domain and leaves the P3-B exit gate closed', async () => {
    const assessment = await assessCommodityUniverseSla({
      catalog: balancedCatalog(),
      nowMs: Date.parse('2026-08-26T21:45:00.000Z'),
      resolveReference: async symbol => ({ symbol: `PROVIDER:${symbol}`, name: symbol }),
    });

    expect(assessment.status).toBe('MAPPING_READY');
    expect(assessment.selectedCandidateCount).toBe(COMMODITY_UNIVERSE_TARGET);
    expect(assessment.domainCoverage).toHaveLength(4);
    expect(assessment.domainCoverage.every(item => item.mappedCandidates === COMMODITY_DOMAIN_TARGET)).toBe(true);
    expect(assessment.domainCoverage.every(item => item.targetMet)).toBe(true);
    expect(new Set(assessment.selectedCandidates.map(item => item.symbol)).size).toBe(COMMODITY_UNIVERSE_TARGET);

    expect(assessment.providerBudget).toMatchObject({
      providerId: 'twelvedata',
      internalRateLimitCapacity: 30,
      internalRateLimitWindowMs: 60_000,
      plannedHistorySymbols: 24,
      timeSeriesCreditsPerSymbol: 1,
      plannedHistoryCredits: 24,
      withinInternalRateLimit: true,
      externalPlanQuotaStatus: 'UNVERIFIED',
      historyProbePerformed: false,
    });
    expect(assessment.exitGateEligible).toBe(false);
    expect(assessment.canonical).toBe(false);
    expect(assessment.scoreEligible).toBe(false);
    expect(assessment.rankingEligible).toBe(false);
    expect(assessment.executionEligible).toBe(false);
  });

  it('reports a transparent GAP instead of synthesizing filler identities', async () => {
    const catalog = [
      ...Array.from({ length: 5 }, (_, index) => candidate('energy', index + 1)),
      ...balancedCatalog().filter(entry => entry.instrumentKind !== 'commodity-energy-benchmark'),
    ];

    const assessment = await assessCommodityUniverseSla({
      catalog,
      resolveReference: async symbol => ({ symbol, name: symbol }),
    });

    expect(assessment.status).toBe('GAP');
    expect(assessment.selectedCandidateCount).toBe(23);
    expect(assessment.domainCoverage.find(item => item.domain === 'energy')).toMatchObject({
      catalogCandidates: 5,
      mappedCandidates: 5,
      targetCandidates: 6,
      targetMet: false,
    });
    expect(assessment.reason).toContain('no synthetic filler');
  });

  it('fails closed on provider-reference failure without leaking the upstream exception', async () => {
    const assessment = await assessCommodityUniverseSla({
      catalog: balancedCatalog(),
      resolveReference: async () => {
        throw new Error('secret provider detail');
      },
    });

    expect(assessment.status).toBe('SOURCE_UNAVAILABLE');
    expect(assessment.exitGateEligible).toBe(false);
    expect(JSON.stringify(assessment)).not.toContain('secret provider detail');
    expect(assessment.providerBudget.historyProbePerformed).toBe(false);
  });
});

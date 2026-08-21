import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildUniverseAvailabilityProjection } from '../../src/services/universeAvailability';

function stockCatalog(count: number, subtype = 'equity') {
  return Array.from({ length: count }, (_, index) => ({
    symbol: `S${index}`,
    name: `Stock ${index}`,
    type: 'stock',
    instrumentKind: subtype,
  }));
}

function readyRows(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    symbol: `S${index}`,
    assetType: 'stock',
    status: 'READY',
    providers: ['TwelveData'],
    evidenceIds: [`ev-${index}`],
    screeningEligible: true,
  }));
}

describe('P1 universe availability projection', () => {
  it('keeps browser-facing availability code isolated from the server-only Scoring barrel', () => {
    const source = readFileSync(new URL('../../src/services/universeAvailability.ts', import.meta.url), 'utf8');

    expect(source).not.toContain("from '../platform/Scoring';");
    expect(source).not.toContain('node:crypto');
    expect(source).toContain("from '../platform/Scoring/UniverseSla'");
    expect(source).toContain("from '../platform/Scoring/UniversalAssetAdapter'");
    expect(source).toContain("from '../platform/Scoring/contracts'");
  });

  it('reports AVAILABLE only when 24 real evidence-backed identities are present', () => {
    const projection = buildUniverseAvailabilityProjection(stockCatalog(24), readyRows(24));
    const stock = projection.classes.find(item => item.assetClass === 'stock');

    expect(projection.authority).toBe('read-only-runtime-projection');
    expect(projection.noDemoData).toBe(true);
    expect(stock?.discoveredCount).toBe(24);
    expect(stock?.evaluatedCount).toBe(24);
    expect(stock?.topLevel.availableCount).toBe(24);
    expect(stock?.topLevel.targetCount).toBe(24);
    expect(stock?.topLevel.status).toBe('AVAILABLE');
  });

  it('never fills a 23-asset real universe to the 24 target', () => {
    const projection = buildUniverseAvailabilityProjection(stockCatalog(24), readyRows(23));
    const stock = projection.classes.find(item => item.assetClass === 'stock');

    expect(stock?.topLevel.availableCount).toBe(23);
    expect(stock?.topLevel.status).toBe('INSUFFICIENT_REAL_UNIVERSE');
    expect(stock?.topLevel.availableAssets).toHaveLength(23);
  });

  it('treats READY without provider/evidence lineage as evidence-insufficient', () => {
    const rows = readyRows(24);
    rows[23] = {
      symbol: 'S23',
      assetType: 'stock',
      status: 'READY',
      providers: [],
      evidenceIds: [],
      screeningEligible: true,
    };
    const projection = buildUniverseAvailabilityProjection(stockCatalog(24), rows);
    const stock = projection.classes.find(item => item.assetClass === 'stock');

    expect(stock?.topLevel.availableCount).toBe(23);
    expect(stock?.topLevel.status).toBe('EVIDENCE_INSUFFICIENT');
  });

  it('surfaces provider degradation instead of claiming availability', () => {
    const rows = readyRows(23);
    rows.push({
      symbol: 'S23',
      assetType: 'stock',
      status: 'PROVIDER_TIMEOUT',
      providers: [],
      evidenceIds: [],
      screeningEligible: false,
    });
    const projection = buildUniverseAvailabilityProjection(stockCatalog(24), rows);
    const stock = projection.classes.find(item => item.assetClass === 'stock');

    expect(stock?.topLevel.availableCount).toBe(23);
    expect(stock?.topLevel.status).toBe('PROVIDER_DEGRADED');
  });

  it('evaluates existing catalog subcategories independently with the same 24 target', () => {
    const catalog = [
      ...Array.from({ length: 24 }, (_, index) => ({ symbol: `C${index}`, name: `Crypto ${index}`, type: 'crypto', subtype: 'standard' })),
      ...Array.from({ length: 2 }, (_, index) => ({ symbol: `M${index}`, name: `Meme ${index}`, type: 'crypto', subtype: 'memecoin' })),
    ];
    const rows = catalog.map((asset, index) => ({
      symbol: asset.symbol,
      assetType: 'crypto',
      status: 'READY',
      providers: ['Binance'],
      evidenceIds: [`ev-${index}`],
      screeningEligible: true,
    }));
    const projection = buildUniverseAvailabilityProjection(catalog, rows);
    const crypto = projection.classes.find(item => item.assetClass === 'crypto');
    const standard = crypto?.subcategories.find(item => item.category === 'standard');
    const meme = crypto?.subcategories.find(item => item.category === 'memecoin');

    expect(standard?.status).toBe('AVAILABLE');
    expect(standard?.availableCount).toBe(24);
    expect(meme?.status).toBe('INSUFFICIENT_REAL_UNIVERSE');
    expect(meme?.availableCount).toBe(2);
    expect(meme?.targetCount).toBe(24);
  });
});

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const service = fs.readFileSync(path.join(root, 'src/services/verifiedAssetDisplay.ts'), 'utf8');
const routes = fs.readFileSync(path.join(root, 'server/routes/verifiedAssetDisplayRoutes.ts'), 'utf8');
const composer = fs.readFileSync(path.join(root, 'server/routes/registerApplicationRoutes.ts'), 'utf8');

describe('verified-asset-display/1.0.0 architecture contract', () => {
  it('keeps catalog metadata separate from per-symbol observation hydration', () => {
    expect(routes).toContain("get('/assets/:symbol/verified-display'");
    expect(routes).not.toContain('symbols=');
    expect(routes).not.toContain('Promise.all(symbols');
    expect(composer).toContain("app.use('/api/registry', verifiedAssetDisplayRouter);");
    expect(composer.indexOf("app.use('/api/registry', verifiedAssetDisplayRouter);")).toBeLessThan(
      composer.indexOf("app.use('/api/registry', registryRouter);")
    );
  });

  it('routes every catalog asset class through an approved evidence path', () => {
    expect(service).toContain("asset.type === 'crypto'");
    expect(service).toContain("asset.type === 'stock'");
    expect(service).toContain("asset.type === 'forex' || asset.type === 'index'");
    expect(service).toContain("asset.type === 'commodity'");
    expect(service).toContain('bondDisplay(symbol, asset.name)');
    expect(service).toContain('getVerifiedCryptoSnapshot');
    expect(service).toContain('fetchVerifiedTraditionalQuote');
    expect(service).toContain('getTwelveDataCommodityEvidence');
    expect(service).toContain('getEodhdBondEvidence');
  });

  it('does not expose research/display values as execution prices or bootstrap fallbacks', () => {
    expect(service).toContain('executionPriceEligible: false');
    expect(service).not.toContain('assetRegistry.getAsset');
    expect(service).not.toContain('Math.random');
    expect(service).not.toContain('FallbackAssets');
  });

  it('keeps Buffett valuation equity-only and evidence-gated', () => {
    expect(service).toContain("buffettValuationStatus: 'NOT_APPLICABLE'");
    expect(service).toContain("valuationReady ? 'READY' : 'PARTIAL'");
    expect(service).toContain('normalizedFundamentals.epsTtm');
    expect(service).toContain('ensureFundamentalsFresh');
  });
});

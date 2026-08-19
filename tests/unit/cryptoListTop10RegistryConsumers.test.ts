import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('SC-2 crypto list/top10 dispatcher consumers', () => {
  it('wires GET /list through the canonical dispatcher using registry-backed UAI identity', () => {
    const source = readFileSync(new URL('../../src/routes/cryptoRoutes.ts', import.meta.url), 'utf8');
    const listStart = source.indexOf("router.get('/list'");
    const priceStart = source.indexOf("router.get('/price-consensus/:symbol'", listStart);
    const listRoute = source.slice(listStart, priceStart);

    expect(listStart).toBeGreaterThanOrEqual(0);
    expect(priceStart).toBeGreaterThan(listStart);
    expect(listRoute).toContain('dispatchCanonicalScore');
    expect(listRoute).toContain("assetClass: 'crypto'");
    expect(listRoute).toContain("source: 'registry'");
    expect(listRoute).toContain('dispatch.asset.assetId');
    expect(listRoute).toContain('model: registeredModel');
    expect(listRoute).toContain('modelRegistry');
    expect(listRoute).toContain("if (dispatch.status !== 'DISPATCHED')");
  });

  it('wires GET /top10 through the canonical dispatcher and excludes failed dispatches before ranking', () => {
    const source = readFileSync(new URL('../../src/routes/cryptoRoutes.ts', import.meta.url), 'utf8');
    const top10Start = source.indexOf("router.get('/top10'");
    const routerEnd = source.indexOf('return router;', top10Start);
    const top10Route = source.slice(top10Start, routerEnd);

    expect(top10Start).toBeGreaterThanOrEqual(0);
    expect(routerEnd).toBeGreaterThan(top10Start);
    expect(top10Route).toContain('dispatchCanonicalScore');
    expect(top10Route).toContain("source: 'registry'");
    expect(top10Route).toContain("if (dispatch.status !== 'DISPATCHED') return null;");
    expect(top10Route).toContain('dispatch.asset.assetId');
    expect(top10Route).toContain('model: registeredModel');
    expect(top10Route).toContain('modelRegistry');
  });

  it('keeps productive crypto routes free of direct domain-scorer imports', () => {
    const source = readFileSync(new URL('../../src/routes/cryptoRoutes.ts', import.meta.url), 'utf8');
    expect(source).not.toContain('evaluateVerifiedCryptoTechnicalScore');
    expect(source).not.toContain('CryptoScoringService.scoreCrypto');
    expect(source).not.toContain('calculateBaseScore');
    expect(source).not.toContain('calculateDefiScore');
  });
});

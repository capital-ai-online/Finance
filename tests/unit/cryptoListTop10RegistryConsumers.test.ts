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

  it('routes GET /top10 through the dispatcher helper and the shared backend ranking authority', () => {
    const source = readFileSync(new URL('../../src/routes/cryptoRoutes.ts', import.meta.url), 'utf8');
    const helperStart = source.indexOf('async function evaluateCryptoScorePayload');
    const routerStart = source.indexOf('export function createCryptoRouter', helperStart);
    const helper = source.slice(helperStart, routerStart);
    const top10Start = source.indexOf("router.get('/top10'");
    const routerEnd = source.indexOf('return router;', top10Start);
    const top10Route = source.slice(top10Start, routerEnd);

    expect(helperStart).toBeGreaterThanOrEqual(0);
    expect(routerStart).toBeGreaterThan(helperStart);
    expect(top10Start).toBeGreaterThanOrEqual(0);
    expect(routerEnd).toBeGreaterThan(top10Start);
    expect(helper).toContain('dispatchCanonicalScore');
    expect(helper).toContain("assetClass: 'crypto'");
    expect(top10Route).toContain('evaluateCryptoScorePayload');
    expect(top10Route).toContain("'registry'");
    expect(top10Route).toContain('buildBackendRankingProjection');
    expect(top10Route).toContain('RANKING_COHORT_AMBIGUOUS');
    expect(top10Route).not.toContain('.sort(');
  });

  it('keeps productive crypto routes free of direct domain-scorer imports', () => {
    const source = readFileSync(new URL('../../src/routes/cryptoRoutes.ts', import.meta.url), 'utf8');
    expect(source).not.toContain('evaluateVerifiedCryptoTechnicalScore');
    expect(source).not.toContain('CryptoScoringService.scoreCrypto');
    expect(source).not.toContain('calculateBaseScore');
    expect(source).not.toContain('calculateDefiScore');
  });
});

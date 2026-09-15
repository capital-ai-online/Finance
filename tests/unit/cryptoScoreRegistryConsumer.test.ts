import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('SC-2 crypto score dispatcher consumer', () => {
  it('wires POST /score through the canonical dispatcher helper and never imports the domain scorer directly', () => {
    const source = readFileSync(new URL('../../src/routes/cryptoRoutes.ts', import.meta.url), 'utf8');
    const helperStart = source.indexOf('async function evaluateCryptoScorePayload');
    const routerStart = source.indexOf('export function createCryptoRouter', helperStart);
    const scoreStart = source.indexOf("router.post('/score'");
    const top10Start = source.indexOf("router.get('/top10'", scoreStart);
    const helper = source.slice(helperStart, routerStart);
    const scoreRoute = source.slice(scoreStart, top10Start);

    expect(helperStart).toBeGreaterThanOrEqual(0);
    expect(routerStart).toBeGreaterThan(helperStart);
    expect(scoreStart).toBeGreaterThanOrEqual(0);
    expect(top10Start).toBeGreaterThan(scoreStart);
    expect(helper).toContain('dispatchCanonicalScore');
    expect(helper).toContain("assetClass: 'crypto'");
    expect(helper).toContain("source: 'request'");
    expect(helper).toContain('dispatch.asset.assetId');
    expect(helper).toContain('modelRegistry');
    expect(scoreRoute).toContain('evaluateCryptoScorePayload');
    expect(scoreRoute).toContain('buildBackendRankingProjection');
    expect(source).not.toContain('evaluateVerifiedCryptoTechnicalScore');
    expect(source).not.toContain('resolveCryptoScoreExecution');
  });
});

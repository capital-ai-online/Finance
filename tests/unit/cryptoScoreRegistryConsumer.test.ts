import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('SC-2 crypto score dispatcher consumer', () => {
  it('wires POST /score through the canonical dispatcher and never imports the domain scorer directly', () => {
    const source = readFileSync(new URL('../../src/routes/cryptoRoutes.ts', import.meta.url), 'utf8');
    const scoreStart = source.indexOf("router.post('/score'");
    const top10Start = source.indexOf("router.get('/top10'", scoreStart);
    const scoreRoute = source.slice(scoreStart, top10Start);

    expect(scoreStart).toBeGreaterThanOrEqual(0);
    expect(top10Start).toBeGreaterThan(scoreStart);
    expect(scoreRoute).toContain('dispatchCanonicalScore');
    expect(scoreRoute).toContain("assetClass: 'crypto'");
    expect(scoreRoute).toContain("source: 'request'");
    expect(scoreRoute).toContain('dispatch.asset.assetId');
    expect(scoreRoute).toContain('modelRegistry');
    expect(source).not.toContain('evaluateVerifiedCryptoTechnicalScore');
    expect(source).not.toContain('resolveCryptoScoreExecution');
  });
});

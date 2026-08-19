import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  enrichStandardCryptoWithCanonicalScore,
  isStandardCryptoMarketDataAsset,
} from '../../server/marketData/canonicalCryptoScoreEnrichment';

describe('SC-2 Phase C3 canonical composition exit compatibility aliases', () => {
  it('classifies every scorable financial class, including Meme-Crypto, for canonical composition-root routing', () => {
    expect(isStandardCryptoMarketDataAsset({ symbol: 'BTC', type: 'crypto' })).toBe(true);
    expect(isStandardCryptoMarketDataAsset({ symbol: 'DOGE', type: 'crypto' })).toBe(true);
    expect(isStandardCryptoMarketDataAsset({ symbol: 'ABC', type: 'crypto', subtype: 'memecoin' })).toBe(true);
    expect(isStandardCryptoMarketDataAsset({ symbol: 'AAPL', type: 'stock' })).toBe(true);
    expect(isStandardCryptoMarketDataAsset({ symbol: 'EURUSD', type: 'forex' })).toBe(true);
    expect(isStandardCryptoMarketDataAsset({ symbol: 'CMD_GOLD_COMEX', type: 'commodity' })).toBe(true);
    expect(isStandardCryptoMarketDataAsset({ symbol: 'GSPC', type: 'index' })).toBe(true);
    expect(isStandardCryptoMarketDataAsset({ symbol: 'GB_US_10Y', type: 'bond' })).toBe(true);
    expect(isStandardCryptoMarketDataAsset({ symbol: 'VIX', type: 'macro' })).toBe(false);
  });

  it('maps a READY canonical Crypto dispatcher score onto the legacy 0..10 market-data scale', async () => {
    const dispatcher = vi.fn(async () => ({
      status: 'DISPATCHED',
      dispatcherVersion: 'canonical-scoring-dispatcher/1.1.0',
      asset: { assetId: 'crypto:BTC', symbol: 'BTC', assetClass: 'crypto' },
      model: { modelId: 'crypto-technical-provenance', version: '0.6.3', alias: 'champion' },
      canonical: { status: 'READY', score: 8.6, final_score: 86, integrity: {} },
      assessment: {},
    } as any));

    const enriched = await enrichStandardCryptoWithCanonicalScore(
      { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', score: 9.9 },
      dispatcher as any,
    );

    expect(dispatcher).toHaveBeenCalledTimes(1);
    expect(enriched.score).toBe(8.6);
    expect(enriched.scoreBasis).toBe('canonical-dispatcher');
    expect(enriched.scoringAuthority).toBe('canonical-scoring-dispatcher/1.1.0');
    expect(enriched.canonicalScoreStatus).toBe('READY');
  });

  it('fails closed instead of preserving an upstream or heuristic score', async () => {
    const dispatcher = vi.fn(async () => ({
      status: 'SCORE_NOT_COMPUTABLE',
      dispatcherVersion: 'canonical-scoring-dispatcher/1.1.0',
      asset: { assetId: 'crypto:BTC', symbol: 'BTC', assetClass: 'crypto' },
      model: null,
      canonical: { status: 'SCORE_NOT_COMPUTABLE', score: null, final_score: null, integrity: {} },
      reason: 'verified evidence unavailable',
    } as any));

    const enriched = await enrichStandardCryptoWithCanonicalScore(
      { symbol: 'BTC', type: 'crypto', score: 8.5 },
      dispatcher as any,
    );

    expect(enriched.score).toBeNull();
    expect(enriched.scoreBasis).toBe('unavailable');
    expect(enriched.canonicalScoreStatus).toBe('SCORE_NOT_COMPUTABLE');
  });

  it('mounts all-Crypto legacy interception before historical server.application routes', () => {
    const registerSource = fs.readFileSync(path.join(process.cwd(), 'server/routes/registerApplicationRoutes.ts'), 'utf8');
    const compatibilitySource = fs.readFileSync(path.join(process.cwd(), 'server/routes/legacyScoringCompatibilityRoutes.ts'), 'utf8');
    const runtimeSource = fs.readFileSync(path.join(process.cwd(), 'server/marketData/createApplicationMarketDataRuntime.ts'), 'utf8');

    expect(registerSource).toContain('app.use(createLegacyScoringCompatibilityRouter())');
    expect(registerSource).toContain('Standard- and Meme-Crypto terminate at the canonical dispatcher');
    expect(compatibilitySource).toContain("router.get('/api/crypto-scoring/:symbol'");
    expect(compatibilitySource).toContain('dispatchCanonicalScore');
    expect(compatibilitySource).not.toContain('return next()');
    expect(compatibilitySource).toContain("status: 'CUSTOM_SCORING_INPUTS_DISABLED'");
    expect(compatibilitySource).toContain("scoreSemantics: 'NON_PRODUCTION_SIMULATION'");
    expect(compatibilitySource).toContain('scoreEligible: false');
    expect(runtimeSource).toContain('isCanonicalScorableMarketDataAsset(asset)');
    expect(runtimeSource).toContain('enrichAssetWithCanonicalScore(asset)');
  });
});

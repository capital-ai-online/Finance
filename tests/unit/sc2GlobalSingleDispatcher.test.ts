import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('SC-2 Phase C3 global Single-Dispatcher invariant', () => {
  const dispatcher = source('src/platform/Scoring/ScoringDispatcher.ts');
  const registry = source('src/platform/Scoring/ScoringModelRegistry.ts');
  const catalogScoring = source('src/features/registry/verifiedCatalogScoring.ts');
  const registryRoutes = source('src/features/registry/registryRoutes.ts');
  const rawMaterialsRoutes = source('src/routes/rawMaterialsRoutes.ts');
  const compatibilityRoutes = source('server/routes/legacyScoringCompatibilityRoutes.ts');
  const routeComposition = source('server/routes/registerApplicationRoutes.ts');
  const marketDataAdapter = source('server/marketData/canonicalCryptoScoreEnrichment.ts');
  const marketDataRuntime = source('server/marketData/createApplicationMarketDataRuntime.ts');

  it('keeps productive registry and verified-score routes free of direct domain-engine execution', () => {
    for (const routeSource of [registryRoutes, catalogScoring]) {
      expect(routeSource).not.toContain('TraditionalAssetScoringService.scoreTraditionalAsset');
      expect(routeSource).not.toContain('scoreCommodityMarketEvidence(');
      expect(routeSource).not.toContain('scoreSovereignBenchmarkEvidence(');
    }
    expect(catalogScoring).toContain('dispatchCanonicalScore(');
    expect(rawMaterialsRoutes).toContain("execution: { kind: 'commodity-evidence', evidence }");
    expect(rawMaterialsRoutes).not.toContain('scoreCommodityMarketEvidence(');
  });

  it('routes Standard- and Meme-Crypto compatibility traffic through the same dispatcher', () => {
    expect(compatibilityRoutes).toContain('respondWithCanonicalCryptoScore');
    expect(compatibilityRoutes).toContain('dispatchCanonicalScore({');
    expect(compatibilityRoutes).not.toContain('MemeCoinScoringService');
    expect(compatibilityRoutes).not.toContain('return next()');
    expect(routeComposition).toContain('Standard- and Meme-Crypto terminate at the canonical dispatcher');
  });

  it('intercepts every scorable market-data class before legacy composition-root scoring', () => {
    for (const assetClass of ['crypto', 'stock', 'forex', 'commodity', 'index', 'bond']) {
      expect(marketDataAdapter).toContain(`'${assetClass}'`);
    }
    expect(marketDataRuntime).toContain('isCanonicalScorableMarketDataAsset(asset)');
    expect(marketDataRuntime).toContain('enrichAssetWithCanonicalScore(asset)');
    expect(marketDataAdapter).toContain('Missing provider evidence never reopens a heuristic fallback');
  });

  it('binds all productive model families to canonical result contracts and dispatcher executors', () => {
    expect(registry).toContain("resultContractVersion: CANONICAL_SCORE_RESULT_CONTRACT_VERSION");
    expect(registry.match(/canonicalResultAdapterRequired: false/g)?.length).toBe(4);
    expect(dispatcher).toContain('VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY');
    expect(dispatcher).toContain('TRADITIONAL_SCORING_EXECUTOR_KEY');
    expect(dispatcher).toContain('COMMODITY_EVIDENCE_EXECUTOR_KEY');
    expect(dispatcher).toContain('SOVEREIGN_BENCHMARK_EXECUTOR_KEY');
  });

  it('attaches UAI plus model identity/version/alias traceability to canonical results', () => {
    expect(dispatcher).toContain('assetId: asset.assetId');
    expect(dispatcher).toContain('modelId: model.modelId');
    expect(dispatcher).toContain('modelVersion: model.version');
    expect(dispatcher).toContain('modelAlias: model.alias');
    expect(dispatcher).toContain('executorKey: model.executorKey');
  });

  it('keeps raw-material structural scoring explicitly outside productive scoring authority', () => {
    expect(rawMaterialsRoutes).toContain("scoreSemantic: 'legacy-structural-research'");
    expect(rawMaterialsRoutes).toContain('canonical: false');
    expect(rawMaterialsRoutes).toContain('scoreEligible: false');
    expect(compatibilityRoutes).toContain("scoreSemantics: 'NON_PRODUCTION_SIMULATION'");
    expect(compatibilityRoutes).toContain('productionScoring: false');
  });
});

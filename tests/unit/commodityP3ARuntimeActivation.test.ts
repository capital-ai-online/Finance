import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CommodityCanonicalScoringDispatchResult } from '../../src/platform/Scoring';
import type { CommodityMarketEvidence } from '../../src/services/commodityMarketEvidence';
import { observeVerifiedCommodityScoreShadow } from '../../src/services/commodityShadowRuntimeBridge';

function marketEvidence(): CommodityMarketEvidence {
  return {
    version: 'commodity-market-evidence/1.0.0',
    symbol: 'CMD_GOLD_COMEX',
    provider: 'TwelveData',
    providerId: 'twelvedata',
    providerSymbol: 'XAU/USD',
    providerName: 'Gold Spot / US Dollar',
    points: Array.from({ length: 20 }, (_, index) => ({
      date: `2026-08-${String(index + 1).padStart(2, '0')}`,
      close: 2400 + index,
    })),
    observedAt: '2026-08-20T00:00:00.000Z',
    retrievedAt: '2026-08-26T18:10:00.000Z',
    sourcePath: 'MarketDataHistoryGateway/twelvedata',
    evidenceIds: Array.from({ length: 20 }, (_, index) => `commodity:twelvedata:XAUUSD:${index}`),
  };
}

function successfulDispatch(): CommodityCanonicalScoringDispatchResult {
  return {
    status: 'DISPATCHED',
    dispatcherVersion: 'canonical-scoring-dispatcher/1.1.0',
    asset: {
      contractVersion: 'uai/1.0.0',
      assetId: 'commodity:cmd_gold_comex',
      symbol: 'CMD_GOLD_COMEX',
      name: 'COMEX Gold Futures',
      assetClass: 'commodity',
      source: 'catalog',
    },
    model: {
      registryVersion: 'scoring-model-registry/1.0.0',
      modelId: 'commodity-evidence-scoring',
      version: '1.0.0',
      alias: 'champion',
      lifecycle: 'canonical',
      assetClasses: ['commodity'],
      executorKey: 'commodity-evidence',
      featureContractVersion: 'commodity-market-evidence/1.0.0',
      resultContractVersion: 'canonical-score-result/1.0.0',
      evidencePolicy: 'verified-required',
      scoreEligible: true,
      canonicalResultAdapterRequired: false,
    } as any,
    canonical: {
      status: 'READY',
      score: 7.4,
      final_score: 7.4,
      integrity: {} as any,
    },
    assessment: {} as any,
  };
}

describe('Commodity P3-A runtime activation bridge', () => {
  it('mirrors the exact already-acquired evidence and registered champion without provider I/O', () => {
    const evidence = marketEvidence();
    const calls: any[] = [];
    const orchestrator = {
      composeSourceBackedResearch(input: any) {
        calls.push(input);
        return {
          shadowRuntime: {
            status: 'RECORDED',
            observation: { observationId: 'commodity-shadow:sha256:test' },
            code: null,
            canonical: false,
            scoreEligible: false,
            rankingEligible: false,
            executionEligible: false,
          },
        } as any;
      },
    };

    const result = observeVerifiedCommodityScoreShadow({
      orchestrator,
      asset: {
        symbol: 'CMD_GOLD_COMEX',
        name: 'COMEX Gold Futures',
        instrumentKind: 'commodity-benchmark',
      },
      evidence,
      dispatch: successfulDispatch(),
      environment: 'test',
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].marketEvidence).toBe(evidence);
    expect(calls[0].instrumentKind).toBe('commodity-precious-metal-benchmark');
    expect(calls[0].shadowProviderBindings).toEqual([{
      providerId: 'twelvedata',
      capability: 'commodity-history',
      featureKeys: ['market.priceHistory'],
    }]);
    expect(calls[0].championComparator).toEqual({
      modelId: 'commodity-evidence-scoring',
      modelVersion: '1.0.0',
      status: 'READY',
      score: 7.4,
    });
    expect(result).toMatchObject({
      status: 'RECORDED',
      observationId: 'commodity-shadow:sha256:test',
      canonical: false,
      scoreEligible: false,
      rankingEligible: false,
      executionEligible: false,
    });
  });

  it('keeps the shadow comparator empty when canonical dispatch is not computable', () => {
    const calls: any[] = [];
    const orchestrator = {
      composeSourceBackedResearch(input: any) {
        calls.push(input);
        return {
          shadowRuntime: {
            status: 'RECORDED',
            observation: { observationId: 'commodity-shadow:sha256:failure-case' },
            code: null,
            canonical: false,
            scoreEligible: false,
            rankingEligible: false,
            executionEligible: false,
          },
        } as any;
      },
    };
    const failedDispatch = {
      status: 'SCORE_NOT_COMPUTABLE',
      dispatcherVersion: 'canonical-scoring-dispatcher/1.1.0',
      asset: successfulDispatch().asset,
      model: null,
      canonical: { status: 'SCORE_NOT_COMPUTABLE', score: null, final_score: null, integrity: {} },
      reason: 'test',
    } as CommodityCanonicalScoringDispatchResult;

    observeVerifiedCommodityScoreShadow({
      orchestrator,
      asset: { symbol: 'CMD_CORN_CBOT', name: 'CBOT Corn Futures' },
      evidence: { ...marketEvidence(), symbol: 'CMD_CORN_CBOT', providerSymbol: 'C_1' },
      dispatch: failedDispatch,
    });

    expect(calls[0].instrumentKind).toBe('commodity-agriculture-benchmark');
    expect(calls[0].championComparator).toBeNull();
  });

  it('fails closed with a stable code and never exposes arbitrary observer exceptions', () => {
    const orchestrator = {
      composeSourceBackedResearch() {
        throw new Error('provider secret detail should never escape');
      },
    };

    const result = observeVerifiedCommodityScoreShadow({
      orchestrator,
      asset: { symbol: 'CMD_GOLD_COMEX', name: 'COMEX Gold Futures' },
      evidence: marketEvidence(),
      dispatch: successfulDispatch(),
    });

    expect(result.status).toBe('BLOCKED');
    expect(result.code).toBe('COMMODITY_SHADOW_RUNTIME_BRIDGE_FAILED');
    expect(JSON.stringify(result)).not.toContain('secret detail');
  });

  it('binds the verified-score route to the bridge without a second evidence acquisition', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/routes/rawMaterialsRoutes.ts'), 'utf8');
    expect(source).toContain("import { observeVerifiedCommodityScoreShadow } from '../services/commodityShadowRuntimeBridge';");
    expect(source).toContain('const shadow = observeVerifiedCommodityScoreShadow({');
    expect(source.match(/const evidence = await getTwelveDataCommodityEvidence\(symbol, 90\);/g)).toHaveLength(1);
    expect(source).not.toContain('shadowEvidence = await getTwelveDataCommodityEvidence');
  });
});

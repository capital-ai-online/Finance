import type {
  RawMaterialsOrchestrator,
  RawMaterialsShadowRuntimeResult,
} from '../orchestrator/rawMaterialsOrchestrator';
import {
  classifyCommodityResearchInstrumentKind,
  type CommodityCanonicalScoringDispatchResult,
} from '../platform/Scoring';
import type { CommodityMarketEvidence } from './commodityMarketEvidence';

export const COMMODITY_SHADOW_RUNTIME_BRIDGE_VERSION = 'commodity-shadow-runtime-bridge/1.0.0' as const;

interface CommodityShadowAssetIdentity {
  readonly symbol: string;
  readonly name: string;
  readonly subtype?: string;
  readonly instrumentKind?: string;
}

export interface CommodityShadowRuntimeBridgeResult {
  readonly version: typeof COMMODITY_SHADOW_RUNTIME_BRIDGE_VERSION;
  readonly status: 'RECORDED' | 'BLOCKED';
  readonly code: string | null;
  readonly observationId: string | null;
  readonly canonical: false;
  readonly scoreEligible: false;
  readonly rankingEligible: false;
  readonly executionEligible: false;
}

function stableBridgeFailureCode(error: unknown): string {
  if (error instanceof Error && /^COMMODITY_[A-Z0-9_:-]+$/.test(error.message)) return error.message;
  return 'COMMODITY_SHADOW_RUNTIME_BRIDGE_FAILED';
}

function projectBridgeResult(shadow: RawMaterialsShadowRuntimeResult): CommodityShadowRuntimeBridgeResult {
  return Object.freeze({
    version: COMMODITY_SHADOW_RUNTIME_BRIDGE_VERSION,
    status: shadow.status,
    code: shadow.code,
    observationId: shadow.observation?.observationId ?? null,
    canonical: false as const,
    scoreEligible: false as const,
    rankingEligible: false as const,
    executionEligible: false as const,
  });
}

/**
 * P3-A production activation boundary for the existing verified commodity-score request.
 *
 * The caller supplies the exact CommodityMarketEvidence instance already acquired for the
 * canonical champion. This bridge performs no provider I/O and has no dispatcher/registry
 * mutation authority. Category classification reuses the canonical Commodity research taxonomy
 * helper upstream of the shadow observer; provider ownership is taken from the evidence contract.
 * Any shadow/composition failure is converted to a stable BLOCKED result so canonical scoring
 * remains non-interfering.
 */
export function observeVerifiedCommodityScoreShadow(input: Readonly<{
  orchestrator: Pick<RawMaterialsOrchestrator, 'composeSourceBackedResearch'>;
  asset: CommodityShadowAssetIdentity;
  evidence: CommodityMarketEvidence;
  dispatch: CommodityCanonicalScoringDispatchResult;
  environment?: string;
}>): CommodityShadowRuntimeBridgeResult {
  try {
    const instrumentKind = classifyCommodityResearchInstrumentKind(
      input.asset.symbol,
      input.asset.name,
      input.asset.instrumentKind,
    );
    const championComparator = input.dispatch.status === 'DISPATCHED'
      ? {
          modelId: input.dispatch.model.modelId,
          modelVersion: input.dispatch.model.version,
          status: input.dispatch.canonical.status,
          score: input.dispatch.canonical.score,
        }
      : null;

    const context = input.orchestrator.composeSourceBackedResearch({
      symbol: input.asset.symbol,
      name: input.asset.name,
      subtype: input.asset.subtype,
      instrumentKind,
      source: 'catalog',
      marketEvidence: input.evidence,
      shadowProviderBindings: [{
        providerId: input.evidence.providerId,
        capability: 'commodity-history',
        featureKeys: ['market.priceHistory'],
      }],
      championComparator,
      shadowEnvironment: input.environment,
    });

    return projectBridgeResult(context.shadowRuntime);
  } catch (error) {
    return Object.freeze({
      version: COMMODITY_SHADOW_RUNTIME_BRIDGE_VERSION,
      status: 'BLOCKED' as const,
      code: stableBridgeFailureCode(error),
      observationId: null,
      canonical: false as const,
      scoreEligible: false as const,
      rankingEligible: false as const,
      executionEligible: false as const,
    });
  }
}

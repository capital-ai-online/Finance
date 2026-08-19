import {
  CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
  SCORING_MODEL_REGISTRY_VERSION,
  type ScoringModelDescriptor,
  type ScoringModelResolution,
  type UniversalAssetIdentity,
} from './contracts';

const DEFAULT_MODELS: readonly ScoringModelDescriptor[] = [
  {
    registryVersion: SCORING_MODEL_REGISTRY_VERSION,
    modelId: 'crypto-technical-provenance',
    version: '0.6.3',
    alias: 'champion',
    lifecycle: 'canonical',
    assetClasses: ['crypto'],
    featureContractVersion: 'crypto-technical-features/0.6.3',
    resultContractVersion: CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
    evidencePolicy: 'verified-required',
    executorKey: 'verifiedCryptoTechnicalScoring.evaluateVerifiedCryptoTechnicalScore',
    priority: 100,
    canonicalResultAdapterRequired: false,
    notes: 'Current verified crypto path. Simulated/bootstrap values are not scoring evidence.',
  },
  {
    registryVersion: SCORING_MODEL_REGISTRY_VERSION,
    modelId: 'traditional-scoring',
    version: '2.1.0',
    alias: 'champion',
    lifecycle: 'canonical',
    assetClasses: ['stock', 'forex', 'index'],
    featureContractVersion: 'traditional-features/2.1.0',
    resultContractVersion: 'traditional-scoring-result/2.1.0',
    evidencePolicy: 'verified-required',
    executorKey: 'traditionalAssetScoring.TraditionalAssetScoringService',
    priority: 100,
    canonicalResultAdapterRequired: true,
    notes: 'Evidence-aware engine; route layer still has to adapt its legacy result into CanonicalScoreResult.',
  },
  {
    registryVersion: SCORING_MODEL_REGISTRY_VERSION,
    modelId: 'commodity-evidence-scoring',
    version: '1.0.0',
    alias: 'champion',
    lifecycle: 'canonical',
    assetClasses: ['commodity'],
    featureContractVersion: 'commodity-market-evidence/1.0.0',
    resultContractVersion: 'registry-evidence-score/1.0.0',
    evidencePolicy: 'verified-required',
    executorKey: 'registryRoutes.scoreCommodityMarketEvidence',
    priority: 100,
    canonicalResultAdapterRequired: true,
    notes: 'ADR-0033 evidence scoring; extraction from registryRoutes is a consolidation follow-up.',
  },
  {
    registryVersion: SCORING_MODEL_REGISTRY_VERSION,
    modelId: 'sovereign-benchmark-yield-scoring',
    version: '1.0.0',
    alias: 'champion',
    lifecycle: 'canonical',
    assetClasses: ['bond'],
    instrumentKinds: ['government-benchmark-yield'],
    featureContractVersion: 'sovereign-benchmark-yield-features/1.0.0',
    resultContractVersion: 'registry-evidence-score/1.0.0',
    evidencePolicy: 'verified-required',
    executorKey: 'registryRoutes.scoreSovereignBenchmarkEvidence',
    priority: 100,
    canonicalResultAdapterRequired: true,
    notes: 'Only approved sovereign benchmark yield instruments are supported. Individual bond scoring remains blocked by ADR-0022.',
  },
] as const;

function modelKey(model: ScoringModelDescriptor): string {
  return `${model.modelId}@${model.version}`;
}

function matches(model: ScoringModelDescriptor, asset: UniversalAssetIdentity): boolean {
  if (!model.assetClasses.includes(asset.assetClass)) return false;
  if (model.instrumentKinds && model.instrumentKinds.length > 0) {
    return Boolean(asset.instrumentKind && model.instrumentKinds.includes(asset.instrumentKind));
  }
  return true;
}

export class ScoringModelRegistry {
  private readonly models: readonly ScoringModelDescriptor[];

  constructor(models: readonly ScoringModelDescriptor[] = DEFAULT_MODELS) {
    const seen = new Set<string>();
    for (const model of models) {
      const key = modelKey(model);
      if (seen.has(key)) throw new Error(`SCORING_MODEL_REGISTRY_DUPLICATE:${key}`);
      seen.add(key);
    }
    this.models = [...models].map((model) => Object.freeze({ ...model }));
  }

  public list(): readonly ScoringModelDescriptor[] {
    return [...this.models];
  }

  public get(modelId: string, version?: string): ScoringModelDescriptor | null {
    return this.models.find((model) => model.modelId === modelId && (!version || model.version === version)) ?? null;
  }

  /**
   * Resolve only the canonical champion for a UAI asset. No fallback to legacy/challenger models is
   * permitted: ambiguity or missing support fails closed instead of silently selecting another engine.
   */
  public resolve(asset: UniversalAssetIdentity): ScoringModelResolution {
    const candidates = this.models
      .filter((model) => model.lifecycle === 'canonical' && model.alias === 'champion' && matches(model, asset))
      .sort((a, b) => b.priority - a.priority || modelKey(a).localeCompare(modelKey(b)));

    if (candidates.length === 0) {
      return {
        status: 'SCORE_NOT_COMPUTABLE',
        asset,
        reason: `No canonical champion scoring model is registered for ${asset.assetClass}${asset.instrumentKind ? `/${asset.instrumentKind}` : ''}.`,
      };
    }

    if (candidates.length > 1 && candidates[0].priority === candidates[1].priority) {
      return {
        status: 'SCORE_NOT_COMPUTABLE',
        asset,
        reason: `Ambiguous canonical scoring model routing for ${asset.assetId}; equal-priority champions: ${candidates
          .filter((model) => model.priority === candidates[0].priority)
          .map(modelKey)
          .join(', ')}.`,
      };
    }

    return { status: 'RESOLVED', asset, model: candidates[0] };
  }
}

export const scoringModelRegistry = new ScoringModelRegistry();
export const DEFAULT_SCORING_MODELS = DEFAULT_MODELS;

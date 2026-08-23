import {
  CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
  LEGACY_CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
  SCORING_MODEL_REGISTRY_VERSION,
  type ScoringModelDescriptor,
  type ScoringModelResolution,
  type UniversalAssetIdentity,
} from './contracts';
import {
  COMMODITY_EVIDENCE_EXECUTOR_KEY,
  SOVEREIGN_BENCHMARK_EXECUTOR_KEY,
  TRADITIONAL_SCORING_EXECUTOR_KEY,
} from './ScoringExecutorAdapters';
import {
  CRYPTO_DEFI_RESEARCH_FEATURE_CONTRACT_VERSION,
  CRYPTO_MEME_RESEARCH_FEATURE_CONTRACT_VERSION,
} from './CryptoResearchModelContracts';
import { EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION } from './EquityModelContracts';

export const VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY =
  'verifiedCryptoTechnicalScoring.evaluateVerifiedCryptoTechnicalScore' as const;
export const RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY = 'research-only:not-executable' as const;

const DEFAULT_MODELS: readonly ScoringModelDescriptor[] = [
  {
    registryVersion: SCORING_MODEL_REGISTRY_VERSION,
    modelId: 'crypto-technical-provenance',
    version: '0.7.0',
    alias: 'champion',
    lifecycle: 'canonical',
    assetClasses: ['crypto'],
    featureContractVersion: 'crypto-technical-features/0.7.0',
    resultContractVersion: CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
    evidencePolicy: 'verified-required',
    executorKey: VERIFIED_CRYPTO_TECHNICAL_EXECUTOR_KEY,
    priority: 100,
    scoreEligible: true,
    canonicalResultAdapterRequired: false,
    notes: 'Verified crypto champion. Simulated/bootstrap values and caller classification are not scoring evidence.',
  },
  {
    registryVersion: SCORING_MODEL_REGISTRY_VERSION,
    modelId: 'crypto-meme-integrity',
    version: '0.3.0',
    alias: 'challenger',
    lifecycle: 'challenger',
    assetClasses: ['crypto'],
    featureContractVersion: CRYPTO_MEME_RESEARCH_FEATURE_CONTRACT_VERSION,
    resultContractVersion: CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
    evidencePolicy: 'research-only',
    executorKey: RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY,
    priority: 10,
    scoreEligible: false,
    canonicalResultAdapterRequired: true,
    notes: 'Source-backed Meme research challenger with deterministic research evaluator, holder/rug/social/execution feature inventory and hard gates. Still non-executable: productive promotion requires verified provider coverage, backtesting, correlation review and explicit Owner approval.',
  },
  {
    registryVersion: SCORING_MODEL_REGISTRY_VERSION,
    modelId: 'crypto-defi-fundamental',
    version: '0.3.0',
    alias: 'challenger',
    lifecycle: 'challenger',
    assetClasses: ['crypto'],
    featureContractVersion: CRYPTO_DEFI_RESEARCH_FEATURE_CONTRACT_VERSION,
    resultContractVersion: CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
    evidencePolicy: 'research-only',
    executorKey: RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY,
    priority: 10,
    scoreEligible: false,
    canonicalResultAdapterRequired: true,
    notes: 'Source-backed DeFi research challenger with deterministic research evaluator across utilization, revenue, liquidity, contract security, oracle, tokenomics, governance and ecosystem factors. DeFiLlama stays evidence-only; productive promotion remains blocked pending verified coverage/backtesting.',
  },
  {
    registryVersion: SCORING_MODEL_REGISTRY_VERSION,
    modelId: 'equity-multifactor',
    version: '0.2.0',
    alias: 'challenger',
    lifecycle: 'challenger',
    assetClasses: ['stock'],
    featureContractVersion: EQUITY_RESEARCH_FEATURE_CONTRACT_VERSION,
    resultContractVersion: CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
    evidencePolicy: 'research-only',
    executorKey: RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY,
    priority: 20,
    scoreEligible: false,
    canonicalResultAdapterRequired: true,
    notes: 'Equity-only multi-factor research challenger with point-in-time SEC filing evidence, comparable filing growth/share-count features, family-level anti-correlation and profile-specific research weights. Productive stock routing remains traditional-scoring until peer normalization, backtesting and explicit Owner-approved atomic promotion.',
  },
  {
    registryVersion: SCORING_MODEL_REGISTRY_VERSION,
    modelId: 'traditional-scoring',
    version: '2.1.0',
    alias: 'champion',
    lifecycle: 'canonical',
    assetClasses: ['stock', 'forex', 'index'],
    featureContractVersion: 'traditional-features/2.1.0',
    resultContractVersion: LEGACY_CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
    evidencePolicy: 'verified-required',
    executorKey: TRADITIONAL_SCORING_EXECUTOR_KEY,
    priority: 100,
    scoreEligible: true,
    canonicalResultAdapterRequired: false,
    notes: 'Evidence-aware stock/forex/index model normalized by the C3 CanonicalResultAdapter. Integrity 1.0.0 retained until its dedicated migration.',
  },
  {
    registryVersion: SCORING_MODEL_REGISTRY_VERSION,
    modelId: 'commodity-evidence-scoring',
    version: '1.0.0',
    alias: 'champion',
    lifecycle: 'canonical',
    assetClasses: ['commodity'],
    featureContractVersion: 'commodity-market-evidence/1.0.0',
    resultContractVersion: LEGACY_CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
    evidencePolicy: 'verified-required',
    executorKey: COMMODITY_EVIDENCE_EXECUTOR_KEY,
    priority: 100,
    scoreEligible: true,
    canonicalResultAdapterRequired: false,
    notes: 'ADR-0033 verified commodity market-evidence scorer executed only behind ScoringDispatcher. Integrity 1.0.0 retained until its dedicated migration.',
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
    resultContractVersion: LEGACY_CANONICAL_SCORE_RESULT_CONTRACT_VERSION,
    evidencePolicy: 'verified-required',
    executorKey: SOVEREIGN_BENCHMARK_EXECUTOR_KEY,
    priority: 100,
    scoreEligible: true,
    canonicalResultAdapterRequired: false,
    notes: 'Only approved sovereign benchmark yield instruments are supported. Individual bond scoring remains blocked by ADR-0022. Integrity 1.0.0 retained until dedicated migration.',
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

function routingScope(model: ScoringModelDescriptor): readonly string[] {
  if (model.instrumentKinds && model.instrumentKinds.length > 0) {
    return model.assetClasses.flatMap((assetClass) => model.instrumentKinds!.map((instrumentKind) => `${assetClass}/${instrumentKind}`));
  }
  return model.assetClasses.map((assetClass) => `${assetClass}/*`);
}

export class ScoringModelRegistry {
  private readonly models: readonly ScoringModelDescriptor[];

  constructor(models: readonly ScoringModelDescriptor[] = DEFAULT_MODELS) {
    const seen = new Set<string>();
    const canonicalScopes = new Map<string, string>();
    for (const model of models) {
      const key = modelKey(model);
      if (seen.has(key)) throw new Error(`SCORING_MODEL_REGISTRY_DUPLICATE:${key}`);
      seen.add(key);

      if (model.lifecycle === 'canonical' && model.alias === 'champion') {
        if (model.scoreEligible === false) throw new Error(`SCORING_MODEL_REGISTRY_CANONICAL_NOT_SCORE_ELIGIBLE:${key}`);
        for (const scope of routingScope(model)) {
          const existing = canonicalScopes.get(scope);
          if (existing) throw new Error(`SCORING_MODEL_REGISTRY_AMBIGUOUS_SCOPE:${scope}:${existing}:${key}`);
          canonicalScopes.set(scope, key);
        }
      }
      if (model.lifecycle === 'challenger' && model.scoreEligible !== false) {
        throw new Error(`SCORING_MODEL_REGISTRY_CHALLENGER_SCORE_ELIGIBLE:${key}`);
      }
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
      .filter((model) => model.lifecycle === 'canonical' && model.alias === 'champion' && model.scoreEligible !== false && matches(model, asset))
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

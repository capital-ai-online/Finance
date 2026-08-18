import type { MarketDataAssetClass } from '../MarketData/contracts';

/**
 * SC-2 Universal Asset Interface (UAI) foundation.
 *
 * This contract is intentionally identity-only. Market observations, scores and AI-derived
 * research never become part of asset identity; they enter through evidence/feature contracts.
 */
export const UNIVERSAL_ASSET_CONTRACT_VERSION = 'uai/1.0.0' as const;
export const SCORING_MODEL_REGISTRY_VERSION = 'scoring-model-registry/1.0.0' as const;
export const CANONICAL_SCORE_RESULT_CONTRACT_VERSION = 'scoring-integrity/1.0.0' as const;

export type UniversalAssetClass = Exclude<MarketDataAssetClass, 'macro'>;
export type UniversalAssetSource = 'registry' | 'catalog' | 'request';

export const SCORABLE_ASSET_CLASSES = [
  'crypto',
  'stock',
  'forex',
  'commodity',
  'index',
  'bond',
] as const satisfies readonly UniversalAssetClass[];

export interface UniversalAssetIdentity {
  contractVersion: typeof UNIVERSAL_ASSET_CONTRACT_VERSION;
  /** Stable cross-layer identity. Format: <assetClass>:<normalizedSymbol>. */
  assetId: string;
  symbol: string;
  assetClass: UniversalAssetClass;
  name?: string;
  subtype?: string;
  instrumentKind?: string;
  source: UniversalAssetSource;
  /** Provider-specific symbols are identity mappings only; their presence is not market evidence. */
  providerSymbols?: Readonly<Record<string, string>>;
}

export type ScoringModelLifecycle = 'canonical' | 'challenger' | 'legacy' | 'blocked';
export type ScoringModelAlias = 'champion' | 'challenger' | 'legacy' | 'blocked';
export type ScoringEvidencePolicy = 'verified-required' | 'research-only' | 'unsupported';

/**
 * Metadata-only registry entry. Execution remains in domain adapters/services so the registry does
 * not become another scoring engine. `executorKey` is a stable routing key, not dynamic code loading.
 */
export interface ScoringModelDescriptor {
  registryVersion: typeof SCORING_MODEL_REGISTRY_VERSION;
  modelId: string;
  version: string;
  alias: ScoringModelAlias;
  lifecycle: ScoringModelLifecycle;
  assetClasses: readonly UniversalAssetClass[];
  instrumentKinds?: readonly string[];
  featureContractVersion: string;
  resultContractVersion: string;
  evidencePolicy: ScoringEvidencePolicy;
  executorKey: string;
  priority: number;
  /** True while an existing engine still needs wrapping into CanonicalScoreResult. */
  canonicalResultAdapterRequired: boolean;
  notes?: string;
}

export type ScoringModelResolution =
  | {
      status: 'RESOLVED';
      asset: UniversalAssetIdentity;
      model: ScoringModelDescriptor;
    }
  | {
      status: 'SCORE_NOT_COMPUTABLE';
      asset: UniversalAssetIdentity;
      reason: string;
    };

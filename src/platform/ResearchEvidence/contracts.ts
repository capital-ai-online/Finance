import type { UniversalAssetIdentity } from '../Scoring/contracts';

export const RESEARCH_EVIDENCE_DISCOVERY_CONTRACT_VERSION = 'research-evidence-discovery/1.0.0' as const;
export const RESEARCH_EVIDENCE_VALIDATION_CONTRACT_VERSION = 'research-evidence-validation/1.1.0' as const;
export const RESEARCH_EVIDENCE_ADAPTER_CONTRACT_VERSION = 'research-evidence-adapter/1.1.0' as const;

export type ResearchDiscoveryProvider = 'gemini' | 'anthropic' | 'openai' | 'manual';
export type ResearchDiscoveryMethod = 'google-search' | 'url-context' | 'structured-extraction' | 'manual';
export type ResearchSourceClass =
  | 'regulated-primary'
  | 'official-primary'
  | 'provider-primary'
  | 'secondary'
  | 'unknown';

export type ResearchAllowedUse = 'research' | 'extraction' | 'scoring-evidence-after-validation';

export interface ResearchCitation {
  url: string;
  title?: string;
  startIndex?: number;
  endIndex?: number;
}

export type ResearchClaimValue = string | number | boolean | null;

export interface ResearchClaim {
  field: string;
  value: ResearchClaimValue;
  unit?: string;
  observedAt?: string;
  extractionConfidence?: number;
}

/**
 * Discovery output only. A discovery is never financial scoring evidence by itself.
 * Promotion into a score-bearing feature contract requires a separate validated-evidence step.
 */
export interface ResearchEvidenceDiscovery {
  contractVersion: typeof RESEARCH_EVIDENCE_DISCOVERY_CONTRACT_VERSION;
  discoveryId: string;
  correlationId: string;
  asset: UniversalAssetIdentity;
  status: 'AI_DISCOVERED_EVIDENCE';
  scoreEligible: false;
  discoveredAt: string;
  discoveredBy: {
    provider: ResearchDiscoveryProvider;
    model?: string;
    methods: readonly ResearchDiscoveryMethod[];
  };
  source: {
    url: string;
    hostname: string;
    title?: string;
    sourceClass: ResearchSourceClass;
  };
  citation: ResearchCitation;
  claim: ResearchClaim;
}

export interface ResearchEvidenceSourcePolicyEntry {
  hostname: string;
  sourceClass: Exclude<ResearchSourceClass, 'unknown'>;
  includeSubdomains?: boolean;
  allowedUses: readonly ResearchAllowedUse[];
  note?: string;
}

export interface ResearchEvidenceSourcePolicy {
  policyVersion: string;
  entries: readonly ResearchEvidenceSourcePolicyEntry[];
}

/**
 * Even validated discovery output remains non-score-bearing in this layer. A later feature-specific
 * Evidence Promotion component must bind source + field + freshness + licence/policy requirements
 * before a ScoringEvidenceRef can be created.
 */
export interface ResearchEvidenceValidationResult {
  contractVersion: typeof RESEARCH_EVIDENCE_VALIDATION_CONTRACT_VERSION;
  discoveryId: string;
  status: 'VALIDATED_PRIMARY_SOURCE' | 'RESEARCH_ONLY' | 'REJECTED';
  sourceClass: ResearchSourceClass;
  scoreEligible: false;
  allowedUses: readonly ResearchAllowedUse[];
  reasons: readonly string[];
  validatedAt: string;
}

export interface ResearchEvidenceDiscoveryRequest {
  asset: UniversalAssetIdentity;
  correlationId: string;
  fields: readonly string[];
  query: string;
  urls?: readonly string[];
}

export interface ResearchEvidenceDiscoveryResult {
  adapterId: string;
  adapterVersion: string;
  status: 'DISCOVERED' | 'UNAVAILABLE' | 'REJECTED';
  provider: ResearchDiscoveryProvider;
  model?: string;
  discoveries: readonly ResearchEvidenceDiscovery[];
  diagnostics: readonly string[];
}

export interface ResearchEvidenceAdapterDescriptor {
  contractVersion: typeof RESEARCH_EVIDENCE_ADAPTER_CONTRACT_VERSION;
  id: string;
  version: string;
  provider: ResearchDiscoveryProvider;
  enabledByDefault: false;
  capabilities: readonly ResearchDiscoveryMethod[];
  /** Initial re-entry boundary: model-requested internal actions are not permitted. */
  functionCallingEnabled: false;
}

export interface ResearchEvidenceAdapter {
  readonly descriptor: ResearchEvidenceAdapterDescriptor;
  discover(request: ResearchEvidenceDiscoveryRequest): Promise<ResearchEvidenceDiscoveryResult>;
}

import type { ScoringModelDescriptor } from '../platform/Scoring/contracts';
import type { CanonicalScoreResult } from '../types/scoringIntegrity';
import type { CryptoScoringInputs } from '../types/crypto';
import type { VerifiedFieldProvenance } from './cryptoSnapshotProvider';

export interface ScoringModelLineageRef {
  registryVersion: string;
  modelId: string;
  version: string;
  alias: string;
  lifecycle: string;
  executorKey: string;
  featureContractVersion: string;
  resultContractVersion: string;
  evidencePolicy: string;
}

export interface ScoringLineage {
  correlationId: string;
  assetId: string;
  model?: ScoringModelLineageRef;
  providers: string[];
  retrieval: {
    history?: { cacheMode: string; degraded: boolean };
    snapshot?: { cacheMode: string; degraded: boolean };
  };
  features: string[];
  provenanceFields: string[];
  evidenceIds: string[];
  featureVersion: string;
  scoringVersion: string;
  status: CanonicalScoreResult['status'];
  generatedAt: string;
}

export function buildScoringLineage(input: {
  correlationId: string;
  assetId: string;
  canonical: CanonicalScoreResult;
  scoringInputs: CryptoScoringInputs;
  fieldProvenance: VerifiedFieldProvenance[];
  model?: ScoringModelDescriptor;
  providerState?: {
    history?: { cacheMode: string; degraded: boolean };
    snapshot?: { cacheMode: string; degraded: boolean };
  };
}): ScoringLineage {
  const features = Object.entries(input.scoringInputs)
    .filter(([key, value]) => key !== 'coin' && typeof value === 'number' && Number.isFinite(value))
    .map(([key]) => key)
    .sort();

  return {
    correlationId: input.correlationId,
    assetId: input.assetId,
    model: input.model ? {
      registryVersion: input.model.registryVersion,
      modelId: input.model.modelId,
      version: input.model.version,
      alias: input.model.alias,
      lifecycle: input.model.lifecycle,
      executorKey: input.model.executorKey,
      featureContractVersion: input.model.featureContractVersion,
      resultContractVersion: input.model.resultContractVersion,
      evidencePolicy: input.model.evidencePolicy,
    } : undefined,
    providers: [...input.canonical.integrity.providers],
    retrieval: {
      history: input.providerState?.history ? { ...input.providerState.history } : undefined,
      snapshot: input.providerState?.snapshot ? { ...input.providerState.snapshot } : undefined,
    },
    features,
    provenanceFields: input.fieldProvenance.map((item) => item.field).sort(),
    evidenceIds: input.canonical.integrity.evidence.map((item) => item.id),
    featureVersion: input.canonical.integrity.featureVersion,
    scoringVersion: input.canonical.integrity.scoringVersion,
    status: input.canonical.status,
    generatedAt: new Date().toISOString(),
  };
}

import type { CanonicalScoreResult } from '../types/scoringIntegrity';
import type { CryptoScoringInputs } from '../types/crypto';
import type { VerifiedFieldProvenance } from './cryptoSnapshotProvider';

export interface ScoringLineage {
  correlationId: string;
  assetId: string;
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

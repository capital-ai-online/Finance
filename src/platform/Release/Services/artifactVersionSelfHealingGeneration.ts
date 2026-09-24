import crypto from 'node:crypto';

import type {
  ArtifactVersionInventory,
  ArtifactVersionInventoryEntry,
} from './artifactVersionInventory';
import type {
  ArtifactVersionGenerationChange,
  EvidenceGenerationIdentity,
} from '../../Supervisor/selfHealingContract';

export const ARTIFACT_VERSION_SELF_HEALING_GENERATION_VERSION =
  'artifact-version-self-healing-generation/1.0.0' as const;

export type ArtifactVersionPrGenerationIdentity =
  Extract<EvidenceGenerationIdentity, { kind: 'PR' }>;

export interface ArtifactVersionPrGenerationInput {
  repository: string;
  prNumber: number;
  headSha: string;
  baseSha: string;
  currentMainSha: string;
  productionSha: string;
  controlPlaneVersion: string;
  controlPlaneGeneration: string;
  prTemplateVersion: string;
  platformVersionCadenceGeneration: string;
  baseInventory: ArtifactVersionInventory;
  headInventory: ArtifactVersionInventory;
}

function sha256(value: string): string {
  return 'sha256:' + crypto.createHash('sha256').update(value).digest('hex');
}

function entryIdentity(entry: ArtifactVersionInventoryEntry): string {
  return sha256(JSON.stringify({
    path: entry.path,
    domain: entry.domain,
    semanticVersion: entry.semanticVersion,
    blobSha: entry.blobSha,
    consumerFingerprint: entry.consumerFingerprint,
  }));
}

export function projectChangedArtifactDomainVersions(
  baseInventory: ArtifactVersionInventory,
  headInventory: ArtifactVersionInventory,
): ArtifactVersionGenerationChange[] {
  const before = new Map(baseInventory.entries.map((entry) => [entry.path, entry]));
  const after = new Map(headInventory.entries.map((entry) => [entry.path, entry]));
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort();

  const changes: ArtifactVersionGenerationChange[] = [];
  for (const repoPath of paths) {
    const previous = before.get(repoPath);
    const current = after.get(repoPath);
    const identityBefore = previous ? entryIdentity(previous) : null;
    const identityAfter = current ? entryIdentity(current) : null;
    if (identityBefore === identityAfter) continue;

    changes.push({
      path: repoPath,
      domainBefore: previous?.domain ?? null,
      domainAfter: current?.domain ?? null,
      semanticVersionBefore: previous?.semanticVersion ?? null,
      semanticVersionAfter: current?.semanticVersion ?? null,
      identityBefore,
      identityAfter,
    });
  }

  return changes;
}

export function buildArtifactVersionBoundPrGeneration(
  input: ArtifactVersionPrGenerationInput,
): ArtifactVersionPrGenerationIdentity {
  const changedArtifactDomainVersions = projectChangedArtifactDomainVersions(
    input.baseInventory,
    input.headInventory,
  );

  const generationPayload = {
    repository: input.repository,
    prNumber: input.prNumber,
    headSha: input.headSha,
    baseSha: input.baseSha,
    currentMainSha: input.currentMainSha,
    productionSha: input.productionSha,
    controlPlaneVersion: input.controlPlaneVersion,
    controlPlaneGeneration: input.controlPlaneGeneration,
    prTemplateVersion: input.prTemplateVersion,
    platformVersionCadenceGeneration: input.platformVersionCadenceGeneration,
    artifactVersionInventoryHash: input.headInventory.contentInventoryHash,
    changedArtifactDomainVersions,
  };

  return {
    kind: 'PR',
    ...generationPayload,
    generationDigest: sha256(JSON.stringify(generationPayload)),
  };
}

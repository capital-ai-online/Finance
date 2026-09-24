import { describe, expect, it } from 'vitest';

import type {
  ArtifactVersionInventory,
  ArtifactVersionInventoryEntry,
} from '../../src/platform/Release/Services/artifactVersionInventory';
import {
  buildArtifactVersionBoundPrGeneration,
  projectChangedArtifactDomainVersions,
} from '../../src/platform/Release/Services/artifactVersionSelfHealingGeneration';
import { validateVerificationEvidence } from '../../src/platform/Supervisor/selfHealingContract';

const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);
const SHA_C = 'c'.repeat(40);
const SHA_D = 'd'.repeat(40);

function entry(
  path: string,
  blobSha: string,
  semanticVersion: string | null,
): ArtifactVersionInventoryEntry {
  return {
    path,
    gitMode: '100644',
    blobSha,
    domain: 'SEMANTIC_CONTRACT_VERSIONED',
    semanticVersion,
    declaredVersions: semanticVersion ? [semanticVersion] : [],
    signals: [],
    consumerFingerprint: null,
    classificationReason: 'fixture',
  };
}

function inventory(
  contentInventoryHash: string,
  entries: ArtifactVersionInventoryEntry[],
): ArtifactVersionInventory {
  return {
    schemaVersion: '1.1.0',
    generatorVersion: 'artifact-version-inventory/1.1.0',
    sourceHead: SHA_A,
    platformVersionAuthority: { path: 'package.json', version: '0.6.4' },
    counts: {
      PLATFORM_VERSION_AUTHORITY: 0,
      PLATFORM_VERSION_MIRROR: 0,
      SEMANTIC_CONTRACT_VERSIONED: entries.length,
      SCHEMA_VERSIONED: 0,
      DERIVED_CONTENT_IDENTITY: 0,
      GENERATED_OR_EPHEMERAL: 0,
      UNCLASSIFIED_REQUIRES_OWNER_REVIEW: 0,
    },
    entries,
    unclassifiedPaths: [],
    consumerEdges: [],
    consumerGraphAmbiguities: [],
    contentInventoryHash,
  };
}

function build(
  baseInventory: ArtifactVersionInventory,
  headInventory: ArtifactVersionInventory,
) {
  return buildArtifactVersionBoundPrGeneration({
    repository: 'capital-ai-online/Finance',
    prNumber: 1443,
    headSha: SHA_A,
    baseSha: SHA_B,
    currentMainSha: SHA_B,
    productionSha: SHA_C,
    controlPlaneVersion: '4.11.0',
    controlPlaneGeneration: 'control-plane/4.11.0@main',
    prTemplateVersion: '1.8.0',
    platformVersionCadenceGeneration: 'platform/0.6.4@ordinal-7',
    baseInventory,
    headInventory,
  });
}

describe('VAI-03 artifact-version Self-Healing generation bridge', () => {
  it('emits deterministic artifact inventory identity into the existing PR generation', () => {
    const base = inventory(`sha256:${'1'.repeat(64)}`, [
      entry('.github/pull_request_template.md', SHA_A, '1.8.0'),
    ]);
    const head = inventory(`sha256:${'2'.repeat(64)}`, [
      entry('.github/pull_request_template.md', SHA_D, '1.8.0'),
    ]);

    const first = build(base, head);
    const second = build(base, head);

    expect(second).toEqual(first);
    expect(first.artifactVersionInventoryHash).toBe(head.contentInventoryHash);
    expect(first.generationDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(first.changedArtifactDomainVersions).toHaveLength(1);
    expect(first.changedArtifactDomainVersions[0]).toMatchObject({
      path: '.github/pull_request_template.md',
      domainBefore: 'SEMANTIC_CONTRACT_VERSIONED',
      domainAfter: 'SEMANTIC_CONTRACT_VERSIONED',
      semanticVersionBefore: '1.8.0',
      semanticVersionAfter: '1.8.0',
    });
    expect(first.changedArtifactDomainVersions[0].identityBefore)
      .not.toBe(first.changedArtifactDomainVersions[0].identityAfter);
  });

  it('changes the Self-Healing generation on same-version structural drift', () => {
    const unchanged = inventory(`sha256:${'1'.repeat(64)}`, [
      entry('.github/pull_request_template.md', SHA_A, '1.8.0'),
    ]);
    const structuralDrift = inventory(`sha256:${'2'.repeat(64)}`, [
      entry('.github/pull_request_template.md', SHA_D, '1.8.0'),
    ]);

    const before = build(unchanged, unchanged);
    const after = build(unchanged, structuralDrift);

    expect(after.changedArtifactDomainVersions[0].semanticVersionBefore).toBe('1.8.0');
    expect(after.changedArtifactDomainVersions[0].semanticVersionAfter).toBe('1.8.0');
    expect(after.artifactVersionInventoryHash).not.toBe(before.artifactVersionInventoryHash);
    expect(after.generationDigest).not.toBe(before.generationDigest);
  });

  it('sorts changed artifact-domain evidence independently of inventory entry order', () => {
    const before = inventory(`sha256:${'3'.repeat(64)}`, [
      entry('z-contract.ts', SHA_A, '1.0.0'),
      entry('a-contract.ts', SHA_B, '2.0.0'),
    ]);
    const after = inventory(`sha256:${'4'.repeat(64)}`, [
      entry('a-contract.ts', SHA_C, '2.0.0'),
      entry('z-contract.ts', SHA_D, '1.0.0'),
    ]);

    expect(projectChangedArtifactDomainVersions(before, after).map((change) => change.path))
      .toEqual(['a-contract.ts', 'z-contract.ts']);
  });

  it('produces PR generation evidence accepted by the existing Self-Healing validator', () => {
    const base = inventory(`sha256:${'5'.repeat(64)}`, [
      entry('contract.ts', SHA_A, '1.0.0'),
    ]);
    const head = inventory(`sha256:${'6'.repeat(64)}`, [
      entry('contract.ts', SHA_D, '1.0.0'),
    ]);
    const generation = build(base, head);

    const result = validateVerificationEvidence({
      schema: 'self-healing-evidence/1.1.0',
      evidenceId: 'VAI03-TEST',
      generation,
      source: {
        authority: 'vitest',
        ref: 'tests/unit/artifactVersionSelfHealingGeneration.test.ts',
        observedAt: '2026-09-24T21:20:00.000Z',
      },
      integrity: {
        inputDigest: `sha256:${'7'.repeat(64)}`,
        resultDigest: `sha256:${'8'.repeat(64)}`,
        recordDigest: `sha256:${'9'.repeat(64)}`,
      },
      reproducible: true,
      current: true,
      generationBound: true,
      sourceBound: true,
      integrityValid: true,
      readback: { required: true, verified: true },
      contradictionFree: true,
      requiredAssurance: [],
      assurance: {},
    });

    expect(result).toEqual({ valid: true, issues: [] });
  });
});

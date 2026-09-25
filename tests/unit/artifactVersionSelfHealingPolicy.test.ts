import { describe, expect, it } from 'vitest';

import { SELF_HEALING_CONTRACT_VERSION } from '../../src/platform/Supervisor/selfHealingContract';
import {
  ARTIFACT_VERSION_SELF_HEALING_POLICY_VERSION,
  resolveArtifactVersionSelfHealingRoute,
} from '../../src/platform/Release/Services/artifactVersionSelfHealingPolicy';

const HASH = `sha256:${'a'.repeat(64)}`;

function evidence(
  findingId:
    | 'ARTIFACT_VERSION_CONSUMER_DRIFT'
    | 'ARTIFACT_VERSION_DECLARATION_DRIFT'
    | 'ARTIFACT_VERSION_UNCLASSIFIED',
  overrides: Partial<Parameters<typeof resolveArtifactVersionSelfHealingRoute>[0]> = {},
) {
  return {
    findingId,
    artifactVersionInventoryHash: HASH,
    affectedPaths: ['scripts/pr/lib.mjs'],
    deterministic: true,
    ownerResolved: true,
    consumerGraphAmbiguities: 0,
    ...overrides,
  };
}

describe('VAI-04 Artifact-Version Self-Healing policy', () => {
  it('does not mutate the independently assured core Self-Healing generation', () => {
    expect(SELF_HEALING_CONTRACT_VERSION).toBe('self-healing-contract/1.2.0');
    expect(ARTIFACT_VERSION_SELF_HEALING_POLICY_VERSION)
      .toBe('artifact-version-self-healing-policy/1.0.0');
  });

  it.each([
    'ARTIFACT_VERSION_CONSUMER_DRIFT',
    'ARTIFACT_VERSION_DECLARATION_DRIFT',
  ] as const)('delegates deterministic %s to the existing bounded repository projection writer', (findingId) => {
    expect(resolveArtifactVersionSelfHealingRoute(evidence(findingId))).toMatchObject({
      findingId,
      selfHealingFindingClass: 'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT',
      actionId: 'RECONCILE_REPOSITORY_PROJECTION',
      failClosed: false,
      requiredCapability: 'repository.pr.autofix',
      maxAttempts: 1,
    });
  });

  it('keeps unclassified artifacts observation-only even with otherwise valid evidence', () => {
    expect(resolveArtifactVersionSelfHealingRoute(evidence('ARTIFACT_VERSION_UNCLASSIFIED'))).toMatchObject({
      selfHealingFindingClass: 'SECURITY_OR_POLICY_BLOCKED',
      actionId: 'OBSERVE_ONLY',
      failClosed: true,
      requiredCapability: null,
      maxAttempts: 1,
      reason: 'ARTIFACT_VERSION_UNCLASSIFIED_REQUIRES_OWNER_REVIEW',
    });
  });

  it.each([
    [{ artifactVersionInventoryHash: 'invalid' }, 'ARTIFACT_VERSION_INVENTORY_HASH_INVALID'],
    [{ affectedPaths: [] }, 'ARTIFACT_VERSION_AFFECTED_PATH_REQUIRED'],
    [{ consumerGraphAmbiguities: 1 }, 'ARTIFACT_VERSION_CONSUMER_GRAPH_AMBIGUOUS'],
    [{ deterministic: false }, 'ARTIFACT_VERSION_EVIDENCE_NOT_DETERMINISTIC'],
    [{ ownerResolved: false }, 'ARTIFACT_VERSION_OWNER_UNRESOLVED'],
  ] as const)('fails closed to OBSERVE_ONLY for incomplete evidence %#', (overrides, reason) => {
    expect(resolveArtifactVersionSelfHealingRoute(
      evidence('ARTIFACT_VERSION_CONSUMER_DRIFT', overrides),
    )).toMatchObject({
      selfHealingFindingClass: 'SECURITY_OR_POLICY_BLOCKED',
      actionId: 'OBSERVE_ONLY',
      failClosed: true,
      reason,
    });
  });

  it('normalizes and strictly sorts affected repository paths without expanding scope', () => {
    const result = resolveArtifactVersionSelfHealingRoute(evidence(
      'ARTIFACT_VERSION_DECLARATION_DRIFT',
      { affectedPaths: ['z.ts', 'a.ts', 'z.ts', '../escape.ts', '/absolute.ts'] },
    ));
    expect(result.affectedPaths).toEqual(['a.ts', 'z.ts']);
  });
});

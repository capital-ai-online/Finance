import {
  getRemediationAction,
  getRemediationPolicy,
  type FindingClass,
  type RemediationActionId,
} from '../../Supervisor/selfHealingContract';

export const ARTIFACT_VERSION_SELF_HEALING_POLICY_VERSION =
  'artifact-version-self-healing-policy/1.0.0' as const;

export type ArtifactVersionFindingId =
  | 'ARTIFACT_VERSION_CONSUMER_DRIFT'
  | 'ARTIFACT_VERSION_DECLARATION_DRIFT'
  | 'ARTIFACT_VERSION_UNCLASSIFIED';

export interface ArtifactVersionFindingEvidence {
  findingId: ArtifactVersionFindingId;
  artifactVersionInventoryHash: string;
  affectedPaths: readonly string[];
  deterministic: boolean;
  ownerResolved: boolean;
  consumerGraphAmbiguities?: number;
  evidenceRef?: string;
}

export interface ArtifactVersionSelfHealingRoute {
  schema: typeof ARTIFACT_VERSION_SELF_HEALING_POLICY_VERSION;
  findingId: ArtifactVersionFindingId;
  selfHealingFindingClass: FindingClass;
  actionId: RemediationActionId;
  affectedPaths: string[];
  failClosed: boolean;
  requiredCapability: string | null;
  maxAttempts: number;
  reason: string;
}

const SHA256 = /^sha256:[0-9a-f]{64}$/;

const ROUTES: Readonly<Record<
  ArtifactVersionFindingId,
  { findingClass: FindingClass; actionId: RemediationActionId }
>> = Object.freeze({
  ARTIFACT_VERSION_CONSUMER_DRIFT: Object.freeze({
    findingClass: 'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT',
    actionId: 'RECONCILE_REPOSITORY_PROJECTION',
  }),
  ARTIFACT_VERSION_DECLARATION_DRIFT: Object.freeze({
    findingClass: 'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT',
    actionId: 'RECONCILE_REPOSITORY_PROJECTION',
  }),
  ARTIFACT_VERSION_UNCLASSIFIED: Object.freeze({
    findingClass: 'SECURITY_OR_POLICY_BLOCKED',
    actionId: 'OBSERVE_ONLY',
  }),
});

function normalizePaths(paths: readonly string[]): string[] {
  return [...new Set(
    paths
      .map((value) => String(value || '').trim().replaceAll('\\', '/'))
      .filter((value) => value.length > 0 && !value.startsWith('/') && !value.includes('..')),
  )].sort();
}

function buildRoute(
  findingId: ArtifactVersionFindingId,
  findingClass: FindingClass,
  actionId: RemediationActionId,
  affectedPaths: string[],
  failClosed: boolean,
  reason: string,
): ArtifactVersionSelfHealingRoute {
  const policy = getRemediationPolicy(findingClass);
  if (!policy.allowedActionIds.includes(actionId)) {
    throw new Error(
      'Artifact version Self-Healing route denied: action is not allowed for the mapped core finding.',
    );
  }

  const action = getRemediationAction(actionId);
  return {
    schema: ARTIFACT_VERSION_SELF_HEALING_POLICY_VERSION,
    findingId,
    selfHealingFindingClass: findingClass,
    actionId,
    affectedPaths,
    failClosed,
    requiredCapability: action.requiredCapability,
    maxAttempts: action.budget.maxAttempts,
    reason,
  };
}

function observeOnly(
  findingId: ArtifactVersionFindingId,
  affectedPaths: string[],
  reason: string,
): ArtifactVersionSelfHealingRoute {
  return buildRoute(
    findingId,
    'SECURITY_OR_POLICY_BLOCKED',
    'OBSERVE_ONLY',
    affectedPaths,
    true,
    reason,
  );
}

/**
 * VAI-04 maps deterministic Artifact-Version findings onto the already-assured
 * Self-Healing writer family. It never creates a new writer or action.
 *
 * Mutation-capable findings are eligible only when their evidence generation is
 * deterministic, owner-resolved, ambiguity-free and bound to a valid inventory hash.
 * Every unresolved case degrades to OBSERVE_ONLY.
 */
export function resolveArtifactVersionSelfHealingRoute(
  evidence: ArtifactVersionFindingEvidence,
): ArtifactVersionSelfHealingRoute {
  const affectedPaths = normalizePaths(evidence.affectedPaths);
  const ambiguityCount = evidence.consumerGraphAmbiguities ?? 0;

  if (!SHA256.test(evidence.artifactVersionInventoryHash)) {
    return observeOnly(evidence.findingId, affectedPaths, 'ARTIFACT_VERSION_INVENTORY_HASH_INVALID');
  }
  if (affectedPaths.length === 0) {
    return observeOnly(evidence.findingId, affectedPaths, 'ARTIFACT_VERSION_AFFECTED_PATH_REQUIRED');
  }
  if (!Number.isInteger(ambiguityCount) || ambiguityCount < 0 || ambiguityCount > 0) {
    return observeOnly(evidence.findingId, affectedPaths, 'ARTIFACT_VERSION_CONSUMER_GRAPH_AMBIGUOUS');
  }
  if (!evidence.deterministic) {
    return observeOnly(evidence.findingId, affectedPaths, 'ARTIFACT_VERSION_EVIDENCE_NOT_DETERMINISTIC');
  }
  if (!evidence.ownerResolved) {
    return observeOnly(evidence.findingId, affectedPaths, 'ARTIFACT_VERSION_OWNER_UNRESOLVED');
  }

  const route = ROUTES[evidence.findingId];
  if (evidence.findingId === 'ARTIFACT_VERSION_UNCLASSIFIED') {
    return observeOnly(
      evidence.findingId,
      affectedPaths,
      'ARTIFACT_VERSION_UNCLASSIFIED_REQUIRES_OWNER_REVIEW',
    );
  }

  const action = getRemediationAction(route.actionId);
  if (action.activation !== 'ENABLED') {
    return observeOnly(evidence.findingId, affectedPaths, 'ARTIFACT_VERSION_TARGET_ACTION_NOT_ENABLED');
  }

  return buildRoute(
    evidence.findingId,
    route.findingClass,
    route.actionId,
    affectedPaths,
    false,
    evidence.findingId === 'ARTIFACT_VERSION_CONSUMER_DRIFT'
      ? 'DETERMINISTIC_CONSUMER_DRIFT_DELEGATED_TO_EXISTING_REPOSITORY_PROJECTION_WRITER'
      : 'DETERMINISTIC_DECLARATION_DRIFT_DELEGATED_TO_EXISTING_REPOSITORY_PROJECTION_WRITER',
  );
}

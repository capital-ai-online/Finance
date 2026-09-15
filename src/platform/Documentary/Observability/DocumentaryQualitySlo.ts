import type { DocumentaryMaintenanceHealthSnapshot } from './DocumentaryMaintenanceObservability';

export const DOCUMENTARY_QUALITY_SLO_VERSION = 'documentary-quality-slo/1.0.0' as const;

export const DOCUMENTARY_QUALITY_SLO_TARGETS = Object.freeze({
  freshnessRatioMinimum: 0.95,
  registryCoverageRatioRequired: 1,
  orphanRateMaximum: 0,
});

export type DocumentaryQualitySloStatus = 'MEETS_SLO' | 'SLO_BREACH' | 'BLOCKED';

export type DocumentaryQualitySloReason =
  | 'invalid-observability-version'
  | 'invalid-correlation-id'
  | 'invalid-source-commit'
  | 'invalid-observed-at'
  | 'invalid-health-status'
  | 'invalid-freshness-ratio'
  | 'invalid-registry-coverage-ratio'
  | 'invalid-orphan-rate'
  | 'upstream-health-blocked'
  | 'registry-coverage-invariant-failed'
  | 'orphan-rate-invariant-failed'
  | 'freshness-below-target';

export interface DocumentaryQualitySloEvaluation {
  sloVersion: typeof DOCUMENTARY_QUALITY_SLO_VERSION;
  evaluationScope: 'point-in-time-snapshot';
  correlationId: string;
  sourceCommit: string;
  observedAt: string;
  upstreamHealthStatus: DocumentaryMaintenanceHealthSnapshot['status'];
  status: DocumentaryQualitySloStatus;
  reasons: readonly DocumentaryQualitySloReason[];
  targets: typeof DOCUMENTARY_QUALITY_SLO_TARGETS;
  observed: Readonly<{
    freshnessRatio: number;
    registryCoverageRatio: number;
    orphanRate: number;
  }>;
  temporalSloVerified: false;
  decisionAuthorized: false;
  mutationAuthorized: false;
  qualityCenterMutationPerformed: false;
  observabilityMutationPerformed: false;
}

const ALLOWED_HEALTH_STATUSES = new Set(['HEALTHY', 'DEGRADED', 'BLOCKED']);

function isValidRatio(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isValidIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function sortedReasons(reasons: DocumentaryQualitySloReason[]): readonly DocumentaryQualitySloReason[] {
  return Object.freeze([...new Set(reasons)].sort());
}

/**
 * Evaluates the already-existing Documentary D9 maintenance SLIs against the
 * Owner-approved WP-DOC-15 starter target contract.
 *
 * This function is deliberately read-only. It does not collect metrics, persist
 * observations, mutate Quality Center state, authorize decisions, or claim a
 * time-window SLO. A MEETS_SLO result means only that this exact D9 snapshot
 * meets the point-in-time target contract.
 */
export function evaluateDocumentaryQualitySlo(
  snapshot: DocumentaryMaintenanceHealthSnapshot,
): DocumentaryQualitySloEvaluation {
  const reasons: DocumentaryQualitySloReason[] = [];
  const metrics = snapshot.metrics;

  if (snapshot.observabilityVersion !== 'documentary-maintenance-observability/1.0.0') {
    reasons.push('invalid-observability-version');
  }
  if (typeof snapshot.correlationId !== 'string' || snapshot.correlationId.trim().length === 0) {
    reasons.push('invalid-correlation-id');
  }
  if (typeof snapshot.sourceCommit !== 'string' || !/^[0-9a-f]{40}$/i.test(snapshot.sourceCommit)) {
    reasons.push('invalid-source-commit');
  }
  if (!isValidIsoTimestamp(snapshot.observedAt)) {
    reasons.push('invalid-observed-at');
  }
  if (!ALLOWED_HEALTH_STATUSES.has(snapshot.status)) {
    reasons.push('invalid-health-status');
  }
  if (!isValidRatio(metrics.freshnessRatio)) {
    reasons.push('invalid-freshness-ratio');
  }
  if (!isValidRatio(metrics.registryCoverageRatio)) {
    reasons.push('invalid-registry-coverage-ratio');
  }
  if (!isValidRatio(metrics.orphanRate)) {
    reasons.push('invalid-orphan-rate');
  }

  if (snapshot.status === 'BLOCKED') {
    reasons.push('upstream-health-blocked');
  }
  if (isValidRatio(metrics.registryCoverageRatio)
      && metrics.registryCoverageRatio !== DOCUMENTARY_QUALITY_SLO_TARGETS.registryCoverageRatioRequired) {
    reasons.push('registry-coverage-invariant-failed');
  }
  if (isValidRatio(metrics.orphanRate)
      && metrics.orphanRate !== DOCUMENTARY_QUALITY_SLO_TARGETS.orphanRateMaximum) {
    reasons.push('orphan-rate-invariant-failed');
  }

  const blockingReason = reasons.some((reason) => reason !== 'freshness-below-target');
  if (!blockingReason
      && isValidRatio(metrics.freshnessRatio)
      && metrics.freshnessRatio < DOCUMENTARY_QUALITY_SLO_TARGETS.freshnessRatioMinimum) {
    reasons.push('freshness-below-target');
  }

  const status: DocumentaryQualitySloStatus = reasons.some((reason) => reason !== 'freshness-below-target')
    ? 'BLOCKED'
    : reasons.includes('freshness-below-target')
      ? 'SLO_BREACH'
      : 'MEETS_SLO';

  return Object.freeze({
    sloVersion: DOCUMENTARY_QUALITY_SLO_VERSION,
    evaluationScope: 'point-in-time-snapshot',
    correlationId: snapshot.correlationId,
    sourceCommit: snapshot.sourceCommit,
    observedAt: snapshot.observedAt,
    upstreamHealthStatus: snapshot.status,
    status,
    reasons: sortedReasons(reasons),
    targets: DOCUMENTARY_QUALITY_SLO_TARGETS,
    observed: Object.freeze({
      freshnessRatio: metrics.freshnessRatio,
      registryCoverageRatio: metrics.registryCoverageRatio,
      orphanRate: metrics.orphanRate,
    }),
    temporalSloVerified: false,
    decisionAuthorized: false,
    mutationAuthorized: false,
    qualityCenterMutationPerformed: false,
    observabilityMutationPerformed: false,
  });
}

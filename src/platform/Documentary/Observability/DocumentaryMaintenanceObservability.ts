import type { DocumentaryMaintenanceApplyResult, DocumentaryMaintenancePlan } from '../Agents/DocumentaryMaintenanceAgent';
import type { SemanticFreshnessReport } from '../Discovery/SemanticFreshnessAnalyzer';
import type { DocumentaryMaintenanceRecommendation } from '../../Supervisor/documentaryMaintenanceObservation';

export const DOCUMENTARY_MAINTENANCE_OBSERVABILITY_VERSION = 'documentary-maintenance-observability/1.0.0' as const;

export type DocumentaryMaintenanceHealthStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED';

export interface DocumentaryMaintenanceHealthSnapshot {
  observabilityVersion: typeof DOCUMENTARY_MAINTENANCE_OBSERVABILITY_VERSION;
  correlationId: string;
  sourceCommit: string;
  observedAt: string;
  status: DocumentaryMaintenanceHealthStatus;
  metrics: {
    registeredDocuments: number;
    readableRegisteredDocuments: number;
    semanticCandidates: number;
    patchableCandidates: number;
    reviewOnlyCandidates: number;
    plannedPatches: number;
    skippedPatches: number;
    appliedDocuments: number;
    hygieneFindingCodes: number;
    freshnessRatio: number;
    registryCoverageRatio: number;
    orphanRate: number;
  };
}

function ratio(numerator: number, denominator: number, emptyValue: number): number {
  if (denominator <= 0) return emptyValue;
  return Number((numerator / denominator).toFixed(6));
}

export function buildDocumentaryMaintenanceHealthSnapshot(options: {
  freshness: SemanticFreshnessReport;
  recommendation: DocumentaryMaintenanceRecommendation;
  plan?: DocumentaryMaintenancePlan;
  apply?: DocumentaryMaintenanceApplyResult;
  observedAt?: string;
}): DocumentaryMaintenanceHealthSnapshot {
  const { freshness, recommendation, plan, apply } = options;
  if (freshness.correlationId !== recommendation.correlationId || freshness.sourceCommit !== recommendation.sourceCommit) {
    throw new Error('[DocumentaryMaintenanceObservability] recommendation does not match freshness evidence.');
  }
  if (plan && (plan.correlationId !== freshness.correlationId || plan.sourceCommit !== freshness.sourceCommit)) {
    throw new Error('[DocumentaryMaintenanceObservability] plan does not match freshness evidence.');
  }
  if (apply && apply.correlationId !== freshness.correlationId) {
    throw new Error('[DocumentaryMaintenanceObservability] apply result does not match freshness evidence.');
  }

  const registeredDocuments = freshness.findings.length;
  const readableRegisteredDocuments = freshness.findings.filter((finding) => finding.contentSha256 !== null).length;
  const semanticCandidates = freshness.findings.filter((finding) => finding.candidate).length;
  const patchableCandidates = freshness.findings.filter(
    (finding) => finding.candidate && finding.mutationClass === 'PATCHABLE',
  ).length;
  const reviewOnlyCandidates = freshness.findings.filter(
    (finding) => finding.candidate && finding.mutationClass === 'REVIEW_ONLY',
  ).length;
  const missingTargets = registeredDocuments - readableRegisteredDocuments;
  const plannedPatches = plan?.patches.length ?? 0;
  const skippedPatches = plan?.skipped.length ?? 0;
  const appliedDocuments = apply?.versionChanges.length ?? 0;

  const status: DocumentaryMaintenanceHealthStatus = recommendation.verdict === 'BLOCKED'
    ? 'BLOCKED'
    : recommendation.reviewRequiredPaths.length > 0 || skippedPatches > 0 || missingTargets > 0
      ? 'DEGRADED'
      : 'HEALTHY';

  return Object.freeze({
    observabilityVersion: DOCUMENTARY_MAINTENANCE_OBSERVABILITY_VERSION,
    correlationId: freshness.correlationId,
    sourceCommit: freshness.sourceCommit,
    observedAt: options.observedAt ?? new Date().toISOString(),
    status,
    metrics: Object.freeze({
      registeredDocuments,
      readableRegisteredDocuments,
      semanticCandidates,
      patchableCandidates,
      reviewOnlyCandidates,
      plannedPatches,
      skippedPatches,
      appliedDocuments,
      hygieneFindingCodes: recommendation.hygieneFindingCodes.length,
      freshnessRatio: ratio(registeredDocuments - semanticCandidates, registeredDocuments, 1),
      registryCoverageRatio: ratio(readableRegisteredDocuments, registeredDocuments, 1),
      orphanRate: ratio(missingTargets, registeredDocuments, 0),
    }),
  });
}

/**
 * Produces a telemetry-safe structured record. It deliberately contains no document content,
 * AI prompts, evidence payloads, user identifiers, secrets or repository diffs.
 */
export function toDocumentaryMaintenanceStructuredLog(snapshot: DocumentaryMaintenanceHealthSnapshot): Readonly<Record<string, unknown>> {
  return Object.freeze({
    event: 'DocumentaryMaintenanceHealth',
    version: snapshot.observabilityVersion,
    correlationId: snapshot.correlationId,
    sourceCommit: snapshot.sourceCommit,
    observedAt: snapshot.observedAt,
    status: snapshot.status,
    ...snapshot.metrics,
  });
}

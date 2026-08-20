import crypto from 'node:crypto';
import type { DocumentationHygieneFinding } from '../Documentary/Governance/Services/DocumentationHygieneValidator';
import type { SemanticFreshnessReport } from '../Documentary/Discovery/SemanticFreshnessAnalyzer';

export const DOCUMENTARY_MAINTENANCE_OBSERVER_VERSION = 'supervisor-documentary-maintenance/1.0.0' as const;

export type DocumentaryMaintenanceRecommendationVerdict = 'RECOMMENDED' | 'NO_ACTION' | 'BLOCKED';

export interface DocumentaryMaintenanceRecommendation {
  observerVersion: typeof DOCUMENTARY_MAINTENANCE_OBSERVER_VERSION;
  evidenceId: string;
  correlationId: string;
  sourceCommit: string;
  verdict: DocumentaryMaintenanceRecommendationVerdict;
  patchablePaths: string[];
  reviewRequiredPaths: string[];
  hygieneFindingCodes: string[];
  rationale: string;
  observedAt: string;
}

function stableEvidenceId(value: unknown): string {
  const digest = crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
  return `SUP-DOC-MAINT-${digest.slice(0, 24).toUpperCase()}`;
}

export function observeDocumentaryMaintenance(
  freshness: SemanticFreshnessReport,
  hygieneFindings: readonly DocumentationHygieneFinding[] = [],
  observedAt = new Date().toISOString(),
): DocumentaryMaintenanceRecommendation {
  const candidates = freshness.findings.filter((finding) => finding.candidate);
  const patchablePaths = candidates
    .filter((finding) => finding.mutationClass === 'PATCHABLE')
    .map((finding) => finding.path)
    .sort();
  const reviewRequiredPaths = candidates
    .filter((finding) => finding.mutationClass === 'REVIEW_ONLY')
    .map((finding) => finding.path)
    .sort();
  const hygieneFindingCodes = [...new Set(hygieneFindings.map((finding) => finding.code))].sort();

  const verdict: DocumentaryMaintenanceRecommendationVerdict = hygieneFindings.length > 0
    ? 'BLOCKED'
    : patchablePaths.length > 0
      ? 'RECOMMENDED'
      : 'NO_ACTION';

  const rationale = verdict === 'BLOCKED'
    ? `Documentation Hygiene reported ${hygieneFindings.length} finding(s); automatic maintenance is fail-closed.`
    : verdict === 'RECOMMENDED'
      ? `${patchablePaths.length} patchable stale-candidate document(s) require semantic assessment; ${reviewRequiredPaths.length} protected document(s) remain review-only.`
      : `No patchable stale-candidate documents were observed; ${reviewRequiredPaths.length} protected candidate(s) remain review-only.`;

  const evidencePayload = {
    observerVersion: DOCUMENTARY_MAINTENANCE_OBSERVER_VERSION,
    correlationId: freshness.correlationId,
    sourceCommit: freshness.sourceCommit,
    verdict,
    patchablePaths,
    reviewRequiredPaths,
    hygieneFindingCodes,
  };

  return Object.freeze({
    ...evidencePayload,
    evidenceId: stableEvidenceId(evidencePayload),
    rationale,
    observedAt,
  });
}

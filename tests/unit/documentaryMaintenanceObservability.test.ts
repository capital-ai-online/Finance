import { describe, expect, it } from 'vitest';
import { buildDocumentaryMaintenanceHealthSnapshot, toDocumentaryMaintenanceStructuredLog } from '../../src/platform/Documentary/Observability/DocumentaryMaintenanceObservability';
import type { SemanticFreshnessReport } from '../../src/platform/Documentary/Discovery/SemanticFreshnessAnalyzer';
import type { DocumentaryMaintenanceRecommendation } from '../../src/platform/Supervisor/documentaryMaintenanceObservation';

const SOURCE_SHA = 'a'.repeat(40);

function freshness(): SemanticFreshnessReport {
  return {
    analyzerVersion: 'documentary-semantic-freshness/1.0.0',
    correlationId: 'corr-observability',
    sourceCommit: SOURCE_SHA,
    generatedAt: '2026-08-20T00:00:00.000Z',
    fullScan: false,
    sourceChanges: [{ path: 'src/platform/Documentary/README.md' }],
    findings: [
      {
        documentId: 'DOC-A', path: 'docs/architecture/a.md', type: 'architecture', lifecycle: 'approved',
        mutationClass: 'PATCHABLE', candidate: true, reasons: ['DOCUMENT_REFERENCE'], sourcePaths: ['src/platform/Documentary/README.md'], contentSha256: '1'.repeat(64),
      },
      {
        documentId: 'DOC-B', path: 'docs/governance/b.md', type: 'governance', lifecycle: 'approved',
        mutationClass: 'REVIEW_ONLY', candidate: true, reasons: ['DOCUMENT_REFERENCE'], sourcePaths: ['src/platform/Documentary/README.md'], contentSha256: '2'.repeat(64),
      },
      {
        documentId: 'DOC-C', path: 'docs/runbooks/c.md', type: 'runbook', lifecycle: 'approved',
        mutationClass: 'PATCHABLE', candidate: false, reasons: [], sourcePaths: [], contentSha256: null,
      },
    ],
    summary: { registered: 3, candidates: 2, patchable: 1, reviewOnly: 1, skipped: 0 },
  };
}

function recommendation(): DocumentaryMaintenanceRecommendation {
  return {
    observerVersion: 'supervisor-documentary-maintenance/1.0.0',
    evidenceId: 'SUP-DOC-MAINT-TEST',
    correlationId: 'corr-observability',
    sourceCommit: SOURCE_SHA,
    verdict: 'RECOMMENDED',
    patchablePaths: ['docs/architecture/a.md'],
    reviewRequiredPaths: ['docs/governance/b.md'],
    hygieneFindingCodes: [],
    rationale: 'test',
    observedAt: '2026-08-20T00:00:01.000Z',
  };
}

describe('Documentary Maintenance observability', () => {
  it('reports privacy-safe health metrics from freshness and Supervisor evidence', () => {
    const snapshot = buildDocumentaryMaintenanceHealthSnapshot({
      freshness: freshness(),
      recommendation: recommendation(),
      observedAt: '2026-08-20T00:00:02.000Z',
    });

    expect(snapshot.status).toBe('DEGRADED');
    expect(snapshot.metrics).toMatchObject({
      registeredDocuments: 3,
      readableRegisteredDocuments: 2,
      semanticCandidates: 2,
      patchableCandidates: 1,
      reviewOnlyCandidates: 1,
      orphanRate: 0.333333,
      registryCoverageRatio: 0.666667,
      freshnessRatio: 0.333333,
    });

    const log = toDocumentaryMaintenanceStructuredLog(snapshot);
    expect(log).not.toHaveProperty('documentContent');
    expect(JSON.stringify(log)).not.toContain('docs/governance/b.md');
  });

  it('fails closed on correlation mismatch', () => {
    const rec = { ...recommendation(), correlationId: 'different-correlation' };
    expect(() => buildDocumentaryMaintenanceHealthSnapshot({ freshness: freshness(), recommendation: rec })).toThrow(/does not match freshness evidence/);
  });
});

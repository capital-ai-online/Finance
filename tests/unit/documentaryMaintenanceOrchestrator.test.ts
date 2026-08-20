import { describe, expect, it } from 'vitest';
import type { PlatformDecisionRecord } from '../../src/platform/PlatformDirector/Contracts/PlatformDecision';
import { AGENT_CAPABILITIES } from '../../src/platform/Security/agentIam';
import { authorizeDocumentaryMaintenanceTask } from '../../src/platform/Documentary/Orchestration/DocumentaryMaintenanceOrchestrator';
import type { SemanticFreshnessReport } from '../../src/platform/Documentary/Discovery/SemanticFreshnessAnalyzer';
import type { DocumentaryMaintenanceRecommendation } from '../../src/platform/Supervisor/documentaryMaintenanceObservation';

function fixtures() {
  const recommendation: DocumentaryMaintenanceRecommendation = {
    observerVersion: 'supervisor-documentary-maintenance/1.0.0', evidenceId: 'SUP-DOC-MAINT-ABC', correlationId: 'corr-1', sourceCommit: 'e'.repeat(40), verdict: 'RECOMMENDED', patchablePaths: ['docs/architecture/FOO.md'], reviewRequiredPaths: ['docs/adr/ADR-0001.md'], hygieneFindingCodes: [], rationale: 'maintenance recommended', observedAt: '2026-08-20T00:00:00.000Z',
  };
  const freshness = {
    analyzerVersion: 'documentary-semantic-freshness/1.0.0', correlationId: 'corr-1', sourceCommit: 'e'.repeat(40), generatedAt: '2026-08-20T00:00:00.000Z', fullScan: false, sourceChanges: [], findings: [], summary: { registered: 1, candidates: 1, patchable: 1, reviewOnly: 0, skipped: 0 },
  } satisfies SemanticFreshnessReport;
  const decision: PlatformDecisionRecord = {
    decisionId: 'PD-DOC-1', title: 'Authorize documentary maintenance', type: 'Governance Decision', subject: 'Documentary maintenance for corr-1', alternatives: ['manual update'], rationale: 'Freshness evidence requires a controlled Draft-PR patch.', affectedComponents: ['Documentary'], affectedContracts: ['ESS-0010'], version: '1.0.0', correlationId: 'corr-1', requestedBy: 'CAPITAL-AI Owner', prerequisites: { supervisorAssessment: { evidenceId: recommendation.evidenceId, source: 'Supervisor', observedAt: recommendation.observedAt, outcome: 'PASS' }, decisionBasis: [{ evidenceId: recommendation.evidenceId, source: 'Supervisor', observedAt: recommendation.observedAt }] }, status: 'APPROVED', decidedAt: '2026-08-20T00:05:00.000Z', decidedBy: 'Platform Director', reasons: ['Supervisor evidence is PASS.'], immutableSequence: 1,
  };
  const agentAuthorization = {
    principal: { humanActorId: 'owner-1', appId: 'chatgpt-github-connector', agentId: 'documentary-maintenance-agent', sessionId: 'session-1', requestId: 'request-1', credentialHolderId: 'github-connector', provider: 'openai', model: 'provider-neutral' },
    grantedCapabilities: [AGENT_CAPABILITIES.READ, AGENT_CAPABILITIES.ANALYZE, AGENT_CAPABILITIES.PLAN], riskClass: 'MEDIUM' as const, environment: 'development' as const, targetResource: 'github:SvenKulessa/Finance',
  };
  return { recommendation, freshness, decision, agentAuthorization };
}

describe('Documentary Maintenance Orchestrator', () => {
  it('binds an approved Platform Director decision to the exact Supervisor evidence and Agent IAM grants', () => {
    const value = fixtures();
    const task = authorizeDocumentaryMaintenanceTask(value);
    expect(task.decisionId).toBe('PD-DOC-1');
    expect(task.supervisorEvidenceId).toBe(value.recommendation.evidenceId);
  });

  it('fails closed when Supervisor evidence is not the evidence approved by Platform Director', () => {
    const value = fixtures();
    value.decision.prerequisites.supervisorAssessment = { evidenceId: 'DIFFERENT', source: 'Supervisor', observedAt: '2026-08-20T00:00:00.000Z', outcome: 'PASS' };
    expect(() => authorizeDocumentaryMaintenanceTask(value)).toThrow(/current Supervisor evidenceId/);
  });
});

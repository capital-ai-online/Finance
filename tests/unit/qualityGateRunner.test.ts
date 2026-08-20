import { describe, expect, it } from 'vitest';
import type { RepositoryQualityObservation } from '../../src/platform/Governance/Contracts/RepositoryQualityEvidence';
import { QualityGateRunner } from '../../src/platform/Quality/Gates/QualityGateRunner';

function observation(): RepositoryQualityObservation {
  const checkedAt = '2026-08-20T00:00:00.000Z';
  return {
    schemaVersion: 'repository-quality-observation/1.1.0',
    trustClass: 'read-only-governance-observation',
    repository: 'SvenKulessa/Finance',
    checkedAt,
    sourceCommit: null,
    overallStatus: 'PASS',
    blocking: false,
    checks: [
      { domain: 'platform-version', status: 'PASS', blocking: false, checkedAt, source: 'test', authorityRefs: [], findings: [] },
      { domain: 'documentation-hygiene', status: 'PASS', blocking: false, checkedAt, source: 'test', authorityRefs: [], findings: [] },
      { domain: 'documentation-consistency', status: 'PASS', blocking: false, checkedAt, source: 'test', authorityRefs: [], findings: [] },
      { domain: 'repository-conventions', status: 'PASS', blocking: false, checkedAt, source: 'test', authorityRefs: [], findings: [] },
      { domain: 'vocabulary', status: 'PASS', blocking: false, checkedAt, source: 'test', authorityRefs: [], findings: [] },
      { domain: 'compliance', status: 'PASS', blocking: false, checkedAt, source: 'test', authorityRefs: [], findings: [] },
    ],
    summary: { checks: 6, passed: 6, warnings: 0, failed: 0, notAvailable: 0, findings: 0, errors: 0, warningFindings: 0, infoFindings: 0 },
    nonAuthorizingStatement: 'Repository quality evidence is read-only technical evidence. It does not authorize merge, release, deployment, production mutation, policy changes or privilege elevation.',
  };
}

describe('QualityGateRunner', () => {
  it('passes only gates with complete evidence and leaves incomplete coverage unavailable', () => {
    const report = new QualityGateRunner().run(observation());

    expect(report.gates.find((gate) => gate.id === 'GATE-3-VERSION')?.status).toBe('PASS');
    expect(report.gates.find((gate) => gate.id === 'GATE-4-DOCUMENTATION')?.status).toBe('PASS');
    expect(report.gates.find((gate) => gate.id === 'GATE-1-CONTRACT')?.status).toBe('NOT_AVAILABLE');
    expect(report.gates.find((gate) => gate.id === 'GATE-6-SECURITY')?.status).toBe('NOT_AVAILABLE');
    expect(report.overallStatus).toBe('NOT_AVAILABLE');
    expect(report.blocking).toBe(false);
  });

  it('fails a gate when its supplied evidence is blocking', () => {
    const input = observation();
    const checks = input.checks.map((check) => check.domain === 'documentation-consistency'
      ? { ...check, status: 'FAIL' as const, blocking: true, findings: [{ domain: 'documentation-consistency' as const, ruleId: 'QM-DOC-010', severity: 'error' as const, message: 'drift' }] }
      : check);
    const report = new QualityGateRunner().run({ ...input, checks });

    expect(report.gates.find((gate) => gate.id === 'GATE-4-DOCUMENTATION')).toMatchObject({
      status: 'FAIL',
      blocking: true,
    });
    expect(report.blocking).toBe(true);
  });
});

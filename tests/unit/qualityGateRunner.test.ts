import { describe, expect, it } from 'vitest';
import type { RepositoryQualityObservation } from '../../src/platform/Governance/Contracts/RepositoryQualityEvidence';
import { CHAPTER_12_MANDATORY_VALIDATORS } from '../../src/platform/Validators/MandatoryValidatorCatalog';
import type { Chapter12ValidationReport } from '../../src/platform/Validators/Chapter12ValidatorContract';
import type { QualityExecutionEvidenceSnapshot } from '../../src/platform/Quality/Execution/QualityExecutionEvidence';
import { QualityGateRunner } from '../../src/platform/Quality/Gates/QualityGateRunner';

const SOURCE_COMMIT = 'a'.repeat(40);
const CHECKED_AT = '2026-08-20T00:00:00.000Z';

function observation(): RepositoryQualityObservation {
  return {
    schemaVersion: 'repository-quality-observation/1.1.0',
    trustClass: 'read-only-governance-observation',
    repository: 'SvenKulessa/Finance',
    checkedAt: CHECKED_AT,
    sourceCommit: SOURCE_COMMIT,
    overallStatus: 'PASS',
    blocking: false,
    checks: [
      { domain: 'platform-version', status: 'PASS', blocking: false, checkedAt: CHECKED_AT, source: 'test', authorityRefs: [], findings: [] },
      { domain: 'documentation-hygiene', status: 'PASS', blocking: false, checkedAt: CHECKED_AT, source: 'test', authorityRefs: [], findings: [] },
      { domain: 'documentation-consistency', status: 'PASS', blocking: false, checkedAt: CHECKED_AT, source: 'test', authorityRefs: [], findings: [] },
      { domain: 'repository-conventions', status: 'PASS', blocking: false, checkedAt: CHECKED_AT, source: 'test', authorityRefs: [], findings: [] },
      { domain: 'vocabulary', status: 'PASS', blocking: false, checkedAt: CHECKED_AT, source: 'test', authorityRefs: [], findings: [] },
      { domain: 'compliance', status: 'PASS', blocking: false, checkedAt: CHECKED_AT, source: 'test', authorityRefs: [], findings: [] },
    ],
    summary: { checks: 6, passed: 6, warnings: 0, failed: 0, notAvailable: 0, findings: 0, errors: 0, warningFindings: 0, infoFindings: 0 },
    nonAuthorizingStatement: 'Repository quality evidence is read-only technical evidence. It does not authorize merge, release, deployment, production mutation, policy changes or privilege elevation.',
  };
}

function chapter12(): Chapter12ValidationReport {
  const results = CHAPTER_12_MANDATORY_VALIDATORS.map((validatorName, index) => ({
    validatorId: `chapter12-${index + 1}`,
    validatorName,
    validatorVersion: '1.0.0',
    contract: 'ESS-0001-CONTRACTS Chapter 12',
    scope: 'repository',
    checkedObject: '.',
    checkedAt: CHECKED_AT,
    status: 'PASS' as const,
    severity: 'Information' as const,
    findings: [],
    evidenceRefs: ['ESS-0001-CONTRACTS Chapter 12'],
    correlationId: 'test-correlation',
  }));
  return {
    schemaVersion: 'chapter12-validation-report/1.0.0',
    contractVersion: 'chapter12-validator-contract/1.0.0',
    checkedAt: CHECKED_AT,
    correlationId: 'test-correlation',
    overallStatus: 'PASS',
    blocking: false,
    executed: 16,
    total: 16,
    passed: 16,
    failed: 0,
    notAvailable: 0,
    results,
  };
}

function execution(phases: Array<'contract' | 'test' | 'build'> = ['contract', 'test', 'build']): QualityExecutionEvidenceSnapshot {
  return {
    schemaVersion: 'quality-execution-evidence/1.0.0',
    sourceCommit: SOURCE_COMMIT,
    records: phases.map((phase) => ({
      phase,
      status: 'PASS' as const,
      checkedAt: CHECKED_AT,
      sourceCommit: SOURCE_COMMIT,
      command: `npm run ${phase}`,
      exitCode: 0,
      evidenceRefs: [`test:${phase}`],
    })),
  };
}

describe('QualityGateRunner', () => {
  it('keeps the legacy path conservative when complete evidence is not supplied', () => {
    const report = new QualityGateRunner().run(observation());

    expect(report.gates.find((gate) => gate.id === 'GATE-3-VERSION')?.status).toBe('PASS');
    expect(report.gates.find((gate) => gate.id === 'GATE-4-DOCUMENTATION')?.status).toBe('PASS');
    expect(report.gates.find((gate) => gate.id === 'GATE-1-CONTRACT')?.status).toBe('NOT_AVAILABLE');
    expect(report.gates.find((gate) => gate.id === 'GATE-6-SECURITY')?.status).toBe('PASS');
    expect(report.overallStatus).toBe('NOT_AVAILABLE');
    expect(report.blocking).toBe(false);
  });

  it('passes all eight gates only with complete Chapter-12, domain and execution evidence', () => {
    const report = new QualityGateRunner().run(observation(), {
      chapter12Validation: chapter12(),
      executionEvidence: execution(),
    });

    expect(report.gates).toHaveLength(8);
    expect(report.gates.every((gate) => gate.status === 'PASS')).toBe(true);
    expect(report.overallStatus).toBe('PASS');
    expect(report.blocking).toBe(false);
  });

  it('keeps a gate unavailable when required execution evidence is missing', () => {
    const report = new QualityGateRunner().run(observation(), {
      chapter12Validation: chapter12(),
      executionEvidence: execution(['contract', 'test']),
    });

    expect(report.gates.find((gate) => gate.id === 'GATE-8-BUILD')).toMatchObject({
      status: 'NOT_AVAILABLE',
      blocking: false,
    });
    expect(report.overallStatus).toBe('NOT_AVAILABLE');
  });

  it('fails a gate when supplied domain evidence is blocking', () => {
    const input = observation();
    const checks = input.checks.map((check) => check.domain === 'documentation-consistency'
      ? { ...check, status: 'FAIL' as const, blocking: true, findings: [{ domain: 'documentation-consistency' as const, ruleId: 'QM-DOC-010', severity: 'error' as const, message: 'drift' }] }
      : check);
    const report = new QualityGateRunner().run({ ...input, checks }, {
      chapter12Validation: chapter12(),
      executionEvidence: execution(),
    });

    expect(report.gates.find((gate) => gate.id === 'GATE-4-DOCUMENTATION')).toMatchObject({
      status: 'FAIL',
      blocking: true,
    });
    expect(report.blocking).toBe(true);
  });
});

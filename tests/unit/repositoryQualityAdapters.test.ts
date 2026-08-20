import { describe, expect, it } from 'vitest';
import {
  createComplianceQualityAdapter,
  createDocumentationConsistencyQualityAdapter,
  createDocumentationHygieneQualityAdapter,
  createPlatformVersionQualityAdapter,
  createRepositoryConventionQualityAdapter,
  createVocabularyQualityAdapter,
} from '../../scripts/automation/repositoryQualityAdapters';

const context = { repoRoot: '/tmp/repo', checkedAt: '2026-08-20T00:00:00.000Z' };

describe('repository quality adapters', () => {
  it('projects the authoritative platform version without mutating it', () => {
    const adapter = createPlatformVersionQualityAdapter(() => '0.6.0');
    const result = adapter.run(context);
    expect(result).toMatchObject({ domain: 'platform-version', status: 'PASS', blocking: false, metrics: { version: '0.6.0' } });
  });

  it('maps documentation hygiene findings to fail-closed normalized evidence', () => {
    const adapter = createDocumentationHygieneQualityAdapter(() => [
      { code: 'DOCUMENT_TARGET_MISSING', message: 'missing', path: 'docs/missing.md' },
    ]);
    const result = adapter.run(context);
    expect(result.status).toBe('FAIL');
    expect(result.blocking).toBe(true);
    expect(result.findings[0]).toMatchObject({ domain: 'documentation-hygiene', ruleId: 'DOCUMENT_TARGET_MISSING', severity: 'error' });
  });

  it('projects the dedicated QM documentation consistency validator', () => {
    const adapter = createDocumentationConsistencyQualityAdapter((_root, checkedAt) => ({
      checkedAt: checkedAt ?? context.checkedAt,
      compliant: true,
      blocking: false,
      findings: [],
    }));
    expect(adapter.run(context)).toMatchObject({ domain: 'documentation-consistency', status: 'PASS', blocking: false });
  });

  it('keeps repository convention warnings advisory while strict errors block', () => {
    const warningAdapter = createRepositoryConventionQualityAdapter(() => ({
      checkedAt: context.checkedAt,
      root: context.repoRoot,
      mode: 'strict',
      compliant: false,
      blocking: false,
      summary: { errors: 0, warnings: 1, info: 0, total: 1 },
      findings: [{ ruleId: 'REPO-NAME-ADR', severity: 'warning', path: 'docs/adr/x.md', message: 'warn' }],
    }));
    expect(warningAdapter.run(context).status).toBe('WARN');

    const errorAdapter = createRepositoryConventionQualityAdapter(() => ({
      checkedAt: context.checkedAt,
      root: context.repoRoot,
      mode: 'strict',
      compliant: false,
      blocking: true,
      summary: { errors: 1, warnings: 0, info: 0, total: 1 },
      findings: [{ ruleId: 'REPO-CASE-001', severity: 'error', path: 'src/X.ts', message: 'error' }],
    }));
    expect(errorAdapter.run(context)).toMatchObject({ status: 'FAIL', blocking: true });
  });

  it('maps vocabulary findings without inventing new terminology rules', () => {
    const adapter = createVocabularyQualityAdapter(() => ({
      checkedAt: context.checkedAt,
      compliant: false,
      blocking: true,
      scannedFiles: 7,
      findings: [{ ruleId: 'VOC-CONT-001', severity: 'error', path: 'src/example.ts', term: 'Membership', conceptId: 'VOC-BILLING-0001', message: 'forbidden term' }],
    }));
    const result = adapter.run(context);
    expect(result).toMatchObject({ domain: 'vocabulary', status: 'FAIL', blocking: true, metrics: { scannedFiles: 7, findingCount: 1 } });
    expect(result.findings[0].evidenceRefs).toContain('VOC-BILLING-0001');
  });

  it('normalizes existing compliance scanner severities while preserving their source severity', () => {
    const adapter = createComplianceQualityAdapter(() => [{
      id: 'SEC-TEST',
      name: 'Security test',
      type: 'SECURITY',
      version: '1.0.0',
      complianceScore: 75,
      confidenceScore: 1,
      evidence: 'evidence',
      findings: [{
        id: 'FND-1',
        title: 'High finding',
        severity: 'HIGH',
        description: 'description',
        complianceReference: 'ESS-0001-CONTRACTS Chapter 11',
        risk: 'risk',
        filePath: 'src/example.ts',
      }],
      riskScore: 25,
      executionTimeMs: 1,
      isoControls: ['A.8.28 Secure coding'],
    }]);
    const result = adapter.run(context);
    expect(result).toMatchObject({ domain: 'compliance', status: 'FAIL', blocking: true });
    expect(result.findings[0]).toMatchObject({ ruleId: 'SEC-TEST', severity: 'error', sourceSeverity: 'HIGH' });
  });
});

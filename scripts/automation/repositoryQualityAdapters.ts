import type {
  RepositoryQualityAdapter,
  RepositoryQualityAdapterContext,
  RepositoryQualityCheckResult,
  RepositoryQualityFinding,
  RepositoryQualitySeverity,
  RepositoryQualityStatus,
} from '../../src/platform/Governance/Contracts/RepositoryQualityEvidence';
import {
  DOCUMENTATION_HYGIENE_POLICY_PATH,
  DOCUMENTATION_HYGIENE_VALIDATOR_VERSION,
  collectDocumentationHygieneFindings,
} from '../../src/platform/Documentary/Governance/Services/DocumentationHygieneValidator';
import {
  PLATFORM_VERSION_AUTHORITY,
  PLATFORM_VERSION_CONTROL_PLANE_CONTRACT,
  getPlatformVersion,
} from '../../src/platform/Release/Services/platformVersionControlPlane';
import {
  validateRepositoryConventions,
  type RepositoryConventionReport,
} from '../../src/platform/VersionManager/repositoryConventionValidator';
import {
  validateContinuousVocabularyGovernance,
  type ContinuousGovernanceReport,
} from '../../src/platform/Vocabulary/Validators/ContinuousGovernanceValidator';
import { runAllScanners } from '../../src/platform/Compliance/scanners';
import type { ScannerResult, Severity } from '../../src/platform/Compliance/types';
import {
  QM_DOCUMENTATION_CONSISTENCY_VALIDATOR_VERSION,
  validateQmDocumentationConsistency,
  type DocumentationConsistencyReport,
} from '../../src/platform/Quality/Validators/DocumentationConsistencyValidator';

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return String(error);
}

function statusFromFindings(
  findings: readonly RepositoryQualityFinding[],
  blocking: boolean,
): RepositoryQualityStatus {
  if (blocking || findings.some((finding) => finding.severity === 'error')) return 'FAIL';
  if (findings.some((finding) => finding.severity === 'warning')) return 'WARN';
  return 'PASS';
}

function frozenResult(result: RepositoryQualityCheckResult): RepositoryQualityCheckResult {
  return Object.freeze({
    ...result,
    authorityRefs: Object.freeze([...result.authorityRefs]),
    findings: Object.freeze([...result.findings]),
    metrics: result.metrics ? Object.freeze({ ...result.metrics }) : undefined,
  });
}

export function createPlatformVersionQualityAdapter(
  readVersion: typeof getPlatformVersion = getPlatformVersion,
): RepositoryQualityAdapter {
  return Object.freeze({
    domain: 'platform-version' as const,
    run: ({ repoRoot, checkedAt }: RepositoryQualityAdapterContext) => {
      try {
        const version = readVersion(repoRoot);
        return frozenResult({
          domain: 'platform-version',
          status: 'PASS',
          blocking: false,
          checkedAt,
          source: PLATFORM_VERSION_CONTROL_PLANE_CONTRACT,
          authorityRefs: ['CTRL-GOV-VERSION-001', 'ADR-0030', 'ADR-0096', PLATFORM_VERSION_AUTHORITY],
          findings: [],
          metrics: { version },
        });
      } catch (error) {
        return frozenResult({
          domain: 'platform-version',
          status: 'FAIL',
          blocking: true,
          checkedAt,
          source: PLATFORM_VERSION_CONTROL_PLANE_CONTRACT,
          authorityRefs: ['CTRL-GOV-VERSION-001', 'ADR-0030', 'ADR-0096', PLATFORM_VERSION_AUTHORITY],
          findings: [{
            domain: 'platform-version',
            ruleId: 'QUALITY-VERSION-001',
            severity: 'error',
            message: `Platform version projection failed: ${errorMessage(error)}`,
            path: 'package.json',
            evidenceRefs: ['CTRL-GOV-VERSION-001', 'ADR-0030', 'ADR-0096'],
          }],
        });
      }
    },
  });
}

export function createDocumentationHygieneQualityAdapter(
  collect: typeof collectDocumentationHygieneFindings = collectDocumentationHygieneFindings,
): RepositoryQualityAdapter {
  return Object.freeze({
    domain: 'documentation-hygiene' as const,
    run: ({ repoRoot, checkedAt }: RepositoryQualityAdapterContext) => {
      try {
        const findings: RepositoryQualityFinding[] = collect(repoRoot).map((item) => ({
          domain: 'documentation-hygiene' as const,
          ruleId: item.code,
          severity: 'error' as const,
          message: item.message,
          path: item.path,
          evidenceRefs: ['ESS-0012', 'ADR-0014', 'ADR-0096', DOCUMENTATION_HYGIENE_POLICY_PATH],
        }));
        return frozenResult({
          domain: 'documentation-hygiene',
          status: findings.length ? 'FAIL' : 'PASS',
          blocking: findings.length > 0,
          checkedAt,
          source: DOCUMENTATION_HYGIENE_VALIDATOR_VERSION,
          authorityRefs: ['ESS-0012', 'ADR-0014', 'ADR-0096', DOCUMENTATION_HYGIENE_POLICY_PATH],
          findings,
          metrics: { findingCount: findings.length },
        });
      } catch (error) {
        return frozenResult({
          domain: 'documentation-hygiene',
          status: 'FAIL',
          blocking: true,
          checkedAt,
          source: DOCUMENTATION_HYGIENE_VALIDATOR_VERSION,
          authorityRefs: ['ESS-0012', 'ADR-0014', 'ADR-0096', DOCUMENTATION_HYGIENE_POLICY_PATH],
          findings: [{
            domain: 'documentation-hygiene',
            ruleId: 'QUALITY-DOCS-UNAVAILABLE',
            severity: 'error',
            message: `Documentation hygiene validation failed closed: ${errorMessage(error)}`,
            evidenceRefs: ['ESS-0012', 'ADR-0014', 'ADR-0096'],
          }],
        });
      }
    },
  });
}

export function createDocumentationConsistencyQualityAdapter(
  validate: typeof validateQmDocumentationConsistency = validateQmDocumentationConsistency,
): RepositoryQualityAdapter {
  return Object.freeze({
    domain: 'documentation-consistency' as const,
    run: ({ repoRoot, checkedAt }: RepositoryQualityAdapterContext) => {
      try {
        const report: DocumentationConsistencyReport = validate(repoRoot, checkedAt);
        return frozenResult({
          domain: 'documentation-consistency',
          status: statusFromFindings(report.findings, report.blocking),
          blocking: report.blocking,
          checkedAt,
          source: QM_DOCUMENTATION_CONSISTENCY_VALIDATOR_VERSION,
          authorityRefs: ['ESS-0005', 'ESS-0012', 'ADR-0014', 'ADR-0096'],
          findings: report.findings,
          metrics: { findingCount: report.findings.length },
        });
      } catch (error) {
        return frozenResult({
          domain: 'documentation-consistency',
          status: 'FAIL',
          blocking: true,
          checkedAt,
          source: QM_DOCUMENTATION_CONSISTENCY_VALIDATOR_VERSION,
          authorityRefs: ['ESS-0005', 'ESS-0012', 'ADR-0014', 'ADR-0096'],
          findings: [{
            domain: 'documentation-consistency',
            ruleId: 'QM-DOC-UNAVAILABLE',
            severity: 'error',
            message: `QM documentation consistency validation failed closed: ${errorMessage(error)}`,
            evidenceRefs: ['ESS-0005', 'ESS-0012', 'ADR-0014', 'ADR-0096'],
          }],
        });
      }
    },
  });
}

function mapRepositoryConventionReport(
  report: RepositoryConventionReport,
  checkedAt: string,
): RepositoryQualityCheckResult {
  const findings: RepositoryQualityFinding[] = report.findings.map((item) => ({
    domain: 'repository-conventions' as const,
    ruleId: item.ruleId,
    severity: item.severity as RepositoryQualitySeverity,
    message: item.message,
    path: item.path,
    expected: item.expected,
    actual: item.actual,
    evidenceRefs: ['ADR-0020', 'ADR-0076', 'ADR-0096'],
  }));
  return frozenResult({
    domain: 'repository-conventions',
    status: statusFromFindings(findings, report.blocking),
    blocking: report.blocking,
    checkedAt,
    source: 'src/platform/VersionManager/repositoryConventionValidator.ts',
    authorityRefs: ['ADR-0020', 'ADR-0076', 'ADR-0096'],
    findings,
    metrics: {
      errors: report.summary.errors,
      warnings: report.summary.warnings,
      info: report.summary.info,
      total: report.summary.total,
    },
  });
}

export function createRepositoryConventionQualityAdapter(
  validate: typeof validateRepositoryConventions = validateRepositoryConventions,
): RepositoryQualityAdapter {
  return Object.freeze({
    domain: 'repository-conventions' as const,
    run: ({ repoRoot, checkedAt }: RepositoryQualityAdapterContext) => {
      try {
        return mapRepositoryConventionReport(validate(repoRoot, 'strict'), checkedAt);
      } catch (error) {
        return frozenResult({
          domain: 'repository-conventions',
          status: 'FAIL',
          blocking: true,
          checkedAt,
          source: 'src/platform/VersionManager/repositoryConventionValidator.ts',
          authorityRefs: ['ADR-0020', 'ADR-0076', 'ADR-0096'],
          findings: [{
            domain: 'repository-conventions',
            ruleId: 'QUALITY-REPOSITORY-UNAVAILABLE',
            severity: 'error',
            message: `Repository convention validation failed closed: ${errorMessage(error)}`,
            evidenceRefs: ['ADR-0020', 'ADR-0076', 'ADR-0096'],
          }],
        });
      }
    },
  });
}

function mapVocabularyReport(
  report: ContinuousGovernanceReport,
  checkedAt: string,
): RepositoryQualityCheckResult {
  const findings: RepositoryQualityFinding[] = report.findings.map((item) => ({
    domain: 'vocabulary' as const,
    ruleId: item.ruleId,
    severity: item.severity,
    message: item.message,
    path: item.path,
    actual: item.term,
    evidenceRefs: [item.conceptId ?? 'ESS-0017', 'ESS-0017', 'ADR-0046'],
  }));
  return frozenResult({
    domain: 'vocabulary',
    status: statusFromFindings(findings, report.blocking),
    blocking: report.blocking,
    checkedAt,
    source: 'src/platform/Vocabulary/Validators/ContinuousGovernanceValidator.ts',
    authorityRefs: ['ESS-0017', 'ESS-0017-CONTRACTS', 'ADR-0046'],
    findings,
    metrics: { scannedFiles: report.scannedFiles, findingCount: findings.length },
  });
}

export function createVocabularyQualityAdapter(
  validate: typeof validateContinuousVocabularyGovernance = validateContinuousVocabularyGovernance,
): RepositoryQualityAdapter {
  return Object.freeze({
    domain: 'vocabulary' as const,
    run: ({ repoRoot, checkedAt }: RepositoryQualityAdapterContext) => {
      try {
        return mapVocabularyReport(validate(repoRoot), checkedAt);
      } catch (error) {
        return frozenResult({
          domain: 'vocabulary',
          status: 'FAIL',
          blocking: true,
          checkedAt,
          source: 'src/platform/Vocabulary/Validators/ContinuousGovernanceValidator.ts',
          authorityRefs: ['ESS-0017', 'ESS-0017-CONTRACTS', 'ADR-0046'],
          findings: [{
            domain: 'vocabulary',
            ruleId: 'QUALITY-VOCABULARY-UNAVAILABLE',
            severity: 'error',
            message: `Vocabulary governance validation failed closed: ${errorMessage(error)}`,
            evidenceRefs: ['ESS-0017', 'ADR-0046'],
          }],
        });
      }
    },
  });
}

function mapComplianceSeverity(severity: Severity): RepositoryQualitySeverity {
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'error';
  if (severity === 'MEDIUM') return 'warning';
  return 'info';
}

function mapComplianceResults(results: readonly ScannerResult[], checkedAt: string): RepositoryQualityCheckResult {
  const findings: RepositoryQualityFinding[] = results.flatMap((result) =>
    result.findings.map((item) => ({
      domain: 'compliance' as const,
      ruleId: result.id,
      severity: mapComplianceSeverity(item.severity),
      sourceSeverity: item.severity,
      message: `${item.title}: ${item.description}`,
      path: item.filePath,
      evidenceRefs: [item.complianceReference, ...result.isoControls, 'ESS-0006', 'ADR-0012'],
    })),
  );
  const blocking = findings.some((item) => item.severity === 'error');
  const complianceScores = results.map((result) => result.complianceScore);
  const riskScores = results.map((result) => result.riskScore);

  return frozenResult({
    domain: 'compliance',
    status: statusFromFindings(findings, blocking),
    blocking,
    checkedAt,
    source: 'src/platform/Compliance/scanners.ts',
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 11', 'ESS-0006', 'ADR-0012'],
    findings,
    metrics: {
      scannerCount: results.length,
      findingCount: findings.length,
      minimumComplianceScore: complianceScores.length ? Math.min(...complianceScores) : null,
      maximumRiskScore: riskScores.length ? Math.max(...riskScores) : null,
    },
  });
}

export function createComplianceQualityAdapter(
  run: typeof runAllScanners = runAllScanners,
): RepositoryQualityAdapter {
  return Object.freeze({
    domain: 'compliance' as const,
    run: ({ checkedAt }: RepositoryQualityAdapterContext) => {
      try {
        return mapComplianceResults(run(), checkedAt);
      } catch (error) {
        return frozenResult({
          domain: 'compliance',
          status: 'FAIL',
          blocking: true,
          checkedAt,
          source: 'src/platform/Compliance/scanners.ts',
          authorityRefs: ['ESS-0001-CONTRACTS Chapter 11', 'ESS-0006', 'ADR-0012'],
          findings: [{
            domain: 'compliance',
            ruleId: 'QUALITY-COMPLIANCE-UNAVAILABLE',
            severity: 'error',
            message: `Compliance scanner integration failed closed: ${errorMessage(error)}`,
            evidenceRefs: ['ESS-0006', 'ADR-0012'],
          }],
        });
      }
    },
  });
}

export function createDefaultRepositoryQualityAdapters(): readonly RepositoryQualityAdapter[] {
  return Object.freeze([
    createPlatformVersionQualityAdapter(),
    createDocumentationHygieneQualityAdapter(),
    createDocumentationConsistencyQualityAdapter(),
    createRepositoryConventionQualityAdapter(),
    createVocabularyQualityAdapter(),
    createComplianceQualityAdapter(),
  ]);
}

import {
  REPOSITORY_QUALITY_NON_AUTHORIZING_STATEMENT,
  REPOSITORY_QUALITY_OBSERVATION_SCHEMA,
  REPOSITORY_QUALITY_REQUIRED_DOMAINS,
  REPOSITORY_QUALITY_TRUST_CLASS,
  type RepositoryQualityAdapter,
  type RepositoryQualityCheckResult,
  type RepositoryQualityDomain,
  type RepositoryQualityFinding,
  type RepositoryQualityObservation,
  type RepositoryQualityStatus,
} from '../../Governance/Contracts/RepositoryQualityEvidence';
import { ValidatorRegistry } from '../../Validators/ValidatorRegistry';

export const REPOSITORY_QUALITY_COORDINATOR_VERSION = 'repository-quality-coordinator/1.1.0' as const;

export interface RepositoryQualityObservationRequest {
  repoRoot?: string;
  checkedAt?: string;
  sourceCommit?: string | null;
}

function normalizeError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return String(error);
}

function validateCheckedAt(value: string): string {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error('[RepositoryQualityCoordinator] checkedAt must be an ISO-compatible timestamp.');
  }
  return value;
}

function validateSourceCommit(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  if (!/^[0-9a-f]{40}$/i.test(value)) {
    throw new Error('[RepositoryQualityCoordinator] sourceCommit must be a full 40-character Git commit SHA.');
  }
  return value.toLowerCase();
}

function sortFindings(findings: readonly RepositoryQualityFinding[]): RepositoryQualityFinding[] {
  return [...findings].sort((left, right) =>
    `${left.domain}|${left.ruleId}|${left.path ?? ''}|${left.message}`.localeCompare(
      `${right.domain}|${right.ruleId}|${right.path ?? ''}|${right.message}`,
    ),
  );
}

function normalizeCheck(result: RepositoryQualityCheckResult, checkedAt: string): RepositoryQualityCheckResult {
  const blocking = result.blocking || result.status === 'FAIL' || result.status === 'NOT_AVAILABLE';
  return Object.freeze({
    ...result,
    checkedAt,
    blocking,
    authorityRefs: Object.freeze([...result.authorityRefs]),
    findings: Object.freeze(sortFindings(result.findings)),
    metrics: result.metrics ? Object.freeze({ ...result.metrics }) : undefined,
  });
}

function unavailableCheck(
  domain: RepositoryQualityDomain,
  checkedAt: string,
  ruleId: string,
  message: string,
): RepositoryQualityCheckResult {
  return Object.freeze({
    domain,
    status: 'NOT_AVAILABLE' as const,
    blocking: true,
    checkedAt,
    source: REPOSITORY_QUALITY_COORDINATOR_VERSION,
    authorityRefs: Object.freeze(['ESS-0005', 'ADR-0096']),
    findings: Object.freeze([
      {
        domain,
        ruleId,
        severity: 'error' as const,
        message,
        evidenceRefs: Object.freeze(['ESS-0005', 'ADR-0096']),
      },
    ]),
  });
}

function aggregateStatus(checks: readonly RepositoryQualityCheckResult[]): RepositoryQualityStatus {
  if (checks.some((check) => check.blocking || check.status === 'FAIL' || check.status === 'NOT_AVAILABLE')) {
    return 'FAIL';
  }
  if (checks.some((check) => check.status === 'WARN')) return 'WARN';
  return 'PASS';
}

export class RepositoryQualityCoordinator {
  private readonly registry: ValidatorRegistry;
  private readonly requiredDomains: readonly RepositoryQualityDomain[];

  constructor(
    validators: readonly RepositoryQualityAdapter[] | ValidatorRegistry,
    requiredDomains: readonly RepositoryQualityDomain[] = REPOSITORY_QUALITY_REQUIRED_DOMAINS,
  ) {
    this.registry = validators instanceof ValidatorRegistry ? validators : new ValidatorRegistry(validators);
    this.requiredDomains = Object.freeze([...new Set(requiredDomains)]);
  }

  observe(request: RepositoryQualityObservationRequest = {}): RepositoryQualityObservation {
    const checkedAt = validateCheckedAt(request.checkedAt ?? new Date().toISOString());
    const sourceCommit = validateSourceCommit(request.sourceCommit);
    const repoRoot = request.repoRoot ?? process.cwd();

    const checks = this.requiredDomains.map((domain) => {
      const validator = this.registry.resolve(domain);
      if (!validator) {
        return unavailableCheck(
          domain,
          checkedAt,
          'QUALITY-VALIDATOR-MISSING',
          `No repository quality validator is registered for required domain ${domain}.`,
        );
      }

      try {
        const result = validator.run({ repoRoot, checkedAt });
        if (result.domain !== domain) {
          return unavailableCheck(
            domain,
            checkedAt,
            'QUALITY-VALIDATOR-DOMAIN-MISMATCH',
            `Validator registered for ${domain} returned evidence for ${result.domain}.`,
          );
        }
        return normalizeCheck(result, checkedAt);
      } catch (error) {
        return unavailableCheck(
          domain,
          checkedAt,
          'QUALITY-VALIDATOR-ERROR',
          `Repository quality validator ${domain} failed closed: ${normalizeError(error)}`,
        );
      }
    });

    const findings = checks.flatMap((check) => check.findings);
    const overallStatus = aggregateStatus(checks);
    const summary = Object.freeze({
      checks: checks.length,
      passed: checks.filter((check) => check.status === 'PASS').length,
      warnings: checks.filter((check) => check.status === 'WARN').length,
      failed: checks.filter((check) => check.status === 'FAIL').length,
      notAvailable: checks.filter((check) => check.status === 'NOT_AVAILABLE').length,
      findings: findings.length,
      errors: findings.filter((finding) => finding.severity === 'error').length,
      warningFindings: findings.filter((finding) => finding.severity === 'warning').length,
      infoFindings: findings.filter((finding) => finding.severity === 'info').length,
    });

    return Object.freeze({
      schemaVersion: REPOSITORY_QUALITY_OBSERVATION_SCHEMA,
      trustClass: REPOSITORY_QUALITY_TRUST_CLASS,
      repository: 'SvenKulessa/Finance' as const,
      checkedAt,
      sourceCommit,
      overallStatus,
      blocking: overallStatus === 'FAIL',
      checks: Object.freeze(checks),
      summary,
      nonAuthorizingStatement: REPOSITORY_QUALITY_NON_AUTHORIZING_STATEMENT,
    });
  }
}

export const REPOSITORY_QUALITY_OBSERVATION_SCHEMA = 'repository-quality-observation/1.1.0' as const;
export const REPOSITORY_QUALITY_TRUST_CLASS = 'read-only-governance-observation' as const;
export const REPOSITORY_QUALITY_NON_AUTHORIZING_STATEMENT =
  'Repository quality evidence is read-only technical evidence. It does not authorize merge, release, deployment, production mutation, policy changes or privilege elevation.' as const;

export const REPOSITORY_QUALITY_REQUIRED_DOMAINS = [
  'platform-version',
  'documentation-hygiene',
  'documentation-consistency',
  'repository-conventions',
  'vocabulary',
  'compliance',
] as const;

export type RepositoryQualityDomain = typeof REPOSITORY_QUALITY_REQUIRED_DOMAINS[number];
export type RepositoryQualitySeverity = 'error' | 'warning' | 'info';
export type RepositoryQualityStatus = 'PASS' | 'WARN' | 'FAIL' | 'NOT_AVAILABLE';

export interface RepositoryQualityFinding {
  domain: RepositoryQualityDomain;
  ruleId: string;
  severity: RepositoryQualitySeverity;
  message: string;
  path?: string;
  expected?: string;
  actual?: string;
  sourceSeverity?: string;
  evidenceRefs?: readonly string[];
}

export interface RepositoryQualityCheckResult {
  domain: RepositoryQualityDomain;
  status: RepositoryQualityStatus;
  blocking: boolean;
  checkedAt: string;
  source: string;
  authorityRefs: readonly string[];
  findings: readonly RepositoryQualityFinding[];
  metrics?: Readonly<Record<string, string | number | boolean | null>>;
}

export interface RepositoryQualityObservationSummary {
  checks: number;
  passed: number;
  warnings: number;
  failed: number;
  notAvailable: number;
  findings: number;
  errors: number;
  warningFindings: number;
  infoFindings: number;
}

export interface RepositoryQualityObservation {
  schemaVersion: typeof REPOSITORY_QUALITY_OBSERVATION_SCHEMA;
  trustClass: typeof REPOSITORY_QUALITY_TRUST_CLASS;
  repository: 'capital-ai-online/Finance';
  checkedAt: string;
  sourceCommit: string | null;
  overallStatus: RepositoryQualityStatus;
  blocking: boolean;
  checks: readonly RepositoryQualityCheckResult[];
  summary: RepositoryQualityObservationSummary;
  nonAuthorizingStatement: typeof REPOSITORY_QUALITY_NON_AUTHORIZING_STATEMENT;
}

export interface RepositoryQualityAdapterContext {
  repoRoot: string;
  checkedAt: string;
}

export interface RepositoryQualityAdapter {
  readonly domain: RepositoryQualityDomain;
  run(context: Readonly<RepositoryQualityAdapterContext>): RepositoryQualityCheckResult;
}

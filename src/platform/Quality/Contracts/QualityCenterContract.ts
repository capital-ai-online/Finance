import type {
  RepositoryQualityDomain,
  RepositoryQualityObservation,
} from '../../Governance/Contracts/RepositoryQualityEvidence';
import type { MandatoryValidatorCoverageSnapshot } from '../../Validators/MandatoryValidatorCatalog';

export const QUALITY_CENTER_CONTRACT_VERSION = 'quality-center-contract/1.1.0' as const;
export const QUALITY_CENTER_REPORT_SCHEMA = 'quality-center-report/1.1.0' as const;
export const QUALITY_CENTER_NON_AUTHORIZING_STATEMENT =
  'Quality Center results are evidence and measurement only. Governance, Compliance, Supervisor and Human/CODEOWNER controls retain their existing authority; Quality Center cannot authorize merge, release, deployment or production mutation.' as const;

export const QUALITY_GATE_IDS = [
  'GATE-1-CONTRACT',
  'GATE-2-ARCHITECTURE',
  'GATE-3-VERSION',
  'GATE-4-DOCUMENTATION',
  'GATE-5-TEST',
  'GATE-6-SECURITY',
  'GATE-7-COMPLIANCE',
  'GATE-8-BUILD',
] as const;

export type QualityGateId = typeof QUALITY_GATE_IDS[number];
export type QualityGateStatus = 'PASS' | 'FAIL' | 'NOT_AVAILABLE';

export interface QualityGateDefinition {
  id: QualityGateId;
  name: string;
  requiredDomains: readonly RepositoryQualityDomain[];
  evidenceCoverage: 'complete' | 'partial' | 'unavailable';
  authorityRefs: readonly string[];
}

export interface QualityGateResult {
  id: QualityGateId;
  name: string;
  status: QualityGateStatus;
  blocking: boolean;
  evidenceCoverage: QualityGateDefinition['evidenceCoverage'];
  domains: readonly RepositoryQualityDomain[];
  findingRuleIds: readonly string[];
  authorityRefs: readonly string[];
}

export interface QualityGateReport {
  schemaVersion: 'quality-gate-report/1.0.0';
  overallStatus: QualityGateStatus;
  blocking: boolean;
  gates: readonly QualityGateResult[];
}

export const QUALITY_SCORE_AXES = [
  'documentation',
  'test',
  'architecture',
  'security',
  'knowledge',
  'metadata',
  'twin',
] as const;

export type QualityScoreAxis = typeof QUALITY_SCORE_AXES[number];

export interface QualityScoreMeasurement {
  axis: QualityScoreAxis;
  value: number;
  source: string;
  authorityRefs: readonly string[];
}

export interface QualityScoreSnapshot {
  schemaVersion: 'quality-score/1.0.0';
  status: 'COMPLETE' | 'PARTIAL' | 'NOT_AVAILABLE';
  overallScore: number | null;
  measurements: readonly QualityScoreMeasurement[];
  missingAxes: readonly QualityScoreAxis[];
}

export const QUALITY_TEST_AREAS = [
  'unit',
  'integration',
  'contract',
  'architecture',
  'security',
  'performance',
  'e2e',
] as const;

export type QualityTestArea = typeof QUALITY_TEST_AREAS[number];

export interface QualityTestAreaCoverage {
  area: QualityTestArea;
  path: string;
  testFiles: readonly string[];
  testCount: number;
}

export interface QualityCodeCoverageMetrics {
  statements: number | null;
  branches: number | null;
  functions: number | null;
  lines: number | null;
}

export interface QualityCoverageSnapshot {
  schemaVersion: 'quality-coverage/1.0.0';
  checkedAt: string;
  populatedAreas: number;
  totalAreas: number;
  testAreaCoveragePercent: number;
  testAreas: readonly QualityTestAreaCoverage[];
  codeCoverage: Readonly<{
    status: 'AVAILABLE' | 'NOT_AVAILABLE';
    source: string | null;
    metrics: QualityCodeCoverageMetrics | null;
  }>;
  authorityRefs: readonly string[];
}

export const QUALITY_CENTER_EVENT_NAMES = [
  'ValidationStartedEvent',
  'ValidationCompletedEvent',
  'ValidationFailedEvent',
  'QualityGatePassedEvent',
  'QualityGateFailedEvent',
  'QualityScoreChangedEvent',
  'TechnicalDebtDetectedEvent',
  'TechnicalDebtResolvedEvent',
  'CoverageCalculatedEvent',
] as const;

export type QualityCenterEventName = typeof QUALITY_CENTER_EVENT_NAMES[number];

export interface QualityEventSink {
  publish(eventName: QualityCenterEventName, payload: Readonly<Record<string, unknown>>): void;
}

export interface QualityEventPublicationFailure {
  eventName: QualityCenterEventName;
  message: string;
}

export interface QualityEventPublicationSummary {
  attempted: number;
  published: number;
  failed: number;
  failures: readonly QualityEventPublicationFailure[];
}

export type TechnicalDebtPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TechnicalDebtEffort = 'UNASSESSED' | 'SMALL' | 'MEDIUM' | 'LARGE';
export type TechnicalDebtStatus = 'OPEN' | 'RESOLVED';

export interface TechnicalDebtItem {
  id: string;
  component: string;
  cause: string;
  impact: string;
  effort: TechnicalDebtEffort;
  priority: TechnicalDebtPriority;
  targetVersion: string | null;
  status: TechnicalDebtStatus;
  createdAt: string;
  resolvedAt: string | null;
  sourceRefs: readonly string[];
  resolutionEvidenceRefs: readonly string[];
}

export interface TechnicalDebtSnapshot {
  schemaVersion: 'technical-debt-register/1.1.0';
  open: number;
  resolved: number;
  items: readonly TechnicalDebtItem[];
  eventPublication: QualityEventPublicationSummary;
}

export interface QualityCenterReport {
  schemaVersion: typeof QUALITY_CENTER_REPORT_SCHEMA;
  contractVersion: typeof QUALITY_CENTER_CONTRACT_VERSION;
  checkedAt: string;
  repositoryObservation: RepositoryQualityObservation;
  mandatoryValidators: MandatoryValidatorCoverageSnapshot;
  gateReport: QualityGateReport;
  qualityScore: QualityScoreSnapshot;
  coverage: QualityCoverageSnapshot;
  technicalDebt: TechnicalDebtSnapshot;
  eventPublication: QualityEventPublicationSummary;
  governanceRefs: readonly string[];
  complianceRefs: readonly string[];
  nonAuthorizingStatement: typeof QUALITY_CENTER_NON_AUTHORIZING_STATEMENT;
}

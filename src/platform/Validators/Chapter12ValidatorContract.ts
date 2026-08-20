import type { RepositoryQualityObservation } from '../Governance/Contracts/RepositoryQualityEvidence';
import type { MandatoryValidatorName } from './MandatoryValidatorCatalog';

export const CHAPTER_12_VALIDATION_REPORT_SCHEMA = 'chapter12-validation-report/1.0.0' as const;
export const CHAPTER_12_VALIDATOR_CONTRACT_VERSION = 'chapter12-validator-contract/1.0.0' as const;

export type Chapter12ValidatorSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Information';
export type Chapter12ValidatorStatus = 'PASS' | 'FAIL' | 'NOT_AVAILABLE';

export interface Chapter12ValidatorFinding {
  ruleId: string;
  severity: Chapter12ValidatorSeverity;
  path: string | null;
  message: string;
  evidenceRefs: readonly string[];
}

export interface Chapter12ValidatorResult {
  validatorId: string;
  validatorName: MandatoryValidatorName;
  validatorVersion: string;
  contract: string;
  scope: string;
  checkedObject: string;
  checkedAt: string;
  status: Chapter12ValidatorStatus;
  severity: Chapter12ValidatorSeverity;
  findings: readonly Chapter12ValidatorFinding[];
  evidenceRefs: readonly string[];
  correlationId: string;
}

export interface Chapter12ValidationContext {
  repoRoot: string;
  checkedAt: string;
  sourceCommit: string | null;
  repositoryObservation: RepositoryQualityObservation;
}

export interface Chapter12ValidationReport {
  schemaVersion: typeof CHAPTER_12_VALIDATION_REPORT_SCHEMA;
  contractVersion: typeof CHAPTER_12_VALIDATOR_CONTRACT_VERSION;
  checkedAt: string;
  correlationId: string;
  overallStatus: Chapter12ValidatorStatus;
  blocking: boolean;
  executed: number;
  total: 16;
  passed: number;
  failed: number;
  notAvailable: number;
  results: readonly Chapter12ValidatorResult[];
}

export interface Chapter12Validator {
  readonly name: MandatoryValidatorName;
  readonly id: string;
  readonly version: string;
  readonly contract: string;
  readonly scope: string;
  validate(context: Readonly<Chapter12ValidationContext>): Chapter12ValidatorResult;
}

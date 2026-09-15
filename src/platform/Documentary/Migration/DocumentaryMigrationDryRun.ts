import {
  DocumentaryMigrationPlanner,
  type DocumentaryMigrationAssessment,
  type DocumentaryMigrationCandidate,
} from './DocumentaryMigrationPlanner';

export const DOCUMENTARY_MIGRATION_DRY_RUN_SCHEMA = 'documentary-migration-execution-dry-run/1.0.0' as const;

export type DocumentaryMigrationDryRunStatus = 'OWNER_REVIEW_REQUIRED' | 'BLOCKED';
export type DocumentaryMigrationExecutionCategory = 'Documentation Migration' | 'Legacy Migration';

export interface DocumentaryMigrationExecutionEvidence {
  migrationId: string;
  migrationCategory: DocumentaryMigrationExecutionCategory;
  documentId: string;
  sourceFingerprint: string;
  expectedSourceFingerprint: string;
  targetOwnerProject: string;
  targetProtectedClass: boolean;
  canonicalTargetCompatible: boolean;
  targetCollisionDetected: boolean;
  duplicateArtifactDetected: boolean;
  sourceState: string;
  targetState: string;
  affectedComponents: readonly string[];
  affectedData: readonly string[];
  sequence: readonly string[];
  prerequisites: readonly string[];
  impactAnalysis: readonly string[];
  riskAnalysis: readonly string[];
  equivalenceEvidence: readonly string[];
  validationSteps: readonly string[];
  testEvidence: readonly string[];
  rollbackSteps: readonly string[];
  rollbackPrerequisites: readonly string[];
  rollbackRisks: readonly string[];
  rollbackTests: readonly string[];
  rollbackVersion: string;
  migrationVersion: string;
  adrReferences: readonly string[];
}

export interface DocumentaryMigrationDryRunResult {
  schemaVersion: typeof DOCUMENTARY_MIGRATION_DRY_RUN_SCHEMA;
  status: DocumentaryMigrationDryRunStatus;
  migrationId: string;
  documentId: string;
  sourcePath: string;
  targetPath: string | null;
  plannerAssessment: DocumentaryMigrationAssessment;
  reasons: readonly string[];
  requiredPostConditions: readonly string[];
  executionAuthorized: false;
  mutationPerformed: false;
  registryMutationPerformed: false;
  lifecycleMutationPerformed: false;
  filesystemMutationPerformed: false;
}

const REQUIRED_POST_CONDITIONS = Object.freeze([
  'document-id-preserved',
  'source-fingerprint-unchanged',
  'canonical-target-compatible',
  'source-owner-preserved',
  'target-owner-preserved',
  'protected-classes-unchanged',
  'registry-unchanged',
  'lifecycle-unchanged',
  'filesystem-unchanged',
]);

function hasItems(values: readonly string[]): boolean {
  return values.some((value) => value.trim().length > 0);
}

function hasValue(value: string): boolean {
  return value.trim().length > 0;
}

function isSha256(value: string): boolean {
  return /^[0-9a-f]{64}$/i.test(value.trim());
}

function hasAdrReference(values: readonly string[]): boolean {
  return values.some((value) => /^ADR-[0-9]{4}(?:\b|[-_])/i.test(value.trim()));
}

function freezeResult(
  status: DocumentaryMigrationDryRunStatus,
  evidence: DocumentaryMigrationExecutionEvidence,
  assessment: DocumentaryMigrationAssessment,
  reasons: string[],
): DocumentaryMigrationDryRunResult {
  return Object.freeze({
    schemaVersion: DOCUMENTARY_MIGRATION_DRY_RUN_SCHEMA,
    status,
    migrationId: evidence.migrationId.trim(),
    documentId: evidence.documentId.trim(),
    sourcePath: assessment.path,
    targetPath: assessment.targetPath,
    plannerAssessment: assessment,
    reasons: Object.freeze([...reasons].sort()),
    requiredPostConditions: REQUIRED_POST_CONDITIONS,
    executionAuthorized: false,
    mutationPerformed: false,
    registryMutationPerformed: false,
    lifecycleMutationPerformed: false,
    filesystemMutationPerformed: false,
  });
}

/**
 * Evaluates whether an existing D8 migration/redirect candidate has enough evidence
 * to be handed to a Human/Owner for a later, separately authorized migration decision.
 * This class never performs, authorizes, or schedules repository mutations.
 */
export class DocumentaryMigrationDryRun {
  constructor(private readonly planner = new DocumentaryMigrationPlanner()) {}

  evaluate(
    candidate: DocumentaryMigrationCandidate,
    evidence: DocumentaryMigrationExecutionEvidence,
  ): DocumentaryMigrationDryRunResult {
    const assessment = this.planner.assess(candidate);
    const reasons: string[] = [];

    if (!['migration-candidate', 'redirect-candidate'].includes(assessment.disposition)) {
      reasons.push('planner-not-execution-candidate');
    }

    if (!hasValue(evidence.migrationId)) reasons.push('migration-id-missing');
    if (!hasValue(evidence.documentId)) reasons.push('document-id-missing');

    if (!isSha256(evidence.sourceFingerprint) || !isSha256(evidence.expectedSourceFingerprint)) {
      reasons.push('source-fingerprint-invalid');
    } else if (evidence.sourceFingerprint.toLowerCase() !== evidence.expectedSourceFingerprint.toLowerCase()) {
      reasons.push('source-fingerprint-mismatch');
    }

    if (candidate.ownerProject !== 'CAPITAL-AI-DOC') reasons.push('source-owner-not-documentary');
    if (evidence.targetOwnerProject !== 'CAPITAL-AI-DOC') reasons.push('target-owner-not-documentary');
    if (evidence.targetProtectedClass) reasons.push('protected-target-class');
    if (!evidence.canonicalTargetCompatible) reasons.push('canonical-target-incompatible');
    if (evidence.targetCollisionDetected) reasons.push('canonical-target-collision');
    if (evidence.duplicateArtifactDetected) reasons.push('duplicate-artifact-detected');

    if (!hasValue(evidence.sourceState) || !hasValue(evidence.targetState)) reasons.push('state-boundary-incomplete');
    if (!hasItems(evidence.affectedComponents)) reasons.push('affected-components-missing');
    if (!hasItems(evidence.affectedData)) reasons.push('affected-data-missing');
    if (!hasItems(evidence.sequence)) reasons.push('migration-sequence-missing');
    if (!hasItems(evidence.prerequisites)) reasons.push('migration-prerequisites-missing');
    if (!hasItems(evidence.impactAnalysis)) reasons.push('impact-analysis-missing');
    if (!hasItems(evidence.riskAnalysis)) reasons.push('risk-analysis-missing');
    if (!hasItems(evidence.equivalenceEvidence)) reasons.push('equivalence-evidence-missing');
    if (!hasItems(evidence.validationSteps)) reasons.push('validation-plan-missing');
    if (!hasItems(evidence.testEvidence)) reasons.push('test-evidence-missing');

    if (
      !hasItems(evidence.rollbackSteps)
      || !hasItems(evidence.rollbackPrerequisites)
      || !hasItems(evidence.rollbackRisks)
      || !hasItems(evidence.rollbackTests)
      || !hasValue(evidence.rollbackVersion)
    ) {
      reasons.push('rollback-strategy-incomplete');
    }

    if (!hasValue(evidence.migrationVersion)) reasons.push('migration-version-missing');
    if (!hasAdrReference(evidence.adrReferences)) reasons.push('adr-reference-missing');

    const status: DocumentaryMigrationDryRunStatus = reasons.length === 0
      ? 'OWNER_REVIEW_REQUIRED'
      : 'BLOCKED';

    return freezeResult(status, evidence, assessment, reasons);
  }
}

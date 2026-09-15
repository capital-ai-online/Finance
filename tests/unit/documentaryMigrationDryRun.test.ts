import { describe, expect, it } from 'vitest';
import {
  DocumentaryMigrationDryRun,
  type DocumentaryMigrationExecutionEvidence,
} from '../../src/platform/Documentary/Migration/DocumentaryMigrationDryRun';
import { type DocumentaryMigrationCandidate } from '../../src/platform/Documentary/Migration/DocumentaryMigrationPlanner';

function candidate(overrides: Partial<DocumentaryMigrationCandidate> = {}): DocumentaryMigrationCandidate {
  return {
    path: 'docs/generated/legacy-copy.md',
    registered: false,
    referenced: false,
    authorityArtifact: false,
    evidenceArtifact: false,
    securityOrComplianceArtifact: false,
    ownerProject: 'CAPITAL-AI-DOC',
    canonicalPath: 'docs/architecture/canonical.md',
    reproducible: true,
    ...overrides,
  };
}

function evidence(overrides: Partial<DocumentaryMigrationExecutionEvidence> = {}): DocumentaryMigrationExecutionEvidence {
  return {
    migrationId: 'MIG-DOC-001',
    migrationCategory: 'Documentation Migration',
    documentId: 'DOC-ARCH-CANONICAL',
    expectedDocumentId: 'DOC-ARCH-CANONICAL',
    sourceFingerprint: 'a'.repeat(64),
    expectedSourceFingerprint: 'a'.repeat(64),
    targetOwnerProject: 'CAPITAL-AI-DOC',
    targetProtectedClass: false,
    canonicalTargetCompatible: true,
    targetCollisionDetected: false,
    duplicateArtifactDetected: false,
    sourceState: 'generated-noncanonical',
    targetState: 'canonical-path-preserving-document-id',
    affectedComponents: ['Documentary'],
    affectedData: ['documentation-content'],
    sequence: ['verify-source', 'verify-target', 'owner-review'],
    prerequisites: ['current-main-correlated', 'canonical-target-known'],
    impactAnalysis: ['no-runtime-impact'],
    riskAnalysis: ['link-compatibility-review-required'],
    equivalenceEvidence: ['document-id-and-fingerprint-bound'],
    validationSteps: ['re-read-source-and-target', 'verify-post-conditions'],
    testEvidence: ['focused-dry-run-contract-test'],
    rollbackSteps: ['restore-exact-pre-migration-document-state'],
    rollbackPrerequisites: ['pre-migration-source-snapshot-available'],
    rollbackRisks: ['stale-links-after-restore'],
    rollbackTests: ['verify-source-fingerprint-after-restore'],
    rollbackVersion: 'documentary-rollback/1.0.0',
    migrationVersion: 'documentary-migration/1.0.0',
    adrReferences: ['ADR-0010'],
    ...overrides,
  };
}

describe('DocumentaryMigrationDryRun', () => {
  it('returns owner review only when the execution contract is complete and never authorizes mutation', () => {
    const dryRun = new DocumentaryMigrationDryRun();
    const result = dryRun.evaluate(candidate(), evidence());

    expect(result.status).toBe('OWNER_REVIEW_REQUIRED');
    expect(result.reasons).toEqual([]);
    expect(result.executionAuthorized).toBe(false);
    expect(result.mutationPerformed).toBe(false);
    expect(result.registryMutationPerformed).toBe(false);
    expect(result.lifecycleMutationPerformed).toBe(false);
    expect(result.filesystemMutationPerformed).toBe(false);
    expect(result.requiredPostConditions).toContain('document-id-preserved');
    expect(result.requiredPostConditions).toContain('filesystem-unchanged');
  });

  it('blocks document identity and fingerprint drift', () => {
    const dryRun = new DocumentaryMigrationDryRun();
    const result = dryRun.evaluate(candidate(), evidence({
      expectedDocumentId: 'DOC-ARCH-DIFFERENT',
      expectedSourceFingerprint: 'b'.repeat(64),
    }));

    expect(result.status).toBe('BLOCKED');
    expect(result.reasons).toContain('document-id-mismatch');
    expect(result.reasons).toContain('source-fingerprint-mismatch');
  });

  it('blocks missing stable identity evidence', () => {
    const dryRun = new DocumentaryMigrationDryRun();
    const result = dryRun.evaluate(candidate(), evidence({
      documentId: '',
      expectedDocumentId: '',
    }));

    expect(result.status).toBe('BLOCKED');
    expect(result.reasons).toContain('document-id-missing');
  });

  it('blocks foreign ownership, protected targets, incompatibility, collisions and duplicates', () => {
    const dryRun = new DocumentaryMigrationDryRun();
    const result = dryRun.evaluate(candidate(), evidence({
      targetOwnerProject: 'CAPITAL-AI-OPS',
      targetProtectedClass: true,
      canonicalTargetCompatible: false,
      targetCollisionDetected: true,
      duplicateArtifactDetected: true,
    }));

    expect(result.status).toBe('BLOCKED');
    expect(result.reasons).toEqual(expect.arrayContaining([
      'target-owner-not-documentary',
      'protected-target-class',
      'canonical-target-incompatible',
      'canonical-target-collision',
      'duplicate-artifact-detected',
    ]));
  });

  it('blocks incomplete impact, risk, rollback, validation, version and ADR evidence', () => {
    const dryRun = new DocumentaryMigrationDryRun();
    const result = dryRun.evaluate(candidate(), evidence({
      impactAnalysis: [],
      riskAnalysis: [],
      equivalenceEvidence: [],
      validationSteps: [],
      testEvidence: [],
      rollbackSteps: [],
      rollbackPrerequisites: [],
      rollbackRisks: [],
      rollbackTests: [],
      rollbackVersion: '',
      migrationVersion: '',
      adrReferences: [],
    }));

    expect(result.status).toBe('BLOCKED');
    expect(result.reasons).toEqual(expect.arrayContaining([
      'impact-analysis-missing',
      'risk-analysis-missing',
      'equivalence-evidence-missing',
      'validation-plan-missing',
      'test-evidence-missing',
      'rollback-strategy-incomplete',
      'migration-version-missing',
      'adr-reference-missing',
    ]));
  });

  it('does not broaden a non-executable planner disposition', () => {
    const dryRun = new DocumentaryMigrationDryRun();
    const result = dryRun.evaluate(candidate({ referenced: true }), evidence());

    expect(result.plannerAssessment.disposition).toBe('retain');
    expect(result.status).toBe('BLOCKED');
    expect(result.reasons).toContain('planner-not-execution-candidate');
  });

  it('is deterministic for identical input', () => {
    const dryRun = new DocumentaryMigrationDryRun();
    const first = dryRun.evaluate(candidate(), evidence());
    const second = dryRun.evaluate(candidate(), evidence());

    expect(second).toEqual(first);
  });
});

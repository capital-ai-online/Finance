export const DOCUMENTARY_MIGRATION_SCHEMA = 'documentary-migration-plan/1.0.0' as const;

export type DocumentaryMigrationClass =
  | 'canonical'
  | 'generated'
  | 'evidence'
  | 'legacy'
  | 'archive'
  | 'unknown';

export type DocumentaryMigrationDisposition =
  | 'retain'
  | 'migration-candidate'
  | 'redirect-candidate'
  | 'owner-review'
  | 'blocked';

export interface DocumentaryMigrationCandidate {
  path: string;
  registered: boolean;
  referenced: boolean;
  authorityArtifact: boolean;
  evidenceArtifact: boolean;
  securityOrComplianceArtifact: boolean;
  ownerProject?: string | null;
  canonicalPath?: string | null;
  reproducible?: boolean;
}

export interface DocumentaryMigrationAssessment {
  schemaVersion: typeof DOCUMENTARY_MIGRATION_SCHEMA;
  path: string;
  classification: DocumentaryMigrationClass;
  disposition: DocumentaryMigrationDisposition;
  targetPath: string | null;
  reasons: readonly string[];
  mutationPerformed: false;
}

export interface DocumentaryMigrationPlan {
  schemaVersion: typeof DOCUMENTARY_MIGRATION_SCHEMA;
  assessments: readonly DocumentaryMigrationAssessment[];
  migrationCandidates: readonly string[];
  redirectCandidates: readonly string[];
  blocked: readonly string[];
  ownerReview: readonly string[];
  mutationPerformed: false;
}

function normalizeRepositoryPath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '');
}

function isSafeRepositoryPath(path: string): boolean {
  return Boolean(path)
    && !path.startsWith('/')
    && !/^[A-Za-z]:\//.test(path)
    && !path.split('/').includes('..');
}

function classify(candidate: DocumentaryMigrationCandidate, path: string): DocumentaryMigrationClass {
  if (path.startsWith('docs/archive/')) return 'archive';
  if (candidate.evidenceArtifact || path.startsWith('docs/evidence/')) return 'evidence';
  if (path.startsWith('docs/generated/')) return 'generated';
  if (path.startsWith('docs/legacy/') || path.startsWith('docs/deprecated/')) return 'legacy';

  const canonicalPath = candidate.canonicalPath ? normalizeRepositoryPath(candidate.canonicalPath) : null;
  if (candidate.registered && canonicalPath === path) return 'canonical';
  if (candidate.registered && canonicalPath && canonicalPath !== path) return 'legacy';

  return 'unknown';
}

function freezeAssessment(
  path: string,
  classification: DocumentaryMigrationClass,
  disposition: DocumentaryMigrationDisposition,
  targetPath: string | null,
  reasons: string[],
): DocumentaryMigrationAssessment {
  return Object.freeze({
    schemaVersion: DOCUMENTARY_MIGRATION_SCHEMA,
    path,
    classification,
    disposition,
    targetPath,
    reasons: Object.freeze([...reasons]),
    mutationPerformed: false,
  });
}

export class DocumentaryMigrationPlanner {
  assess(candidate: DocumentaryMigrationCandidate): DocumentaryMigrationAssessment {
    const path = normalizeRepositoryPath(candidate.path);
    const targetPath = candidate.canonicalPath
      ? normalizeRepositoryPath(candidate.canonicalPath)
      : null;
    const reasons: string[] = [];

    if (!isSafeRepositoryPath(path) || !path.startsWith('docs/')) {
      reasons.push('invalid-or-non-documentation-path');
      return freezeAssessment(path, 'unknown', 'blocked', null, reasons);
    }

    if (targetPath && (!isSafeRepositoryPath(targetPath) || !targetPath.startsWith('docs/'))) {
      reasons.push('invalid-canonical-path');
      return freezeAssessment(path, 'unknown', 'blocked', null, reasons);
    }

    if (candidate.ownerProject && candidate.ownerProject !== 'CAPITAL-AI-DOC') {
      reasons.push('foreign-project-owner');
      return freezeAssessment(path, classify(candidate, path), 'blocked', targetPath, reasons);
    }

    if (candidate.authorityArtifact) reasons.push('authority-artifact');
    if (candidate.securityOrComplianceArtifact) reasons.push('security-or-compliance-artifact');
    if (candidate.evidenceArtifact) reasons.push('evidence-artifact');
    if (candidate.referenced) reasons.push('referenced-document');

    const classification = classify(candidate, path);

    if (reasons.length > 0) {
      return freezeAssessment(path, classification, 'retain', targetPath, reasons);
    }

    switch (classification) {
      case 'canonical':
        return freezeAssessment(path, classification, 'retain', targetPath, ['already-canonical']);
      case 'evidence':
      case 'archive':
        return freezeAssessment(path, classification, 'retain', targetPath, [`protected-${classification}-class`]);
      case 'legacy':
        if (targetPath && targetPath !== path) {
          return freezeAssessment(path, classification, 'redirect-candidate', targetPath, ['canonical-target-known']);
        }
        return freezeAssessment(path, classification, 'owner-review', targetPath, ['canonical-target-missing']);
      case 'generated':
        if (candidate.reproducible !== true) {
          return freezeAssessment(path, classification, 'owner-review', targetPath, ['generated-artifact-not-proven-reproducible']);
        }
        if (!targetPath || targetPath === path) {
          return freezeAssessment(path, classification, 'owner-review', targetPath, ['canonical-target-missing']);
        }
        return freezeAssessment(path, classification, 'migration-candidate', targetPath, ['reproducible-generated-artifact']);
      default:
        return freezeAssessment(path, classification, 'owner-review', targetPath, ['unclassified-document']);
    }
  }

  plan(candidates: readonly DocumentaryMigrationCandidate[]): DocumentaryMigrationPlan {
    const assessments = candidates
      .map((candidate) => this.assess(candidate))
      .sort((a, b) => a.path.localeCompare(b.path));

    const select = (disposition: DocumentaryMigrationDisposition) => Object.freeze(
      assessments
        .filter((assessment) => assessment.disposition === disposition)
        .map((assessment) => assessment.path),
    );

    return Object.freeze({
      schemaVersion: DOCUMENTARY_MIGRATION_SCHEMA,
      assessments: Object.freeze(assessments),
      migrationCandidates: select('migration-candidate'),
      redirectCandidates: select('redirect-candidate'),
      blocked: select('blocked'),
      ownerReview: select('owner-review'),
      mutationPerformed: false,
    });
  }
}

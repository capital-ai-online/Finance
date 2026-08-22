export const ARCHIVE_RETENTION_SCHEMA = 'documentary-archive-retention/1.0.0' as const;
export const DEFAULT_ARCHIVE_RETENTION_DAYS = 90 as const;

const DELETE_ELIGIBLE_PREFIXES = Object.freeze([
  'docs/archive/generated/',
  'docs/archive/transient/',
]);

export type ArchiveRetentionDisposition = 'retain' | 'owner-review' | 'delete-eligible';

export interface ArchiveRetentionCandidate {
  path: string;
  archivedAt: string;
  registered: boolean;
  referenced: boolean;
  authorityArtifact: boolean;
  evidenceArtifact: boolean;
  securityOrComplianceArtifact: boolean;
  reproducible: boolean;
  canonicalDuplicatePath?: string | null;
}

export interface ArchiveRetentionAssessment {
  schemaVersion: typeof ARCHIVE_RETENTION_SCHEMA;
  path: string;
  disposition: ArchiveRetentionDisposition;
  reasons: readonly string[];
  retentionDays: number;
  ageDays: number | null;
}

export interface ArchiveDeletionPlanRequest {
  assessments: readonly ArchiveRetentionAssessment[];
  branchName: string;
  ownerApproved: boolean;
  killSwitchActive: boolean;
}

export interface ArchiveDeletionPlan {
  schemaVersion: typeof ARCHIVE_RETENTION_SCHEMA;
  authorized: boolean;
  paths: readonly string[];
  reason: string;
  mutationPerformed: false;
}

function normalizedRepositoryPath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '');
}

function parseAgeDays(archivedAt: string, now: Date): number | null {
  const timestamp = Date.parse(archivedAt);
  if (!Number.isFinite(timestamp)) return null;
  return Math.floor((now.getTime() - timestamp) / 86_400_000);
}

function underDeleteEligiblePrefix(path: string): boolean {
  return DELETE_ELIGIBLE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export class ArchiveRetentionAgent {
  constructor(private readonly retentionDays = DEFAULT_ARCHIVE_RETENTION_DAYS) {}

  assess(candidate: ArchiveRetentionCandidate, now = new Date()): ArchiveRetentionAssessment {
    const path = normalizedRepositoryPath(candidate.path);
    const reasons: string[] = [];
    const ageDays = parseAgeDays(candidate.archivedAt, now);

    if (!path.startsWith('docs/archive/')) reasons.push('outside-archive-root');
    if (!underDeleteEligiblePrefix(path)) reasons.push('protected-archive-class');
    if (candidate.registered) reasons.push('registered-document');
    if (candidate.referenced) reasons.push('referenced-document');
    if (candidate.authorityArtifact) reasons.push('authority-artifact');
    if (candidate.evidenceArtifact) reasons.push('evidence-artifact');
    if (candidate.securityOrComplianceArtifact) reasons.push('security-or-compliance-artifact');
    if (!candidate.reproducible) reasons.push('not-reproducible');
    if (!candidate.canonicalDuplicatePath) reasons.push('canonical-duplicate-missing');
    if (ageDays === null) reasons.push('invalid-archive-date');
    else if (ageDays < this.retentionDays) reasons.push('retention-window-active');

    const hardRetain = reasons.some((reason) => [
      'outside-archive-root',
      'protected-archive-class',
      'registered-document',
      'referenced-document',
      'authority-artifact',
      'evidence-artifact',
      'security-or-compliance-artifact',
    ].includes(reason));

    const disposition: ArchiveRetentionDisposition = hardRetain
      ? 'retain'
      : reasons.length === 0
        ? 'delete-eligible'
        : 'owner-review';

    return Object.freeze({
      schemaVersion: ARCHIVE_RETENTION_SCHEMA,
      path,
      disposition,
      reasons: Object.freeze(reasons),
      retentionDays: this.retentionDays,
      ageDays,
    });
  }

  planDeletion(request: ArchiveDeletionPlanRequest): ArchiveDeletionPlan {
    if (request.killSwitchActive) {
      return Object.freeze({ schemaVersion: ARCHIVE_RETENTION_SCHEMA, authorized: false, paths: Object.freeze([]), reason: 'kill-switch-active', mutationPerformed: false });
    }
    if (!request.ownerApproved) {
      return Object.freeze({ schemaVersion: ARCHIVE_RETENTION_SCHEMA, authorized: false, paths: Object.freeze([]), reason: 'owner-approval-required', mutationPerformed: false });
    }
    if (!request.branchName.startsWith('agent/documentary-maintenance-')) {
      return Object.freeze({ schemaVersion: ARCHIVE_RETENTION_SCHEMA, authorized: false, paths: Object.freeze([]), reason: 'maintenance-branch-required', mutationPerformed: false });
    }

    const paths = request.assessments
      .filter((assessment) => assessment.disposition === 'delete-eligible')
      .map((assessment) => assessment.path)
      .sort();

    return Object.freeze({
      schemaVersion: ARCHIVE_RETENTION_SCHEMA,
      authorized: paths.length > 0,
      paths: Object.freeze(paths),
      reason: paths.length > 0 ? 'owner-approved-deletion-plan' : 'no-delete-eligible-artifacts',
      mutationPerformed: false,
    });
  }
}

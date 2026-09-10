export type AuthorityId = `AUTH-${string}`;
export type ControlId = `CTRL-${string}`;
export type DocumentId = `DOC-${string}`;

export type GovernanceLifecycle =
  | 'proposed'
  | 'owner-directed'
  | 'accepted'
  | 'accepted-for-implementation'
  | 'active'
  | 'resolved'
  | 'superseded'
  | 'historical'
  | 'archived'
  | 'rejected';

export type EnforcementLevel = 'required' | 'advisory' | 'informational';

export interface AuthorityReference {
  authorityId: AuthorityId;
  displayId: string;
  version: string;
  date: string;
  lifecycle: GovernanceLifecycle | string;
  path: string;
  scope: string;
  aliases?: readonly string[];
}

export interface GovernanceControl {
  controlId: ControlId;
  title: string;
  status: EnforcementLevel;
  authorityRefs: readonly AuthorityId[];
  requirement: string;
  evidence: readonly string[];
}

export interface SupersessionEdge {
  supersededAuthorityId: AuthorityId;
  supersedingAuthorityId: AuthorityId;
  effectiveDate: string;
  impactEvidencePath: string;
  ownerDecisionRef: string;
}

export type PrePrCheckResult = 'PASS' | 'FAIL' | 'SKIPPED' | 'NOT_AVAILABLE';

export interface PrePrCheckEvidence {
  id: string;
  command: string;
  result: PrePrCheckResult;
  durationMs?: number;
  evidenceDigest?: `sha256:${string}`;
  note?: string;
}

export interface PrePrBuildEvidence {
  schemaVersion: 'pre-pr-build/1.0.0';
  trustClass: 'developer-preflight';
  repository: 'capital-ai-online/Finance';
  baseMainSha: string;
  candidateHeadSha: string;
  executor: {
    host: string;
    identity: string;
    environment?: string;
  };
  checks: readonly PrePrCheckEvidence[];
  createdAt: string;
  aggregateEvidenceDigest?: `sha256:${string}`;
  nonAuthorizingStatement?: 'This evidence does not authorize PR creation, merge, deployment, production mutation or privilege elevation.';
}

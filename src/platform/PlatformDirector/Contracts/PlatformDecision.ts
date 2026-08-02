export type PlatformDecisionType =
  | 'Architecture Decision'
  | 'Governance Decision'
  | 'Release Decision'
  | 'Exception Decision'
  | 'Risk Decision'
  | 'Priority Decision'
  | 'Emergency Decision';

export type PlatformDecisionStatus = 'APPROVED' | 'REJECTED' | 'DEFERRED' | 'REVOKED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface EvidenceReference {
  evidenceId: string;
  source: string;
  observedAt: string;
}

export interface PlatformDecisionPrerequisites {
  supervisorAssessment?: EvidenceReference & { outcome: 'PASS' | 'BLOCKED' };
  impactAnalysis?: EvidenceReference & { affectedComponents: string[] };
  riskAssessment?: EvidenceReference & { level: RiskLevel };
  digitalTwin?: EvidenceReference & { state: 'SYNCHRONIZED' | 'DRIFTED' | 'UNAVAILABLE' };
  decisionBasis: EvidenceReference[];
}

export interface ReleaseDecisionEvidence {
  releaseCandidateEvidenceId: string;
  rollbackPlan: string;
  qualityGate: 'PASS' | 'FAIL' | 'UNAVAILABLE';
  securityGate: 'PASS' | 'FAIL' | 'UNAVAILABLE';
  complianceGate: 'PASS' | 'FAIL' | 'UNAVAILABLE';
  versionGate: 'PASS' | 'FAIL' | 'UNAVAILABLE';
}

export interface PlatformDecisionRequest {
  decisionId: string;
  title: string;
  type: PlatformDecisionType;
  subject: string;
  alternatives: string[];
  rationale: string;
  affectedComponents: string[];
  affectedContracts: string[];
  version: string;
  adrReference?: string;
  correlationId: string;
  requestedBy: string;
  prerequisites: PlatformDecisionPrerequisites;
  releaseEvidence?: ReleaseDecisionEvidence;
}

export interface PlatformDecisionRecord extends PlatformDecisionRequest {
  status: PlatformDecisionStatus;
  decidedAt: string;
  decidedBy: 'Platform Director';
  reasons: string[];
  immutableSequence: number;
}

export interface PlatformExceptionRequest {
  exceptionId: string;
  violatedContract: string;
  rationale: string;
  risk: RiskLevel;
  targetState: string;
  status: 'Approved' | 'Time Limited' | 'Permanent';
  adrReference: string;
  correlationId: string;
  prerequisites: PlatformDecisionPrerequisites;
}

export interface OwnershipAssignmentRequest {
  component: string;
  owner: string;
  rationale: string;
  adrReference?: string;
  correlationId: string;
  prerequisites: PlatformDecisionPrerequisites;
}

export const PLATFORM_DIRECTOR_CONTRACT_VERSION = 'platform-director-decision/0.1.0' as const;

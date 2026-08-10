import type { PlatformDecisionRecord } from '../Contracts/PlatformDecision';

export interface ProtectedDecisionBoundaryResult {
  valid: boolean;
  errors: readonly string[];
}

const RELEASE_GATE_NAMES = ['qualityGate', 'securityGate', 'complianceGate', 'versionGate'] as const;

export function validateProtectedDecisionBoundary(
  decision: PlatformDecisionRecord,
): ProtectedDecisionBoundaryResult {
  const errors: string[] = [];

  if (decision.status !== 'APPROVED') {
    errors.push('decision must be APPROVED');
  }

  if (decision.decidedBy !== 'Platform Director') {
    errors.push('decision must be approved by Platform Director');
  }

  if (!decision.correlationId.trim()) {
    errors.push('correlationId is required');
  }

  if (decision.prerequisites.decisionBasis.length === 0) {
    errors.push('at least one decision-basis evidence reference is required');
  }

  if (decision.prerequisites.supervisorAssessment?.outcome === 'BLOCKED') {
    errors.push('blocked Supervisor evidence cannot pass the protected boundary');
  }

  if (decision.type === 'Release Decision') {
    const releaseEvidence = decision.releaseEvidence;
    if (!releaseEvidence) {
      errors.push('release evidence is required for Release Decision');
    } else {
      if (!releaseEvidence.releaseCandidateEvidenceId.trim()) {
        errors.push('releaseCandidateEvidenceId is required');
      }
      if (!releaseEvidence.rollbackPlan.trim()) {
        errors.push('rollbackPlan is required');
      }

      for (const gateName of RELEASE_GATE_NAMES) {
        if (releaseEvidence[gateName] !== 'PASS') {
          errors.push(`${gateName} must be PASS`);
        }
      }
    }
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze([...errors]),
  });
}

export function assertProtectedDecisionBoundary(decision: PlatformDecisionRecord): void {
  const result = validateProtectedDecisionBoundary(decision);
  if (!result.valid) {
    throw new Error(`[ProtectedDecisionBoundary] ${result.errors.join('; ')}`);
  }
}

import { describe, expect, it } from 'vitest';
import type { PlatformDecisionRecord } from '../../src/platform/PlatformDirector/Contracts/PlatformDecision';
import { assertProtectedDecisionBoundary, validateProtectedDecisionBoundary } from '../../src/platform/PlatformDirector/Policies/ProtectedDecisionBoundary';

function decision(overrides: Partial<PlatformDecisionRecord> = {}): PlatformDecisionRecord {
  return {
    decisionId: 'DEC-E6-001',
    title: 'Protected release decision',
    type: 'Release Decision',
    subject: 'CAPITAL-AI release',
    alternatives: ['release', 'defer'],
    rationale: 'Verified release evidence is available.',
    affectedComponents: ['Release'],
    affectedContracts: [],
    version: '0.6.0',
    correlationId: 'corr-e6-001',
    requestedBy: 'Supervisor',
    prerequisites: {
      supervisorAssessment: {
        evidenceId: 'EV-SUP-001',
        source: 'Supervisor',
        observedAt: '2026-08-10T09:00:00.000Z',
        outcome: 'PASS',
      },
      decisionBasis: [{ evidenceId: 'EV-REL-001', source: 'Release', observedAt: '2026-08-10T09:00:00.000Z' }],
    },
    releaseEvidence: {
      releaseCandidateEvidenceId: 'EV-RC-001',
      rollbackPlan: 'Rollback to previous verified release.',
      qualityGate: 'PASS',
      securityGate: 'PASS',
      complianceGate: 'PASS',
      versionGate: 'PASS',
    },
    status: 'APPROVED',
    decidedAt: '2026-08-10T09:01:00.000Z',
    decidedBy: 'Platform Director',
    reasons: ['All protected gates passed.'],
    immutableSequence: 1,
    ...overrides,
  };
}

describe('E6 protected decision boundary', () => {
  it('accepts an approved release decision with complete passing evidence', () => {
    expect(validateProtectedDecisionBoundary(decision())).toEqual({ valid: true, errors: [] });
    expect(() => assertProtectedDecisionBoundary(decision())).not.toThrow();
  });

  it('blocks non-approved decisions and blocked Supervisor evidence', () => {
    const result = validateProtectedDecisionBoundary(decision({
      status: 'DEFERRED',
      prerequisites: {
        supervisorAssessment: {
          evidenceId: 'EV-SUP-002', source: 'Supervisor', observedAt: '2026-08-10T09:00:00.000Z', outcome: 'BLOCKED',
        },
        decisionBasis: [{ evidenceId: 'EV-REL-001', source: 'Release', observedAt: '2026-08-10T09:00:00.000Z' }],
      },
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('decision must be APPROVED');
    expect(result.errors).toContain('blocked Supervisor evidence cannot pass the protected boundary');
  });

  it('requires all release gates to pass', () => {
    const result = validateProtectedDecisionBoundary(decision({
      releaseEvidence: {
        releaseCandidateEvidenceId: 'EV-RC-001',
        rollbackPlan: 'Rollback.',
        qualityGate: 'FAIL',
        securityGate: 'PASS',
        complianceGate: 'UNAVAILABLE',
        versionGate: 'PASS',
      },
    }));
    expect(result.errors).toContain('qualityGate must be PASS');
    expect(result.errors).toContain('complianceGate must be PASS');
  });

  it('requires explicit decision-basis evidence', () => {
    const result = validateProtectedDecisionBoundary(decision({
      prerequisites: { decisionBasis: [] },
    }));
    expect(result.errors).toContain('at least one decision-basis evidence reference is required');
  });
});

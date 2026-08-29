import { describe, expect, it } from 'vitest';
import { projectDefiContractAssuranceHardGate } from '../../src/platform/Scoring/CryptoContractAssuranceHardGateProjection';
import type { CryptoContractAssuranceEvaluation } from '../../src/platform/Scoring/CryptoContractAssuranceEvidence';

function evaluation(
  state: CryptoContractAssuranceEvaluation['state'],
  verified: boolean | null,
): CryptoContractAssuranceEvaluation {
  return {
    contractVersion: 'crypto-contract-assurance-evidence/0.1.0',
    identity: {
      protocolId: 'protocol-a',
      chainId: 'eip155:1',
      contractAddress: '0xabc',
      runtimeCodeHash: 'sha256:runtime-a',
    },
    state,
    smartContractEvidenceVerified: verified,
    acceptedCodeIdentityObservationCount: 1,
    acceptedAuditObservationCount: 1,
    acceptedFormalVerificationObservationCount: 0,
    independentAuditorCount: 1,
    authorityIds: ['auditor-a@1.0.0'],
    evidenceRefs: ['evidence:audit-a'],
    reason: `state:${state}`,
    scoreEligible: false,
    executionEligible: false,
    authority: 'RESEARCH_EVIDENCE_ONLY',
  };
}

describe('crypto contract assurance hard-gate projection', () => {
  it('fails closed without assurance evidence', () => {
    const gate = projectDefiContractAssuranceHardGate(undefined);
    expect(gate.key).toBe('smartContractEvidenceVerified');
    expect(gate.state).toBe('NOT_COMPUTABLE');
  });

  it('projects blocked assurance evidence to the existing DeFi hard gate', () => {
    const gate = projectDefiContractAssuranceHardGate(evaluation('BLOCKED', false));
    expect(gate.state).toBe('BLOCKED');
    expect(gate.sourcePath).toBe('contractAssurance.smartContractEvidenceVerified');
  });

  it('projects only explicit computable PASS as PASS', () => {
    expect(projectDefiContractAssuranceHardGate(evaluation('NOT_COMPUTABLE', null)).state).toBe('NOT_COMPUTABLE');
    expect(projectDefiContractAssuranceHardGate(evaluation('PASS', true)).state).toBe('PASS');
  });
});

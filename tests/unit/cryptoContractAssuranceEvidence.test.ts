import { describe, expect, it } from 'vitest';
import {
  evaluateCryptoContractAssuranceEvidence,
  type CryptoAuditObservation,
  type CryptoCodeIdentityObservation,
  type CryptoContractAssuranceIdentity,
  type CryptoContractAssurancePolicy,
  type CryptoFormalVerificationObservation,
} from '../../src/platform/Scoring/CryptoContractAssuranceEvidence';

const NOW = 2_000_000;

const identity: CryptoContractAssuranceIdentity = {
  protocolId: 'protocol-a',
  chainId: 'eip155:1',
  contractAddress: '0xabc',
  runtimeCodeHash: 'sha256:runtime-a',
};

const policy: CryptoContractAssurancePolicy = {
  policyId: 'contract-assurance-policy',
  policyVersion: '1.0.0',
  maxObservationAgeMs: 60_000,
  maxAuditAgeMs: 365 * 24 * 60 * 60 * 1000,
  maxFormalProofAgeMs: 365 * 24 * 60 * 60 * 1000,
  codeIdentityRequirement: 'REQUIRED',
  minIndependentAuditors: 1,
  requiredAuditScope: 'FULL_CONTRACT',
  blockingFindingSeverities: ['CRITICAL', 'HIGH'],
  formalVerificationRequirement: 'NOT_REQUIRED',
};

function codeIdentity(overrides: Partial<CryptoCodeIdentityObservation> = {}): CryptoCodeIdentityObservation {
  return {
    ...identity,
    state: 'EXACT_MATCH',
    observedAtMs: NOW - 1_000,
    providerId: 'source-verifier',
    authorityId: 'source-verification-authority',
    authorityVersion: '1.0.0',
    evidenceRefs: ['evidence:source-match'],
    ...overrides,
  };
}

function audit(overrides: Partial<CryptoAuditObservation> = {}): CryptoAuditObservation {
  return {
    ...identity,
    auditId: 'audit-a',
    scope: 'FULL_CONTRACT',
    reportIssuedAtMs: NOW - 20_000,
    observedAtMs: NOW - 1_000,
    auditorAuthorityId: 'auditor-a',
    auditorAuthorityVersion: '1.0.0',
    reportAuthorityId: 'audit-report-registry',
    reportAuthorityVersion: '1.0.0',
    findings: [
      { severity: 'CRITICAL', unresolvedCount: 0 },
      { severity: 'HIGH', unresolvedCount: 0 },
    ],
    evidenceRefs: ['evidence:audit-a'],
    ...overrides,
  };
}

function proof(overrides: Partial<CryptoFormalVerificationObservation> = {}): CryptoFormalVerificationObservation {
  return {
    ...identity,
    proofId: 'proof-a',
    state: 'PROVED',
    specificationId: 'spec-a',
    specificationVersion: '1.0.0',
    verifierId: 'smt-checker',
    verifierVersion: '1.0.0',
    proofGeneratedAtMs: NOW - 20_000,
    observedAtMs: NOW - 1_000,
    authorityId: 'formal-verification-authority',
    authorityVersion: '1.0.0',
    evidenceRefs: ['evidence:proof-a'],
    ...overrides,
  };
}

describe('crypto contract assurance evidence', () => {
  it('fails closed when evidence is absent', () => {
    const result = evaluateCryptoContractAssuranceEvidence(identity, undefined, undefined, undefined, policy, NOW);
    expect(result.state).toBe('NOT_COMPUTABLE');
    expect(result.smartContractEvidenceVerified).toBeNull();
  });

  it('does not treat source verification alone as smart-contract assurance', () => {
    const result = evaluateCryptoContractAssuranceEvidence(identity, [codeIdentity()], [], [], policy, NOW);
    expect(result.state).toBe('NOT_COMPUTABLE');
    expect(result.independentAuditorCount).toBe(0);
  });

  it('passes when governed source identity and audit policy requirements are satisfied', () => {
    const result = evaluateCryptoContractAssuranceEvidence(identity, [codeIdentity()], [audit()], [], policy, NOW);
    expect(result.state).toBe('PASS');
    expect(result.smartContractEvidenceVerified).toBe(true);
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
  });

  it('blocks a deployed-code mismatch', () => {
    const result = evaluateCryptoContractAssuranceEvidence(
      identity,
      [codeIdentity({ state: 'MISMATCH' })],
      [audit()],
      [],
      policy,
      NOW,
    );
    expect(result.state).toBe('BLOCKED');
    expect(result.smartContractEvidenceVerified).toBe(false);
  });

  it('blocks unresolved findings in policy-blocking severities', () => {
    const result = evaluateCryptoContractAssuranceEvidence(
      identity,
      [codeIdentity()],
      [audit({ findings: [{ severity: 'HIGH', unresolvedCount: 1 }] })],
      [],
      policy,
      NOW,
    );
    expect(result.state).toBe('BLOCKED');
  });

  it('does not manufacture independence from duplicate auditor authority', () => {
    const twoAuditorPolicy = { ...policy, minIndependentAuditors: 2 };
    const duplicate = audit({ auditId: 'audit-b', evidenceRefs: ['evidence:audit-b'] });
    const result = evaluateCryptoContractAssuranceEvidence(
      identity,
      [codeIdentity()],
      [audit(), duplicate],
      [],
      twoAuditorPolicy,
      NOW,
    );
    expect(result.state).toBe('NOT_COMPUTABLE');
    expect(result.independentAuditorCount).toBe(1);
  });

  it('does not let a partial audit satisfy a full-contract audit requirement by itself', () => {
    const result = evaluateCryptoContractAssuranceEvidence(
      identity,
      [codeIdentity()],
      [audit({ scope: 'PARTIAL' })],
      [],
      policy,
      NOW,
    );
    expect(result.state).toBe('NOT_COMPUTABLE');
  });

  it('requires an explicit proved formal-verification result when policy requires it', () => {
    const formalPolicy = { ...policy, formalVerificationRequirement: 'REQUIRED' as const };

    const missing = evaluateCryptoContractAssuranceEvidence(identity, [codeIdentity()], [audit()], [], formalPolicy, NOW);
    expect(missing.state).toBe('NOT_COMPUTABLE');

    const inconclusive = evaluateCryptoContractAssuranceEvidence(
      identity,
      [codeIdentity()],
      [audit()],
      [proof({ state: 'INCONCLUSIVE' })],
      formalPolicy,
      NOW,
    );
    expect(inconclusive.state).toBe('NOT_COMPUTABLE');

    const proved = evaluateCryptoContractAssuranceEvidence(
      identity,
      [codeIdentity()],
      [audit()],
      [proof()],
      formalPolicy,
      NOW,
    );
    expect(proved.state).toBe('PASS');
  });

  it('blocks an explicit formal-verification counterexample', () => {
    const result = evaluateCryptoContractAssuranceEvidence(
      identity,
      [codeIdentity()],
      [audit()],
      [proof({ state: 'COUNTEREXAMPLE' })],
      policy,
      NOW,
    );
    expect(result.state).toBe('BLOCKED');
    expect(result.smartContractEvidenceVerified).toBe(false);
  });

  it('rejects stale or identity-mismatched observations instead of treating them as evidence', () => {
    const stale = codeIdentity({ observedAtMs: NOW - policy.maxObservationAgeMs - 1 });
    const wrongContract = audit({ contractAddress: '0xdef' });
    const result = evaluateCryptoContractAssuranceEvidence(identity, [stale], [wrongContract], [], policy, NOW);
    expect(result.state).toBe('NOT_COMPUTABLE');
    expect(result.acceptedCodeIdentityObservationCount).toBe(0);
    expect(result.acceptedAuditObservationCount).toBe(0);
  });
});

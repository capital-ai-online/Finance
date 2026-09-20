import { describe, expect, it } from 'vitest';
import {
  FINDING_CLASSES,
  canTransitionRecoveryState,
  evaluateRemediationEligibility,
  getRemediationAction,
  getRemediationPolicies,
  getRemediationPolicy,
  getSelfHealingContractSnapshot,
  resolveConvergence,
  validateSelfHealingContract,
  validateVerificationEvidence,
  type VerificationEvidence,
} from '../../src/platform/Supervisor/selfHealingContract';

const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);
const SHA_C = 'c'.repeat(40);
const DIGEST_A = `sha256:${'a'.repeat(64)}`;
const DIGEST_B = `sha256:${'b'.repeat(64)}`;
const DIGEST_C = `sha256:${'c'.repeat(64)}`;
const DIGEST_D = `sha256:${'d'.repeat(64)}`;

function validEvidence(overrides: Partial<VerificationEvidence> = {}): VerificationEvidence {
  return {
    schema: 'self-healing-evidence/1.0.0',
    evidenceId: 'EV-TEST-001',
    generation: {
      kind: 'PR',
      repository: 'capital-ai-online/Finance',
      prNumber: 1,
      headSha: SHA_A,
      baseSha: SHA_B,
      currentMainSha: SHA_C,
      controlPlaneVersion: '4.6.0',
      generationDigest: DIGEST_A,
    },
    source: {
      authority: 'vitest',
      ref: 'tests/unit/selfHealingContract.test.ts',
      observedAt: '2026-09-20T15:30:00.000Z',
    },
    integrity: {
      inputDigest: DIGEST_B,
      resultDigest: DIGEST_C,
      recordDigest: DIGEST_D,
    },
    reproducible: true,
    current: true,
    generationBound: true,
    sourceBound: true,
    integrityValid: true,
    readback: { required: true, verified: true },
    contradictionFree: true,
    requiredAssurance: [],
    assurance: {},
    ...overrides,
  };
}

describe('self-healing contract', () => {
  it('covers every canonical finding class with one deterministic policy', () => {
    const policies = getRemediationPolicies();
    expect(policies).toHaveLength(FINDING_CLASSES.length);
    expect(new Set(policies.map(policy => policy.findingClass))).toEqual(new Set(FINDING_CLASSES));
    expect(validateSelfHealingContract()).toEqual([]);
  });

  it('keeps SH-2 and SH-3 actions held behind external capabilities', () => {
    const snapshot = getSelfHealingContractSnapshot();
    expect(snapshot.valid).toBe(true);

    for (const actionId of snapshot.protectedActionIds) {
      const action = getRemediationAction(actionId);
      expect(action.activation).toBe('HELD');
      expect(action.requiredCapability).toBeTruthy();
      expect(action.requiredCapability).not.toBe(action.id);
    }
  });

  it('allows the already implemented frontend stale-asset recovery only once', () => {
    const first = evaluateRemediationEligibility({
      findingClass: 'FRONTEND_STALE_ASSET',
      actionId: 'FRONTEND_RELOAD_ONCE',
      attemptsUsed: 0,
      nowMs: 1_000,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(first.state).toBe('ELIGIBLE');
    if (first.state === 'ELIGIBLE') expect(first.remainingAttempts).toBe(1);

    const exhausted = evaluateRemediationEligibility({
      findingClass: 'FRONTEND_STALE_ASSET',
      actionId: 'FRONTEND_RELOAD_ONCE',
      attemptsUsed: 1,
      nowMs: 2_000,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(exhausted).toMatchObject({ state: 'BLOCKED', reason: 'BUDGET_EXHAUSTED' });
  });

  it('maps repository projection drift to one bounded PR-autofix action', () => {
    for (const findingClass of [
      'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT',
      'REPOSITORY_WORK_GRAPH_EXPECTATION_DRIFT',
    ] as const) {
      const policy = getRemediationPolicy(findingClass);
      expect(policy.preferredActionId).toBe('RECONCILE_REPOSITORY_PROJECTION');
      expect(policy.allowedActionIds).toEqual([
        'RECONCILE_REPOSITORY_PROJECTION',
        'OBSERVE_ONLY',
      ]);
    }

    const action = getRemediationAction('RECONCILE_REPOSITORY_PROJECTION');
    expect(action).toMatchObject({
      tier: 'SH-1',
      activation: 'ENABLED',
      idempotencyClass: 'IDEMPOTENT',
      blastRadius: 'WORK_ITEM',
      requiredCapability: 'repository.pr.autofix',
      killSwitch: 'self-healing.repository-pr-autofix',
      verificationProbe: 'exact-pr-head-ci-governance-readback',
      budget: { maxAttempts: 1 },
    });

    const unauthorized = evaluateRemediationEligibility({
      findingClass: 'REPOSITORY_WORK_GRAPH_EXPECTATION_DRIFT',
      actionId: 'RECONCILE_REPOSITORY_PROJECTION',
      attemptsUsed: 0,
      nowMs: 1_000,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(unauthorized).toMatchObject({ state: 'BLOCKED', reason: 'CAPABILITY_NOT_AUTHORIZED' });

    const eligible = evaluateRemediationEligibility({
      findingClass: 'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT',
      actionId: 'RECONCILE_REPOSITORY_PROJECTION',
      attemptsUsed: 0,
      nowMs: 1_000,
      killSwitchActive: false,
      capabilityAuthorized: true,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(eligible).toMatchObject({ state: 'ELIGIBLE', remainingAttempts: 1 });
  });

  it('fails closed for held, killed, unverified and unsafe remediation', () => {
    const held = evaluateRemediationEligibility({
      findingClass: 'DEPENDENCY_TRANSIENT',
      actionId: 'RETRY_SAFE_OPERATION',
      attemptsUsed: 0,
      nowMs: 1_000,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: true,
      operationIdempotency: 'READ_ONLY',
    });
    expect(held).toMatchObject({ state: 'BLOCKED', reason: 'ACTION_HELD' });

    const killed = evaluateRemediationEligibility({
      findingClass: 'FRONTEND_STALE_ASSET',
      actionId: 'FRONTEND_RELOAD_ONCE',
      attemptsUsed: 0,
      nowMs: 1_000,
      killSwitchActive: true,
      capabilityAuthorized: false,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(killed).toMatchObject({ state: 'BLOCKED', reason: 'KILL_SWITCH_ACTIVE' });

    const unverified = evaluateRemediationEligibility({
      findingClass: 'FRONTEND_STALE_ASSET',
      actionId: 'FRONTEND_RELOAD_ONCE',
      attemptsUsed: 0,
      nowMs: 1_000,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: false,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(unverified).toMatchObject({ state: 'BLOCKED', reason: 'VERIFICATION_UNAVAILABLE' });

    const wrongFinding = evaluateRemediationEligibility({
      findingClass: 'SECURITY_OR_POLICY_BLOCKED',
      actionId: 'FRONTEND_RELOAD_ONCE',
      attemptsUsed: 0,
      nowMs: 1_000,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(wrongFinding).toMatchObject({ state: 'BLOCKED', reason: 'ACTION_NOT_ALLOWED_FOR_FINDING' });
  });

  it('declares bounded cooldowns without arbitrary polling loops', () => {
    const action = getRemediationAction('RETRY_SAFE_OPERATION');
    expect(action.budget.cooldownMs).toBeGreaterThan(0);

    // Temporarily held actions are tested at the contract level; once activated, cooldown
    // evaluation remains deterministic because callers supply both timestamps.
    const result = evaluateRemediationEligibility({
      findingClass: 'DEPENDENCY_TRANSIENT',
      actionId: 'RETRY_SAFE_OPERATION',
      attemptsUsed: 0,
      nowMs: 1_000,
      lastAttemptAtMs: 900,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: true,
      operationIdempotency: 'READ_ONLY',
    });
    expect(result).toMatchObject({ state: 'BLOCKED', reason: 'ACTION_HELD' });
  });

  it('permits only the declared recovery state machine transitions', () => {
    expect(canTransitionRecoveryState('OBSERVED', 'DIAGNOSED')).toBe(true);
    expect(canTransitionRecoveryState('DIAGNOSED', 'ELIGIBLE')).toBe(true);
    expect(canTransitionRecoveryState('DIAGNOSED', 'BLOCKED')).toBe(true);
    expect(canTransitionRecoveryState('ELIGIBLE', 'REMEDIATING')).toBe(true);
    expect(canTransitionRecoveryState('REMEDIATING', 'VERIFYING')).toBe(true);
    expect(canTransitionRecoveryState('VERIFYING', 'CONVERGED')).toBe(true);

    expect(canTransitionRecoveryState('OBSERVED', 'REMEDIATING')).toBe(false);
    expect(canTransitionRecoveryState('BLOCKED', 'REMEDIATING')).toBe(false);
    expect(canTransitionRecoveryState('CONVERGED', 'REMEDIATING')).toBe(false);
  });

  it('permits convergence only for a PASS backed by valid generation-bound evidence', () => {
    const result = resolveConvergence('FRONTEND_RELOAD_ONCE', {
      status: 'PASS',
      probe: 'frontend-runtime-rehydrated',
      evidenceRef: 'test:pass',
      evidence: validEvidence(),
    }, 1);

    expect(result).toMatchObject({
      state: 'CONVERGED',
      converged: true,
      reason: 'VERIFIED',
      evidenceValidation: { valid: true, issues: [] },
    });
  });

  it('rejects a bare PASS and every stale/readback-invalid positive claim', () => {
    const untypedBarePass = {
      status: 'PASS',
      probe: 'frontend-runtime-rehydrated',
      evidenceRef: 'test:bare-pass',
    } as unknown as import('../../src/platform/Supervisor/selfHealingContract').VerificationResult;
    expect(resolveConvergence('FRONTEND_RELOAD_ONCE', untypedBarePass, 1)).toMatchObject({
      state: 'ESCALATED',
      converged: false,
      reason: 'VERIFICATION_EVIDENCE_INVALID',
      evidenceValidation: { valid: false, issues: ['EVIDENCE_REQUIRED'] },
    });

    const stale = validEvidence({ current: false });
    expect(validateVerificationEvidence(stale)).toMatchObject({
      valid: false,
      issues: expect.arrayContaining(['EVIDENCE_STALE']),
    });

    const noReadback = validEvidence({ readback: { required: true, verified: false } });
    expect(validateVerificationEvidence(noReadback)).toMatchObject({
      valid: false,
      issues: expect.arrayContaining(['READBACK_NOT_VERIFIED']),
    });
  });

  it('requires independent QM and Security assurance for protected SH-3 convergence', () => {
    const withoutAssurance = resolveConvergence('PROTECTED_ROLLBACK_RESTORE', {
      status: 'PASS',
      probe: 'independent-rollback-restore-integrity',
      evidenceRef: 'test:protected',
      evidence: validEvidence(),
    }, 1);
    expect(withoutAssurance).toMatchObject({
      state: 'ESCALATED',
      converged: false,
      reason: 'VERIFICATION_EVIDENCE_INVALID',
    });
    expect(withoutAssurance.evidenceValidation.issues).toEqual(
      expect.arrayContaining(['QM_ASSURANCE_NOT_VERIFIED', 'SECURITY_ASSURANCE_NOT_VERIFIED']),
    );

    const withAssurance = resolveConvergence('PROTECTED_ROLLBACK_RESTORE', {
      status: 'PASS',
      probe: 'independent-rollback-restore-integrity',
      evidenceRef: 'test:protected-verified',
      evidence: validEvidence({
        assurance: { QM: 'VERIFIED', SECURITY: 'VERIFIED' },
      }),
    }, 1);
    expect(withAssurance).toMatchObject({ state: 'CONVERGED', converged: true, reason: 'VERIFIED' });
  });

  it('maps explicit non-positive evidence states without manufacturing convergence', () => {
    const expected = [
      ['NOT_RUN', 'VERIFICATION_NOT_RUN'],
      ['NOT_EXECUTED', 'VERIFICATION_NOT_RUN'],
      ['PENDING', 'VERIFICATION_PENDING'],
      ['NOT_AVAILABLE', 'EVIDENCE_NOT_AVAILABLE'],
      ['STALE', 'EVIDENCE_STALE'],
      ['IDENTITY_MISMATCH', 'IDENTITY_MISMATCH'],
      ['READBACK_FAILED', 'READBACK_FAILED'],
      ['BLOCKED', 'VERIFICATION_BLOCKED'],
    ] as const;

    for (const [status, reason] of expected) {
      expect(resolveConvergence('FRONTEND_RELOAD_ONCE', {
        status,
        probe: 'frontend-runtime-rehydrated',
      }, 1)).toMatchObject({ state: 'ESCALATED', converged: false, reason });
    }

    expect(resolveConvergence('FRONTEND_RELOAD_ONCE', {
      status: 'FAIL',
      probe: 'frontend-runtime-rehydrated',
    }, 1)).toMatchObject({ state: 'DEGRADED', converged: false, reason: 'VERIFICATION_FAILED' });
  });
});

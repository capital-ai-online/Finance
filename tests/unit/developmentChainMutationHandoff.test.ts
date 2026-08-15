import { describe, expect, it } from 'vitest';
import {
  evaluateMutationHandoffExecution,
  validateMutationHandoff,
  type MutationHandoff,
  type MutationHandoffValidation,
} from '../../src/platform/Security/developmentChainMutationHandoff';

function errorsOf(result: MutationHandoffValidation): readonly string[] {
  if ('errors' in result) return result.errors;
  throw new Error('expected an invalid validation result');
}

// M7 (ADR-0061, docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md, "Required Negative Tests").
// Proves every scenario from the runbook's negative-test list that concerns the DEVELOPMENT Chain
// Mutation Handoff Contract actually resolves to DENY, not just that the schema document reads
// strictly. This gate is not wired into a live Render executor (none exists; M7 mutations remain
// manual Owner actions verified after the fact) - it is the contract such an executor would have
// to satisfy if one is ever built.

const VALID_SHA = 'a'.repeat(40);
const FUTURE = '2099-01-01T00:00:00.000Z';
const PAST = '2020-01-01T00:00:00.000Z';

function handoff(overrides: Partial<MutationHandoff> = {}): unknown {
  return {
    contractId: 'DCH-M7-ROLLBACK-VERIFICATION-001',
    contractVersion: '1.0.0',
    status: 'MUTATION_APPROVED',
    roadmapPhase: 'M7',
    roadmapItem: 'M7 rollback proof',
    repository: 'SvenKulessa/Finance',
    baseBranch: 'main',
    baseSha: VALID_SHA,
    owner: 'SvenKulessa',
    executorAgentId: 'render-manual-owner-execution',
    authorityRefs: ['ADR-0061', 'docs/runbooks/M7_ROLLBACK_VERIFICATION_HANDOFF.md'],
    approvalEvidenceRef: 'docs/runbooks/M7_ROLLBACK_VERIFICATION_HANDOFF.md#section-9',
    platform: 'RENDER',
    mutationClass: 'DEPLOYMENT',
    riskClass: 'LOW',
    targetResource: 'srv-d91o1o9o3t8c73edi55g',
    allowedOperations: ['RENDER_ROLLBACK_TO_DEPLOY', 'RENDER_REDEPLOY_LATEST_MAIN'],
    forbiddenOperations: ['MERGE', 'SELF_AUTHORITY_EXPANSION', 'SECURITY_CONTROL_DISABLEMENT'],
    expectedPostState: 'Render service srv-d91o1o9o3t8c73edi55g live on the Handoff target deploy.',
    idempotencyKey: 'm7-rollback-2026-08-14-001',
    concurrencyKey: 'm7-render-srv',
    auditRequired: true,
    dryRunRequired: false,
    expiresAt: FUTURE,
    ...overrides,
  };
}

function executionRequest(overrides: Partial<Parameters<typeof evaluateMutationHandoffExecution>[0]> = {}) {
  return {
    handoff: handoff(),
    actor: { humanActorId: 'SvenKulessa', executorAgentId: 'render-manual-owner-execution' },
    attemptedOperation: 'RENDER_ROLLBACK_TO_DEPLOY',
    attemptedTargetResource: 'srv-d91o1o9o3t8c73edi55g',
    auditPermitRef: 'audit-permit-2026-08-14-001',
    now: '2026-08-14T23:06:00.000Z',
    seenIdempotencyKeys: new Set<string>(),
    ...overrides,
  };
}

describe('validateMutationHandoff (structural)', () => {
  it('accepts a fully valid Handoff document', () => {
    expect(validateMutationHandoff(handoff())).toEqual({ valid: true, handoff: handoff() });
  });

  it('rejects a non-main baseBranch (deploy request from unverified source)', () => {
    const result = validateMutationHandoff(handoff({ baseBranch: 'feature/x' }));
    expect(result.valid).toBe(false);
    expect(errorsOf(result)).toContain('baseBranch muss main sein.');
  });

  it('rejects an invalid baseSha (source/artifact identity mismatch)', () => {
    const result = validateMutationHandoff(handoff({ baseSha: 'not-a-sha' }));
    expect(result.valid).toBe(false);
    expect(errorsOf(result)).toContain('baseSha ist kein gueltiger 40-stelliger Commit-SHA.');
  });

  it('rejects a Render targetResource that is not the known Finance service (wrong service/environment)', () => {
    const result = validateMutationHandoff(handoff({ targetResource: 'srv-some-other-service' }));
    expect(result.valid).toBe(false);
    expect(errorsOf(result)).toContain('targetResource ist kein bekannter RENDER-Dienst dieses Repositories.');
  });

  it('rejects a wildcard targetResource', () => {
    const result = validateMutationHandoff(handoff({ platform: 'GITHUB', targetResource: 'repos/*' }));
    expect(result.valid).toBe(false);
    expect(errorsOf(result)).toContain('targetResource fehlt oder enthaelt einen unzulaessigen Wildcard.');
  });

  it('requires approvalEvidenceRef once status needs Human/Owner Mutation Approval', () => {
    const result = validateMutationHandoff(handoff({ approvalEvidenceRef: undefined }));
    expect(result.valid).toBe(false);
    expect(errorsOf(result)).toContain(
      'Status MUTATION_APPROVED benoetigt approvalEvidenceRef (Human/Owner Mutation Approval).',
    );
  });

  it('rejects allowedOperations that contain MERGE or another never-allowed operation', () => {
    const result = validateMutationHandoff(
      handoff({ allowedOperations: ['RENDER_ROLLBACK_TO_DEPLOY', 'MERGE'] }),
    );
    expect(result.valid).toBe(false);
    expect(errorsOf(result)).toContain('allowedOperations darf MERGE niemals enthalten.');
  });

  it('rejects forbiddenOperations missing a mandatory reserved operation', () => {
    const result = validateMutationHandoff(
      handoff({ forbiddenOperations: ['SELF_AUTHORITY_EXPANSION', 'SECURITY_CONTROL_DISABLEMENT'] }),
    );
    expect(result.valid).toBe(false);
    expect(errorsOf(result)).toContain('forbiddenOperations muss MERGE enthalten.');
  });

  it('rejects a non-canonical owner or repository', () => {
    expect(validateMutationHandoff(handoff({ owner: 'someone-else' })).valid).toBe(false);
    expect(validateMutationHandoff(handoff({ repository: 'someone-else/Finance' })).valid).toBe(false);
  });
});

describe('evaluateMutationHandoffExecution (execution-time gate)', () => {
  it('allows a valid, in-scope operation attempted by the matching actor', () => {
    expect(evaluateMutationHandoffExecution(executionRequest())).toMatchObject({ verdict: 'ALLOW' });
  });

  it('denies when the acting human is not the Handoff owner (unverified source)', () => {
    const decision = evaluateMutationHandoffExecution(
      executionRequest({ actor: { humanActorId: 'not-sven', executorAgentId: 'render-manual-owner-execution' } }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/Human-Actor/);
  });

  it('denies when the acting agent does not match the Handoff executor', () => {
    const decision = evaluateMutationHandoffExecution(
      executionRequest({ actor: { humanActorId: 'SvenKulessa', executorAgentId: 'some-other-executor' } }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/Agent/);
  });

  it('denies execution once the Handoff/approval has expired', () => {
    const decision = evaluateMutationHandoffExecution(
      executionRequest({ handoff: handoff({ expiresAt: PAST }), now: '2026-08-14T23:06:00.000Z' }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/abgelaufen/);
  });

  it('denies when the attempted target does not match the Handoff target (target mismatch)', () => {
    const decision = evaluateMutationHandoffExecution(
      executionRequest({ attemptedTargetResource: 'srv-some-other-service' }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/Zielressource/);
  });

  it('denies a replayed/duplicate idempotency key (dedupe)', () => {
    const decision = evaluateMutationHandoffExecution(
      executionRequest({ seenIdempotencyKeys: new Set(['m7-rollback-2026-08-14-001']) }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/Replay\/Duplikat/);
  });

  it('denies execution without a durable audit permit reference', () => {
    const decision = evaluateMutationHandoffExecution(executionRequest({ auditPermitRef: null }));
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/Audit-Permit/);
  });

  it('denies an attempted MERGE operation regardless of Handoff contents', () => {
    const decision = evaluateMutationHandoffExecution(
      executionRequest({ attemptedOperation: 'MERGE', attemptedTargetResource: 'srv-d91o1o9o3t8c73edi55g' }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/nie zulaessig/);
  });

  it('denies an operation explicitly listed in forbiddenOperations beyond the always-forbidden set', () => {
    const decision = evaluateMutationHandoffExecution(
      executionRequest({
        handoff: handoff({
          forbiddenOperations: ['MERGE', 'SELF_AUTHORITY_EXPANSION', 'SECURITY_CONTROL_DISABLEMENT', 'RENDER_DELETE_SERVICE'],
        }),
        attemptedOperation: 'RENDER_DELETE_SERVICE',
      }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/explizit verboten/);
  });

  it('denies an arbitrary operation outside the Handoff allowlist', () => {
    const decision = evaluateMutationHandoffExecution(
      executionRequest({ attemptedOperation: 'RENDER_DELETE_SERVICE' }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/ausserhalb der Handoff-Allowlist/);
  });

  it('denies execution against a structurally invalid Handoff before checking anything else', () => {
    const decision = evaluateMutationHandoffExecution(
      executionRequest({ handoff: handoff({ baseBranch: 'feature/x' }) }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/Handoff-Struktur ungueltig/);
  });
});

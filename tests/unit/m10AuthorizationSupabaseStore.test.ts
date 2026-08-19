// M10 Phases 2/4/5 — durable authorization store query-contract tests.
import { beforeEach, describe, expect, it, vi } from 'vitest';

function chain(resolveValue: { data: unknown; error: unknown }) {
  const builder: any = {
    eq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    select: vi.fn(() => builder),
    update: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => resolveValue),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolveValue).then(resolve),
  };
  return builder;
}

const mocks = vi.hoisted(() => ({
  configured: vi.fn(() => true),
  from: vi.fn(),
  rpc: vi.fn(),
  insert: vi.fn(),
}));

vi.mock('../../server/db', () => ({
  isPrivilegedSupabaseConfigured: mocks.configured,
  getPrivilegedServerSupabase: vi.fn(() => ({ from: mocks.from, rpc: mocks.rpc })),
}));

import {
  createSupabaseM10ApprovalStore,
  createSupabaseM10AssertionCredentialStore,
  createSupabaseM10AuthorizationChallengeStore,
} from '../../server/m10/authorizationSupabaseStore';

const context = {
  ownerId: 'SvenKulessa',
  repository: 'SvenKulessa/Finance',
  prNumber: 417,
  baseBranch: 'main',
  baseSha: 'base-sha',
  headSha: 'head-sha',
  canonicalChangedFileSetHash: 'b'.repeat(64),
  canonicalDiffReviewDigest: 'c'.repeat(64),
  action: 'AUTHORIZE_PR_CI' as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.configured.mockReturnValue(true);
});

describe('createSupabaseM10AuthorizationChallengeStore', () => {
  it('persists the exact trusted PR context in the durable challenge table', async () => {
    mocks.insert.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert: mocks.insert });

    await createSupabaseM10AuthorizationChallengeStore().save({
      challenge: {
        challengeId: 'challenge-1',
        challenge: 'raw-challenge',
        context,
        issuedAt: '2026-08-19T01:00:00.000Z',
        expiresAt: '2026-08-19T01:02:00.000Z',
      },
      state: 'UNUSED',
    });

    expect(mocks.from).toHaveBeenCalledWith('m10_authorization_challenges');
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      challenge_id: 'challenge-1',
      repository: 'SvenKulessa/Finance',
      pr_number: 417,
      head_sha: 'head-sha',
      changed_file_set_hash: 'b'.repeat(64),
      diff_review_digest: 'c'.repeat(64),
      action: 'AUTHORIZE_PR_CI',
      consumed_at: null,
      revoked_at: null,
    }));
  });

  it('maps revoked durable challenge state before consumed state', async () => {
    const builder = chain({
      data: {
        challenge_id: 'challenge-1', challenge: 'raw', owner_actor_id: 'SvenKulessa',
        repository: 'SvenKulessa/Finance', pr_number: 417, base_branch: 'main', base_sha: 'base-sha',
        head_sha: 'head-sha', changed_file_set_hash: 'b'.repeat(64), diff_review_digest: 'c'.repeat(64),
        action: 'AUTHORIZE_PR_CI', issued_at: '2026-08-19T01:00:00.000Z',
        expires_at: '2026-08-19T01:02:00.000Z', consumed_at: null, revoked_at: '2026-08-19T01:01:00.000Z',
      },
      error: null,
    });
    mocks.from.mockReturnValue(builder);
    const result = await createSupabaseM10AuthorizationChallengeStore().get('challenge-1');
    expect(result?.state).toBe('REVOKED');
  });

  it('requires both consumed_at and revoked_at to be null for atomic revoke', async () => {
    const builder = chain({ data: { challenge_id: 'challenge-1' }, error: null });
    mocks.from.mockReturnValue(builder);
    const ok = await createSupabaseM10AuthorizationChallengeStore().revoke('challenge-1');
    expect(ok).toBe(true);
    expect(builder.is).toHaveBeenCalledWith('consumed_at', null);
    expect(builder.is).toHaveBeenCalledWith('revoked_at', null);
  });
});

describe('createSupabaseM10AssertionCredentialStore', () => {
  it('uses compare-and-set counter update on an active credential', async () => {
    const builder = chain({ data: { credential_id: 'cred-1' }, error: null });
    mocks.from.mockReturnValue(builder);

    const ok = await createSupabaseM10AssertionCredentialStore().updateCounter('cred-1', 5, 6);

    expect(ok).toBe(true);
    expect(mocks.from).toHaveBeenCalledWith('m10_owner_credentials');
    expect(builder.eq).toHaveBeenCalledWith('credential_id', 'cred-1');
    expect(builder.eq).toHaveBeenCalledWith('counter', 5);
    expect(builder.is).toHaveBeenCalledWith('revoked_at', null);
  });

  it('fails closed for a counter regression before touching the database', async () => {
    const ok = await createSupabaseM10AssertionCredentialStore().updateCounter('cred-1', 6, 5);
    expect(ok).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe('createSupabaseM10ApprovalStore', () => {
  it('persists immutable approval evidence with exact context binding', async () => {
    mocks.insert.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert: mocks.insert });
    const store = createSupabaseM10ApprovalStore();

    await store.save({
      approvalId: 'approval-1', ownerId: 'SvenKulessa', credentialId: 'cred-1', challengeId: 'challenge-1',
      authorizationDigest: 'a'.repeat(64), context, approvedAt: '2026-08-19T01:01:00.000Z', consumedAt: null,
    });

    expect(mocks.from).toHaveBeenCalledWith('m10_approval_evidence');
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      approval_id: 'approval-1', credential_id: 'cred-1', challenge_id: 'challenge-1',
      head_sha: 'head-sha', authorization_digest: 'a'.repeat(64), consumed_at: null,
    }));
  });

  it('claims CI consumption through the transactional RPC, never client-side read-modify-write', async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ status: 'CLAIMED', returned_consumption_id: 'consume-1', returned_consumed_at: '2026-08-19T01:02:00.000Z' }],
      error: null,
    });
    const result = await createSupabaseM10ApprovalStore().claim({
      approvalId: 'approval-1', consumptionId: 'consume-1', expectedRepository: 'SvenKulessa/Finance',
      expectedPrNumber: 417, expectedHeadSha: 'head-sha', expectedAuthorizationDigest: 'a'.repeat(64),
    });

    expect(result.status).toBe('CLAIMED');
    expect(mocks.rpc).toHaveBeenCalledWith('claim_m10_ci_consumption', expect.objectContaining({
      p_approval_id: 'approval-1', p_consumption_id: 'consume-1', p_expected_head_sha: 'head-sha',
    }));
  });

  it('preserves durable head dedupe from the database RPC', async () => {
    mocks.rpc.mockResolvedValue({ data: [{ status: 'DEDUPE_HEAD' }], error: null });
    const result = await createSupabaseM10ApprovalStore().claim({
      approvalId: 'approval-2', consumptionId: 'consume-2', expectedRepository: 'SvenKulessa/Finance',
      expectedPrNumber: 417, expectedHeadSha: 'head-sha', expectedAuthorizationDigest: 'd'.repeat(64),
    });
    expect(result.status).toBe('DEDUPE_HEAD');
  });

  it('finalizes a dispatch only through the terminal-state RPC', async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    const ok = await createSupabaseM10ApprovalStore().finalizeDispatch('consume-1', 'DISPATCHED');
    expect(ok).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith('finalize_m10_ci_dispatch', {
      p_consumption_id: 'consume-1', p_terminal_state: 'DISPATCHED', p_failure_reason: null,
    });
  });
});

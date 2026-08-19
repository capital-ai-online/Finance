import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isPrivilegedSupabaseConfigured: vi.fn(() => true),
  insert: vi.fn(),
  from: vi.fn(),
}));

vi.mock('../../server/db', () => ({
  isPrivilegedSupabaseConfigured: mocks.isPrivilegedSupabaseConfigured,
  getPrivilegedServerSupabase: vi.fn(() => ({ from: mocks.from })),
}));

import {
  createSupabaseM10ShadowApprovalStore,
  listRecentM10ShadowEvaluations,
} from '../../server/m10/shadowApprovalSupabaseStore';

const approval = {
  approvalId: 'shadow-1',
  ownerId: 'SvenKulessa',
  credentialId: 'cred-1',
  challengeId: 'challenge-1',
  authorizationDigest: 'a'.repeat(64),
  context: {
    ownerId: 'SvenKulessa',
    repository: 'SvenKulessa/Finance',
    prNumber: 419,
    baseBranch: 'main',
    baseSha: 'b'.repeat(40),
    headSha: 'c'.repeat(40),
    canonicalChangedFileSetHash: 'd'.repeat(64),
    canonicalDiffReviewDigest: 'e'.repeat(64),
    action: 'AUTHORIZE_PR_CI' as const,
  },
  approvedAt: '2026-08-19T02:30:00.000Z',
  consumedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isPrivilegedSupabaseConfigured.mockReturnValue(true);
});

describe('createSupabaseM10ShadowApprovalStore', () => {
  it('persists only to the non-authoritative shadow table', async () => {
    mocks.insert.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert: mocks.insert });

    await createSupabaseM10ShadowApprovalStore().save(approval);

    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith('m10_shadow_evaluations');
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      shadow_id: 'shadow-1',
      owner_actor_id: 'SvenKulessa',
      repository: 'SvenKulessa/Finance',
      pr_number: 419,
      verdict: 'APPROVED_SHADOW',
    }));
  });

  it('fails closed when privileged Supabase is unavailable', async () => {
    mocks.isPrivilegedSupabaseConfigured.mockReturnValue(false);
    await expect(createSupabaseM10ShadowApprovalStore().save(approval)).rejects.toThrow(/nicht konfiguriert/i);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe('listRecentM10ShadowEvaluations', () => {
  it('returns only the operational summary fields selected by the store', async () => {
    const row = {
      shadow_id: 'shadow-1', repository: 'SvenKulessa/Finance', pr_number: 419,
      base_branch: 'main', base_sha: 'b'.repeat(40), head_sha: 'c'.repeat(40),
      authorization_digest: 'a'.repeat(64), approved_at: '2026-08-19T02:30:00.000Z',
      observed_at: '2026-08-19T02:30:01.000Z', verdict: 'APPROVED_SHADOW',
    };
    const builder: any = {
      select: vi.fn(() => builder),
      order: vi.fn(() => builder),
      limit: vi.fn(async () => ({ data: [row], error: null })),
    };
    mocks.from.mockReturnValue(builder);

    const result = await listRecentM10ShadowEvaluations(10);

    expect(mocks.from).toHaveBeenCalledWith('m10_shadow_evaluations');
    expect(result).toEqual([expect.objectContaining({ shadowId: 'shadow-1', prNumber: 419, verdict: 'APPROVED_SHADOW' })]);
    expect(result[0]).not.toHaveProperty('credentialId');
    expect(result[0]).not.toHaveProperty('challengeId');
  });
});

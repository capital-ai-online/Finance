// ESS-0018 Phase 2 / ADR-0051: executeApprovedSupervisedAction() end-to-end (Policy -> Approval
// -> Apply). server/db.ts is mocked only for the approvals.ts dependency chain
// (consumeApproval()); EventMesh runs for real (in-process), same as the existing
// tests/unit/supervisor.test.ts suite.

import { describe, it, expect, vi, beforeEach } from 'vitest';

let lookupResult: { data: any; error: any } = { data: null, error: null };
let consumeResult: { data: any; error: any } = { data: null, error: null };

const mockFrom = vi.fn((table: string) => {
  if (table !== 'agent_action_approvals') throw new Error(`Unerwartete Tabelle im Test: ${table}`);
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve(lookupResult),
      }),
    }),
    update: () => ({
      eq: () => ({
        is: () => ({
          gt: () => ({
            select: () => ({
              maybeSingle: () => Promise.resolve(consumeResult),
            }),
          }),
        }),
      }),
    }),
  };
});

vi.mock('../../server/db', () => ({
  isPrivilegedSupabaseConfigured: vi.fn(() => true),
  getPrivilegedServerSupabase: vi.fn(() => ({ from: mockFrom })),
}));

import { executeApprovedSupervisedAction } from '../../src/platform/Supervisor/supervisor';
import { CAPABILITIES } from '../../src/platform/Security/capabilities';

function validApproval() {
  lookupResult = { data: { id: 'a1', action: 'do-thing', plan_hash: 'hash-1', consumed_at: null, expires_at: '2999-01-01' }, error: null };
  consumeResult = { data: { id: 'a1' }, error: null };
}

describe('executeApprovedSupervisedAction (ESS-0018 Phase 2)', () => {
  beforeEach(() => {
    mockFrom.mockClear();
    lookupResult = { data: null, error: null };
    consumeResult = { data: null, error: null };
  });

  it('denies at the policy gate for a capability outside the write allowlist, before ever touching the approval store', async () => {
    const fn = vi.fn();
    const outcome = await executeApprovedSupervisedAction({
      taskName: 'test',
      action: 'do-thing',
      capability: CAPABILITIES.ADMIN_DIAGNOSTICS_READ, // a read capability, not on the write allowlist
      planHash: 'hash-1',
      approvalId: 'a1',
      actorUserId: 'owner-1',
      targetResource: 'x:1',
      fn,
    });
    expect(outcome.status).toBe('DENIED_POLICY');
    expect(fn).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('denies Apply when the approval cannot be consumed (missing/expired/plan mismatch)', async () => {
    lookupResult = { data: null, error: null }; // NOT_FOUND
    const fn = vi.fn();
    const outcome = await executeApprovedSupervisedAction({
      taskName: 'test',
      action: 'do-thing',
      capability: CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_DISABLE,
      planHash: 'hash-1',
      approvalId: 'missing',
      actorUserId: 'owner-1',
      targetResource: 'x:1',
      fn,
    });
    expect(outcome.status).toBe('DENIED_APPROVAL');
    expect(fn).not.toHaveBeenCalled();
  });

  it('applies fn() only after a valid, matching approval was consumed', async () => {
    validApproval();
    const fn = vi.fn().mockResolvedValue({ id: 'x1', active: false });
    const outcome = await executeApprovedSupervisedAction({
      taskName: 'test',
      action: 'do-thing',
      capability: CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_DISABLE,
      planHash: 'hash-1',
      approvalId: 'a1',
      actorUserId: 'owner-1',
      targetResource: 'x:1',
      fn,
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(outcome.status).toBe('APPLIED');
    if (outcome.status === 'APPLIED') {
      expect(outcome.result).toEqual({ id: 'x1', active: false });
    }
  });

  it('propagates a thrown error from fn() (e.g. fingerprint mismatch) instead of reporting a false APPLIED', async () => {
    validApproval();
    const fn = vi.fn().mockRejectedValue(new Error('Fingerprint-Mismatch'));
    await expect(executeApprovedSupervisedAction({
      taskName: 'test',
      action: 'do-thing',
      capability: CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_DISABLE,
      planHash: 'hash-1',
      approvalId: 'a1',
      actorUserId: 'owner-1',
      targetResource: 'x:1',
      fn,
    })).rejects.toThrow(/Fingerprint-Mismatch/);
  });
});

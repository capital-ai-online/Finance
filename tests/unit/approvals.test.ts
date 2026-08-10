// ESS-0018 Phase 2 / ADR-0051: server/db.ts gemockt. Fokus: Single-Use (kein Replay),
// Plan-Hash-/Aktions-Bindung (keine Genehmigung fuer Plan A darf Plan B autorisieren),
// deterministischer Plan-Hash.

import { describe, it, expect, vi, beforeEach } from 'vitest';

let lookupResult: { data: any; error: any } = { data: null, error: null };
let consumeResult: { data: any; error: any } = { data: null, error: null };
let insertResult: { data: any; error: any } = { data: { id: 'approval-1' }, error: null };

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
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve(insertResult),
      }),
    }),
  };
});

vi.mock('../../server/db', () => ({
  isPrivilegedSupabaseConfigured: vi.fn(() => true),
  getPrivilegedServerSupabase: vi.fn(() => ({ from: mockFrom })),
}));

import { computePlanHash, issueApproval, consumeApproval } from '../../src/platform/Security/approvals';

describe('approvals (ESS-0018 Phase 2)', () => {
  beforeEach(() => {
    mockFrom.mockClear();
    lookupResult = { data: null, error: null };
    consumeResult = { data: null, error: null };
    insertResult = { data: { id: 'approval-1' }, error: null };
  });

  it('computePlanHash is deterministic and key-order independent', () => {
    const a = computePlanHash({ action: 'x', id: '1', foo: 'bar' });
    const b = computePlanHash({ foo: 'bar', id: '1', action: 'x' });
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('computePlanHash differs when the plan differs', () => {
    const a = computePlanHash({ action: 'x', id: '1' });
    const b = computePlanHash({ action: 'x', id: '2' });
    expect(a).not.toBe(b);
  });

  it('returns NOT_FOUND when no approval exists for the given id', async () => {
    lookupResult = { data: null, error: null };
    const result = await consumeApproval('missing', 'action-x', 'hash-1');
    expect(result).toBe('NOT_FOUND');
  });

  it('returns PLAN_MISMATCH when the approval was issued for a different action/plan', async () => {
    lookupResult = { data: { id: 'a1', action: 'action-x', plan_hash: 'hash-DIFFERENT', consumed_at: null, expires_at: '2999-01-01' }, error: null };
    const result = await consumeApproval('a1', 'action-x', 'hash-1');
    expect(result).toBe('PLAN_MISMATCH');
  });

  it('consumes a valid, matching, unexpired approval exactly once', async () => {
    lookupResult = { data: { id: 'a1', action: 'action-x', plan_hash: 'hash-1', consumed_at: null, expires_at: '2999-01-01' }, error: null };
    consumeResult = { data: { id: 'a1' }, error: null };
    const result = await consumeApproval('a1', 'action-x', 'hash-1');
    expect(result).toBe('CONSUMED');
  });

  it('rejects a second consumption attempt (no replay) even if the lookup still matches', async () => {
    lookupResult = { data: { id: 'a1', action: 'action-x', plan_hash: 'hash-1', consumed_at: null, expires_at: '2999-01-01' }, error: null };
    // Atomic UPDATE...WHERE consumed_at IS NULL returns no row on the second call, proving the
    // race-safe single-use guarantee even though the earlier SELECT lookup still shows it as valid.
    consumeResult = { data: null, error: null };
    const result = await consumeApproval('a1', 'action-x', 'hash-1');
    expect(result).toBe('EXPIRED_OR_ALREADY_CONSUMED');
  });

  it('issueApproval sets a short TTL and returns the approval id', async () => {
    const before = Date.now();
    const result = await issueApproval({ actorUserId: 'owner-1', action: 'action-x', planHash: 'hash-1', targetResource: 'alert_subscriptions:1' });
    expect(result).not.toBeNull();
    expect(result!.id).toBe('approval-1');
    const expiresMs = Date.parse(result!.expiresAt);
    expect(expiresMs - before).toBeLessThanOrEqual(10 * 60_000 + 1000);
    expect(expiresMs - before).toBeGreaterThan(9 * 60_000);
  });
});

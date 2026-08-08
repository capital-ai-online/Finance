// ADR-0045 / R-003: Regression tests for the atomic Checkout Session mail reservation.
// No real Supabase/SMTP access is used.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  confirmations: new Set<string>(),
  supabaseConfigured: true,
  rpcError: null as null | { message: string },
}));

vi.mock('../../server/env', () => ({
  getCleanEnv: vi.fn((key: string) => key === 'NODE_ENV' ? 'test' : ''),
}));

vi.mock('../../server/db', () => ({
  isSupabaseConfigured: vi.fn(() => state.supabaseConfigured),
  getServerSupabase: vi.fn(() => ({
    rpc: vi.fn(async (name: string, args: { p_session_id: string }) => {
      if (name !== 'claim_subscription_confirmation') {
        return { data: null, error: { message: `unexpected rpc: ${name}` } };
      }
      if (state.rpcError) return { data: null, error: state.rpcError };
      if (state.confirmations.has(args.p_session_id)) {
        return { data: false, error: null };
      }
      state.confirmations.add(args.p_session_id);
      return { data: true, error: null };
    }),
  })),
}));

import { sendSubscriptionConfirmation } from '../../server/mailer';

describe('mailer atomic confirmation reservation (ADR-0045)', () => {
  beforeEach(() => {
    state.confirmations.clear();
    state.supabaseConfigured = true;
    state.rpcError = null;
  });

  it('claims the Checkout Session before the first send attempt', async () => {
    const result = await sendSubscriptionConfirmation('kunde@example.com', 'owner@example.com', {
      planId: 'pro',
      sessionId: 'cs_test_1',
    });

    expect(result.skippedAsDuplicate).toBe(false);
    expect(state.confirmations.has('cs_test_1')).toBe(true);
  });

  it('skips a later call with the same Checkout Session', async () => {
    await sendSubscriptionConfirmation('kunde@example.com', 'owner@example.com', {
      planId: 'pro',
      sessionId: 'cs_test_2',
    });
    const second = await sendSubscriptionConfirmation('kunde@example.com', 'owner@example.com', {
      planId: 'pro',
      sessionId: 'cs_test_2',
    });

    expect(second.skippedAsDuplicate).toBe(true);
  });

  it('allows exactly one winner for concurrent calls with the same session ID', async () => {
    const [a, b] = await Promise.all([
      sendSubscriptionConfirmation('kunde@example.com', 'owner@example.com', {
        planId: 'pro',
        sessionId: 'cs_concurrent',
      }),
      sendSubscriptionConfirmation('kunde@example.com', 'owner@example.com', {
        planId: 'pro',
        sessionId: 'cs_concurrent',
      }),
    ]);

    expect([a.skippedAsDuplicate, b.skippedAsDuplicate].sort()).toEqual([false, true]);
    expect(state.confirmations.size).toBe(1);
  });

  it('treats different Checkout Sessions independently', async () => {
    const [a, b] = await Promise.all([
      sendSubscriptionConfirmation('a@example.com', 'owner@example.com', { planId: 'starter', sessionId: 'cs_a' }),
      sendSubscriptionConfirmation('b@example.com', 'owner@example.com', { planId: 'starter', sessionId: 'cs_b' }),
    ]);

    expect(a.skippedAsDuplicate).toBe(false);
    expect(b.skippedAsDuplicate).toBe(false);
    expect(state.confirmations.size).toBe(2);
  });

  it('blocks sending when the durable reservation RPC is unavailable', async () => {
    state.rpcError = { message: 'database unavailable' };

    const result = await sendSubscriptionConfirmation('a@example.com', 'owner@example.com', {
      planId: 'starter',
      sessionId: 'cs_db_failure',
    });

    expect(result.skippedAsDuplicate).toBe(false);
    expect(result.customer.attempted).toBe(false);
    expect(result.customer.error).toBe('confirmation-reservation-failed');
    expect(result.owner.attempted).toBe(false);
  });

  it('fails safely without a session ID', async () => {
    const result = await sendSubscriptionConfirmation('a@example.com', 'owner@example.com', {
      planId: 'starter',
      sessionId: '',
    });

    expect(result.skippedAsDuplicate).toBe(false);
    expect(result.customer.error).toBe('missing-session-id');
    expect(state.confirmations.size).toBe(0);
  });
});

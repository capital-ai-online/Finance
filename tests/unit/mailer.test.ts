// ADR-0045 / R-003: Regression tests for the atomic Checkout Session mail reservation.
// No real Supabase/SMTP access is used.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  confirmations: new Set<string>(),
  supabaseConfigured: true,
  rpcError: null as null | { message: string },
  enqueueOutboxJob: vi.fn(async () => ({ enqueued: true, jobId: 'job-1' })),
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

// ADR-0054 / R-101: mailer.ts schedules an outbox retry when a confirmation-mail send fails.
// Mocked independently so these pre-existing reservation tests stay focused on ADR-0045 and
// don't depend on outbox internals (covered separately by tests/unit/outbox.test.ts).
vi.mock('../../server/outbox', () => ({
  enqueueOutboxJob: state.enqueueOutboxJob,
}));

import { sendSubscriptionConfirmation } from '../../server/mailer';

describe('mailer atomic confirmation reservation (ADR-0045)', () => {
  beforeEach(() => {
    state.confirmations.clear();
    state.supabaseConfigured = true;
    state.rpcError = null;
    state.enqueueOutboxJob.mockClear();
    state.enqueueOutboxJob.mockResolvedValue({ enqueued: true, jobId: 'job-1' });
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

describe('outbox retry scheduling on SMTP failure (ADR-0054 / R-101)', () => {
  beforeEach(() => {
    state.confirmations.clear();
    state.supabaseConfigured = true;
    state.rpcError = null;
    state.enqueueOutboxJob.mockClear();
    state.enqueueOutboxJob.mockResolvedValue({ enqueued: true, jobId: 'job-1' });
  });

  // SMTP_HOST/SMTP_USER/SMTP_PASSWORD are unset in this test environment, so every sendMail()
  // call already fails with 'smtp-not-configured' -- the same shape a real credential failure
  // (OPS-001) takes from the caller's point of view.

  it('schedules an outbox retry job for both legs when both sends fail', async () => {
    await sendSubscriptionConfirmation('kunde@example.com', 'owner@example.com', {
      planId: 'pro',
      sessionId: 'cs_retry_1',
    });

    expect(state.enqueueOutboxJob).toHaveBeenCalledWith(
      expect.objectContaining({
        jobType: 'subscription_confirmation_mail',
        idempotencyKey: 'subscription_confirmation_mail:cs_retry_1:customer',
        payload: expect.objectContaining({ kind: 'customer', to: 'kunde@example.com', sessionId: 'cs_retry_1' }),
      }),
    );
    expect(state.enqueueOutboxJob).toHaveBeenCalledWith(
      expect.objectContaining({
        jobType: 'subscription_confirmation_mail',
        idempotencyKey: 'subscription_confirmation_mail:cs_retry_1:owner',
        payload: expect.objectContaining({ kind: 'owner', to: 'owner@example.com', sessionId: 'cs_retry_1' }),
      }),
    );
    expect(state.enqueueOutboxJob).toHaveBeenCalledTimes(2);
  });

  it('does not schedule a customer retry when no customer email is known', async () => {
    await sendSubscriptionConfirmation('', 'owner@example.com', {
      planId: 'pro',
      sessionId: 'cs_retry_2',
    });

    expect(state.enqueueOutboxJob).not.toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: expect.stringContaining(':customer') }),
    );
    expect(state.enqueueOutboxJob).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: 'subscription_confirmation_mail:cs_retry_2:owner' }),
    );
  });

  it('does not schedule a retry when the send was skipped as a duplicate', async () => {
    await sendSubscriptionConfirmation('kunde@example.com', 'owner@example.com', {
      planId: 'pro',
      sessionId: 'cs_retry_3',
    });
    state.enqueueOutboxJob.mockClear();

    await sendSubscriptionConfirmation('kunde@example.com', 'owner@example.com', {
      planId: 'pro',
      sessionId: 'cs_retry_3',
    });

    expect(state.enqueueOutboxJob).not.toHaveBeenCalled();
  });

  it('never throws when scheduling the retry itself fails', async () => {
    state.enqueueOutboxJob.mockRejectedValue(new Error('db down'));

    await expect(
      sendSubscriptionConfirmation('kunde@example.com', 'owner@example.com', {
        planId: 'pro',
        sessionId: 'cs_retry_4',
      }),
    ).resolves.toBeDefined();
  });
});

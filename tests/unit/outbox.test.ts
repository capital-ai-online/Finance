// ADR-0054 / R-101: the generic outbox must expose enqueue/claim/complete/fail exactly as the
// underlying SQL functions define them, must never silently fall back to weaker durability in
// production, and must degrade to a safe no-op (not a crash) in local development without
// Supabase configured.

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(),
  assertPrivilegedSupabaseConfigured: vi.fn(),
  getCleanEnv: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('../../server/env', () => ({
  getCleanEnv: mocks.getCleanEnv,
}));

vi.mock('../../server/db', () => ({
  isSupabaseConfigured: mocks.isSupabaseConfigured,
  assertPrivilegedSupabaseConfigured: mocks.assertPrivilegedSupabaseConfigured,
  getPrivilegedServerSupabase: vi.fn(() => ({
    rpc: mocks.rpc,
  })),
}));

import {
  enqueueOutboxJob,
  claimOutboxJob,
  completeOutboxJob,
  failOutboxJob,
  heartbeatOutboxJob,
  quarantineOutboxJob,
} from '../../server/outbox';

describe('server/outbox (ADR-0054 / R-101)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.getCleanEnv.mockImplementation((key: string) => (key === 'NODE_ENV' ? 'production' : ''));
    mocks.assertPrivilegedSupabaseConfigured.mockImplementation((context = 'privileged Supabase operation') => {
      throw new Error(`[Supabase][SECURITY] ${context} blocked: SUPABASE_URL is missing.`);
    });
  });

  describe('production without Supabase fails closed', () => {
    beforeEach(() => {
      mocks.isSupabaseConfigured.mockReturnValue(false);
    });

    it('enqueueOutboxJob throws instead of silently skipping', async () => {
      await expect(
        enqueueOutboxJob({ jobType: 'test_job', payload: { a: 1 } }),
      ).rejects.toThrow(/SUPABASE_URL is missing/);
    });

    it('claimOutboxJob throws instead of silently returning null', async () => {
      await expect(claimOutboxJob('worker-1')).rejects.toThrow(/SUPABASE_URL is missing/);
    });

    it('completeOutboxJob throws instead of silently returning false', async () => {
      await expect(completeOutboxJob('job-1', 'worker-1')).rejects.toThrow(/SUPABASE_URL is missing/);
    });

    it('heartbeatOutboxJob throws instead of silently extending a lease', async () => {
      await expect(heartbeatOutboxJob('job-1', 'worker-1')).rejects.toThrow(/SUPABASE_URL is missing/);
    });

    it('quarantineOutboxJob throws instead of silently discarding recovery evidence', async () => {
      await expect(quarantineOutboxJob('job-1', 'worker-1', 'unsafe replay')).rejects.toThrow(/SUPABASE_URL is missing/);
    });

    it('failOutboxJob throws instead of silently returning not_claimed', async () => {
      await expect(failOutboxJob('job-1', 'worker-1', new Error('boom'))).rejects.toThrow(/SUPABASE_URL is missing/);
    });
  });

  describe('development without Supabase degrades to a safe no-op', () => {
    beforeEach(() => {
      mocks.getCleanEnv.mockImplementation((key: string) => (key === 'NODE_ENV' ? 'test' : ''));
      mocks.isSupabaseConfigured.mockReturnValue(false);
    });

    it('enqueueOutboxJob returns enqueued:false without throwing', async () => {
      const result = await enqueueOutboxJob({ jobType: 'test_job', payload: { a: 1 } });
      expect(result).toEqual({ enqueued: false, jobId: null });
    });

    it('claimOutboxJob returns null without throwing', async () => {
      await expect(claimOutboxJob('worker-1')).resolves.toBeNull();
    });
  });

  describe('enqueueOutboxJob', () => {
    it('inserts a new job and returns its id', async () => {
      mocks.rpc.mockResolvedValue({ data: [{ enqueued: true, job_id: 'job-1' }], error: null });
      const result = await enqueueOutboxJob({
        jobType: 'subscription_confirmation_mail',
        payload: { to: 'a@example.com' },
        idempotencyKey: 'key-1',
      });
      expect(result).toEqual({ enqueued: true, jobId: 'job-1' });
      expect(mocks.rpc).toHaveBeenCalledWith('enqueue_outbox_job', expect.objectContaining({
        p_job_type: 'subscription_confirmation_mail',
        p_idempotency_key: 'key-1',
      }));
    });

    it('reports enqueued:false with the existing job id for a duplicate idempotency key', async () => {
      mocks.rpc.mockResolvedValue({ data: [{ enqueued: false, job_id: 'job-existing' }], error: null });
      const result = await enqueueOutboxJob({
        jobType: 'subscription_confirmation_mail',
        payload: { to: 'a@example.com' },
        idempotencyKey: 'key-1',
      });
      expect(result).toEqual({ enqueued: false, jobId: 'job-existing' });
    });

    it('throws when the RPC reports an error', async () => {
      mocks.rpc.mockResolvedValue({ data: null, error: { message: 'db down' } });
      await expect(
        enqueueOutboxJob({ jobType: 'x', payload: {} }),
      ).rejects.toThrow(/db down/);
    });
  });

  describe('claimOutboxJob', () => {
    it('returns the claimed job when the RPC returns a row', async () => {
      mocks.rpc.mockResolvedValue({
        data: [{ job_id: 'job-1', job_type: 'x', payload: { a: 1 }, attempts: 1, max_attempts: 5 }],
        error: null,
      });
      const job = await claimOutboxJob('worker-1', 30, ['safe_job', 'safe_job']);
      expect(job).toEqual({ jobId: 'job-1', jobType: 'x', payload: { a: 1 }, attempts: 1, maxAttempts: 5 });
      expect(mocks.rpc).toHaveBeenCalledWith('claim_outbox_job_v2', {
        p_lease_owner: 'worker-1',
        p_lease_seconds: 30,
        p_replay_safe_job_types: ['safe_job'],
      });
    });

    it('returns null when nothing is claimable', async () => {
      mocks.rpc.mockResolvedValue({ data: [], error: null });
      await expect(claimOutboxJob('worker-1')).resolves.toBeNull();
    });
  });

  describe('heartbeatOutboxJob / quarantineOutboxJob', () => {
    it('extends only the currently owned lease through the recovery RPC', async () => {
      mocks.rpc.mockResolvedValue({ data: true, error: null });
      await expect(heartbeatOutboxJob('job-1', 'worker-1', 45)).resolves.toBe(true);
      expect(mocks.rpc).toHaveBeenCalledWith('heartbeat_outbox_job', {
        p_job_id: 'job-1',
        p_lease_owner: 'worker-1',
        p_lease_seconds: 45,
      });
    });

    it('moves an unsafe work item into canonical dead-letter quarantine with evidence', async () => {
      mocks.rpc.mockResolvedValue({ data: true, error: null });
      await expect(
        quarantineOutboxJob('job-1', 'worker-1', new Error('ambiguous side effect')),
      ).resolves.toBe(true);
      expect(mocks.rpc).toHaveBeenCalledWith('quarantine_outbox_job', {
        p_job_id: 'job-1',
        p_lease_owner: 'worker-1',
        p_reason: 'ambiguous side effect',
      });
    });
  });

  describe('completeOutboxJob', () => {
    it('returns true when the RPC confirms completion', async () => {
      mocks.rpc.mockResolvedValue({ data: true, error: null });
      await expect(completeOutboxJob('job-1', 'worker-1')).resolves.toBe(true);
      expect(mocks.rpc).toHaveBeenCalledWith('complete_outbox_job', { p_job_id: 'job-1', p_lease_owner: 'worker-1' });
    });

    it('returns false when the caller no longer holds the lease', async () => {
      mocks.rpc.mockResolvedValue({ data: false, error: null });
      await expect(completeOutboxJob('job-1', 'worker-1')).resolves.toBe(false);
    });
  });

  describe('failOutboxJob', () => {
    it('returns pending when attempts remain', async () => {
      mocks.rpc.mockResolvedValue({ data: 'pending', error: null });
      const outcome = await failOutboxJob('job-1', 'worker-1', new Error('smtp down'), 15);
      expect(outcome).toBe('pending');
      expect(mocks.rpc).toHaveBeenCalledWith('fail_outbox_job', {
        p_job_id: 'job-1',
        p_lease_owner: 'worker-1',
        p_error: 'smtp down',
        p_backoff_seconds: 15,
      });
    });

    it('returns dead_letter when attempts are exhausted', async () => {
      mocks.rpc.mockResolvedValue({ data: 'dead_letter', error: null });
      const outcome = await failOutboxJob('job-1', 'worker-1', 'raw error string');
      expect(outcome).toBe('dead_letter');
    });
  });
});

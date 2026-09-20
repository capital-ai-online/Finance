// ADR-0054 / SH-02.5: durable worker recovery must be replay-safe, bounded and fail-closed.

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  claimOutboxJob: vi.fn(),
  completeOutboxJob: vi.fn(),
  failOutboxJob: vi.fn(),
  heartbeatOutboxJob: vi.fn(),
  quarantineOutboxJob: vi.fn(),
}));

vi.mock('../../server/outbox', () => ({
  claimOutboxJob: mocks.claimOutboxJob,
  completeOutboxJob: mocks.completeOutboxJob,
  failOutboxJob: mocks.failOutboxJob,
  heartbeatOutboxJob: mocks.heartbeatOutboxJob,
  quarantineOutboxJob: mocks.quarantineOutboxJob,
}));

import {
  drainOutboxJobs,
  getOutboxReplaySafeJobTypes,
  OUTBOX_LEASE_SECONDS,
  OUTBOX_MAX_JOBS_PER_DRAIN,
  processOneOutboxJob,
  registerOutboxJobHandler,
} from '../../server/outboxWorker';

describe('server/outboxWorker (ADR-0054 / SH-02.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.failOutboxJob.mockResolvedValue('pending');
    mocks.completeOutboxJob.mockResolvedValue(true);
    mocks.heartbeatOutboxJob.mockResolvedValue(true);
    mocks.quarantineOutboxJob.mockResolvedValue(true);
  });

  it('returns false without side effects when nothing is claimable', async () => {
    mocks.claimOutboxJob.mockResolvedValue(null);
    const processed = await processOneOutboxJob('worker-1');
    expect(processed).toBe(false);
    expect(mocks.completeOutboxJob).not.toHaveBeenCalled();
    expect(mocks.failOutboxJob).not.toHaveBeenCalled();
    expect(mocks.quarantineOutboxJob).not.toHaveBeenCalled();
  });

  it('passes only explicitly idempotent handler types into stale-lease reclaim', async () => {
    registerOutboxJobHandler('safe_replay_job', vi.fn(), { replaySafety: 'IDEMPOTENT' });
    registerOutboxJobHandler('unsafe_replay_job', vi.fn(), { replaySafety: 'REQUIRES_RECONCILIATION' });
    mocks.claimOutboxJob.mockResolvedValue(null);

    await processOneOutboxJob('worker-1');

    expect(getOutboxReplaySafeJobTypes()).toContain('safe_replay_job');
    expect(getOutboxReplaySafeJobTypes()).not.toContain('unsafe_replay_job');
    expect(mocks.claimOutboxJob).toHaveBeenCalledWith(
      'worker-1',
      OUTBOX_LEASE_SECONDS,
      expect.arrayContaining(['safe_replay_job']),
    );
  });

  it('completes the job when its handler succeeds and the lease is still owned', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    registerOutboxJobHandler('ok_job', handler, { replaySafety: 'IDEMPOTENT' });
    mocks.claimOutboxJob.mockResolvedValue({
      jobId: 'job-1', jobType: 'ok_job', payload: { a: 1 }, attempts: 1, maxAttempts: 5,
    });

    const processed = await processOneOutboxJob('worker-1');

    expect(processed).toBe(true);
    expect(handler).toHaveBeenCalledWith({ a: 1 });
    expect(mocks.completeOutboxJob).toHaveBeenCalledWith('job-1', 'worker-1');
    expect(mocks.failOutboxJob).not.toHaveBeenCalled();
    expect(mocks.quarantineOutboxJob).not.toHaveBeenCalled();
  });

  it('does not record success when completion loses the lease', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    registerOutboxJobHandler('lost_lease_job', handler, { replaySafety: 'IDEMPOTENT' });
    mocks.claimOutboxJob.mockResolvedValue({
      jobId: 'job-lost', jobType: 'lost_lease_job', payload: {}, attempts: 1, maxAttempts: 5,
    });
    mocks.completeOutboxJob.mockResolvedValue(false);

    await expect(processOneOutboxJob('worker-1')).resolves.toBe(true);
    expect(mocks.failOutboxJob).not.toHaveBeenCalled();
    expect(mocks.quarantineOutboxJob).not.toHaveBeenCalled();
  });

  it('uses the bounded retry authority only for an explicitly idempotent handler', async () => {
    registerOutboxJobHandler(
      'failing_idempotent_job',
      vi.fn().mockRejectedValue(new Error('boom')),
      { replaySafety: 'IDEMPOTENT' },
    );
    mocks.claimOutboxJob.mockResolvedValue({
      jobId: 'job-2', jobType: 'failing_idempotent_job', payload: {}, attempts: 2, maxAttempts: 5,
    });

    await expect(processOneOutboxJob('worker-1')).resolves.toBe(true);
    expect(mocks.failOutboxJob).toHaveBeenCalledWith('job-2', 'worker-1', expect.any(Error));
    expect(mocks.quarantineOutboxJob).not.toHaveBeenCalled();
    expect(mocks.completeOutboxJob).not.toHaveBeenCalled();
  });

  it('quarantines a non-replay-safe handler failure instead of blindly retrying it', async () => {
    registerOutboxJobHandler(
      'side_effect_job',
      vi.fn().mockRejectedValue(new Error('smtp outcome unknown')),
      { replaySafety: 'REQUIRES_RECONCILIATION' },
    );
    mocks.claimOutboxJob.mockResolvedValue({
      jobId: 'job-3', jobType: 'side_effect_job', payload: {}, attempts: 1, maxAttempts: 5,
    });

    await expect(processOneOutboxJob('worker-1')).resolves.toBe(true);
    expect(mocks.quarantineOutboxJob).toHaveBeenCalledWith(
      'job-3',
      'worker-1',
      expect.stringContaining('smtp outcome unknown'),
    );
    expect(mocks.failOutboxJob).not.toHaveBeenCalled();
    expect(mocks.completeOutboxJob).not.toHaveBeenCalled();
  });

  it('quarantines a job_type with no registered handler', async () => {
    mocks.claimOutboxJob.mockResolvedValue({
      jobId: 'job-4', jobType: 'unregistered_job_type_xyz', payload: {}, attempts: 1, maxAttempts: 5,
    });

    await expect(processOneOutboxJob('worker-1')).resolves.toBe(true);
    expect(mocks.quarantineOutboxJob).toHaveBeenCalledWith(
      'job-4',
      'worker-1',
      expect.stringContaining('unregistered_job_type_xyz'),
    );
    expect(mocks.failOutboxJob).not.toHaveBeenCalled();
    expect(mocks.completeOutboxJob).not.toHaveBeenCalled();
  });

  it('drains a bounded number of jobs through the existing ADR-0054 authority', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    registerOutboxJobHandler('drain_job', handler, { replaySafety: 'IDEMPOTENT' });
    mocks.claimOutboxJob
      .mockResolvedValueOnce({
        jobId: 'job-5', jobType: 'drain_job', payload: { seq: 1 }, attempts: 1, maxAttempts: 5,
      })
      .mockResolvedValueOnce({
        jobId: 'job-6', jobType: 'drain_job', payload: { seq: 2 }, attempts: 1, maxAttempts: 5,
      })
      .mockResolvedValueOnce(null);

    await expect(drainOutboxJobs('external-host-1', 10)).resolves.toBe(2);
    expect(handler).toHaveBeenNthCalledWith(1, { seq: 1 });
    expect(handler).toHaveBeenNthCalledWith(2, { seq: 2 });
    expect(mocks.completeOutboxJob).toHaveBeenNthCalledWith(1, 'job-5', 'external-host-1');
    expect(mocks.completeOutboxJob).toHaveBeenNthCalledWith(2, 'job-6', 'external-host-1');
    expect(OUTBOX_MAX_JOBS_PER_DRAIN).toBe(25);
  });
});

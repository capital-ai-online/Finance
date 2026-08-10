// ADR-0054 / R-101: the outbox worker must dispatch a claimed job to its registered handler,
// complete on success, and record a failure (never throw out of the poll loop) on handler error
// or on a missing handler registration.

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  claimOutboxJob: vi.fn(),
  completeOutboxJob: vi.fn(),
  failOutboxJob: vi.fn(),
}));

vi.mock('../../server/outbox', () => ({
  claimOutboxJob: mocks.claimOutboxJob,
  completeOutboxJob: mocks.completeOutboxJob,
  failOutboxJob: mocks.failOutboxJob,
}));

import { processOneOutboxJob, registerOutboxJobHandler } from '../../server/outboxWorker';

describe('server/outboxWorker (ADR-0054 / R-101)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.failOutboxJob.mockResolvedValue('pending');
    mocks.completeOutboxJob.mockResolvedValue(true);
  });

  it('returns false without side effects when nothing is claimable', async () => {
    mocks.claimOutboxJob.mockResolvedValue(null);
    const processed = await processOneOutboxJob('worker-1');
    expect(processed).toBe(false);
    expect(mocks.completeOutboxJob).not.toHaveBeenCalled();
    expect(mocks.failOutboxJob).not.toHaveBeenCalled();
  });

  it('completes the job when its handler succeeds', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    registerOutboxJobHandler('ok_job', handler);
    mocks.claimOutboxJob.mockResolvedValue({
      jobId: 'job-1', jobType: 'ok_job', payload: { a: 1 }, attempts: 1, maxAttempts: 5,
    });

    const processed = await processOneOutboxJob('worker-1');

    expect(processed).toBe(true);
    expect(handler).toHaveBeenCalledWith({ a: 1 });
    expect(mocks.completeOutboxJob).toHaveBeenCalledWith('job-1', 'worker-1');
    expect(mocks.failOutboxJob).not.toHaveBeenCalled();
  });

  it('records a failure without throwing when the handler rejects', async () => {
    registerOutboxJobHandler('failing_job', vi.fn().mockRejectedValue(new Error('boom')));
    mocks.claimOutboxJob.mockResolvedValue({
      jobId: 'job-2', jobType: 'failing_job', payload: {}, attempts: 2, maxAttempts: 5,
    });

    await expect(processOneOutboxJob('worker-1')).resolves.toBe(true);
    expect(mocks.failOutboxJob).toHaveBeenCalledWith('job-2', 'worker-1', expect.any(Error));
    expect(mocks.completeOutboxJob).not.toHaveBeenCalled();
  });

  it('records a failure for a job_type with no registered handler', async () => {
    mocks.claimOutboxJob.mockResolvedValue({
      jobId: 'job-3', jobType: 'unregistered_job_type_xyz', payload: {}, attempts: 1, maxAttempts: 5,
    });

    await expect(processOneOutboxJob('worker-1')).resolves.toBe(true);
    expect(mocks.failOutboxJob).toHaveBeenCalledWith(
      'job-3',
      'worker-1',
      expect.stringContaining('unregistered_job_type_xyz'),
    );
    expect(mocks.completeOutboxJob).not.toHaveBeenCalled();
  });
});

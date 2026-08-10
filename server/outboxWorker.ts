// ADR-0054 / R-101 -- Outbox worker poll loop.
//
// Polls public.outbox_jobs (via server/outbox.ts's claimOutboxJob) and dispatches each claimed
// job to the handler registered for its job_type, then completes or records-and-backs-off the
// job based on the handler's outcome. Handlers MUST be idempotent: a stale lease is
// automatically reclaimed and re-dispatched by claim_outbox_job, so the same payload can execute
// more than once under contention/crash recovery.

import { randomUUID } from 'crypto';
import { claimOutboxJob, completeOutboxJob, failOutboxJob } from './outbox';

export type OutboxJobHandler = (payload: Record<string, unknown>) => Promise<void>;

const handlers = new Map<string, OutboxJobHandler>();

/** Registers (or replaces) the handler for a job_type. Call once per job_type at composition time. */
export function registerOutboxJobHandler(jobType: string, handler: OutboxJobHandler): void {
  handlers.set(jobType, handler);
}

/**
 * Claims and processes at most one job. Returns false when nothing was claimable (the caller's
 * poll loop should stop draining for this tick), true otherwise -- including when the claimed
 * job's handler failed, since that failure was already recorded via failOutboxJob and must never
 * propagate out of the poll loop.
 */
export async function processOneOutboxJob(leaseOwner: string): Promise<boolean> {
  const job = await claimOutboxJob(leaseOwner);
  if (!job) {
    return false;
  }

  const handler = handlers.get(job.jobType);
  if (!handler) {
    console.error(`[Outbox Worker] No handler registered for job_type=${job.jobType} (job ${job.jobId}); recording failure.`);
    await failOutboxJob(job.jobId, leaseOwner, `no handler registered for job_type=${job.jobType}`);
    return true;
  }

  try {
    await handler(job.payload);
    await completeOutboxJob(job.jobId, leaseOwner);
    console.log(`[Outbox Worker] Completed job ${job.jobId} (job_type=${job.jobType}, attempt ${job.attempts}/${job.maxAttempts}).`);
  } catch (err: any) {
    const outcome = await failOutboxJob(job.jobId, leaseOwner, err);
    console.warn(`[Outbox Worker] Job ${job.jobId} (job_type=${job.jobType}) failed on attempt ${job.attempts}/${job.maxAttempts}: ${err?.message || err} -> ${outcome}`);
  }

  return true;
}

let pollTimer: NodeJS.Timeout | null = null;
let workerId: string | null = null;

export interface OutboxWorkerOptions {
  intervalMs?: number;
  leaseOwner?: string;
}

const DEFAULT_INTERVAL_MS = 15_000;
// Hard cap per tick so a pathological backlog cannot starve the event loop indefinitely; the
// remainder is picked up on the next tick.
const MAX_JOBS_PER_TICK = 25;

/** Starts the poll loop. Idempotent -- a second call while already running is a no-op. */
export function startOutboxWorker(options: OutboxWorkerOptions = {}): void {
  if (pollTimer) {
    return;
  }
  workerId = options.leaseOwner || `outbox-worker-${randomUUID()}`;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;

  const tick = async () => {
    try {
      let processed = 0;
      while (processed < MAX_JOBS_PER_TICK && (await processOneOutboxJob(workerId as string))) {
        processed += 1;
      }
    } catch (err: any) {
      console.error('[Outbox Worker] Poll tick failed:', err?.message || err);
    }
  };

  pollTimer = setInterval(tick, intervalMs);
  void tick();
}

/** Stops the poll loop. Safe to call even when the worker was never started. */
export function stopOutboxWorker(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  workerId = null;
}

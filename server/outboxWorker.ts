// ADR-0054 / SH-02.5 -- canonical durable outbox worker.
//
// The worker reuses public.outbox_jobs as the only durable queue/retry/dead-letter authority.
// Expired leases are replayed only for handlers explicitly registered as IDEMPOTENT. Handlers
// whose external side effect can have an ambiguous outcome are quarantined for reconciliation
// instead of being silently replayed after a crash or uncertain failure.

import { randomUUID } from 'crypto';
import {
  claimOutboxJob,
  completeOutboxJob,
  failOutboxJob,
  heartbeatOutboxJob,
  quarantineOutboxJob,
  type OutboxReplaySafety,
} from './outbox';

export type OutboxJobHandler = (payload: Record<string, unknown>) => Promise<void>;

export interface OutboxJobHandlerOptions {
  replaySafety: OutboxReplaySafety;
}

interface OutboxJobHandlerRegistration {
  handler: OutboxJobHandler;
  replaySafety: OutboxReplaySafety;
}

const handlers = new Map<string, OutboxJobHandlerRegistration>();

/**
 * Registers (or replaces) the handler for a job_type.
 *
 * Replay safety is mandatory. IDEMPOTENT means an expired processing lease may be reclaimed and
 * executed again. REQUIRES_RECONCILIATION means any ambiguous/stalled attempt must fail closed
 * into the existing outbox dead-letter state.
 */
export function registerOutboxJobHandler(
  jobType: string,
  handler: OutboxJobHandler,
  options: OutboxJobHandlerOptions,
): void {
  if (!jobType.trim()) {
    throw new Error('[Outbox Worker] jobType must be non-empty.');
  }
  handlers.set(jobType, { handler, replaySafety: options.replaySafety });
}

export function getOutboxReplaySafeJobTypes(): string[] {
  return [...handlers.entries()]
    .filter(([, registration]) => registration.replaySafety === 'IDEMPOTENT')
    .map(([jobType]) => jobType)
    .sort();
}

const DEFAULT_INTERVAL_MS = 15_000;
export const OUTBOX_LEASE_SECONDS = 60;
export const OUTBOX_HEARTBEAT_INTERVAL_MS = 20_000;
export const OUTBOX_MAX_JOBS_PER_DRAIN = 25;

function startLeaseHeartbeat(jobId: string, leaseOwner: string): NodeJS.Timeout {
  let heartbeatInFlight = false;

  const timer = setInterval(() => {
    if (heartbeatInFlight) return;
    heartbeatInFlight = true;
    void heartbeatOutboxJob(jobId, leaseOwner, OUTBOX_LEASE_SECONDS)
      .then(held => {
        if (!held) {
          console.error(
            `[Outbox Worker] Lease heartbeat lost ownership for job ${jobId}; completion will fail closed.`,
          );
        }
      })
      .catch(err => {
        console.error(
          `[Outbox Worker] Lease heartbeat failed for job ${jobId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      })
      .finally(() => {
        heartbeatInFlight = false;
      });
  }, OUTBOX_HEARTBEAT_INTERVAL_MS);

  timer.unref();
  return timer;
}

/**
 * Claims and processes at most one job.
 *
 * Retry behavior is contract-bound:
 * - IDEMPOTENT handlers use the existing bounded failOutboxJob retry budget.
 * - REQUIRES_RECONCILIATION handlers are quarantined on uncertain failure.
 * - missing handlers are quarantined rather than consuming repeated retries.
 */
export async function processOneOutboxJob(leaseOwner: string): Promise<boolean> {
  const job = await claimOutboxJob(
    leaseOwner,
    OUTBOX_LEASE_SECONDS,
    getOutboxReplaySafeJobTypes(),
  );
  if (!job) {
    return false;
  }

  const registration = handlers.get(job.jobType);
  if (!registration) {
    const reason = `no handler registered for job_type=${job.jobType}`;
    console.error(
      `[Outbox Worker] ${reason} (job ${job.jobId}); quarantining for reconciliation.`,
    );
    await quarantineOutboxJob(job.jobId, leaseOwner, reason);
    return true;
  }

  const heartbeatTimer = startLeaseHeartbeat(job.jobId, leaseOwner);

  try {
    await registration.handler(job.payload);

    const completed = await completeOutboxJob(job.jobId, leaseOwner);
    if (!completed) {
      console.error(
        `[Outbox Worker] Job ${job.jobId} (job_type=${job.jobType}) finished handler execution but no longer owns its lease; success is not recorded.`,
      );
      return true;
    }

    console.log(
      `[Outbox Worker] Completed job ${job.jobId} (job_type=${job.jobType}, attempt ${job.attempts}/${job.maxAttempts}).`,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (registration.replaySafety === 'IDEMPOTENT') {
      const outcome = await failOutboxJob(job.jobId, leaseOwner, err);
      console.warn(
        `[Outbox Worker] Replay-safe job ${job.jobId} (job_type=${job.jobType}) failed on attempt ${job.attempts}/${job.maxAttempts}: ${message} -> ${outcome}`,
      );
    } else {
      const reason = `handler requires reconciliation after failure: ${message}`;
      const quarantined = await quarantineOutboxJob(job.jobId, leaseOwner, reason);
      console.warn(
        `[Outbox Worker] Non-replay-safe job ${job.jobId} (job_type=${job.jobType}) failed with ambiguous side-effect state; quarantine=${quarantined}.`,
      );
    }
  } finally {
    clearInterval(heartbeatTimer);
  }

  return true;
}

/**
 * Canonical bounded execution seam for ADR-0054 jobs.
 *
 * A future external execution host may invoke this bounded drain, but MUST NOT introduce a second
 * durable queue, retry budget, dead-letter store or job-type routing authority.
 */
export async function drainOutboxJobs(
  leaseOwner: string,
  maxJobs = OUTBOX_MAX_JOBS_PER_DRAIN,
): Promise<number> {
  const boundedMax = Math.max(1, Math.min(Math.floor(maxJobs), OUTBOX_MAX_JOBS_PER_DRAIN));
  let processed = 0;
  while (processed < boundedMax && (await processOneOutboxJob(leaseOwner))) {
    processed += 1;
  }
  return processed;
}

let pollTimer: NodeJS.Timeout | null = null;
let workerId: string | null = null;

export interface OutboxWorkerOptions {
  intervalMs?: number;
  leaseOwner?: string;
}

/** Starts the poll loop. Idempotent -- a second call while already running is a no-op. */
export function startOutboxWorker(options: OutboxWorkerOptions = {}): void {
  if (pollTimer) {
    return;
  }
  workerId = options.leaseOwner || `outbox-worker-${randomUUID()}`;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;

  const tick = async () => {
    try {
      await drainOutboxJobs(workerId as string);
    } catch (err: unknown) {
      console.error(
        '[Outbox Worker] Poll tick failed:',
        err instanceof Error ? err.message : String(err),
      );
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

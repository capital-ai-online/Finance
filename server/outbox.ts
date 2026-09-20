// ADR-0054 / R-101 -- Durable worker/outbox/lease.
//
// Generalizes the claim-table pattern already proven in production by
// server/stripeEventInbox.ts (ADR-0045) and server/pdfCreditLedger.ts (ADR-0052) into a
// reusable job outbox: enqueue once, lease-claim for exclusive processing, then complete or
// schedule a bounded retry before moving to dead_letter. SH-02.5 adds explicit replay-safety:
// stale leases are reclaimed only for handlers registered as IDEMPOTENT; ambiguous side effects
// are quarantined for reconciliation with durable recovery evidence.

import {
  assertPrivilegedSupabaseConfigured,
  getPrivilegedServerSupabase,
  isSupabaseConfigured,
} from './db';
import { getCleanEnv } from './env';

export interface EnqueueOutboxJobInput {
  jobType: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string | null;
  maxAttempts?: number;
  availableAt?: Date;
}

export interface OutboxEnqueueResult {
  enqueued: boolean;
  jobId: string | null;
}

export type OutboxReplaySafety = 'IDEMPOTENT' | 'REQUIRES_RECONCILIATION';

export interface ClaimedOutboxJob {
  jobId: string;
  jobType: string;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
}

export type OutboxFailOutcome = 'pending' | 'dead_letter' | 'not_claimed';

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LEASE_SECONDS = 60;
const DEFAULT_BACKOFF_SECONDS = 30;

function isProduction(): boolean {
  return getCleanEnv('NODE_ENV') === 'production';
}

/**
 * Returns the privileged Supabase client, or null when it is legitimately absent in local
 * development. In production, a missing privileged client always fails closed -- the outbox
 * never silently degrades to a weaker (or absent) durability guarantee in production, matching
 * the fail-closed contract server/stripeEventInbox.ts and server/pdfCreditLedger.ts already use.
 */
function requireSupabase(context: string) {
  if (!isSupabaseConfigured()) {
    if (isProduction()) {
      assertPrivilegedSupabaseConfigured(context);
    }
    return null;
  }
  return getPrivilegedServerSupabase();
}

function normalizeRpcRow(data: any): any {
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Enqueues an outbox job. Returns { enqueued: false } (with the existing job's id) instead of
 * inserting a duplicate when idempotencyKey is already present -- callers should treat that as
 * "already scheduled/handled", not an error.
 *
 * In local development without Supabase configured, enqueueing is skipped (best-effort retry
 * resilience is simply unavailable there, the same trade-off already accepted for the local-file
 * fallbacks in server/pdfCreditLedger.ts and server/mailer.ts). Production without Supabase
 * fails closed like the rest of the billing path.
 */
export async function enqueueOutboxJob(input: EnqueueOutboxJobInput): Promise<OutboxEnqueueResult> {
  if (!input.jobType || !input.payload) {
    throw new Error('[Outbox] enqueueOutboxJob requires jobType and payload.');
  }

  const supabase = requireSupabase('Outbox job enqueue');
  if (!supabase) {
    console.warn(`[Outbox] Supabase not configured; skipping enqueue of job_type=${input.jobType} (development only).`);
    return { enqueued: false, jobId: null };
  }

  const { data, error } = await supabase.rpc('enqueue_outbox_job', {
    p_job_type: input.jobType,
    p_payload: input.payload,
    p_idempotency_key: input.idempotencyKey ?? null,
    p_max_attempts: input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    p_available_at: (input.availableAt ?? new Date()).toISOString(),
  });

  if (error) {
    throw new Error(`[Outbox] enqueue_outbox_job failed for job_type=${input.jobType}: ${error.message || JSON.stringify(error)}`);
  }

  const row = normalizeRpcRow(data);
  if (!row) {
    throw new Error(`[Outbox] enqueue_outbox_job returned no row for job_type=${input.jobType}.`);
  }

  return { enqueued: Boolean(row.enqueued), jobId: row.job_id ?? null };
}

/**
 * Atomically claims one eligible job for leaseOwner. Pending due work may be claimed normally;
 * an expired processing lease is reclaimed only when its job type is explicitly replay-safe and
 * still within max_attempts. Unsafe/exhausted stale work is quarantined by the v2 RPC.
 *
 * Returns null when nothing is claimable, or -- in local development without Supabase -- always,
 * since there is no durable queue to poll there.
 */
export async function claimOutboxJob(
  leaseOwner: string,
  leaseSeconds: number = DEFAULT_LEASE_SECONDS,
  replaySafeJobTypes: readonly string[] = [],
): Promise<ClaimedOutboxJob | null> {
  const supabase = requireSupabase('Outbox job claim');
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc('claim_outbox_job_v2', {
    p_lease_owner: leaseOwner,
    p_lease_seconds: leaseSeconds,
    p_replay_safe_job_types: [...new Set(replaySafeJobTypes.filter(Boolean))],
  });

  if (error) {
    throw new Error(`[Outbox] claim_outbox_job_v2 failed: ${error.message || JSON.stringify(error)}`);
  }

  const row = normalizeRpcRow(data);
  if (!row) {
    return null;
  }

  return {
    jobId: row.job_id,
    jobType: row.job_type,
    payload: row.payload,
    attempts: Number(row.attempts),
    maxAttempts: Number(row.max_attempts),
  };
}

/**
 * Extends the current processing lease only while this worker still owns an unexpired lease.
 * An expired lease is never resurrected by a late heartbeat.
 */
export async function heartbeatOutboxJob(
  jobId: string,
  leaseOwner: string,
  leaseSeconds: number = DEFAULT_LEASE_SECONDS,
): Promise<boolean> {
  const supabase = requireSupabase('Outbox job heartbeat');
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase.rpc('heartbeat_outbox_job', {
    p_job_id: jobId,
    p_lease_owner: leaseOwner,
    p_lease_seconds: leaseSeconds,
  });

  if (error) {
    throw new Error(`[Outbox] heartbeat_outbox_job failed for ${jobId}: ${error.message || JSON.stringify(error)}`);
  }

  return Boolean(data);
}

/**
 * Moves the currently leased job directly into the canonical dead-letter/quarantine state.
 * Use when replay safety is not proven or when a non-recoverable worker contract failure occurs.
 */
export async function quarantineOutboxJob(
  jobId: string,
  leaseOwner: string,
  reason: unknown,
): Promise<boolean> {
  const supabase = requireSupabase('Outbox job quarantine');
  if (!supabase) {
    return false;
  }

  const message = reason instanceof Error ? reason.message : String(reason);
  const { data, error } = await supabase.rpc('quarantine_outbox_job', {
    p_job_id: jobId,
    p_lease_owner: leaseOwner,
    p_reason: message,
  });

  if (error) {
    throw new Error(`[Outbox] quarantine_outbox_job failed for ${jobId}: ${error.message || JSON.stringify(error)}`);
  }

  return Boolean(data);
}

/** Marks a claimed job succeeded. Returns false if this caller no longer holds the lease. */
export async function completeOutboxJob(jobId: string, leaseOwner: string): Promise<boolean> {
  const supabase = requireSupabase('Outbox job completion');
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase.rpc('complete_outbox_job', {
    p_job_id: jobId,
    p_lease_owner: leaseOwner,
  });

  if (error) {
    throw new Error(`[Outbox] complete_outbox_job failed for ${jobId}: ${error.message || JSON.stringify(error)}`);
  }

  return Boolean(data);
}

/**
 * Records a failed attempt. Below max_attempts the job is rescheduled with backoff ('pending');
 * at or beyond max_attempts it moves to 'dead_letter' for manual reconciliation.
 */
export async function failOutboxJob(
  jobId: string,
  leaseOwner: string,
  errorValue: unknown,
  backoffSeconds: number = DEFAULT_BACKOFF_SECONDS,
): Promise<OutboxFailOutcome> {
  const supabase = requireSupabase('Outbox job failure recording');
  if (!supabase) {
    return 'not_claimed';
  }

  const message = errorValue instanceof Error ? errorValue.message : String(errorValue);

  const { data, error } = await supabase.rpc('fail_outbox_job', {
    p_job_id: jobId,
    p_lease_owner: leaseOwner,
    p_error: message,
    p_backoff_seconds: backoffSeconds,
  });

  if (error) {
    throw new Error(`[Outbox] fail_outbox_job failed for ${jobId}: ${error.message || JSON.stringify(error)}`);
  }

  return (data as OutboxFailOutcome) ?? 'not_claimed';
}

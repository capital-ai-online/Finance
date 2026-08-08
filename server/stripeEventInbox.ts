import { createHash } from 'crypto';
import type Stripe from 'stripe';
import { getCleanEnv } from './env';
import {
  assertPrivilegedSupabaseConfigured,
  getServerSupabase,
  isSupabaseConfigured,
} from './db';

export interface StripeWebhookProcessingContext {
  /** Logical ingress identifier for diagnostics; not used for authorization. */
  ingressSource?: string;
  /** Optional raw verified webhook body. When absent, the parsed Stripe event is hashed. */
  rawBody?: Buffer | string;
}

export interface StripeEventClaimResult {
  claimed: boolean;
  claimStatus: string;
  attempts: number;
  integrityMatches: boolean;
}

const localDevelopmentClaims = new Set<string>();

function isProduction(): boolean {
  return getCleanEnv('NODE_ENV') === 'production';
}

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function computePayloadHash(event: Stripe.Event, rawBody?: Buffer | string): string {
  if (rawBody !== undefined) {
    return sha256(rawBody);
  }
  // The event object has already passed Stripe signature verification at the route boundary.
  // Hashing the parsed representation is a compatibility fallback for direct unit/service calls.
  return sha256(JSON.stringify(event));
}

function normalizeRpcRow(data: any): any {
  return Array.isArray(data) ? data[0] : data;
}

export async function claimStripeEvent(
  event: Stripe.Event,
  context: StripeWebhookProcessingContext = {},
): Promise<StripeEventClaimResult> {
  if (!event?.id || !event?.type) {
    throw new Error('[Stripe Inbox] event.id and event.type are required.');
  }

  const payloadHash = computePayloadHash(event, context.rawBody);
  const ingressSource = context.ingressSource || 'capital-ai-webhook';

  if (!isSupabaseConfigured()) {
    if (isProduction()) {
      assertPrivilegedSupabaseConfigured('Stripe event inbox claim');
    }

    // Development-only fallback. Production must never rely on process-local deduplication.
    if (localDevelopmentClaims.has(event.id)) {
      return {
        claimed: false,
        claimStatus: 'duplicate_processing',
        attempts: 1,
        integrityMatches: true,
      };
    }
    localDevelopmentClaims.add(event.id);
    return {
      claimed: true,
      claimStatus: 'claimed_local_dev',
      attempts: 1,
      integrityMatches: true,
    };
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase.rpc('claim_stripe_event', {
    p_event_id: event.id,
    p_event_type: event.type,
    p_livemode: Boolean(event.livemode),
    p_api_version: event.api_version || null,
    p_ingress_source: ingressSource,
    p_payload_hash: payloadHash,
  });

  if (error) {
    throw new Error(`[Stripe Inbox] claim_stripe_event failed for ${event.id}: ${error.message || JSON.stringify(error)}`);
  }

  const row = normalizeRpcRow(data);
  if (!row) {
    throw new Error(`[Stripe Inbox] claim_stripe_event returned no row for ${event.id}.`);
  }

  return {
    claimed: Boolean(row.claimed),
    claimStatus: String(row.claim_status || 'unknown'),
    attempts: Number(row.claim_attempts || 0),
    integrityMatches: row.integrity_matches !== false,
  };
}

export async function markStripeEventProcessed(eventId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    if (isProduction()) {
      assertPrivilegedSupabaseConfigured('Stripe event inbox completion');
    }
    return;
  }

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('stripe_event_inbox')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('event_id', eventId)
    .eq('status', 'processing');

  if (error) {
    throw new Error(`[Stripe Inbox] failed to mark ${eventId} processed: ${error.message || JSON.stringify(error)}`);
  }
}

export async function markStripeEventFailed(eventId: string, errorValue: unknown): Promise<void> {
  const message = errorValue instanceof Error ? errorValue.message : String(errorValue);

  if (!isSupabaseConfigured()) {
    if (isProduction()) {
      assertPrivilegedSupabaseConfigured('Stripe event inbox failure recording');
    }
    // Development-only: allow the same event to be retried after a failed attempt.
    localDevelopmentClaims.delete(eventId);
    return;
  }

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('stripe_event_inbox')
    .update({
      status: 'failed',
      last_error: message.slice(0, 4000),
    })
    .eq('event_id', eventId)
    .eq('status', 'processing');

  if (error) {
    throw new Error(`[Stripe Inbox] failed to mark ${eventId} failed: ${error.message || JSON.stringify(error)}`);
  }
}

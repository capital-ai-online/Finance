import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('privacy retention hardening (ADR-0092)', () => {
  const migration = read('supabase/migrations/20260819103000_privacy_retention_lifecycle_hardening.sql');
  const advisorFollowUp = read('supabase/migrations/20260819104500_privacy_retention_advisor_indexes.sql');

  it('repairs all social-media persistence tables idempotently', () => {
    expect(migration).toContain('create table if not exists public.social_media_accounts');
    expect(migration).toContain('create table if not exists public.social_media_oauth_states');
    expect(migration).toContain('create table if not exists public.social_media_publish_log');
    expect(migration).toContain('for all to service_role using (true) with check (true)');
  });

  it('makes retention table-aware, hold-aware, auditable and concurrency-safe', () => {
    expect(migration).toContain("to_regclass('public.social_media_oauth_states')");
    expect(migration).toContain('retention_hold_until');
    expect(migration).toContain('public.privacy_retention_runs');
    expect(migration).toContain('pg_try_advisory_xact_lock');
    expect(migration).toContain("'status', 'succeeded'");
  });

  it('schedules one canonical daily retention job', () => {
    expect(migration).toContain("jobname = 'privacy-operational-retention-daily'");
    expect(migration).toContain("'17 3 * * *'");
    expect(migration).toContain("'select public.purge_expired_privacy_operational_data();'");
  });

  it('enforces the privacy-request lifecycle before completion', () => {
    expect(migration).toContain("old.status = 'received' and new.status in ('identity_verified', 'rejected')");
    expect(migration).toContain("old.status = 'identity_verified' and new.status in ('in_progress', 'rejected')");
    expect(migration).toContain("old.status = 'in_progress' and new.status in ('completed', 'rejected')");
    expect(migration).toContain('identity_verified_at');
  });

  it('keeps post-production advisor remediation in a separate immutable migration', () => {
    expect(advisorFollowUp).toContain('idx_social_media_oauth_states_user_id');
    expect(advisorFollowUp).toContain('on public.social_media_oauth_states (user_id)');
    expect(advisorFollowUp).toContain('idx_social_media_publish_log_account_id');
    expect(advisorFollowUp).toContain('on public.social_media_publish_log (account_id)');
  });
});

describe('privacy-safe mailer logging', () => {
  const mailer = read('server/mailer.ts');

  it('does not interpolate recipient addresses into operational log messages', () => {
    expect(mailer).not.toContain('E-Mail an ${params.to} gesendet');
    expect(mailer).not.toContain('Versand an ${params.to} fehlgeschlagen');
    expect(mailer).not.toContain('Kunde ${customerEmail}');
    expect(mailer).not.toContain('an ${ownerEmail}');
  });

  it('does not put customer identifiers into the owner notification subject', () => {
    expect(mailer).toContain('subject: `Neues Abo aktiviert: ${data.planId}`');
    expect(mailer).not.toContain('subject: `Neues Abo aktiviert: ${data.planId} (${customerEmail}');
  });

  it('uses hashed correlation references instead of raw checkout session IDs in logs', () => {
    expect(mailer).toContain("crypto.createHash('sha256')");
    expect(mailer).toContain('logCorrelationRef(sessionId)');
    expect(mailer).not.toContain('Duplikat uebersprungen (Session ${sessionId})');
  });
});

describe('processing lifecycle registry', () => {
  const privacyPolicy = read('src/privacy/privacyPolicy.ts');

  it('distinguishes active from conditional processing', () => {
    expect(privacyPolicy).toContain("export type ProcessingLifecycle = 'active' | 'conditional' | 'planned'");
    expect(privacyPolicy).toContain("id: 'analytics-advertising'");
    expect(privacyPolicy).toContain("id: 'social-publishing'");
    expect(privacyPolicy).toContain("lifecycle: 'conditional'");
  });
});

describe('Stripe production flow evidence', () => {
  const flowMapping = JSON.parse(
    read('docs/compliance/vendor-evidence/subprocessor-evidence/2026-08-19-stripe-flow-mapping.json'),
  ) as {
    webhookInventory: { endpointCount: number; status: string };
    webhookDestinations: Array<{
      endpointId: string;
      metadata?: Record<string, string>;
      stripeEnabledEvents?: string[];
      mutationStatus?: string;
    }>;
  };

  it('records a two-endpoint topology with the managed endpoint outside mutation scope', () => {
    expect(flowMapping.webhookInventory.endpointCount).toBe(2);
    expect(flowMapping.webhookInventory.status).toBe('post-mutation-live-account-read');
    const managed = flowMapping.webhookDestinations.find(
      (endpoint) => endpoint.metadata?.managed_by === 'stripe-sync',
    );
    expect(managed?.mutationStatus).toBe('not-changed');
  });

  it('records least-event scope on the CAPITAL-AI application endpoint', () => {
    const appOwned = flowMapping.webhookDestinations.find(
      (endpoint) => endpoint.metadata?.managed_by === 'capital-ai',
    );
    expect(appOwned?.stripeEnabledEvents).toEqual(['checkout.session.completed']);
    expect(appOwned?.mutationStatus).toBe('owner-authorized-applied-and-post-verified');
  });
});

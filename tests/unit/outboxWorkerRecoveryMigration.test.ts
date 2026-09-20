import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const migrationPath = path.join(
  root,
  'supabase/migrations/20260920141000_outbox_worker_recovery.sql',
);
const correctiveMigrationPath = path.join(
  root,
  'supabase/migrations/20260920161445_fix_outbox_worker_recovery_job_id_ambiguity.sql',
);

function migration(): string {
  return fs.readFileSync(migrationPath, 'utf8');
}

function correctiveMigration(): string {
  return fs.readFileSync(correctiveMigrationPath, 'utf8');
}

describe('SH-02.5 outbox worker recovery migration', () => {
  it('persists replay/quarantine recovery evidence in the canonical outbox domain', () => {
    const sql = migration();
    expect(sql).toContain('create table if not exists public.outbox_recovery_events');
    expect(sql).toContain("'stale_lease_reclaimed'");
    expect(sql).toContain("'work_item_quarantined'");
    expect(sql).toContain('references public.outbox_jobs(id)');
    expect(sql).toContain('grant select, insert on table public.outbox_recovery_events to service_role');
  });

  it('heartbeats only a currently owned unexpired processing lease', () => {
    const sql = migration();
    expect(sql).toContain('create or replace function public.heartbeat_outbox_job');
    expect(sql).toContain("status = 'processing'");
    expect(sql).toContain('lease_owner = p_lease_owner');
    expect(sql).toContain('lease_expires_at > now()');
  });

  it('quarantines stale unsafe or exhausted work instead of replaying it', () => {
    const sql = migration();
    expect(sql).toContain('create or replace function public.claim_outbox_job_v2');
    expect(sql).toContain('candidate.attempts >= candidate.max_attempts');
    expect(sql).toContain("not (candidate.job_type = any(coalesce(p_replay_safe_job_types, '{}'::text[])))");
    expect(sql).toContain("status = 'dead_letter'");
    expect(sql).toContain('limit 50');
  });

  it('reclaims an expired processing lease only for an explicitly replay-safe type within budget', () => {
    const sql = migration();
    expect(sql).toContain("candidate.status = 'processing'");
    expect(sql).toContain('candidate.lease_expires_at < now()');
    expect(sql).toContain('candidate.attempts < candidate.max_attempts');
    expect(sql).toContain("candidate.job_type = any(coalesce(p_replay_safe_job_types, '{}'::text[]))");
    expect(sql).toContain("'expired lease reclaimed for explicitly replay-safe handler'");
  });

  it('keeps the legacy claim RPC fail-closed for rolling rollback compatibility', () => {
    const sql = migration();
    expect(sql).toContain('create or replace function public.claim_outbox_job(');
    expect(sql).toContain('from public.claim_outbox_job_v2(');
    expect(sql).toContain("'{}'::text[]");
  });

  it('corrects the PL/pgSQL output-column ambiguity found during production readback', () => {
    const sql = correctiveMigration();
    expect(sql).toContain('create or replace function public.claim_outbox_job_v2');
    expect(sql).toContain('returning 1 as recorded');
    expect(sql).not.toContain('returning job_id');
    expect(sql).toContain(
      'revoke all on function public.claim_outbox_job_v2(text, integer, text[]) from public, anon, authenticated',
    );
    expect(sql).toContain(
      'grant execute on function public.claim_outbox_job_v2(text, integer, text[]) to service_role',
    );
  });
});

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const migrationPath = 'supabase/migrations/20260916160000_security_definer_least_privilege.sql';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function compact(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

const migration = read(migrationPath);
const normalizedMigration = compact(migration);
const signupSource = read('supabase/migrations/20260731000100_harden_handle_new_user_search_path.sql');
const subscriptionSource = read('supabase/migrations/20260901162000_user_lifecycle_subscription_identity_authority.sql');

describe('SEC-WEB-REMEDIATION-02 Supabase SECURITY DEFINER least privilege', () => {
  it('revokes direct browser-role execution and preserves service_role execution for repository-owned triggers', () => {
    expect(normalizedMigration).toContain(
      'revoke all on function public.handle_new_user() from public, anon, authenticated;',
    );
    expect(normalizedMigration).toContain(
      'grant execute on function public.handle_new_user() to service_role;',
    );
    expect(normalizedMigration).toContain(
      'revoke all on function public.sync_stripe_subscription_to_public() from public, anon, authenticated;',
    );
    expect(normalizedMigration).toContain(
      'grant execute on function public.sync_stripe_subscription_to_public() to service_role;',
    );
  });

  it('hardens provider-only rls_auto_enable without making clean migration replay depend on it', () => {
    expect(normalizedMigration).toContain("to_regprocedure('public.rls_auto_enable()') is not null");
    expect(normalizedMigration).toContain(
      "execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';",
    );
    expect(normalizedMigration).toContain(
      "execute 'grant execute on function public.rls_auto_enable() to service_role';",
    );
  });

  it('does not redefine functions, triggers, business data or schema objects', () => {
    expect(normalizedMigration).not.toContain('create or replace function');
    expect(normalizedMigration).not.toContain('drop function');
    expect(normalizedMigration).not.toContain('drop trigger');
    expect(normalizedMigration).not.toMatch(/\b(insert|update|delete)\s+(into|[a-z_])/);
    expect(normalizedMigration).not.toContain('alter table');
  });

  it('keeps the existing positive trigger implementations present in canonical source migrations', () => {
    expect(compact(signupSource)).toContain('create or replace function public.handle_new_user()');
    expect(compact(signupSource)).toContain('returns trigger');
    expect(compact(subscriptionSource)).toContain(
      'create or replace function public.sync_stripe_subscription_to_public()',
    );
    expect(compact(subscriptionSource)).toContain('returns trigger');
  });

  it('records the protected provider-mutation boundary in the migration itself', () => {
    expect(migration).toContain('MUST NOT be applied to the connected');
    expect(migration).toContain('separate protected-external-mutation authority');
  });
});

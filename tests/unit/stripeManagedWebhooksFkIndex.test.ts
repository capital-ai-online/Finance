import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260924171500_index_stripe_managed_webhooks_account_fk.sql',
);

describe('Stripe managed-webhook foreign-key index migration', () => {
  it('adds the exact covering index without altering the provider-managed constraint', () => {
    const migration = fs.readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('create index if not exists idx_managed_webhooks_account_id');
    expect(migration).toContain('on stripe._managed_webhooks (account_id)');
    expect(migration).not.toContain('drop constraint');
    expect(migration).not.toContain('drop index');
  });
});

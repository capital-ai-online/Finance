import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260905103413_user_lifecycle_subscription_identity_authority.sql',
);

function migration(): string {
  return fs.readFileSync(migrationPath, 'utf8');
}

describe('User-Lifecycle subscription projection identity authority', () => {
  it('uses Stripe subscription metadata.user_id as the stable identity input', () => {
    const sql = migration();

    expect(sql).toContain("NEW.metadata->>'user_id'");
    expect(sql).toContain('WHERE id = v_user_id');
    expect(sql).not.toMatch(/FROM auth\.users\s+WHERE email\s*=/i);
  });

  it('keeps email secondary and fails closed for missing, malformed or unknown identities', () => {
    const sql = migration();

    expect(sql).toContain("v_user_id_text = ''");
    expect(sql).toContain('RETURN NEW;');
    expect(sql).toContain('SELECT email INTO v_email');
    expect(sql).toContain('WHERE id = v_user_id');
  });

  it('normalizes only known paid tier metadata and demotes non-active subscriptions to Free', () => {
    const sql = migration();

    expect(sql).toContain("WHEN 'STARTER' THEN 'Starter'");
    expect(sql).toContain("WHEN 'PRO' THEN 'Pro'");
    expect(sql).toContain("WHEN 'ENTERPRISE' THEN 'Enterprise'");
    expect(sql).toContain("IF NEW.status NOT IN ('active', 'trialing') THEN");
    expect(sql).toContain("v_tier := 'Free';");
  });

  it('upserts the durable public projection by user_id rather than email', () => {
    const sql = migration();

    expect(sql).toContain('ON CONFLICT (user_id) DO UPDATE SET');
    expect(sql).not.toContain('ON CONFLICT (email)');
  });

  it('maps the Stripe Sync Engine subscription columns used by the canonical projection', () => {
    const sql = migration();

    expect(sql).toContain('NEW.id');
    expect(sql).toContain('NEW.status');
    expect(sql).toContain('NEW.current_period_end');
    expect(sql).toContain("NEW.metadata->>'user_id'");
    expect(sql).toContain("NEW.metadata->>'plan_id'");
    expect(sql).toContain("NEW.items->'data'->0->'price'->>'id'");
    expect(sql).toContain('stripe_subscription_id = EXCLUDED.stripe_subscription_id');
    expect(sql).toContain('current_period_end = EXCLUDED.current_period_end');
    expect(sql).toContain('tier = EXCLUDED.tier');
  });
});

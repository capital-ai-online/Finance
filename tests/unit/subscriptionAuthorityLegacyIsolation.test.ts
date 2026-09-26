import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('canonical subscription authority and legacy isolation', () => {
  it('reads productive entitlements from public.subscriptions by verified UUID', () => {
    const db = read('server/db.ts');
    const routes = read('server/routes/backendAuthRoutes.ts');

    expect(db).toContain(".from('subscriptions')");
    expect(db).toContain(".eq('user_id', cleanKey)");
    expect(routes).toContain('getSubscription(user.id)');
    expect(routes).not.toContain('public.users');
  });

  it('keeps Checkout subscription metadata aligned with the Stripe-to-public trigger identity', () => {
    const stripe = read('server/stripe.ts');
    const migration = read('supabase/migrations/20260905103413_user_lifecycle_subscription_identity_authority.sql');

    expect(stripe).toContain('subscription_data = {');
    expect(stripe).toContain('user_id: userId ||');
    expect(stripe).toContain('plan_id: planId');
    expect(migration).toContain("NEW.metadata->>'user_id'");
    expect(migration).toContain("NEW.metadata->>'plan_id'");
    expect(migration).toContain('WHERE id = v_user_id');
    expect(migration).toContain('ON CONFLICT (user_id) DO UPDATE SET');
  });

  it('does not restore legacy public.users tier/stripe fields as runtime authority', () => {
    const productionFiles = [
      'server/db.ts',
      'server/stripe.ts',
      'server/routes/backendAuthRoutes.ts',
      'src/platform/Security/authMiddleware.ts',
    ].map(read).join('\n');

    expect(productionFiles).not.toContain(".from('users').select('tier");
    expect(productionFiles).not.toContain('public.users.tier');
    expect(productionFiles).not.toContain('public.users.stripe_subscription_id');
  });
});

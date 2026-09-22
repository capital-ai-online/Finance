import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const checkout = read('src/features/billing/ui/Checkout.tsx');
const subscriptions = read('src/features/billing/ui/Abonnements.tsx');
const billingFacade = read('src/features/billing/ui/index.ts');
const login = read('src/features/public/ui/LoginPage.tsx');
const session = read('src/app/auth/SessionComposition.tsx');
const header = read('src/features/public/ui/frontend-port/components/Header.tsx');

describe('frontend user lifecycle projection', () => {
  it('keeps productive billing implementation in the canonical feature slice', () => {
    expect(billingFacade).toContain("export { Abonnements } from './Abonnements'");
    expect(billingFacade).toContain("export { Checkout } from './Checkout'");
  });

  it('never treats checkout redirect state as entitlement evidence', () => {
    expect(checkout).toContain('successUrl:');
    expect(checkout).toContain("authFetch('/api/stripe/create-checkout-session'");
    expect(subscriptions).toContain('readAuthenticatedSubscriptionTier()');
  });

  it('uses backend-session billing access', () => {
    expect(subscriptions).toContain("authFetch('/api/stripe/create-portal-session'");
    expect(subscriptions).not.toContain('email: profile.email');
  });

  it('uses one backend login entrypoint and explicit logout projection', () => {
    expect(login).toContain('/api/auth/login/google?next=%2F');
    expect(login).not.toContain('supabase');
    expect(session).toContain("fetch('/api/auth/session'");
    expect(session).toContain("fetch('/api/auth/logout'");
    expect(header).toContain('header-logout-btn');
  });
});

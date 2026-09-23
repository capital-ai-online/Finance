import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const checkout = read('src/features/billing/ui/Checkout.tsx');
const subscriptions = read('src/features/billing/ui/Abonnements.tsx');
const billingFacade = read('src/features/billing/ui/index.ts');
const pricingPolicy = read('src/config/productAccessPolicy.ts');
const login = read('src/features/public/ui/LoginPage.tsx');
const session = read('src/app/auth/SessionComposition.tsx');
const header = read('src/features/public/ui/frontend-port/components/Header.tsx');

describe('frontend user lifecycle projection', () => {
  it('keeps the former checkout implementation compatibility-only while pricing is archived', () => {
    expect(billingFacade).toContain("export { Abonnements } from './Abonnements'");
    expect(billingFacade).toContain("export { Checkout } from './Checkout'");
    expect(pricingPolicy).toContain("pricingLifecycle: 'archived_pending_replacement'");
    expect(pricingPolicy).toContain('checkoutEntryPointsEnabled: false');
    expect(subscriptions).not.toContain('<Checkout');
    expect(subscriptions).not.toContain('SUBSCRIPTION_PRICES_EUR');
    expect(subscriptions).toContain('Pricing-Modell archiviert');
    expect(checkout).toContain("authFetch('/api/stripe/create-checkout-session'");
  });

  it('keeps existing-account billing management outside the archived pricing catalogue', () => {
    expect(subscriptions).not.toContain("authFetch('/api/stripe/create-portal-session'");
    expect(subscriptions).toContain('Bestehende');
    expect(subscriptions).toContain('verwaltet');
  });

  it('opens registration AGB and Datenschutz links in isolated new tabs', () => {
    const termsStart = login.indexOf('id="registration-terms"');
    const submitStart = login.indexOf('id="register-submit-btn"');
    const registrationTerms = login.slice(termsStart, submitStart);

    expect(termsStart).toBeGreaterThanOrEqual(0);
    expect(submitStart).toBeGreaterThan(termsStart);
    expect(registrationTerms).toMatch(
      /href="\/agb"[\s\S]*?target="_blank"[\s\S]*?rel="noopener noreferrer"/,
    );
    expect(registrationTerms).toMatch(
      /href="\/datenschutz"[\s\S]*?target="_blank"[\s\S]*?rel="noopener noreferrer"/,
    );
  });

  it('uses one backend login entrypoint and explicit logout projection', () => {
    expect(login).toContain('/api/auth/login/google?next=%2F');
    expect(login).not.toContain('supabase');
    expect(session).toContain("fetch('/api/auth/session'");
    expect(session).toContain("fetch('/api/auth/logout'");
    expect(header).toContain('header-logout-btn');
  });
});

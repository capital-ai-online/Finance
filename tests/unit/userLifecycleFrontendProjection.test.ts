import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const checkout = read('src/features/billing/ui/Checkout.tsx');
const subscriptions = read('src/features/billing/ui/Abonnements.tsx');
const subscriptionModal = read('src/features/billing/ui/SubscriptionModal.tsx');
const billingFacade = read('src/features/billing/ui/index.ts');
const legacyCheckout = read('src/components/Checkout.tsx');
const legacySubscriptions = read('src/components/Abonnements.tsx');
const legacySubscriptionModal = read('src/components/SubscriptionModal.tsx');
const loginPage = read('src/features/public/ui/LoginPage.tsx');
const sessionComposition = read('src/app/auth/SessionComposition.tsx');

describe('frontend user lifecycle projection', () => {
  it('keeps productive billing implementation in the canonical feature slice', () => {
    expect(billingFacade).toContain("export { Abonnements } from './Abonnements'");
    expect(billingFacade).toContain("export { Checkout } from './Checkout'");
    expect(billingFacade).toContain("export { SubscriptionModal } from './SubscriptionModal'");
    expect(legacyCheckout.trim()).toMatch(/^export \{ Checkout \} from '\.\.\/features\/billing\/ui\/Checkout';/);
    expect(legacySubscriptions.trim()).toBe("export { Abonnements } from '../features/billing/ui/Abonnements';");
    expect(legacySubscriptionModal.trim()).toBe(
      "export { SubscriptionModal } from '../features/billing/ui/SubscriptionModal';",
    );
  });

  it('projects catalog prices and entitlements without creating a second local plan authority', () => {
    expect(subscriptions).toContain('SUBSCRIPTION_PRICES_EUR');
    expect(subscriptions).toContain('SUBSCRIPTION_ENTITLEMENTS');
    expect(subscriptions).not.toContain('discountMultiplier');
    expect(subscriptions).not.toContain('Math.round(plan.price');
    expect(subscriptions).toContain("plan === 'Enterprise' && billingPeriod === 'yearly'");
    expect(subscriptions).toContain('Jahresabo auf Anfrage');
  });

  it('never treats checkout redirect state as entitlement evidence', () => {
    expect(checkout).toContain('successUrl: `${window.location.origin}/dashboard?checkout=pending`');
    expect(checkout).not.toContain('payment=success');
    expect(checkout).not.toContain('onSuccess(planId)');
    expect(checkout).toContain("authFetch('/api/stripe/create-checkout-session'");
    expect(checkout).not.toMatch(/body: JSON\.stringify\(\{[\s\S]{0,240}\buserId\b/);
    expect(subscriptions).toContain('readAuthenticatedSubscriptionTier()');
    expect(subscriptions).toContain('if (tier !== currentTier) onUpdateTier(tier)');
    expect(subscriptions).toContain('Die Aktivierung bleibt <strong>ausstehend</strong>');
  });

  it('uses bearer-authenticated billing portal access and surfaces failures', () => {
    expect(subscriptions).toContain("authFetch('/api/stripe/create-portal-session'");
    expect(subscriptions).toContain('Abrechnung / Kündigung verwalten');
    expect(subscriptions).toContain('role="alert"');
    expect(subscriptions).toContain('portalError');
    expect(subscriptions).not.toContain('email: profile.email');
  });

  it('keeps lifecycle authentication and explicit logout semantics on existing authorities', () => {
    expect(loginPage).toContain('supabase.auth.signInWithPassword');
    expect(loginPage).toContain('supabase.auth.signUp');
    expect(loginPage).toContain("provider: 'google'");
    expect(sessionComposition).toContain("const handleLogout = async () => performLogout('local')");
    expect(sessionComposition).toContain("const handleGlobalLogout = async () => performLogout('global')");
  });

  it('records keyboard, focus, state and responsive presentation semantics', () => {
    expect(checkout).toContain('role="dialog"');
    expect(checkout).toContain('aria-modal="true"');
    expect(checkout).toContain("event.key === 'Escape'");
    expect(checkout).toContain('closeButtonRef.current?.focus()');
    expect(checkout).toContain('previouslyFocused?.focus()');
    expect(checkout).toContain('min-h-11');
    expect(subscriptionModal).toContain('role="dialog"');
    expect(subscriptionModal).toContain('aria-modal="true"');
    expect(subscriptionModal).toContain("event.key === 'Escape'");
    expect(subscriptions).toContain('grid grid-cols-1 gap-4 lg:grid-cols-3');
    expect(subscriptions).toContain('overflow-x-auto');
    expect(subscriptions).toContain("type SyncState = 'idle' | 'loading' | 'synchronized' | 'failed'");
  });
});

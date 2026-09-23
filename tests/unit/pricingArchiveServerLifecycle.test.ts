import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const stripe = readFileSync('server/stripe.ts', 'utf8');

describe('archived pricing server lifecycle', () => {
  it('fails closed before identity or Stripe access for every new checkout request', () => {
    const routeStart = stripe.indexOf("stripeRouter.post('/create-checkout-session'");
    const routeEnd = stripe.indexOf("stripeRouter.post('/create-portal-session'");
    expect(routeStart).toBeGreaterThan(-1);
    expect(routeEnd).toBeGreaterThan(routeStart);

    const checkoutRoute = stripe.slice(routeStart, routeEnd);
    const archiveGuard = checkoutRoute.indexOf('if (isArchivedPricingCheckout())');
    const identity = checkoutRoute.indexOf('resolveVerifiedIdentity(req)');
    const stripeInstance = checkoutRoute.indexOf('getStripeInstance()');
    const sessionCreate = checkoutRoute.indexOf('stripe.checkout.sessions.create');

    expect(stripe).toContain("export const PRICING_CHECKOUT_LIFECYCLE = 'ARCHIVED_DISABLED' as const");
    expect(stripe).toContain("export const PRICING_ARCHIVE_CHECKOUT_CODE = 'PRICING_ARCHIVED_PENDING_REPLACEMENT' as const");
    expect(checkoutRoute).toContain('return res.status(409).json({');
    expect(checkoutRoute).toContain('code: PRICING_ARCHIVE_CHECKOUT_CODE');
    expect(archiveGuard).toBeGreaterThan(-1);
    expect(identity).toBeGreaterThan(archiveGuard);
    expect(stripeInstance).toBeGreaterThan(archiveGuard);
    expect(sessionCreate).toBeGreaterThan(archiveGuard);
  });

  it('preserves existing-customer lifecycle and billing readback routes', () => {
    expect(stripe).toContain("stripeRouter.post('/create-portal-session'");
    expect(stripe).toContain("stripeRouter.get('/user-subscription'");
    expect(stripe).toContain("stripeRouter.get('/pdf-credits'");
    expect(stripe).toContain("stripeRouter.post('/consume-pdf-credit'");
    expect(stripe).toContain("event.type === 'checkout.session.completed'");
  });

  it('keeps the historical catalogue code as non-executable provenance instead of deleting it', () => {
    expect(stripe).toContain("if (planUpper === 'STARTER')");
    expect(stripe).toContain("else if (planUpper === 'PRO')");
    expect(stripe).toContain("else if (planUpper === 'ENTERPRISE')");
    expect(stripe).toContain("planUpper === 'PDF_EXPORT'");
  });
});

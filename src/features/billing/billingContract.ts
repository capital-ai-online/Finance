export const TERMS_VERSION = '2026-08-23';
export const TERMS_EFFECTIVE_DATE = '23.08.2026';

export const LEGAL_PATHS = {
  impressum: '/impressum/',
  terms: '/agb/',
  privacy: '/datenschutz/',
} as const;

export type PaidSubscriptionPlan = 'Starter' | 'Pro' | 'Enterprise';
export type SubscriptionBillingPeriod = 'monthly' | 'yearly';

/**
 * Consumer-facing price baseline verified read-only against the active CAPITAL-AI
 * Stripe live catalog on 2026-08-23. Stripe Price IDs remain deployment
 * configuration and are intentionally not duplicated in client source code.
 *
 * The server-side Stripe Price object remains authoritative for the actual charge;
 * these values are the public pre-contract display baseline and therefore must be
 * changed only together with a fresh live-catalog verification.
 */
export const SUBSCRIPTION_PRICES_EUR: Record<
  PaidSubscriptionPlan,
  Record<SubscriptionBillingPeriod, number>
> = {
  Starter: { monthly: 7, yearly: 75.6 },
  Pro: { monthly: 29, yearly: 248 },
  Enterprise: { monthly: 109, yearly: 1280 },
};

export const STRIPE_PRICE_SNAPSHOT_DATE = '2026-08-23';

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

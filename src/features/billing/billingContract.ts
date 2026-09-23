export const TERMS_VERSION = '2026-08-23';
export const TERMS_EFFECTIVE_DATE = '23.08.2026';

export const LEGAL_PATHS = {
  impressum: '/impressum/',
  terms: '/agb/',
  privacy: '/datenschutz/',
} as const;

export type PaidSubscriptionPlan = 'Starter' | 'Pro' | 'Enterprise';
export type SubscriptionBillingPeriod = 'monthly' | 'yearly';

export const PRICING_MODEL_STATE = 'ARCHIVED_DISABLED' as const;
export const PRICING_MODEL_ARCHIVE_REFERENCE = 'docs/archive/billing/PRICING_MODEL_2026-08-23.md' as const;

/**
 * Historical pricing snapshot retained for audit/provenance only.
 *
 * PRICING_MODEL_STATE=ARCHIVED_DISABLED means these values are not an active public
 * offer and must not drive checkout or feature visibility. Stripe Price IDs remain
 * deployment configuration and are intentionally not duplicated in client source code.
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

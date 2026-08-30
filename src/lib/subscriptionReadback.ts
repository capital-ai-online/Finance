import type { SubscriptionTier } from '../app/types/UserSession';
import { authFetch } from './authFetch';

const SUBSCRIPTION_TIERS = new Set<SubscriptionTier>([
  'Free',
  'Starter',
  'Pro',
  'Enterprise',
]);

export function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return typeof value === 'string' && SUBSCRIPTION_TIERS.has(value as SubscriptionTier);
}

/**
 * Reads the current authenticated user's subscription projection.
 *
 * Identity is intentionally NOT supplied through query parameters. The server resolves the user
 * exclusively from the Bearer token that authFetch obtains from the live Supabase SDK session.
 * authFetch also owns the single refresh/retry boundary for OAuth/MFA token rotation.
 */
export async function readAuthenticatedSubscriptionTier(): Promise<SubscriptionTier | null> {
  const response = await authFetch('/api/stripe/user-subscription');
  if (!response.ok) return null;

  const body = await response.json();
  return isSubscriptionTier(body?.subscriptionTier) ? body.subscriptionTier : null;
}

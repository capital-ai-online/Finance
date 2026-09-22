export type SubscriptionTier = 'Free' | 'Starter' | 'Pro' | 'Enterprise';

export interface UserSession {
  type: 'guest' | 'registered';
  name: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  /**
   * Verified Supabase subject projected by the backend session endpoint.
   * Authentication tokens are intentionally never exposed on this browser model.
   */
  id?: string;
}

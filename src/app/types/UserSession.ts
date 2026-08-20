export type SubscriptionTier = 'Free' | 'Starter' | 'Pro' | 'Enterprise';

export interface UserSession {
  type: 'guest' | 'registered';
  name: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  accessToken?: string;
  id?: string;
}

export type SubscriptionTier = 'Free' | 'Starter' | 'Pro' | 'Enterprise';

export interface UserSession {
  type: 'guest' | 'registered';
  name: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  // SECURITY (2026-08-25 architecture review, finding #2): the Supabase access token used to be
  // duplicated onto this object and persisted verbatim into localStorage['mcc_user_session'] even
  // though nothing in the frontend actually reads UserSession.accessToken - every authenticated
  // fetch goes through authFetch(), which derives a fresh token straight from the Supabase SDK
  // session instead. That redundant plaintext copy only widened the blast radius of any XSS (a
  // second, needless place to steal a live bearer token from). The field is kept optional here for
  // backward-compatible typing, but SessionComposition.tsx no longer populates or persists it.
  accessToken?: string;
  id?: string;
}

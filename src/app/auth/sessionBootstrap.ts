import { isPasswordRecoveryLocation } from '../../features/public/auth/passwordRecovery';

export interface BootstrapSessionLike {
  expires_at?: number | null;
  user?: {
    id?: string | null;
    is_anonymous?: boolean | null;
  } | null;
}

/**
 * Supabase emits INITIAL_SESSION when an auth listener is registered and SIGNED_IN for a new
 * primary authentication. Session establishment is intentionally limited to those events so a
 * token refresh or MFA verification cannot restart the onboarding/AAL flow that is already active.
 * A password-recovery session is additionally held on the public login shell until the recovery
 * flow replaces the password and explicitly signs that temporary session out.
 *
 * Dependency direction is app -> feature: the public feature owns its recovery URL contract and
 * application composition consumes that state. Public feature code must never import src/app.
 */
export function isSessionEstablishmentEvent(event: string): boolean {
  if (
    (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') &&
    isPasswordRecoveryLocation()
  ) {
    return false;
  }

  return event === 'INITIAL_SESSION' || event === 'SIGNED_IN';
}

/**
 * Non-secret in-memory deduplication key for auth bootstrap. Access/refresh tokens are never used
 * in the key, logged or persisted by this helper.
 */
export function getSessionBootstrapKey(session: BootstrapSessionLike | null | undefined): string {
  const userId = session?.user?.id?.trim();
  if (!userId || session?.user?.is_anonymous) return '';
  const expiresAt = Number.isFinite(session?.expires_at) ? String(session?.expires_at) : 'no-expiry';
  return `${userId}:${expiresAt}`;
}

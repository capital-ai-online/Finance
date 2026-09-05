export interface BootstrapSessionLike {
  expires_at?: number | null;
  user?: {
    id?: string | null;
    is_anonymous?: boolean | null;
  } | null;
}

export interface BootstrapLocationLike {
  pathname?: string | null;
  search?: string | null;
}

export const PASSWORD_RECOVERY_QUERY_PARAM = 'password-recovery';

/**
 * Password-recovery links create a temporary Supabase Auth session so the user can call
 * updateUser({ password }). That session is intentionally confined to the public /login shell and
 * must not enter the normal onboarding/AAL bootstrap before the password has been replaced.
 */
export function isPasswordRecoveryLocation(
  locationLike?: BootstrapLocationLike | null,
): boolean {
  const location =
    locationLike ??
    (typeof window !== 'undefined'
      ? { pathname: window.location.pathname, search: window.location.search }
      : null);

  if (!location) return false;
  const pathname = String(location.pathname || '').replace(/\/+$/, '') || '/';
  if (pathname !== '/login') return false;

  const params = new URLSearchParams(String(location.search || ''));
  return params.get(PASSWORD_RECOVERY_QUERY_PARAM) === '1';
}

/**
 * Supabase emits INITIAL_SESSION when an auth listener is registered and SIGNED_IN for a new
 * primary authentication. Session establishment is intentionally limited to those events so a
 * token refresh or MFA verification cannot restart the onboarding/AAL flow that is already active.
 * A password-recovery session is additionally held on the public login shell until the recovery
 * flow replaces the password and explicitly signs that temporary session out.
 */
export function isSessionEstablishmentEvent(
  event: string,
  locationLike?: BootstrapLocationLike | null,
): boolean {
  if (
    (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') &&
    isPasswordRecoveryLocation(locationLike)
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

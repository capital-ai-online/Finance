export interface PasswordRecoveryLocationLike {
  pathname?: string | null;
  search?: string | null;
}

export const PASSWORD_RECOVERY_QUERY_PARAM = 'password-recovery';

/**
 * Public password-recovery URL contract. Keeping this contract inside the public feature prevents
 * feature code from depending on the application-composition layer while still allowing app/auth
 * to consume the public recovery state when deciding whether a Supabase session may bootstrap.
 */
export function isPasswordRecoveryLocation(
  locationLike?: PasswordRecoveryLocationLike | null,
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

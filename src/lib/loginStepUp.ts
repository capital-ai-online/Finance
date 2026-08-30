const MARKER_PREFIX = 'capitalai:loginStepUp:v1:';

function markerKey(userId: string): string {
  return `${MARKER_PREFIX}${userId}`;
}

/**
 * Compatibility-only tab marker for the canonical native Supabase AAL gate.
 *
 * SECURITY: This module no longer determines whether MFA/AAL step-up is required. That authority
 * lives exclusively in `LoginStepUpGate`, which reads the Supabase-native assurance state and
 * fails closed on lookup errors/timeouts. Keeping a second passkey/profile decision path here
 * would reintroduce an ambiguous, historically fail-open authentication authority.
 */
export function hasPassedLoginStepUpThisTab(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(markerKey(userId)) === '1';
  } catch {
    // sessionStorage may be unavailable in strict privacy modes. In that case the canonical gate
    // must run again instead of relying on an unverifiable local marker.
    return false;
  }
}

/** Marks a successfully verified canonical Supabase AAL step-up for this browser tab. */
export function markLoginStepUpPassed(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(markerKey(userId), '1');
  } catch {
    // No bypass: inability to persist only causes the canonical gate to run again later.
  }
}

/** Removes all tab-local step-up markers, for example during logout. */
export function clearLoginStepUpMarkers(): void {
  if (typeof window === 'undefined') return;
  try {
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(MARKER_PREFIX)) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    // No bypass: an unreadable marker store is treated as not verified by the reader above.
  }
}

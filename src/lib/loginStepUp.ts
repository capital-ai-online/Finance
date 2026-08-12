// Login-Step-Up für registrierte Sicherheitsfaktoren.
//
// M5A (ESS-0020 / ADR-0064): Supabase Native MFA/AAL ist die authoritative
// TOTP-Assurance. Ein historischer profiles.totp_enabled-Wert oder ein
// CAPITAL-AI-eigener Step-Up-Token darf keinen AAL2-Zustand simulieren.

import { supabase } from '../supabaseClient';

export type LoginStepUpRequirement = 'none' | 'passkey' | 'totp';

const MARKER_PREFIX = 'capitalai:loginStepUp:v2:';

function markerKey(userId: string): string {
  return `${MARKER_PREFIX}${userId}`;
}

/** True, wenn dieser Browser-Tab den Login-Step-Up für diesen Nutzer bereits erfolgreich durchlaufen hat. */
export function hasPassedLoginStepUpThisTab(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(markerKey(userId)) === '1';
  } catch {
    return false;
  }
}

/** Markiert den Login-Step-Up für diesen Tab als erledigt. */
export function markLoginStepUpPassed(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(markerKey(userId), '1');
  } catch {
    // Kein Security-Bypass: ohne Marker wird beim nächsten Aufruf erneut geprüft.
  }
}

/** Entfernt alle Login-Step-Up-Marker dieses Tabs (z. B. beim Logout). */
export function clearLoginStepUpMarkers(): void {
  if (typeof window === 'undefined') return;
  try {
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith('capitalai:loginStepUp:')) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Kein Blocker.
  }
}

/**
 * Ermittelt den noch erforderlichen Login-Schritt anhand der serverseitig
 * signierten Supabase-Session und der Native-MFA-Faktoren.
 *
 * M5A-Regeln:
 * - aal2/aal2: Native MFA ist erfüllt.
 * - aal1/aal2: ein verifizierter zweiter Faktor existiert; Challenge erforderlich.
 * - AAL-/Faktor-Lookup-Fehler degradieren nicht zu "none", wenn der MFA-Status
 *   nicht sicher bestimmt werden kann.
 * - Passkeys bleiben zusätzliche Authentisierung, ersetzen aber Native TOTP/AAL2
 *   nicht, sobald Supabase für die Session aal2 als nächstes Level ausweist.
 */
export async function loginStepUpRequirement(session: { user: any }): Promise<LoginStepUpRequirement> {
  const user = session?.user;
  if (!user || user.is_anonymous) return 'none';
  if (hasPassedLoginStepUpThisTab(user.id)) return 'none';

  if (!supabase) return 'totp';

  try {
    const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) throw aalError;

    if (aal?.currentLevel === 'aal2' && aal?.nextLevel === 'aal2') {
      return 'none';
    }

    if (aal?.nextLevel === 'aal2') {
      return 'totp';
    }

    const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();
    if (factorError) throw factorError;

    const hasVerifiedTotp = (factors?.totp ?? []).some((factor) => factor.status === 'verified');
    if (hasVerifiedTotp) return 'totp';
  } catch (err) {
    console.error('[LoginStepUp] Native MFA/AAL konnte nicht verifiziert werden; Step-Up bleibt fail-closed:', err);
    return 'totp';
  }

  try {
    const { data: passkeys, error: passkeyError } = await supabase.auth.passkey.list();
    if (passkeyError) throw passkeyError;
    if ((passkeys ?? []).length > 0) return 'passkey';
  } catch (err) {
    console.error('[LoginStepUp] Passkey-Liste konnte nicht geladen werden:', err);
  }

  return 'none';
}

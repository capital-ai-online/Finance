// Login-Step-Up: erzwingt registrierte Passkeys/2FA tatsächlich beim Login (nicht nur bei der
// Aktivierung in den Profil-Einstellungen). Bewusst getrennt von src/lib/stepUp.ts (das dortige
// verifyStepUp() wird hier für den TOTP-Fall unverändert wiederverwendet) und von
// src/App.tsx (das diese Prüfung an allen Stellen einhängt, an denen heute Dashboard-Zugriff
// gewährt wird - siehe dortige Kommentare).
//
// Priorität: ist ein Passkey registriert, genügt dessen Bestätigung allein ('passkey'); erst
// wenn kein Passkey registriert ist, aber 2FA aktiv ist, wird der TOTP-Schritt verlangt ('totp').
// Sind beide inaktiv, ändert sich nichts am bisherigen Verhalten ('none').

import { supabase } from '../supabaseClient';

export type LoginStepUpRequirement = 'none' | 'passkey' | 'totp';

const MARKER_PREFIX = 'capitalai:loginStepUp:v1:';

function markerKey(userId: string): string {
  return `${MARKER_PREFIX}${userId}`;
}

/** True, wenn dieser Browser-Tab den Login-Step-Up für diesen Nutzer bereits erfolgreich durchlaufen hat. */
export function hasPassedLoginStepUpThisTab(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(markerKey(userId)) === '1';
  } catch {
    // sessionStorage kann in seltenen Fällen (z.B. strikter Privacy-Modus) nicht verfügbar sein -
    // dann wird bei jedem Aufruf neu geprüft, statt hart zu scheitern.
    return false;
  }
}

/** Markiert den Login-Step-Up für diesen Tab als erledigt - auch wenn keine Faktoren aktiv sind ('none'),
 * damit Nutzer ohne Passkey/2FA nicht bei jedem Reload erneut die profiles-/passkey-Abfrage auslösen. */
export function markLoginStepUpPassed(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(markerKey(userId), '1');
  } catch {
    // Kein Blocker: schlimmstenfalls wird beim nächsten Aufruf erneut geprüft.
  }
}

/** Entfernt alle Login-Step-Up-Marker dieses Tabs (z.B. beim Logout). */
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
    // Kein Blocker.
  }
}

/**
 * Ermittelt, ob für die gegebene Session noch ein Login-Step-Up-Faktor fehlt.
 * Fail-open bei DB-/Netzwerkfehlern (wie 'none' behandelt, aber geloggt) - ein Ausfall des
 * profiles-Reads darf nicht jeden Nutzer aus der App aussperren.
 */
export async function loginStepUpRequirement(session: { user: any }): Promise<LoginStepUpRequirement> {
  const user = session?.user;
  if (!user || user.is_anonymous) return 'none';
  if (hasPassedLoginStepUpThisTab(user.id)) return 'none';

  if (!supabase) return 'none';

  try {
    const { data: passkeys, error: passkeyError } = await supabase.auth.passkey.list();
    if (passkeyError) throw passkeyError;
    if ((passkeys ?? []).length > 0) return 'passkey';
  } catch (err) {
    console.error('[LoginStepUp] Passkey-Liste konnte nicht geladen werden, fahre mit 2FA-Prüfung fort:', err);
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('totp_enabled')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw error;
    return data?.totp_enabled ? 'totp' : 'none';
  } catch (err) {
    console.error('[LoginStepUp] 2FA-Status konnte nicht geladen werden, lasse Login ohne Step-Up zu:', err);
    return 'none';
  }
}

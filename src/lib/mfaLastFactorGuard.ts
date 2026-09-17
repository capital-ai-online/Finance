// Owner-Folgeanfrage 2026-08-14: verhindert, dass ein Konto, das per verpflichtendem Onboarding
// (RegistrationCompletionGate) zu mindestens einem MFA-Faktor verpflichtet wurde, diesen sofort
// danach wieder entfernt und die Pflicht damit wirkungslos macht. Prueft NUR fuer Konten mit
// profiles.mfa_required_account = true (per POST /api/auth/mfa/enrollment-complete gesetzt,
// server/stepUp.ts) - Bestandskonten ohne diese Verpflichtung bleiben frei, ihren letzten Faktor
// zu entfernen, wie bisher.
//
// Bewusst client-seitig (kein Server-Proxy fuer supabase.auth.mfa.unenroll()/passkey.delete()):
// das ist eine Selbstschutz-/UX-Sicherung gegen versehentliches Aussperren, keine
// Verteidigung gegen einen Angreifer - ein technisch versierter Nutzer koennte diese Pruefung
// durch einen direkten API-Aufruf umgehen. Das ist eine bewusst akzeptierte Grenze.

import type { SupabaseClient } from '@supabase/supabase-js';
import { listVerifiedTotpFactors } from '../platform/Security/nativeMfa';

export interface RemovalGuardResult {
  allowed: boolean;
  reason?: string;
}

/**
 * kind: der Faktor-Typ, der gerade entfernt werden soll ('native' oder 'passkey') - wird von der
 * Gesamtzahl ausgeschlossen, um zu pruefen, ob danach noch mindestens ein Faktor uebrig bleibt.
 */
export async function canRemoveLastFactor(
  supabase: SupabaseClient,
  userId: string,
  kind: 'native' | 'passkey',
): Promise<RemovalGuardResult> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('mfa_required_account, totp_enabled')
    .eq('id', userId)
    .maybeSingle();
  if (profileError || !profile?.mfa_required_account) {
    // Kein verpflichtetes Konto (oder Status nicht ladbar) - keine Einschraenkung.
    return { allowed: true };
  }

  let nativeCount = 0;
  let passkeyCount = 0;
  try {
    const factors = await listVerifiedTotpFactors(supabase);
    nativeCount = factors.length;
  } catch {
    // Fail-open beim Zaehlen: ein Ladefehler blockiert keine Aktion, die sonst erlaubt waere.
  }
  try {
    const { data: passkeys } = await supabase.auth.passkey.list();
    passkeyCount = (passkeys ?? []).length;
  } catch {
    // s.o.
  }
  const legacyTotp = profile.totp_enabled ? 1 : 0;

  const remainingAfterRemoval =
    (kind === 'native' ? Math.max(0, nativeCount - 1) : nativeCount) +
    (kind === 'passkey' ? Math.max(0, passkeyCount - 1) : passkeyCount) +
    legacyTotp;

  if (remainingAfterRemoval < 1) {
    return {
      allowed: false,
      reason:
        'Dies ist dein letzter verbleibender 2FA-/Passkey-Faktor. Da für dieses Konto mindestens ' +
        'ein Faktor Pflicht ist, richte zuerst einen weiteren Faktor ein, bevor du diesen entfernst.',
    };
  }
  return { allowed: true };
}

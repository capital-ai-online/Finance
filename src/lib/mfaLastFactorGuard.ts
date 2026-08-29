// Owner-Folgeanfrage 2026-08-14: verhindert, dass ein Konto, das per verpflichtendem Onboarding
// (RegistrationCompletionGate) zu mindestens einem MFA-Faktor verpflichtet wurde, diesen sofort
// danach wieder entfernt und die Pflicht damit wirkungslos macht. Prueft NUR fuer Konten mit
// profiles.mfa_required_account = true (per POST /api/auth/mfa/enrollment-complete gesetzt,
// server/stepUp.ts) - Bestandskonten ohne diese Verpflichtung bleiben frei, ihren letzten Faktor
// zu entfernen, wie bisher.
//
// Primaerlogin-Passkeys (`auth.registerPasskey`) zaehlen bewusst NICHT als MFA/AAL2-Faktor. Fuer
// diese Schutzinvariante werden nur verifizierte native Supabase-MFA-Faktoren (TOTP/WebAuthn) und
// der verbleibende Legacy-TOTP-Status beruecksichtigt.
//
// Bewusst client-seitig (kein Server-Proxy fuer supabase.auth.mfa.unenroll()): das ist eine
// Selbstschutz-/UX-Sicherung gegen versehentliches Aussperren, keine Verteidigung gegen einen
// Angreifer - ein technisch versierter Nutzer koennte diese Pruefung durch einen direkten API-
// Aufruf umgehen. Das ist eine bewusst akzeptierte Grenze.

import type { SupabaseClient } from '@supabase/supabase-js';
import { listVerifiedNativeMfaFactors } from '../platform/Security/nativeMfa';

export interface RemovalGuardResult {
  allowed: boolean;
  reason?: string;
}

/**
 * `native` bezeichnet einen echten Supabase-MFA-Faktor. `passkey` bleibt aus
 * Rueckwaertskompatibilitaet fuer alte Aufrufer erhalten, zaehlt aber selbst nicht als AAL2-
 * Schutz. Damit kann ein Primaerlogin-Passkey nie das Entfernen des letzten echten MFA-Faktors
 * legitimieren.
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
    return { allowed: true };
  }

  let nativeCount = 0;
  try {
    const factors = await listVerifiedNativeMfaFactors(supabase);
    nativeCount = factors.length;
  } catch {
    // Bestehendes UX-Verhalten: ein reiner Client-Zaehler ist keine serverseitige Authority.
  }

  const legacyTotp = profile.totp_enabled ? 1 : 0;
  const remainingAfterRemoval =
    (kind === 'native' ? Math.max(0, nativeCount - 1) : nativeCount) + legacyTotp;

  if (remainingAfterRemoval < 1) {
    return {
      allowed: false,
      reason:
        'Dies ist dein letzter verifizierter MFA-Faktor. Da für dieses Konto mindestens ein ' +
        'AAL2-Faktor Pflicht ist, richte zuerst einen weiteren MFA-Faktor ein, bevor du diesen entfernst.',
    };
  }

  return { allowed: true };
}

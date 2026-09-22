// Owner-Policy 2026-08-14: neue Registrierungen muessen vor dem ersten Dashboard-Zugriff
// (a) DSGVO-Zustimmungen + Land/Telefon abgeben und (b) mindestens einen MFA-Faktor
// (natives TOTP oder Passkey) einrichten. Bestehende Konten (profiles.onboarding_required
// wurde bei der einfuehrenden Migration auf false zurueckgesetzt) sind davon unberuehrt -
// "Uebergangsfrist"-Modell, kein rueckwirkendes Aussperren.
//
// profiles.mfa_required_account ist die kanonische accountbezogene Login-MFA-Policy.
// Ein optional registrierter Faktor allein darf daher nicht den normalen Landing-/Abo-Login
// global auf AAL2 anheben. Privilegierte Owner/Admin-Aktionen bleiben davon unberuehrt und
// erzwingen AAL2 weiterhin serverseitig ueber requireVerifiedAal2().
//
// Beide Flags werden in EINEM Profil-Read gelesen, damit die Auth-Komposition keinen zweiten
// seriellen Profil-Roundtrip einfuehrt.

import { supabase } from '../supabaseClient';

export interface AuthGatePolicy {
  onboardingRequired: boolean;
  mfaRequiredAccount: boolean;
}

export async function readAuthGatePolicy(
  session: { user: any },
): Promise<AuthGatePolicy> {
  const user = session?.user;
  if (!user || user.is_anonymous) {
    return { onboardingRequired: false, mfaRequiredAccount: false };
  }

  if (!supabase) {
    throw new Error('[Onboarding] Supabase ist nicht verfuegbar; Auth-Gate-Policy nicht verifizierbar.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_required, mfa_required_account')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error('[Onboarding] Auth-Gate-Policy konnte nicht geladen werden.', { cause: error });
  }

  if (!data) {
    throw new Error('[Onboarding] Profil fehlt; Auth-Gate-Policy nicht verifizierbar.');
  }

  return {
    onboardingRequired: data.onboarding_required === true,
    mfaRequiredAccount: data.mfa_required_account === true,
  };
}

export async function needsOnboarding(session: { user: any }): Promise<boolean> {
  return (await readAuthGatePolicy(session)).onboardingRequired;
}

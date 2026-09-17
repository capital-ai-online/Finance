// Owner-Policy 2026-08-14: neue Registrierungen muessen vor dem ersten Dashboard-Zugriff
// (a) DSGVO-Zustimmungen + Land/Telefon abgeben und (b) mindestens einen MFA-Faktor
// (natives TOTP oder Passkey) einrichten. Bestehende Konten (profiles.onboarding_required
// wurde bei der einfuehrenden Migration auf false zurueckgesetzt) sind davon unberuehrt -
// "Uebergangsfrist"-Modell, kein rueckwirkendes Aussperren.
//
// Bewusst getrennt von src/lib/loginStepUp.ts: onboarding_required entscheidet, ob
// RegistrationCompletionGate (dieser Zustand) statt des regulaeren LoginStepUpGate gezeigt
// wird - ein Konto mit onboarding_required=true hat definitionsgemaess noch keinen Faktor,
// LoginStepUpGate haette dafuer ohnehin nichts zu pruefen.

import { supabase } from '../supabaseClient';

export async function needsOnboarding(session: { user: any }): Promise<boolean> {
  const user = session?.user;
  if (!user || user.is_anonymous) return false;
  if (!supabase) return false;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_required')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw error;
    return data?.onboarding_required === true;
  } catch (err) {
    // Fail-open wie loginStepUpRequirement(): ein Ausfall des profiles-Reads darf keinen
    // Nutzer aus der App aussperren.
    console.error('[Onboarding] Status konnte nicht geladen werden, ueberspringe Onboarding-Gate:', err);
    return false;
  }
}

// Owner-Policy 2026-08-14: neue Registrierungen muessen vor dem ersten Dashboard-Zugriff
// ihre Profil-/Consent-Daten vervollstaendigen.
//
// Temporäre Owner-Diagnose-Supersession 2026-09-22:
// profiles.mfa_required_account bleibt die accountbezogene Login-MFA-Policy. Ein vorhandener
// optionaler Faktor allein darf nicht automatisch den normalen Website-Login auf AAL2 anheben.
// Onboarding- und MFA-Policy werden in einem Profil-Read aufgeloest.

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
    throw new Error(
      '[Onboarding] Supabase ist nicht verfuegbar; Onboarding-Status nicht verifizierbar.',
    );
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_required, mfa_required_account')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(
      '[Onboarding] Status konnte nicht geladen werden. Auth-Gate-Policy nicht verifizierbar.',
      { cause: error },
    );
  }

  if (!data) {
    throw new Error(
      '[Onboarding] Profil fehlt; Onboarding-Status nicht verifizierbar. Auth-Gate-Policy nicht verifizierbar.',
    );
  }

  return {
    onboardingRequired: data.onboarding_required === true,
    mfaRequiredAccount: data.mfa_required_account === true,
  };
}

export async function needsOnboarding(session: { user: any }): Promise<boolean> {
  return (await readAuthGatePolicy(session)).onboardingRequired;
}

// ADR-0064 / ESS-0020 — Supabase Native MFA (TOTP + WebAuthn).
//
// Dünner, testbarer Wrapper um `supabase.auth.mfa.*`. Der Supabase-Client wird bewusst als
// Parameter injiziert statt fest importiert, damit Tests ohne echten Browser/echte Supabase-
// Verbindung laufen (Mock-Client) und damit dieselben Funktionen sowohl für die Erstregistrierung
// als auch für den Login-Challenge-Pfad wiederverwendbar sind.
//
// WICHTIG: Das Ergebnis dieser Funktionen (insbesondere `currentLevel`/`aal`) ist ausschließlich
// eine UI-Komfortinformation. Es ist NIEMALS eine Autorisierungsentscheidung. Jede privilegierte
// Server-Aktion muss den AAL-Status unabhängig über `requireVerifiedAal2()`
// (server-seitig, authMiddleware.ts) anhand des Bearer-Tokens neu ermitteln - siehe ADR-0064
// Punkt 2: "No browser-only control may substitute for server enforcement."

import type { SupabaseClient } from '@supabase/supabase-js';

export class NativeMfaError extends Error {}

export interface NativeMfaEnrollment {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

export interface NativeMfaAssuranceLevel {
  currentLevel: string | null;
  nextLevel: string | null;
}

export type NativeMfaFactorType = 'totp' | 'webauthn';

export interface NativeMfaFactor {
  id: string;
  friendlyName?: string;
  factorType: NativeMfaFactorType;
}

function messageOf(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return (error as any).message;
  }
  return fallback;
}

/**
 * Startet die Registrierung eines neuen nativen TOTP-Faktors. Der Faktor ist danach `unverified`
 * und erlaubt keine privilegierte Aktion, bis `verifyTotpChallenge()` erfolgreich war.
 */
export async function enrollTotpFactor(
  client: SupabaseClient,
  friendlyName?: string,
): Promise<NativeMfaEnrollment> {
  const { data, error } = await client.auth.mfa.enroll({
    factorType: 'totp',
    ...(friendlyName ? { friendlyName } : {}),
  });
  if (error || !data) {
    throw new NativeMfaError(messageOf(error, 'Native MFA-Registrierung fehlgeschlagen.'));
  }
  if (data.type !== 'totp' || !data.totp) {
    throw new NativeMfaError('Unerwarteter Faktortyp bei der Registrierung.');
  }
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

/** Erzeugt eine neue Challenge für einen bestehenden (registrierten oder verifizierten) Faktor. */
export async function challengeTotpFactor(client: SupabaseClient, factorId: string): Promise<string> {
  if (!factorId) throw new NativeMfaError('factorId fehlt.');
  const { data, error } = await client.auth.mfa.challenge({ factorId });
  if (error || !data?.id) {
    throw new NativeMfaError(messageOf(error, 'Challenge konnte nicht erstellt werden.'));
  }
  return data.id;
}

/**
 * Verifiziert einen 6-stelligen TOTP-Code gegen eine bestehende Challenge. Bei Erfolg hebt
 * Supabase die aktuelle Client-Session selbst auf `aal2`. Diese Funktion bestätigt das zusätzlich
 * lokal, bevor sie Erfolg meldet.
 */
export async function verifyTotpChallenge(
  client: SupabaseClient,
  factorId: string,
  challengeId: string,
  code: string,
): Promise<NativeMfaAssuranceLevel> {
  if (!/^\d{6}$/.test(code)) {
    throw new NativeMfaError('Code muss aus genau 6 Ziffern bestehen.');
  }
  const { data, error } = await client.auth.mfa.verify({ factorId, challengeId, code });
  if (error || !data) {
    throw new NativeMfaError(messageOf(error, 'Code ungültig oder Challenge abgelaufen.'));
  }
  return requireCurrentAal2(client, 'Verifikation hat keine gültige AAL2-Sitzung erzeugt.');
}

/**
 * Registriert und verifiziert einen echten Supabase-WebAuthn-MFA-Faktor. Das ist bewusst NICHT
 * `auth.registerPasskey()`: jener Passkey gehört zum Primärlogin und erfüllt allein nicht den
 * serverseitigen AAL2-Vertrag des MFA-Onboardings.
 */
export async function registerWebauthnMfaFactor(
  client: SupabaseClient,
  friendlyName: string,
): Promise<NativeMfaAssuranceLevel> {
  const { data, error } = await client.auth.mfa.webauthn.register({ friendlyName });
  if (error || !data) {
    throw new NativeMfaError(messageOf(error, 'WebAuthn-MFA-Registrierung fehlgeschlagen.'));
  }
  return requireCurrentAal2(
    client,
    'WebAuthn-MFA-Registrierung hat keine gültige AAL2-Sitzung erzeugt.',
  );
}

/**
 * Verifiziert einen bereits registrierten Supabase-WebAuthn-MFA-Faktor und bestätigt danach
 * explizit, dass die laufende Session wirklich AAL2 erreicht hat.
 */
export async function authenticateWebauthnMfaFactor(
  client: SupabaseClient,
  factorId: string,
): Promise<NativeMfaAssuranceLevel> {
  if (!factorId) throw new NativeMfaError('factorId fehlt.');
  const { data, error } = await client.auth.mfa.webauthn.authenticate({ factorId });
  if (error || !data) {
    throw new NativeMfaError(messageOf(error, 'WebAuthn-MFA-Verifikation fehlgeschlagen.'));
  }
  return requireCurrentAal2(
    client,
    'WebAuthn-MFA-Verifikation hat keine gültige AAL2-Sitzung erzeugt.',
  );
}

/**
 * Liest den aktuellen Authenticator Assurance Level der laufenden Browser-Session. Ohne
 * Parameter nutzt der Supabase-Client die lokal gespeicherte Session (kein Netzwerk-Roundtrip
 * im Normalfall). Nur für UI-Zwecke - siehe Modul-Kommentar oben.
 */
export async function getCurrentAssuranceLevel(client: SupabaseClient): Promise<NativeMfaAssuranceLevel> {
  const { data, error } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) {
    throw new NativeMfaError(messageOf(error, 'AAL-Status konnte nicht ermittelt werden.'));
  }
  return { currentLevel: data.currentLevel, nextLevel: data.nextLevel };
}

async function requireCurrentAal2(
  client: SupabaseClient,
  failureMessage: string,
): Promise<NativeMfaAssuranceLevel> {
  const level = await getCurrentAssuranceLevel(client);
  if (level.currentLevel !== 'aal2') {
    throw new NativeMfaError(failureMessage);
  }
  return level;
}

/** Listet verifizierte native TOTP- und WebAuthn-MFA-Faktoren der aktuellen Session. */
export async function listVerifiedNativeMfaFactors(client: SupabaseClient): Promise<NativeMfaFactor[]> {
  const { data, error } = await client.auth.mfa.listFactors();
  if (error || !data) {
    throw new NativeMfaError(messageOf(error, 'Faktorenliste konnte nicht geladen werden.'));
  }

  return data.all
    .filter(
      (factor) =>
        factor.status === 'verified' &&
        (factor.factor_type === 'totp' || factor.factor_type === 'webauthn'),
    )
    .map((factor) => ({
      id: factor.id,
      friendlyName: factor.friendly_name,
      factorType: factor.factor_type as NativeMfaFactorType,
    }));
}

/** Listet die verifizierten nativen TOTP-Faktoren der aktuellen Session. */
export async function listVerifiedTotpFactors(client: SupabaseClient): Promise<NativeMfaFactor[]> {
  const factors = await listVerifiedNativeMfaFactors(client);
  return factors.filter((factor) => factor.factorType === 'totp');
}

/**
 * Entfernt einen nativen Faktor. Owner-Aufruf ausschließlich clientseitig auf den eigenen
 * Faktor der aktuellen Session (Self-Service-Reset). Ein serverseitiger, Owner-kontrollierter
 * Recovery-Pfad für Fremdzurücksetzung ist nicht Teil dieses Work-Packages.
 */
export async function unenrollTotpFactor(client: SupabaseClient, factorId: string): Promise<void> {
  if (!factorId) throw new NativeMfaError('factorId fehlt.');
  const { error } = await client.auth.mfa.unenroll({ factorId });
  if (error) {
    throw new NativeMfaError(messageOf(error, 'Faktor konnte nicht entfernt werden.'));
  }
}

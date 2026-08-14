-- Korrektur der vorherigen Migration (20260814153000), noch bevor irgendein Zeilenwert
-- inhaltlich relevant geworden ist: die Spalte gate't nicht nur die MFA-Einrichtung, sondern die
-- gesamte neue Pflicht-Onboarding-Sequenz fuer neue Registrierungen (Schritt 1: Consent/Land/
-- Telefon ueber /api/auth/register/complete, Schritt 2: TOTP/Passkey ueber
-- /api/auth/mfa/enrollment-complete). "mfa_enrollment_required" waere daher irrefuehrend eng
-- benannt gewesen.
ALTER TABLE public.profiles
  RENAME COLUMN mfa_enrollment_required TO onboarding_required;
